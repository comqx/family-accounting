# 微信云托管部署解决方案

## 🎯 问题分析

根据错误日志分析，微信云托管平台遇到的问题：

1. **容器启动失败**：`cannot exec in a stopped state: unknown`
2. **生命周期钩子执行失败**：`/bin/sh /app/cert/initenv.sh`
3. **容器重启循环**：`Back-off restarting failed container`

**根本原因**：容器本身启动失败，导致生命周期钩子无法执行。

## 🛠️ 解决方案

### 专用镜像：`family-accounting:wechat`

针对微信云托管平台优化的Docker镜像，解决了以下问题：

#### ✅ 关键优化

1. **非root用户运行**：避免权限问题
2. **使用8080端口**：避免特权端口权限问题
3. **完整的启动检查**：确保构建文件存在
4. **详细的启动日志**：便于问题诊断
5. **兼容性脚本**：满足生命周期钩子要求

#### 📋 镜像特性

- **基础镜像**: `node:24-slim`
- **运行用户**: `appuser` (非root)
- **服务端口**: `8080`
- **兼容性脚本**: `/app/cert/initenv.sh`
- **启动脚本**: `/app/start.sh`
- **健康检查**: 内置HTTP健康检查

## 🚀 部署步骤

### 1. 构建镜像

```bash
# 在项目根目录执行
docker build -f Dockerfile.wechat -t family-accounting:wechat .
```

### 2. 推送到容器注册表

```bash
# 标记镜像
docker tag family-accounting:wechat your-registry/family-accounting:wechat

# 推送镜像
docker push your-registry/family-accounting:wechat
```

### 3. 微信云托管配置

在微信云托管平台配置：

- **镜像地址**: `your-registry/family-accounting:wechat`
- **容器端口**: `8080`
- **生命周期钩子**: `/bin/sh /app/cert/initenv.sh`
- **健康检查路径**: `/`

### 4. 资源配置建议

- **CPU**: 最小 0.5核，推荐 1核
- **内存**: 最小 512MB，推荐 1GB
- **磁盘**: 最小 1GB

## 🔍 验证方法

### 本地验证

```bash
# 1. 验证兼容性脚本
docker run --rm family-accounting:wechat /bin/sh /app/cert/initenv.sh

# 预期输出:
# 🔧 初始化环境脚本执行完成
# ✅ 家账通小程序环境准备就绪

# 2. 验证容器启动
docker run --rm -p 8080:8080 family-accounting:wechat

# 预期输出:
# 🚀 启动家账通小程序服务...
# ✅ 构建文件检查通过
# 📋 环境信息:
#   - Node.js版本: v24.3.0
#   - 工作目录: /app
#   - 用户: appuser
#   - 端口: 8080
# 🌟 启动HTTP服务器在端口8080...
# Starting up http-server, serving dist
```

### 微信云托管验证

部署成功后，应该看到：

1. ✅ 容器正常启动，无重启循环
2. ✅ 生命周期钩子成功执行
3. ✅ 服务在8080端口正常响应
4. ✅ 健康检查通过

## 🔧 故障排除

### 如果问题仍然存在

1. **检查镜像版本**
   ```bash
   # 确认使用的是正确的镜像
   docker images | grep family-accounting
   ```

2. **检查容器日志**
   - 在微信云托管控制台查看容器日志
   - 查找启动过程中的错误信息

3. **验证构建文件**
   ```bash
   # 检查镜像中的构建文件
   docker run --rm family-accounting:wechat ls -la dist/
   ```

4. **手动测试生命周期钩子**
   ```bash
   # 进入容器测试
   docker run --rm -it family-accounting:wechat sh
   /bin/sh /app/cert/initenv.sh
   ```

### 常见问题

**Q: 容器仍然启动失败？**
A: 检查微信云托管的资源限制，确保有足够的CPU和内存。

**Q: 生命周期钩子仍然失败？**
A: 确认微信云托管配置中的钩子路径是否正确：`/bin/sh /app/cert/initenv.sh`

**Q: 服务无法访问？**
A: 确认端口配置是否正确，容器端口应该是8080。

## 📞 技术支持

如果问题仍然存在，请提供：

1. 微信云托管的完整错误日志
2. 容器启动日志
3. 镜像构建日志
4. 微信云托管的配置截图

这将帮助进一步诊断和解决问题。
