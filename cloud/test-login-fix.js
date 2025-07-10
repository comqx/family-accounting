#!/usr/bin/env node

/**
 * 测试登录接口修复
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testLogin() {
  console.log('🧪 测试登录接口修复...\n');
  
  try {
    // 1. 测试健康检查
    console.log('1️⃣ 测试健康检查...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 健康检查通过:', healthResponse.data);
    console.log();
    
    // 2. 测试微信登录
    console.log('2️⃣ 测试微信登录...');
    const loginData = {
      code: 'test_code_123',
      userInfo: {
        nickName: '测试用户',
        avatarUrl: 'https://example.com/avatar.jpg',
        unionId: 'test_union_id'
      }
    };
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/wechat-login`, loginData);
    console.log('✅ 登录成功:', {
      success: loginResponse.data.success,
      hasToken: !!loginResponse.data.data.token,
      hasUser: !!loginResponse.data.data.user,
      userId: loginResponse.data.data.user.id,
      familyId: loginResponse.data.data.user.familyId
    });
    console.log();
    
    // 3. 测试创建家庭
    console.log('3️⃣ 测试创建家庭...');
    const token = loginResponse.data.data.token;
    const familyData = {
      name: '测试家庭',
      description: '这是一个测试家庭'
    };
    
    const familyResponse = await axios.post(`${BASE_URL}/api/family/create`, familyData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 创建家庭成功:', {
      success: familyResponse.data.success,
      familyId: familyResponse.data.data.family.id,
      familyName: familyResponse.data.data.family.name
    });
    console.log();
    
    // 4. 测试获取家庭列表
    console.log('4️⃣ 测试获取家庭列表...');
    const familyListResponse = await axios.get(`${BASE_URL}/api/family/list`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 获取家庭列表成功:', {
      success: familyListResponse.data.success,
      familyCount: familyListResponse.data.data.length,
      families: familyListResponse.data.data.map(f => ({ id: f.id, name: f.name }))
    });
    console.log();
    
    console.log('🎉 所有测试通过！登录接口修复成功！');
    return true;
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应状态:', error.response.status);
      console.error('响应数据:', error.response.data);
    }
    return false;
  }
}

// 运行测试
if (require.main === module) {
  testLogin()
    .then(success => {
      if (success) {
        console.log('🎉 登录接口测试成功');
        process.exit(0);
      } else {
        console.error('💥 登录接口测试失败');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 测试异常:', error);
      process.exit(1);
    });
}

module.exports = { testLogin }; 