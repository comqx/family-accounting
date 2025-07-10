#!/bin/bash

# 家账通云托管服务启动脚本
# ================================

set -e

echo "🚀 家账通云托管服务启动中..."
echo "📍 当前目录: $(pwd)"
echo "🌍 环境: ${NODE_ENV:-production}"

# 设置数据库配置（使用微信云托管系统变量）
export DB_HOST=${MYSQL_ADDRESS%:*}
export DB_PORT=${MYSQL_ADDRESS#*:}
export DB_USER=${MYSQL_USERNAME}
export DB_PASSWORD=${MYSQL_PASSWORD}
export DB_NAME=family_accounting

echo "📊 数据库: ${DB_HOST}:${DB_PORT}/${DB_NAME}"
echo "👤 数据库用户: ${DB_USER}"

# 等待数据库启动
wait_for_database() {
    echo "⏳ 等待数据库启动..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo "🔍 尝试连接数据库 (${attempt}/${max_attempts})..."
        
        if node -e "
            const mysql = require('mysql2/promise');
            const config = {
                host: process.env.DB_HOST || 'localhost',
                port: process.env.DB_PORT || 3306,
                user: process.env.DB_USER || 'family_user',
                password: process.env.DB_PASSWORD || 'family_pass_2024',
                database: process.env.DB_NAME || 'family_accounting'
            };
            
            console.log('🔧 数据库配置:', {
                host: config.host,
                port: config.port,
                user: config.user,
                database: config.database
            });
            
            mysql.createConnection(config)
                .then(conn => {
                    console.log('✅ 数据库连接成功');
                    conn.end();
                    process.exit(0);
                })
                .catch(err => {
                    console.log('❌ 数据库连接失败:', err.message);
                    process.exit(1);
                });
        " 2>/dev/null; then
            echo "✅ 数据库已就绪"
            return 0
        fi
        
        echo "⏳ 等待 5 秒后重试..."
        sleep 5
        attempt=$((attempt + 1))
    done
    
    echo "❌ 数据库连接超时，启动失败"
    return 1
}

# 确保数据库存在
ensure_database_exists() {
    echo "🔧 确保数据库存在..."
    
    if node scripts/create-database.js; then
        echo "✅ 数据库检查/创建成功"
        return 0
    else
        echo "❌ 数据库检查/创建失败"
        return 1
    fi
}

# 主启动流程
main() {
    echo "=========================================="
    echo "🏠 家账通云托管服务启动脚本"
    echo "=========================================="
    
    # 1. 等待数据库启动
    if ! wait_for_database; then
        echo "💥 数据库连接失败，退出启动"
        exit 1
    fi
    
    # 2. 确保数据库存在
    if ! ensure_database_exists; then
        echo "💥 数据库创建失败，退出启动"
        exit 1
    fi
    
    # 3. 启动应用
    echo "🚀 启动应用服务..."
    echo "📍 服务地址: http://0.0.0.0:${PORT:-80}"
    echo "🔍 健康检查: http://0.0.0.0:${PORT:-80}/health"
    echo "=========================================="
    
    # 启动 Node.js 应用
    exec node index.js
}

# 处理信号
trap 'echo "🛑 收到停止信号，正在关闭服务..."; exit 0' SIGTERM SIGINT

# 运行主函数
main "$@" 