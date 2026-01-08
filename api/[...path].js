// 动态路由处理器，处理所有未匹配到具体文件的API请求
// 这是Vercel特有的功能，用于处理如 /api/stats 这样的请求
import proxyHandler from './proxy.js';

// 自定义处理器，过滤掉auth相关请求
export default async function handler(req, res) {
  // 检查请求路径，如果是auth相关请求，返回404
  if (req.url.includes('/api/auth/login') || req.url.includes('/api/auth/whitelist')) {
    return res.status(404).json({
      error: 'Not Found',
      message: 'Auth routes should be handled by specific functions, not proxy'
    });
  }
  
  // 否则使用proxyHandler处理
  return proxyHandler(req, res);
}