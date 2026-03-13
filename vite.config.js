import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        agendar: resolve(__dirname, 'pages/agendar.html'),
        miMascota: resolve(__dirname, 'pages/mi-mascota.html'),
        tienda: resolve(__dirname, 'pages/tienda.html'),
        peluqueria: resolve(__dirname, 'pages/peluqueria.html'),
        chatbot: resolve(__dirname, 'pages/chatbot.html'),
        anatomia: resolve(__dirname, 'pages/anatomia.html'),
        telemedicina: resolve(__dirname, 'pages/telemedicina.html'),
        historial: resolve(__dirname, 'pages/historial.html'),
        imagenes: resolve(__dirname, 'pages/imagenes.html'),
        financiero: resolve(__dirname, 'pages/financiero.html'),
        auth: resolve(__dirname, 'pages/auth.html'),
      },
    },
  },
  server: {
    port: 4242,
    open: true,
  },
});
