const express = require('express');
const { getConnection } = require('../config/database');
const { userValidation } = require('../middleware/validation');
const { generateToken, authenticate } = require('../middleware/auth');
const { asyncHandler, sendBusinessError, sendAuthError } = require('../middleware/errorHandler');
const { logger } = require('../middleware/logger');
const router = express.Router();

// 微信登录
router.post('/wechat-login', userValidation.login, asyncHandler(async (req, res) => {
  const { code, userInfo = {} } = req.body;
  
  // TODO: 调用微信API获取openid和session_key
  // const wxResponse = await getWechatSession(code);
  
  // 模拟微信登录响应
  const mockWxResponse = {
    openid: userInfo.unionId || `mock_openid_${code}_${Date.now()}`,
    session_key: `mock_session_${Date.now()}`,
    unionid: userInfo.unionId || null
  };

  const pool = await getConnection();
  
  // 查找或创建用户
  let userId;
  let familyId = null;
  let family = null;
  
  try {
    // 先查找用户是否存在
    const [users] = await pool.execute(
      'SELECT id, family_id FROM users WHERE openid = ?',
      [mockWxResponse.openid]
    );
    
    if (users.length > 0) {
      // 用户已存在
      userId = users[0].id;
      familyId = users[0].family_id;
      
      // 如果有家庭ID，查询家庭信息
      if (familyId) {
        const [families] = await pool.execute(
          'SELECT id, name, description, avatar, admin_id FROM families WHERE id = ?',
          [familyId]
        );
        
        if (families.length > 0) {
          family = families[0];
        }
      }
    } else {
      // 用户不存在，创建新用户
      const [result] = await pool.execute(
        'INSERT INTO users (openid, unionid, nickname, avatar, role) VALUES (?, ?, ?, ?, ?)',
        [
          mockWxResponse.openid,
          mockWxResponse.unionid,
          userInfo.nickName || '微信用户',
          userInfo.avatarUrl || null,
          'MEMBER'
        ]
      );
      
      userId = result.insertId;
    }
  } catch (dbError) {
    logger.error('数据库操作错误', { error: dbError.message });
    throw new Error('登录失败，请重试');
  }

  // 生成JWT token
  const token = generateToken({
    userId: userId,
    openid: mockWxResponse.openid,
    unionid: mockWxResponse.unionid
  });

  logger.info('用户登录成功', { userId, openid: mockWxResponse.openid });
  
  return res.json({
    success: true,
    data: {
      token,
      user: {
        id: userId,
        openid: mockWxResponse.openid,
        unionid: mockWxResponse.unionid,
        nickName: userInfo.nickName,
        avatarUrl: userInfo.avatarUrl,
        familyId: familyId,
        role: 'MEMBER'
      },
      family: family
    }
  });
}));

// 验证token
router.get('/verify', authenticate, asyncHandler(async (req, res) => {
  res.json({
    success: true,
    data: {
      isValid: true,
      user: req.user
    }
  });
}));

// 刷新token
router.post('/refresh', asyncHandler(async (req, res) => {
  const { token } = req.body;
  
  if (!token) {
    return sendAuthError(res, 'AUTH_TOKEN_MISSING', 'token不能为空');
  }

  try {
    // 这里可以添加token刷新逻辑
    // 目前简单返回原token
    res.json({
      success: true,
      data: {
        token: token
      }
    });
  } catch (error) {
    logger.error('Token刷新失败', { error: error.message });
    return sendAuthError(res, 'AUTH_TOKEN_INVALID', 'token无效或已过期');
  }
}));

module.exports = router; 