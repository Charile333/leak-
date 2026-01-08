import axios from 'axios';
import { Buffer } from 'buffer';

export default async function handler(req, res) {
  try {
    // 1. 设置跨域头
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-API-Key'
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
    
    // 演示模式：强制限制每次查询最多10条结果
    // 设置固定的page_size为10
    url.searchParams.set('page_size', '10');
    // 如果是解锁请求，添加限制参数
    if (targetPath.includes('/unlock')) {
      url.searchParams.set('limit', '10');
    }
    
    const searchParams = url.search || '';
    
    // 彻底剥离所有已知的前缀，拿到纯净的业务路径
    let innerPath = targetPath
      .replace(/^\/api/, '')
      .replace(/^\/leakradar/, '')
      .replace(/^\/api\/leakradar/, '');
    
    if (!innerPath.startsWith('/')) innerPath = '/' + innerPath;

    // 根据路径判断使用哪个 API
    const isDnsRequest = innerPath.startsWith('/dns-v1');
    let API_KEY = isDnsRequest 
      ? (process.env.DNS_API_TOKEN || process.env.VITE_DNS_API_TOKEN)
      : (process.env.LEAKRADAR_API_KEY || process.env.VITE_LEAKRADAR_API_KEY);

    if (typeof API_KEY === 'string') {
      API_KEY = API_KEY.trim();
    }

    // 如果环境变量没有配置 Key，尝试从请求头获取 (支持前端传过来的 Authorization)
    if (!API_KEY) {
      if (req.headers['authorization']?.startsWith('Bearer ')) {
        API_KEY = req.headers['authorization'].replace('Bearer ', '');
      } else if (req.headers['x-api-key']) {
        API_KEY = req.headers['x-api-key'];
      }
    }

    if (!API_KEY) {
      console.error(`Missing API Key for ${isDnsRequest ? 'DNS' : 'LeakRadar'}`);
      return res.status(500).json({ 
        error: 'Missing API Key', 
        details: `Please set ${isDnsRequest ? 'DNS_API_TOKEN' : 'LEAKRADAR_API_KEY'} in Vercel Environment Variables.` 
      });
    }

    // 3. 构建尝试路径列表 (优先匹配官方标准路径)
    let prefixesToTry = [];
    const cleanInnerPath = isDnsRequest ? innerPath.replace('/dns-v1', '') : innerPath.replace(/\/$/, '');

    if (isDnsRequest) {
      prefixesToTry = [`/api/v1${cleanInnerPath}`];
    } else {
      
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
        // 针对域名查询和解锁的路径优化
        // 1. 提取域名
        const domainMatch = cleanInnerPath.match(/\/domain\/([^\/\?]+)/) || 
                            cleanInnerPath.match(/\/leaks\/@([^\/\?]+)/);
        const domain = domainMatch ? domainMatch[1] : '';
        
        // 2. 提取子路径 (如 /subdomains, /urls, /employees/unlock)
        // 找到域名后面的部分
        let subPath = '';
        if (domain) {
          const domainIndex = cleanInnerPath.indexOf(domain);
          subPath = cleanInnerPath.substring(domainIndex + domain.length);
        }

        prefixesToTry = [
          // 方案 1: 最标准的 v1 search 路径 (保留子路径)
          `/v1/search/domain/${domain}${subPath}`,
          // 方案 2: 极简 v1 路径
          `/v1/domain/${domain}${subPath}`,
          // 方案 2.5: 针对解锁的备选路径 (移除 category 直接在 domain 下解锁)
          subPath.includes('/unlock') ? `/v1/search/domain/${domain}/unlock` : null,
          subPath.includes('/unlock') ? `/v1/domain/${domain}/unlock` : null,
          // 方案 3: 带 @ 的 leaks 路径 (如果是查询)
          !subPath || subPath === '/' ? `/v1/leaks/@${domain}` : null,
          // 方案 4: 直接透传
          cleanInnerPath.startsWith('/v1') ? cleanInnerPath : `/v1${cleanInnerPath}`,
          // 方案 5: 原始路径
          cleanInnerPath
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
          '/v1/search/stats',
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
        { 'Authorization': `Bearer ${API_KEY}` },
        { 'X-API-Key': API_KEY },
        { 'Authorization': API_KEY }
      ];

      for (const authHeaders of authHeadersToTry) {
        const headers = {
          'Accept': req.headers['accept'] || 'application/json',
          ...authHeaders,
          'Host': host
        };

        if (req.headers['content-type'] && req.method.toUpperCase() !== 'GET') {
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

          // 强制删除 Host 标头，让 Axios 根据 URL 自动生成正确的 Host
          delete axiosConfig.headers['Host'];
          delete axiosConfig.headers['host'];

          if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method.toUpperCase())) {
            // 如果请求本身有 body，则透传
            if (typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
              axiosConfig.data = JSON.stringify(req.body);
              headers['Content-Type'] = 'application/json';
            } else {
              axiosConfig.data = req.body;
            }

            // 增加兜底：如果是 POST 且没有 body，发送空对象，防止某些后端返回 400
            if (!axiosConfig.data && req.method.toUpperCase() === 'POST') {
              axiosConfig.data = '{}';
              headers['Content-Type'] = 'application/json';
            }

            if (axiosConfig.data) {
              try {
                // 只有字符串或 Buffer 才计算长度，避免对象导致崩溃
                if (typeof axiosConfig.data === 'string' || Buffer.isBuffer(axiosConfig.data)) {
                  headers['Content-Length'] = Buffer.byteLength(axiosConfig.data).toString();
                }
              } catch (e) {
                console.warn('[Proxy] Failed to set Content-Length:', e.message);
              }
            }
          }

          const response = await axios(axiosConfig);
          
          console.log(`[Proxy] [Success] ${currentUrl}`);
          return sendResponse(res, response, currentUrl, prefixesToTry);
        } catch (axiosError) {
          lastError = axiosError;
          const status = axiosError.response?.status;
          
          // 读取详细错误信息
          let errorDetail = 'No detail';
          if (axiosError.response?.data) {
            try {
              // 尝试解析错误信息
              if (axiosError.response.data instanceof ArrayBuffer || axiosError.response.data instanceof Buffer) {
                const decoder = new TextDecoder('utf-8');
                errorDetail = decoder.decode(axiosError.response.data);
              } else if (typeof axiosError.response.data === 'object') {
                errorDetail = JSON.stringify(axiosError.response.data);
              } else {
                errorDetail = String(axiosError.response.data);
              }
            } catch (e) {
              errorDetail = 'Failed to decode error data';
            }
          }
          
          console.log(`[Proxy] [Failed ${status || 'ERR'}] ${currentUrl} - Detail: ${errorDetail}`);
          
          // 如果是 401，继续尝试下一个 authHeader
          if (status === 401) continue;
          
          // 记录下非 401 的错误详情，以便最后返回
          if (status && status >= 400) {
            // 确保 errorDetail 被正确赋值
            if (!errorDetail || errorDetail === 'No detail') {
               try {
                 errorDetail = JSON.stringify(axiosError.response?.data || {});
               } catch (e) {
                 errorDetail = 'Could not stringify error data';
               }
            }

            lastError = {
              status,
              message: axiosError.message,
              detail: errorDetail,
              url: currentUrl,
              response_data: axiosError.response?.data // 直接保存原始数据以防 stringify 失败
            };
          }

          // 如果是其他错误（包括 404, 500, 400），跳过当前 path 的其他 authHeader，尝试下一个 path
          break;
        }
      }
    }

    // 5. 所有尝试都失败
    const finalStatus = lastError?.status || 500;
    // 优先使用 detail，如果没有则使用 message
    const finalDetail = lastError?.detail || lastError?.message || 'Unknown error';
    // 尝试获取原始响应数据（如果是对象）
    const finalResponseData = lastError?.response_data || null;
    
    return res.status(finalStatus).json({
      error: 'Proxy request failed after multiple attempts',
      message: lastError?.message || 'Multiple attempts failed',
      detail: finalDetail, // 这是一个字符串
      data: finalResponseData, // 这是一个对象（如果可用），方便前端展开查看
      path: cleanInnerPath,
      tried: prefixesToTry,
      api_key_status: API_KEY ? 'Present' : 'Missing',
      is_dns: isDnsRequest
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
