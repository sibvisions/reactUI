import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  base: './',
  resolve: { // solves the problem with link modules and different react instances
    alias: {
      react: path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom')
    }
  },
  define: {
    'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV || 'production')
  },
  build: {
    outDir: 'build',
    assetsDir: 'static',
    sourcemap: true,
    cssCodeSplit: true,
    minify: 'esbuild',
    rollupOptions: {
      output: {
        entryFileNames: (chunkInfo) => {
          if (chunkInfo.name === 'index') { // change index-hash.js to main.hash.js
            return 'static/js/main.[hash].js';
          }
          return 'static/js/[name].[hash].js';
        },
        chunkFileNames: 'static/js/[name].[hash].js',
        assetFileNames: (assetInfo) => {
          const ext = assetInfo.name?.split('.').pop();
          if (ext === 'css') {
            return 'static/css/[name]-[hash][extname]';
          }
          return 'static/media/[name]-[hash][extname]';
        },
        manualChunks: (id: string) => {
          if (id.includes('node_modules')) {
            return 'vendor'; // avoid extra auto.esm.*.js and pack all modules into vendor
          }
        }
        // default generation
//        manualChunks: {
//          vendor: ['react', 'react-dom']
//        }
      }
    }
  }
});
