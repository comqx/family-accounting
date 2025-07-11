const express = require('express');
const { body, validationResult } = require('express-validator');
const { getConnection } = require('../config/database');
const router = express.Router();

// 创建分摊记录
router.post('/create', [
  body('originalRecordId').isInt().withMessage('原记录ID必须是整数'),
  body('familyId').isInt().withMessage('家庭ID必须是整数'),
  body('totalAmount').isFloat({ min: 0 }).withMessage('总金额必须大于0'),
  body('splitType').isIn(['EQUAL', 'PERCENTAGE', 'AMOUNT', 'CUSTOM']).withMessage('分摊类型无效'),
  body('participants').isArray({ min: 1 }).withMessage('参与者不能为空'),
  body('description').optional().isString().withMessage('描述必须是字符串')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { originalRecordId, familyId, totalAmount, splitType, participants, description } = req.body;
    
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
      // 开始事务
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // 1. 创建分摊记录
        const [splitResult] = await connection.execute(
          'INSERT INTO split_records (original_record_id, family_id, total_amount, split_type, description, status, created_by) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [originalRecordId, familyId, totalAmount, splitType, description || '', 'PENDING', userId]
        );
        
        const splitId = splitResult.insertId;
        
        // 2. 创建分摊参与者记录
        for (const participant of participants) {
          await connection.execute(
            'INSERT INTO split_participants (split_id, user_id, amount, percentage, status) VALUES (?, ?, ?, ?, ?)',
            [splitId, participant.userId, participant.amount, participant.percentage || 0, 'PENDING']
          );
        }
        
        await connection.commit();
        
        res.json({
          success: true,
          data: {
            id: splitId,
            originalRecordId,
            familyId,
            totalAmount,
            splitType,
            participants,
            description,
            status: 'PENDING',
            createdBy: userId,
            createdAt: new Date()
          }
        });
        
      } catch (dbError) {
        await connection.rollback();
        throw dbError;
      } finally {
        connection.release();
      }
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      res.status(500).json({ error: '创建分摊记录失败' });
    }
    
  } catch (error) {
    console.error('创建分摊记录错误:', error);
    res.status(500).json({ error: '创建分摊记录失败' });
  }
});

// 获取分摊记录列表
router.get('/list', async (req, res) => {
  try {
    const { familyId, status } = req.query;
    
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
      let whereConditions = ['sr.family_id = ?'];
      let queryParams = [familyId];
      
      if (status) {
        whereConditions.push('sr.status = ?');
        queryParams.push(status);
      }
      
      const whereClause = whereConditions.join(' AND ');
      
      // 获取分摊记录列表
      const [splits] = await pool.execute(
        `SELECT sr.*, r.amount as original_amount, r.description as original_description, r.date as original_date,
                c.name as category_name, c.icon as category_icon, c.color as category_color
         FROM split_records sr
         LEFT JOIN records r ON sr.original_record_id = r.id
         LEFT JOIN categories c ON r.category_id = c.id
         WHERE ${whereClause}
         ORDER BY sr.created_at DESC`,
        queryParams
      );
      
      // 获取每个分摊的参与者信息
      const splitRecords = [];
      for (const split of splits) {
        const [participants] = await pool.execute(
          `SELECT sp.*, u.nickname, u.avatar
           FROM split_participants sp
           LEFT JOIN users u ON sp.user_id = u.id
           WHERE sp.split_id = ?`,
          [split.id]
        );
        
        splitRecords.push({
          id: split.id,
          originalRecordId: split.original_record_id,
          familyId: split.family_id,
          totalAmount: split.total_amount,
          splitType: split.split_type,
          description: split.description,
          status: split.status,
          createdBy: split.created_by,
          createdAt: split.created_at,
          originalRecord: {
            amount: split.original_amount,
            description: split.original_description,
            date: split.original_date,
            category: {
              name: split.category_name,
              icon: split.category_icon,
              color: split.category_color
            }
          },
          participants: participants.map(p => ({
            userId: p.user_id,
            nickName: p.nickname,
            avatarUrl: p.avatar,
            amount: p.amount,
            percentage: p.percentage,
            status: p.status
          }))
        });
      }
      
      res.json({
        success: true,
        data: splitRecords
      });
      
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      res.status(500).json({ error: '获取分摊记录失败' });
    }
    
  } catch (error) {
    console.error('获取分摊记录错误:', error);
    res.status(500).json({ error: '获取分摊记录失败' });
  }
});

// 获取分摊详情
router.get('/:splitId', async (req, res) => {
  try {
    const { splitId } = req.params;
    
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
      // 获取分摊记录详情
      const [splits] = await pool.execute(
        `SELECT sr.*, r.amount as original_amount, r.description as original_description, r.date as original_date,
                c.name as category_name, c.icon as category_icon, c.color as category_color
         FROM split_records sr
         LEFT JOIN records r ON sr.original_record_id = r.id
         LEFT JOIN categories c ON r.category_id = c.id
         WHERE sr.id = ?`,
        [splitId]
      );
      
      if (splits.length === 0) {
        return res.status(404).json({ error: '分摊记录不存在' });
      }
      
      const split = splits[0];
      
      // 获取参与者信息
      const [participants] = await pool.execute(
        `SELECT sp.*, u.nickname, u.avatar
         FROM split_participants sp
         LEFT JOIN users u ON sp.user_id = u.id
         WHERE sp.split_id = ?`,
        [splitId]
      );
      
      const splitDetail = {
        id: split.id,
        originalRecordId: split.original_record_id,
        familyId: split.family_id,
        totalAmount: split.total_amount,
        splitType: split.split_type,
        description: split.description,
        status: split.status,
        createdBy: split.created_by,
        createdAt: split.created_at,
        originalRecord: {
          amount: split.original_amount,
          description: split.original_description,
          date: split.original_date,
          category: {
            name: split.category_name,
            icon: split.category_icon,
            color: split.category_color
          }
        },
        participants: participants.map(p => ({
          userId: p.user_id,
          nickName: p.nickname,
          avatarUrl: p.avatar,
          amount: p.amount,
          percentage: p.percentage,
          status: p.status
        }))
      };
      
      res.json({
        success: true,
        data: splitDetail
      });
      
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      res.status(500).json({ error: '获取分摊详情失败' });
    }
    
  } catch (error) {
    console.error('获取分摊详情错误:', error);
    res.status(500).json({ error: '获取分摊详情失败' });
  }
});

// 确认分摊
router.post('/:splitId/confirm', [
  body('userId').isInt().withMessage('用户ID必须是整数')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { splitId } = req.params;
    const { userId } = req.body;
    
    const pool = await getConnection();
    
    try {
      // 更新参与者状态
      await pool.execute(
        'UPDATE split_participants SET status = ? WHERE split_id = ? AND user_id = ?',
        ['CONFIRMED', splitId, userId]
      );
      
      // 检查是否所有参与者都已确认
      const [participants] = await pool.execute(
        'SELECT status FROM split_participants WHERE split_id = ?',
        [splitId]
      );
      
      const allConfirmed = participants.every(p => p.status === 'CONFIRMED');
      
      if (allConfirmed) {
        // 更新分摊记录状态为已确认
        await pool.execute(
          'UPDATE split_records SET status = ? WHERE id = ?',
          ['CONFIRMED', splitId]
        );
      }
      
      res.json({
        success: true,
        data: { allConfirmed }
      });
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      res.status(500).json({ error: '确认分摊失败' });
    }
    
  } catch (error) {
    console.error('确认分摊错误:', error);
    res.status(500).json({ error: '确认分摊失败' });
  }
});

// 拒绝分摊
router.post('/:splitId/decline', [
  body('userId').isInt().withMessage('用户ID必须是整数'),
  body('reason').optional().isString().withMessage('拒绝原因必须是字符串')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { splitId } = req.params;
    const { userId, reason } = req.body;
    
    const pool = await getConnection();
    
    try {
      // 更新参与者状态为拒绝
      await pool.execute(
        'UPDATE split_participants SET status = ? WHERE split_id = ? AND user_id = ?',
        ['DECLINED', splitId, userId]
      );
      
      // 更新分摊记录状态为拒绝
      await pool.execute(
        'UPDATE split_records SET status = ? WHERE id = ?',
        ['DECLINED', splitId]
      );
      
      res.json({
        success: true,
        data: { message: '分摊已拒绝' }
      });
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      res.status(500).json({ error: '拒绝分摊失败' });
    }
    
  } catch (error) {
    console.error('拒绝分摊错误:', error);
    res.status(500).json({ error: '拒绝分摊失败' });
  }
});

// 结算分摊
router.post('/:splitId/settle', [
  body('userId').isInt().withMessage('用户ID必须是整数')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { splitId } = req.params;
    const { userId } = req.body;
    
    const pool = await getConnection();
    
    try {
      // 更新参与者状态为已结算
      await pool.execute(
        'UPDATE split_participants SET status = ? WHERE split_id = ? AND user_id = ?',
        ['SETTLED', splitId, userId]
      );
      
      // 检查是否所有参与者都已结算
      const [participants] = await pool.execute(
        'SELECT status FROM split_participants WHERE split_id = ?',
        [splitId]
      );
      
      const allSettled = participants.every(p => p.status === 'SETTLED');
      
      if (allSettled) {
        // 更新分摊记录状态为已结算
        await pool.execute(
          'UPDATE split_records SET status = ? WHERE id = ?',
          ['SETTLED', splitId]
        );
      }
      
      res.json({
        success: true,
        data: { allSettled }
      });
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      res.status(500).json({ error: '结算分摊失败' });
    }
    
  } catch (error) {
    console.error('结算分摊错误:', error);
    res.status(500).json({ error: '结算分摊失败' });
  }
});

module.exports = router; 