# 家账通云托管服务 - 启动脚本说明

## 概述

本项目新增了智能启动脚本 `start.sh`，用于在 Docker 容器启动时自动处理数据库创建和应用启动流程。

## 启动脚本功能

### 🚀 自动数据库管理
- **数据库连接检测**: 自动等待数据库服务就绪，最多等待 30 次（每次 5 秒）
- **数据库创建**: 如果数据库不存在，自动创建数据库
- **状态验证**: 启动前验证数据库状态

### 🔧 错误处理和重试
- **连接重试**: 数据库连接失败时自动重试
- **错误处理**: 数据库创建失败时停止启动并显示错误信息
- **信号处理**: 正确处理 Docker 停止信号

### 📊 启动流程
1. **环境检查**: 显示当前环境和配置信息
2. **数据库等待**: 等待数据库服务就绪
3. **数据库创建**: 如果数据库不存在，自动创建数据库
4. **应用启动**: 启动 Node.js 应用服务

## 微信云托管系统变量

启动脚本会自动识别并使用微信云托管提供的系统变量：

### 数据库配置
- `MYSQL_ADDRESS`: MySQL 数据库地址（格式：host:port）
- `MYSQL_USERNAME`: MySQL 用户名
- `MYSQL_PASSWORD`: MySQL 密码

### 对象存储配置
- `COS_BUCKET`: 腾讯云对象存储桶名称
- `COS_REGION`: 腾讯云对象存储地域

### 变量优先级
1. 微信云托管系统变量（生产环境）
2. `.env` 文件中的配置（开发环境）
3. 默认配置

## 文件结构

```
cloud/
├── start.sh                 # 主启动脚本
├── test-startup.sh          # 启动脚本测试工具
├── test-env-vars.sh         # 系统变量测试工具
├── Dockerfile               # Docker 镜像构建文件
├── index.js                 # 应用入口文件（已简化）
├── scripts/
│   ├── create-database.js   # 数据库创建脚本
│   ├── create-tables.sql    # 数据库表结构 SQL 文件
│   ├── README-SQL.md        # SQL 文件使用说明
│   ├── db-manager.js        # 数据库管理工具
│   └── test-db.js           # 数据库测试脚本
├── config/
│   └── database.js          # 数据库配置
└── utils/
    └── database.js          # 数据库工具类
```

## 使用方法

### 1. 直接运行启动脚本
```bash
./start.sh
```

### 2. 通过 npm 脚本运行
```bash
npm run start:with-init
```

### 3. Docker 容器中自动使用
```bash
# 构建镜像
docker build -t family-accounting-cloud .

# 运行容器（自动使用启动脚本）
docker run -p 3000:80 family-accounting-cloud
```

### 4. 使用 Docker Compose
```bash
# 启动完整环境
docker-compose -f docker-compose.dev.yml up -d
```

## 数据库表创建

启动脚本只会创建数据库，不会创建表结构。你需要手动执行 SQL 文件来创建表：

### 使用提供的 SQL 文件
```bash
# 连接到数据库后执行
mysql -h your-host -P your-port -u your-username -p family_accounting < scripts/create-tables.sql
```

### SQL 文件包含
- **9 个核心表**: users, families, family_members, categories, records, budgets, splits, split_members, system_configs
- **默认分类数据**: 13 个默认分类
- **系统配置数据**: 4 个基础系统配置

详细说明请查看 [SQL 文件使用说明](./scripts/README-SQL.md)

## 测试工具

### 测试启动脚本
```bash
npm run test:startup
```

### 测试系统变量识别
```bash
npm run test:env-vars
```

### 测试数据库功能
```bash
npm run test:db
```

### 手动创建数据库
```bash
npm run db:create
```

## 环境变量配置

### 微信云托管环境（生产环境）
系统会自动注入以下变量，无需手动配置：
```env
MYSQL_ADDRESS=your-mysql-host:3306
MYSQL_USERNAME=your-mysql-username
MYSQL_PASSWORD=your-mysql-password
COS_BUCKET=your-cos-bucket-name
COS_REGION=your-cos-region
```

### 开发环境配置
在 `.env` 文件中配置：
```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=family_accounting
DB_USER=family_user
DB_PASSWORD=family_pass_2024

# 服务配置
NODE_ENV=development
PORT=3000
```

## 启动日志示例

```
==========================================
🏠 家账通云托管服务启动脚本
==========================================
🚀 家账通云托管服务启动中...
📍 当前目录: /app
🌍 环境: production
📊 数据库: your-mysql-host:3306/family_accounting
👤 数据库用户: your-mysql-username
⏳ 等待数据库启动...
🔍 尝试连接数据库 (1/30)...
🔧 数据库配置: { host: 'your-mysql-host', port: '3306', user: 'your-mysql-username', database: 'family_accounting' }
✅ 数据库已就绪
🔧 确保数据库存在...
🚀 开始创建数据库...
🔧 数据库配置: { host: 'your-mysql-host', port: '3306', user: 'your-mysql-username', database: 'family_accounting' }
🔧 创建临时连接...
🔍 检查数据库 family_accounting 是否存在...
📊 数据库 family_accounting 不存在，开始创建...
✅ 数据库 family_accounting 创建成功
🔍 测试连接到新数据库...
✅ 数据库连接测试成功
📊 当前数据库: family_accounting
🔤 数据库字符集: utf8mb4
🎉 数据库创建和测试完成
✅ 数据库检查/创建成功
🚀 启动应用服务...
📍 服务地址: http://0.0.0.0:80
🔍 健康检查: http://0.0.0.0:80/health
==========================================
```

## 故障排除

### 常见问题

1. **启动脚本权限问题**
   ```bash
   chmod +x start.sh
   ```

2. **数据库连接失败**
   - 检查微信云托管系统变量是否正确注入
   - 验证数据库服务是否启动
   - 确认网络连接

3. **数据库创建失败**
   - 检查数据库用户权限
   - 查看详细错误日志
   - 确认数据库字符集设置

4. **系统变量未识别**
   - 确认在微信云托管环境中运行
   - 检查变量名是否正确
   - 查看启动日志中的配置信息

5. **表不存在错误**
   - 启动脚本只创建数据库，不创建表
   - 需要手动执行 `scripts/create-tables.sql` 创建表
   - 查看 [SQL 文件使用说明](./scripts/README-SQL.md)

### 调试模式

可以通过修改启动脚本中的 `set -e` 为 `set -ex` 来启用调试模式，显示详细的执行过程。

## 相关文档

- [快速启动指南](./QUICKSTART.md)
- [数据库初始化指南](./README-DATABASE.md)
- [微信云托管配置说明](./WECHAT_CLOUD_SETUP.md)
- [SQL 文件使用说明](./scripts/README-SQL.md)
- [API 文档](./docs/API.md)

## 更新日志

### v1.3.0
- 移除数据库初始化操作
- 新增 SQL 文件用于手动创建表
- 简化启动脚本流程
- 添加 SQL 文件使用说明

### v1.2.0
- 修复数据库不存在的问题
- 新增专门的数据库创建脚本
- 启动脚本自动创建数据库
- 优化数据库初始化流程

### v1.1.0
- 支持微信云托管系统变量
- 自动识别 MYSQL_ADDRESS、MYSQL_USERNAME、MYSQL_PASSWORD
- 优化数据库配置优先级
- 增加配置信息日志输出
- 添加系统变量测试工具

### v1.0.0
- 新增智能启动脚本 `start.sh`
- 自动数据库初始化和状态检查
- 简化 `index.js` 中的数据库初始化逻辑
- 更新 Dockerfile 使用启动脚本
- 添加启动脚本测试工具 