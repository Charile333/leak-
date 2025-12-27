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
  let targetPath = req.url.replace('/api', '');
  
  // 处理 stats 路径映射
  if (targetPath === '/leakradar/stats') {
    targetPath = '/leakradar/metadata/stats';
  }
  
  // 根据路径判断使用哪个 API
  const isDnsRequest = targetPath.startsWith('/dns-v1');
  const API_KEY = isDnsRequest 
    ? (process.env.DNS_API_TOKEN || process.env.VITE_DNS_API_TOKEN)
    : process.env.LEAKRADAR_API_KEY;

  let targetUrl = isDnsRequest
    ? `https://src.0zqq.com${targetPath.replace('/dns-v1', '/api/v1')}`
    : `https://api.leakradar.io${targetPath.replace('/leakradar', '/v1')}`;

  if (!API_KEY) {
    return res.status(500).json({ 
      error: 'Missing API Key', 
      details: `Please set ${isDnsRequest ? 'DNS_API_TOKEN' : 'LEAKRADAR_API_KEY'} in Vercel Environment Variables and redeploy.` 
    });
  }

  try {
    console.log(`Proxying request to: ${targetUrl}`);
    
    // 转发原始的 Accept 头，如果没有则默认为 application/json
    const acceptHeader = req.headers['accept'] || 'application/json';
    
    // 构造请求头
    const headers = {
      'Accept': acceptHeader,
      'Authorization': `Bearer ${API_KEY}`
    };

    // 如果有请求体，则转发 Content-Type
    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'];
    }

    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers: headers,
      data: req.body,
      responseType: 'arraybuffer' // 统一使用 arraybuffer 以支持二进制数据
    });

    // 转发上游响应的所有重要头信息
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    if (response.headers['content-disposition']) {
      res.setHeader('Content-Disposition', response.headers['content-disposition']);
    }
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }

    // 设置一些额外的头以确保浏览器正确处理下载
    if (targetPath.includes('/export') || targetPath.includes('/report')) {
      res.setHeader('Cache-Control', 'no-cache');
    }

    res.status(response.status).send(response.data);
  } catch (error) {
    console.error('Proxy Error:', error.message);
    if (error.response) {
      // 错误响应也要处理响应类型
      let errorData = error.response.data;
      if (Buffer.isBuffer(errorData)) {
        try {
          errorData = JSON.parse(errorData.toString());
        } catch (e) {
          errorData = errorData.toString();
        }
      }
      res.status(error.response.status).json({
        error: 'Upstream API Error',
        message: error.message,
        data: errorData
      });
    } else {
      res.status(500).json({ 
        error: 'Proxy execution error', 
        message: error.message
      });
    }
  }
}
