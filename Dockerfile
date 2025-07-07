# 家账通小程序 Dockerfile
# 用于构建和部署小程序项目

# 使用官方 Node.js 18 Alpine 镜像作为基础镜像
FROM node:18-alpine AS base

# 设置工作目录
WORKDIR /app

# 安装 pnpm
RUN npm install -g pnpm

# 复制 package.json 和 pnpm-lock.yaml
COPY package.json pnpm-lock.yaml ./

# 安装依赖
RUN pnpm install --frozen-lockfile

# 构建阶段
FROM base AS builder

# 复制源代码
COPY . .

# 设置环境变量
ENV NODE_ENV=production

# 构建项目
RUN pnpm build:weapp

# 生产阶段
FROM nginx:alpine AS production

# 安装必要的工具
RUN apk add --no-cache curl

# 创建应用目录
RUN mkdir -p /app

# 复制构建产物
COPY --from=builder /app/dist /usr/share/nginx/html

# 复制 Nginx 配置
COPY docker/nginx.conf /etc/nginx/nginx.conf

# 复制启动脚本
COPY docker/start.sh /start.sh
RUN chmod +x /start.sh

# 暴露端口
EXPOSE 80

# 健康检查
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# 启动命令
CMD ["/start.sh"]

# 开发环境阶段
FROM base AS development

# 安装开发依赖
RUN pnpm install

# 复制源代码
COPY . .

# 暴露开发服务器端口
EXPOSE 10086

# 启动开发服务器
CMD ["pnpm", "dev:weapp"]

# 测试阶段
FROM base AS test

# 复制源代码
COPY . .

# 运行简化质量检查
RUN pnpm quality-check:simple

# 构建测试
RUN pnpm build:weapp

# 验证构建产物
RUN test -f dist/app.js || exit 1
RUN test -f dist/app.json || exit 1
RUN test -f dist/app.wxss || exit 1

CMD ["echo", "All tests passed!"]
