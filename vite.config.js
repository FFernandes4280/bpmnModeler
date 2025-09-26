// filepath: /home/ffernandes/bpmnModelerWeb/vite.config.js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  root: 'src/base', // Mudando para a nova estrutura React
  server: {
    proxy: {
      '/sessions': 'http://localhost:3000', // Redireciona para o servidor Express
      '/save-diagram': 'http://localhost:3000', // Redireciona para o servidor Express
    },
  },
});