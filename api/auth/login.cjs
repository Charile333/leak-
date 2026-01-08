// 确保使用正确的模块系统
try {
  const nodemailer = require('nodemailer');
  const jwt = require('jsonwebtoken');

  module.exports = async function handler(req, res) {
    console.log('[Login Handler] Received request:', req.method, req.url, req.headers['user-agent']);
    
    // 确保返回的是JSON格式
    function sendJSONResponse(res, status, data) {
      try {
        console.log('[Login Handler] Sending response:', status, JSON.stringify(data));
        res.setHeader('Content-Type', 'application/json');
        res.status(status).send(JSON.stringify(data));
      } catch (e) {
        console.error('[Login Handler] Error sending JSON response:', e.message);
        res.setHeader('Content-Type', 'application/json');
        res.status(500).send(JSON.stringify({
          error: 'Internal Server Error',
          message: '无法发送响应，请稍后重试'
        }));
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
        sendJSONResponse(res, 200, { success: true, message: 'OPTIONS request handled' });
        return;
      }

      // JWT配置
      const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
      const JWT_EXPIRY = '5m'; // 5分钟过期

      // 1. 从环境变量获取白名单 - 增强的错误处理
      let WHITELISTED_USERS = ['konaa2651@gmail.com', 'Lysirsec@outlook.com'];
      try {
        if (process.env.WHITELISTED_USERS) {
          // 尝试直接解析JSON
          WHITELISTED_USERS = JSON.parse(process.env.WHITELISTED_USERS);
        } 
      } catch (error) {
        console.error('[Login Error] Failed to parse WHITELISTED_USERS:', error.message);
      }
      
      // 确保WHITELISTED_USERS是数组
      if (!Array.isArray(WHITELISTED_USERS)) {
        WHITELISTED_USERS = ['konaa2651@gmail.com', 'Lysirsec@outlook.com'];
        console.log('[Login Warning] WHITELISTED_USERS is not an array, using default:', WHITELISTED_USERS);
      }

      console.log('[Login Handler] Using whitelist:', WHITELISTED_USERS);

      if (req.method === 'POST') {
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
          sendJSONResponse(res, 400, {
            error: 'Bad Request',
            message: '无效的请求格式，请检查请求体'
          });
          return;
        }

        const { email } = body;
        
        // 验证邮箱是否提供
        if (!email || typeof email !== 'string') {
          console.error('[Login Error] Missing or invalid email:', email);
          sendJSONResponse(res, 400, {
            error: 'Bad Request',
            message: '请提供有效的邮箱地址'
          });
          return;
        }

        // 白名单验证
        if (!WHITELISTED_USERS.includes(email)) {
          console.log(`[Whitelist] User ${email} denied access (not in whitelist)`);
          sendJSONResponse(res, 403, { 
            error: 'Forbidden',
            message: '您的邮箱不在白名单中，无法登录'
          });
          return;
        }

        console.log(`[Whitelist] User ${email} granted access (in whitelist), sending login link`);
        
        // 生成JWT令牌，用于登录链接验证
        const token = jwt.sign(
          { email, type: 'login' },
          JWT_SECRET,
          { expiresIn: JWT_EXPIRY }
        );
        
        // 生成登录链接
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
        const loginLink = `${frontendUrl}/login/verify?token=${token}`;
        
        // 开发环境下跳过实际发送邮件
        console.log(`[Dev Mode] Login link for ${email}: ${loginLink}`);
        
        // 直接返回成功响应
        sendJSONResponse(res, 200, {
          success: true,
          message: '登录链接已生成，开发环境下直接返回',
          loginLink: loginLink
        });
        return;
      } else if (req.method === 'GET') {
        // 处理登录链接验证请求
        const token = req.query.token;
        
        if (!token || typeof token !== 'string') {
          console.error('[Login Verify Error] Missing or invalid token:', token);
          sendJSONResponse(res, 400, {
            error: 'Bad Request',
            message: '缺少登录令牌'
          });
          return;
        }
        
        try {
          // 验证令牌
          const decoded = jwt.verify(token, JWT_SECRET);
          
          // 检查令牌类型
          if (decoded.type !== 'login') {
            throw new Error('Invalid token type');
          }
          
          const { email } = decoded;
          
          console.log(`[Login Verify] User ${email} verified successfully`);
          
          // 返回登录成功响应
          sendJSONResponse(res, 200, {
            success: true,
            message: '登录验证成功',
            user: {
              email: email,
              name: email.split('@')[0],
              role: 'user'
            }
          });
          return;
        } catch (error) {
          console.error('[Login Verify] Token verification failed:', error.message);
          
          // 检查是否是过期错误
          let message = '登录链接无效或已过期';
          if (error.name === 'TokenExpiredError') {
            message = '登录链接已过期，请重新请求登录';
          }
          
          sendJSONResponse(res, 401, {
            error: 'Unauthorized',
            message: message
          });
          return;
        }
      } else {
        console.error('[Login Error] Method not allowed:', req.method);
        sendJSONResponse(res, 405, {
          error: 'Method Not Allowed',
          message: 'Only POST and GET requests are allowed for this endpoint'
        });
        return;
      }
    } catch (error) {
      console.error('[Login Handler] Fatal error:', error.message, error.stack);
      sendJSONResponse(res, 500, {
        error: 'Internal Server Error',
        message: '登录失败，请稍后重试',
        errorDetail: process.env.NODE_ENV === 'development' ? error.message : '服务器内部错误'
      });
    }
  };
} catch (e) {
  console.error('[Login Handler] Initialization error:', e.message, e.stack);
  module.exports = async function handler(req, res) {
    res.setHeader('Content-Type', 'application/json');
    res.status(500).send(JSON.stringify({
      error: 'Initialization Error',
      message: '服务器初始化失败，请稍后重试',
      errorDetail: e.message
    }));
  };
}
