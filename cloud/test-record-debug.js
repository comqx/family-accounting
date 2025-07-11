// 调试记账创建接口参数问题
const axios = require('axios');

const BASE_URL = 'https://express-9o49-171950-8-1322802786.sh.run.tcloudbase.com';

// 测试数据 - 确保所有必需参数都有值
const testRecord = {
  familyId: 5,
  type: 'expense',
  amount: 25.50,
  categoryId: 1,
  description: '测试记账记录',
  date: '2024-01-15'
};

// 测试token
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsIm9wZW5pZCI6Im1vY2tfb3BlbmlkX-W-ruS_oeeUqOaItyIsInVuaW9uaWQiOm51bGwsImlhdCI6MTc1MjEzMjA4NiwiZXhwIjoxNzUyNzM2ODg2fQ.g2VmMGolG3lFLdJ6L8L1xuEQSbESs_VGB2ZVcHV4wc0';

async function testRecordCreate() {
  try {
    console.log('🧪 开始调试记账创建接口...');
    console.log('📝 测试数据:', JSON.stringify(testRecord, null, 2));
    console.log('🔑 Token:', testToken.substring(0, 50) + '...');
    
    // 验证所有必需参数
    const requiredFields = ['familyId', 'type', 'amount', 'categoryId', 'date'];
    for (const field of requiredFields) {
      if (testRecord[field] === undefined || testRecord[field] === null) {
        console.error(`❌ 缺少必需参数: ${field}`);
        return;
      }
      console.log(`✅ ${field}: ${testRecord[field]} (${typeof testRecord[field]})`);
    }
    
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
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.response) {
      console.error('📊 错误状态:', error.response.status);
      console.error('📄 错误数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 运行测试
testRecordCreate(); 