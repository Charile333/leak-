import proxyHandler from './proxy.js';

export default async function handler(req, res) {
  console.log('[Dynamic Route] Received request:', req.method, req.url);
  
  // 确保返回的是JSON格式
  function sendJSONResponse(res, status, data) {
    try {
      res.setHeader('Content-Type', 'application/json');
      res.status(status).json(data);
    } catch (e) {
      res.setHeader('Content-Type', 'application/json');
      res.status(500).json({
        error: 'Internal Server Error',
        message: '无法发送响应，请稍后重试'
      });
    }
  }

  try {
    // 检查请求路径，如果是auth相关请求，返回404
    // 因为auth请求应该由专门的函数处理，而不是代理
    if (req.url.includes('/auth/')) {
      console.log('[Dynamic Route] Rejecting auth request:', req.url);
      sendJSONResponse(res, 404, {
        error: 'Not Found',
        message: 'Auth routes should be handled by specific functions, not proxy'
      });
      return;
    }
    
    // 否则使用proxyHandler处理
    console.log('[Dynamic Route] Proxying request:', req.url);
    return proxyHandler(req, res);
  } catch (e) {
    console.error('[Dynamic Route] Initialization error:', e.message, e.stack);
    sendJSONResponse(res, 500, {
      error: 'Initialization Error',
      message: '服务器初始化失败，请稍后重试',
      errorDetail: e.message
    });
  }
}