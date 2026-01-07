module.exports = async function handler(req, res) {  try {
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
      res.status(200).end();
      return;
    }

    // 只允许GET请求获取白名单
    if (req.method === 'GET') {
      // 从环境变量获取白名单
      const WHITELISTED_USERS = process.env.WHITELISTED_USERS 
        ? JSON.parse(process.env.WHITELISTED_USERS)
        : [];
      
      console.log('[Whitelist] Retrieved whitelist:', WHITELISTED_USERS);
      return res.status(200).json({
        whitelist: WHITELISTED_USERS,
        count: WHITELISTED_USERS.length,
        lastUpdated: new Date().toISOString()
      });
    }

    // 其他HTTP方法不允许
    res.status(405).json({ 
      error: 'Method Not Allowed',
      message: 'Only GET requests are allowed for this endpoint'
    });
  } catch (error) {
    console.error('[Whitelist Error]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to retrieve whitelist'
    });
  }
}
