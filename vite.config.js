// filepath: /home/ffernandes/bpmnModelerWeb/vite.config.js
import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src/base', // Define a pasta raiz como "src/base"
  server: {
    proxy: {
      '/sessions': 'http://localhost:3000', // Redireciona para o servidor Express
      '/save-diagram': 'http://localhost:3000', // Redireciona para o servidor Express
    },
  },
});