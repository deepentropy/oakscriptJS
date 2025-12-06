import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  // Base path for GitHub Pages deployment
  // The repository name is used as the base path
  base: process.env.GITHUB_PAGES === 'true' ? '/oakscriptJS/' : '/',

    resolve: {
        alias: {
            'oakscriptjs': path.resolve(__dirname, '../packages/oakscriptjs/src/index.ts'),
        },
    },

  build: {
    outDir: 'dist',
    // Ensure assets are correctly referenced
    assetsDir: 'assets',
  },

    // Public directory for static files (like data/SPX.csv)
  // Files in public are served at the root level, so data/SPX.csv becomes /data/SPX.csv
  publicDir: 'public',
});
