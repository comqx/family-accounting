const { getConnection } = require('./config/database');

async function checkDatabaseRecords() {
  console.log('🔍 检查数据库记录...\n');
  
  let pool;
  try {
    // 获取数据库连接
    pool = await getConnection();
    console.log('✅ 数据库连接成功\n');

    // 1. 检查家庭表
    console.log('🏠 检查家庭表...');
    const [families] = await pool.execute('SELECT * FROM families LIMIT 5');
    console.log(`找到 ${families.length} 个家庭:`);
    families.forEach(family => {
      console.log(`  - ID: ${family.id}, 名称: ${family.name}, 管理员: ${family.admin_id}`);
    });

    // 2. 检查用户表
    console.log('\n👤 检查用户表...');
    const [users] = await pool.execute('SELECT * FROM users LIMIT 5');
    console.log(`找到 ${users.length} 个用户:`);
    users.forEach(user => {
      console.log(`  - ID: ${user.id}, 昵称: ${user.nickname}, 家庭ID: ${user.family_id}`);
    });

    // 3. 检查记录表
    console.log('\n📝 检查记录表...');
    const [records] = await pool.execute('SELECT * FROM records LIMIT 10');
    console.log(`找到 ${records.length} 条记录:`);
    records.forEach(record => {
      console.log(`  - ID: ${record.id}, 家庭ID: ${record.family_id}, 类型: ${record.type}, 金额: ${record.amount}, 日期: ${record.date}`);
    });

    // 4. 检查分类表
    console.log('\n📂 检查分类表...');
    const [categories] = await pool.execute('SELECT * FROM categories LIMIT 10');
    console.log(`找到 ${categories.length} 个分类:`);
    categories.forEach(category => {
      console.log(`  - ID: ${category.id}, 名称: ${category.name}, 类型: ${category.type}`);
    });

    // 5. 按家庭ID统计记录
    console.log('\n📊 按家庭ID统计记录...');
    const [recordStats] = await pool.execute(`
      SELECT 
        family_id,
        COUNT(*) as total_records,
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as total_income,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as total_expense
      FROM records 
      GROUP BY family_id
    `);
    console.log('各家庭记录统计:');
    recordStats.forEach(stat => {
      console.log(`  - 家庭ID: ${stat.family_id}, 记录数: ${stat.total_records}, 收入: ${stat.total_income}, 支出: ${stat.total_expense}`);
    });

    // 6. 检查最近的记录
    console.log('\n📅 检查最近的记录...');
    const [recentRecords] = await pool.execute(`
      SELECT r.*, c.name as category_name, u.nickname as user_name
      FROM records r
      LEFT JOIN categories c ON r.category_id = c.id
      LEFT JOIN users u ON r.user_id = u.id
      ORDER BY r.created_at DESC
      LIMIT 5
    `);
    console.log('最近5条记录:');
    recentRecords.forEach(record => {
      console.log(`  - ID: ${record.id}, 家庭: ${record.family_id}, 用户: ${record.user_name}, 分类: ${record.category_name}, 类型: ${record.type}, 金额: ${record.amount}, 日期: ${record.date}`);
    });

    // 7. 测试报表查询
    console.log('\n📈 测试报表查询...');
    const [reportStats] = await pool.execute(`
      SELECT 
        SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
        SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpense,
        COUNT(*) as totalRecords
      FROM records 
      WHERE family_id = 1
    `);
    console.log('家庭ID=1的报表统计:');
    console.log(`  - 总收入: ${reportStats[0].totalIncome}`);
    console.log(`  - 总支出: ${reportStats[0].totalExpense}`);
    console.log(`  - 记录数: ${reportStats[0].totalRecords}`);

  } catch (error) {
    console.error('❌ 数据库检查失败:', error.message);
    console.error('错误详情:', error);
  } finally {
    if (pool) {
      console.log('\n🔌 数据库连接已关闭');
    }
  }
}

// 运行检查
checkDatabaseRecords(); 