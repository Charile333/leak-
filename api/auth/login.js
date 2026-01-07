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

    const { email } = req.body;
    
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
    const statusCode = error.response?.status || 500;
    const message = error.response?.data?.message || '登录失败，请检查邮箱和密码';
    res.status(statusCode).json({
      error: 'Login failed',
      message: message
    });
  }
}
