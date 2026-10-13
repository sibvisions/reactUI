import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';
import path from 'path';
import fs from 'fs-extra';

export default defineConfig(({ mode }) => {
  return {
    plugins: [
      react(),
      dts({
        include: ['src'],
        entryRoot: 'src',
        outDirs: 'dist'
      }),
      {
        name: 'copy-resources',
        writeBundle() {
          fs.copySync('public/color-schemes', 'dist/resources/color-schemes');
          fs.copySync('public/themes', 'dist/resources/themes');
          fs.copySync('public/assets', 'dist/resources/assets');
          fs.copySync('public/fonts/roboto', 'dist/resources/fonts/roboto');
          fs.copySync('public/application.css', 'dist/resources/application.css');
          fs.copySync('src/SetupPackage.cjs', 'dist/SetupPackage.cjs');
        }
      }],
    base: './',
    resolve: { // solves the problem with link modules and different react instances
      dedupe: ['react', 'react-dom']
    },
    define: {
      'process.env.NODE_ENV': JSON.stringify(mode || 'production')
    },
    build: {
      lib: {
        entry: path.resolve(import.meta.dirname, 'src/moduleIndex.ts'),
        name: '@sibvisions/reactui',
        fileName: 'moduleIndex',
        formats: ['es', 'umd', 'cjs'] // Order is essential as umd build uses structures of previous cjs build, which can cause problems
      },
      outDir: 'dist',
      sourcemap: true,
      rollupOptions: {
        external: ['react', 'react-dom'],
        output: {
          globals: {
            react: 'React',
            'react-dom': 'ReactDOM'
          },
          assetFileNames: (assetInfo) => {
            const name = assetInfo.names?.[0] ?? '';
            if (name === 'moduleIndex.css') {
              return 'main.css'; // force name main.css instead of moduleIndex.css for compatibility reasons
            }
            if (/\.css$/i.test(name)) {
              return '[name][extname]';
            }
            if (/fonts?/i.test(name)) {
              return 'resources/fonts/[name][extname]';
            }
            return 'resources/assets/[name][extname]';
          },
          // prevent extra auto.esm*.js due to chart.js
          //inlineDynamicImports: true, // deprecated
          codeSplitting: false,
          manualChunks: undefined,  
        }
      }
    }
  }
});
