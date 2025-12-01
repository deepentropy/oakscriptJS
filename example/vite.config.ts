import { defineConfig } from 'vite';

export default defineConfig({
  // Base path for GitHub Pages deployment
  // The repository name is used as the base path
  base: process.env.GITHUB_PAGES === 'true' ? '/oakscriptJS/' : '/',
  
  build: {
    outDir: 'dist',
    // Ensure assets are correctly referenced
    assetsDir: 'assets',
  },
  
  // Public directory for static files (like data/SPX.csv)
  // Files in public are served at the root level, so data/SPX.csv becomes /data/SPX.csv
  publicDir: 'public',
});
