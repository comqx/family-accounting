# 家账通小程序部署解决方案

## 🎯 问题解决

本解决方案专门解决部署平台生命周期钩子兼容性问题：
- ✅ 解决 `/bin/sh /app/cert/initenv.sh` 生命周期钩子执行失败
- ✅ 统一使用80端口
- ✅ 容器启动稳定性优化
- ✅ 包含健康检查机制

## 📦 镜像版本

### 推荐使用：`family-accounting:final`

**特性：**
- 🔧 包含兼容性初始化脚本：`/app/cert/initenv.sh`
- 🌐 服务运行在标准HTTP端口：80
- 🏥 内置健康检查
- 📦 基于Node.js 24-slim，体积优化
- 🚀 使用http-server提供静态文件服务

## 🚀 部署方法

### 方法1：直接使用Docker镜像

```bash
# 构建镜像
docker build -f Dockerfile.simple -t family-accounting:final .

# 运行容器（本地测试）
docker run -d -p 8080:80 --name family-accounting family-accounting:final

# 推送到容器注册表
docker tag family-accounting:final your-registry/family-accounting:latest
docker push your-registry/family-accounting:latest
```

### 方法2：使用Docker Compose

```bash
# 启动服务
docker-compose up -d

# 查看状态
docker-compose ps

# 查看日志
docker-compose logs -f family-accounting-app
```

## 🔧 配置详情

### 端口配置
- **容器内端口**: 80
- **服务协议**: HTTP
- **健康检查**: `http://localhost:80/`

### 生命周期钩子
- **脚本路径**: `/app/cert/initenv.sh`
- **执行命令**: `/bin/sh /app/cert/initenv.sh`
- **功能**: 输出初始化完成信息并正常退出

### 文件结构
```
/app/
├── cert/
│   └── initenv.sh          # 兼容性初始化脚本
├── dist/                   # 构建产物
│   ├── app.js
│   ├── app.json
│   ├── app.wxss
│   └── ...
└── node_modules/           # 依赖包
```

## ✅ 验证方法

### 1. 验证兼容性脚本
```bash
docker run --rm family-accounting:final /bin/sh /app/cert/initenv.sh
```
**预期输出:**
```
🔧 初始化环境脚本执行完成
✅ 家账通小程序环境准备就绪
```

### 2. 验证服务启动
```bash
docker run --rm -p 8080:80 family-accounting:final
```
**预期输出:**
```
Starting up http-server, serving dist
Available on:
  http://127.0.0.1:80
```

### 3. 验证健康检查
```bash
curl http://localhost:8080/
```

## 🔍 故障排除

### 如果容器仍然启动失败：

1. **检查资源限制**
   - 确保容器有足够的CPU和内存
   - 建议最小配置：CPU 0.5核，内存 512MB

2. **检查部署平台配置**
   - 确认生命周期钩子路径：`/bin/sh /app/cert/initenv.sh`
   - 确认端口映射：容器端口80

3. **查看详细日志**
   ```bash
   docker logs container-name
   ```

4. **进入容器调试**
   ```bash
   docker exec -it container-name sh
   ls -la /app/cert/
   /bin/sh /app/cert/initenv.sh
   ```

## 📋 部署清单

- [ ] 构建镜像：`family-accounting:final`
- [ ] 推送到容器注册表
- [ ] 更新部署配置使用新镜像
- [ ] 确认端口配置：80
- [ ] 确认生命周期钩子：`/bin/sh /app/cert/initenv.sh`
- [ ] 验证容器启动成功
- [ ] 验证服务可访问

## 🎉 预期结果

部署成功后：
- ✅ 容器正常启动，无重启循环
- ✅ 生命周期钩子成功执行
- ✅ 服务在80端口正常提供服务
- ✅ 健康检查通过
- ✅ 小程序静态资源正常访问
