import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  return {
    plugins: [react()],
    base: './',
    resolve: { // solves the problem with link modules and different react instances
      dedupe: ['react', 'react-dom']
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode || 'production')
    },
    build: {
      outDir: 'build',
      assetsDir: 'static',
      sourcemap: true,
      cssCodeSplit: true,
      minify: true,
      chunkSizeWarningLimit: 3000,
      rollupOptions: {
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'index') { // change index-hash.js to main.hash.js
              return 'static/js/main.[hash].js';
            }
            return 'static/js/[name].[hash].js';
          },
          chunkFileNames: (chunkInfo) => {
            if (chunkInfo.name.includes('rolldown-runtime')) {
              return 'static/js/vendor-loader.[hash].js'; 
              // vendor-runtime may be missleading, runtime.[hash].js would be better. 
              // Usually it contains interaction between the separated js files and handles
              // lazy loading of externalized vendor modules.
              // For me vendor-loader.[hash].js would be the best name.
            }
            return 'static/js/[name].[hash].js';
          },        
          assetFileNames: (assetInfo) => {
            const name = assetInfo.names?.[0] ?? '';
            const ext = name.split('.').pop();
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
  }
});
