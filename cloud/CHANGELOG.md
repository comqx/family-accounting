# 更新日志

## v1.4.0 - 2024-01-15

### 🚀 主要变更

#### 移除启动脚本
- **Dockerfile**: 移除启动脚本，直接使用 `node index.js` 启动应用
- **package.json**: 移除 `start:with-init` 命令
- **文档更新**: 更新所有相关文档，移除启动脚本相关内容

#### 简化部署流程
- **Docker 部署**: 现在直接启动 Node.js 应用，不再执行复杂的启动脚本
- **数据库管理**: 数据库创建和表结构创建完全分离
- **配置检查**: 更新测试脚本，专注于项目配置检查

### 📝 详细变更

#### 文件修改
- `Dockerfile`: 移除启动脚本相关配置，直接启动 node 应用
- `package.json`: 移除 `start:with-init` 命令
- `QUICKSTART.md`: 更新快速启动指南，移除启动脚本相关内容
- `test-startup.sh`: 更新为项目配置测试脚本

#### 新增文件
- `scripts/create-tables.sql`: 完整的数据库表结构 SQL 文件
- `scripts/README-SQL.md`: SQL 文件使用说明

#### 保留功能
- 数据库创建脚本 (`scripts/create-database.js`)
- 数据库管理工具 (`scripts/db-manager.js`)
- 系统变量测试工具 (`test-env-vars.sh`)
- 微信云托管系统变量支持

### 🔧 新的部署流程

#### 开发环境
```bash
# 1. 启动数据库
npm run docker:up

# 2. 创建数据库
npm run db:create

# 3. 手动执行 SQL 创建表
mysql -h localhost -P 3306 -u family_user -p family_accounting < scripts/create-tables.sql

# 4. 启动应用
npm run dev
```

#### 生产环境
```bash
# 1. 构建 Docker 镜像
docker build -t family-accounting-cloud .

# 2. 运行容器
docker run -p 3000:80 family-accounting-cloud

# 3. 手动执行 SQL 创建表（在数据库服务器上）
mysql -h your-mysql-host -P 3306 -u your-username -p family_accounting < scripts/create-tables.sql
```

### 📊 数据库管理

#### 自动功能
- ✅ 数据库连接检测
- ✅ 数据库创建（如果不存在）
- ✅ 系统变量识别

#### 手动操作
- 📝 表结构创建（使用 SQL 文件）
- 📝 初始数据插入（使用 SQL 文件）
- 📝 数据库备份和恢复

### 🎯 优势

1. **简化部署**: Docker 容器启动更快，更简单
2. **灵活管理**: 数据库表结构可以独立管理
3. **减少依赖**: 不再依赖复杂的启动脚本
4. **易于调试**: 问题定位更简单
5. **版本控制**: SQL 文件可以版本控制

### 📚 相关文档

- [快速启动指南](./QUICKSTART.md)
- [数据库初始化指南](./README-DATABASE.md)
- [SQL 文件使用说明](./scripts/README-SQL.md)
- [微信云托管配置说明](./WECHAT_CLOUD_SETUP.md)

---

## v1.3.0 - 2024-01-15

### 🚀 主要变更

#### 移除数据库初始化操作
- **启动脚本**: 移除数据库表创建和初始数据插入
- **新增 SQL 文件**: 提供完整的数据库表结构 SQL 文件
- **简化流程**: 启动脚本只负责创建数据库

#### 新增功能
- `scripts/create-tables.sql`: 包含所有表结构和初始数据
- `scripts/README-SQL.md`: SQL 文件使用说明

### 📝 详细变更

#### 启动脚本简化
- 移除 `init_database()` 函数
- 移除 `check_database_status()` 函数
- 保留数据库创建功能

#### 新增 SQL 文件
- 9 个核心表的创建语句
- 13 个默认分类数据
- 4 个系统配置数据
- 使用 `CREATE TABLE IF NOT EXISTS` 和 `INSERT IGNORE`

---

## v1.2.0 - 2024-01-15

### 🚀 主要变更

#### 修复数据库不存在问题
- **新增数据库创建脚本**: `scripts/create-database.js`
- **启动脚本增强**: 自动创建数据库
- **错误处理优化**: 详细的错误日志和重试机制

#### 新增功能
- 专门的数据库创建脚本
- 启动脚本自动创建数据库
- 数据库状态验证

---

## v1.1.0 - 2024-01-15

### 🚀 主要变更

#### 支持微信云托管系统变量
- **自动识别**: MYSQL_ADDRESS、MYSQL_USERNAME、MYSQL_PASSWORD
- **配置优先级**: 系统变量 → .env 文件 → 默认配置
- **测试工具**: 新增系统变量测试脚本

#### 新增功能
- 微信云托管系统变量支持
- 系统变量测试工具
- 配置信息日志输出

---

## v1.0.0 - 2024-01-15

### 🚀 主要变更

#### 新增智能启动脚本
- **自动数据库初始化**: 创建表和初始数据
- **错误处理和重试**: 连接失败时自动重试
- **状态验证**: 启动前验证数据库状态

#### 新增功能
- 智能启动脚本 `start.sh`
- 数据库初始化脚本
- 启动脚本测试工具
- 数据库管理工具 