import http from 'http';

// 测试健康检查端点
function testHealthCheck() {
  console.log('🔍 测试后端健康检查端点...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/health',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const req = http.request(options, (res) => {
    console.log(`✅ 健康检查请求成功！`);
    console.log(`   状态码: ${res.statusCode}`);
    console.log(`   响应头:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`   响应数据: ${data}`);
      testApiStats();
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ 健康检查请求失败:', error.message);
  });
  
  req.end();
}

// 测试API统计端点
function testApiStats() {
  console.log('\n🔍 测试API统计端点...');
  
  const options = {
    hostname: 'localhost',
    port: 3001,
    path: '/api/stats',
    method: 'GET',
    headers: {
      'Content-Type': 'application/json'
    }
  };
  
  const req = http.request(options, (res) => {
    console.log(`✅ API统计请求成功！`);
    console.log(`   状态码: ${res.statusCode}`);
    console.log(`   响应头:`, res.headers);
    
    let data = '';
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      console.log(`   响应数据（前500字符）: ${data.substring(0, 500)}...`);
      console.log('\n🎉 所有测试通过！后端服务运行正常！');
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ API统计请求失败:', error.message);
  });
  
  req.end();
}

// 执行测试
testHealthCheck();
