import path from 'path';
import { defineConfig } from 'vite';
import { builtinModules } from 'module';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import react from '@vitejs/plugin-react';

const require = createRequire(import.meta.url);
const packageJson = require('./package.json');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
    return {
      plugins: [react()],
      base: './',
      define: {
        'process.env.NODE_ENV': JSON.stringify('development'),
        '__APP_VERSION__': JSON.stringify(packageJson.version),
      },
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
        minify: false,
        rollupOptions: {
          external: [
            ...builtinModules,
            'electron'
          ],
        }
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, './src'),
        }
      },
    };
});
