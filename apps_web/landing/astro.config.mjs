import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';

// https://astro.build/config
export default defineConfig({
  site: 'https://gestor-events.vercel.app',
  integrations: [
    tailwind({
      applyBaseStyles: false,
    }),
  ],
  // Enable React to support JSX components if needed in the future
  // integrations: [react()],
  vite: {
    optimizeDeps: {
      exclude: ['@resvg/resvg-js']
    }
  },
  // Build output directory for Vercel
  output: 'static',
});
