const axios = require('axios');

module.exports = async (req, res) => {
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
    return res.status(500).json({ error: 'Missing LEAKRADAR_API_KEY environment variable' });
  }

  try {
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
    if (error.response) {
      res.status(error.response.status).json(error.response.data);
    } else {
      res.status(500).json({ error: 'Proxy error', message: error.message });
    }
  }
};
