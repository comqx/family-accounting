#!/usr/bin/env node

const { testConnection, getAllTables, closePool } = require('../config/database');
const DatabaseUtils = require('../utils/database');

// 测试数据库功能
const testDatabase = async () => {
  console.log('🧪 开始测试数据库功能...\n');
  
  try {
    // 1. 测试连接
    console.log('1️⃣ 测试数据库连接...');
    const connected = await testConnection();
    if (!connected) {
      console.log('❌ 数据库连接失败');
      return false;
    }
    console.log('✅ 数据库连接成功\n');
    
    // 2. 获取表列表
    console.log('2️⃣ 获取数据库表列表...');
    const tables = await getAllTables();
    console.log(`📋 发现 ${tables.length} 个表:`);
    tables.forEach(table => {
      console.log(`   - ${table}`);
    });
    console.log();
    
    // 3. 测试查询功能
    console.log('3️⃣ 测试查询功能...');
    const categories = await DatabaseUtils.query('SELECT * FROM categories LIMIT 5');
    console.log(`📊 查询到 ${categories.length} 个分类:`);
    categories.forEach(cat => {
      console.log(`   - ${cat.name} (${cat.type}) ${cat.icon}`);
    });
    console.log();
    
    // 4. 测试配置功能
    console.log('4️⃣ 测试配置功能...');
    const appVersion = await DatabaseUtils.getConfig('app_version');
    const currency = await DatabaseUtils.getConfig('default_currency');
    console.log(`📋 应用版本: ${appVersion}`);
    console.log(`💰 默认货币: ${currency}`);
    console.log();
    
    // 5. 测试统计功能
    console.log('5️⃣ 测试统计功能...');
    const userCount = await DatabaseUtils.count('users');
    const familyCount = await DatabaseUtils.count('families');
    const recordCount = await DatabaseUtils.count('records');
    console.log(`👥 用户数量: ${userCount}`);
    console.log(`🏠 家庭数量: ${familyCount}`);
    console.log(`📝 记录数量: ${recordCount}`);
    console.log();
    
    console.log('✅ 所有测试通过！');
    return true;
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    return false;
  }
};

// 运行测试
if (require.main === module) {
  testDatabase()
    .then(success => {
      if (success) {
        console.log('🎉 数据库测试成功');
        process.exit(0);
      } else {
        console.error('💥 数据库测试失败');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 测试异常:', error);
      process.exit(1);
    })
    .finally(async () => {
      await closePool();
    });
}

module.exports = { testDatabase }; 