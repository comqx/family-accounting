const { getConnection, ensureDatabase, checkTableExists } = require('../config/database');

// 表结构定义
const tableSchemas = {
  // 用户表
  users: `
    CREATE TABLE users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      openid VARCHAR(100) UNIQUE NOT NULL COMMENT '微信openid',
      unionid VARCHAR(100) UNIQUE COMMENT '微信unionid',
      nickname VARCHAR(50) NOT NULL COMMENT '用户昵称',
      avatar VARCHAR(500) COMMENT '头像URL',
      phone VARCHAR(20) COMMENT '手机号',
      email VARCHAR(100) COMMENT '邮箱',
      role ENUM('ADMIN', 'MEMBER', 'OBSERVER') DEFAULT 'MEMBER' COMMENT '用户角色',
      family_id INT COMMENT '所属家庭ID',
      status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '用户状态',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_openid (openid),
      INDEX idx_family_id (family_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='用户表'
  `,

  // 家庭表
  families: `
    CREATE TABLE families (
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(50) NOT NULL COMMENT '家庭名称',
      description TEXT COMMENT '家庭描述',
      avatar VARCHAR(500) COMMENT '家庭头像',
      admin_id INT NOT NULL COMMENT '管理员用户ID',
      invite_code VARCHAR(20) UNIQUE COMMENT '邀请码',
      invite_expire_time TIMESTAMP NULL COMMENT '邀请码过期时间',
      settings JSON COMMENT '家庭设置',
      status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '家庭状态',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_admin_id (admin_id),
      INDEX idx_invite_code (invite_code),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家庭表'
  `,

  // 家庭成员关系表
  family_members: `
    CREATE TABLE family_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      family_id INT NOT NULL COMMENT '家庭ID',
      user_id INT NOT NULL COMMENT '用户ID',
      role ENUM('ADMIN', 'MEMBER', 'OBSERVER') DEFAULT 'MEMBER' COMMENT '成员角色',
      joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '加入时间',
      status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '成员状态',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      UNIQUE KEY uk_family_user (family_id, user_id),
      INDEX idx_family_id (family_id),
      INDEX idx_user_id (user_id),
      INDEX idx_role (role),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='家庭成员关系表'
  `,

  // 分类表
  categories: `
    CREATE TABLE categories (
      id INT AUTO_INCREMENT PRIMARY KEY,
      family_id INT COMMENT '家庭ID，NULL表示系统默认分类',
      name VARCHAR(50) NOT NULL COMMENT '分类名称',
      icon VARCHAR(20) COMMENT '分类图标',
      type ENUM('expense', 'income') NOT NULL COMMENT '分类类型',
      color VARCHAR(20) DEFAULT '#666666' COMMENT '分类颜色',
      is_default BOOLEAN DEFAULT FALSE COMMENT '是否默认分类',
      sort_order INT DEFAULT 0 COMMENT '排序',
      status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '分类状态',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_family_id (family_id),
      INDEX idx_type (type),
      INDEX idx_is_default (is_default),
      INDEX idx_sort_order (sort_order),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分类表'
  `,

  // 记账记录表
  records: `
    CREATE TABLE records (
      id INT AUTO_INCREMENT PRIMARY KEY,
      family_id INT NOT NULL COMMENT '家庭ID',
      user_id INT NOT NULL COMMENT '用户ID',
      category_id INT NOT NULL COMMENT '分类ID',
      type ENUM('expense', 'income') NOT NULL COMMENT '记录类型',
      amount DECIMAL(10,2) NOT NULL COMMENT '金额',
      description VARCHAR(200) COMMENT '描述',
      date DATE NOT NULL COMMENT '记录日期',
      location VARCHAR(200) COMMENT '位置信息',
      tags JSON COMMENT '标签',
      attachments JSON COMMENT '附件信息',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_family_id (family_id),
      INDEX idx_user_id (user_id),
      INDEX idx_category_id (category_id),
      INDEX idx_type (type),
      INDEX idx_date (date),
      INDEX idx_created_at (created_at)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='记账记录表'
  `,

  // 预算表
  budgets: `
    CREATE TABLE budgets (
      id INT AUTO_INCREMENT PRIMARY KEY,
      family_id INT NOT NULL COMMENT '家庭ID',
      category_id INT COMMENT '分类ID，NULL表示总预算',
      year INT NOT NULL COMMENT '年份',
      month INT NOT NULL COMMENT '月份',
      amount DECIMAL(10,2) NOT NULL COMMENT '预算金额',
      spent DECIMAL(10,2) DEFAULT 0 COMMENT '已花费金额',
      status ENUM('ACTIVE', 'INACTIVE') DEFAULT 'ACTIVE' COMMENT '预算状态',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      UNIQUE KEY uk_family_category_year_month (family_id, category_id, year, month),
      INDEX idx_family_id (family_id),
      INDEX idx_category_id (category_id),
      INDEX idx_year_month (year, month),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='预算表'
  `,

  // 费用分摊表
  splits: `
    CREATE TABLE splits (
      id INT AUTO_INCREMENT PRIMARY KEY,
      family_id INT NOT NULL COMMENT '家庭ID',
      record_id INT NOT NULL COMMENT '记账记录ID',
      creator_id INT NOT NULL COMMENT '创建者ID',
      title VARCHAR(100) NOT NULL COMMENT '分摊标题',
      total_amount DECIMAL(10,2) NOT NULL COMMENT '总金额',
      description TEXT COMMENT '分摊描述',
      status ENUM('PENDING', 'APPROVED', 'REJECTED', 'COMPLETED') DEFAULT 'PENDING' COMMENT '分摊状态',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_family_id (family_id),
      INDEX idx_record_id (record_id),
      INDEX idx_creator_id (creator_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='费用分摊表'
  `,

  // 分摊成员表
  split_members: `
    CREATE TABLE split_members (
      id INT AUTO_INCREMENT PRIMARY KEY,
      split_id INT NOT NULL COMMENT '分摊ID',
      user_id INT NOT NULL COMMENT '用户ID',
      amount DECIMAL(10,2) NOT NULL COMMENT '分摊金额',
      status ENUM('PENDING', 'APPROVED', 'REJECTED', 'PAID') DEFAULT 'PENDING' COMMENT '分摊状态',
      paid_at TIMESTAMP NULL COMMENT '支付时间',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      UNIQUE KEY uk_split_user (split_id, user_id),
      INDEX idx_split_id (split_id),
      INDEX idx_user_id (user_id),
      INDEX idx_status (status)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='分摊成员表'
  `,

  // 系统配置表
  system_configs: `
    CREATE TABLE system_configs (
      id INT AUTO_INCREMENT PRIMARY KEY,
      config_key VARCHAR(100) UNIQUE NOT NULL COMMENT '配置键',
      config_value TEXT COMMENT '配置值',
      description VARCHAR(200) COMMENT '配置描述',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '更新时间',
      INDEX idx_config_key (config_key)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='系统配置表'
  `
};

// 初始数据
const initialData = {
  // 默认分类数据
  categories: [
    // 支出分类
    { name: '餐饮', icon: '🍽️', type: 'expense', color: '#FF6B6B', is_default: true, sort_order: 1 },
    { name: '交通', icon: '🚗', type: 'expense', color: '#4ECDC4', is_default: true, sort_order: 2 },
    { name: '购物', icon: '🛒', type: 'expense', color: '#45B7D1', is_default: true, sort_order: 3 },
    { name: '娱乐', icon: '🎮', type: 'expense', color: '#FFA07A', is_default: true, sort_order: 4 },
    { name: '医疗', icon: '🏥', type: 'expense', color: '#FF69B4', is_default: true, sort_order: 5 },
    { name: '教育', icon: '📚', type: 'expense', color: '#9370DB', is_default: true, sort_order: 6 },
    { name: '住房', icon: '🏠', type: 'expense', color: '#32CD32', is_default: true, sort_order: 7 },
    { name: '其他', icon: '📝', type: 'expense', color: '#808080', is_default: true, sort_order: 8 },
    
    // 收入分类
    { name: '工资', icon: '💰', type: 'income', color: '#96CEB4', is_default: true, sort_order: 1 },
    { name: '奖金', icon: '🎁', type: 'income', color: '#FFEAA7', is_default: true, sort_order: 2 },
    { name: '投资', icon: '📈', type: 'income', color: '#FFD93D', is_default: true, sort_order: 3 },
    { name: '兼职', icon: '💼', type: 'income', color: '#6C5CE7', is_default: true, sort_order: 4 },
    { name: '其他', icon: '📝', type: 'income', color: '#A8E6CF', is_default: true, sort_order: 5 }
  ],

  // 系统配置数据
  system_configs: [
    { config_key: 'app_version', config_value: '1.0.0', description: '应用版本号' },
    { config_key: 'default_currency', config_value: 'CNY', description: '默认货币' },
    { config_key: 'max_upload_size', config_value: '10485760', description: '最大上传文件大小(字节)' },
    { config_key: 'ocr_enabled', config_value: 'true', description: '是否启用OCR功能' }
  ]
};

// 创建表
const createTable = async (tableName, schema) => {
  try {
    const connection = await getConnection();
    await connection.execute(schema);
    console.log(`✅ 表 ${tableName} 创建成功`);
    return true;
  } catch (error) {
    console.error(`❌ 创建表 ${tableName} 失败:`, error.message);
    return false;
  }
};

// 插入初始数据
const insertInitialData = async () => {
  try {
    const connection = await getConnection();
    
    // 插入默认分类
    for (const category of initialData.categories) {
      await connection.execute(
        'INSERT INTO categories (name, icon, type, color, is_default, sort_order) VALUES (?, ?, ?, ?, ?, ?)',
        [category.name, category.icon, category.type, category.color, category.is_default, category.sort_order]
      );
    }
    console.log(`✅ 插入 ${initialData.categories.length} 个默认分类`);

    // 插入系统配置
    for (const config of initialData.system_configs) {
      await connection.execute(
        'INSERT INTO system_configs (config_key, config_value, description) VALUES (?, ?, ?)',
        [config.config_key, config.config_value, config.description]
      );
    }
    console.log(`✅ 插入 ${initialData.system_configs.length} 个系统配置`);

    return true;
  } catch (error) {
    console.error('❌ 插入初始数据失败:', error.message);
    return false;
  }
};

// 初始化数据库
const initDatabase = async () => {
  console.log('🚀 开始初始化数据库...');
  
  try {
    // 1. 确保数据库存在
    const dbExists = await ensureDatabase();
    if (!dbExists) {
      console.error('❌ 数据库创建失败');
      return false;
    }

    // 2. 创建表
    for (const [tableName, schema] of Object.entries(tableSchemas)) {
      const exists = await checkTableExists(tableName);
      if (!exists) {
        const success = await createTable(tableName, schema);
        if (!success) {
          console.error(`❌ 表 ${tableName} 创建失败，停止初始化`);
          return false;
        }
      } else {
        console.log(`📋 表 ${tableName} 已存在，跳过创建`);
      }
    }

    // 3. 检查是否需要插入初始数据
    const connection = await getConnection();
    const [categoryCount] = await connection.execute('SELECT COUNT(*) as count FROM categories');
    const [configCount] = await connection.execute('SELECT COUNT(*) as count FROM system_configs');

    if (categoryCount[0].count === 0 || configCount[0].count === 0) {
      console.log('📊 插入初始数据...');
      const success = await insertInitialData();
      if (!success) {
        console.error('❌ 初始数据插入失败');
        return false;
      }
    } else {
      console.log('📊 初始数据已存在，跳过插入');
    }

    console.log('✅ 数据库初始化完成');
    return true;
  } catch (error) {
    console.error('❌ 数据库初始化失败:', error.message);
    return false;
  }
};

// 如果直接运行此脚本
if (require.main === module) {
  initDatabase()
    .then(success => {
      if (success) {
        console.log('🎉 数据库初始化成功');
        process.exit(0);
      } else {
        console.error('💥 数据库初始化失败');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 数据库初始化异常:', error);
      process.exit(1);
    });
}

module.exports = {
  initDatabase,
  tableSchemas,
  initialData
}; 