// 前端记账功能测试脚本
const axios = require('axios');

const BASE_URL = 'https://express-9o49-171950-8-1322802786.sh.run.tcloudbase.com';

// 测试数据
const testRecord = {
  familyId: 5, // 使用实际的家庭ID
  type: 'expense',
  amount: 50.00,
  categoryId: 1, // 使用实际的分类ID
  description: '前端测试记账记录',
  date: '2024-01-15'
};

// 测试token（需要替换为实际的token）
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsIm9wZW5pZCI6Im1vY2tfb3BlbmlkX-W-ruS_oeeUqOaItyIsInVuaW9uaWQiOm51bGwsImlhdCI6MTc1MjEzMjA4NiwiZXhwIjoxNzUyNzM2ODg2fQ.g2VmMGolG3lFLdJ6L8L1xuEQSbESs_VGB2ZVcHV4wc0';

async function testFrontendRecordFlow() {
  console.log('🧪 开始测试前端记账功能...\n');
  
  try {
    // 1. 测试创建记录
    console.log('📝 测试创建记账记录...');
    console.log('📊 测试数据:', testRecord);
    
    const createResponse = await axios.post(`${BASE_URL}/api/record/create`, testRecord, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json',
        'X-Client-Type': 'miniprogram',
        'X-Client-Version': '1.0.0'
      },
      timeout: 10000
    });
    
    if (createResponse.data.success) {
      console.log('✅ 记账记录创建成功！');
      console.log('🆔 记录ID:', createResponse.data.data.id);
      console.log('💰 金额:', createResponse.data.data.amount);
      console.log('📅 日期:', createResponse.data.data.date);
    } else {
      console.log('❌ 记账记录创建失败');
      return;
    }
    
    // 2. 测试获取记录列表
    console.log('\n📋 测试获取记录列表...');
    
    const listResponse = await axios.get(`${BASE_URL}/api/record/list?familyId=5&page=1&pageSize=10`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'X-Client-Type': 'miniprogram',
        'X-Client-Version': '1.0.0'
      },
      timeout: 10000
    });
    
    if (listResponse.data.success) {
      console.log('✅ 获取记录列表成功！');
      console.log('📊 记录数量:', listResponse.data.data.records.length);
      
      // 查找刚创建的记录
      const newRecord = listResponse.data.data.records.find(record => 
        record.description === testRecord.description
      );
      
      if (newRecord) {
        console.log('✅ 新创建的记录在列表中！');
        console.log('🆔 记录ID:', newRecord.id);
        console.log('💰 金额:', newRecord.amount);
        console.log('📝 描述:', newRecord.description);
      } else {
        console.log('⚠️ 新创建的记录未在列表中找到');
      }
    } else {
      console.log('❌ 获取记录列表失败');
    }
    
    // 3. 测试更新记录
    console.log('\n✏️ 测试更新记账记录...');
    
    const updateData = {
      amount: 75.50,
      description: '前端测试记账记录（已更新）'
    };
    
    const updateResponse = await axios.put(`${BASE_URL}/api/record/${createResponse.data.data.id}`, updateData, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json',
        'X-Client-Type': 'miniprogram',
        'X-Client-Version': '1.0.0'
      },
      timeout: 10000
    });
    
    if (updateResponse.data.success) {
      console.log('✅ 记账记录更新成功！');
      console.log('💰 新金额:', updateResponse.data.data.amount);
      console.log('📝 新描述:', updateResponse.data.data.description);
    } else {
      console.log('❌ 记账记录更新失败');
    }
    
    // 4. 测试删除记录
    console.log('\n🗑️ 测试删除记账记录...');
    
    const deleteResponse = await axios.delete(`${BASE_URL}/api/record/${createResponse.data.data.id}`, {
      headers: {
        'Authorization': `Bearer ${testToken}`,
        'X-Client-Type': 'miniprogram',
        'X-Client-Version': '1.0.0'
      },
      timeout: 10000
    });
    
    if (deleteResponse.data.success) {
      console.log('✅ 记账记录删除成功！');
    } else {
      console.log('❌ 记账记录删除失败');
    }
    
    console.log('\n✨ 前端记账功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    
    if (error.response) {
      console.error('📊 错误状态:', error.response.status);
      console.error('📄 错误数据:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 执行测试
testFrontendRecordFlow().catch(console.error); 