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

    // 2. 获取目标路径 (更健壮的解析)
    const url = new URL(req.url, `http://${req.headers.host}`);
    let targetPath = url.pathname;
    const searchParams = url.search || '';
    
    // 彻底剥离所有已知的前缀，拿到纯净的业务路径
    let innerPath = targetPath
      .replace(/^\/api/, '')
      .replace(/^\/leakradar/, '')
      .replace(/^\/api\/leakradar/, '');
    
    if (!innerPath.startsWith('/')) innerPath = '/' + innerPath;

    // 根据路径判断使用哪个 API
    const isDnsRequest = innerPath.startsWith('/dns-v1');
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

    if (isDnsRequest) {
      innerPath = innerPath.replace('/dns-v1', '');
    }
    
    // 3. 构建尝试路径列表 (优先匹配官方标准路径)
    let prefixesToTry = [];
    if (isDnsRequest) {
      prefixesToTry = [`/api/v1${innerPath}`];
    } else {
      const cleanInnerPath = innerPath.replace(/\/$/, '');
      
      // 特殊处理：如果路径以 /exports 开头（轮询状态接口）
      if (cleanInnerPath.startsWith('/exports/')) {
        const parts = cleanInnerPath.split('/');
        const id = parts[2];
        const isDownload = cleanInnerPath.endsWith('/download');
        prefixesToTry = [
          `/v1/exports/${id}${isDownload ? '/download' : ''}`,
          `/v1/search/export/${id}${isDownload ? '/download' : ''}`,
          `/exports/${id}${isDownload ? '/download' : ''}`,
          `/v1/export/${id}${isDownload ? '/download' : ''}`
        ];
      } else if (cleanInnerPath.includes('/leaks/@') || cleanInnerPath.includes('/unlock')) {
        // 彻底解决 /leaks/@domain 和 /unlock 接口 404
        // 提取 domain: 从 /leaks/@domain 或 /search/domain/domain/unlock 中提取
        const domainMatch = cleanInnerPath.match(/\/leaks\/@([^\/\?]+)/) || 
                            cleanInnerPath.match(/\/search\/domain\/([^\/\?]+)/);
        const domain = domainMatch ? domainMatch[1] : '';
        
        // 提取 type/category: 从 ?type= 或 路径中间提取
        const typeMatch = req.url.match(/type=([^&]+)/) || 
                          cleanInnerPath.match(/\/domain\/[^\/]+\/([^\/\?]+)/);
        const type = typeMatch ? typeMatch[1] : '';
        const isUnlock = cleanInnerPath.includes('/unlock');

        prefixesToTry = [
          // 1. 标准 search 路径 (解锁或查询)
          `/v1/search/domain/${domain}${type ? '/' + type : ''}${isUnlock ? '/unlock' : ''}`,
          // 2. 原始带 @ 路径
          `/v1${cleanInnerPath}`,
          // 3. 剥离 /search 的路径
          `/v1/domain/${domain}${type ? '/' + type : ''}${isUnlock ? '/unlock' : ''}`,
          // 4. 彻底透传
          cleanInnerPath,
          // 5. 加上 /search 前缀
          `/v1/search${cleanInnerPath}`
        ].filter(Boolean);
      } else if (cleanInnerPath.includes('/export')) {
        const parts = cleanInnerPath.split('/');
        const id = parts[parts.length - 1];
        const isDownload = cleanInnerPath.endsWith('/download');
        const realId = isDownload ? parts[parts.length - 2] : id;

        if (!isNaN(realId)) { // 如果路径中包含数字 ID
          prefixesToTry = [
            `/v1/exports/${realId}${isDownload ? '/download' : ''}`,
            `/v1/search/export/${realId}${isDownload ? '/download' : ''}`,
            `/exports/${realId}${isDownload ? '/download' : ''}`,
            `/v1/export/${realId}${isDownload ? '/download' : ''}`,
            `/search/export/${realId}${isDownload ? '/download' : ''}`,
            `/v1/search/domain/export/${realId}${isDownload ? '/download' : ''}`
          ];
        } else {
          prefixesToTry = [
            `/v1${cleanInnerPath}`,
            cleanInnerPath,
            `/v1/search${cleanInnerPath}`
          ];
        }
      } else {
        prefixesToTry = [
          `/v1${cleanInnerPath}`, 
          cleanInnerPath,
          `/v1/search${cleanInnerPath.replace('/search', '')}`,
          `/v1/domain${cleanInnerPath.replace('/search/domain', '')}`,
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
