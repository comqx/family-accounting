const express = require('express');
const { body, validationResult } = require('express-validator');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const router = express.Router();

// 微信登录
router.post('/wechat-login', [
  body('code').notEmpty().withMessage('微信授权码不能为空'),
  body('userInfo').isObject().withMessage('用户信息格式错误')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ error: errors.array()[0].msg });
    }

    const { code, userInfo } = req.body;
    
    // TODO: 调用微信API获取openid和session_key
    // const wxResponse = await getWechatSession(code);
    
    // 模拟微信登录响应
    const mockWxResponse = {
      openid: `mock_openid_${Date.now()}`,
      session_key: `mock_session_${Date.now()}`,
      unionid: userInfo.unionId || null
    };

    // 生成用户ID
    const userId = `user_${Date.now()}`;

    // 生成JWT token
    const token = jwt.sign(
      { 
        userId: userId,
        openid: mockWxResponse.openid,
        unionid: mockWxResponse.unionid 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: userId,
          openid: mockWxResponse.openid,
          unionid: mockWxResponse.unionid,
          nickName: userInfo.nickName,
          avatarUrl: userInfo.avatarUrl,
          familyId: null,
          role: 'MEMBER'
        }
      }
    });
  } catch (error) {
    console.error('微信登录错误:', error);
    res.status(500).json({ error: '登录失败，请重试' });
  }
});

// 验证token
router.get('/verify', async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: '未提供认证token' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    res.json({
      success: true,
      data: {
        isValid: true,
        user: decoded
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'token无效或已过期' });
  }
});

// 刷新token
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;
    
    if (!token) {
      return res.status(400).json({ error: 'token不能为空' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    
    // 生成新的token
    const newToken = jwt.sign(
      { 
        openid: decoded.openid,
        unionid: decoded.unionid 
      },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      success: true,
      data: {
        token: newToken
      }
    });
  } catch (error) {
    res.status(401).json({ error: 'token无效或已过期' });
  }
});

module.exports = router; 