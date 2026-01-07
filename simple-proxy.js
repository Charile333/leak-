// 简单的Node.js代理服务器，用于解决CORS问题
import http from 'http';
import https from 'https';
import url from 'url';
import { createReadStream } from 'fs';
import { readFileSync } from 'fs';

// 读取环境变量
const API_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJrb25hYTI2NTFAZ21haWwuY29tIiwianRpIjoiZmU3MmE0ZjMtNDg2OC00ZGZiLTk2MzMtMGM5Y2M2YjhlNjlhIiwidHlwZSI6ImFjY2VzcyJ9.GoSMTP9Lwj_UIXyKU6rDlBYI9AunStGnI0lQ52JO4p0';

// 创建代理服务器
const proxyServer = http.createServer((req, res) => {
  const parsedUrl = url.parse(req.url);
  const path = parsedUrl.pathname;
  
  console.log(`[Proxy] ${req.method} ${req.url}`);
  
  // 设置CORS头
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');
  
  // 处理OPTIONS请求
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }
  
  // 处理API请求
  if (path.startsWith('/api/leakradar')) {
    // 移除/api/leakradar前缀
    const apiPath = path.replace(/^\/api\/leakradar/, '') || '/';
    
    // 构建目标URL
    const targetUrl = `https://api.leakradar.io${apiPath}${parsedUrl.search || ''}`;
    
    console.log(`[Proxy] Forwarding to: ${targetUrl}`);
    
    // 复制请求头
    const headers = {
      ...req.headers,
      'Host': 'api.leakradar.io',
      'Authorization': `Bearer ${API_KEY}`,
      'X-API-Key': API_KEY,
      // 移除可能导致问题的头
      'Origin': undefined,
      'Referer': undefined,
    };
    
    // 创建HTTPS请求
    const httpsReq = https.request(targetUrl, {
      method: req.method,
      headers: headers,
    }, (httpsRes) => {
      // 设置响应头
      res.statusCode = httpsRes.statusCode;
      
      // 复制响应头
      Object.entries(httpsRes.headers).forEach(([key, value]) => {
        if (value) {
          res.setHeader(key, value);
        }
      });
      
      // 管道响应数据
      httpsRes.pipe(res);
    });
    
    // 处理错误
    httpsReq.on('error', (err) => {
      console.error(`[Proxy Error] ${err.message}`);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: err.message }));
    });
    
    // 管道请求数据
    req.pipe(httpsReq);
    
  } else {
    // 处理静态文件请求 - 从dist目录提供
    let filePath = './dist' + path;
    if (filePath === './dist/') {
      filePath = './dist/index.html';
    }
    
    try {
      const fileStream = createReadStream(filePath);
      
      // 设置内容类型
      let contentType = 'text/plain';
      if (filePath.endsWith('.html')) {
        contentType = 'text/html';
      } else if (filePath.endsWith('.js')) {
        contentType = 'application/javascript';
      } else if (filePath.endsWith('.css')) {
        contentType = 'text/css';
      } else if (filePath.endsWith('.json')) {
        contentType = 'application/json';
      } else if (filePath.endsWith('.png')) {
        contentType = 'image/png';
      } else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) {
        contentType = 'image/jpeg';
      }
      
      res.setHeader('Content-Type', contentType);
      fileStream.pipe(res);
    } catch (err) {
      console.error(`[File Error] ${err.message} for ${filePath}`);
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ error: 'File not found' }));
    }
  }
});

// 启动服务器
const PORT = 3000;
proxyServer.listen(PORT, () => {
  console.log(`🚀 简单代理服务器已启动，运行在 http://localhost:${PORT}`);
  console.log(`📡 API代理: http://localhost:${PORT}/api/leakradar -> https://api.leakradar.io`);
  console.log(`📂 静态文件: http://localhost:${PORT}`);
});
