import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载当前模式下的环境变量
  const env = loadEnv(mode, process.cwd(), ''); // 第三个参数为空字符串，加载所有环境变量 (包括不带 VITE_ 前缀的)



  return {
    assetsInclude: ['**/*.glb'],
    plugins: [
      react(),
      tailwindcss(),
    ],
    server: {
      proxy: {
        // TrendRadar API 代理 (AWS)
        '/api/trend': {
          target: env.VITE_TRENDRADAR_API_URL, // http://13.236.132.48:8000
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/api\/trend/, '/api'), // 前端 /api/trend -> 后端 /api
          configure: (proxy) => {
            proxy.on('proxyReq', (_proxyReq, req) => {
              const target = env.VITE_TRENDRADAR_API_URL;
              console.log(`[Trend Proxy] ${req.method} ${req.url} -> ${target}${req.url?.replace('/api/trend', '/api')}`);
            });
          }
        },
        // 所有其他 API 请求转发到本地后端服务
        '/api': {
          target: env.VITE_BACKEND_URL || 'http://localhost:3001',
          changeOrigin: true,
          secure: false,
          timeout: 20000, // 增加超时时间到20秒
          configure: (proxy) => {
            proxy.on('proxyReq', (_proxyReq, req) => {
              // 修正日志中的目标端口
              const target = env.VITE_BACKEND_URL || 'http://localhost:3001';
              console.log(`[Vite Proxy] ${req.method} ${req.url} -> ${target}${req.url}`);
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
