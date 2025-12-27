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
  let targetPath = url.pathname;
  if (targetPath.startsWith('/api')) {
    targetPath = targetPath.substring(4); // 去掉 /api
  }
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

  const innerPath = isDnsRequest ? targetPath.replace('/dns-v1', '') : targetPath.replace('/leakradar', '');
  
  // 3. 构建尝试路径列表 (更系统的探测)
  let prefixesToTry = [];
  if (isDnsRequest) {
    prefixesToTry = [`/api/v1${innerPath}`];
  } else {
    // LeakRadar 路径探测逻辑
    prefixesToTry = [
      // A. 基础路径 (最可能的 v1 路径)
      `/v1${innerPath}`, 
      `/v1/search${innerPath.replace('/search', '')}`,
      `/v1/domain${innerPath.replace('/search/domain', '')}`,
      
      // B. 原始路径 (不带版本号)
      innerPath,
      `/search${innerPath.replace('/search', '')}`,
      
      // C. 特殊处理导出/报告 (根据用户反馈的 404 重点解决)
      innerPath.includes('/unlock') ? `/v1/search/domain${innerPath.replace('/search/domain', '').replace('/unlock', '')}/unlock` : null,
      innerPath.includes('/report') ? `/v1/report/domain${innerPath.replace('/search/domain', '').replace('/report', '')}` : null,
      innerPath.includes('/export') ? `/v1/export/domain${innerPath.replace('/search/domain', '').replace('/export', '')}` : null,
      
      // D. 兼容旧版或备选 API 结构
      `/api/v1${innerPath}`,
      `/api/v1/search${innerPath.replace('/search', '')}`,
      `/v1/search/domain${innerPath.replace('/search/domain', '')}`,
      `/v1/profile${innerPath.replace('/profile', '')}`,
    ].filter(Boolean);
  }

  const host = isDnsRequest ? 'src.0zqq.com' : 'api.leakradar.io';
  
  // 4. 尝试发送请求
  let lastError;
  for (let i = 0; i < prefixesToTry.length; i++) {
    const currentPath = prefixesToTry[i];
    const currentUrl = `https://${host}${currentPath}${searchParams}`;
    
    // 尝试不同的鉴权头组合
    const authHeadersToTry = [
      { 'Authorization': `Bearer ${API_KEY}`, 'X-API-Key': API_KEY },
      { 'Authorization': API_KEY, 'X-API-Key': API_KEY }
    ];

    for (const authHeaders of authHeadersToTry) {
      const headers = {
        'Accept': req.headers['accept'] || 'application/json',
        ...authHeaders,
        'Host': host
      };

      if (req.headers['content-type']) {
        headers['Content-Type'] = req.headers['content-type'];
      }

      try {
        console.log(`[Proxy] [Try ${i+1}/${prefixesToTry.length}] ${req.method} ${currentUrl}`);
        const response = await axios({
          method: req.method,
          url: currentUrl,
          headers: headers,
          data: req.body,
          responseType: 'arraybuffer',
          timeout: (req.url.includes('/export') || req.url.includes('/report')) ? 60000 : 30000,
          validateStatus: (status) => status < 400 // 只有 < 400 才算成功
        });
        
        console.log(`[Proxy] [Success] ${currentUrl}`);
        return sendResponse(res, response, currentUrl);
      } catch (axiosError) {
        lastError = axiosError;
        const status = axiosError.response?.status;
        console.log(`[Proxy] [Failed ${status || 'ERR'}] ${currentUrl}`);
        
        // 如果不是 404/400/401，可能是网络或超时，不换头了直接换路径
        if (status !== 404 && status !== 400 && status !== 401) break;
      }
    }
  }

  // 5. 最后的兜底 (针对 stats 等)
  if (!isDnsRequest && targetPath.includes('stats')) {
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
