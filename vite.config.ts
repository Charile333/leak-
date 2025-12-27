import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // 加载当前模式下的环境变量
  const env = loadEnv(mode, process.cwd());
  
  if (!env.VITE_LEAKRADAR_API_KEY) {
    console.warn('\x1b[33m%s\x1b[0m', '⚠️  Warning: VITE_LEAKRADAR_API_KEY is not set in .env file.');
  } else {
    console.log('\x1b[32m%s\x1b[0m', '✅ LeakRadar API Key loaded from .env');
  }

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
        '/api/leakradar': {
          target: 'https://api.leakradar.io',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/leakradar/, ''),
          // 关键：在转发请求前注入 API Key
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              const apiKey = env.VITE_LEAKRADAR_API_KEY?.trim();
              if (apiKey) {
                // 彻底解决认证问题：移除可能冲突的头，重新注入
                proxyReq.removeHeader('Authorization');
                proxyReq.removeHeader('X-API-Key');
                
                proxyReq.setHeader('Authorization', `Bearer ${apiKey}`);
                proxyReq.setHeader('X-API-Key', apiKey);
                
                // 增加 Host 头部重写，某些 API 校验这个
                proxyReq.setHeader('Host', 'api.leakradar.io');
                
                // 在终端打印代理日志（不会显示在浏览器，显示在命令行）
                console.log(`\x1b[36m[Proxy Request]\x1b[0m ${req.method} ${req.url} -> api.leakradar.io`);
              }
            });
            
            proxy.on('proxyRes', (proxyRes, req) => {
              if (proxyRes.statusCode === 401) {
                console.log(`\x1b[31m[Proxy Error]\x1b[0m ${req.url} returned 401 Unauthorized`);
              }
            });

            proxy.on('error', (err, _req) => {
              console.error('\x1b[31m[Proxy Fatal Error]\x1b[0m', err);
            });
          },
        },
        '/api/dns-v1': {
          target: 'https://src.0zqq.com',
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api\/dns-v1/, '/api/v1'),
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq, req) => {
              const apiToken = env.VITE_DNS_API_TOKEN?.trim();
              if (apiToken) {
                // 使用 Bearer Token 认证
                proxyReq.setHeader('Authorization', `Bearer ${apiToken}`);
                proxyReq.setHeader('Host', 'src.0zqq.com');
                console.log(`\x1b[36m[DNS Proxy Request]\x1b[0m ${req.method} ${proxyReq.path} -> src.0zqq.com`);
              }
            });
            
            proxy.on('error', (err, _req) => {
              console.error('\x1b[31m[DNS Proxy Fatal Error]\x1b[0m', err);
            });
          },
        },
      },
    },
  }
})
