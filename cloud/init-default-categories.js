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

async function initDefaultCategories() {
  try {
    console.log('开始初始化默认分类...');
    
    const pool = await getConnection();
    
    // 检查是否已有分类
    const [existingCategories] = await pool.execute('SELECT COUNT(*) as count FROM categories');
    
    if (existingCategories[0].count > 0) {
      console.log(`数据库中已有 ${existingCategories[0].count} 个分类，跳过初始化`);
      return;
    }
    
    // 插入默认分类
    for (const category of defaultCategories) {
      await pool.execute(
        'INSERT INTO categories (name, icon, type, color, is_default, sort, family_id) VALUES (?, ?, ?, ?, ?, ?, ?)',
        [category.name, category.icon, category.type, category.color, category.is_default, category.sort, null]
      );
    }
    
    console.log(`成功创建 ${defaultCategories.length} 个默认分类`);
    
    // 显示创建的分类
    const [categories] = await pool.execute('SELECT id, name, type, icon FROM categories ORDER BY type, sort');
    console.log('创建的分类列表:');
    categories.forEach(cat => {
      console.log(`  ${cat.id}. ${cat.icon} ${cat.name} (${cat.type})`);
    });
    
  } catch (error) {
    console.error('初始化默认分类失败:', error);
  }
}

// 运行初始化
initDefaultCategories(); 