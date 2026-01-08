export default async function handler(req, res) {
  try {
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

    // 检查请求方法是否为POST
    if (req.method !== 'POST') {
      console.error('[Login Error] Method not allowed:', req.method);
      return res.status(405).json({
        error: 'Method Not Allowed',
        message: 'Only POST requests are allowed for this endpoint'
      });
    }

    // 解析请求体 - Vercel Serverless Functions不会自动解析
    let body;
    try {
      body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => {
          data += chunk;
        });
        req.on('end', () => {
          try {
            resolve(data ? JSON.parse(data) : {});
          } catch (error) {
            reject(new Error('Invalid JSON in request body'));
          }
        });
        req.on('error', reject);
      });
    } catch (error) {
      console.error('[Login Error] Failed to parse request body:', error.message);
      return res.status(400).json({
        error: 'Bad Request',
        message: '无效的请求格式，请检查请求体'
      });
    }

    const { email } = body;
    
    // 验证邮箱是否提供
    if (!email || typeof email !== 'string') {
      console.error('[Login Error] Missing or invalid email:', email);
      return res.status(400).json({
        error: 'Bad Request',
        message: '请提供有效的邮箱地址'
      });
    }

    // 1. 从环境变量获取白名单
    let WHITELISTED_USERS = [];
    try {
      WHITELISTED_USERS = process.env.WHITELISTED_USERS 
        ? JSON.parse(process.env.WHITELISTED_USERS)
        : [];
    } catch (error) {
      console.error('[Login Error] Failed to parse WHITELISTED_USERS:', error.message);
      return res.status(500).json({
        error: 'Internal Server Error',
        message: '服务器配置错误，请联系管理员'
      });
    }

    // 2. 白名单验证
    if (!WHITELISTED_USERS.includes(email)) {
      console.log(`[Whitelist] User ${email} denied access (not in whitelist)`);
      return res.status(403).json({ 
        error: 'Forbidden',
        message: '您的邮箱不在白名单中，无法登录'
      });
    }

    console.log(`[Whitelist] User ${email} granted access (in whitelist)`);
    
    // 3. 返回成功响应
    res.status(200).json({
      success: true,
      message: '登录成功',
      user: {
        email: email,
        name: email.split('@')[0],
        role: 'user'
      }
    });
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '登录失败，请稍后重试'
    });
  }
}
