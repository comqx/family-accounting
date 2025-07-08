#!/bin/bash

# 微信云托管专用启动脚本

set -e

echo "🚀 启动家账通小程序服务..."

# 检查构建文件
if [ ! -f "dist/app.js" ]; then
    echo "❌ 错误: dist/app.js 文件不存在"
    exit 1
fi

if [ ! -f "dist/app.json" ]; then
    echo "❌ 错误: dist/app.json 文件不存在"
    exit 1
fi

echo "✅ 构建文件检查通过"

# 显示环境信息
echo "📋 环境信息:"
echo "  - Node.js版本: $(node --version)"
echo "  - 工作目录: $(pwd)"
echo "  - 用户: $(whoami)"
echo "  - 端口: 8080"

# 启动服务
echo "🌟 启动HTTP服务器在端口8080..."
exec http-server dist -p 8080 -c-1 --cors
