import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    hmr: {
      overlay: false
    }
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
      }
    }
  },
  // Defina o nome do site aqui para Orçamento PRO
  define: {
    'process.env.VITE_APP_TITLE': JSON.stringify('Orçamento PRO'),
  },
  // Garante que arquivos estáticos sejam copiados para o build
  publicDir: 'public'
})
