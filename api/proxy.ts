import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // 1. 获取目标路径 (从 query 或 URL 中提取)
  // 2. 从环境变量获取 API Key (确保你在 Vercel 控制台配置了它)
  const apiKey = process.env.VITE_LEAKRADAR_API_KEY;

  if (!apiKey) {
    return res.status(500).json({ 
      success: false, 
      error: 'VITE_LEAKRADAR_API_KEY is not configured on Vercel environment variables.' 
    });
  }

  // 3. 构建目标 URL
  // 更加鲁棒的路径解析：从原始 URL 中提取路径和查询参数
  const fullUrl = req.url || '';
  // 移除 /api/proxy 或 /api/leakradar 前缀
  let targetPath = fullUrl.replace(/^\/api\/proxy/, '').replace(/^\/api\/leakradar/, '');
  
  // 确保以 / 开头
  if (!targetPath.startsWith('/')) {
    targetPath = '/' + targetPath;
  }

  const targetUrl = `https://api.leakradar.io${targetPath}`;

  console.log(`[Proxy] Target: ${targetUrl} (Original: ${fullUrl})`);

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

    // 检查响应内容类型
    const contentType = response.headers.get('content-type');
    let data;
    if (contentType && contentType.includes('application/json')) {
      data = await response.json();
    } else {
      data = { text: await response.text() };
    }
    
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
