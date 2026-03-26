# AGENTS.md — Guía de Auditoría para Codex/AI Agents

## Descripción del proyecto
**SEVET PWA** es una Progressive Web App para clínicas veterinarias.
Stack: HTML + Vanilla JS + Supabase (PostgreSQL + Auth + Edge Functions) + Vercel.

## Módulos críticos (revisar con mayor profundidad)

| Módulo | Ruta | Riesgo |
|--------|------|--------|
| Autenticación | `/js/auth.js`, `/pages/auth.html` | CRÍTICO |
| WhatsApp Inbox | `/pages/inbox.html` | ALTO |
| Bot Agendamiento | `/supabase/functions/whatsapp-booking/` | ALTO |
| Agendamiento | `/js/modules/agendamiento.js`, `/pages/agendar.html` | ALTO |
| Caja/Billing | `/js/modules/caja.js`, `/pages/caja.html` | ALTO |
| Gestión de citas | `/pages/gestion-citas.html`, `/js/modules/` | MEDIO |
| Ficha clínica | `/pages/historial.html`, `/js/modules/historial.js` | MEDIO |
| Perfil/Mascota | `/pages/perfil.html`, `/pages/mi-mascota.html` | MEDIO |
| Edge Functions | `/supabase/functions/` | ALTO |
| Migraciones SQL | `/supabase/migrations/` | ALTO |

## Reglas para el agente

### Severidades
- **CRÍTICO**: puede romper producción, pérdida de datos, brecha de seguridad
- **ALTO**: afecta funcionalidad core, bug probable en flujos principales
- **MEDIO**: bug menor, degradación de UX, deuda técnica significativa
- **BAJO**: mejora de código, estilo, optimización menor

### Qué es BLOCKER (no deployar sin resolver)
- Cualquier CRÍTICO de seguridad o autenticación
- RLS deshabilitado en tablas con datos sensibles
- Secretos expuestos en código cliente
- Funciones Edge sin validación de JWT cuando deberían tenerla

### Formato de cada hallazgo
```
## [SEVERIDAD] Título del problema
- **Archivo**: ruta/archivo.ext (función o línea si aplica)
- **Descripción**: qué está mal y por qué
- **Impacto**: qué puede pasar en producción
- **Reproducción**: cómo verificarlo (si aplica)
- **Corrección**: código o pasos concretos
```

## Arquitectura conocida
- No hay framework JS (Vanilla JS puro, `type="module"`)
- Supabase como BaaS: Auth (Google SSO), DB (PostgreSQL), Storage, Functions (Deno)
- Despliegue en Vercel (static site)
- WhatsApp Business API via Meta (webhook → Edge Function)
- Sin TypeScript, sin bundler (importmaps/ESM directo)
- Estilos: CSS vanilla en `styles.css` + estilos inline por página

## Variables de entorno disponibles (solo Supabase secrets y Vercel env)
- `SUPABASE_URL`, `SUPABASE_ANON_KEY` → expuestas en cliente (normal)
- `SUPABASE_SERVICE_ROLE_KEY` → solo en Edge Functions
- `WHATSAPP_ACCESS_TOKEN`, `WHATSAPP_PHONE_NUMBER_ID`, `WHATSAPP_VERIFY_TOKEN`
- `CLINIC_PHONE`

## Qué no revisar
- `node_modules/` (no existe, proyecto sin npm)
- `.gemini/` — directorio del agente AI
- Archivos `.png`, `.webp`, imágenes de assets

## Proceso de auditoría recomendado
1. Mapa del sistema
2. Auditoría global (arquitectura + calidad + bugs)
3. Auditoría de seguridad (separada)
4. Auditoría de rendimiento
5. Auditoría de mantenibilidad
6. Auditoría de pruebas/cobertura
7. Informe ejecutivo consolidado
