module.exports = async function handler(req, res) {
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

    // 解析请求体 - Vercel Serverless Functions不会自动解析
    let body;
    if (req.method === 'POST' || req.method === 'PUT' || req.method === 'PATCH') {
      body = await new Promise((resolve, reject) => {
        let data = '';
        req.on('data', chunk => {
          data += chunk;
        });
        req.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (error) {
            reject(new Error('Invalid JSON in request body'));
          }
        });
        req.on('error', reject);
      });
    }

    const { email } = body;
    
    // 1. 从环境变量获取白名单
    const WHITELISTED_USERS = process.env.WHITELISTED_USERS 
      ? JSON.parse(process.env.WHITELISTED_USERS)
      : [];

    // 2. 白名单验证
    if (!WHITELISTED_USERS.includes(email)) {
      console.log(`[Whitelist] User ${email} denied access (not in whitelist)`);
      return res.status(403).json({ 
        error: 'Forbidden',
        message: '您的邮箱不在白名单中，无法登录'
      });
    }

    console.log(`[Whitelist] User ${email} granted access (in whitelist)`);
    
    // 3. 由于LeakRadar API没有登录端点，直接返回成功响应
    // 应用将使用API密钥进行后续请求验证
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
    let statusCode = 500;
    let message = '登录失败，请检查邮箱';
    
    // 根据错误类型设置更具体的错误信息
    if (error.message === 'Invalid JSON in request body') {
      statusCode = 400;
      message = '无效的请求格式，请检查请求体';
    }
    
    res.status(statusCode).json({
      error: 'Login failed',
      message: message
    });
  }
}
