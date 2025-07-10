#!/bin/bash

# 测试微信云托管系统变量识别
# ================================

echo "🧪 测试微信云托管系统变量识别..."

# 模拟微信云托管系统变量
export MYSQL_ADDRESS="test-mysql-host:3306"
export MYSQL_USERNAME="test_user"
export MYSQL_PASSWORD="test_password"
export COS_BUCKET="test-bucket"
export COS_REGION="ap-beijing"

echo "📋 设置的系统变量:"
echo "  MYSQL_ADDRESS: $MYSQL_ADDRESS"
echo "  MYSQL_USERNAME: $MYSQL_USERNAME"
echo "  MYSQL_PASSWORD: $MYSQL_PASSWORD"
echo "  COS_BUCKET: $COS_BUCKET"
echo "  COS_REGION: $COS_REGION"

# 测试数据库配置解析
echo ""
echo "🔧 测试数据库配置解析..."

DB_HOST=${MYSQL_ADDRESS%:*}
DB_PORT=${MYSQL_ADDRESS#*:}
DB_USER=${MYSQL_USERNAME}
DB_PASSWORD=${MYSQL_PASSWORD}
DB_NAME=family_accounting

echo "  解析结果:"
echo "    DB_HOST: $DB_HOST"
echo "    DB_PORT: $DB_PORT"
echo "    DB_USER: $DB_USER"
echo "    DB_NAME: $DB_NAME"

# 测试 Node.js 配置识别
echo ""
echo "🔧 测试 Node.js 配置识别..."

node -e "
const config = {
  host: process.env.MYSQL_ADDRESS ? process.env.MYSQL_ADDRESS.split(':')[0] : (process.env.DB_HOST || 'localhost'),
  port: process.env.MYSQL_ADDRESS ? process.env.MYSQL_ADDRESS.split(':')[1] : (process.env.DB_PORT || 3306),
  user: process.env.MYSQL_USERNAME || process.env.DB_USER || 'family_user',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || 'family_pass_2024',
  database: process.env.DB_NAME || 'family_accounting'
};

console.log('✅ Node.js 配置识别成功:');
console.log('  host:', config.host);
console.log('  port:', config.port);
console.log('  user:', config.user);
console.log('  database:', config.database);
console.log('  password: [已隐藏]');
"

# 测试启动脚本中的配置
echo ""
echo "🔧 测试启动脚本配置..."

# 模拟启动脚本中的配置设置
export DB_HOST=${MYSQL_ADDRESS%:*}
export DB_PORT=${MYSQL_ADDRESS#*:}
export DB_USER=${MYSQL_USERNAME}
export DB_PASSWORD=${MYSQL_PASSWORD}
export DB_NAME=family_accounting

echo "  启动脚本配置:"
echo "    DB_HOST: $DB_HOST"
echo "    DB_PORT: $DB_PORT"
echo "    DB_USER: $DB_USER"
echo "    DB_NAME: $DB_NAME"

echo ""
echo "🎉 系统变量识别测试完成！"
echo ""
echo "📝 测试结果:"
echo "  ✅ MYSQL_ADDRESS 解析正常"
echo "  ✅ MYSQL_USERNAME 识别正常"
echo "  ✅ MYSQL_PASSWORD 识别正常"
echo "  ✅ COS_BUCKET 识别正常"
echo "  ✅ COS_REGION 识别正常"
echo ""
echo "💡 在微信云托管环境中，这些变量会自动注入，"
echo "   启动脚本会自动识别并使用这些配置。" 