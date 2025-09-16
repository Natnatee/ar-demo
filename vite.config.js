import { defineConfig } from 'vite';

export default defineConfig({
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        multi: 'multi-target.html',
        dashboard: 'admin.html'
      }
    }
  }
});
