# 登录接口修复说明

## 🐛 问题描述

用户反馈：微信登录接口报错 `TypeError: getPool is not a function`

## 🔍 问题分析

经过分析发现以下问题：

1. **函数名不匹配**：
   - `cloud/config/database.js` 中导出的函数是 `getConnection`
   - `cloud/routes/auth.js` 和 `cloud/routes/family.js` 中调用的是 `getPool`

2. **字段名不匹配**：
   - `users` 表中头像字段名是 `avatar`
   - 代码中使用的是 `avatar_url`

3. **SQL 语句问题**：
   - 创建家庭时缺少必需的 `admin_id` 字段
   - 手动指定了自动生成的 `created_at` 和 `joined_at` 字段

## ✅ 解决方案

### 1. 修复函数名不匹配问题

**修改前**：
```javascript
const { getPool } = require('../config/database');
const pool = getPool();
```

**修改后**：
```javascript
const { getConnection } = require('../config/database');
const pool = await getConnection();
```

### 2. 修复字段名不匹配问题

**修改前**：
```sql
INSERT INTO users (openid, unionid, nickname, avatar_url, role) VALUES (?, ?, ?, ?, ?)
```

**修改后**：
```sql
INSERT INTO users (openid, unionid, nickname, avatar, role) VALUES (?, ?, ?, ?, ?)
```

### 3. 修复 SQL 语句问题

**修改前**：
```sql
INSERT INTO families (name, description, avatar, created_at) VALUES (?, ?, ?, NOW())
INSERT INTO family_members (family_id, user_id, role, joined_at) VALUES (?, ?, ?, NOW())
```

**修改后**：
```sql
INSERT INTO families (name, description, avatar, admin_id) VALUES (?, ?, ?, ?)
INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)
```

## 📝 修改的文件

1. **cloud/routes/auth.js**
   - 修复 `getPool` → `getConnection`
   - 修复 `avatar_url` → `avatar`

2. **cloud/routes/family.js**
   - 修复 `getPool` → `getConnection`
   - 添加 `admin_id` 字段到创建家庭语句
   - 移除手动指定的时间字段

## 🧪 测试验证

创建了测试脚本 `test-login-fix.js` 来验证修复效果：

```bash
npm run test:login-fix
```

测试步骤：
1. 健康检查接口测试
2. 微信登录接口测试
3. 创建家庭接口测试
4. 获取家庭列表接口测试

## 🎯 修复效果

修复后的登录流程：

1. **用户登录**：
   - 调用微信登录接口
   - 检查用户是否存在
   - 不存在则创建新用户
   - 返回用户信息和 token

2. **创建家庭**：
   - 使用 token 认证
   - 创建家庭记录（包含 admin_id）
   - 更新用户的 family_id
   - 创建家庭成员关系

3. **获取家庭列表**：
   - 根据用户 ID 查询家庭信息
   - 返回用户所属的家庭列表

## 📊 数据库表结构确认

确保以下字段名正确：

### users 表
- `id` - 用户ID
- `openid` - 微信openid
- `unionid` - 微信unionid
- `nickname` - 用户昵称
- `avatar` - 头像URL（不是 avatar_url）
- `family_id` - 所属家庭ID

### families 表
- `id` - 家庭ID
- `name` - 家庭名称
- `description` - 家庭描述
- `avatar` - 家庭头像
- `admin_id` - 管理员用户ID（必填）

### family_members 表
- `id` - 关系ID
- `family_id` - 家庭ID
- `user_id` - 用户ID
- `role` - 成员角色
- `joined_at` - 加入时间（自动生成）

## 🔧 相关文件

- `cloud/routes/auth.js` - 登录接口
- `cloud/routes/family.js` - 家庭相关接口
- `cloud/config/database.js` - 数据库配置
- `cloud/test-login-fix.js` - 测试脚本
- `cloud/scripts/create-tables.sql` - 数据库表结构

## 📚 注意事项

1. 确保数据库表已正确创建
2. 确保数据库连接配置正确
3. 如果数据库操作失败，会返回模拟数据作为降级方案
4. 前端需要正确处理登录响应和家庭状态 