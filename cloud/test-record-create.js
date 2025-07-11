// 测试记账创建接口
const axios = require('axios');

const BASE_URL = 'https://express-9o49-171950-8-1322802786.sh.run.tcloudbase.com';

// 测试数据
const testRecord = {
  familyId: 5, // 使用实际的家庭ID
  type: 'expense',
  amount: 25.50,
  categoryId: 1, // 使用实际的分类ID
  description: '测试记账记录',
  date: '2024-01-15'
};

// 测试token（需要替换为实际的token）
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsIm9wZW5pZCI6Im1vY2tfb3BlbmlkX-W-ruS_oeeUqOaItyIsInVuaW9uaWQiOm51bGwsImlhdCI6MTc1MjEzMjA4NiwiZXhwIjoxNzUyNzM2ODg2fQ.g2VmMGolG3lFLdJ6L8L1xuEQSbESs_VGB2ZVcHV4wc0';

async function testCreateRecord() {
  try {
    console.log('🧪 开始测试记账创建接口...');
    console.log('📝 测试数据:', testRecord);
    
    const response = await axios.post(`${BASE_URL}/api/record/create`, testRecord, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json',
        'X-Client-Type': 'miniprogram',
        'X-Client-Version': '1.0.0'
      },
      timeout: 10000
    });
    
    console.log('✅ 接口调用成功');
    console.log('📊 响应状态:', response.status);
    console.log('📄 响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('🎉 记账记录创建成功！');
      console.log('🆔 记录ID:', response.data.data.id);
    } else {
      console.log('❌ 记账记录创建失败');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.response) {
      console.error('📊 错误状态:', error.response.status);
      console.error('📄 错误数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function testGetRecords() {
  try {
    console.log('\n🧪 开始测试获取记录列表接口...');
    
    const response = await axios.get(`${BASE_URL}/api/record/list?familyId=5&page=1&pageSize=10`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'X-Client-Type': 'miniprogram',
        'X-Client-Version': '1.0.0'
      },
      timeout: 10000
    });
    
    console.log('✅ 接口调用成功');
    console.log('📊 响应状态:', response.status);
    console.log('📄 响应数据:', JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log('🎉 获取记录列表成功！');
      console.log('📊 记录数量:', response.data.data.records.length);
    } else {
      console.log('❌ 获取记录列表失败');
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.response) {
      console.error('📊 错误状态:', error.response.status);
      console.error('📄 错误数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function testHealthCheck() {
  try {
    console.log('\n🧪 开始测试健康检查接口...');
    
    const response = await axios.get(`${BASE_URL}/health`, {
      timeout: 5000
    });
    
    console.log('✅ 健康检查成功');
    console.log('📊 响应状态:', response.status);
    console.log('📄 响应数据:', JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    console.error('❌ 健康检查失败:', error.message);
  }
}

// 运行测试
async function runTests() {
  console.log('🚀 开始运行记账接口测试...\n');
  
  // 1. 健康检查
  await testHealthCheck();
  
  // 2. 获取记录列表
  await testGetRecords();
  
  // 3. 创建记录
  await testCreateRecord();
  
  // 4. 再次获取记录列表，验证是否创建成功
  console.log('\n🔄 验证创建结果...');
  await testGetRecords();
  
  console.log('\n✨ 测试完成！');
}

// 执行测试
runTests().catch(console.error); 