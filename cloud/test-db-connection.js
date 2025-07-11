const { getConnection } = require('./config/database');

async function testDatabaseConnection() {
  try {
    console.log('🔍 测试数据库连接...');
    
    const pool = await getConnection();
    console.log('✅ 数据库连接池创建成功');
    
    // 测试简单查询
    const [result] = await pool.execute('SELECT 1 as test');
    console.log('✅ 数据库查询测试成功:', result);
    
    // 检查categories表是否存在
    const [tables] = await pool.execute('SHOW TABLES LIKE "categories"');
    if (tables.length > 0) {
      console.log('✅ categories表存在');
      
      // 检查categories表结构
      const [columns] = await pool.execute('DESCRIBE categories');
      console.log('📋 categories表结构:');
      columns.forEach(col => {
        console.log(`  ${col.Field}: ${col.Type} ${col.Null === 'YES' ? 'NULL' : 'NOT NULL'}`);
      });
      
      // 检查categories表数据
      const [categories] = await pool.execute('SELECT COUNT(*) as count FROM categories');
      console.log(`📊 categories表记录数: ${categories[0].count}`);
      
      if (categories[0].count > 0) {
        const [sampleCategories] = await pool.execute('SELECT id, name, type FROM categories LIMIT 5');
        console.log('📝 示例分类数据:');
        sampleCategories.forEach(cat => {
          console.log(`  ${cat.id}. ${cat.name} (${cat.type})`);
        });
      } else {
        console.log('⚠️ categories表为空，需要初始化默认分类');
      }
    } else {
      console.log('❌ categories表不存在');
    }
    
    // 检查其他相关表
    const [allTables] = await pool.execute('SHOW TABLES');
    console.log('📋 数据库中的所有表:');
    allTables.forEach(table => {
      console.log(`  ${Object.values(table)[0]}`);
    });
    
  } catch (error) {
    console.error('❌ 数据库连接测试失败:', error);
    console.error('错误详情:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
  }
}

testDatabaseConnection(); 