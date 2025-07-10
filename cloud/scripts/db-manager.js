#!/usr/bin/env node

const { initDatabase, tableSchemas } = require('./init-database');
const { testConnection, getAllTables, closePool } = require('../config/database');
const DatabaseUtils = require('../utils/database');

// 命令行参数处理
const args = process.argv.slice(2);
const command = args[0];

// 显示帮助信息
const showHelp = () => {
  console.log(`
🔧 家账通数据库管理工具

用法: node scripts/db-manager.js <命令> [选项]

命令:
  init     初始化数据库（创建表和初始数据）
  status   查看数据库状态
  reset    重置数据库（删除所有表并重新创建）
  backup   备份数据库
  restore  恢复数据库
  help     显示此帮助信息

示例:
  node scripts/db-manager.js init
  node scripts/db-manager.js status
  node scripts/db-manager.js reset
  `);
};

// 查看数据库状态
const showStatus = async () => {
  try {
    console.log('📊 检查数据库状态...\n');
    
    // 测试连接
    const connected = await testConnection();
    if (!connected) {
      console.log('❌ 数据库连接失败');
      return;
    }
    console.log('✅ 数据库连接正常');
    
    // 获取所有表
    const tables = await getAllTables();
    console.log(`📋 数据库表数量: ${tables.length}`);
    
    if (tables.length > 0) {
      console.log('📋 现有表:');
      tables.forEach(table => {
        console.log(`  - ${table}`);
      });
    }
    
    // 检查关键表的数据
    const keyTables = ['users', 'families', 'categories', 'records', 'system_configs'];
    for (const table of keyTables) {
      if (tables.includes(table)) {
        const count = await DatabaseUtils.count(table);
        console.log(`📈 ${table} 表记录数: ${count}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 获取数据库状态失败:', error.message);
  }
};

// 重置数据库
const resetDatabase = async () => {
  try {
    console.log('⚠️  警告: 这将删除所有数据并重新创建表结构！');
    console.log('按 Ctrl+C 取消，或等待 5 秒后继续...');
    
    // 等待5秒
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    console.log('🗑️  开始重置数据库...');
    
    const connection = await require('../config/database').getConnection();
    
    // 获取所有表
    const tables = await getAllTables();
    
    // 删除所有表（按依赖关系排序）
    const dropOrder = [
      'split_members',
      'splits', 
      'budgets',
      'records',
      'family_members',
      'families',
      'categories',
      'users',
      'system_configs'
    ];
    
    for (const table of dropOrder) {
      if (tables.includes(table)) {
        await connection.execute(`DROP TABLE IF EXISTS ${table}`);
        console.log(`🗑️  删除表: ${table}`);
      }
    }
    
    // 重新初始化
    const success = await initDatabase();
    if (success) {
      console.log('✅ 数据库重置完成');
    } else {
      console.error('❌ 数据库重置失败');
    }
    
  } catch (error) {
    console.error('❌ 重置数据库失败:', error.message);
  }
};

// 备份数据库
const backupDatabase = async () => {
  try {
    console.log('💾 开始备份数据库...');
    
    const { dbConfig } = require('../config/database');
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup-${timestamp}.sql`;
    
    // 这里可以集成 mysqldump 命令
    // 由于在容器环境中，这里只是示例
    console.log(`📁 备份文件: ${backupFile}`);
    console.log('💡 提示: 在生产环境中，建议使用 mysqldump 工具进行完整备份');
    
  } catch (error) {
    console.error('❌ 备份数据库失败:', error.message);
  }
};

// 恢复数据库
const restoreDatabase = async () => {
  try {
    console.log('📥 开始恢复数据库...');
    
    const backupFile = args[1];
    if (!backupFile) {
      console.error('❌ 请指定备份文件路径');
      console.log('用法: node scripts/db-manager.js restore <备份文件>');
      return;
    }
    
    console.log(`📁 恢复文件: ${backupFile}`);
    console.log('💡 提示: 在生产环境中，建议使用 mysql 命令进行完整恢复');
    
  } catch (error) {
    console.error('❌ 恢复数据库失败:', error.message);
  }
};

// 主函数
const main = async () => {
  try {
    switch (command) {
      case 'init':
        console.log('🚀 初始化数据库...');
        const success = await initDatabase();
        if (success) {
          console.log('✅ 数据库初始化成功');
        } else {
          console.error('❌ 数据库初始化失败');
          process.exit(1);
        }
        break;
        
      case 'status':
        await showStatus();
        break;
        
      case 'reset':
        await resetDatabase();
        break;
        
      case 'backup':
        await backupDatabase();
        break;
        
      case 'restore':
        await restoreDatabase();
        break;
        
      case 'help':
      case '--help':
      case '-h':
        showHelp();
        break;
        
      default:
        console.error('❌ 未知命令:', command);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error('💥 执行失败:', error.message);
    process.exit(1);
  } finally {
    await closePool();
  }
};

// 运行主函数
if (require.main === module) {
  main();
} 