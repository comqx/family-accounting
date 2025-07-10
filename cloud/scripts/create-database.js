#!/usr/bin/env node

/**
 * 数据库创建脚本
 * 用于在微信云托管环境中创建数据库
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库配置（优先使用微信云托管系统变量）
const dbConfig = {
  host: process.env.MYSQL_ADDRESS ? process.env.MYSQL_ADDRESS.split(':')[0] : (process.env.DB_HOST || 'localhost'),
  port: process.env.MYSQL_ADDRESS ? process.env.MYSQL_ADDRESS.split(':')[1] : (process.env.DB_PORT || 3306),
  user: process.env.MYSQL_USERNAME || process.env.DB_USER || 'family_user',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || 'family_pass_2024',
  database: process.env.DB_NAME || 'family_accounting'
};

console.log('🚀 开始创建数据库...');
console.log('🔧 数据库配置:', {
  host: dbConfig.host,
  port: dbConfig.port,
  user: dbConfig.user,
  database: dbConfig.database
});

async function createDatabase() {
  let connection = null;
  
  try {
    // 1. 创建不指定数据库的连接
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;
    
    console.log('🔧 创建临时连接...');
    connection = await mysql.createConnection(tempConfig);
    
    // 2. 检查数据库是否存在
    console.log(`🔍 检查数据库 ${dbConfig.database} 是否存在...`);
    const [rows] = await connection.execute(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [dbConfig.database]
    );
    
    if (rows.length === 0) {
      // 3. 数据库不存在，创建数据库
      console.log(`📊 数据库 ${dbConfig.database} 不存在，开始创建...`);
      await connection.execute(`CREATE DATABASE \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`✅ 数据库 ${dbConfig.database} 创建成功`);
    } else {
      console.log(`📊 数据库 ${dbConfig.database} 已存在`);
    }
    
    // 4. 测试连接到新创建的数据库
    console.log('🔍 测试连接到新数据库...');
    await connection.end();
    
    connection = await mysql.createConnection(dbConfig);
    await connection.execute('SELECT 1');
    console.log('✅ 数据库连接测试成功');
    
    // 5. 显示数据库信息
    const [dbInfo] = await connection.execute('SELECT DATABASE() as current_db');
    console.log(`📊 当前数据库: ${dbInfo[0].current_db}`);
    
    const [charsetInfo] = await connection.execute('SHOW VARIABLES LIKE "character_set_database"');
    console.log(`🔤 数据库字符集: ${charsetInfo[0].Value}`);
    
    await connection.end();
    console.log('🎉 数据库创建和测试完成');
    return true;
    
  } catch (error) {
    console.error('❌ 数据库创建失败:', error.message);
    console.error('❌ 错误详情:', error);
    
    if (connection) {
      try {
        await connection.end();
      } catch (e) {
        console.error('❌ 关闭连接失败:', e.message);
      }
    }
    
    return false;
  }
}

// 如果直接运行此脚本
if (require.main === module) {
  createDatabase()
    .then(success => {
      if (success) {
        console.log('🎉 数据库创建成功');
        process.exit(0);
      } else {
        console.error('💥 数据库创建失败');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 数据库创建异常:', error);
      process.exit(1);
    });
}

module.exports = {
  createDatabase,
  dbConfig
}; 