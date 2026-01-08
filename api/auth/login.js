import nodemailer from 'nodemailer';
import jwt from 'jsonwebtoken';

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

    // JWT配置
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const JWT_EXPIRY = '5m'; // 5分钟过期

    // 邮件配置 - 支持SendGrid
    const SMTP_CONFIG = {
      host: process.env.SMTP_HOST || 'smtp.sendgrid.net',
      port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
      secure: process.env.SMTP_SECURE === 'true', // 使用TLS
      auth: {
        user: process.env.SMTP_USER || 'apikey', // SendGrid使用apikey作为用户名
        pass: process.env.SMTP_PASS || '' // SendGrid API密钥
      }
    };

    // 创建邮件传输器
    const transporter = nodemailer.createTransport(SMTP_CONFIG);

    // 检查请求方法
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

      // 1. 从环境变量获取白名单 - 增强的错误处理
      let WHITELISTED_USERS = [];
      try {
        if (process.env.WHITELISTED_USERS) {
          // 尝试直接解析JSON
          WHITELISTED_USERS = JSON.parse(process.env.WHITELISTED_USERS);
        } else {
          // 环境变量未设置，使用默认白名单
          WHITELISTED_USERS = ['konaa2651@gmail.com', 'Lysirsec@outlook.com'];
          console.log('[Login Warning] Using default WHITELISTED_USERS:', WHITELISTED_USERS);
        }
      } catch (error) {
        console.error('[Login Error] Failed to parse WHITELISTED_USERS:', error.message);
        // 如果JSON解析失败，尝试用逗号分隔的格式
        try {
          WHITELISTED_USERS = process.env.WHITELISTED_USERS
            .replace(/\[|\]/g, '')
            .replace(/"/g, '')
            .split(',')
            .map(email => email.trim())
            .filter(email => email.length > 0);
          console.log('[Login Warning] Using fallback parsing for WHITELISTED_USERS:', WHITELISTED_USERS);
        } catch (fallbackError) {
          console.error('[Login Error] Failed to parse WHITELISTED_USERS with fallback:', fallbackError.message);
          // 使用默认白名单作为最后一道防线
          WHITELISTED_USERS = ['konaa2651@gmail.com', 'Lysirsec@outlook.com'];
          console.log('[Login Warning] Using default WHITELISTED_USERS as final fallback:', WHITELISTED_USERS);
        }
      }
      
      // 确保WHITELISTED_USERS是数组
      if (!Array.isArray(WHITELISTED_USERS)) {
        WHITELISTED_USERS = ['konaa2651@gmail.com', 'Lysirsec@outlook.com'];
        console.log('[Login Warning] WHITELISTED_USERS is not an array, using default:', WHITELISTED_USERS);
      }

      // 2. 白名单验证
      if (!WHITELISTED_USERS.includes(email)) {
        console.log(`[Whitelist] User ${email} denied access (not in whitelist)`);
        return res.status(403).json({ 
          error: 'Forbidden',
          message: '您的邮箱不在白名单中，无法登录'
        });
      }

      console.log(`[Whitelist] User ${email} granted access (in whitelist), sending login link`);
      
      // 3. 生成JWT令牌，用于登录链接验证
      const token = jwt.sign(
        { email, type: 'login' },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRY }
      );
      
      // 4. 生成登录链接
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5174';
      const loginLink = `${frontendUrl}/login/verify?token=${token}`;
      
      // 5. 发送登录邮件
      const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@example.com',
        to: email,
        subject: 'Lysir谍卫 - 登录链接',
        html: `
          <h1>Lysir谍卫</h1>
          <p>您好！</p>
          <p>您请求了登录Lysir谍卫平台的链接。</p>
          <p>请点击以下链接登录：</p>
          <p><a href="${loginLink}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">登录Lysir谍卫</a></p>
          <p>该链接将在5分钟后失效。</p>
          <p>如果您没有请求此链接，请忽略此邮件。</p>
          <p>--</p>
          <p>Lysir谍卫团队</p>
        `
      };
      
      // 6. 发送邮件 - 包装为Promise以支持await
      await new Promise((resolve, reject) => {
        transporter.sendMail(mailOptions, (error, info) => {
          if (error) {
            console.error('[Mail Error] Failed to send login link:', error.message);
            reject(new Error(`发送登录链接失败: ${error.message}`));
          } else {
            console.log(`[Mail] Login link sent to ${email}: ${info.messageId}`);
            resolve(info);
          }
        });
      });
      
      res.status(200).json({
        success: true,
        message: '登录链接已发送到您的邮箱，请检查并点击链接登录'
      });
    } else if (req.method === 'GET') {
      // 处理登录链接验证请求
      const token = req.query.token;
      
      if (!token || typeof token !== 'string') {
        console.error('[Login Verify Error] Missing or invalid token:', token);
        return res.status(400).json({
          error: 'Bad Request',
          message: '缺少登录令牌'
        });
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
        res.status(200).json({
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
        
        return res.status(401).json({
          error: 'Unauthorized',
          message: message
        });
      }
    } else {
      console.error('[Login Error] Method not allowed:', req.method);
      return res.status(405).json({
        error: 'Method Not Allowed',
        message: 'Only POST and GET requests are allowed for this endpoint'
      });
    }
  } catch (error) {
    console.error('[Login Error]', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: '登录失败，请稍后重试'
    });
  }
}
