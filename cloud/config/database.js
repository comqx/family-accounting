const mysql = require('mysql2/promise');
require('dotenv').config();

// 数据库配置（优先使用微信云托管系统变量）
const dbConfig = {
  host: process.env.MYSQL_ADDRESS ? process.env.MYSQL_ADDRESS.split(':')[0] : (process.env.DB_HOST || 'localhost'),
  port: process.env.MYSQL_ADDRESS ? process.env.MYSQL_ADDRESS.split(':')[1] : (process.env.DB_PORT || 3306),
  user: process.env.MYSQL_USERNAME || process.env.DB_USER || 'family_user',
  password: process.env.MYSQL_PASSWORD || process.env.DB_PASSWORD || 'family_pass_2024',
  database: process.env.DB_NAME || 'family_accounting',
  charset: 'utf8mb4',
  timezone: '+08:00',
  // 连接池配置
  connectionLimit: 10,
  // 移除不支持的配置项
  // acquireTimeout: 60000,
  // timeout: 60000,
  // reconnect: true
};

// 创建连接池
let pool = null;

// 初始化数据库连接池
const initPool = () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    console.log('📦 数据库连接池已创建');
    console.log('🔧 数据库配置:', {
      host: dbConfig.host,
      port: dbConfig.port,
      user: dbConfig.user,
      database: dbConfig.database
    });
  }
  return pool;
};

// 获取数据库连接
const getConnection = async () => {
  if (!pool) {
    initPool();
  }
  return pool;
};

// 测试数据库连接
const testConnection = async () => {
  try {
    const connection = await getConnection();
    await connection.execute('SELECT 1');
    console.log('✅ 数据库连接测试成功');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error.message);
    return false;
  }
};

// 检查数据库是否存在，不存在则创建
const ensureDatabase = async () => {
  try {
    // 创建不指定数据库的连接
    const tempConfig = { ...dbConfig };
    delete tempConfig.database;
    
    const tempPool = mysql.createPool(tempConfig);
    const connection = await tempPool.getConnection();
    
    // 检查数据库是否存在
    const [rows] = await connection.execute(
      'SELECT SCHEMA_NAME FROM INFORMATION_SCHEMA.SCHEMATA WHERE SCHEMA_NAME = ?',
      [dbConfig.database]
    );
    
    if (rows.length === 0) {
      // 数据库不存在，创建数据库
      await connection.execute(`CREATE DATABASE \`${dbConfig.database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
      console.log(`📊 数据库 ${dbConfig.database} 创建成功`);
    } else {
      console.log(`📊 数据库 ${dbConfig.database} 已存在`);
    }
    
    connection.release();
    await tempPool.end();
    return true;
  } catch (error) {
    console.error('❌ 确保数据库存在失败:', error.message);
    return false;
  }
};

// 检查表是否存在
const checkTableExists = async (tableName) => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ? AND TABLE_NAME = ?',
      [dbConfig.database, tableName]
    );
    return rows.length > 0;
  } catch (error) {
    console.error(`❌ 检查表 ${tableName} 失败:`, error.message);
    return false;
  }
};

// 获取所有表名
const getAllTables = async () => {
  try {
    const connection = await getConnection();
    const [rows] = await connection.execute(
      'SELECT TABLE_NAME FROM INFORMATION_SCHEMA.TABLES WHERE TABLE_SCHEMA = ?',
      [dbConfig.database]
    );
    return rows.map(row => row.TABLE_NAME);
  } catch (error) {
    console.error('❌ 获取表列表失败:', error.message);
    return [];
  }
};

// 关闭连接池
const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('📦 数据库连接池已关闭');
  }
};

module.exports = {
  initPool,
  getConnection,
  testConnection,
  ensureDatabase,
  checkTableExists,
  getAllTables,
  closePool,
  dbConfig
}; 