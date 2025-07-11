const express = require('express');
const { getConnection } = require('../config/database');
const router = express.Router();

// 获取基础统计数据
router.get('/statistics', async (req, res) => {
  try {
    const { familyId, startDate, endDate, type } = req.query;
    
    if (!familyId) {
      return res.status(400).json({ error: '家庭ID不能为空' });
    }
    
    const pool = await getConnection();
    
    try {
      // 构建查询条件
      let whereConditions = ['family_id = ?'];
      let queryParams = [familyId];
      
      if (startDate) {
        whereConditions.push('date >= ?');
        queryParams.push(startDate);
      }
      
      if (endDate) {
        whereConditions.push('date <= ?');
        queryParams.push(endDate);
      }
      
      if (type) {
        whereConditions.push('type = ?');
        queryParams.push(type);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // 获取总收入和总支出
      const [totalStats] = await pool.execute(
        `SELECT 
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as totalIncome,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as totalExpense,
          COUNT(*) as totalRecords
         FROM records 
         WHERE ${whereClause}`,
        queryParams
      );
      
      const stats = {
        totalIncome: parseFloat(totalStats[0].totalIncome) || 0,
        totalExpense: parseFloat(totalStats[0].totalExpense) || 0,
        totalRecords: totalStats[0].totalRecords || 0,
        balance: (parseFloat(totalStats[0].totalIncome) || 0) - (parseFloat(totalStats[0].totalExpense) || 0)
      };

      res.json({
        success: true,
        data: stats
      });
      
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      res.status(500).json({ error: '获取统计数据失败' });
    }
    
  } catch (error) {
    console.error('获取统计数据错误:', error);
    res.status(500).json({ error: '获取统计数据失败' });
  }
});

// 获取分类统计
router.get('/categories', async (req, res) => {
  try {
    const { familyId, startDate, endDate, type, period = 'month' } = req.query;
    
    if (!familyId) {
      return res.status(400).json({ error: '家庭ID不能为空' });
    }
    
    const pool = await getConnection();
    
    try {
      // 构建查询条件
      let whereConditions = ['r.family_id = ?'];
      let queryParams = [familyId];
      
      if (startDate) {
        whereConditions.push('r.date >= ?');
        queryParams.push(startDate);
      }
      
      if (endDate) {
        whereConditions.push('r.date <= ?');
        queryParams.push(endDate);
      }
      
      if (type) {
        whereConditions.push('r.type = ?');
        queryParams.push(type);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // 获取分类统计
      const [categoryStats] = await pool.execute(
        `SELECT 
          c.id as categoryId,
          c.name as categoryName,
          c.icon as categoryIcon,
          c.color as categoryColor,
          COUNT(r.id) as count,
          SUM(r.amount) as amount
         FROM records r
         LEFT JOIN categories c ON r.category_id = c.id
         WHERE ${whereClause}
         GROUP BY c.id, c.name, c.icon, c.color
         ORDER BY amount DESC`,
        queryParams
      );
      
      const stats = categoryStats.map(stat => ({
        categoryId: stat.categoryId,
        categoryName: stat.categoryName,
        categoryIcon: stat.categoryIcon,
        categoryColor: stat.categoryColor,
        count: stat.count,
        amount: parseFloat(stat.amount) || 0
      }));

      res.json({
        success: true,
        data: stats
      });
      
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      res.status(500).json({ error: '获取分类统计失败' });
    }
    
  } catch (error) {
    console.error('获取分类统计错误:', error);
    res.status(500).json({ error: '获取分类统计失败' });
  }
});

// 获取趋势数据
router.get('/trends', async (req, res) => {
  try {
    const { familyId, startDate, endDate, type, period = 'day' } = req.query;
    
    if (!familyId) {
      return res.status(400).json({ error: '家庭ID不能为空' });
    }
    
    const pool = await getConnection();
    
    try {
      // 构建查询条件
      let whereConditions = ['family_id = ?'];
      let queryParams = [familyId];
      
      if (startDate) {
        whereConditions.push('date >= ?');
        queryParams.push(startDate);
      }
      
      if (endDate) {
        whereConditions.push('date <= ?');
        queryParams.push(endDate);
      }
      
      if (type) {
        whereConditions.push('type = ?');
        queryParams.push(type);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // 根据周期选择日期格式
      let dateFormat;
      switch (period) {
        case 'day':
          dateFormat = 'DATE(date)';
          break;
        case 'week':
          dateFormat = 'YEARWEEK(date)';
          break;
        case 'month':
          dateFormat = 'DATE_FORMAT(date, "%Y-%m")';
          break;
        case 'year':
          dateFormat = 'YEAR(date)';
          break;
        default:
          dateFormat = 'DATE(date)';
      }
      
      // 获取趋势数据
      const [trendData] = await pool.execute(
        `SELECT 
          ${dateFormat} as period,
          SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END) as income,
          SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) as expense,
          COUNT(*) as count
         FROM records 
         WHERE ${whereClause}
         GROUP BY ${dateFormat}
         ORDER BY period ASC`,
        queryParams
      );
      
      const trends = trendData.map(item => ({
        period: item.period,
        income: parseFloat(item.income) || 0,
        expense: parseFloat(item.expense) || 0,
        count: item.count,
        balance: (parseFloat(item.income) || 0) - (parseFloat(item.expense) || 0)
      }));

      res.json({
        success: true,
        data: trends
      });
      
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      res.status(500).json({ error: '获取趋势数据失败' });
    }
    
  } catch (error) {
    console.error('获取趋势数据错误:', error);
    res.status(500).json({ error: '获取趋势数据失败' });
  }
});

// 获取成员分析
router.get('/members', async (req, res) => {
  try {
    const { familyId, startDate, endDate } = req.query;
    
    if (!familyId) {
      return res.status(400).json({ error: '家庭ID不能为空' });
    }
    
    const pool = await getConnection();
    
    try {
      // 构建查询条件
      let whereConditions = ['r.family_id = ?'];
      let queryParams = [familyId];
      
      if (startDate) {
        whereConditions.push('r.date >= ?');
        queryParams.push(startDate);
      }
      
      if (endDate) {
        whereConditions.push('r.date <= ?');
        queryParams.push(endDate);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // 获取成员统计
      const [memberStats] = await pool.execute(
        `SELECT 
          u.id as userId,
          u.nickname,
          u.avatar,
          COUNT(r.id) as recordCount,
          SUM(CASE WHEN r.type = 'income' THEN r.amount ELSE 0 END) as totalIncome,
          SUM(CASE WHEN r.type = 'expense' THEN r.amount ELSE 0 END) as totalExpense
         FROM records r
         LEFT JOIN users u ON r.user_id = u.id
         WHERE ${whereClause}
         GROUP BY u.id, u.nickname, u.avatar
         ORDER BY totalExpense DESC`,
        queryParams
      );
      
      const members = memberStats.map(member => ({
        userId: member.userId,
        nickname: member.nickname,
        avatar: member.avatar,
        recordCount: member.recordCount,
        totalIncome: parseFloat(member.totalIncome) || 0,
        totalExpense: parseFloat(member.totalExpense) || 0,
        balance: (parseFloat(member.totalIncome) || 0) - (parseFloat(member.totalExpense) || 0)
      }));

      res.json({
        success: true,
        data: members
      });
      
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      res.status(500).json({ error: '获取成员分析失败' });
    }
    
  } catch (error) {
    console.error('获取成员分析错误:', error);
    res.status(500).json({ error: '获取成员分析失败' });
  }
});

module.exports = router; 