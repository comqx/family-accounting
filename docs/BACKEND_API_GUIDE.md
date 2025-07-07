# 家账通后端API开发指南

## 📋 概述

本文档提供家账通小程序后端API的开发指南，包括技术选型、数据库设计、API接口规范等。

## 🛠 技术栈推荐

### 后端框架
- **Node.js + Express** (推荐，与前端技术栈统一)
- **Python + FastAPI** (高性能，适合AI功能)
- **Java + Spring Boot** (企业级，稳定性好)

### 数据库
- **主数据库**: MySQL 8.0+ (关系型数据，事务支持)
- **缓存**: Redis 6.0+ (会话缓存，实时数据)
- **文件存储**: 阿里云OSS/腾讯云COS (图片、文件)

### 其他服务
- **消息队列**: RabbitMQ/Redis (异步任务)
- **搜索引擎**: Elasticsearch (日志分析)
- **监控**: Prometheus + Grafana

## 🗄 数据库设计

### 用户表 (users)
```sql
CREATE TABLE users (
    id VARCHAR(32) PRIMARY KEY,
    openid VARCHAR(64) UNIQUE NOT NULL,
    unionid VARCHAR(64),
    nickname VARCHAR(50),
    avatar_url VARCHAR(255),
    phone VARCHAR(20),
    email VARCHAR(100),
    status TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);
```

### 家庭表 (families)
```sql
CREATE TABLE families (
    id VARCHAR(32) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    invite_code VARCHAR(10) UNIQUE,
    creator_id VARCHAR(32) NOT NULL,
    status TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (creator_id) REFERENCES users(id)
);
```

### 家庭成员表 (family_members)
```sql
CREATE TABLE family_members (
    id VARCHAR(32) PRIMARY KEY,
    family_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    role ENUM('owner', 'admin', 'member') DEFAULT 'member',
    nickname VARCHAR(50),
    status TINYINT DEFAULT 1,
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_family_user (family_id, user_id)
);
```

### 分类表 (categories)
```sql
CREATE TABLE categories (
    id VARCHAR(32) PRIMARY KEY,
    family_id VARCHAR(32) NOT NULL,
    name VARCHAR(50) NOT NULL,
    icon VARCHAR(10),
    color VARCHAR(7),
    type ENUM('income', 'expense') NOT NULL,
    parent_id VARCHAR(32),
    sort_order INT DEFAULT 0,
    is_system TINYINT DEFAULT 0,
    status TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id),
    FOREIGN KEY (parent_id) REFERENCES categories(id)
);
```

### 记录表 (records)
```sql
CREATE TABLE records (
    id VARCHAR(32) PRIMARY KEY,
    family_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    category_id VARCHAR(32) NOT NULL,
    type ENUM('income', 'expense') NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    description TEXT,
    record_date DATE NOT NULL,
    images JSON,
    tags JSON,
    location VARCHAR(255),
    status TINYINT DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (family_id) REFERENCES families(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (category_id) REFERENCES categories(id),
    INDEX idx_family_date (family_id, record_date),
    INDEX idx_user_date (user_id, record_date)
);
```

### 分摊表 (splits)
```sql
CREATE TABLE splits (
    id VARCHAR(32) PRIMARY KEY,
    record_id VARCHAR(32) NOT NULL,
    family_id VARCHAR(32) NOT NULL,
    total_amount DECIMAL(10,2) NOT NULL,
    split_type ENUM('equal', 'percentage', 'amount', 'custom') NOT NULL,
    description TEXT,
    status ENUM('pending', 'confirmed', 'settled', 'cancelled') DEFAULT 'pending',
    created_by VARCHAR(32) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (record_id) REFERENCES records(id),
    FOREIGN KEY (family_id) REFERENCES families(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 分摊参与者表 (split_participants)
```sql
CREATE TABLE split_participants (
    id VARCHAR(32) PRIMARY KEY,
    split_id VARCHAR(32) NOT NULL,
    user_id VARCHAR(32) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    percentage DECIMAL(5,2),
    status ENUM('pending', 'confirmed', 'settled', 'declined') DEFAULT 'pending',
    confirmed_at TIMESTAMP NULL,
    settled_at TIMESTAMP NULL,
    FOREIGN KEY (split_id) REFERENCES splits(id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    UNIQUE KEY unique_split_user (split_id, user_id)
);
```

## 🔌 API接口规范

### 基础规范
- **协议**: HTTPS
- **格式**: JSON
- **编码**: UTF-8
- **状态码**: 标准HTTP状态码

### 统一响应格式
```json
{
    "code": 200,
    "message": "success",
    "data": {},
    "timestamp": 1640995200000
}
```

### 错误响应格式
```json
{
    "code": 400,
    "message": "参数错误",
    "error": "amount字段不能为空",
    "timestamp": 1640995200000
}
```

### 认证方式
使用JWT Token认证：
```
Authorization: Bearer <token>
```

## 📡 核心API接口

### 1. 用户认证
```
POST /api/auth/login
Content-Type: application/json

{
    "code": "微信登录code"
}

Response:
{
    "code": 200,
    "data": {
        "token": "jwt_token",
        "user": {
            "id": "user_id",
            "nickname": "用户昵称",
            "avatar_url": "头像URL"
        }
    }
}
```

### 2. 家庭管理
```
# 创建家庭
POST /api/families
{
    "name": "我的家庭",
    "description": "家庭描述"
}

# 加入家庭
POST /api/families/join
{
    "invite_code": "ABC123"
}

# 获取家庭信息
GET /api/families/{family_id}

# 获取家庭成员
GET /api/families/{family_id}/members
```

### 3. 记录管理
```
# 创建记录
POST /api/records
{
    "family_id": "family_id",
    "category_id": "category_id",
    "type": "expense",
    "amount": 100.50,
    "description": "午餐",
    "record_date": "2024-01-15",
    "images": ["image_url1", "image_url2"]
}

# 获取记录列表
GET /api/records?family_id=xxx&page=1&limit=20&start_date=2024-01-01&end_date=2024-01-31

# 更新记录
PUT /api/records/{record_id}

# 删除记录
DELETE /api/records/{record_id}
```

### 4. 分类管理
```
# 获取分类列表
GET /api/categories?family_id=xxx&type=expense

# 创建分类
POST /api/categories
{
    "family_id": "family_id",
    "name": "餐饮",
    "icon": "🍽️",
    "color": "#ff6b6b",
    "type": "expense"
}
```

### 5. OCR识别
```
# 上传图片识别
POST /api/ocr/recognize
Content-Type: multipart/form-data

file: 图片文件
platform: alipay|wechat|bank_card|credit_card

Response:
{
    "code": 200,
    "data": {
        "platform": "alipay",
        "transactions": [
            {
                "amount": 25.50,
                "merchant": "麦当劳",
                "date": "2024-01-15",
                "confidence": 0.95
            }
        ]
    }
}
```

### 6. 分摊管理
```
# 创建分摊
POST /api/splits
{
    "record_id": "record_id",
    "split_type": "equal",
    "participants": [
        {"user_id": "user1"},
        {"user_id": "user2"}
    ]
}

# 确认分摊
POST /api/splits/{split_id}/confirm

# 获取分摊列表
GET /api/splits?family_id=xxx&status=pending
```

### 7. 报表统计
```
# 获取统计数据
GET /api/reports/statistics?family_id=xxx&start_date=2024-01-01&end_date=2024-01-31

# 获取分类统计
GET /api/reports/categories?family_id=xxx&type=expense&period=month

# 获取趋势数据
GET /api/reports/trends?family_id=xxx&period=daily&days=30
```

## 🔄 WebSocket接口

### 连接地址
```
wss://ws.family-accounting.com?token=jwt_token&family_id=xxx
```

### 消息格式
```json
{
    "type": "record_changed",
    "action": "create",
    "data": {
        "record": {},
        "user": {}
    },
    "timestamp": 1640995200000
}
```

### 消息类型
- `record_changed`: 记录变更
- `member_changed`: 成员变更
- `split_changed`: 分摊变更
- `notification`: 通知消息

## 🔐 安全考虑

### 1. 数据加密
- 敏感数据加密存储
- 传输过程HTTPS加密
- 密码使用bcrypt加密

### 2. 访问控制
- JWT Token认证
- 家庭成员权限控制
- API访问频率限制

### 3. 数据验证
- 输入参数验证
- SQL注入防护
- XSS攻击防护

### 4. 日志审计
- 操作日志记录
- 异常行为监控
- 数据访问审计

## 📊 性能优化

### 1. 数据库优化
- 合理设计索引
- 查询语句优化
- 读写分离

### 2. 缓存策略
- Redis缓存热点数据
- API响应缓存
- 静态资源CDN

### 3. 接口优化
- 分页查询
- 数据压缩
- 异步处理

## 🚀 部署建议

### 1. 环境配置
```bash
# 生产环境变量
NODE_ENV=production
PORT=3000
DB_HOST=localhost
DB_PORT=3306
DB_NAME=family_accounting
DB_USER=username
DB_PASS=password
REDIS_HOST=localhost
REDIS_PORT=6379
JWT_SECRET=your_jwt_secret
WECHAT_APP_ID=your_app_id
WECHAT_APP_SECRET=your_app_secret
```

### 2. PM2配置
```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'family-accounting-api',
    script: 'app.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'development'
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 3000
    }
  }]
}
```

### 3. 监控配置
- 应用性能监控(APM)
- 错误日志收集
- 资源使用监控
- 接口响应时间监控

## 📞 技术支持

如需后端开发支持，请联系：
- 技术咨询：tech@family-accounting.com
- 文档更新：docs@family-accounting.com

---

**注意**: 这是一个完整的后端API设计方案，实际开发时请根据具体需求进行调整。
