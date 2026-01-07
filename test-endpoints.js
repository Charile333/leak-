import http from 'http';

// 测试端点
const endpoints = [
  { name: '健康检查', url: '/health', method: 'GET' },
  { name: '白名单获取', url: '/api/auth/whitelist', method: 'GET' },
  // 登录测试将在浏览器中进行
];

// 发送HTTP请求
function makeRequest(endpoint) {
  return new Promise((resolve, reject) => {
    console.log(`\n🔍 测试 ${endpoint.name}: ${endpoint.method} http://localhost:3001${endpoint.url}`);
    
    const options = {
      hostname: 'localhost',
      port: 3001,
      path: endpoint.url,
      method: endpoint.method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      console.log(`✅ ${endpoint.name} 请求成功！`);
      console.log(`   状态码: ${res.statusCode}`);
      console.log(`   响应头:`, res.headers);
      
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`   响应数据: ${data}`);
        resolve();
      });
    });
    
    req.on('error', (error) => {
      console.error(`❌ ${endpoint.name} 请求失败:`, error.message);
      resolve(); // 继续测试其他端点
    });
    
    req.end();
  });
}

// 执行所有测试
async function runTests() {
  console.log('🚀 开始测试白名单登录验证功能...');
  
  for (const endpoint of endpoints) {
    await makeRequest(endpoint);
  }
  
  console.log('\n🎉 所有测试完成！');
  console.log('\n📝 下一步测试：');
  console.log('   1. 在浏览器中访问 http://localhost:5174');
  console.log('   2. 尝试使用白名单内的邮箱登录（konaa2651@gmail.com）');
  console.log('   3. 尝试使用白名单外的邮箱登录，应返回 "您的邮箱不在白名单中，无法登录"');
}

// 运行测试
runTests();
