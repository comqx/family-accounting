# 家账通云托管服务 - 快速启动指南

## 🚀 快速开始

### 1. 环境准备

确保你的系统已安装：
- Node.js 18+
- Docker & Docker Compose
- Git

### 2. 克隆项目

```bash
git clone <your-repo-url>
cd family-accounting/cloud
```

### 3. 安装依赖

```bash
npm install
```

### 4. 启动开发环境

#### 方式一：使用 Docker Compose（推荐）

```bash
# 启动所有服务（MySQL + Redis + 应用）
npm run docker:up

# 等待服务启动后检查状态
npm run db:status

# 测试数据库功能
npm run test:db
```

#### 方式二：仅启动数据库

```bash
# 只启动 MySQL 和 Redis
docker-compose -f docker-compose.dev.yml up mysql redis -d

# 等待数据库启动后初始化
npm run db:init
```

### 5. 启动应用

#### 开发模式
```bash
# 开发模式（自动重启）
npm run dev
```

#### 生产模式
```bash
# 直接启动（不包含数据库初始化）
npm start

# 使用启动脚本启动（包含数据库初始化）
npm run start:with-init
```

#### Docker 模式
```bash
# 构建镜像
npm run docker:build

# 运行容器（自动包含数据库初始化）
npm run docker:run
```

## 📊 数据库管理

### 查看数据库状态
```bash
npm run db:status
```

### 手动初始化数据库
```bash
npm run db:init
```

### 重置数据库（开发环境）
```bash
npm run db:reset
```

### 测试数据库功能
```bash
npm run test:db
```

## 🔧 开发工具

### 查看服务日志
```bash
npm run docker:logs
```

### 停止所有服务
```bash
npm run docker:down
```

### 完整开发环境启动
```bash
npm run dev:full
```

## 🚀 启动脚本功能

项目提供了智能启动脚本 `start.sh`，具有以下功能：

### 自动数据库初始化
- 等待数据库服务就绪
- 自动创建表结构和初始数据
- 验证数据库状态
- 错误处理和重试机制

### 启动流程
1. **数据库连接检测**: 最多等待 30 次（每次 5 秒）
2. **数据库初始化**: 创建表和初始数据
3. **状态验证**: 检查数据库状态
4. **应用启动**: 启动 Node.js 服务

### 使用启动脚本
```bash
# 直接运行启动脚本
./start.sh

# 通过 npm 脚本运行
npm run start:with-init

# Docker 容器中自动使用
docker run family-accounting-cloud
```

## 📝 环境配置

### 开发环境配置

创建 `.env` 文件（基于 `env.example`）：

```env
# 服务配置
NODE_ENV=development
PORT=3000

# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=family_accounting
DB_USER=family_user
DB_PASSWORD=family_pass_2024

# JWT 配置
JWT_SECRET=dev-secret-key-change-in-production
JWT_EXPIRES_IN=7d

# Redis 配置
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 生产环境配置

在生产环境中，请修改以下配置：

1. **数据库密码**: 使用强密码
2. **JWT_SECRET**: 使用随机生成的密钥
3. **CORS_ORIGIN**: 限制允许的域名
4. **RATE_LIMIT**: 调整限流配置

## 🧪 测试

### 健康检查

服务启动后，访问健康检查接口：

```bash
curl http://localhost:3000/health
```

预期响应：
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "service": "family-accounting-cloud",
  "version": "1.0.0"
}
```

### API 测试

测试登录接口：

```bash
curl -X POST http://localhost:3000/api/auth/wechat-login \
  -H "Content-Type: application/json" \
  -d '{
    "code": "test_code",
    "userInfo": {
      "nickName": "测试用户",
      "avatarUrl": "https://example.com/avatar.jpg"
    }
  }'
```

## 🐛 故障排除

### 常见问题

1. **数据库连接失败**
   ```bash
   # 检查 MySQL 容器状态
   docker ps | grep mysql
   
   # 查看 MySQL 日志
   docker logs family-accounting-mysql
   ```

2. **端口冲突**
   ```bash
   # 检查端口占用
   lsof -i :3306
   lsof -i :3000
   
   # 修改 docker-compose.dev.yml 中的端口映射
   ```

3. **权限问题**
   ```bash
   # 确保脚本有执行权限
   chmod +x start.sh
   ```

4. **启动脚本问题**
   ```bash
   # 检查启动脚本权限
   ls -la start.sh
   
   # 重新给权限
   chmod +x start.sh
   ```

### 重置环境

如果遇到问题，可以完全重置环境：

```bash
# 停止所有服务
npm run docker:down

# 删除数据卷
docker volume rm cloud_mysql_data cloud_redis_data

# 重新启动
npm run dev:full
```

### 查看启动日志

```bash
# 查看 Docker 容器日志
docker logs family-accounting-app

# 查看启动脚本输出
docker logs family-accounting-app 2>&1 | grep -E "(🚀|🔧|✅|❌|📊)"
```

## 📚 更多信息

- [数据库初始化指南](./README-DATABASE.md)
- [API 文档](./docs/API.md)
- [部署指南](./docs/DEPLOYMENT.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## �� 许可证

MIT License 