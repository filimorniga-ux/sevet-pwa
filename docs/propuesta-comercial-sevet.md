# 🏥 SEVET — Ecosistema Pet-Tech 360 · Propuesta Comercial

> **Versión:** 1.0 · **Fecha:** Marzo 2026
> **Elaborado por:** [Tu Nombre / NombreEmpresa]
> **Contacto:** [tu@email.com] · [+56 9 XXXX XXXX]

---

## 1. ¿Qué es SEVET y qué están adquiriendo?

SEVET es un **ecosistema digital completo** diseñado exclusivamente para clínicas veterinarias. No es una simple página web — es una **plataforma inteligente** que automatiza la operación diaria de su clínica, mejora la experiencia de sus clientes y le ahorra horas de trabajo administrativo cada semana.

### Lo que obtienen

| Componente | Beneficio directo |
| --- | --- |
| 🌐 **Sitio web profesional** | Presencia online moderna que genera confianza y capta nuevos clientes 24/7 |
| 📅 **Sistema de agendamiento** | Sus clientes agendan solos desde el celular. Cero llamadas para coordinar |
| 📱 **Notificaciones automáticas por WhatsApp** | Confirmaciones, recordatorios de citas, vacunas y agenda diaria del veterinario, sin intervención humana |
| 🤖 **Chatbot con inteligencia artificial** | Responde preguntas frecuentes y guía al cliente, incluso fuera de horario |
| 📋 **Ficha clínica digital** | Historial médico, vacunas, recetas — todo en un solo lugar, accesible desde cualquier dispositivo |
| 👩‍⚕️ **Panel profesional** | Cada veterinario ve su agenda del día, fichas y herramientas desde su celular |
| 🔐 **Control de acceso por roles** | Dueño, veterinario, recepcionista, peluquero — cada uno ve solo lo que necesita |
| 📲 **App instalable (PWA)** | Se instala como app en el celular sin pasar por Google Play ni App Store |

### ¿Por qué es diferente a un sitio web tradicional?

Un sitio web común solo muestra información. **SEVET trabaja por usted**: agenda citas, envía recordatorios, organiza la agenda de sus profesionales y mantiene el historial de cada paciente. Imagine tener un **asistente administrativo digital que trabaja 24/7 sin sueldo**.

---

## 2. Arquitectura Tecnológica (Project Bible)

### Stack tecnológico

```text
┌─────────────────────────────────────────────────┐
│              FRONTEND (lo que ve el usuario)     │
│  HTML5 + CSS3 + JavaScript ES6+                  │
│  Progressive Web App (PWA) · Service Worker      │
│  Diseño responsive (celular, tablet, escritorio) │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│              BACKEND (el cerebro)                │
│  Supabase (PostgreSQL)                           │
│  ├── Base de datos                               │
│  ├── Autenticación (Google SSO + email)          │
│  ├── Row Level Security (RLS)                    │
│  ├── Edge Functions (Deno/TypeScript)            │
│  └── Cron Jobs automáticos                       │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│           INTEGRACIONES EXTERNAS                 │
│  📱 WhatsApp Business API (Meta)                 │
│  🤖 OpenAI API (ChatGPT)                        │
│  ⚡ Make.com (automatizaciones)                  │
│  🔐 Google OAuth (login seguro)                  │
│  🌐 Vercel (hosting global)                      │
└─────────────────────────────────────────────────┘
```

### Módulos del sistema

| # | Módulo | Descripción | Estado |
| --- | --- | --- | --- |
| 1 | Landing page | Sitio público con servicios, equipo, contacto | ✅ Listo |
| 2 | Autenticación | Login con Google, email, roles, perfil obligatorio | ✅ Listo |
| 3 | Agendamiento | Selección de servicio, profesional, horario disponible | ✅ Listo |
| 4 | WhatsApp Fase 1 | Confirmación automática de cita al cliente | ✅ Listo |
| 5 | WhatsApp Fase 2 | Recordatorio 24h y 1h antes de la cita | ✅ Listo |
| 6 | WhatsApp Fase 3 | Agenda diaria enviada al veterinario cada mañana | ✅ Listo |
| 7 | WhatsApp Fase 4 | Recordatorio de vacunas y controles médicos | ✅ Listo |
| 8 | Chatbot AI | Asistente virtual con inteligencia artificial | ✅ Listo |
| 9 | Ficha clínica | Historial SOAP, vacunas, recetas, imágenes | ✅ Listo |
| 10 | Panel admin | Dashboard con métricas y gestión | ✅ Listo |
| 11 | PWA | Instalable, offline-capable | ✅ Listo |

---

## 3. Recursos que debe proporcionar el cliente

Para que el sistema funcione bajo **su marca y sus cuentas**, necesitamos que usted proporcione los siguientes recursos. Nosotros nos encargamos de toda la configuración técnica.

### Checklist de recursos obligatorios

| # | Recurso | Para qué se usa | Quién lo crea |
| --- | --- | --- | --- |
| 1 | 📱 **Número de teléfono dedicado** | WhatsApp Business de la clínica | El cliente proporciona |
| 2 | 📄 **Documentos del negocio** (patente, RUT empresa) | Verificar el negocio en Meta | El cliente entrega |
| 3 | 📘 **Cuenta Facebook del negocio** | Vincular WhatsApp Business API | Cliente crea (con nuestra guía) |
| 4 | 🏢 **Meta Business Suite** | Administrar WhatsApp API y plantillas | Nosotros configuramos |
| 5 | 📧 **Email del negocio** (Gmail o dominio propio) | Login de Google, notificaciones | Cliente proporciona |
| 6 | 💳 **Método de pago** (tarjeta) | Suscripciones de servicios (si superan el free) | Cliente registra |
| 7 | 🌐 **Dominio web** (ej: `sevet.cl`) | Dirección del sitio web | Cliente compra (o nosotros lo gestionamos) |
| 8 | 📸 **Logo, fotos del equipo y local** | Contenido visual del sitio | Cliente proporciona |

> 📌 **Nota:** Si su clínica no tiene cuenta de Facebook o Meta Business, nosotros la creamos junto con usted. La titularidad siempre queda a nombre del negocio.

---

## 3B. Información requerida del cliente para configuración

Esta sección debe ser completada por el cliente antes del inicio de la puesta en marcha. La información se usará para configurar el **chatbot IA, el panel de servicios, el contenido del sitio y las notificaciones automáticas de WhatsApp**.

> [!IMPORTANT]
> Sin esta información no podemos configurar el chatbot, los precios reales ni las notificaciones. Mientras no esté completa, el sistema funcionará con datos de ejemplo.

---

### 🕐 Horarios y Atención

| Pregunta | Respuesta del cliente |
| --- | --- |
| ¿Días de atención? (ej: Lunes a Viernes) | |
| ¿Horario de apertura? (ej: 09:00) | |
| ¿Horario de cierre? (ej: 00:00 / medianoche) | |
| ¿Atienden sábados? ¿En qué horario? | |
| ¿Atienden domingos o festivos? | |
| ¿La telemedicina tiene horario diferente al presencial? | |
| ¿Requieren cita previa o también atienden sin hora? | |
| ¿Cuánto tiempo promedio dura una consulta general? | |

---

### 💰 Precios y Servicios

> Completa la tabla con todos los servicios y sus precios actuales. Si el precio varía por tamaño de mascota u otro factor, indicarlo en la columna de observaciones.

| Servicio | Precio CLP | Duración estimada | Observaciones |
| --- | --- | --- | --- |
| Consulta general | | | |
| Consulta de urgencia | | | |
| Vacunación (perro) | | | |
| Vacunación (gato) | | | |
| Desparasitación | | | |
| Cirugía menor | | | |
| Cirugía mayor | | | |
| Esterilización (hembra) | | | |
| Esterilización (macho) | | | |
| Telemedicina | | | |
| Peluquería básica (perro pequeño) | | | |
| Peluquería básica (perro mediano) | | | |
| Peluquería básica (perro grande) | | | |
| Peluquería felina | | | |
| Control de peso | | | |
| Radiografía | | | |
| Ecografía / Ultrasonido | | | |
| Examen de sangre | | | |
| Hospitalización (por día) | | | |
| Guardería (por día) | | | |
| Otros servicios (agregar filas) | | | |

---

### 🐾 Especialidades y Capacidades

| Pregunta | Respuesta |
| --- | --- |
| ¿Qué especies atienden? (perros, gatos, conejos, aves, reptiles...) | |
| ¿Tienen especialista en cardiología? | |
| ¿Tienen especialista en dermatología? | |
| ¿Hacen cirugías de alta complejidad en la misma clínica? | |
| ¿Tienen servicio de hospitalización? ¿Cuántos cupos? | |
| ¿Hacen exámenes de laboratorio in-situ o los envían a externo? | |
| ¿Tienen radiografías en la clínica? | |
| ¿Tienen ecógrafo? | |
| ¿Tienen farmacia propia con medicamentos veterinarios? | |

---

### 💳 Pagos y Comodidades

| Pregunta | Respuesta |
| --- | --- |
| ¿Qué métodos de pago aceptan? (efectivo, tarjeta, WebPay, transferencia...) | |
| ¿Tienen cuotas o financiamiento? | |
| ¿Tienen convenio con seguros de mascotas? ¿Cuáles? | |
| ¿Tienen estacionamiento propio? ¿Es gratuito? | |
| ¿Cómo llegar en transporte público? (línea de metro / micro) | |
| ¿Hay acceso para personas con movilidad reducida? | |

---

### 📋 Vacunas y Protocolos

| Pregunta | Respuesta |
| --- | --- |
| ¿Qué vacunas aplican para perros? (ej: Polivalente 5en1, Rabia, Bordetella...) | |
| ¿Qué vacunas aplican para gatos? (ej: Triple felina, Leucemia, Rabia...) | |
| ¿Entregan libreta/carnet de vacunación? | |
| ¿Tienen plan de vacunación anual con precio especial? | |
| ¿Requieren que la mascota esté desparasitada para vacunar? | |
| ¿Con qué frecuencia recomiendan la desparasitación? | |

---

### 📸 Contenido Visual y Marca

| Recurso | Estado | Observaciones |
| --- | --- | --- |
| Logo principal (PNG fondo transparente) | ☐ Pendiente / ☐ Entregado | |
| Logo versión cuadrada (para ícono app) | ☐ Pendiente / ☐ Entregado | |
| Fotos del equipo profesional (con nombres y cargos) | ☐ Pendiente / ☐ Entregado | |
| Fotos del interior de la clínica | ☐ Pendiente / ☐ Entregado | |
| Fotos del exterior / fachada | ☐ Pendiente / ☐ Entregado | |
| Video institucional o de redes sociales | ☐ Pendiente / ☐ Entregado | |
| Paleta de colores oficial (o referencia a usar) | ☐ Pendiente / ☐ Entregado | |
| Tipografía oficial (si la hay) | ☐ Pendiente / ☐ Entregado | |

---

### 👥 Equipo de la Clínica

> Para mostrar en el sitio y configurar los perfiles del sistema

| Nombre completo | Cargo / Especialidad | ¿Aparece en el sitio? |
| --- | --- | --- |
| Dr. Alberto Sánchez | Director Médico | Sí |
| | | |
| | | |
| | | |

---

### 💬 FAQ — Preguntas frecuentes de sus clientes

> Estas respuestas se cargarán directamente en el chatbot. Si hay preguntas que los clientes hacen repetidamente, agrégalas aquí con la respuesta exacta que quieres que el bot entregue.

| Pregunta frecuente | Respuesta ideal |
| --- | --- |
| ¿Atienden urgencias en la noche? | |
| ¿Puedo ir sin cita previa? | |
| ¿Cuánto cuesta una consulta? | |
| ¿Qué debo llevar a la primera consulta? | |
| ¿La clínica hace seguimiento post-operatorio? | |
| ¿Tienen servicio a domicilio? | |
| ¿Qué hago si mi mascota tiene una emergencia en la madrugada? | |
| (Agregar más según experiencia real) | |

---

> [!NOTE]
> Una vez completada esta tabla, la información se cargará en el sistema en un plazo de **2-3 días hábiles**. El chatbot quedará actualizado con datos reales de la clínica, los precios del panel administrativo reflejarán los valores correctos y las notificaciones de WhatsApp usarán los datos actualizados.

---

## 4. Propuesta Económica

### Opción A — Entrega del proyecto (sin mantenimiento)

| Concepto | Detalle | Inversión |
| --- | --- | --- |
| 💻 **Desarrollo completo** | Todo el ecosistema SEVET listo para producción | **$2.500.000 CLP** |
| 🛡️ **Garantía** | 60 días post-entrega (ver sección 5) | **Incluida** |
| 📖 **Documentación** | Manual de uso + documentación técnica | **Incluida** |
| 🔄 **Migración a sus cuentas** | Transferencia a sus servicios propios | **Incluida** |

**Después de la garantía**, cualquier soporte o mejora se cobra por hora según tarifa vigente.

---

### Opción B — Entrega + Mantenimiento mensual (recomendada)

| Concepto | Detalle | Inversión |
| --- | --- | --- |
| 💻 **Desarrollo completo** | Todo el ecosistema SEVET | **$2.500.000 CLP** |
| 🛡️ **Garantía** | 60 días | **Incluida** |
| 🔧 **Mantenimiento mensual** | A elegir paquete ↓ | **Mensual** |

### Paquetes de mantenimiento

| Característica | 🥉 Básico | 🥈 Estándar | 🥇 Premium |
| --- | --- | --- | --- |
| **Precio/mes** | **$40.000** | **$70.000** | **$100.000** |
| Monitoreo del sistema | ✅ | ✅ | ✅ |
| Fix de bugs críticos | ✅ | ✅ | ✅ |
| Renovación de tokens/APIs | ✅ | ✅ | ✅ |
| Actualización de APIs externas | ❌ | ✅ | ✅ |
| Reporte mensual de uso | ❌ | ✅ | ✅ |
| Backup verificado | ❌ | ✅ | ✅ |
| Soporte por WhatsApp | ❌ | Horario laboral | Prioritario 24/7 |
| Horas de mejoras incluidas | 0 | 1 hora | 2 horas |
| **Tiempo de respuesta** | 72h | 24h | 4h |

---

### Tarifa por hora para mejoras adicionales

| Tipo de trabajo | Tarifa/hora |
| --- | --- |
| Mejoras de diseño (UI/UX) | $18.000 CLP |
| Nuevas funcionalidades | $22.000 CLP |
| Integraciones complejas (APIs, pagos) | $25.000 CLP |
| Consultoría técnica | $15.000 CLP |

---

## 5. ¿Qué incluye la garantía?

La garantía de **60 días** cubre exclusivamente correcciones de lo entregado:

### Incluido en garantía ✅

- Bugs o errores en funcionalidades **ya entregadas y aprobadas**
- Problemas de lógica (ej: un cálculo incorrecto, un filtro que no funciona)
- Errores de visualización en navegadores principales (Chrome, Safari, Firefox)
- Correcciones de rendimiento si algo entregado funciona lento
- Ajustes menores de texto o contenido dentro de las páginas existentes

### NO incluido en garantía ❌

- Cambios de diseño, nuevos colores, reestructuración visual
- Funcionalidades nuevas que no estaban en el alcance original
- Problemas causados por el cliente (borrar datos, cambiar configuraciones)
- Cambios originados por terceros (Meta cambia su API, Google modifica políticas)
- Capacitación adicional más allá de la entrega inicial
- Contenido nuevo (fotos, textos, páginas adicionales)

> 🔑 **Regla simple**: Si estaba en lo pactado y no funciona → garantía. Si es algo nuevo → mejora (se cotiza aparte).

---

## 6. Escalabilidad y costos de mejoras futuras

Su plataforma está diseñada para crecer con su negocio. Estas son mejoras comunes que podría necesitar en el futuro:

### Mejoras de corto plazo (3-6 meses)

| Mejora | Descripción | Inversión estimada |
| --- | --- | --- |
| 💳 Pagos online | Cobrar reservas con Webpay / Mercado Pago | $350.000 - $500.000 |
| 📊 Dashboard avanzado | Métricas de rendimiento, ingresos, KPIs | $200.000 - $350.000 |
| 📧 Email marketing | Campañas automáticas a clientes | $150.000 - $250.000 |
| 🐾 Portal del dueño | El cliente ve historial, vacunas, próximas citas | $200.000 - $300.000 |

### Mejoras de mediano plazo (6-12 meses)

| Mejora | Descripción | Inversión estimada |
| --- | --- | --- |
| 🏪 Tienda online | Venta de productos y alimentos | $400.000 - $600.000 |
| 📹 Teleconsulta | Videollamada integrada con el veterinario | $300.000 - $500.000 |
| 🔔 Push notifications | Notificaciones nativas en el celular | $100.000 - $200.000 |
| 📱 App nativa (iOS/Android) | Publicación en App Store y Play Store | $1.500.000 - $3.000.000 |

### Mejoras menores (cotización rápida)

| Mejora | Inversión estimada |
| --- | --- |
| Agregar nueva plantilla WhatsApp | $30.000 - $40.000 |
| Nueva página informativa | $50.000 - $80.000 |
| Nuevo tipo de reporte | $60.000 - $100.000 |
| Ajuste de diseño en sección | $40.000 - $80.000 |
| Nueva automatización Make | $50.000 - $100.000 |

---

## 7. Plan de ejecución — Puesta en marcha

Una vez firmado el acuerdo, la puesta en marcha toma **2 a 3 semanas**:

```text
Semana 1 ──────────────────────────────────────────
│
├── Día 1-2: Recepción de recursos del cliente
│   └── Facebook, número WhatsApp, documentos, logo
│
├── Día 3-4: Creación de cuentas del cliente
│   ├── Meta Business Suite → verificación del negocio
│   ├── Supabase → organización del cliente
│   ├── Dominio → compra y configuración DNS
│   └── Make.com → cuenta del cliente
│
├── Día 5: Migración técnica
│   ├── Transfer repositorio GitHub
│   ├── Deploy en Vercel con dominio propio
│   ├── Import escenarios Make.com
│   └── Configurar variables de entorno
│
Semana 2 ──────────────────────────────────────────
│
├── Día 6-7: Configuración WhatsApp Business
│   ├── Registrar número real de la clínica
│   ├── Crear plantillas de mensajes (10 plantillas)
│   └── Esperar aprobación de Meta (24-48h)
│
├── Día 8-9: Pruebas en producción
│   ├── Flujo completo de agendamiento
│   ├── Notificaciones WhatsApp reales
│   ├── Login de cada tipo de usuario
│   └── Chatbot AI funcionando
│
├── Día 10: Capacitación
│   ├── Sesión con recepcionista (1 hora)
│   ├── Sesión con veterinarios (1 hora)
│   └── Sesión con administrador (30 min)
│
Semana 3 ──────────────────────────────────────────
│
├── Día 11-12: Ajustes finales
│   ├── Correcciones según feedback
│   └── Contenido personalizado (fotos, textos)
│
├── Día 13: 🚀 GO LIVE — Lanzamiento oficial
│
└── Día 14-15: Monitoreo post-lanzamiento
    └── Verificar que todo funciona en producción real
```

> 📅 **Entrega estimada:** 15 días hábiles desde la recepción de todos los recursos del cliente.

---

## 8. ¿Por qué elegir SEVET para su clínica?

### El problema que resolvemos

Cada día su clínica pierde tiempo y dinero en tareas que podrían ser automáticas:

- ☎️ **Llamadas telefónicas** para confirmar citas → SEVET envía WhatsApp automático
- 📋 **Fichas en papel** que se pierden o deterioran → SEVET guarda todo en la nube
- 🕐 **Pacientes que no llegan** porque olvidaron la cita → SEVET les recuerda 24h y 1h antes
- 📅 **El veterinario no sabe su agenda** hasta que llega → SEVET la envía a su WhatsApp cada mañana
- 💉 **Vacunas que se vencen** sin que nadie avise → SEVET alerta al dueño con 14 días de anticipación

### El beneficio concreto

| Métrica | Sin SEVET | Con SEVET |
| --- | --- | --- |
| Tiempo en agendar 1 cita | 5-10 min (teléfono) | 2 min (autoservicio) |
| Citas olvidadas (no-show) | ~20-30% | ~5-10% (con recordatorios) |
| Tiempo organizando agenda | 30 min/día | 0 min (se envía sola) |
| Vacunas vencidas sin avisar | Frecuente | 0 (alerta automática a 14 días) |
| Disponibilidad para agendar | Horario laboral | **24/7** desde cualquier celular |
| Fichas clínicas perdidas | Posible (papel) | **Imposible** (respaldo en nube) |

### Lo que nos diferencia

1. **No es una página web genérica** — Es un sistema hecho a medida para veterinarias chilenas, con formato de RUT, moneda CLP y zona horaria de Santiago.

2. **WhatsApp real, no spam** — Usamos la API oficial de Meta. Sus mensajes llegan como una empresa verificada, no como un número desconocido.

3. **Inversión, no gasto** — El sistema se paga solo en el primer mes al reducir no-shows, automatizar tareas y captar clientes que agendan fuera de horario.

4. **Crece con usted** — Hoy empieza con agendamiento y notificaciones. Mañana puede agregar pagos, tienda online, teleconsulta, o lo que necesite.

---

## 9. Resumen Ejecutivo

| Concepto | Detalle |
| --- | --- |
| **Producto** | SEVET — Ecosistema digital completo para clínicas veterinarias |
| **Incluye** | Sitio web PWA + Agendamiento + WhatsApp automatizado + Chatbot AI + Ficha clínica + Panel admin |
| **Inversión inicial** | $2.500.000 CLP (referencia, negociable) |
| **Garantía** | 60 días post-entrega |
| **Mantenimiento** | Desde $40.000 CLP/mes (opcional) |
| **Costos recurrentes del cliente** | ~$25.000-50.000 CLP/mes (servicios cloud) |
| **Tiempo de entrega** | 15 días hábiles desde recepción de recursos |
| **Escalabilidad** | Pagos online, tienda, teleconsulta, app nativa |

### Costos mensuales estimados para el cliente

| Servicio | Plan gratuito | Plan Pro (si necesitan más) |
| --- | --- | --- |
| Supabase | ✅ Gratis (500MB DB) | $23.000 CLP/mes (8GB DB) |
| Make.com | ✅ Gratis (1.000 ops/mes) | $8.500 CLP/mes |
| Meta WhatsApp | ✅ Gratis (1.000 conversaciones/mes) | Pago por uso |
| OpenAI (Chatbot) | — | ~$5.000-15.000 CLP/mes |
| Dominio .cl | — | ~$10.000 CLP/año |
| Vercel | ✅ Gratis | $19.000 CLP/mes (si necesitan más) |
| **Total estimado** | **~$5.000-15.000 CLP/mes** | **~$60.000-80.000 CLP/mes** |

---

### Próximos pasos

1. ✅ Revisión de esta propuesta
2. ✅ Resolución de dudas
3. 📝 Firma de acuerdo y anticipo
4. 📋 Entrega de recursos por parte del cliente
5. 🚀 Inicio de puesta en marcha (15 días)

---

> *"SEVET no reemplaza a su equipo — lo potencia. Cada profesional se enfoca en lo que mejor hace: cuidar a las mascotas. Nosotros nos encargamos de que la tecnología trabaje por ustedes."*

---

**[Tu Nombre / NombreEmpresa]**
📧 [tu@email.com] · 📱 [+56 9 XXXX XXXX]
🌐 [tudominio.cl]
