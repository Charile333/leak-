import proxyHandler from './proxy.js';

export default async function handler(req, res) {
  console.log('[Dynamic Route] Received request:', req.method, req.url);
  
  try {
    // 直接使用proxyHandler处理所有API请求
    // auth请求已经在vercel.json中设置了专门的路由，不会走到这里
    console.log('[Dynamic Route] Proxying request:', req.url);
    return proxyHandler(req, res);
  } catch (e) {
    console.error('[Dynamic Route] Initialization error:', e.message, e.stack);
    
    // 确保返回的是JSON格式
    try {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({
        error: 'Initialization Error',
        message: '服务器初始化失败，请稍后重试',
        errorDetail: e.message
      });
    } catch (sendError) {
      console.error('[Dynamic Route] Error sending response:', sendError.message);
      res.status(500).end('Internal Server Error');
    }
  }
}