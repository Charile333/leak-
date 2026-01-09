import https from 'https';
import http from 'http';

export default async function handler(req, res) {
  console.log('[Proxy Handler] Received request:', req.method, req.url);
  
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-API-Key'
  );

  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    return res.status(200).json({ success: true, message: 'OPTIONS request handled' });
  }

  try {
    // 从环境变量获取API密钥和URL
    const LEAKRADAR_API_KEY = process.env.LEAKRADAR_API_KEY || process.env.VITE_LEAKRADAR_API_KEY;
    const API_BASE_URL = 'https://api.leakradar.io';
    
    // 移除/api前缀，获取真实的API路径
    const apiPath = req.url.replace(/^\/api/, '');
    const targetUrl = `${API_BASE_URL}${apiPath}`;
    
    console.log('[Proxy Handler] Proxying to:', targetUrl);
    
    // 构建请求选项
    const parsedUrl = new URL(targetUrl);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || (parsedUrl.protocol === 'https:' ? 443 : 80),
      path: parsedUrl.pathname + parsedUrl.search,
      method: req.method,
      headers: {
        ...req.headers,
        'X-API-Key': LEAKRADAR_API_KEY,
        'Authorization': LEAKRADAR_API_KEY ? `Bearer ${LEAKRADAR_API_KEY}` : '',
        'Host': parsedUrl.hostname,
        // 移除可能导致问题的头
        'Origin': '',
        'Referer': ''
      }
    };
    
    // 移除content-length头，让Node.js自动计算
    delete options.headers['content-length'];
    
    console.log('[Proxy Handler] Request Options:', {
      hostname: options.hostname,
      port: options.port,
      path: options.path,
      method: options.method,
      headers: {
        ...options.headers,
        // 隐藏API密钥
        'X-API-Key': LEAKRADAR_API_KEY ? '***REDACTED***' : '',
        'Authorization': LEAKRADAR_API_KEY ? 'Bearer ***REDACTED***' : ''
      }
    });
    
    // 选择HTTP或HTTPS模块
    const protocol = parsedUrl.protocol === 'https:' ? https : http;
    
    // 发送请求到上游API
    const proxyReq = protocol.request(options, (proxyRes) => {
      console.log('[Proxy Handler] Upstream response status:', proxyRes.statusCode);
      
      // 复制上游响应头到客户端
      Object.keys(proxyRes.headers).forEach(key => {
        res.setHeader(key, proxyRes.headers[key]);
      });
      
      // 添加CORS头，确保所有响应都能被前端访问
      res.setHeader('Access-Control-Allow-Origin', '*');
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      
      // 设置响应状态码
      res.writeHead(proxyRes.statusCode);
      
      // 转发响应数据
      proxyRes.pipe(res, { end: true });
    });
    
    // 处理代理请求错误
    proxyReq.on('error', (err) => {
      console.error('[Proxy Handler] Proxy request error:', err.message);
      res.status(500).json({
        error: 'Proxy Error',
        message: '无法连接到上游服务器',
        details: err.message
      });
    });
    
    // 转发请求体到上游API
    if (req.body) {
      proxyReq.write(JSON.stringify(req.body));
    }
    
    // 结束代理请求
    proxyReq.end();
    
  } catch (e) {
    console.error('[Proxy Handler] Error:', e.message, e.stack);
    res.status(500).json({
      error: 'Internal Error',
      message: '代理服务器内部错误',
      details: e.message
    });
  }
}