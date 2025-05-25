const { defineConfig } = require('vite');
const react = require('@vitejs/plugin-react');

// https://vitejs.dev/config/
module.exports = defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/todos': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      },
      '/summarize': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      }
    }
  }
}); 