# 家账通小程序 Dockerfile
FROM --platform=linux/amd64 node:18.20.8

WORKDIR /app

# 安装系统依赖和构建工具
RUN apt-get update && apt-get install -y \
    python3 \
    make \
    g++ \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

# 安装 pnpm
RUN npm install --global pnpm

# 设置npm配置，强制重新构建原生模块
ENV npm_config_target_platform=linux \
    npm_config_target_arch=x64 \
    npm_config_cache=/tmp/.npm \
    npm_config_build_from_source=true
# 复制源代码
COPY . .
# # 复制依赖文件并安装
# COPY package.json pnpm-lock.yaml ./
RUN pnpm install --no-frozen-lockfile



# 设置环境变量
ENV NODE_ENV=production \
    TARO_ENV=weapp \
    NODE_OPTIONS="--max-old-space-size=4096"

# 清理缓存并重新构建关键原生模块
RUN rm -rf node_modules/.cache && \
    rm -rf .taro_cache && \
    pnpm rebuild && \
    pnpm install --force @swc/core @tarojs/cli

# 构建小程序
RUN pnpm build:weapp

# 暴露开发端口（可选）
EXPOSE 10086

# 创建启动脚本
RUN echo '#!/bin/sh\n\
echo "🚀 家账通小程序启动中..."\n\
echo "📋 环境信息:"\n\
echo "   NODE_ENV: $NODE_ENV"\n\
echo "   TARO_ENV: $TARO_ENV"\n\
echo ""\n\
if [ "$START_MODE" = "dev" ]; then\n\
    echo "🔧 启动开发模式..."\n\
    exec pnpm dev:weapp\n\
elif [ "$START_MODE" = "build" ]; then\n\
    echo "🏗️ 重新构建..."\n\
    pnpm build:weapp\n\
    echo "✅ 构建完成，产物位于 dist/ 目录"\n\
    ls -la dist/\n\
    tail -f /dev/null\n\
else\n\
    echo "📦 生产模式 - 显示构建产物:"\n\
    ls -la dist/\n\
    echo ""\n\
    echo "💡 启动选项:"\n\
    echo "   开发模式: docker run -e START_MODE=dev -p 10086:10086 <image>"\n\
    echo "   重新构建: docker run -e START_MODE=build <image>"\n\
    echo "   生产模式: docker run <image> (当前模式)"\n\
    tail -f /dev/null\n\
fi' > /start.sh && chmod +x /start.sh

# 默认启动命令
CMD ["/start.sh"]
