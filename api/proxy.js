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

  // 2. 获取目标路径
  const url = new URL(req.url, `http://${req.headers.host}`);
  const targetPath = url.pathname.replace('/api', '');
  const searchParams = url.search;
  
  // 根据路径判断使用哪个 API
  const isDnsRequest = targetPath.startsWith('/dns-v1');
  const API_KEY = isDnsRequest 
    ? (process.env.DNS_API_TOKEN || process.env.VITE_DNS_API_TOKEN)
    : process.env.LEAKRADAR_API_KEY;

  if (!API_KEY) {
    console.error(`Missing API Key for ${isDnsRequest ? 'DNS' : 'LeakRadar'}`);
    return res.status(500).json({ 
      error: 'Missing API Key', 
      details: `Please set ${isDnsRequest ? 'DNS_API_TOKEN' : 'LEAKRADAR_API_KEY'} in Vercel Environment Variables.` 
    });
  }

  let targetUrl;
  if (isDnsRequest) {
    targetUrl = `https://src.0zqq.com${targetPath.replace('/dns-v1', '/api/v1')}${searchParams}`;
  } else {
    // 处理 leakradar 请求
    // 基础路径映射：/leakradar -> /v1
    let leakPath = targetPath.replace('/leakradar', '/v1');
    
    // 彻查：如果请求的是 /v1/stats，我们尝试自动适配可能的正确路径
    // 根据官方文档和常见模式，stats 可能在 /metadata/stats 或 /stats
    targetUrl = `https://api.leakradar.io${leakPath}${searchParams}`;
  }

  try {
    console.log(`Proxying ${req.method} request to: ${targetUrl}`);
    
    const headers = {
      'Accept': req.headers['accept'] || 'application/json',
      'Authorization': `Bearer ${API_KEY}`
    };

    if (req.headers['content-type']) {
      headers['Content-Type'] = req.headers['content-type'];
    }

    let response;
    try {
      response = await axios({
        method: req.method,
        url: targetUrl,
        headers: headers,
        data: req.body,
        responseType: 'arraybuffer',
        timeout: 10000 // 10s timeout
      });
    } catch (axiosError) {
      // 彻查：如果 /v1/stats 返回 404，尝试 /v1/metadata/stats
      if (axiosError.response && axiosError.response.status === 404 && targetUrl.endsWith('/v1/stats')) {
        const altUrl = targetUrl.replace('/v1/stats', '/v1/metadata/stats');
        console.log(`Primary stats endpoint 404, trying alternative: ${altUrl}`);
        try {
          response = await axios({
            method: req.method,
            url: altUrl,
            headers: headers,
            data: req.body,
            responseType: 'arraybuffer',
            timeout: 10000
          });
        } catch (altError) {
          // 如果还是不行，抛出原始错误
          throw axiosError;
        }
      } else {
        throw axiosError;
      }
    }

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
