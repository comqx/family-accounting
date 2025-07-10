# 家账通数据库初始化指南

## 概述

家账通云托管服务在启动时会自动检查数据库状态，如果发现数据库或表不存在，会自动进行初始化操作。

## 自动初始化流程

### Docker 容器启动时

当使用 Docker 启动服务时，启动脚本 `start.sh` 会自动执行以下步骤：

1. **等待数据库启动**: 检查数据库连接，最多等待 30 次（每次间隔 5 秒）
2. **创建数据库**: 如果数据库不存在，自动创建数据库
3. **数据库初始化**: 调用 `scripts/init-database.js` 创建表和初始数据
4. **状态检查**: 调用 `scripts/db-manager.js status` 检查数据库状态
5. **启动应用**: 启动 Node.js 应用服务

### 启动脚本功能

启动脚本 (`start.sh`) 包含以下功能：

- **数据库连接检测**: 自动等待数据库服务就绪
- **数据库创建**: 如果数据库不存在，自动创建数据库
- **自动初始化**: 如果表不存在，自动创建表结构和初始数据
- **状态验证**: 启动前验证数据库状态
- **错误处理**: 如果初始化失败，会停止启动并显示错误信息
- **信号处理**: 正确处理 Docker 停止信号

## 数据库配置

在 `.env` 文件中配置数据库连接信息：

```env
# 数据库配置
DB_HOST=localhost
DB_PORT=3306
DB_NAME=family_accounting
DB_USER=family_user
DB_PASSWORD=family_pass_2024
```

## 自动初始化

服务启动时会自动执行以下步骤：

1. **连接测试**: 测试数据库连接是否正常
2. **数据库创建**: 如果数据库不存在，自动创建数据库
3. **表结构创建**: 如果表不存在，自动创建所有必要的表
4. **初始数据插入**: 如果关键表为空，自动插入默认数据

## 数据库表结构

### 核心表

- **users**: 用户表
- **families**: 家庭表
- **family_members**: 家庭成员关系表
- **categories**: 分类表
- **records**: 记账记录表
- **budgets**: 预算表
- **splits**: 费用分摊表
- **split_members**: 分摊成员表
- **system_configs**: 系统配置表

### 表关系

```
users (1) ←→ (N) family_members (N) ←→ (1) families
families (1) ←→ (N) records
categories (1) ←→ (N) records
users (1) ←→ (N) records
families (1) ←→ (N) budgets
categories (1) ←→ (N) budgets
records (1) ←→ (1) splits
splits (1) ←→ (N) split_members
users (1) ←→ (N) split_members
```

## 手动数据库管理

### 使用 npm 脚本

```bash
# 创建数据库
npm run db:create

# 初始化数据库
npm run db:init

# 查看数据库状态
npm run db:status

# 重置数据库（删除所有数据）
npm run db:reset

# 备份数据库
npm run db:backup

# 恢复数据库
npm run db:restore
```

### 直接使用脚本

```bash
# 创建数据库
node scripts/create-database.js

# 初始化数据库
node scripts/db-manager.js init

# 查看状态
node scripts/db-manager.js status

# 重置数据库
node scripts/db-manager.js reset
```

### 使用启动脚本

```bash
# 使用启动脚本启动（包含数据库初始化）
npm run start:with-init

# 或者直接运行启动脚本
./start.sh
```

## 初始数据

### 默认分类

系统会自动创建以下默认分类：

**支出分类:**
- 餐饮 🍽️
- 交通 🚗
- 购物 🛒
- 娱乐 🎮
- 医疗 🏥
- 教育 📚
- 住房 🏠
- 其他 📝

**收入分类:**
- 工资 💰
- 奖金 🎁
- 投资 📈
- 兼职 💼
- 其他 📝

### 系统配置

- `app_version`: 应用版本号
- `default_currency`: 默认货币 (CNY)
- `max_upload_size`: 最大上传文件大小
- `ocr_enabled`: 是否启用OCR功能

## 数据库工具类

项目提供了 `DatabaseUtils` 工具类，封装了常用的数据库操作：

```javascript
const DatabaseUtils = require('./utils/database');

// 查询
const users = await DatabaseUtils.query('SELECT * FROM users WHERE status = ?', ['ACTIVE']);

// 插入
const userId = await DatabaseUtils.insert('users', {
  openid: 'test_openid',
  nickname: '测试用户',
  role: 'MEMBER'
});

// 更新
await DatabaseUtils.update('users', 
  { nickname: '新昵称' }, 
  'id = ?', [userId]
);

// 删除
await DatabaseUtils.delete('users', 'id = ?', [userId]);

// 分页查询
const result = await DatabaseUtils.paginate(
  'SELECT * FROM records ORDER BY created_at DESC',
  [], 1, 20
);

// 事务
await DatabaseUtils.transaction(async (conn) => {
  // 在事务中执行操作
});
```

## Docker 部署

### 构建镜像

```bash
# 构建 Docker 镜像
npm run docker:build

# 运行容器
npm run docker:run
```

### 使用 Docker Compose

```bash
# 启动完整环境（包含数据库）
npm run docker:up

# 查看日志
npm run docker:logs

# 停止服务
npm run docker:down
```

## 故障排除

### 常见问题

1. **数据库连接失败**
   - 检查数据库服务是否启动
   - 验证连接配置是否正确
   - 确认数据库用户权限

2. **表创建失败**
   - 检查数据库用户是否有创建表的权限
   - 确认数据库字符集设置

3. **初始数据插入失败**
   - 检查表结构是否正确
   - 确认没有唯一约束冲突

4. **启动脚本权限问题**
   ```bash
   # 给启动脚本添加执行权限
   chmod +x start.sh
   ```

5. **数据库不存在错误**
   - 启动脚本现在会自动创建数据库
   - 检查数据库用户是否有创建数据库的权限
   - 查看启动日志中的数据库创建过程

### 日志查看

服务启动时会输出详细的初始化日志：

```
==========================================
🏠 家账通云托管服务启动脚本
==========================================
⏳ 等待数据库启动...
🔍 尝试连接数据库 (1/30)...
✅ 数据库已就绪
🔧 确保数据库存在...
🚀 开始创建数据库...
🔧 数据库配置: { host: 'mysql.example.com', port: '3306', user: 'username', database: 'family_accounting' }
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
🔧 开始数据库初始化...
✅ 表 users 已存在，跳过创建
✅ 表 categories 创建成功
✅ 插入 13 个默认分类
✅ 数据库初始化成功
📊 检查数据库状态...
✅ 数据库状态检查完成
🚀 启动应用服务...
📍 服务地址: http://0.0.0.0:80
🔍 健康检查: http://0.0.0.0:80/health
==========================================
```

## 生产环境建议

1. **备份策略**: 定期备份数据库
2. **监控**: 监控数据库连接和性能
3. **权限**: 使用最小权限原则配置数据库用户
4. **字符集**: 确保使用 utf8mb4 字符集
5. **索引**: 根据查询模式优化索引
6. **启动脚本**: 确保启动脚本有执行权限

## 开发环境

在开发环境中，可以使用以下命令快速重置数据库：

```bash
npm run db:reset
```

⚠️ **警告**: 此操作会删除所有数据，仅用于开发环境！

## 更新日志

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

### v1.0.0
- 新增智能启动脚本 `start.sh`
- 自动数据库初始化和状态检查
- 简化 `index.js` 中的数据库初始化逻辑
- 更新 Dockerfile 使用启动脚本
- 添加启动脚本测试工具 