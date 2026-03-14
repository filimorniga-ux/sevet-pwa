# SEVET PWA - Auditoría Mobile (V2/V3)
Fecha: 2026-03-14  
Autor: Codex (auditoría + fixes + tests)

## 1) Alcance auditado
- Home (`/`)
- Auth (`/pages/auth.html`)
- Agendar (`/pages/agendar.html`)
- Gestión de Citas (`/pages/gestion-citas.html`)
- Admin (`/pages/admin.html`)
- Mi Agenda (`/pages/mi-agenda.html`)
- Historial (`/pages/historial.html`)
- Mi Mascota (`/pages/mi-mascota.html`, redirige a auth sin sesión)
- Tienda, Peluquería, Telemedicina, Ficha Clínica, Diagnóstico, Financiero

## 2) Hallazgos críticos detectados
1. **Runtime crítico en mobile/home**: `ReferenceError: Cannot access 'carouselIndex' before initialization` en `js/main.js`.  
   Impacto: se cortaba la ejecución de `main.js`, dejando `toggleNav` sin definir y rompiendo el menú móvil.
2. **Overflow horizontal**:
   - `historial.html`: overflow +92px en 390px.
   - `financiero.html`: overflow +101px en 390px.
3. **Targets táctiles bajo estándar** (<44px) en tabs, filtros y acciones rápidas (auth, historial, agenda, filtros).
4. **Bloqueo/desbloqueo de scroll móvil débil**: cierre del menú no limpiaba estado del body de forma robusta.

## 3) Correcciones aplicadas
### Runtime + navegación móvil
- Se extrajo lógica utilitaria a `js/modules/mobile-ui-utils.js`.
- Se corrigió inicialización de carrusel para evitar TDZ.
- Se robusteció `toggleNav`:
  - apertura/cierre idempotente,
  - cierre por `Esc`,
  - cierre por click fuera,
  - limpieza de `body.style.top` al cerrar,
  - restauración de scroll.

### UX móvil (estilos)
- Se reforzó base móvil:
  - `-webkit-text-size-adjust`,
  - `touch-action: manipulation`,
  - `tap highlight` reducido.
- Menú móvil:
  - burger y close button con área táctil real,
  - links del menú en altura mínima 44px,
  - safe-area paddings (`env(safe-area-inset-*)`).
- Controles:
  - `auth-tab`, `auth-input`, `auth-oauth`, `auth-submit`, `role-btn`, `spec-tab`, `diag-filter-btn`, `historial-filter`, `time-slot` con tamaño táctil adecuado.
- Filtros/tabs horizontales en mobile con scroll nativo y `scroll-snap`.
- Safe area para widgets flotantes (`ai-widget`, `cart-badge`).

### Overflow fixes
- **Historial**: `min-width: 0` en layout/grid items + ajuste de filtros/sidebar.
- **Financiero**:
  - `min-width: 0` en cards/kpi,
  - labels wrap,
  - tabla en contenedor scrollable (`.fin-table-scroll`),
  - breakpoint extra `<560px` para kpis en 1 columna.

### Ajustes por página
- `pages/mi-agenda.html`: botones de acciones rápidas aumentados a targets táctiles reales.
- `pages/gestion-citas.html`: `filter-input` y `select` de tabla con altura táctil.
- `pages/admin.html`: botones/selects en listas con min-height reforzado.

## 4) Tests creados
- Nuevo módulo testeado: `tests/modules/mobile-ui-utils.test.js`
  - `getVisibleCardsForWidth`
  - `clampCarouselIndex`
  - `getBodyLockTop`

## 5) Validación ejecutada
- `npm test` ✅ (5 files, 18 tests OK)
- `npm run build` ✅
- Verificación móvil Playwright (390x844):
  - `toggleNav` disponible y funcional.
  - `historial.html` overflow: **92px -> 0px**.
  - `financiero.html` overflow: **101px -> 0px**.
  - Targets táctiles de controles principales: sin violaciones críticas en páginas auditadas.
  - Sin errores JS críticos post-fix (solo 404 de `favicon.ico`).

## 6) Riesgos / pendientes no bloqueantes
1. **`/favicon.ico` 404** en consola (impacto bajo, pero recomendable corregir).
2. Algunas rutas protegidas redirigen a auth sin sesión; validación con datos reales de rol debe completarse con usuario autenticado.
3. Warnings de lock de Supabase observados en navegador (no bloqueantes para UX móvil).

## 7) Estado final
- Resultado de esta fase: **OK para enseñar** en móvil.  
- Para declarar **OK para publicar**, solo faltaría cerrar `favicon` y hacer un pase QA autenticado por rol (vet/admin/receptionist) en ambiente con sesión real.
