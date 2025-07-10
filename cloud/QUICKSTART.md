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

# 等待数据库启动后创建数据库
npm run db:create
```

### 5. 启动应用

#### 开发模式
```bash
# 开发模式（自动重启）
npm run dev
```

#### 生产模式
```bash
# 直接启动
npm start
```

#### Docker 模式
```bash
# 构建镜像
npm run docker:build

# 运行容器
npm run docker:run
```

## 📊 数据库管理

### 创建数据库
```bash
npm run db:create
```

### 查看数据库状态
```bash
npm run db:status
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

## 🌐 微信云托管部署

### 系统变量配置

微信云托管会自动注入以下系统变量：

```env
# 数据库配置（自动注入）
MYSQL_ADDRESS=your-mysql-host:3306
MYSQL_USERNAME=your-mysql-username
MYSQL_PASSWORD=your-mysql-password

# 对象存储配置（自动注入）
COS_BUCKET=your-cos-bucket-name
COS_REGION=your-cos-region
```

### 部署步骤

1. **上传代码到微信云托管**
2. **配置环境变量**（可选，系统会自动注入）
3. **构建并部署**
4. **查看启动日志**

### 启动日志示例

```
🚀 家账通云托管服务启动中...
📍 当前目录: /app
🌍 环境: production
📊 数据库: your-mysql-host:3306/family_accounting
👤 数据库用户: your-mysql-username
📦 数据库连接池已创建
🔧 数据库配置: { host: 'your-mysql-host', port: '3306', user: 'your-mysql-username', database: 'family_accounting' }
✅ 数据库连接测试成功
🚀 家账通云托管服务启动成功
📍 服务地址: http://localhost:80
🔍 健康检查: http://localhost:80/health
🌍 环境: production
📊 数据库: your-mysql-host:3306/family_accounting
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

在微信云托管环境中，系统会自动注入以下配置：

1. **数据库配置**: 通过 `MYSQL_ADDRESS`、`MYSQL_USERNAME`、`MYSQL_PASSWORD` 自动配置
2. **对象存储**: 通过 `COS_BUCKET`、`COS_REGION` 自动配置
3. **其他配置**: 在微信云托管控制台配置

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
   chmod +x test-startup.sh
   chmod +x test-env-vars.sh
   ```

4. **微信云托管系统变量问题**
   ```bash
   # 检查系统变量是否正确注入
   echo $MYSQL_ADDRESS
   echo $MYSQL_USERNAME
   echo $MYSQL_PASSWORD
   
   # 查看启动日志中的配置信息
   docker logs your-container-name | grep "数据库配置"
   ```

5. **表不存在错误**
   - 需要手动执行 `scripts/create-tables.sql` 创建表
   - 查看 [SQL 文件使用说明](./scripts/README-SQL.md)

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

# 查看微信云托管日志
# 在微信云托管控制台查看实时日志
```

## 📚 更多信息

- [数据库初始化指南](./README-DATABASE.md)
- [启动脚本说明](./README-STARTUP.md)
- [SQL 文件使用说明](./scripts/README-SQL.md)
- [API 文档](./docs/API.md)
- [部署指南](./docs/DEPLOYMENT.md)

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## �� 许可证

MIT License 