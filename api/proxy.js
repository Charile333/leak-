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

  // 处理特定的auth路由，不代理到外部API
  if (req.url.includes('/api/auth/login') || req.url.includes('/auth/login')) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Auth routes should be handled by specific functions, not proxy'
    });
  }

  // 简化处理：直接返回404，避免复杂的代理逻辑
  return res.status(404).json({
    error: 'Not Found',
    message: 'This API endpoint is not available',
    requested_url: req.url,
    method: req.method
  });
}