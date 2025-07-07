#!/bin/sh

# 家账通小程序启动脚本

set -e

echo "🚀 启动家账通小程序..."

# 检查必要文件是否存在
if [ ! -f "/usr/share/nginx/html/app.js" ]; then
    echo "❌ 错误: app.js 文件不存在"
    exit 1
fi

if [ ! -f "/usr/share/nginx/html/app.json" ]; then
    echo "❌ 错误: app.json 文件不存在"
    exit 1
fi

echo "✅ 构建文件检查通过"

# 创建健康检查页面
cat > /usr/share/nginx/html/health.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Health Check</title>
</head>
<body>
    <h1>家账通小程序</h1>
    <p>状态: 运行正常</p>
    <p>时间: $(date)</p>
</body>
</html>
EOF

# 设置正确的文件权限
chown -R nginx:nginx /usr/share/nginx/html
chmod -R 644 /usr/share/nginx/html

# 测试 Nginx 配置
echo "🔧 测试 Nginx 配置..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx 配置测试通过"
else
    echo "❌ Nginx 配置测试失败"
    exit 1
fi

# 启动 Nginx
echo "🌟 启动 Nginx 服务..."
exec nginx -g "daemon off;"
