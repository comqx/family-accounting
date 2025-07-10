const axios = require('axios');

// 测试创建家庭的逻辑
async function testFamilyCreate() {
  const baseURL = 'http://localhost:80';
  
  try {
    console.log('🧪 开始测试创建家庭逻辑...');
    
    // 1. 先进行登录获取 token
    console.log('1. 进行微信登录...');
    const loginResponse = await axios.post(`${baseURL}/api/auth/wechat-login`, {
      code: 'test_code_123',
      userInfo: {
        nickName: '测试用户',
        avatarUrl: 'https://example.com/avatar.jpg'
      }
    });
    
    if (!loginResponse.data.success) {
      throw new Error('登录失败');
    }
    
    const { token, user } = loginResponse.data.data;
    console.log('✅ 登录成功，用户ID:', user.id);
    console.log('✅ 用户家庭ID:', user.familyId);
    
    // 2. 创建家庭
    console.log('\n2. 创建家庭...');
    const createFamilyResponse = await axios.post(`${baseURL}/api/family/create`, {
      name: '测试家庭',
      description: '这是一个测试家庭'
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!createFamilyResponse.data.success) {
      throw new Error('创建家庭失败');
    }
    
    const family = createFamilyResponse.data.data.family;
    console.log('✅ 家庭创建成功');
    console.log('   - 家庭ID:', family.id);
    console.log('   - 家庭名称:', family.name);
    console.log('   - 创建者角色:', family.role);
    
    // 3. 再次登录验证家庭信息
    console.log('\n3. 再次登录验证家庭信息...');
    const loginAgainResponse = await axios.post(`${baseURL}/api/auth/wechat-login`, {
      code: 'test_code_123',
      userInfo: {
        nickName: '测试用户',
        avatarUrl: 'https://example.com/avatar.jpg'
      }
    });
    
    if (!loginAgainResponse.data.success) {
      throw new Error('再次登录失败');
    }
    
    const { user: userAgain, family: familyAgain } = loginAgainResponse.data.data;
    console.log('✅ 再次登录成功');
    console.log('   - 用户家庭ID:', userAgain.familyId);
    console.log('   - 返回的家庭信息:', familyAgain ? '有' : '无');
    
    if (userAgain.familyId && familyAgain) {
      console.log('✅ 家庭信息正确保存和返回');
    } else {
      console.log('❌ 家庭信息未正确保存或返回');
    }
    
    // 4. 获取家庭列表
    console.log('\n4. 获取家庭列表...');
    const familyListResponse = await axios.get(`${baseURL}/api/family/list`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!familyListResponse.data.success) {
      throw new Error('获取家庭列表失败');
    }
    
    const families = familyListResponse.data.data;
    console.log('✅ 家庭列表获取成功');
    console.log('   - 家庭数量:', families.length);
    if (families.length > 0) {
      console.log('   - 第一个家庭:', families[0].name);
    }
    
    console.log('\n🎉 所有测试通过！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.response) {
      console.error('响应数据:', error.response.data);
    }
  }
}

// 运行测试
testFamilyCreate(); 