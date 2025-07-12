const express = require('express');
const { body, validationResult } = require('express-validator');
const { getConnection } = require('../config/database');
const router = express.Router();

// 获取家庭预算设置
router.get('/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    if (!familyId) {
      return res.status(400).json({ error: '家庭ID不能为空' });
    }
    
    // 从 token 中获取用户信息
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证token' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId || decoded.user_id || decoded.id;
    
    const pool = await getConnection();
    
    try {
      // 检查用户是否是家庭成员
      const [members] = await pool.execute(
        'SELECT role FROM family_members WHERE family_id = ? AND user_id = ?',
        [familyId, userId]
      );
      
      if (members.length === 0) {
        return res.status(403).json({ error: '您不是该家庭的成员' });
      }
      
      // 获取预算设置
      const [budgets] = await pool.execute(
        'SELECT * FROM family_budgets WHERE family_id = ? AND year = ? AND month = ?',
        [familyId, new Date().getFullYear(), new Date().getMonth() + 1]
      );
      
      let budget = null;
      if (budgets.length > 0) {
        budget = budgets[0];
      }
      
      // 获取本月支出统计
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      const [expenses] = await pool.execute(
        `SELECT SUM(amount) as totalExpense
         FROM records 
         WHERE family_id = ? AND type = 'expense' AND date >= ? AND date <= ?`,
        [familyId, startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0]]
      );
      
      const totalExpense = parseFloat(expenses[0].totalExpense) || 0;
      const monthlyBudget = budget ? parseFloat(budget.amount) : 0;
      const remainingBudget = Math.max(monthlyBudget - totalExpense, 0);
      const budgetProgress = monthlyBudget > 0 ? Math.round((totalExpense / monthlyBudget) * 100) : 0;
      
      res.json({
        success: true,
        data: {
          monthlyBudget,
          totalExpense,
          remainingBudget,
          budgetProgress,
          budgetAlerts: budget ? budget.alerts_enabled : false,
          alertThreshold: budget ? budget.alert_threshold : 80,
          dailyBudget: remainingBudget / Math.max(new Date().getDate(), 1)
        }
      });
      
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      res.status(500).json({ error: '获取预算信息失败' });
    }
    
  } catch (error) {
    console.error('获取预算信息错误:', error);
    res.status(500).json({ error: '获取预算信息失败' });
  }
});

// 设置家庭预算
router.post('/:familyId', [
  body('amount').isFloat({ min: 0 }).withMessage('预算金额必须大于0'),
  body('alertsEnabled').optional().isBoolean().withMessage('提醒设置必须是布尔值'),
  body('alertThreshold').optional().isInt({ min: 1, max: 100 }).withMessage('提醒阈值必须在1-100之间')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { familyId } = req.params;
    const { amount, alertsEnabled = true, alertThreshold = 80 } = req.body;
    
    // 从 token 中获取用户信息
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证token' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId || decoded.user_id || decoded.id;
    
    const pool = await getConnection();
    
    try {
      // 检查用户是否有权限设置预算
      const [members] = await pool.execute(
        'SELECT role FROM family_members WHERE family_id = ? AND user_id = ?',
        [familyId, userId]
      );
      
      if (members.length === 0) {
        return res.status(403).json({ error: '您不是该家庭的成员' });
      }
      
      const userRole = members[0].role;
      if (userRole !== 'ADMIN' && userRole !== 'owner') {
        return res.status(403).json({ error: '只有管理员可以设置预算' });
      }
      
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      // 检查是否已存在预算设置
      const [existingBudgets] = await pool.execute(
        'SELECT id FROM family_budgets WHERE family_id = ? AND year = ? AND month = ?',
        [familyId, year, month]
      );
      
      if (existingBudgets.length > 0) {
        // 更新现有预算
        await pool.execute(
          `UPDATE family_budgets 
           SET amount = ?, alerts_enabled = ?, alert_threshold = ?, updated_at = NOW()
           WHERE family_id = ? AND year = ? AND month = ?`,
          [amount, alertsEnabled, alertThreshold, familyId, year, month]
        );
      } else {
        // 创建新预算
        await pool.execute(
          `INSERT INTO family_budgets 
           (family_id, year, month, amount, alerts_enabled, alert_threshold, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [familyId, year, month, amount, alertsEnabled, alertThreshold, userId]
        );
      }
      
      res.json({
        success: true,
        message: '预算设置保存成功'
      });
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      res.status(500).json({ error: '设置预算失败' });
    }
    
  } catch (error) {
    console.error('设置预算错误:', error);
    res.status(500).json({ error: '设置预算失败' });
  }
});

// 获取分类预算
router.get('/:familyId/categories', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    if (!familyId) {
      return res.status(400).json({ error: '家庭ID不能为空' });
    }
    
    // 从 token 中获取用户信息
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证token' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId || decoded.user_id || decoded.id;
    
    const pool = await getConnection();
    
    try {
      // 检查用户是否是家庭成员
      const [members] = await pool.execute(
        'SELECT role FROM family_members WHERE family_id = ? AND user_id = ?',
        [familyId, userId]
      );
      
      if (members.length === 0) {
        return res.status(403).json({ error: '您不是该家庭的成员' });
      }
      
      const currentDate = new Date();
      const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
      const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
      
      // 获取分类预算和支出统计
      const [categoryBudgets] = await pool.execute(
        `SELECT 
          c.id as categoryId,
          c.name as categoryName,
          c.icon as categoryIcon,
          c.color as categoryColor,
          COALESCE(cb.amount, 0) as budget,
          COALESCE(expense_stats.totalExpense, 0) as used
         FROM categories c
         LEFT JOIN category_budgets cb ON c.id = cb.category_id 
           AND cb.family_id = ? 
           AND cb.year = ? 
           AND cb.month = ?
         LEFT JOIN (
           SELECT 
             category_id,
             SUM(amount) as totalExpense
           FROM records 
           WHERE family_id = ? 
             AND type = 'expense' 
             AND date >= ? 
             AND date <= ?
           GROUP BY category_id
         ) expense_stats ON c.id = expense_stats.category_id
         WHERE c.type = 'expense'
         ORDER BY used DESC`,
        [familyId, currentDate.getFullYear(), currentDate.getMonth() + 1, 
         familyId, startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0]]
      );
      
      const categoryList = categoryBudgets.map(cat => ({
        categoryId: cat.categoryId,
        name: cat.categoryName,
        icon: cat.categoryIcon,
        color: cat.categoryColor,
        budget: parseFloat(cat.budget),
        used: parseFloat(cat.used),
        remaining: Math.max(parseFloat(cat.budget) - parseFloat(cat.used), 0),
        progress: parseFloat(cat.budget) > 0 ? Math.round((parseFloat(cat.used) / parseFloat(cat.budget)) * 100) : 0
      }));
      
      res.json({
        success: true,
        data: categoryList
      });
      
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      res.status(500).json({ error: '获取分类预算失败' });
    }
    
  } catch (error) {
    console.error('获取分类预算错误:', error);
    res.status(500).json({ error: '获取分类预算失败' });
  }
});

// 设置分类预算
router.post('/:familyId/categories', [
  body('categoryId').isInt().withMessage('分类ID必须是整数'),
  body('amount').isFloat({ min: 0 }).withMessage('预算金额必须大于0')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { familyId } = req.params;
    const { categoryId, amount } = req.body;
    
    // 从 token 中获取用户信息
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证token' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId || decoded.user_id || decoded.id;
    
    const pool = await getConnection();
    
    try {
      // 检查用户是否有权限设置预算
      const [members] = await pool.execute(
        'SELECT role FROM family_members WHERE family_id = ? AND user_id = ?',
        [familyId, userId]
      );
      
      if (members.length === 0) {
        return res.status(403).json({ error: '您不是该家庭的成员' });
      }
      
      const userRole = members[0].role;
      if (userRole !== 'ADMIN' && userRole !== 'owner') {
        return res.status(403).json({ error: '只有管理员可以设置预算' });
      }
      
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      
      // 检查是否已存在分类预算
      const [existingBudgets] = await pool.execute(
        'SELECT id FROM category_budgets WHERE family_id = ? AND category_id = ? AND year = ? AND month = ?',
        [familyId, categoryId, year, month]
      );
      
      if (existingBudgets.length > 0) {
        // 更新现有预算
        await pool.execute(
          `UPDATE category_budgets 
           SET amount = ?, updated_at = NOW()
           WHERE family_id = ? AND category_id = ? AND year = ? AND month = ?`,
          [amount, familyId, categoryId, year, month]
        );
      } else {
        // 创建新预算
        await pool.execute(
          `INSERT INTO category_budgets 
           (family_id, category_id, year, month, amount, created_by, created_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [familyId, categoryId, year, month, amount, userId]
        );
      }
      
      res.json({
        success: true,
        message: '分类预算设置保存成功'
      });
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      res.status(500).json({ error: '设置分类预算失败' });
    }
    
  } catch (error) {
    console.error('设置分类预算错误:', error);
    res.status(500).json({ error: '设置分类预算失败' });
  }
});

// 获取预算历史
router.get('/:familyId/history', async (req, res) => {
  try {
    const { familyId } = req.params;
    const { limit = 12 } = req.query; // 默认获取12个月的历史
    
    if (!familyId) {
      return res.status(400).json({ error: '家庭ID不能为空' });
    }
    
    // 从 token 中获取用户信息
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证token' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId || decoded.user_id || decoded.id;
    
    const pool = await getConnection();
    
    try {
      // 检查用户是否是家庭成员
      const [members] = await pool.execute(
        'SELECT role FROM family_members WHERE family_id = ? AND user_id = ?',
        [familyId, userId]
      );
      
      if (members.length === 0) {
        return res.status(403).json({ error: '您不是该家庭的成员' });
      }
      
      // 获取预算历史
      const [budgetHistory] = await pool.execute(
        `SELECT 
          year,
          month,
          amount as budget,
          alerts_enabled,
          alert_threshold,
          created_at
         FROM family_budgets 
         WHERE family_id = ?
         ORDER BY year DESC, month DESC
         LIMIT ?`,
        [familyId, parseInt(limit)]
      );
      
      // 获取对应的支出数据
      const historyWithExpenses = await Promise.all(
        budgetHistory.map(async (budget) => {
          const startOfMonth = new Date(budget.year, budget.month - 1, 1);
          const endOfMonth = new Date(budget.year, budget.month, 0);
          
          const [expenses] = await pool.execute(
            `SELECT SUM(amount) as totalExpense
             FROM records 
             WHERE family_id = ? 
               AND type = 'expense' 
               AND date >= ? 
               AND date <= ?`,
            [familyId, startOfMonth.toISOString().split('T')[0], endOfMonth.toISOString().split('T')[0]]
          );
          
          const totalExpense = parseFloat(expenses[0].totalExpense) || 0;
          const budgetAmount = parseFloat(budget.budget);
          const progress = budgetAmount > 0 ? Math.round((totalExpense / budgetAmount) * 100) : 0;
          
          let status = 'normal';
          if (progress >= 100) {
            status = 'over';
          } else if (progress >= 80) {
            status = 'near';
          }
          
          return {
            year: budget.year,
            month: budget.month,
            monthName: `${budget.year}年${budget.month}月`,
            budget: budgetAmount,
            used: totalExpense,
            remaining: Math.max(budgetAmount - totalExpense, 0),
            progress,
            status,
            alertsEnabled: budget.alerts_enabled,
            alertThreshold: budget.alert_threshold,
            createdAt: budget.created_at
          };
        })
      );
      
      res.json({
        success: true,
        data: historyWithExpenses
      });
      
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      res.status(500).json({ error: '获取预算历史失败' });
    }
    
  } catch (error) {
    console.error('获取预算历史错误:', error);
    res.status(500).json({ error: '获取预算历史失败' });
  }
});

module.exports = router; 