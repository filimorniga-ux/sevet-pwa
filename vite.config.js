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
        admin: resolve(__dirname, 'pages/admin.html'),
        agendar: resolve(__dirname, 'pages/agendar.html'),
        auth: resolve(__dirname, 'pages/auth.html'),
        miMascota: resolve(__dirname, 'pages/mi-mascota.html'),
        peluqueria: resolve(__dirname, 'pages/peluqueria.html'),
        chatbot: resolve(__dirname, 'pages/chatbot.html'),
        anatomia: resolve(__dirname, 'pages/anatomia.html'),
        diagnostico: resolve(__dirname, 'pages/diagnostico.html'),
        educacion: resolve(__dirname, 'pages/educacion.html'),
        fichaClinica: resolve(__dirname, 'pages/ficha-clinica.html'),
        telemedicina: resolve(__dirname, 'pages/telemedicina.html'),
        teleconsulta: resolve(__dirname, 'pages/teleconsulta.html'),
        historial: resolve(__dirname, 'pages/historial.html'),
        imagenes: resolve(__dirname, 'pages/imagenes.html'),
        quienesSomos: resolve(__dirname, 'pages/quienes-somos.html'),
        miAgenda: resolve(__dirname, 'pages/mi-agenda.html'),
        gestionCitas: resolve(__dirname, 'pages/gestion-citas.html'),
        completarPerfil: resolve(__dirname, 'pages/completar-perfil.html'),
        configuracion: resolve(__dirname, 'pages/configuracion.html'),
        inbox: resolve(__dirname, 'pages/inbox.html'),
        perfil: resolve(__dirname, 'pages/perfil.html'),
        privacy: resolve(__dirname, 'privacy.html'),
        terms: resolve(__dirname, 'terms.html'),
      },
    },
  },
  server: {
    port: 4242,
    open: true,
  },
  test: {
    environment: 'jsdom',
    include: ['tests/**/*.test.js'],
  },
});
