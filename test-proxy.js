// 测试Vite代理是否正常工作的脚本
const axios = require('axios');

// 测试Vite代理
async function testViteProxy() {
  try {
    console.log('=== 测试Vite代理 ===');
    
    // 测试基本API连接
    const baseUrl = 'http://localhost:5175';
    
    // 测试stats端点
    console.log('测试 /api/leakradar/stats 端点...');
    const statsResponse = await axios.get(`${baseUrl}/api/leakradar/stats`);
    console.log('✅ stats端点响应:', {
      status: statsResponse.status,
      dataType: typeof statsResponse.data,
      leaksTotal: statsResponse.data.leaks?.total
    });
    
    // 测试域名搜索端点
    console.log('\n测试 /api/leakradar/search/domain/example.com 端点...');
    const domainResponse = await axios.get(`${baseUrl}/api/leakradar/search/domain/example.com`);
    console.log('✅ 域名搜索响应:', {
      status: domainResponse.status,
      success: domainResponse.data.success
    });
    
    // 测试子域名端点
    console.log('\n测试 /api/leakradar/search/domain/example.com/subdomains 端点...');
    const subdomainsResponse = await axios.get(`${baseUrl}/api/leakradar/search/domain/example.com/subdomains?page=1&page_size=1`);
    console.log('✅ 子域名响应:', {
      status: subdomainsResponse.status,
      success: subdomainsResponse.data.success
    });
    
    // 测试URL端点
    console.log('\n测试 /api/leakradar/search/domain/example.com/urls 端点...');
    const urlsResponse = await axios.get(`${baseUrl}/api/leakradar/search/domain/example.com/urls?page=1&page_size=1`);
    console.log('✅ URL响应:', {
      status: urlsResponse.status,
      success: urlsResponse.data.success
    });
    
    console.log('\n🎉 所有Vite代理测试通过！');
    return true;
  } catch (error) {
    console.error('❌ Vite代理测试失败:', error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应数据:', error.response.data);
    } else if (error.request) {
      console.error('没有收到响应:', error.request);
    }
    return false;
  }
}

testViteProxy();