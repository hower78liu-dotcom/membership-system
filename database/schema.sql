-- Enable necessary extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- 1. Profiles Table (Extends auth.users)
-- 存储用户基本信息和会员状态
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  phone text unique,
  email text,
  nickname text,
  avatar_url text,
  gender text check (gender in ('male', 'female', 'other', 'unknown')),
  birthday date,
  role text default 'member' check (role in ('admin', 'member')),
  
  -- Membership Status
  current_tier_id uuid references membership_tiers(id), -- references membership_tiers
  current_points bigint default 0, -- 当前可用积分
  total_growth_value bigint default 0, -- 累计成长值 (用于定级)
  balance decimal(12, 2) default 0.00, -- 储值余额
  
  is_active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- RLS Policies for Profiles
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone"
  on profiles for select
  using ( true );

create policy "Users can update own profile"
  on profiles for update
  using ( auth.uid() = id );

-- 2. Membership Tiers (等级配置)
create table public.membership_tiers (
  id uuid default uuid_generate_v4() primary key,
  name text not null, -- e.g., 'Silver', 'Gold', 'Platinum'
  level int not null unique, -- 1, 2, 3
  required_growth_value int not null, -- 升级所需成长值
  discount_rate decimal(4, 2) default 1.00, -- 0.95 = 95折
  points_ratio decimal(4, 2) default 1.0, -- 积分获取倍率
  benefits jsonb default '{}'::jsonb, -- 额外权益描述
  created_at timestamptz default now()
);

-- 3. Points Ledger (积分流水)
-- 核心表：记录每一笔积分变动
create table public.points_ledger (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  amount int not null, -- 正数表示获取，负数表示消耗
  type text not null check (type in ('purchase', 'activity', 'refund', 'manual_adjust', 'exchange', 'expire')),
  source_id text, -- 关联的订单ID或活动ID
  description text,
  expired_at timestamptz, -- 该笔积分过期时间 (仅对获取有效)
  created_at timestamptz default now()
);

alter table public.points_ledger enable row level security;
create policy "Users can view own points history"
  on points_ledger for select
  using ( auth.uid() = user_id );

-- 4. Marketing - Coupons (优惠券模板)
create table public.coupons (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null check (type in ('discount', 'amount_off', 'exchange')),
  value decimal(10, 2), -- 面值 (e.g. 10.00 for amount_off, 0.85 for discount)
  min_spend decimal(10, 2) default 0, -- 最低消费门槛
  total_quantity int, -- 发行总量
  remaining_quantity int, -- 剩余数量
  start_time timestamptz,
  end_time timestamptz,
  is_active boolean default true,
  created_at timestamptz default now()
);

-- 5. User Coupons (用户领取的优惠券)
create table public.user_coupons (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references public.profiles(id) not null,
  coupon_id uuid references public.coupons(id) not null,
  status text default 'unused' check (status in ('unused', 'used', 'expired')),
  used_at timestamptz,
  order_id text, -- 使用该券的订单ID
  obtained_at timestamptz default now(),
  expires_at timestamptz not null
);

alter table public.user_coupons enable row level security;
create policy "Users can view own coupons"
  on user_coupons for select
  using ( auth.uid() = user_id );

-- 6. Orders (订单表 - 简化版)
create table public.orders (
  id text primary key, -- 业务订单号
  user_id uuid references public.profiles(id) not null,
  total_amount decimal(12, 2) not null,
  pay_amount decimal(12, 2) not null,
  discount_amount decimal(12, 2) default 0,
  
  status text not null check (status in ('pending', 'paid', 'shipped', 'completed', 'cancelled', 'refunded')),
  payment_method text check (payment_method in ('wechat', 'alipay', 'balance')),
  transaction_id text, -- 第三方支付流水号
  
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.orders enable row level security;
create policy "Users can view own orders"
  on orders for select
  using ( auth.uid() = user_id );

-- Function: Auto-update updated_at timestamp
create or replace function update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language 'plpgsql';

create trigger update_profiles_updated_at before update on public.profiles
for each row execute procedure update_updated_at_column();

create trigger update_orders_updated_at before update on public.orders
for each row execute procedure update_updated_at_column();

-- Function: Handle New User Registration
-- 当 auth.users 新增用户时，自动创建 profiles 记录
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, phone)
  values (new.id, new.email, new.phone);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
