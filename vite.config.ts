import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import {defineConfig} from 'vite';

export default defineConfig(() => {
  return {
    base: './',
    plugins: [
      react(),
      tailwindcss(),
      // Copies standalone static files (config.js, script.js, assets/) into dist/
      // so both direct GitHub Pages root hosting and Vite production builds resolve cleanly.
      {
        name: 'copy-static-site-files',
        apply: 'build',
        closeBundle(error?: Error): void {
          if (error) {
            return;
          }
          const distDir = path.resolve(__dirname, 'dist');
          if (!fs.existsSync(distDir)) {
            return;
          }

          for (const fileName of ['config.js', 'script.js', '.nojekyll']) {
            const srcFile = path.resolve(__dirname, fileName);
            if (fs.existsSync(srcFile)) {
              fs.copyFileSync(srcFile, path.resolve(distDir, fileName));
            }
          }

          const rootAssets = path.resolve(__dirname, 'assets');
          if (fs.existsSync(rootAssets)) {
            fs.cpSync(rootAssets, path.resolve(distDir, 'assets'), {recursive: true, force: true});
          }

          const srcAssets = path.resolve(__dirname, 'src/assets');
          if (fs.existsSync(srcAssets)) {
            fs.cpSync(srcAssets, path.resolve(distDir, 'src/assets'), {recursive: true, force: true});
          }
        },
      },
    ],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
