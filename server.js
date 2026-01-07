import express from 'express';
import cors from 'cors';
import axios from 'axios';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

// 创建Express应用
const app = express();
const PORT = process.env.PORT || 3001;

// 配置CORS
app.use(cors({
  origin: ['http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));

// 解析JSON请求体
app.use(express.json());

// 获取API密钥（从环境变量）
let LEAKRADAR_API_KEY = process.env.LEAKRADAR_API_KEY;
let OTX_API_KEY = process.env.OTX_API_KEY;

// 从.env文件加载密钥
if (!LEAKRADAR_API_KEY) {
  LEAKRADAR_API_KEY = process.env.VITE_LEAKRADAR_API_KEY;
}

if (!OTX_API_KEY) {
  OTX_API_KEY = process.env.VITE_OTX_API_KEY;
}

console.log('🔍 环境变量检查：');
console.log('   LEAKRADAR_API_KEY:', LEAKRADAR_API_KEY ? '已找到' : '未找到');
console.log('   VITE_LEAKRADAR_API_KEY:', process.env.VITE_LEAKRADAR_API_KEY ? '已找到' : '未找到');
console.log('   OTX_API_KEY:', OTX_API_KEY ? '已找到' : '未找到');

if (!LEAKRADAR_API_KEY) {
  console.error('❌ 错误：LEAKRADAR_API_KEY 或 VITE_LEAKRADAR_API_KEY 未在环境变量中设置');
  console.error('   请在.env文件中添加以下配置：');
  console.error('   VITE_LEAKRADAR_API_KEY=your_api_key_here');
  process.exit(1);
}

// 健康检查端点
app.get('/health', (req, res) => {
  console.log(`[Health Check] ${req.method} ${req.originalUrl}`);
  res.status(200).json({
    status: 'ok',
    message: 'Server is running'
  });
});

// 处理所有API请求的中间件
app.use((req, res, next) => {
  // 只处理/api开头的请求
  if (!req.originalUrl.startsWith('/api')) {
    return next();
  }
  
  // 调用API处理函数
  handleApiRequest(req, res);
});

// 所有/api/*请求的处理函数
async function handleApiRequest(req, res) {
  try {
    const url = req.originalUrl;
    
    console.log(`[Backend Proxy] ${req.method} ${url}`);
    
    // 处理OTX API请求
    if (url.startsWith('/api/otx')) {
      const upstreamUrl = 'https://otx.alienvault.com/api/v1';
      const targetUrl = `${upstreamUrl}${url.replace(/^\/api\/otx/, '')}`;
      
      console.log(`[Backend Proxy] -> ${targetUrl}`);
      
      // 构建请求头
      const headers = {
        ...req.headers,
        host: new URL(upstreamUrl).host,
        'X-OTX-API-KEY': OTX_API_KEY,
        // 移除可能导致问题的头
        'content-length': undefined,
        'transfer-encoding': undefined
      };
      
      // 发送请求到上游API
      const response = await axios({
        method: req.method,
        url: targetUrl,
        headers,
        data: req.body,
        responseType: 'stream'
      });
      
      // 设置响应头
      response.headers.forEach((value, key) => {
        res.setHeader(key, value);
      });
      
      // 设置响应状态码
      res.status(response.status);
      
      // 转发响应数据
      response.data.pipe(res);
      return;
    }
    
    // 处理LeakRadar API请求
    const upstreamUrl = 'https://api.leakradar.io';
    const targetUrl = `${upstreamUrl}${url.replace(/^\/api/, '')}`;
    
    console.log(`[Backend Proxy] -> ${targetUrl}`);
    
    // 构建请求头
    const headers = {
      ...req.headers,
      host: new URL(upstreamUrl).host,
      'Authorization': `Bearer ${LEAKRADAR_API_KEY}`,
      'X-API-Key': LEAKRADAR_API_KEY,
      // 移除可能导致问题的头
      'content-length': undefined,
      'transfer-encoding': undefined
    };
    
    // 发送请求到上游API
    const response = await axios({
      method: req.method,
      url: targetUrl,
      headers,
      data: req.body,
      responseType: 'stream'
    });
    
    // 设置响应头
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    // 设置响应状态码
    res.status(response.status);
    
    // 转发响应数据
    response.data.pipe(res);
  } catch (error) {
    console.error(`[Backend Proxy Error] ${req.method} ${req.originalUrl}:`, error.message);
    
    // 发送错误响应
    res.status(error.response?.status || 500).json({
      error: 'Proxy Error',
      message: '无法连接到上游服务器',
      details: error.message
    });
  }
}

// 404处理
app.use((req, res) => {
  console.log(`[404] ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Not Found',
    message: 'The requested resource was not found'
  });
});

// 启动服务器
app.listen(PORT, () => {
  console.log(`🚀 后端服务已启动，监听端口 ${PORT}`);
  console.log(`📡 健康检查: http://localhost:${PORT}/health`);
  console.log(`🔑 LeakRadar API Key: ${LEAKRADAR_API_KEY ? '已配置' : '未配置'}`);
  console.log(`🔑 OTX API Key: ${OTX_API_KEY ? '已配置' : '未配置'}`);
  console.log(`✨ 服务已准备就绪，等待前端请求...`);
});
