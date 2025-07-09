# 微信云托管部署指南

## 📋 概述

本指南将帮助您将家账通项目部署到微信云托管平台，实现小程序前端与后端服务的完整部署。

## 🏗️ 架构说明

### 项目结构
```
family-accounting/
├── src/                    # 小程序前端代码
├── cloud/                  # 云托管后端代码
│   ├── index.js           # 主入口文件
│   ├── routes/            # API 路由
│   ├── package.json       # 后端依赖
│   └── Dockerfile         # 容器配置
├── dist/                  # 小程序构建产物
└── scripts/               # 部署脚本
```

### 技术栈
- **前端**: Taro + Vue3 + 微信小程序
- **后端**: Node.js + Express + MySQL + Redis
- **部署**: Docker + 微信云托管

## 🚀 部署步骤

### 1. 准备工作

#### 1.1 微信开发者账号
- 确保您有微信小程序开发者账号
- 开通微信云托管服务
- 获取云托管服务配置信息

#### 1.2 环境要求
- Node.js 18+
- Docker Desktop
- 微信开发者工具

#### 1.3 配置环境变量
复制 `cloud/env.example` 为 `cloud/.env` 并配置：

```bash
# 服务配置
NODE_ENV=production
PORT=80

# JWT 配置
JWT_SECRET=your-super-secret-jwt-key

# 数据库配置
DB_HOST=your-db-host
DB_PORT=3306
DB_NAME=family_accounting
DB_USER=your-db-user
DB_PASSWORD=your-db-password

# 微信小程序配置
WECHAT_APPID=wx96846083348c49aa
WECHAT_SECRET=your-wechat-app-secret
```

### 2. 本地测试

#### 2.1 启动后端服务
```bash
cd cloud
npm install
npm start
```

#### 2.2 测试 API
```bash
# 健康检查
curl http://localhost:80/health

# 测试登录
curl -X POST http://localhost:80/api/auth/wechat-login \
  -H "Content-Type: application/json" \
  -d '{"code":"test","userInfo":{"nickName":"测试用户"}}'
```

#### 2.3 构建小程序
```bash
# 在项目根目录
pnpm install
pnpm run build:weapp
```

### 3. 微信云托管部署

#### 3.1 使用部署脚本
```bash
# 自动部署
node scripts/deploy-cloud.js

# 或手动部署
NODE_ENV=production VERSION=1.0.0 node scripts/deploy-cloud.js
```

#### 3.2 手动部署步骤

1. **构建后端镜像**
```bash
cd cloud
docker build -t family-accounting:latest .
```

2. **推送镜像到微信云托管**
```bash
# 使用微信开发者工具或云托管控制台
# 上传镜像并创建服务
```

3. **配置云托管服务**
   - 服务名称: `family-accounting`
   - 端口: `80`
   - 环境变量: 参考 `cloud/env.example`

4. **配置数据库**
   - 使用微信云托管提供的 MySQL 服务
   - 或连接外部数据库

### 4. 小程序配置

#### 4.1 更新 API 地址
在 `src/utils/request/index.js` 中更新生产环境 API 地址：

```javascript
production: {
  baseURL: 'https://your-cloud-service.weixin.qq.com/api',
  timeout: 15000
}
```

#### 4.2 上传小程序代码
使用微信开发者工具上传小程序代码到微信平台。

## 🔧 配置说明

### 环境变量配置

| 变量名 | 说明 | 示例值 |
|--------|------|--------|
| `NODE_ENV` | 运行环境 | `production` |
| `PORT` | 服务端口 | `80` |
| `JWT_SECRET` | JWT 密钥 | `your-secret-key` |
| `DB_HOST` | 数据库地址 | `localhost` |
| `WECHAT_APPID` | 小程序 AppID | `wx96846083348c49aa` |

### API 接口说明

#### 认证接口
- `POST /api/auth/wechat-login` - 微信登录
- `GET /api/auth/verify` - 验证 token
- `POST /api/auth/refresh` - 刷新 token

#### 用户接口
- `GET /api/user/profile` - 获取用户信息
- `PUT /api/user/profile` - 更新用户信息
- `GET /api/user/stats` - 获取用户统计

#### 家庭接口
- `GET /api/family/list` - 获取家庭列表
- `POST /api/family/create` - 创建家庭
- `POST /api/family/join` - 加入家庭

#### 记账接口
- `GET /api/record/list` - 获取记账记录
- `POST /api/record/create` - 创建记账记录
- `PUT /api/record/:id` - 更新记账记录
- `DELETE /api/record/:id` - 删除记账记录

## 📊 监控与日志

### 健康检查
```bash
curl https://your-cloud-service.weixin.qq.com/health
```

### 日志查看
- 在微信云托管控制台查看服务日志
- 或使用微信开发者工具查看

### 性能监控
- 使用微信云托管提供的监控面板
- 监控 CPU、内存、网络等指标

## 🔒 安全配置

### 1. HTTPS 配置
微信云托管自动提供 HTTPS 支持，无需额外配置。

### 2. 跨域配置
```javascript
// 在 cloud/index.js 中配置 CORS
app.use(cors({
  origin: ['https://servicewechat.com'],
  credentials: true
}));
```

### 3. 限流配置
```javascript
// 配置请求限流
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15分钟
  max: 100 // 限制每个IP 15分钟内最多100个请求
});
```

## 🚨 故障排除

### 常见问题

#### 1. 服务启动失败
- 检查环境变量配置
- 查看服务日志
- 确认端口配置正确

#### 2. 数据库连接失败
- 检查数据库配置
- 确认网络连接
- 验证数据库权限

#### 3. 小程序无法访问后端
- 检查 API 地址配置
- 确认 CORS 配置
- 验证网络连接

#### 4. 文件上传失败
- 检查文件大小限制
- 确认文件类型
- 验证存储权限

### 调试方法

#### 1. 本地调试
```bash
# 启动本地服务
cd cloud
npm run dev

# 查看日志
tail -f logs/app.log
```

#### 2. 远程调试
- 使用微信云托管控制台查看日志
- 配置日志级别为 DEBUG
- 使用微信开发者工具调试

## 📈 扩展建议

### 1. 数据库优化
- 使用连接池
- 配置读写分离
- 添加数据库索引

### 2. 缓存策略
- 使用 Redis 缓存热点数据
- 配置缓存过期时间
- 实现缓存预热

### 3. 监控告警
- 配置服务监控
- 设置告警规则
- 监控关键指标

### 4. 备份策略
- 定期备份数据库
- 配置自动备份
- 测试恢复流程

## 📞 技术支持

如果在部署过程中遇到问题，请：

1. 查看本文档的故障排除部分
2. 检查微信云托管官方文档
3. 联系技术支持团队

## 📝 更新日志

- **v1.0.0** - 初始版本，支持基本的云托管部署
- **v1.1.0** - 添加自动化部署脚本
- **v1.2.0** - 优化安全配置和监控 