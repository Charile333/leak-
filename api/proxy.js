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
    
    // 强制透传所有关键的下载头
    const headersToForward = [
      'content-type',
      'content-disposition',
      'content-length',
      'cache-control',
      'content-encoding'
    ];

    headersToForward.forEach(header => {
      if (response.headers[header]) {
        res.setHeader(header, response.headers[header]);
      }
    });

    // 如果没有 content-disposition 但 URL 包含 export/report，且返回的是流
    if (!response.headers['content-disposition'] && (req.url.includes('/export') || req.url.includes('/report'))) {
      const extension = response.headers['content-type']?.includes('pdf') ? 'pdf' : 'csv';
      res.setHeader('Content-Disposition', `attachment; filename="export.${extension}"`);
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
    const isDnsRequest = targetPath.startsWith('/dns-v1');
    const innerPath = isDnsRequest ? targetPath.replace('/dns-v1', '') : targetPath.replace('/leakradar', '');
    
    let prefixesToTry = [];
    if (isDnsRequest) {
      prefixesToTry = [`/api/v1${innerPath}`];
    } else {
      prefixesToTry = [
        innerPath, // 1. /search/domain/...
        `/v1${innerPath}`, // 2. /v1/search/domain/...
        `/api/v1${innerPath}`, // 3. /api/v1/search/domain/...
        innerPath.replace('/search', '/v1'), // 4. /v1/domain/...
        innerPath.replace('/search', '/api/v1'), // 5. /api/v1/domain/...
        `/v1${innerPath.replace('/search', '')}`, // 6. /v1/domain/... (another variant)
        innerPath.replace('/search/domain', '/v1/report/domain'), // 7. /v1/report/domain/.../report
        innerPath.replace('/search/domain', '/v1/report/domain').replace('/report', ''), // 7b. /v1/report/domain/...
        innerPath.replace('/search/domain', '/v1/export/domain'), // 8. /v1/export/domain/.../export
        innerPath.replace('/search/domain', '/v1/export/domain').replace('/export', ''), // 8b. /v1/export/domain/...
        innerPath.replace('/search/export', '/v1/search/export'), // 9. 特殊处理 export status/download
        innerPath.replace('/search/export', '/v1/export'), // 10. 特殊处理 export status/download
        innerPath.replace('/search/export', '/api/v1/export'), // 10b. 尝试 /api/v1/export/...
        `/v1/search${innerPath}`, // 11. 显式增加 /v1/search 前缀
        innerPath.replace('/search/domain', '/v1/search/domain'), // 12. 确保 /v1/search/domain/...
        innerPath.replace('/search/domain', '/v1/domain'), // 13. 尝试 /v1/domain/...
        `/api/v1/search${innerPath.replace('/search', '')}`, // 14. /api/v1/search/advanced
        `/v1/search${innerPath.replace('/search', '')}`, // 15. /v1/search/advanced
        innerPath.replace('/search/domain', '/v1/search/domain').replace('/unlock', ''), // 16. /v1/search/domain/...
        innerPath.replace('/search/domain', '/v1/domain').replace('/unlock', ''), // 17. /v1/domain/...
        innerPath.replace('/search/domain', '/v1/search/domain').replace('/report', ''), // 18. /v1/search/domain/...
        innerPath.replace('/search/domain', '/v1/search/domain').replace('/export', ''), // 19. /v1/search/domain/...
      ];
    }

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
          timeout: (req.url.includes('/export') || req.url.includes('/report')) ? 60000 : 30000
        });
        
        console.log(`Success with path: ${currentUrl}`);
        targetUrl = currentUrl;
        return sendResponse(res, response, targetUrl);
      } catch (axiosError) {
        const status = axiosError.response?.status;
        console.log(`Failed path [${status || 'ERROR'}]: ${currentUrl}`);
        
        // 如果是 404 或者 400 (Bad Request，有时路径不对也会报400)，则继续尝试下一个路径
        if (status === 404 || status === 400) {
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
