const { getConnection } = require('./config/database');

async function testCloudDatabase() {
  try {
    console.log('🔍 测试云端数据库状态...');
    
    const pool = await getConnection();
    console.log('✅ 云端数据库连接成功');
    
    // 测试基本查询
    const [testResult] = await pool.execute('SELECT 1 as test');
    console.log('✅ 基本查询测试成功:', testResult);
    
    // 检查数据库中的所有表
    const [tables] = await pool.execute('SHOW TABLES');
    console.log('📋 数据库中的所有表:');
    tables.forEach(table => {
      console.log(`  ${Object.values(table)[0]}`);
    });
    
    // 检查categories表是否存在
    const categoriesTableExists = tables.some(table => 
      Object.values(table)[0] === 'categories'
    );
    
    if (categoriesTableExists) {
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
        const [sampleCategories] = await pool.execute('SELECT id, name, type, icon FROM categories LIMIT 5');
        console.log('📝 示例分类数据:');
        sampleCategories.forEach(cat => {
          console.log(`  ${cat.id}. ${cat.icon} ${cat.name} (${cat.type})`);
        });
      } else {
        console.log('⚠️ categories表为空');
      }
    } else {
      console.log('❌ categories表不存在');
    }
    
  } catch (error) {
    console.error('❌ 云端数据库测试失败:', error);
    console.error('错误详情:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage,
      message: error.message
    });
  }
}

testCloudDatabase(); 