#!/bin/bash

# 测试项目配置
# ================================

echo "🧪 测试项目配置..."

# 检查必要文件是否存在
required_files=(
    "index.js"
    "package.json"
    "scripts/create-database.js"
    "scripts/db-manager.js"
    "config/database.js"
    "utils/database.js"
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
    npm run 2>/dev/null | grep -E "(start|db|docker|test)" || echo "  无相关脚本"
fi

# 检查 SQL 文件
if [ -f "scripts/create-tables.sql" ]; then
    echo "✅ SQL 文件存在: scripts/create-tables.sql"
else
    echo "⚠️  SQL 文件不存在: scripts/create-tables.sql"
fi

echo ""
echo "🎉 项目配置测试完成！"
echo ""
echo "📝 使用方法:"
echo "  npm start                    # 启动应用"
echo "  npm run dev                  # 开发模式"
echo "  npm run db:create            # 创建数据库"
echo "  docker build -t app .        # 构建 Docker 镜像"
echo "  docker run app               # 运行 Docker 容器"
echo ""
echo "📚 更多信息请查看:"
echo "  QUICKSTART.md                # 快速启动指南"
echo "  README-DATABASE.md           # 数据库初始化指南"
echo "  scripts/README-SQL.md        # SQL 文件使用说明" 