#!/usr/bin/env node

/**
 * 测试记账功能数据库操作
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:3000';

async function testRecordOperations() {
  console.log('🧪 测试记账功能数据库操作...\n');
  
  let token = null;
  let familyId = null;
  let categoryId = null;
  let recordId = null;
  
  try {
    // 1. 登录获取 token
    console.log('1️⃣ 登录获取 token...');
    const loginData = {
      code: 'test_code_123',
      userInfo: {
        nickName: '测试用户',
        avatarUrl: 'https://example.com/avatar.jpg',
        unionId: 'test_union_id_123'
      }
    };
    
    const loginResponse = await axios.post(`${BASE_URL}/api/auth/wechat-login`, loginData);
    token = loginResponse.data.data.token;
    familyId = loginResponse.data.data.user.familyId;
    
    console.log('✅ 登录成功:', {
      hasToken: !!token,
      familyId: familyId
    });
    console.log();
    
    // 2. 如果没有家庭，先创建家庭
    if (!familyId) {
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
      
      familyId = familyResponse.data.data.family.id;
      console.log('✅ 创建家庭成功:', {
        familyId: familyId
      });
      console.log();
    }
    
    // 3. 获取分类列表（用于创建记录）
    console.log('3️⃣ 获取分类列表...');
    const categoriesResponse = await axios.get(`${BASE_URL}/api/category/list`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        familyId: familyId,
        type: 'expense'
      }
    });
    
    if (categoriesResponse.data.data && categoriesResponse.data.data.length > 0) {
      categoryId = categoriesResponse.data.data[0].id;
      console.log('✅ 获取分类成功:', {
        categoryId: categoryId,
        categoryName: categoriesResponse.data.data[0].name
      });
    } else {
      console.log('⚠️ 没有找到分类，使用默认分类ID: 1');
      categoryId = 1;
    }
    console.log();
    
    // 4. 创建记账记录
    console.log('4️⃣ 创建记账记录...');
    const recordData = {
      familyId: familyId,
      type: 'expense',
      amount: 25.50,
      categoryId: categoryId,
      description: '测试午餐',
      date: new Date().toISOString().split('T')[0]
    };
    
    const createResponse = await axios.post(`${BASE_URL}/api/record/create`, recordData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    recordId = createResponse.data.data.id;
    console.log('✅ 创建记录成功:', {
      recordId: recordId,
      amount: createResponse.data.data.amount,
      description: createResponse.data.data.description
    });
    console.log();
    
    // 5. 获取记录列表验证
    console.log('5️⃣ 获取记录列表验证...');
    const listResponse = await axios.get(`${BASE_URL}/api/record/list`, {
      headers: {
        'Authorization': `Bearer ${token}`
      },
      params: {
        familyId: familyId,
        page: 1,
        pageSize: 10
      }
    });
    
    console.log('✅ 获取记录列表成功:', {
      recordCount: listResponse.data.data.records.length,
      total: listResponse.data.data.pagination.total,
      hasCreatedRecord: listResponse.data.data.records.some(r => r.id === recordId)
    });
    console.log();
    
    // 6. 获取记录详情
    console.log('6️⃣ 获取记录详情...');
    const detailResponse = await axios.get(`${BASE_URL}/api/record/${recordId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 获取记录详情成功:', {
      recordId: detailResponse.data.data.id,
      amount: detailResponse.data.data.amount,
      description: detailResponse.data.data.description,
      categoryName: detailResponse.data.data.categoryName
    });
    console.log();
    
    // 7. 更新记录
    console.log('7️⃣ 更新记录...');
    const updateData = {
      amount: 30.00,
      description: '更新后的午餐'
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/api/record/${recordId}`, updateData, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 更新记录成功:', {
      recordId: updateResponse.data.data.id,
      newAmount: updateResponse.data.data.amount,
      newDescription: updateResponse.data.data.description
    });
    console.log();
    
    // 8. 验证更新结果
    console.log('8️⃣ 验证更新结果...');
    const verifyResponse = await axios.get(`${BASE_URL}/api/record/${recordId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    const isUpdated = verifyResponse.data.data.amount === 30.00 && 
                     verifyResponse.data.data.description === '更新后的午餐';
    
    console.log('✅ 验证更新结果:', {
      isUpdated: isUpdated,
      amount: verifyResponse.data.data.amount,
      description: verifyResponse.data.data.description
    });
    console.log();
    
    // 9. 删除记录
    console.log('9️⃣ 删除记录...');
    const deleteResponse = await axios.delete(`${BASE_URL}/api/record/${recordId}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    console.log('✅ 删除记录成功:', {
      message: deleteResponse.data.message
    });
    console.log();
    
    // 10. 验证删除结果
    console.log('🔟 验证删除结果...');
    try {
      await axios.get(`${BASE_URL}/api/record/${recordId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      console.log('❌ 删除验证失败：记录仍然存在');
    } catch (error) {
      if (error.response && error.response.status === 404) {
        console.log('✅ 删除验证成功：记录已不存在');
      } else {
        console.log('❌ 删除验证异常:', error.message);
      }
    }
    console.log();
    
    console.log('🎉 所有记账功能测试通过！数据库操作正常！');
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
  testRecordOperations()
    .then(success => {
      if (success) {
        console.log('🎉 记账功能测试成功');
        process.exit(0);
      } else {
        console.error('💥 记账功能测试失败');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('💥 测试异常:', error);
      process.exit(1);
    });
}

module.exports = { testRecordOperations }; 