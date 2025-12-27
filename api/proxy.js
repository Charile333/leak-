import axios from 'axios';

export default async function handler(req, res) {
  // 1. 设置跨域头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. 获取目标路径 (去掉 /api 部分)
  const targetPath = req.url.replace('/api', '');
  
  // 根据路径判断使用哪个 API
  const isDnsRequest = targetPath.startsWith('/dns-v1');
  const API_KEY = isDnsRequest 
    ? (process.env.DNS_API_TOKEN || process.env.VITE_DNS_API_TOKEN)
    : process.env.LEAKRADAR_API_KEY;

  let targetUrl = isDnsRequest
    ? `https://src.0zqq.com${targetPath.replace('/dns-v1', '/api/v1')}`
    : `https://api.leakradar.io${targetPath.replace('/leakradar', '')}`;

  if (!API_KEY) {
    return res.status(500).json({ 
      error: 'Missing API Key', 
      details: `Please set ${isDnsRequest ? 'DNS_API_TOKEN' : 'LEAKRADAR_API_KEY'} in Vercel Environment Variables and redeploy.` 
    });
  }

  try {
    console.log(`Proxying request to: ${targetUrl}`);
    
    // 构造请求头
    const headers = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    };

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: headers,
      data: req.body
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy Error:', error.message);
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Upstream API Error',
        message: error.message,
        data: error.response.data
      });
    } else {
      res.status(500).json({ 
        error: 'Proxy execution error', 
        message: error.message
      });
    }
  }
}
