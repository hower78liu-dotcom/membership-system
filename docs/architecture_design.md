# 全渠道会员管理系统架构设计文档

## 1. 系统概述
本系统旨在构建一个基于 Supabase 的现代化、高性能会员管理平台，支持 Web、iOS、Android 多端接入。特别针对中国市场环境进行了适配（网络加速、本土化登录/支付、合规性）。

## 2. 核心模块设计

### 2.1 用户身份与权限 (IAM)
- **技术选型**: Supabase Auth (GoTrue) + 扩展 Profile 表
- **本土化适配**:
  - **手机号登录**: 集成阿里云/腾讯云 SMS 服务，通过 Edge Function 实现验证码发送与校验。
  - **微信/支付宝一键登录**: 利用 Supabase Auth 的 OIDC 或自定义 OAuth Flow，对接微信开放平台/支付宝开放平台。
- **权限模型**: RBAC (基于角色的访问控制)，区分 `admin`, `staff`, `member`。

### 2.2 会员档案中心 (Member Profile)
- **基础信息**: 昵称、头像、生日、性别、地区。
- **动态属性**: 当前等级、累计积分、账户余额、注册渠道、最后活跃时间。
- **标签画像**: 自动打标 (e.g., "高净值", "沉睡用户") + 手动打标。

### 2.3 等级与权益体系 (Tier & Benefits)
- **等级规则**: 基于成长值 (Growth Value) 自动升级，支持配置不同等级的保级/降级策略。
- **权益配置**: 
  - **折扣**: 全场折扣 / 指定品类折扣。
  - **服务**: 生日双倍积分、专属客服、免邮券。
- **计算引擎**: 每日定时任务 (Cron) 或 实时触发 (Trigger) 更新用户等级。

### 2.4 积分与资产 (Points & Assets)
- **积分账本**: 复式记账思想，记录每一笔积分的获取 (Earn) 与消耗 (Burn)。
- **过期策略**: 支持滚动过期 (e.g., 365天后过期) 或 固定日期过期 (e.g., 次年1月1日清零)。
- **资产安全**: 关键操作 (积分扣减) 需二次验证 (支付密码/短信验证)。

### 2.5 营销活动引擎 (Marketing)
- **优惠券**: 满减券、折扣券、兑换券。支持发放总量控制、每人限领、有效期配置。
- **活动形式**: 签到有礼、消费返利、会员日多倍积分。

### 2.6 支付与订单 (Payment)
- **聚合支付**: 后端对接微信支付 (V3)、支付宝 (Easy SDK)。
- **订单状态机**: Pending -> Paid -> Fulfilled -> Cancelled / Refunded。
- **对账**: 每日自动拉取第三方账单进行核对。

## 3. 技术架构

### 3.1 后端架构 (Serverless)
- **Database**: Supabase (PostgreSQL 15+)
  - 使用 Row Level Security (RLS) 确保数据安全。
  - 使用 Database Webhooks 触发业务逻辑。
- **API Layer**: Supabase Auto-generated REST API + Edge Functions (Deno/Node.js) 处理复杂业务。
- **Storage**: Supabase Storage 存储用户头像、活动海报。

### 3.2 前端架构 (Cross-Platform)
- **方案 A (推荐)**: Flutter 或 React Native (一套代码，三端运行)。
- **方案 B (中国特色)**: UniApp (主要针对微信小程序) + React/Vue (Web/H5) + 原生壳。
- **本方案采用**: 假设使用 **Flutter** 进行全平台构建，确保原生级体验。

### 3.3 中国区部署适配
- **数据库**: 
  - *方案 1 (推荐)*: 使用 Supabase Self-hosted 方案部署在阿里云/腾讯云容器服务 (K8s) 上，确保低延迟和数据合规。
  - *方案 2 (轻量)*: 使用 Supabase Cloud (新加坡节点) + 全球加速 (GA) / CDN 代理。
- **静态资源**: 使用国内 CDN (七牛云/阿里云 OSS) 分发前端资源和图片。
- **API 网关**: 部署 Nginx 反向代理在香港或内地服务器，转发请求到 Supabase。

## 4. 数据库设计摘要 (Schema)

### 核心表结构
1. `profiles`: 用户扩展信息 (1:1 对应 auth.users)
2. `membership_tiers`: 等级配置表
3. `points_ledger`: 积分流水表
4. `coupons`: 优惠券模板
5. `user_coupons`: 用户领取的优惠券实例
6. `orders`: 订单主表

## 5. 安全与合规
- **数据加密**: 敏感字段 (手机号、身份证) 数据库层面加密存储 (pgcrypto)。
- **网络安全**: 全站 HTTPS (TLS 1.2+)。
- **隐私合规**: 首次启动强制弹窗《隐私政策》，用户同意前不初始化 SDK。
- **等保要求**: 日志留存 6 个月以上，关键操作具备审计日志。
