# 中国区部署与运维手册

## 1. 网络连通性与加速方案

Supabase 官方托管服务 (SaaS) 的服务器主要位于 AWS (SG/US/EU)，在中国大陆直接访问 API 可能会遇到延迟高或连接不稳定的问题。

### 方案 A：自托管 (Self-Hosting) - **推荐**
为了完全的数据合规和最佳速度，建议在中国境内的云厂商（阿里云/腾讯云）上自行部署 Supabase 开源版本。

**部署架构**:
- **ECS/CVM**: 至少 4核 8G (运行 Docker Compose)
- **RDS/PostgreSQL**: 建议使用云托管数据库以获得更好的备份和HA能力 (需修改 Supabase 配置文件连接外部 PG)。
- **Kong API Gateway**: Supabase 的入口网关，需绑定已备案的域名。

**Docker Compose 部署步骤**:
1. Clone Supabase 仓库: `git clone https://github.com/supabase/supabase`
2. 进入 `docker` 目录。
3. 修改 `.env` 文件:
   - `POSTGRES_PASSWORD`: 设置强密码
   - `JWT_SECRET`: 生成安全的 JWT 密钥
   - `SITE_URL`: 你的备案域名 (e.g., `https://api.example.com`)
4. 启动: `docker-compose up -d`

### 方案 B：Cloudflare Worker 代理 (中转方案)
如果坚持使用 Supabase SaaS 版本，可以通过 Cloudflare Worker 或 阿里云函数计算 做一层反向代理。

```javascript
// Cloudflare Worker 示例
export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    // 指向 Supabase 新加坡节点
    url.hostname = 'your-project-id.supabase.co';
    const newRequest = new Request(url, request);
    return fetch(newRequest);
  }
}
```
*注意：此方案仍需考虑跨境链路的稳定性，不建议用于高并发核心业务。*

## 2. 身份认证 (Auth) 本土化

### 短信验证码 (SMS)
Supabase Auth 原生支持 Twilio/MessageBird，但在国内不可用。需使用 **Custom SMS Provider** 模式或 **Edge Functions** 拦截。

**实现路径**:
1. 禁用 Supabase 原生 Phone Auth (或仅作为存储)。
2. 创建 Edge Function `send-sms`:
   - 接收前端请求 `{ phone: "+86138..." }`
   - 调用阿里云 SMS API 发送验证码。
   - 将验证码存入 Redis 或 Supabase DB (有效期 5分钟)。
3. 创建 Edge Function `verify-sms`:
   - 验证成功后，使用 Supabase Admin API (`supabase.auth.admin.createUser` 或 `signInWithPhone`) 生成 Access Token 返回给前端。

### 微信/支付宝登录
1. **移动端 (App)**: 使用原生 SDK 获取 `code` / `auth_token`。
2. **后端**: Edge Function 接收 `code`，调用微信/支付宝服务端接口获取 `openid`。
3. **绑定**: 查询 `profiles` 表中是否存在该 `openid`。
   - 存在: 返回 Session。
   - 不存在: 自动注册新用户并绑定。

## 3. 支付集成

**微信支付 (WeChat Pay) V3**:
- 必须在后端 (Edge Function) 生成预支付订单 (Prepay ID) 和 签名。
- 不要将 API 私钥放在前端代码中。
- 支付回调通知 (Webhook) 需验证微信签名。

## 4. 运维与合规 (Compliance)

- **ICP 备案**: 所有对中国境内提供服务的域名必须备案。
- **数据隐私**: 
  - 用户的手机号、身份证号在写入数据库前建议使用 `pgcrypto` 扩展进行加密。
  - 日志脱敏：不要记录完整的用户敏感信息。
- **备份策略**: 
  - 开启 WAL 日志归档。
  - 每日全量备份 (dump) 到对象存储 (OSS/COS)。
