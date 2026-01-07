const express = require('express');
const router = express.Router();
const axios = require('axios');

// 使用正则表达式匹配所有路径
router.all('/*', async (req, res) => {
  try {
    // 设置跨域头
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader(
      'Access-Control-Allow-Headers',
      'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization, X-API-Key'
    );

    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }

    // 构建目标URL
    const targetUrl = 'https://api.leakradar.io';
    const url = `${targetUrl}${req.originalUrl.replace(/^\/api/, '')}`;
    
    console.log(`[Proxy] ${req.method} ${req.originalUrl} -> ${url}`);

    // 转发请求
    const response = await axios({
      method: req.method,
      url: url,
      headers: {
        ...req.headers,
        host: new URL(targetUrl).host,
      },
      data: req.body,
      responseType: 'stream',
    });

    // 转发响应
    res.status(response.status);
    response.headers.forEach((value, key) => {
      res.setHeader(key, value);
    });
    
    response.data.pipe(res);
  } catch (error) {
    console.error(`[Proxy Error] ${req.method} ${req.originalUrl}:`, error.message);
    res.status(500).json({
      error: 'Proxy Error',
      message: '无法连接到上游服务器',
      details: error.message
    });
  }
});

module.exports = router;