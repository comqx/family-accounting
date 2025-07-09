const express = require('express');
const { body, validationResult } = require('express-validator');
const router = express.Router();

// 获取用户信息
router.get('/profile', async (req, res) => {
  try {
    // TODO: 从数据库获取用户信息
    const mockUser = {
      id: 1,
      openid: 'mock_openid',
      nickname: '测试用户',
      avatar: 'https://example.com/avatar.jpg',
      phone: '13800138000',
      email: 'test@example.com',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      data: mockUser
    });
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
    
    // TODO: 更新数据库中的用户信息
    
    res.json({
      success: true,
      message: '用户信息更新成功',
      data: { nickname, phone, email }
    });
  } catch (error) {
    console.error('更新用户信息错误:', error);
    res.status(500).json({ error: '更新用户信息失败' });
  }
});

// 获取用户统计信息
router.get('/stats', async (req, res) => {
  try {
    // TODO: 从数据库获取用户统计信息
    const mockStats = {
      totalRecords: 156,
      totalAmount: 12580.50,
      thisMonthRecords: 23,
      thisMonthAmount: 2340.80,
      categories: [
        { name: '餐饮', count: 45, amount: 3200.50 },
        { name: '交通', count: 23, amount: 890.30 },
        { name: '购物', count: 34, amount: 2100.80 }
      ]
    };

    res.json({
      success: true,
      data: mockStats
    });
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