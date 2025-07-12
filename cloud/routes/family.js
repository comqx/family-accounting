const express = require('express');
const { body, validationResult } = require('express-validator');
const { getConnection } = require('../config/database');
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
    // 兼容不同的字段名
    const userId = decoded.userId || decoded.user_id || decoded.id;

    const pool = await getConnection();
    
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
      res.status(500).json({ error: '获取家庭列表失败' });
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
    // 兼容不同的字段名
    const userId = decoded.userId || decoded.user_id || decoded.id;

    const pool = await getConnection();
    
    try {
      // 开始事务
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // 1. 创建家庭记录
        const [familyResult] = await connection.execute(
          'INSERT INTO families (name, description, avatar, admin_id) VALUES (?, ?, ?, ?)',
          [name, description || '', 'https://example.com/default-family.jpg', userId]
        );
        
        const familyId = familyResult.insertId;
        
        // 2. 更新用户的家庭ID
        await connection.execute(
          'UPDATE users SET family_id = ? WHERE id = ?',
          [familyId, userId]
        );
        
        // 3. 创建家庭成员关系
        await connection.execute(
          'INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)',
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
      res.status(500).json({ error: '创建家庭失败' });
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
    
    if (!familyId) {
      return res.status(400).json({ error: '家庭ID不能为空' });
    }
    
    const pool = await getConnection();
    
    try {
      // 查询家庭成员
      const [members] = await pool.execute(
        `SELECT 
          u.id,
          u.openid,
          u.nickname,
          u.avatar,
          fm.role,
          fm.created_at as joinTime
         FROM family_members fm
         LEFT JOIN users u ON fm.user_id = u.id
         WHERE fm.family_id = ?
         ORDER BY fm.created_at ASC`,
        [familyId]
      );
      
      const memberList = members.map(member => ({
        id: member.id,
        openid: member.openid,
        nickname: member.nickname,
        avatar: member.avatar,
        role: member.role,
        joinTime: member.joinTime
      }));

      res.json({
        success: true,
        data: memberList
      });
      
    } catch (dbError) {
      console.error('数据库查询错误:', dbError);
      res.status(500).json({ error: '获取家庭成员失败' });
    }
    
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
      // 检查用户是否有权限更新家庭信息
      const [members] = await pool.execute(
        'SELECT role FROM family_members WHERE family_id = ? AND user_id = ?',
        [familyId, userId]
      );
      
      if (members.length === 0) {
        return res.status(403).json({ error: '您不是该家庭的成员' });
      }
      
      const userRole = members[0].role;
      if (userRole !== 'ADMIN' && userRole !== 'owner') {
        return res.status(403).json({ error: '只有管理员可以更新家庭信息' });
      }
      
      // 更新家庭信息
      const updateFields = [];
      const updateValues = [];
      
      if (name !== undefined) {
        updateFields.push('name = ?');
        updateValues.push(name);
      }
      
      if (description !== undefined) {
        updateFields.push('description = ?');
        updateValues.push(description);
      }
      
      if (updateFields.length === 0) {
        return res.status(400).json({ error: '没有提供要更新的字段' });
      }
      
      updateValues.push(familyId);
      
      await pool.execute(
        `UPDATE families SET ${updateFields.join(', ')} WHERE id = ?`,
        updateValues
      );
      
      // 查询更新后的家庭信息
      const [families] = await pool.execute(
        'SELECT id, name, description, avatar, created_at FROM families WHERE id = ?',
        [familyId]
      );
      
      if (families.length > 0) {
        const family = families[0];
        res.json({
          success: true,
          message: '家庭信息更新成功',
          data: {
            id: family.id,
            name: family.name,
            description: family.description,
            avatar: family.avatar,
            createdAt: family.created_at
          }
        });
      } else {
        res.status(404).json({ error: '家庭不存在' });
      }
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      res.status(500).json({ error: '更新家庭信息失败' });
    }
    
  } catch (error) {
    console.error('更新家庭信息错误:', error);
    res.status(500).json({ error: '更新家庭信息失败' });
  }
});

// 生成邀请码
router.post('/:familyId/invite', async (req, res) => {
  try {
    const { familyId } = req.params;
    
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
      // 检查用户是否有权限生成邀请码
      const [members] = await pool.execute(
        'SELECT role FROM family_members WHERE family_id = ? AND user_id = ?',
        [familyId, userId]
      );
      
      if (members.length === 0) {
        return res.status(403).json({ error: '您不是该家庭的成员' });
      }
      
      const userRole = members[0].role;
      if (userRole !== 'ADMIN' && userRole !== 'owner') {
        return res.status(403).json({ error: '只有管理员可以生成邀请码' });
      }
      
      // 生成邀请码
      const inviteCode = generateInviteCode();
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24小时后过期
      
      // 保存邀请码
      await pool.execute(
        'INSERT INTO family_invites (family_id, invite_code, created_by, expires_at) VALUES (?, ?, ?, ?)',
        [familyId, inviteCode, userId, expiresAt]
      );
      
      res.json({
        success: true,
        message: '邀请码生成成功',
        data: {
          inviteCode,
          expiresAt: expiresAt.toISOString()
        }
      });
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      res.status(500).json({ error: '生成邀请码失败' });
    }
    
  } catch (error) {
    console.error('生成邀请码错误:', error);
    res.status(500).json({ error: '生成邀请码失败' });
  }
});

// 验证邀请码
router.post('/invite/verify', [
  body('inviteCode').isLength({ min: 6, max: 10 }).withMessage('邀请码长度应在6-10字符之间')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { inviteCode } = req.body;
    
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
      // 验证邀请码
      const [invites] = await pool.execute(
        'SELECT * FROM family_invites WHERE invite_code = ? AND expires_at > NOW() AND used = 0',
        [inviteCode]
      );
      
      if (invites.length === 0) {
        return res.status(400).json({ error: '邀请码无效或已过期' });
      }
      
      const invite = invites[0];
      
      // 检查用户是否已经是该家庭的成员
      const [existingMembers] = await pool.execute(
        'SELECT id FROM family_members WHERE family_id = ? AND user_id = ?',
        [invite.family_id, userId]
      );
      
      if (existingMembers.length > 0) {
        return res.status(400).json({ error: '您已经是该家庭的成员' });
      }
      
      // 获取家庭信息
      const [families] = await pool.execute(
        'SELECT id, name, description FROM families WHERE id = ?',
        [invite.family_id]
      );
      
      if (families.length === 0) {
        return res.status(400).json({ error: '家庭不存在' });
      }
      
      const family = families[0];
      
      res.json({
        success: true,
        message: '邀请码验证成功',
        data: {
          family: {
            id: family.id,
            name: family.name,
            description: family.description
          },
          inviteCode
        }
      });
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      res.status(500).json({ error: '验证邀请码失败' });
    }
    
  } catch (error) {
    console.error('验证邀请码错误:', error);
    res.status(500).json({ error: '验证邀请码失败' });
  }
});

// 使用邀请码加入家庭
router.post('/invite/join', [
  body('inviteCode').isLength({ min: 6, max: 10 }).withMessage('邀请码长度应在6-10字符之间')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { inviteCode } = req.body;
    
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
      // 开始事务
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // 验证邀请码
        const [invites] = await connection.execute(
          'SELECT * FROM family_invites WHERE invite_code = ? AND expires_at > NOW() AND used = 0',
          [inviteCode]
        );
        
        if (invites.length === 0) {
          throw new Error('邀请码无效或已过期');
        }
        
        const invite = invites[0];
        
        // 检查用户是否已经是该家庭的成员
        const [existingMembers] = await connection.execute(
          'SELECT id FROM family_members WHERE family_id = ? AND user_id = ?',
          [invite.family_id, userId]
        );
        
        if (existingMembers.length > 0) {
          throw new Error('您已经是该家庭的成员');
        }
        
        // 添加用户到家庭
        await connection.execute(
          'INSERT INTO family_members (family_id, user_id, role) VALUES (?, ?, ?)',
          [invite.family_id, userId, 'MEMBER']
        );
        
        // 更新用户的家庭ID
        await connection.execute(
          'UPDATE users SET family_id = ? WHERE id = ?',
          [invite.family_id, userId]
        );
        
        // 标记邀请码为已使用
        await connection.execute(
          'UPDATE family_invites SET used = 1, used_by = ?, used_at = NOW() WHERE id = ?',
          [userId, invite.id]
        );
        
        // 提交事务
        await connection.commit();
        
        // 获取家庭信息
        const [families] = await pool.execute(
          'SELECT id, name, description, created_at FROM families WHERE id = ?',
          [invite.family_id]
        );
        
        if (families.length > 0) {
          const family = families[0];
          res.json({
            success: true,
            message: '成功加入家庭',
            data: {
              family: {
                id: family.id,
                name: family.name,
                description: family.description,
                memberCount: 1, // TODO: 查询实际成员数量
                role: 'MEMBER',
                createdAt: family.created_at
              }
            }
          });
        } else {
          throw new Error('家庭不存在');
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
      res.status(500).json({ error: dbError.message || '加入家庭失败' });
    }
    
  } catch (error) {
    console.error('加入家庭错误:', error);
    res.status(500).json({ error: '加入家庭失败' });
  }
});

// 更新成员角色
router.put('/:familyId/members/:userId/role', [
  body('role').isIn(['MEMBER', 'ADMIN', 'OBSERVER']).withMessage('无效的角色')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { familyId, userId } = req.params;
    const { role } = req.body;
    
    // 从 token 中获取用户信息
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证token' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const currentUserId = decoded.userId || decoded.user_id || decoded.id;
    
    const pool = await getConnection();
    
    try {
      // 检查当前用户是否有权限
      const [currentMembers] = await pool.execute(
        'SELECT role FROM family_members WHERE family_id = ? AND user_id = ?',
        [familyId, currentUserId]
      );
      
      if (currentMembers.length === 0) {
        return res.status(403).json({ error: '您不是该家庭的成员' });
      }
      
      const currentUserRole = currentMembers[0].role;
      if (currentUserRole !== 'ADMIN' && currentUserRole !== 'owner') {
        return res.status(403).json({ error: '只有管理员可以修改成员角色' });
      }
      
      // 检查目标用户是否存在
      const [targetMembers] = await pool.execute(
        'SELECT role FROM family_members WHERE family_id = ? AND user_id = ?',
        [familyId, userId]
      );
      
      if (targetMembers.length === 0) {
        return res.status(404).json({ error: '成员不存在' });
      }
      
      const targetUserRole = targetMembers[0].role;
      if (targetUserRole === 'owner') {
        return res.status(403).json({ error: '不能修改家庭创建者的角色' });
      }
      
      // 更新成员角色
      await pool.execute(
        'UPDATE family_members SET role = ? WHERE family_id = ? AND user_id = ?',
        [role, familyId, userId]
      );
      
      res.json({
        success: true,
        message: '成员角色更新成功'
      });
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      res.status(500).json({ error: '更新成员角色失败' });
    }
    
  } catch (error) {
    console.error('更新成员角色错误:', error);
    res.status(500).json({ error: '更新成员角色失败' });
  }
});

// 移除成员
router.delete('/:familyId/members/:userId', async (req, res) => {
  try {
    const { familyId, userId } = req.params;
    
    // 从 token 中获取用户信息
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: '未提供认证token' });
    }

    const jwt = require('jsonwebtoken');
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    const currentUserId = decoded.userId || decoded.user_id || decoded.id;
    
    const pool = await getConnection();
    
    try {
      // 检查当前用户是否有权限
      const [currentMembers] = await pool.execute(
        'SELECT role FROM family_members WHERE family_id = ? AND user_id = ?',
        [familyId, currentUserId]
      );
      
      if (currentMembers.length === 0) {
        return res.status(403).json({ error: '您不是该家庭的成员' });
      }
      
      const currentUserRole = currentMembers[0].role;
      if (currentUserRole !== 'ADMIN' && currentUserRole !== 'owner') {
        return res.status(403).json({ error: '只有管理员可以移除成员' });
      }
      
      // 检查目标用户是否存在
      const [targetMembers] = await pool.execute(
        'SELECT role FROM family_members WHERE family_id = ? AND user_id = ?',
        [familyId, userId]
      );
      
      if (targetMembers.length === 0) {
        return res.status(404).json({ error: '成员不存在' });
      }
      
      const targetUserRole = targetMembers[0].role;
      if (targetUserRole === 'owner') {
        return res.status(403).json({ error: '不能移除家庭创建者' });
      }
      
      if (currentUserId === userId) {
        return res.status(403).json({ error: '不能移除自己' });
      }
      
      // 开始事务
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // 移除成员
        await connection.execute(
          'DELETE FROM family_members WHERE family_id = ? AND user_id = ?',
          [familyId, userId]
        );
        
        // 更新用户的家庭ID
        await connection.execute(
          'UPDATE users SET family_id = NULL WHERE id = ?',
          [userId]
        );
        
        // 提交事务
        await connection.commit();
        
        res.json({
          success: true,
          message: '成员已移除'
        });
        
      } catch (transactionError) {
        // 回滚事务
        await connection.rollback();
        throw transactionError;
      } finally {
        connection.release();
      }
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      res.status(500).json({ error: '移除成员失败' });
    }
    
  } catch (error) {
    console.error('移除成员错误:', error);
    res.status(500).json({ error: '移除成员失败' });
  }
});

// 退出家庭
router.post('/:familyId/leave', async (req, res) => {
  try {
    const { familyId } = req.params;
    
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
      
      const userRole = members[0].role;
      if (userRole === 'owner') {
        return res.status(403).json({ error: '家庭创建者不能退出，请先转让或解散家庭' });
      }
      
      // 开始事务
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // 移除成员
        await connection.execute(
          'DELETE FROM family_members WHERE family_id = ? AND user_id = ?',
          [familyId, userId]
        );
        
        // 更新用户的家庭ID
        await connection.execute(
          'UPDATE users SET family_id = NULL WHERE id = ?',
          [userId]
        );
        
        // 提交事务
        await connection.commit();
        
        res.json({
          success: true,
          message: '已退出家庭'
        });
        
      } catch (transactionError) {
        // 回滚事务
        await connection.rollback();
        throw transactionError;
      } finally {
        connection.release();
      }
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      res.status(500).json({ error: '退出家庭失败' });
    }
    
  } catch (error) {
    console.error('退出家庭错误:', error);
    res.status(500).json({ error: '退出家庭失败' });
  }
});

// 解散家庭
router.delete('/:familyId', async (req, res) => {
  try {
    const { familyId } = req.params;
    
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
      // 检查用户是否有权限解散家庭
      const [members] = await pool.execute(
        'SELECT role FROM family_members WHERE family_id = ? AND user_id = ?',
        [familyId, userId]
      );
      
      if (members.length === 0) {
        return res.status(403).json({ error: '您不是该家庭的成员' });
      }
      
      const userRole = members[0].role;
      if (userRole !== 'owner') {
        return res.status(403).json({ error: '只有家庭创建者可以解散家庭' });
      }
      
      // 开始事务
      const connection = await pool.getConnection();
      await connection.beginTransaction();
      
      try {
        // 删除所有成员关系
        await connection.execute(
          'DELETE FROM family_members WHERE family_id = ?',
          [familyId]
        );
        
        // 更新所有用户的家庭ID
        await connection.execute(
          'UPDATE users SET family_id = NULL WHERE family_id = ?',
          [familyId]
        );
        
        // 删除家庭
        await connection.execute(
          'DELETE FROM families WHERE id = ?',
          [familyId]
        );
        
        // 提交事务
        await connection.commit();
        
        res.json({
          success: true,
          message: '家庭已解散'
        });
        
      } catch (transactionError) {
        // 回滚事务
        await connection.rollback();
        throw transactionError;
      } finally {
        connection.release();
      }
      
    } catch (dbError) {
      console.error('数据库操作错误:', dbError);
      res.status(500).json({ error: '解散家庭失败' });
    }
    
  } catch (error) {
    console.error('解散家庭错误:', error);
    res.status(500).json({ error: '解散家庭失败' });
  }
});

// 生成邀请码的辅助函数
function generateInviteCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let result = '';
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

module.exports = router; 