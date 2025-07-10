# 微信云托管配置说明

## 概述

本项目已适配微信云托管环境，支持自动识别和使用微信云托管提供的系统变量。

## 系统变量

微信云托管会自动注入以下系统变量：

### 数据库配置
- `MYSQL_ADDRESS`: MySQL 数据库地址（格式：host:port）
- `MYSQL_USERNAME`: MySQL 用户名
- `MYSQL_PASSWORD`: MySQL 密码

### 对象存储配置
- `COS_BUCKET`: 腾讯云对象存储桶名称
- `COS_REGION`: 腾讯云对象存储地域

## 配置优先级

系统按以下优先级识别配置：

1. **微信云托管系统变量**（生产环境）
2. **`.env` 文件配置**（开发环境）
3. **默认配置**

## 启动流程

### 1. 环境变量解析
启动脚本会自动解析 `MYSQL_ADDRESS` 为 `DB_HOST` 和 `DB_PORT`：

```bash
# 示例：MYSQL_ADDRESS=mysql.example.com:3306
export DB_HOST=${MYSQL_ADDRESS%:*}    # mysql.example.com
export DB_PORT=${MYSQL_ADDRESS#*:}    # 3306
export DB_USER=${MYSQL_USERNAME}      # 用户名
export DB_PASSWORD=${MYSQL_PASSWORD}  # 密码
export DB_NAME=family_accounting      # 数据库名
```

### 2. 数据库连接检测
启动脚本会等待数据库服务就绪，最多等待 30 次（每次 5 秒）。

### 3. 数据库初始化
如果数据库表不存在，会自动创建表结构和初始数据。

### 4. 应用启动
启动 Node.js 应用服务。

## 部署步骤

### 1. 上传代码
将项目代码上传到微信云托管。

### 2. 配置环境变量（可选）
在微信云托管控制台可以配置额外的环境变量，但数据库相关变量会自动注入。

### 3. 构建部署
微信云托管会自动构建 Docker 镜像并部署。

### 4. 查看日志
在微信云托管控制台查看启动日志。

## 启动日志示例

```
==========================================
🏠 家账通云托管服务启动脚本
==========================================
🚀 家账通云托管服务启动中...
📍 当前目录: /app
🌍 环境: production
📊 数据库: mysql.example.com:3306/family_accounting
👤 数据库用户: your-username
⏳ 等待数据库启动...
🔍 尝试连接数据库 (1/30)...
🔧 数据库配置: { host: 'mysql.example.com', port: '3306', user: 'your-username', database: 'family_accounting' }
✅ 数据库已就绪
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

## 故障排除

### 1. 系统变量未识别
**症状**: 启动日志显示使用默认配置
**解决**: 
- 确认在微信云托管环境中运行
- 检查变量名是否正确
- 查看启动日志中的配置信息

### 2. 数据库连接失败
**症状**: 启动脚本等待超时
**解决**:
- 检查微信云托管系统变量是否正确注入
- 确认数据库服务是否启动
- 验证网络连接

### 3. 数据库初始化失败
**症状**: 表创建或数据插入失败
**解决**:
- 检查数据库用户权限
- 查看详细错误日志
- 确认数据库字符集设置

## 开发环境

在开发环境中，可以创建 `.env` 文件来模拟微信云托管环境：

```env
# 模拟微信云托管系统变量
MYSQL_ADDRESS=localhost:3306
MYSQL_USERNAME=family_user
MYSQL_PASSWORD=family_pass_2024
COS_BUCKET=test-bucket
COS_REGION=ap-beijing

# 其他配置
NODE_ENV=development
PORT=3000
```

## 相关文档

- [快速启动指南](./QUICKSTART.md)
- [启动脚本说明](./README-STARTUP.md)
- [数据库初始化指南](./README-DATABASE.md)

## 更新日志

### v1.1.0
- 支持微信云托管系统变量
- 自动识别 MYSQL_ADDRESS、MYSQL_USERNAME、MYSQL_PASSWORD
- 优化数据库配置优先级
- 增加配置信息日志输出
- 添加系统变量测试工具 