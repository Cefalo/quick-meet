import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    // mode: 'development',
    plugins: [react()],
    resolve: {
      alias: {
        '@': '/src',
        '@components': '/src/components',
        '@api': '/src/api',
        '@helpers': '/src/helpers',
        '@pages': '/src/pages',
        '@theme': '/src/theme',
        '@config': '/src/config',
        '@context': '/src/context',
      },
    },
    build: {
      outDir: mode === 'chrome' ? 'build_chrome' : 'build_web',
      chunkSizeWarningLimit: 600,
      // uncomment the following during local development so that build files are not minified
      // sourcemap: true,
      // minify: false,
      // cssMinify: false,
    },
    /*
     * by default, vite listens to only localhost. When running the server inside a docker container with port exposed on 3000,
     * it must be configured to listen to 0.0.0.0 (all network intefaces) instead of just localhost
     */
    server: {
      host: '0.0.0.0',
      port: 3000,
    },
  };
});
