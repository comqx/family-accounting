const express = require('express');
const { body, validationResult } = require('express-validator');
const { getConnection } = require('../config/database');
const router = express.Router();

// 获取用户信息
router.get('/profile', async (req, res) => {
  try {
    // 从 token 中获取用户信息
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证token' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;

    const pool = await getConnection();
    
    try {
      // 从数据库获取用户信息
      const [users] = await pool.execute(
        'SELECT id, openid, nickname, avatar, phone, email, created_at, updated_at FROM users WHERE id = ?',
        [userId]
      );
      
      if (users.length === 0) {
        return res.status(404).json({ error: '用户不存在' });
      }
      
      const user = users[0];
      
      res.json({
        success: true,
        data: {
          id: user.id,
          openid: user.openid,
          nickname: user.nickname,
          avatar: user.avatar,
          phone: user.phone,
          email: user.email,
          createdAt: user.created_at,
          updatedAt: user.updated_at
        }
      });
      
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      res.status(500).json({ error: '获取用户信息失败' });
    }
    
  } catch (error) {
    console.error('获取用户信息错误:', error);
    res.status(500).json({ error: '获取用户信息失败' });
  }
});

// 更新用户信息
router.put('/profile', [
  body('nickname').optional().isLength({ min: 1, max: 50 }).withMessage('昵称长度应在1-50字符之间'),
  body('phone').optional().isMobilePhone('zh-CN').withMessage('手机号格式不正确'),
  body('email').optional().isEmail().withMessage('邮箱格式不正确')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { nickname, phone, email } = req.body;
    
    // 从 token 中获取用户信息
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证token' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;

    const pool = await getConnection();
    
    try {
      // 构建更新字段
      const updateFields = [];
      const updateValues = [];
      
      if (nickname !== undefined) {
        updateFields.push('nickname = ?');
        updateValues.push(nickname);
      }
      
      if (phone !== undefined) {
        updateFields.push('phone = ?');
        updateValues.push(phone);
      }
      
      if (email !== undefined) {
        updateFields.push('email = ?');
        updateValues.push(email);
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({ error: '没有提供要更新的字段' });
      }
      
      updateFields.push('updated_at = NOW()');
      updateValues.push(userId);
      
      // 更新数据库中的用户信息
      await pool.execute(
        `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      res.json({
        success: true,
        message: '用户信息更新成功',
        data: { nickname, phone, email }
      });
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      res.status(500).json({ error: '更新用户信息失败' });
    }
    
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ error: '更新用户信息失败' });
  }
});

// 获取用户统计信息
router.get('/stats', async (req, res) => {
  try {
    // 从 token 中获取用户信息
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证token' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;

    const pool = await getConnection();
    
    try {
      // 获取用户的总记录数和总金额
      const [totalStats] = await pool.execute(
        'SELECT COUNT(*) as totalRecords, SUM(amount) as totalAmount FROM records WHERE user_id = ?',
        [userId]
      );
      
      // 获取本月的记录数和金额
      const currentMonth = new Date().toISOString().substring(0, 7);
      const [monthStats] = await pool.execute(
        'SELECT COUNT(*) as thisMonthRecords, SUM(amount) as thisMonthAmount FROM records WHERE user_id = ? AND DATE_FORMAT(date, "%Y-%m") = ?',
        [userId, currentMonth]
      );
      
      // 获取分类统计
      const [categoryStats] = await pool.execute(
        `SELECT c.name, COUNT(r.id) as count, SUM(r.amount) as amount
         FROM records r
         LEFT JOIN categories c ON r.category_id = c.id
         WHERE r.user_id = ?
         GROUP BY c.id, c.name
         ORDER BY amount DESC
         LIMIT 10`,
        [userId]
      );
      
      const stats = {
        totalRecords: totalStats[0].totalRecords || 0,
        totalAmount: parseFloat(totalStats[0].totalAmount) || 0,
        thisMonthRecords: monthStats[0].thisMonthRecords || 0,
        thisMonthAmount: parseFloat(monthStats[0].thisMonthAmount) || 0,
        categories: categoryStats.map(cat => ({
          name: cat.name,
          count: cat.count,
          amount: parseFloat(cat.amount) || 0
        }))
      };

      res.json({
        success: true,
        data: stats
      });
      
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      res.status(500).json({ error: '获取统计信息失败' });
    }
    
  } catch (error) {
    console.error('获取用户统计错误:', error);
    res.status(500).json({ error: '获取统计信息失败' });
  }
});

// 删除用户账户
router.delete('/account', async (req, res) => {
  try {
    // TODO: 删除用户账户及相关数据
    
    res.json({
      success: true,
      message: '账户删除成功'
    });
  } catch (error) {
    console.error('删除账户错误:', error);
    res.status(500).json({ error: '删除账户失败' });
  }
});

module.exports = router; 