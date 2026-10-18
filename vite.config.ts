import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import fs from 'fs';
import {defineConfig, Plugin} from 'vite';

// Plugin to guarantee that /login and /404 never return 404 on static hosts
function spaFallbackPlugin(): Plugin {
  return {
    name: 'spa-fallback-plugin',
    closeBundle() {
      const rootDir = import.meta.dirname || process.cwd();
      const distDir = path.resolve(rootDir, 'dist');
      const indexPath = path.join(distDir, 'index.html');

      if (fs.existsSync(indexPath)) {
        // 1. Create dist/404.html (for hosts with 404 fallback)
        fs.copyFileSync(indexPath, path.join(distDir, '404.html'));

        // 2. Create dist/login.html (for cleanUrls / direct file match)
        fs.copyFileSync(indexPath, path.join(distDir, 'login.html'));

        // 3. Create dist/login/index.html (for directory-based URL matching)
        const loginDir = path.join(distDir, 'login');
        if (!fs.existsSync(loginDir)) {
          fs.mkdirSync(loginDir, { recursive: true });
        }
        fs.copyFileSync(indexPath, path.join(loginDir, 'index.html'));
      }
    },
  };
}

export default defineConfig(() => {
  return {
    plugins: [react(), tailwindcss(), spaFallbackPlugin()],
    resolve: {
      alias: {
        '@': path.resolve(import.meta.dirname || process.cwd(), '.'),
      },
    },
    build: {
      outDir: 'dist',
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
