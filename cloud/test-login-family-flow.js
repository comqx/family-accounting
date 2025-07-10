#!/usr/bin/env node

/**
 * 测试登录后家庭状态流程
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testLoginFamilyFlow() {
  console.log('🧪 测试登录后家庭状态流程...\n');
  
  let token = null;
  let userId = null;
  let familyId = null;
  
  try {
    // 1. 第一次登录（新用户）
    console.log('1️⃣ 第一次登录（新用户）...');
    const loginData1 = {
      code: 'test_code_123',
      userInfo: {
        nickName: '测试用户',
        avatarUrl: 'https://example.com/avatar.jpg',
        unionId: 'test_union_id_123'
      }
    };
    
    const loginResponse1 = await axios.post(`${BASE_URL}/api/auth/wechat-login`, loginData1);
    console.log('✅ 第一次登录成功:', {
      success: loginResponse1.data.success,
      hasToken: !!loginResponse1.data.data.token,
      hasUser: !!loginResponse1.data.data.user,
      userId: loginResponse1.data.data.user.id,
      familyId: loginResponse1.data.data.user.familyId,
      hasFamily: !!loginResponse1.data.data.family
    });
    
    token = loginResponse1.data.data.token;
    userId = loginResponse1.data.data.user.id;
    familyId = loginResponse1.data.data.user.familyId;
    
    console.log('📝 第一次登录结果：', {
      userId,
      familyId,
      hasFamily: !!loginResponse1.data.data.family
    });
    console.log();
    
    // 2. 创建家庭
    console.log('2️⃣ 创建家庭...');
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
    
    familyId = familyResponse.data.data.family.id;
    console.log();
    
    // 3. 获取家庭列表（确认家庭已创建）
    console.log('3️⃣ 获取家庭列表...');
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
    
    // 4. 模拟退出登录（清除token）
    console.log('4️⃣ 模拟退出登录...');
    token = null;
    console.log('✅ 已清除登录状态');
    console.log();
    
    // 5. 第二次登录（同一用户）
    console.log('5️⃣ 第二次登录（同一用户）...');
    const loginData2 = {
      code: 'test_code_456',
      userInfo: {
        nickName: '测试用户',
        avatarUrl: 'https://example.com/avatar.jpg',
        unionId: 'test_union_id_123' // 使用相同的 unionId
      }
    };
    
    const loginResponse2 = await axios.post(`${BASE_URL}/api/auth/wechat-login`, loginData2);
    console.log('✅ 第二次登录成功:', {
      success: loginResponse2.data.success,
      hasToken: !!loginResponse2.data.data.token,
      hasUser: !!loginResponse2.data.data.user,
      userId: loginResponse2.data.data.user.id,
      familyId: loginResponse2.data.data.user.familyId,
      hasFamily: !!loginResponse2.data.data.family
    });
    
    token = loginResponse2.data.data.token;
    const newUserId = loginResponse2.data.data.user.id;
    const newFamilyId = loginResponse2.data.data.user.familyId;
    
    console.log('📝 第二次登录结果：', {
      userId: newUserId,
      familyId: newFamilyId,
      hasFamily: !!loginResponse2.data.data.family
    });
    console.log();
    
    // 6. 验证用户和家庭信息一致性
    console.log('6️⃣ 验证用户和家庭信息一致性...');
    const isSameUser = userId === newUserId;
    const isSameFamily = familyId === newFamilyId;
    const hasFamilyInfo = !!loginResponse2.data.data.family;
    
    console.log('✅ 验证结果:', {
      isSameUser,
      isSameFamily,
      hasFamilyInfo,
      expectedFamilyId: familyId,
      actualFamilyId: newFamilyId
    });
    
    if (isSameUser && isSameFamily && hasFamilyInfo) {
      console.log('🎉 测试通过！用户重新登录后正确返回家庭信息');
    } else {
      console.log('❌ 测试失败！用户重新登录后家庭信息不正确');
      if (!isSameUser) console.log('   - 用户ID不一致');
      if (!isSameFamily) console.log('   - 家庭ID不一致');
      if (!hasFamilyInfo) console.log('   - 缺少家庭信息');
    }
    console.log();
    
    // 7. 再次获取家庭列表确认
    console.log('7️⃣ 再次获取家庭列表确认...');
    const familyListResponse2 = await axios.get(`${BASE_URL}/api/family/list`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 再次获取家庭列表成功:', {
      success: familyListResponse2.data.success,
      familyCount: familyListResponse2.data.data.length,
      families: familyListResponse2.data.data.map(f => ({ id: f.id, name: f.name }))
    });
    console.log();
    
    console.log('🎉 完整流程测试完成！');
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
  testLoginFamilyFlow()
    .then(success => {
      if (success) {
        console.log('🎉 登录家庭流程测试成功');
        process.exit(0);
      } else {
        console.error('💥 登录家庭流程测试失败');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 测试异常:', error);
      process.exit(1);
    });
}

module.exports = { testLoginFamilyFlow }; 