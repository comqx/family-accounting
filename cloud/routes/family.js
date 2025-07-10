const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// 获取用户加入的家庭列表
router.get('/list', async (req, res) => {
  try {
    // TODO: 从数据库获取用户加入的家庭列表
    const mockFamilies = [
      {
        id: 1,
        name: '我的家庭',
        avatar: 'https://example.com/family1.jpg',
        memberCount: 3,
        role: 'owner',
        createdAt: new Date().toISOString()
      },
      {
        id: 2,
        name: '父母家',
        avatar: 'https://example.com/family2.jpg',
        memberCount: 2,
        role: 'member',
        createdAt: new Date().toISOString()
      }
    ];

    res.json({
      success: true,
      data: mockFamilies
    });
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
    
    // TODO: 创建家庭并添加创建者为成员
    
    const mockFamily = {
      id: Date.now(),
      name,
      description,
      avatar: 'https://example.com/default-family.jpg',
      memberCount: 1,
      role: 'owner',
      createdAt: new Date().toISOString()
    };

    res.json({
      success: true,
      message: '家庭创建成功',
      data: {
        family: mockFamily
      }
    });
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