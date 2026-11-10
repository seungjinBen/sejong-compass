import { defineConfig, type ServerOptions as ProxyOptions } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// 백엔드(Render)는 localhost 오리진의 CORS를 허용하지 않으므로
// 개발 서버에서 /api 를 동일 출처 프록시로 전달해 세션 쿠키를 공유한다.
const BACKEND_ORIGIN = process.env['VITE_PROXY_TARGET'] ?? 'https://compass-dev-00gt.onrender.com';

const proxy: ProxyOptions['proxy'] = {
  '/api': {
    target: BACKEND_ORIGIN,
    changeOrigin: true,
    secure: true,
    // 브라우저는 같은 출처라도 POST/PUT/PATCH/DELETE 에 Origin 헤더를 붙인다.
    // 백엔드 CORS 허용 목록에 localhost 가 없어 "Invalid CORS request"(403) 가 나므로
    // 프록시 구간에서 Origin/Referer 를 제거해 동일 출처(비-CORS) 요청으로 전달한다.
    configure: (proxy) => {
      proxy.on('proxyReq', (proxyReq) => {
        proxyReq.removeHeader('origin');
        proxyReq.removeHeader('referer');
      });
    },
  },
};

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
  server: { proxy },
  preview: { proxy },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
});
