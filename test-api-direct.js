// 直接测试LeakRadar API连接的脚本
import axios from 'axios';

// 使用环境变量中的API密钥
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJrb25hYTI2NTFAZ21haWwuY29tIiwianRpIjoiZmU3MmE0ZjMtNDg2OC00ZGZiLTk2MzMtMGM5Y2M2YjhlNjlhIiwidHlwZSI6ImFjY2VzcyJ9.GoSMTP9Lwj_UIXyKU6rDlBYI9AunStGnI0lQ52JO4p0';

async function testStatsEndpoint() {
  try {
    console.log('测试LeakRadar API /stats端点...');
    
    const response = await axios.get('https://api.leakradar.io/stats', {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'X-API-Key': API_KEY,
        'Content-Type': 'application/json',
        'Origin': 'http://localhost:3000' // 测试CORS
      }
    });
    
    console.log('✅ /stats端点请求成功！');
    console.log('响应状态码:', response.status);
    console.log('响应头:', response.headers);
    console.log('响应数据（前500字符）:', JSON.stringify(response.data).substring(0, 500) + '...');
    
    return true;
  } catch (error) {
    console.error('❌ /stats端点请求失败:', error.message);
    if (error.response) {
      console.error('状态码:', error.response.status);
      console.error('响应头:', error.response.headers);
      console.error('错误详情:', error.response.data);
    } else if (error.request) {
      console.error('没有收到响应:', error.request);
    }
    return false;
  }
}

testStatsEndpoint();