# Docker 部署指南

## 📋 概述

本指南提供家账通小程序的Docker部署方案，支持开发、测试和生产环境。

## 🐳 Docker 文件说明

### 文件结构
```
family-accounting/
├── Dockerfile              # 主要的Docker构建文件
├── docker-compose.yml      # Docker Compose配置
├── .dockerignore           # Docker忽略文件
└── docker/                 # Docker配置目录
    ├── nginx.conf          # Nginx配置
    ├── start.sh            # 启动脚本
    └── mysql/              # MySQL初始化脚本
```

### Dockerfile 多阶段构建
- **base**: 基础环境，安装依赖
- **builder**: 构建阶段，编译项目
- **production**: 生产环境，Nginx服务
- **development**: 开发环境，热重载
- **test**: 测试阶段，质量检查

## 🚀 快速开始

### 1. 构建镜像
```bash
# 构建生产镜像
docker build -t family-accounting:latest .

# 构建开发镜像
docker build --target development -t family-accounting:dev .

# 构建测试镜像
docker build --target test -t family-accounting:test .
```

### 2. 运行容器
```bash
# 运行生产容器
docker run -d -p 8080:80 --name family-accounting-app family-accounting:latest

# 运行开发容器
docker run -d -p 10086:10086 -v $(pwd):/app --name family-accounting-dev family-accounting:dev
```

### 3. 使用 Docker Compose
```bash
# 启动生产环境
docker-compose up -d

# 启动开发环境
docker-compose --profile dev up -d

# 启动完整环境（包含数据库）
docker-compose --profile backend up -d
```

## 🔧 环境配置

### 开发环境
```bash
# 启动开发环境
docker-compose --profile dev up -d

# 查看日志
docker-compose logs -f family-accounting-dev

# 进入容器
docker exec -it family-accounting-dev sh
```

**特性:**
- 热重载支持
- 源码挂载
- 实时调试
- 端口: 10086

### 生产环境
```bash
# 启动生产环境
docker-compose up -d family-accounting-app

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f family-accounting-app
```

**特性:**
- Nginx静态服务
- Gzip压缩
- 缓存优化
- 健康检查
- 端口: 8080

### 完整环境（含后端）
```bash
# 启动完整环境
docker-compose --profile backend up -d

# 包含服务:
# - 小程序前端 (8080)
# - MySQL数据库 (3306)
# - Redis缓存 (6379)
```

## 📊 容器管理

### 常用命令
```bash
# 查看运行状态
docker ps

# 查看镜像
docker images

# 查看日志
docker logs family-accounting-app

# 进入容器
docker exec -it family-accounting-app sh

# 停止容器
docker stop family-accounting-app

# 删除容器
docker rm family-accounting-app

# 删除镜像
docker rmi family-accounting:latest
```

### Docker Compose 命令
```bash
# 启动服务
docker-compose up -d

# 停止服务
docker-compose down

# 重启服务
docker-compose restart

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f

# 构建并启动
docker-compose up --build -d

# 清理资源
docker-compose down -v --rmi all
```

## 🔍 健康检查

### 内置健康检查
```bash
# 检查容器健康状态
docker ps --format "table {{.Names}}\t{{.Status}}"

# 手动健康检查
curl http://localhost:8080/health
```

### 监控指标
- **响应时间**: < 2秒
- **内存使用**: < 512MB
- **CPU使用**: < 50%
- **磁盘空间**: < 1GB

## 🔐 安全配置

### 生产环境安全
```bash
# 使用非root用户运行
USER nginx

# 移除不必要的包
RUN apk del .build-deps

# 设置安全头
add_header X-Frame-Options "SAMEORIGIN";
add_header X-XSS-Protection "1; mode=block";
```

### 网络安全
```yaml
# 使用自定义网络
networks:
  family-accounting-network:
    driver: bridge
```

## 📈 性能优化

### 镜像优化
- 使用Alpine Linux基础镜像
- 多阶段构建减少镜像大小
- .dockerignore减少构建上下文

### 运行时优化
- Nginx Gzip压缩
- 静态资源缓存
- 健康检查配置
- 资源限制设置

## 🚀 部署到云平台

### 阿里云容器服务
```bash
# 构建并推送镜像
docker build -t registry.cn-hangzhou.aliyuncs.com/your-namespace/family-accounting:latest .
docker push registry.cn-hangzhou.aliyuncs.com/your-namespace/family-accounting:latest
```

### 腾讯云容器服务
```bash
# 构建并推送镜像
docker build -t ccr.ccs.tencentyun.com/your-namespace/family-accounting:latest .
docker push ccr.ccs.tencentyun.com/your-namespace/family-accounting:latest
```

### Kubernetes 部署
```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: family-accounting
spec:
  replicas: 3
  selector:
    matchLabels:
      app: family-accounting
  template:
    metadata:
      labels:
        app: family-accounting
    spec:
      containers:
      - name: family-accounting
        image: family-accounting:latest
        ports:
        - containerPort: 80
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
```

## 🔧 故障排除

### 常见问题

#### 1. 构建失败
```bash
# 检查构建日志
docker build --no-cache -t family-accounting:latest .

# 检查依赖安装
docker run --rm -it node:24-alpine sh
```

#### 2. 容器启动失败
```bash
# 查看详细日志
docker logs --details family-accounting-app

# 检查端口占用
netstat -tulpn | grep :8080
```

#### 3. 健康检查失败
```bash
# 手动测试健康检查
docker exec family-accounting-app curl -f http://localhost/health

# 检查Nginx配置
docker exec family-accounting-app nginx -t
```

#### 4. 性能问题
```bash
# 查看资源使用
docker stats family-accounting-app

# 检查容器进程
docker exec family-accounting-app ps aux
```

## 📋 最佳实践

### 开发阶段
1. 使用开发镜像进行本地开发
2. 挂载源码目录实现热重载
3. 定期清理无用的镜像和容器

### 测试阶段
1. 使用测试镜像进行质量检查
2. 自动化测试流程
3. 验证构建产物完整性

### 生产阶段
1. 使用多阶段构建优化镜像大小
2. 配置健康检查和监控
3. 设置资源限制和安全策略
4. 定期更新基础镜像

## 📞 技术支持

如遇到Docker部署问题：
1. 查看容器日志: `docker logs container-name`
2. 检查镜像构建: `docker build --no-cache`
3. 验证配置文件: `docker-compose config`
4. 联系技术支持: support@family-accounting.com

---

**Docker部署让您的应用更加便携和可靠！** 🐳🚀
