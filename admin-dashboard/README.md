# Membership System Admin Dashboard

## 简介
这是一个基于 React + Vite + Ant Design + Supabase 的会员系统管理后台。
主要功能包括会员管理、等级权益配置、积分流水查询、营销活动管理和订单管理。

## 目录结构
```
src/
  components/    # 公共组件 (Layout等)
  lib/           # 工具库 (Supabase client)
  pages/         # 页面组件
    Dashboard.jsx # 仪表盘
    Members.jsx   # 会员管理 (已实现完整CRUD)
    Login.jsx     # 登录页
    ...           # 其他业务页面
  App.jsx        # 路由配置
  main.jsx       # 入口文件
```

## 快速开始

### 1. 安装依赖
```bash
npm install
```

### 2. 配置环境变量
复制 `.env` 文件并填入你的 Supabase 配置信息：
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. 启动开发服务器
```bash
npm run dev
```

### 4. 构建生产版本
```bash
npm run build
```

## 功能模块说明

### 会员管理
- **列表展示**: 显示会员昵称、手机号、邮箱、积分、余额、状态等信息。
- **搜索**: 支持通过昵称、手机号或邮箱模糊搜索。
- **排序**: 支持按积分和余额排序。
- **编辑**: 点击编辑按钮可修改会员基本信息和状态。
- **删除**: 管理员可删除会员（软删除或硬删除取决于后端策略）。

## 部署指南
本项目构建后生成静态文件，可部署到任何静态网站托管服务（如 Vercel, Netlify, Github Pages）或 Nginx 服务器。

### Nginx 配置示例
```nginx
server {
    listen 80;
    server_name admin.example.com;
    root /path/to/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }
}
```
