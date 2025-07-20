import path from 'path';
import { defineConfig } from 'vite';
import { builtinModules } from 'module';
import { fileURLToPath } from 'url';
import react from '@vitejs/plugin-react';

// Derive __dirname in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig(() => { // <<< CANVI CLAU AQUÍ: Eliminat el paràmetre ({ mode })
    return {
      plugins: [react()],
      base: './',
      define: {
        // No hi ha variables globals per definir
      },
      build: {
        outDir: 'dist',
        emptyOutDir: true,
        sourcemap: true,
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
