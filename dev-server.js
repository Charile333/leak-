import http from 'http';
import https from 'https';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 获取API密钥和白名单（从环境变量）
const LEAKRADAR_API_KEY = process.env.LEAKRADAR_API_KEY || process.env.VITE_LEAKRADAR_API_KEY;
const WHITELISTED_USERS = process.env.WHITELISTED_USERS 
  ? JSON.parse(process.env.WHITELISTED_USERS)
  : [];
const OTX_API_KEY = process.env.OTX_API_KEY || process.env.VITE_OTX_API_KEY;

console.log('🔍 环境变量检查：');
console.log('   LEAKRADAR_API_KEY:', LEAKRADAR_API_KEY ? '已找到' : '未找到');
console.log('   WHITELISTED_USERS:', WHITELISTED_USERS.length > 0 ? `已找到 ${WHITELISTED_USERS.length} 个用户` : '未找到');
console.log('   OTX_API_KEY:', OTX_API_KEY ? '已找到' : '未找到');

if (!LEAKRADAR_API_KEY) {
  console.error('❌ 错误：LEAKRADAR_API_KEY 或 VITE_LEAKRADAR_API_KEY 未在环境变量中设置');
  process.exit(1);
}

// 如果白名单为空，添加示例用户
if (WHITELISTED_USERS.length === 0) {
  console.warn('⚠️  警告：WHITELISTED_USERS 未设置，添加示例用户到白名单');
  WHITELISTED_USERS.push('konaa2651@gmail.com');
  console.log('   示例用户已添加：konaa2651@gmail.com');
}

// 创建HTTP服务器
const server = http.createServer((req, res) => {
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
    res.writeHead(200);
    res.end();
    return;
  }

  const url = req.url;
  
  console.log(`[Dev Server] ${req.method} ${url}`);
  
  // 健康检查
  if (url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      status: 'ok',
      message: 'Development server is running',
      whitelist: {
        count: WHITELISTED_USERS.length,
        users: WHITELISTED_USERS
      }
    }));
    return;
  }
  
  // 处理白名单API请求
  if (url === '/api/auth/whitelist') {
    if (req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        whitelist: WHITELISTED_USERS,
        count: WHITELISTED_USERS.length,
        lastUpdated: new Date().toISOString()
      }));
      return;
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Method Not Allowed',
        message: 'Only GET requests are allowed for this endpoint'
      }));
      return;
    }
  }
  
  // 处理登录API请求
  if (url === '/api/auth/login') {
    if (req.method === 'POST') {
      // 读取请求体
          getRequestBody(req).then(body => {
            try {
              const { email } = JSON.parse(body);
              
              // 白名单验证
              if (!WHITELISTED_USERS.includes(email)) {
                console.log(`[Whitelist] User ${email} denied access (not in whitelist)`);
                res.writeHead(403, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  error: 'Forbidden',
                  message: '您的邮箱不在白名单中，无法登录'
                }));
                return;
              }
              
              console.log(`[Whitelist] User ${email} granted access (in whitelist)`);
              
              // 由于LeakRadar API没有登录端点，直接返回成功响应
              // 应用将使用API密钥进行后续请求验证
              res.writeHead(200, { 'Content-Type': 'application/json' });
              res.end(JSON.stringify({
                success: true,
                message: '登录成功',
                user: {
                  email: email,
                  name: email.split('@')[0],
                  role: 'user'
                }
              }));
              return;
        } catch (error) {
          console.error('[Dev Server Error] Invalid JSON:', error.message);
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({
            error: 'Bad Request',
            message: '无效的请求体格式'
          }));
        }
      }).catch(error => {
        console.error('[Dev Server Error] Reading request body:', error.message);
        res.writeHead(500, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
          error: 'Internal Server Error',
          message: '读取请求体失败'
        }));
      });
      return;
    } else {
      res.writeHead(405, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Method Not Allowed',
        message: 'Only POST requests are allowed for this endpoint'
      }));
      return;
    }
  }
  
  // 只处理/api请求
  if (!url.startsWith('/api')) {
    res.writeHead(404, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Not Found',
      message: 'The requested resource was not found'
    }));
    return;
  }
  
  // 处理其他API请求
  handleApiRequest(req, res);
});

// 处理API请求
async function handleApiRequest(req, res) {
  try {
    const url = req.url;
    
    // 构建目标URL
    let upstreamUrl;
    let targetUrl;
    let headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
    
    // 处理OTX API请求
    if (url.startsWith('/api/otx')) {
      upstreamUrl = 'https://otx.alienvault.com/api/v1';
      targetUrl = `${upstreamUrl}${url.replace(/^\/api\/otx/, '')}`;
      headers['X-OTX-API-KEY'] = OTX_API_KEY;
    } else {
      // 处理LeakRadar API请求
      upstreamUrl = 'https://api.leakradar.io';
      targetUrl = `${upstreamUrl}${url.replace(/^\/api/, '')}`;
      headers['Authorization'] = `Bearer ${LEAKRADAR_API_KEY}`;
      headers['X-API-Key'] = LEAKRADAR_API_KEY;
    }
    
    console.log(`[Dev Server] -> ${targetUrl}`);
    
    // 获取请求数据
    const body = await getRequestBody(req);
    
    // 发送请求到上游API
    const options = {
      method: req.method,
      headers: headers,
      timeout: 10000,
    };
    
    if (body) {
      options.headers['Content-Length'] = Buffer.byteLength(body);
    }
    
    const protocol = upstreamUrl.startsWith('https') ? https : http;
    
    protocol.request(targetUrl, options, (upstreamRes) => {
      console.log(`[Dev Server] <- ${upstreamRes.statusCode} ${targetUrl}`);
      
      // 设置响应头
      for (const [key, value] of Object.entries(upstreamRes.headers)) {
        res.setHeader(key, value);
      }
      
      // 设置CORS头
      res.setHeader('Access-Control-Allow-Credentials', 'true');
      res.setHeader('Access-Control-Allow-Origin', '*');
      
      // 设置响应状态码
      res.writeHead(upstreamRes.statusCode || 200);
      
      // 转发响应数据
      upstreamRes.pipe(res);
    })
    .on('error', (error) => {
      console.error(`[Dev Server Error] ${req.method} ${url}:`, error.message);
      res.writeHead(500, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({
        error: 'Proxy Error',
        message: '无法连接到上游服务器',
        details: error.message
      }));
    })
    .end(body);
    
  } catch (error) {
    console.error(`[Dev Server Error] ${req.method} ${req.url}:`, error.message);
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({
      error: 'Proxy Error',
      message: '无法处理API请求',
      details: error.message
    }));
  }
}

// 获取请求体
function getRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    
    req.on('data', (chunk) => {
      body += chunk;
    });
    
    req.on('end', () => {
      resolve(body);
    });
    
    req.on('error', (error) => {
      reject(error);
    });
  });
}

// 启动服务器
const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`🚀 开发服务器已启动，监听端口 ${PORT}`);
  console.log(`📡 健康检查: http://localhost:${PORT}/health`);
  console.log(`🔑 LeakRadar API Key: ${LEAKRADAR_API_KEY ? '已配置' : '未配置'}`);
  console.log(`📋 白名单用户数量: ${WHITELISTED_USERS.length}`);
  console.log(`🔑 OTX API Key: ${OTX_API_KEY ? '已配置' : '未配置'}`);
  console.log(`✨ 服务已准备就绪，等待前端请求...`);
  console.log(`📝 白名单用户: ${WHITELISTED_USERS.join(', ')}`);
});
