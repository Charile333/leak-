// 动态路由处理器，处理所有未匹配到具体文件的API请求
// 这是Vercel特有的功能，用于处理如 /api/stats 这样的请求
import proxyHandler from './proxy.js';

export default proxyHandler;