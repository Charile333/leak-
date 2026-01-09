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

    // 从环境变量获取白名单，支持多种格式
    let WHITELISTED_USERS = [];
    try {
      // 尝试从环境变量获取白名单
      if (process.env.WHITELISTED_USERS) {
        const whitelistValue = process.env.WHITELISTED_USERS;
        
        // 支持JSON数组格式：["email1", "email2"]
        try {
          WHITELISTED_USERS = JSON.parse(whitelistValue);
          if (!Array.isArray(WHITELISTED_USERS)) {
            throw new Error("Parsed whitelist is not an array");
          }
        } catch (jsonError) {
          // 支持逗号分隔格式：email1,email2,email3
          if (typeof whitelistValue === 'string') {
            WHITELISTED_USERS = whitelistValue
              .split(',')
              .map(email => email.trim())
              .filter(email => email.length > 0);
            console.log('[Login Handler] Using comma-separated whitelist:', WHITELISTED_USERS);
          } else {
            throw jsonError;
          }
        }
      }
      
      // 如果解析后白名单为空，添加默认用户
      if (!Array.isArray(WHITELISTED_USERS) || WHITELISTED_USERS.length === 0) {
        WHITELISTED_USERS = ['konaa2651@gmail.com', 'Lysirsec@outlook.com'];
      }
    } catch (e) {
      console.error('[Login Handler] Error parsing whitelist:', e.message);
      // 解析错误时使用默认值
      WHITELISTED_USERS = ['konaa2651@gmail.com', 'Lysirsec@outlook.com'];
    }
    console.log('[Login Handler] Using whitelist:', WHITELISTED_USERS);

    if (req.method === 'POST') {
      // 在Vercel中，请求体已经被解析为req.body
      const { email, password } = req.body || {};
      
      // 验证邮箱和密码是否提供
      if (!email || typeof email !== 'string') {
        console.error('[Login Error] Missing or invalid email:', email);
        return sendJSONResponse(400, {
          error: 'Bad Request',
          message: '请提供有效的邮箱地址'
        });
      }
      
      if (!password || typeof password !== 'string') {
        console.error('[Login Error] Missing or invalid password');
        return sendJSONResponse(400, {
          error: 'Bad Request',
          message: '请提供有效的密码'
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

      // 密码验证 - 从环境变量获取密码配置
      // 支持两种格式：1) 单个密码（所有用户共用） 2) JSON对象（每个用户不同密码）
      let isValidPassword = false;
      try {
        const PASSWORD_CONFIG = process.env.LOGIN_PASSWORD_CONFIG;
        
        if (PASSWORD_CONFIG) {
          // 尝试解析为JSON对象（每个用户不同密码）
          try {
            const passwordObj = JSON.parse(PASSWORD_CONFIG);
            if (typeof passwordObj === 'object' && passwordObj !== null) {
              // 检查该用户的密码
              isValidPassword = passwordObj[email] === password;
            }
          } catch (jsonError) {
            // 如果不是JSON，视为单个密码（所有用户共用）
            isValidPassword = PASSWORD_CONFIG === password;
          }
        } else {
          // 开发环境默认密码
          const DEFAULT_PASSWORD = 'password123';
          isValidPassword = password === DEFAULT_PASSWORD;
        }
      } catch (e) {
        console.error('[Login Error] Password validation error:', e.message);
        isValidPassword = false;
      }
      
      if (!isValidPassword) {
        console.log(`[Login Error] Invalid password for user ${email}`);
        return sendJSONResponse(401, {
          error: 'Unauthorized',
          message: '密码错误，请重新输入'
        });
      }

      console.log(`[Login Success] User ${email} authenticated successfully`);
      
      // 返回登录成功响应，包含用户信息
      return sendJSONResponse(200, {
        success: true,
        message: '登录成功',
        user: {
          email: email,
          username: email.split('@')[0],
          name: email.split('@')[0]
        },
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
