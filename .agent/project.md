# SEVET – Ecosistema Pet-Tech 360

## Identidad del Proyecto
**Nombre Legal:** Clínica Veterinaria San Alberto (SEVET)  
**Director Médico:** Dr. Alberto Sánchez  
**Ubicación:** Av. San Pablo 6106, Lo Prado, Santiago  
**Teléfonos:** +56 2 2773 1554 / +56 9 8419 6310  
**Horario Destacado:** Lunes a Viernes hasta la **01:00 AM**

## Stack Técnico
- HTML5 + CSS3 Vanilla + JavaScript ES6+
- PWA (manifest + service worker offline-first)
- Sin frameworks externos (máxima velocidad)

## Paleta de Diseño
- **Primary:** `#0d7377` (Teal profundo)
- **Dark:** `#0a1628` (Fondo base)
- **Accent:** `#2dd4bf` (Glow teal)
- **Glass:** `rgba(255,255,255,0.06)` + `backdrop-filter: blur(16px)`
- **Font:** Outfit / Inter (Google Fonts)
- **Estética:** Futurismo Funcional 2026 · Bento Grid · Glassmorphism

## Estructura del Proyecto
```
sevet-pwa/
├── index.html          ← Página principal (todas las secciones)
├── styles.css          ← Tokens + Diseño + Animaciones
├── app.js              ← Partículas, loader, IA, carrusel, slider
├── manifest.json       ← PWA installable
├── sw.js               ← Service Worker (offline-first)
└── assets/
    └── images/         ← 5 imágenes 8K generadas por IA
        ├── hero-dog.png
        ├── hero-cat.png
        ├── premium-food.png
        ├── logo.png
        └── before-after.png
```

## Secciones Implementadas
1. **Loader** — perro corriendo con barra de progreso
2. **Navbar** — logo SEVET dinámico + marquee de datos
3. **Hero** — slideshow + CTA urgente + estadísticas animadas
4. **Bento Grid** — 5 especialidades glassmorphism
5. **Ficha Clínica** — dashboard de vacunas tipo hospital
6. **Tienda Premium** — carrusel de productos CLP
7. **Slider Antes/Después** — comparación nutricional draggable
8. **Widget IA** — asistente flotante siempre visible
9. **Footer** — mapa, contactos, Facebook, WhatsApp

## Para Desarrollar
```bash
# Levantar servidor local
cd sevet-pwa
python3 -m http.server 4242
# Abrir: http://localhost:4242
```
