// 测试JWT token内容
const jwt = require('jsonwebtoken');

// 测试token（从错误日志中获取的）
const testToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjUsIm9wZW5pZCI6Im1vY2tfb3BlbmlkX-W-ruS_oeeUqOaItyIsInVuaW9uaWQiOm51bGwsImlhdCI6MTc1MjEzMjA4NiwiZXhwIjoxNzUyNzM2ODg2fQ.g2VmMGolG3lFLdJ6L8L1xuEQSbESs_VGB2ZVcHV4wc0';

function testJWTToken() {
  try {
    console.log('🧪 测试JWT token内容...');
    
    // 解码token（不验证签名）
    const decoded = jwt.decode(testToken);
    console.log('📄 Token解码结果:', JSON.stringify(decoded, null, 2));
    
    // 验证token
    const verified = jwt.verify(testToken, 'your-secret-key');
    console.log('✅ Token验证成功:', JSON.stringify(verified, null, 2));
    
    // 检查字段
    console.log('🔍 字段检查:');
    console.log('  - userId:', verified.userId);
    console.log('  - openid:', verified.openid);
    console.log('  - unionid:', verified.unionid);
    console.log('  - iat:', verified.iat);
    console.log('  - exp:', verified.exp);
    
    // 检查userId是否存在
    if (verified.userId !== undefined) {
      console.log('✅ userId字段存在且有效:', verified.userId);
    } else {
      console.log('❌ userId字段不存在或为undefined');
    }
    
  } catch (error) {
    console.error('❌ JWT验证失败:', error.message);
  }
}

// 生成新的测试token
function generateTestToken() {
  try {
    console.log('\n🔄 生成新的测试token...');
    
    const payload = {
      userId: 5,
      openid: 'mock_openid_测试用户',
      unionid: null
    };
    
    const token = jwt.sign(payload, 'your-secret-key', { expiresIn: '7d' });
    console.log('✅ 新token生成成功:', token);
    
    // 验证新token
    const decoded = jwt.verify(token, 'your-secret-key');
    console.log('📄 新token解码结果:', JSON.stringify(decoded, null, 2));
    
    return token;
  } catch (error) {
    console.error('❌ 生成token失败:', error.message);
    return null;
  }
}

// 运行测试
testJWTToken();
const newToken = generateTestToken();

console.log('\n📋 测试总结:');
console.log('1. 检查JWT token中的字段是否正确');
console.log('2. 确认userId字段是否存在');
console.log('3. 验证token生成和解析是否正常'); 