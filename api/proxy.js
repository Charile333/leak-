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
    const directPath = isDnsRequest ? targetPath.replace('/dns-v1', '') : targetPath.replace('/leakradar', '');
    const prefixesToTry = isDnsRequest 
      ? [`/api/v1${directPath}`]
      : [
          directPath, // 1. /search/domain/...
          `/v1${directPath}`, // 2. /v1/search/domain/...
          `/api/v1${directPath}`, // 3. /api/v1/search/domain/...
          directPath.replace('/search', '/v1'), // 4. /v1/domain/...
          directPath.replace('/search', '/api/v1'), // 5. /api/v1/domain/...
          `/v1${directPath.replace('/search', '')}`, // 6. /v1/domain/... (another variant)
          directPath.replace('/search/domain', '/v1/report/domain'), // 7. 特殊处理 report
          directPath.replace('/search/domain', '/v1/export/domain'), // 8. 特殊处理 export
        ];

    const host = isDnsRequest ? 'src.0zqq.com' : 'api.leakradar.io';
    
    for (let i = 0; i < prefixesToTry.length; i++) {
      const currentPath = prefixesToTry[i];
      const currentUrl = `https://${host}${currentPath}${searchParams}`;
      
      try {
        console.log(`Trying proxy path [${i+1}/${prefixesToTry.length}]: ${currentUrl}`);
        response = await axios({
          method: req.method,
          url: currentUrl,
          headers: headers,
          data: req.body,
          responseType: 'arraybuffer',
          timeout: (req.url.includes('/export') || req.url.includes('/report')) ? 60000 : 15000
        });
        
        targetUrl = currentUrl;
        return sendResponse(res, response, targetUrl);
      } catch (axiosError) {
        // 如果是最后一个尝试也失败了，或者不是 404，则记录并继续或抛出
        if (axiosError.response && axiosError.response.status === 404) {
          console.log(`Path 404: ${currentUrl}`);
          if (i === prefixesToTry.length - 1) throw axiosError;
          continue;
        }
        
        // 如果是 stats 相关的 404，且我们还没尝试完基础前缀，也继续
        if (targetPath.includes('stats') && i < prefixesToTry.length - 1) {
          continue;
        }

        throw axiosError;
      }
    }

    // 最后的兜底逻辑（针对 stats）
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
             timeout: 15000
           });
           targetUrl = fallbackUrl;
           return sendResponse(res, response, targetUrl);
         } catch (e) {
           console.log(`Fallback ${fallback} failed: ${e.message}`);
         }
       }
     }
     
     return res.status(404).json({ error: 'All paths failed', last_url: targetUrl });
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
