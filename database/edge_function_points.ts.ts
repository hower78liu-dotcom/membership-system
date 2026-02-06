// Edge Function: calculate-points
// 触发场景: 订单状态变更为 'paid' (通过 Database Webhook 调用)

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
)

export async function calculatePoints(orderId: string, userId: string, payAmount: number) {
  // 1. Get User's current Tier
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('current_tier_id')
    .eq('id', userId)
    .single();
    
  if (profileError) throw profileError;

  // 2. Get Tier Rules
  let ratio = 1.0;
  if (profile.current_tier_id) {
    const { data: tier } = await supabase
      .from('membership_tiers')
      .select('points_ratio')
      .eq('id', profile.current_tier_id)
      .single();
    if (tier) ratio = tier.points_ratio;
  }

  // 3. Calculate Points (Floor value)
  const pointsEarned = Math.floor(payAmount * ratio);

  // 4. Update Points Ledger
  const { error: ledgerError } = await supabase
    .from('points_ledger')
    .insert({
      user_id: userId,
      amount: pointsEarned,
      type: 'purchase',
      source_id: orderId,
      description: `Purchase reward: Order ${orderId}`
    });

  if (ledgerError) throw ledgerError;

  // 5. Update Profile Stats (Atomic increment usually preferred via RPC, simulating here)
  // Ideally call an RPC function: increment_points(user_id, points)
  await supabase.rpc('increment_user_points', { 
    uid: userId, 
    delta_points: pointsEarned,
    delta_growth: Math.floor(payAmount) // Assuming 1 RMB = 1 Growth Value
  });

  return { success: true, points: pointsEarned };
}

/*
-- Database RPC Function (PostgreSQL)
create or replace function increment_user_points(uid uuid, delta_points int, delta_growth int)
returns void as $$
begin
  update profiles
  set current_points = current_points + delta_points,
      total_growth_value = total_growth_value + delta_growth
  where id = uid;
end;
$$ language plpgsql security definer;
*/
