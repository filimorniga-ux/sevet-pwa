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
        educacion: resolve(__dirname, 'pages/educacion.html'),
        teleconsulta: resolve(__dirname, 'pages/teleconsulta.html'),
        fichaClinica: resolve(__dirname, 'pages/ficha-clinica.html'),
        diagnostico: resolve(__dirname, 'pages/diagnostico.html'),
        admin: resolve(__dirname, 'pages/admin.html'),
      },
    },
  },
  server: {
    port: 4242,
    open: true,
  },
});
