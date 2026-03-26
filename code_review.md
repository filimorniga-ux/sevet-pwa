# code_review.md — Checklist de Revisión de Código SEVET

## 1. Seguridad

### Autenticación & Autorización
- [ ] ¿Toda ruta protegida verifica sesión activa antes de renderizar?
- [ ] ¿`check_user_is_staff()` en Supabase RLS aplica correctamente el rol?
- [ ] ¿Las Edge Functions con datos sensibles tienen `verify_jwt: true`?
- [ ] ¿`window.signOutUser` funciona en todas las páginas?
- [ ] ¿El token de sesión no se logea ni se expone en consola?

### Datos & RLS
- [ ] ¿Todas las tablas públicas tienen RLS habilitado?
- [ ] ¿Las políticas de INSERT/UPDATE/DELETE están acotadas a roles específicos?
- [ ] ¿La vista `appointment_attendance_report` usa `security_invoker = true`?
- [ ] ¿Las funciones SQL tienen `search_path = public, pg_temp`?

### Inputs
- [ ] ¿Los inputs de texto sanitizan HTML antes de insertarse en el DOM?
- [ ] ¿Los parámetros de URL/query se validan antes de usarlos en queries?
- [ ] ¿Los uploads de archivos validan tipo y tamaño?

### Tokens & Secretos
- [ ] ¿`SUPABASE_SERVICE_ROLE_KEY` solo se usa en Edge Functions (server-side)?
- [ ] ¿`WHATSAPP_ACCESS_TOKEN` solo está en Supabase Secrets?
- [ ] ¿No hay credenciales hardcodeadas en el código?

## 2. Rendimiento

- [ ] ¿Las consultas a Supabase usan `.select('campo1, campo2')` solo los campos necesarios?
- [ ] ¿No hay consultas N+1 en loops?
- [ ] ¿Los `setInterval` de polling se limpian con `clearInterval` al salir?
- [ ] ¿Los canales de Realtime se desuscriben con `removeChannel` al cambiar de vista?
- [ ] ¿Las imágenes tienen `loading="lazy"`?
- [ ] ¿Los módulos JS se cargan de forma diferida cuando es posible?

## 3. Calidad de Código

- [ ] ¿Las funciones tienen un único propósito?
- [ ] ¿No hay `console.log` de datos sensibles en producción?
- [ ] ¿Los errores de fetch/async tienen `try/catch` o `.catch()`?
- [ ] ¿Los mensajes de error al usuario son comprensibles (no errores técnicos)?
- [ ] ¿Los IDs de elementos HTML son únicos en cada página?
- [ ] ¿No hay código comentado ni funciones muertas sin eliminar?

## 4. UX Técnica

- [ ] ¿Los botones muestran estado `disabled` mientras procesan?
- [ ] ¿Hay estados de carga visibles para operaciones > 300ms?
- [ ] ¿Los estados vacíos tienen mensajes claros?
- [ ] ¿Los errores de red tienen mensajes de retry?
- [ ] ¿Los formularios validan antes de enviar al servidor?

## 5. WhatsApp / Bot

- [ ] ¿El webhook verifica `verify_token` en GET?
- [ ] ¿El bot tiene fallback para mensajes fuera de flujo?
- [ ] ¿Los mensajes multimedia redirigen al inbox (handoff humano)?
- [ ] ¿La función `upsert_wa_conversation` es idempotente?
- [ ] ¿El proxy `get-wa-media` valida el token antes de servir media?

## 6. Base de Datos

- [ ] ¿Las migraciones son reversibles o tienen `IF NOT EXISTS`?
- [ ] ¿Los índices existen en columnas de búsqueda frecuente (`wa_contact_id`, `conversation_id`, `pet_id`, etc.)?
- [ ] ¿`TIMESTAMPTZ` se usa en lugar de `TIMESTAMP` para evitar problemas de zona horaria?
- [ ] ¿Las foreign keys tienen `ON DELETE CASCADE` o `RESTRICT` según corresponda?

## 7. Tests Mínimos Requeridos (ausentes actualmente)

| Módulo | Tests faltantes |
|--------|----------------|
| Bot agendamiento | Flujo completo: hola → servicio → nombre → mascota → día → hora → confirmar |
| sendReply | Mock de fetch, token expirado, conversación cerrada |
| loadConversations | Lista vacía, error de red, usuario sin permisos |
| Auth guard | Redirect sin sesión, rol insuficiente |
| Webhook WhatsApp | Verificación GET, mensaje texto, audio, imagen, fuera de flujo |
| RLS Supabase | Staff puede leer billing, owner solo sus mascotas |

## 8. Riesgos Conocidos

| Riesgo | Estado | Urgencia |
|--------|--------|----------|
| Auth lock en polling + sendReply | Parcialmente resuelto | ALTA |
| Token de media WhatsApp expira en 24h | Aceptado (limitación Meta) | MEDIA |
| `anyone_can_book` INSERT sin restricción | Aceptado (booking público) | BAJA |
| Sin tests automatizados | Deuda técnica | MEDIA |
| JS sin TypeScript | Deuda técnica | BAJA |
