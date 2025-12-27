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

  // 辅助函数：统一发送响应
  function sendResponse(res, response, targetUrl) {
    res.setHeader('X-Proxy-Target', targetUrl);
    if (response.headers['content-type']) {
      res.setHeader('Content-Type', response.headers['content-type']);
    }
    if (response.headers['content-disposition']) {
      res.setHeader('Content-Disposition', response.headers['content-disposition']);
    }
    if (response.headers['content-length']) {
      res.setHeader('Content-Length', response.headers['content-length']);
    }

    if (req.url.includes('/export') || req.url.includes('/report')) {
      res.setHeader('Cache-Control', 'no-cache');
    }

    return res.status(response.status).send(response.data);
  }

  // 2. 获取目标路径
  const url = new URL(req.url, `http://${req.headers.host}`);
  const targetPath = url.pathname.replace('/api', '');
  const searchParams = url.search;
  
  // 根据路径判断使用哪个 API
  const isDnsRequest = targetPath.startsWith('/dns-v1');
  const API_KEY = isDnsRequest 
    ? (process.env.DNS_API_TOKEN || process.env.VITE_DNS_API_TOKEN)
    : (process.env.LEAKRADAR_API_KEY || process.env.VITE_LEAKRADAR_API_KEY);

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
    // 彻查：对于 leakradar，我们尝试不带 /v1 的路径作为首选，
    // 因为 vite.config.ts 中就是这么配置的，而且用户说“突然不行了”
    // 可能是 API 结构调整或 v1 路径不再是默认
    const directPath = targetPath.replace('/leakradar', '');
    targetUrl = `https://api.leakradar.io${directPath}${searchParams}`;
  }

  const headers = {
    'Accept': req.headers['accept'] || 'application/json',
    'Authorization': `Bearer ${API_KEY}`,
    'X-API-Key': API_KEY,
    'Host': isDnsRequest ? 'src.0zqq.com' : 'api.leakradar.io'
  };

  if (req.headers['content-type']) {
    headers['Content-Type'] = req.headers['content-type'];
  }

  try {
    console.log(`Proxying ${req.method} request to: ${targetUrl}`);
    
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
      // 如果 404，尝试 /v1 路径
      if (axiosError.response && axiosError.response.status === 404 && !isDnsRequest) {
        const v1Path = targetPath.replace('/leakradar', '/v1');
        const v1Url = `https://api.leakradar.io${v1Path}${searchParams}`;
        
        console.log(`Direct path 404, trying v1 path: ${v1Url}`);
        try {
          response = await axios({
            method: req.method,
            url: v1Url,
            headers: headers,
            data: req.body,
            responseType: 'arraybuffer',
            timeout: 10000
          });
          targetUrl = v1Url; // 成功了，更新记录
        } catch (v1Error) {
          // 如果还是不行，且是 stats 请求，尝试更多备选路径
          if (targetPath.includes('stats')) {
            const statsFallbacks = [
              '/v1/metadata/stats',
              '/metadata/stats',
              '/v1/info',
              '/info'
            ];
            
            for (const fallback of statsFallbacks) {
              const fallbackUrl = `https://api.leakradar.io${fallback}${searchParams}`;
              console.log(`Trying stats fallback: ${fallbackUrl}`);
              try {
                response = await axios({
                  method: req.method,
                  url: fallbackUrl,
                  headers: headers,
                  data: req.body,
                  responseType: 'arraybuffer',
                  timeout: 10000
                });
                targetUrl = fallbackUrl;
                return sendResponse(res, response, targetUrl); // 成功即返回
              } catch (e) {
                console.log(`Fallback ${fallback} failed: ${e.message}`);
              }
            }
          }
          throw v1Error; // 抛出最后的错误
        }
      } else {
        throw axiosError;
      }
    }

    return sendResponse(res, response, targetUrl);
  } catch (error) {
    console.error('Proxy Error:', error.message);
    if (error.response) {
      // 错误响应也要处理响应类型
      res.setHeader('X-Proxy-Error', error.message);
      if (targetUrl) res.setHeader('X-Proxy-Target', targetUrl);
      
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
