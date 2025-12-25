import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. 获取目标路径 (从 query 或 URL 中提取)
  const path = (req.query.path as string[])?.join('/') || '';
  const queryString = req.url?.split('?')[1] || '';
  
  // 2. 从环境变量获取 API Key (确保你在 Vercel 控制台配置了它)
  const apiKey = process.env.VITE_LEAKRADAR_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      success: false, 
      error: 'VITE_LEAKRADAR_API_KEY is not configured on Vercel environment variables.' 
    });
  }

  // 3. 构建目标 URL
  // 我们需要把请求转发到 https://api.leakradar.io
  // 比如前端请求 /api/leakradar/profile，这里 path 应该是 profile
  const targetPath = req.url?.replace('/api/proxy', '').replace('/api/leakradar', '') || '/';
  const targetUrl = `https://api.leakradar.io${targetPath}`;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'X-API-Key': apiKey,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      // 如果是 POST 请求，转发 body
      body: req.method !== 'GET' && req.method !== 'HEAD' ? JSON.stringify(req.body) : undefined,
    });

    const data = await response.json();
    
    // 设置 CORS 头，防止跨域问题
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-API-Key');

    return res.status(response.status).json(data);
  } catch (error: any) {
    console.error('Proxy Error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch from LeakRadar API',
      message: error.message 
    });
  }
}
