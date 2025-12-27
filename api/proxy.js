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
    function sendResponse(res, response, targetUrl, triedPaths = []) {
      res.setHeader('X-Proxy-Target', targetUrl);
      res.setHeader('X-Proxy-Tried-Paths', triedPaths.join(', '));
      
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
      } else if (cleanInnerPath.includes('/domain/') || cleanInnerPath.includes('/leaks/@')) {
        // 针对域名查询的路径优化
        const domainMatch = cleanInnerPath.match(/\/domain\/([^\/\?]+)/) || 
                            cleanInnerPath.match(/\/leaks\/@([^\/\?]+)/);
        const domain = domainMatch ? domainMatch[1] : '';
        
        // 提取子路径 (如 /subdomains, /urls, /employees 等)
        let subPath = '';
        if (domain) {
          const parts = cleanInnerPath.split(domain);
          if (parts.length > 1) {
            subPath = parts[1].split('?')[0]; // 获取域名后的部分，排除 query
          }
        }

        // 自动识别 category
        let category = '';
        if (cleanInnerPath.includes('/employees')) category = 'employees';
        else if (cleanInnerPath.includes('/customers')) category = 'customers';
        else if (cleanInnerPath.includes('/third_parties')) category = 'third_parties';
        
        prefixesToTry = [
          // 方案 1: 标准 search 路径
          `/v1/search/domain/${domain}${subPath}`,
          // 方案 2: 极简 domain 路径
          `/v1/domain/${domain}${subPath}`,
          // 方案 2.5: metadata 路径 (常用总结路径)
          subPath === '' || subPath === '/' ? `/v1/metadata/domain/${domain}` : null,
          subPath === '' || subPath === '/' ? `/v1/info/domain/${domain}` : null,
          // 方案 3: 特殊处理子域名和 URL (某些 API 版本可能在顶层)
          subPath.includes('subdomains') ? `/v1/subdomains/${domain}` : null,
          subPath.includes('urls') ? `/v1/urls/${domain}` : null,
          // 方案 4: leaks 路径 (用于解锁和查询)
          `/v1/leaks/@${domain}${category ? '?type=' + category : ''}`,
          // 方案 5: 直接透传
          cleanInnerPath.startsWith('/v1') ? cleanInnerPath : `/v1${cleanInnerPath}`
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
      } else if (cleanInnerPath.includes('/stats')) {
        prefixesToTry = [
          '/v1/metadata/stats',
          '/v1/stats',
          '/metadata/stats',
          '/stats',
          '/v1/info'
        ];
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
          return sendResponse(res, response, currentUrl, prefixesToTry);
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
    
    // 所有尝试都失败
    console.error(`All ${prefixesToTry.length} attempts failed for ${innerPath}. Last error:`, lastError?.message);
    return res.status(lastError?.response?.status || 500).json({
      error: "Proxy request failed after multiple attempts",
      message: lastError?.message,
      path: innerPath,
      tried: prefixesToTry
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
