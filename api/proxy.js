import axios from 'axios';

export default async function handler(req, res) {
  // 1. 设置跨域头
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // 2. 获取目标路径 (去掉 /api 部分)
  const targetPath = req.url.replace('/api', '');
  const API_KEY = process.env.LEAKRADAR_API_KEY;

  if (!API_KEY) {
    return res.status(500).json({ 
      error: 'Missing LEAKRADAR_API_KEY', 
      details: 'Please set LEAKRADAR_API_KEY in Vercel Environment Variables and redeploy.' 
    });
  }

  try {
    console.log(`Proxying request to: https://api.leakradar.io${targetPath}`);
    const response = await axios({
      method: req.method,
      url: `https://api.leakradar.io${targetPath}`,
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      data: req.body
    });

    res.status(response.status).json(response.data);
  } catch (error) {
    console.error('Proxy Error:', error.message);
    if (error.response) {
      res.status(error.response.status).json({
        error: 'Upstream API Error',
        message: error.message,
        data: error.response.data
      });
    } else {
      res.status(500).json({ 
        error: 'Proxy execution error', 
        message: error.message
      });
    }
  }
}
