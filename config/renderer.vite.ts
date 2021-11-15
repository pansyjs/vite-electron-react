import { join } from 'path';
import { defineConfig } from 'vite';
import reactRefresh from '@vitejs/plugin-react-refresh';
import { chrome } from './electron-dep-versions';
import externalPkgs from './external-packages';

const ROOT_DIR = process.cwd();
const RENDERER_DIR = join(ROOT_DIR, './src/renderer');

export default defineConfig({
  base: './',
  root: RENDERER_DIR,
  resolve: {
    alias: {
      '@/': `${RENDERER_DIR}/`,
    },
  },
  plugins: [
    reactRefresh()
  ],
  css: {
    preprocessorOptions: {
      less: {
        javascriptEnabled: true,
      },
    },
  },
  build: {
    sourcemap: true,
    target: `chrome${chrome}`,
    polyfillDynamicImport: false,
    base: '',
    outDir: join(ROOT_DIR, 'dist/source/renderer'),
    assetsDir: '.',
    rollupOptions: {
      external: externalPkgs,
    },
    emptyOutDir: true,
  },
});
