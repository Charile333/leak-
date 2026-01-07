import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载当前模式下的环境变量
  const env = loadEnv(mode, process.cwd(), ''); // 第三个参数为空字符串，加载所有环境变量 (包括不带 VITE_ 前缀的)

  if (!env.VITE_DNS_API_TOKEN) {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️  Warning: VITE_DNS_API_TOKEN is not set in .env file.');
  } else {
    console.log('\x1b[32m%s\x1b[0m', '✅ DNS API Token loaded from .env');
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        // 所有API请求转发到本地后端服务
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          timeout: 10000, // 增加超时时间到10秒
          configure: (proxy) => {
            proxy.on('proxyReq', (_proxyReq, req) => {
              console.log(`[Vite Proxy] ${req.method} ${req.url} -> http://localhost:3001${req.url}`);
            });
            
            // 添加代理错误处理
            proxy.on('error', (err, req, res) => {
              console.error(`[Vite Proxy Error] ${req.method} ${req.url}: ${err.message}`);
              // 向客户端返回友好的错误信息
              if ('writeHead' in res) {
                res.writeHead(502, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify({
                  error: 'Proxy Error',
                  message: '无法连接到本地后端服务器，请确保后端服务正在运行',
                  details: err.message
                }));
              }
            });
            
            // 添加代理响应处理
            proxy.on('proxyRes', (proxyRes, req) => {
              console.log(`[Vite Proxy Response] ${req.method} ${req.url} <- ${proxyRes.statusCode}`);
            });
          },
        },
      },
    },
  };
});
