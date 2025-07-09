# 微信云托管 Dockerfile
# 基于 Node.js 18 官方镜像
FROM --platform=linux/amd64 node:18.20.8

# 设置工作目录
WORKDIR /app

# 安装系统依赖
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    && rm -rf /var/lib/apt/lists/*

# 复制 package.json 和 package-lock.json
COPY package*.json ./

# 安装依赖
RUN npm install --omit=dev && npm cache clean --force

# 复制应用代码
COPY . .

# 创建上传目录
RUN mkdir -p uploads

# 设置环境变量
ENV NODE_ENV=production
ENV PORT=80

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:80/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# 启动应用
CMD ["node", "index.js"] 

