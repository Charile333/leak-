import axios from 'axios';

export default async function handler(req, res) {
  try {
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
    
    // 3. 构建尝试路径列表 (优先匹配官方标准路径)
    let prefixesToTry = [];
    if (isDnsRequest) {
      prefixesToTry = [`/api/v1${innerPath}`];
    } else {
      const cleanInnerPath = innerPath.replace(/\/$/, '');
      
      // 如果是导出相关路径，直接锁定官方端点，不进行多余探测
      if (cleanInnerPath.startsWith('/exports')) {
        prefixesToTry = [cleanInnerPath, `/v1${cleanInnerPath}`];
      } else if (cleanInnerPath.includes('/export')) {
        prefixesToTry = [cleanInnerPath, `/v1${cleanInnerPath}`];
      } else {
        // 其他普通请求保持探测逻辑
        prefixesToTry = [
          `/v1${cleanInnerPath}`, 
          cleanInnerPath,
          `/v1/search${cleanInnerPath.replace('/search', '')}`,
          `/v1/domain${cleanInnerPath.replace('/search/domain', '')}`,
          `/search${cleanInnerPath.replace('/search', '')}`,
          `/api/v1${cleanInnerPath}`,
        ].filter(Boolean);
      }
    }

    const host = isDnsRequest ? 'src.0zqq.com' : 'api.leakradar.io';
    
    // 4. 尝试发送请求
    let lastError;
    let lastTriedUrl = '';

    for (let i = 0; i < prefixesToTry.length; i++) {
      const currentPath = prefixesToTry[i];
      const currentUrl = `https://${host}${currentPath}${searchParams}`;
      lastTriedUrl = currentUrl;
      
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
          const axiosConfig = {
            method: req.method,
            url: currentUrl,
            headers: headers,
            responseType: 'arraybuffer',
            timeout: (req.url.includes('/export') || req.url.includes('/report')) ? 60000 : 30000,
            validateStatus: (status) => status < 400
          };

          if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase()) && req.body) {
            axiosConfig.data = req.body;
          }

          const response = await axios(axiosConfig);
          
          console.log(`[Proxy] [Success] ${currentUrl}`);
          return sendResponse(res, response, currentUrl);
        } catch (axiosError) {
          lastError = axiosError;
          const status = axiosError.response?.status;
          console.log(`[Proxy] [Failed ${status || 'ERR'}] ${currentUrl}`);
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
          const authHeaders = { 'Authorization': `Bearer ${API_KEY}`, 'X-API-Key': API_KEY };
          const axiosConfig = {
            method: req.method,
            url: fallbackUrl,
            headers: { ...authHeaders, 'Host': 'api.leakradar.io' },
            responseType: 'arraybuffer',
            timeout: 15000
          };
          if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase()) && req.body) {
            axiosConfig.data = req.body;
          }
          const response = await axios(axiosConfig);
          return sendResponse(res, response, fallbackUrl);
        } catch (e) {
          console.log(`Fallback ${fallback} failed: ${e.message}`);
        }
      }
    }
    
    return res.status(404).json({ 
      error: 'All paths failed', 
      last_url: lastTriedUrl,
      message: lastError?.message || 'Not Found'
    });

  } catch (error) {
    console.error('Proxy Fatal Error:', error.message);
    return res.status(500).json({ 
      error: 'Proxy execution error', 
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
}
