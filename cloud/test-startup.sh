#!/bin/bash

# 测试启动脚本功能
# ================================

echo "🧪 测试启动脚本功能..."

# 检查启动脚本是否存在
if [ ! -f "start.sh" ]; then
    echo "❌ 启动脚本 start.sh 不存在"
    exit 1
fi

# 检查启动脚本权限
if [ ! -x "start.sh" ]; then
    echo "❌ 启动脚本没有执行权限"
    echo "请运行: chmod +x start.sh"
    exit 1
fi

echo "✅ 启动脚本存在且有执行权限"

# 检查必要的脚本文件
required_files=(
    "scripts/init-database.js"
    "scripts/db-manager.js"
    "config/database.js"
    "utils/database.js"
    "index.js"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ 必要文件不存在: $file"
        exit 1
    fi
done

echo "✅ 所有必要文件都存在"

# 检查环境变量文件
if [ ! -f ".env" ]; then
    echo "⚠️  环境变量文件 .env 不存在，将使用默认配置"
    echo "建议创建 .env 文件并配置数据库连接信息"
fi

# 检查 package.json 中的脚本
if [ -f "package.json" ]; then
    echo "📋 可用的 npm 脚本:"
    npm run 2>/dev/null | grep -E "(start|db|docker)" || echo "  无相关脚本"
fi

echo ""
echo "🎉 启动脚本测试完成！"
echo ""
echo "📝 使用方法:"
echo "  ./start.sh                    # 直接运行启动脚本"
echo "  npm run start:with-init       # 通过 npm 运行"
echo "  docker build -t app .         # 构建 Docker 镜像"
echo "  docker run app                # 运行 Docker 容器"
echo ""
echo "📚 更多信息请查看:"
echo "  QUICKSTART.md                 # 快速启动指南"
echo "  README-DATABASE.md            # 数据库初始化指南" 