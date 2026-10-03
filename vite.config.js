// © 2026 티쳐무 · 모든 권리 보유
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 빌드 결과를 dist/index.html 한 파일로 만든다 — 인터넷 없이 더블클릭으로 열린다.
// 압축하면 주석이 지워지므로 저작권 배너는 /*! 로 시작해 남긴다(legalComments: 'inline').
const BANNER = '/*! 판다스 실습실 · © 2026 티쳐무 · 모든 권리 보유 · 학교 수업 목적으로만 이용해 주세요 */';

export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  esbuild: { legalComments: 'inline' },
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    rollupOptions: { output: { banner: BANNER } },
  },
});
