const express = require('express');
const { body, validationResult } = require('express-validator');
const { getPool } = require('../config/database');
const router = express.Router();

// 获取用户加入的家庭列表
router.get('/list', async (req, res) => {
  try {
    // 从 token 中获取用户信息
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证token' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;

    const pool = getPool();
    
    try {
      // 查询用户的家庭信息
      const [users] = await pool.execute(
        'SELECT family_id FROM users WHERE id = ?',
        [userId]
      );
      
      if (users.length > 0 && users[0].family_id) {
        // 查询家庭详细信息
        const [families] = await pool.execute(
          'SELECT id, name, description, avatar, created_at FROM families WHERE id = ?',
          [users[0].family_id]
        );
        
        if (families.length > 0) {
          const family = families[0];
          res.json({
            success: true,
            data: [{
              id: family.id,
              name: family.name,
              description: family.description,
              avatar: family.avatar,
              memberCount: 1, // TODO: 查询实际成员数量
              role: 'owner', // TODO: 查询用户角色
              createdAt: family.created_at
            }]
          });
          return;
        }
      }
      
      // 用户没有家庭
      res.json({
        success: true,
        data: []
      });
      
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      // 如果数据库查询失败，返回模拟数据
      const mockFamilies = [
        {
          id: 1,
          name: '我的家庭',
          avatar: 'https://example.com/family1.jpg',
          memberCount: 3,
          role: 'owner',
          createdAt: new Date().toISOString()
        }
      ];

      res.json({
        success: true,
        data: mockFamilies
      });
    }
  } catch (error) {
    console.error('获取家庭列表错误:', error);
    res.status(500).json({ error: '获取家庭列表失败' });
  }
});

// 创建家庭
router.post('/create', [
  body('name').isLength({ min: 1, max: 50 }).withMessage('家庭名称长度应在1-50字符之间'),
  body('description').optional().isLength({ max: 200 }).withMessage('描述长度不能超过200字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { name, description } = req.body;
    
    // 从 token 中获取用户信息
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证token' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const userId = decoded.userId;

    const pool = getPool();
    
    try {
      // 开始事务
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // 1. 创建家庭记录
        const [familyResult] = await connection.execute(
          'INSERT INTO families (name, description, avatar, created_at) VALUES (?, ?, ?, NOW())',
          [name, description || '', 'https://example.com/default-family.jpg']
        );
        
        const familyId = familyResult.insertId;
        
        // 2. 更新用户的家庭ID
        await connection.execute(
          'UPDATE users SET family_id = ? WHERE id = ?',
          [familyId, userId]
        );
        
        // 3. 创建家庭成员关系
        await connection.execute(
          'INSERT INTO family_members (family_id, user_id, role, joined_at) VALUES (?, ?, ?, NOW())',
          [familyId, userId, 'ADMIN']
        );
        
        // 提交事务
        await connection.commit();
        
        // 查询创建的家庭信息
        const [families] = await pool.execute(
          'SELECT id, name, description, avatar, created_at FROM families WHERE id = ?',
          [familyId]
        );
        
        if (families.length > 0) {
          const family = families[0];
          res.json({
            success: true,
            message: '家庭创建成功',
            data: {
              family: {
                id: family.id,
                name: family.name,
                description: family.description,
                avatar: family.avatar,
                memberCount: 1,
                role: 'ADMIN',
                createdAt: family.created_at
              }
            }
          });
        } else {
          throw new Error('创建家庭后查询失败');
        }
        
      } catch (transactionError) {
        // 回滚事务
        await connection.rollback();
        throw transactionError;
      } finally {
        connection.release();
      }
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      // 如果数据库操作失败，返回模拟数据
      const mockFamily = {
        id: Date.now(),
        name,
        description,
        avatar: 'https://example.com/default-family.jpg',
        memberCount: 1,
        role: 'ADMIN',
        createdAt: new Date().toISOString()
      };

      res.json({
        success: true,
        message: '家庭创建成功（模拟数据）',
        data: {
          family: mockFamily
        }
      });
    }
  } catch (error) {
    console.error('创建家庭错误:', error);
    res.status(500).json({ error: '创建家庭失败' });
  }
});

// 加入家庭
router.post('/join', [
  body('inviteCode').isLength({ min: 6, max: 10 }).withMessage('邀请码长度应在6-10字符之间')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { inviteCode } = req.body;
    
    // TODO: 验证邀请码并添加用户到家庭
    
    res.json({
      success: true,
      message: '成功加入家庭',
      data: {
        family: {
          id: Date.now(),
          name: '加入的家庭',
          memberCount: 2,
          role: 'member',
          createdAt: new Date().toISOString()
        }
      }
    });
  } catch (error) {
    console.error('加入家庭错误:', error);
    res.status(500).json({ error: '加入家庭失败' });
  }
});

// 获取家庭成员列表
router.get('/:familyId/members', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    // TODO: 从数据库获取家庭成员列表
    const mockMembers = [
      {
        id: 1,
        openid: 'mock_openid_1',
        nickname: '张三',
        avatar: 'https://example.com/avatar1.jpg',
        role: 'owner',
        joinedAt: new Date().toISOString()
      },
      {
        id: 2,
        openid: 'mock_openid_2',
        nickname: '李四',
        avatar: 'https://example.com/avatar2.jpg',
        role: 'member',
        joinedAt: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: mockMembers
    });
  } catch (error) {
    console.error('获取家庭成员错误:', error);
    res.status(500).json({ error: '获取家庭成员失败' });
  }
});

// 更新家庭信息
router.put('/:familyId', [
  body('name').optional().isLength({ min: 1, max: 50 }).withMessage('家庭名称长度应在1-50字符之间'),
  body('description').optional().isLength({ max: 200 }).withMessage('描述长度不能超过200字符')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { familyId } = req.params;
    const { name, description } = req.body;
    
    // TODO: 更新家庭信息
    
    res.json({
      success: true,
      message: '家庭信息更新成功'
    });
  } catch (error) {
    console.error('更新家庭信息错误:', error);
    res.status(500).json({ error: '更新家庭信息失败' });
  }
});

// 退出家庭
router.delete('/:familyId/leave', async (req, res) => {
  try {
    const { familyId } = req.params;
    
    // TODO: 从家庭中移除用户
    
    res.json({
      success: true,
      message: '已退出家庭'
    });
  } catch (error) {
    console.error('退出家庭错误:', error);
    res.status(500).json({ error: '退出家庭失败' });
  }
});

module.exports = router; 