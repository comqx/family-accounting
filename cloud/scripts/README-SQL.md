# 数据库表结构 SQL 文件说明

## 概述

本项目提供了完整的数据库表结构 SQL 文件，用于手动创建数据库表。

## 文件说明

### `create-tables.sql`
包含所有必要的数据库表结构和初始数据：

- **9 个核心表**: users, families, family_members, categories, records, budgets, splits, split_members, system_configs
- **默认分类数据**: 13 个默认分类（8个支出分类 + 5个收入分类）
- **系统配置数据**: 4 个基础系统配置

## 使用方法

### 1. 使用 MySQL 命令行

```bash
# 连接到数据库
mysql -h your-host -P your-port -u your-username -p your-database

# 执行 SQL 文件
source /path/to/create-tables.sql
```

### 2. 使用 MySQL Workbench

1. 打开 MySQL Workbench
2. 连接到数据库
3. 选择数据库 `family_accounting`
4. 打开 `create-tables.sql` 文件
5. 执行 SQL 语句

### 3. 使用其他数据库管理工具

- **phpMyAdmin**: 导入 SQL 文件
- **Navicat**: 执行 SQL 文件
- **DBeaver**: 运行 SQL 脚本

## 表结构说明

### 核心表

1. **users** - 用户表
   - 存储用户基本信息
   - 包含微信 openid、昵称、头像等

2. **families** - 家庭表
   - 存储家庭信息
   - 包含家庭名称、管理员、邀请码等

3. **family_members** - 家庭成员关系表
   - 存储用户与家庭的关联关系
   - 包含成员角色、加入时间等

4. **categories** - 分类表
   - 存储支出和收入分类
   - 支持系统默认分类和家庭自定义分类

5. **records** - 记账记录表
   - 存储所有记账记录
   - 包含金额、描述、日期、位置等

6. **budgets** - 预算表
   - 存储家庭预算信息
   - 支持按分类和月份设置预算

7. **splits** - 费用分摊表
   - 存储费用分摊信息
   - 包含分摊标题、总金额、状态等

8. **split_members** - 分摊成员表
   - 存储分摊的成员信息
   - 包含分摊金额、支付状态等

9. **system_configs** - 系统配置表
   - 存储系统配置信息
   - 包含应用版本、默认货币等

## 默认数据

### 支出分类
- 餐饮 🍽️
- 交通 🚗
- 购物 🛒
- 娱乐 🎮
- 医疗 🏥
- 教育 📚
- 住房 🏠
- 其他 📝

### 收入分类
- 工资 💰
- 奖金 🎁
- 投资 📈
- 兼职 💼
- 其他 📝

### 系统配置
- `app_version`: 1.0.0
- `default_currency`: CNY
- `max_upload_size`: 10485760
- `ocr_enabled`: true

## 注意事项

1. **字符集**: 所有表使用 `utf8mb4` 字符集，支持 emoji
2. **排序规则**: 使用 `utf8mb4_unicode_ci` 排序规则
3. **索引**: 已为常用查询字段创建索引
4. **外键**: 暂未设置外键约束，由应用层控制
5. **JSON 字段**: 使用 MySQL 5.7+ 的 JSON 类型

## 执行顺序

1. 确保数据库 `family_accounting` 已创建
2. 执行 `create-tables.sql` 文件
3. 检查表是否创建成功
4. 验证初始数据是否插入

## 验证命令

执行完 SQL 后，可以使用以下命令验证：

```sql
-- 查看所有表
SHOW TABLES;

-- 查看表结构
DESCRIBE users;
DESCRIBE families;
DESCRIBE categories;

-- 查看初始数据
SELECT * FROM categories WHERE is_default = TRUE;
SELECT * FROM system_configs;

-- 查看表数量
SELECT COUNT(*) as table_count FROM information_schema.tables 
WHERE table_schema = 'family_accounting';
```

## 故障排除

### 常见问题

1. **字符集错误**
   ```sql
   -- 检查数据库字符集
   SHOW VARIABLES LIKE 'character_set_database';
   
   -- 修改数据库字符集
   ALTER DATABASE family_accounting CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

2. **权限错误**
   - 确保用户有创建表的权限
   - 确保用户有插入数据的权限

3. **表已存在**
   - SQL 文件使用 `CREATE TABLE IF NOT EXISTS`，不会报错
   - 使用 `INSERT IGNORE` 避免重复插入数据

## 备份和恢复

### 备份表结构
```bash
mysqldump -h your-host -P your-port -u your-username -p --no-data family_accounting > schema.sql
```

### 备份数据
```bash
mysqldump -h your-host -P your-port -u your-username -p --no-create-info family_accounting > data.sql
```

### 恢复
```bash
mysql -h your-host -P your-port -u your-username -p family_accounting < schema.sql
mysql -h your-host -P your-port -u your-username -p family_accounting < data.sql
``` 