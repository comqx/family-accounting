const { getConnection } = require('./config/database');

// 默认分类数据
const defaultCategories = [
  // 支出分类
  { name: '餐饮', icon: '🍽️', type: 'expense', color: '#FF6B6B', is_default: 1, sort: 1 },
  { name: '交通', icon: '🚗', type: 'expense', color: '#4ECDC4', is_default: 1, sort: 2 },
  { name: '购物', icon: '🛒', type: 'expense', color: '#45B7D1', is_default: 1, sort: 3 },
  { name: '娱乐', icon: '🎮', type: 'expense', color: '#96CEB4', is_default: 1, sort: 4 },
  { name: '医疗', icon: '🏥', type: 'expense', color: '#FFEAA7', is_default: 1, sort: 5 },
  { name: '教育', icon: '📚', type: 'expense', color: '#DDA0DD', is_default: 1, sort: 6 },
  { name: '住房', icon: '🏠', type: 'expense', color: '#98D8C8', is_default: 1, sort: 7 },
  { name: '其他', icon: '📝', type: 'expense', color: '#666666', is_default: 1, sort: 8 },
  
  // 收入分类
  { name: '工资', icon: '💰', type: 'income', color: '#96CEB4', is_default: 1, sort: 1 },
  { name: '奖金', icon: '🎁', type: 'income', color: '#FFEAA7', is_default: 1, sort: 2 },
  { name: '投资', icon: '📈', type: 'income', color: '#4ECDC4', is_default: 1, sort: 3 },
  { name: '兼职', icon: '💼', type: 'income', color: '#45B7D1', is_default: 1, sort: 4 },
  { name: '其他', icon: '📝', type: 'income', color: '#666666', is_default: 1, sort: 5 }
];

async function initCategoriesOnCloud() {
  try {
    console.log('🚀 开始初始化云端默认分类...');
    
    // 使用云端数据库配置
    const pool = await getConnection();
    console.log('✅ 云端数据库连接成功');
    
    // 检查是否已有分类
    const [existingCategories] = await pool.execute('SELECT COUNT(*) as count FROM categories');
    console.log(`📊 当前分类数量: ${existingCategories[0].count}`);
    
    if (existingCategories[0].count > 0) {
      console.log('⚠️ 数据库中已有分类，跳过初始化');
      
      // 显示现有分类
      const [categories] = await pool.execute('SELECT id, name, type, icon FROM categories ORDER BY type, sort');
      console.log('📝 现有分类列表:');
      categories.forEach(cat => {
        console.log(`  ${cat.id}. ${cat.icon} ${cat.name} (${cat.type})`);
      });
      return;
    }
    
    console.log('📝 开始创建默认分类...');
    
    // 插入默认分类
    for (const category of defaultCategories) {
      await pool.execute(
        'INSERT INTO categories (name, icon, type, color, is_default, sort, family_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [category.name, category.icon, category.type, category.color, category.is_default, category.sort, null]
      );
      console.log(`✅ 创建分类: ${category.icon} ${category.name} (${category.type})`);
    }
    
    console.log(`🎉 成功创建 ${defaultCategories.length} 个默认分类`);
    
    // 验证创建结果
    const [categories] = await pool.execute('SELECT id, name, type, icon FROM categories ORDER BY type, sort');
    console.log('📋 最终分类列表:');
    categories.forEach(cat => {
      console.log(`  ${cat.id}. ${cat.icon} ${cat.name} (${cat.type})`);
    });
    
  } catch (error) {
    console.error('❌ 初始化云端分类失败:', error);
    console.error('错误详情:', {
      code: error.code,
      errno: error.errno,
      sqlState: error.sqlState,
      sqlMessage: error.sqlMessage
    });
  }
}

// 运行初始化
initCategoriesOnCloud(); 