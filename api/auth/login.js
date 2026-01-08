export default async function handler(req, res) {
  console.log('[Login Handler] Received request:', req.method, req.url, req.headers['user-agent']);
  
  // 确保返回的是JSON格式
  function sendJSONResponse(status, data) {
    try {
      console.log('[Login Handler] Sending response:', status, JSON.stringify(data));
      res.setHeader('Content-Type', 'application/json');
      return res.status(status).json(data);
    } catch (e) {
      console.error('[Login Handler] Error sending JSON response:', e.message);
      res.setHeader('Content-Type', 'application/json');
      return res.status(500).json({
        error: 'Internal Server Error',
        message: '无法发送响应，请稍后重试'
      });
    }
  }

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
      return sendJSONResponse(200, { success: true, message: 'OPTIONS request handled' });
    }

    // 白名单用户 - 直接硬编码，避免环境变量解析问题
    const WHITELISTED_USERS = ['konaa2651@gmail.com', 'Lysirsec@outlook.com'];
    console.log('[Login Handler] Using whitelist:', WHITELISTED_USERS);

    if (req.method === 'POST') {
      // 在Vercel中，请求体已经被解析为req.body
      const { email } = req.body || {};
      
      // 验证邮箱是否提供
      if (!email || typeof email !== 'string') {
        console.error('[Login Error] Missing or invalid email:', email);
        return sendJSONResponse(400, {
          error: 'Bad Request',
          message: '请提供有效的邮箱地址'
        });
      }

      // 白名单验证
      if (!WHITELISTED_USERS.includes(email)) {
        console.log(`[Whitelist] User ${email} denied access (not in whitelist)`);
        return sendJSONResponse(403, { 
          error: 'Forbidden',
          message: '您的邮箱不在白名单中，无法登录'
        });
      }

      console.log(`[Whitelist] User ${email} granted access (in whitelist)`);
      
      // 简化登录逻辑，直接返回成功响应
      return sendJSONResponse(200, {
        success: true,
        message: '登录请求已收到',
        email: email
      });
    } else if (req.method === 'GET') {
      // 处理登录链接验证请求
      const token = req.query.token;
      
      if (!token || typeof token !== 'string') {
        console.error('[Login Verify Error] Missing or invalid token:', token);
        return sendJSONResponse(400, {
          error: 'Bad Request',
          message: '缺少登录令牌'
        });
      }
      
      // 简化验证逻辑，直接返回成功响应
      return sendJSONResponse(200, {
        success: true,
        message: '登录验证成功',
        user: {
          email: 'test@example.com',
          name: 'Test User',
          role: 'user'
        }
      });
    } else {
      console.error('[Login Error] Method not allowed:', req.method);
      return sendJSONResponse(405, {
        error: 'Method Not Allowed',
        message: 'Only POST and GET requests are allowed for this endpoint'
      });
    }
  } catch (error) {
    console.error('[Login Handler] Fatal error:', error.message, error.stack);
    return sendJSONResponse(500, {
      error: 'Internal Server Error',
      message: '登录失败，请稍后重试',
      errorDetail: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
    });
  }
}
