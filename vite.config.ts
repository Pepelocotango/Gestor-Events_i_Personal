import path from 'path';
import { defineConfig } from 'vite';
import { builtinModules } from 'module';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => {
    return {
      plugins: [react()],
      base: './',
      define: {
        'process.env.NODE_ENV': JSON.stringify('development'),
      },
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
        minify: false, // <-- Canvi clau aquí
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
