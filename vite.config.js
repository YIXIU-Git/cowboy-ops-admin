import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  // base: './' 使构建产物使用相对路径，直接双击打开 dist/index.html 也不会白屏
  base: './',
  plugins: [react()],
  server: {
    host: true,
    port: 5173,
  },
});
