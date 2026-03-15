# 📱 Plantillas WhatsApp — SEVET

> Referencia rápida de todas las plantillas de mensaje de WhatsApp Business API.
> **WABA ID:** `229745983408226`
> **Phone Number ID:** `1006914325847395`
> **Número de prueba:** +1 555 140 2688

---

## 1. `confirmacion_cita_sevet` ✅ (Aprobada)

**Categoría:** Utilidad | **Idioma:** es_CL | **Disparador:** Al agendar cita

**Cuerpo:**
```
🐾 *SEVET - Cita Confirmada*

Hola {{1}}, te confirmamos tu cita para el servicio de {{2}}.

👨‍⚕️ *Profesional:* {{3}}
📅 *Fecha:* {{4}}
🕐 *Hora:* {{5}}

📍 Av. San Pablo 6106, Lo Prado.
¡Te esperamos! Si necesitas reagendar, avísanos por este medio.
```

**Variables:** 1=nombre_cliente, 2=servicio, 3=profesional, 4=fecha, 5=hora

**Botones:** Escribir por WhatsApp | Ir a la Web | Llamar a la Clínica

**Pie de página:** SEVET – Veterinaria San Alberto - San Pablo 6106-A, Lo Prado

---

## 2. `recordatorio_cita_24h` ⏳ (Pendiente)

**Categoría:** Utilidad | **Idioma:** es_CL | **Disparador:** pg_cron/Make 24h antes

**Cuerpo:**
```
⏰ *Recordatorio de Cita — SEVET*

Hola {{1}}, te recordamos que mañana tienes una cita:

🩺 *Servicio:* {{2}}
👨‍⚕️ *Profesional:* {{3}}
📅 *Fecha:* {{4}}
🕐 *Hora:* {{5}}

📍 Av. San Pablo 6106, Lo Prado.
Si no puedes asistir, por favor avísanos con anticipación.
```

**Variables:** 1=nombre_cliente, 2=servicio, 3=profesional, 4=fecha, 5=hora

---

## 3. `recordatorio_cita_1h` ⏳ (Pendiente)

**Categoría:** Utilidad | **Idioma:** es_CL | **Disparador:** pg_cron/Make 1h antes

**Cuerpo:**
```
🔔 *Tu cita es en 1 hora — SEVET*

Hola {{1}}, te recordamos que tu cita para {{2}} es hoy a las {{3}}.

📍 Av. San Pablo 6106, Lo Prado.
¡Te esperamos!
```

**Variables:** 1=nombre_cliente, 2=servicio, 3=hora

---

## 4. `nueva_cita_recepcion` ⏳ (Pendiente)

**Categoría:** Utilidad | **Idioma:** es_CL | **Disparador:** Al agendar (notifica a recepción)

**Cuerpo:**
```
📋 *Nueva Cita Agendada*

👤 *Cliente:* {{1}}
🐾 *Mascota:* {{2}}
🩺 *Servicio:* {{3}}
👨‍⚕️ *Profesional:* {{4}}
📅 *Fecha:* {{5}}
🕐 *Hora:* {{6}}

Agendada desde la web.
```

**Variables:** 1=nombre_cliente, 2=mascota, 3=servicio, 4=profesional, 5=fecha, 6=hora

---

## 5. `nueva_cita_vet` ⏳ (Pendiente)

**Categoría:** Utilidad | **Idioma:** es_CL | **Disparador:** Al agendar (notifica al profesional)

**Cuerpo:**
```
📌 *Nueva cita asignada — SEVET*

Tienes una nueva cita agendada:

👤 *Cliente:* {{1}}
🐾 *Mascota:* {{2}}
🩺 *Servicio:* {{3}}
📅 *Fecha:* {{4}}
🕐 *Hora:* {{5}}
```

**Variables:** 1=nombre_cliente, 2=mascota, 3=servicio, 4=fecha, 5=hora

---

## 6. `agenda_diaria_vet` ⏳ (Pendiente)

**Categoría:** Utilidad | **Idioma:** es_CL | **Disparador:** pg_cron diario 7:00 AM

**Cuerpo:**
```
☀️ *Buenos días, {{1}}*

Tu agenda de hoy ({{2}}) tiene {{3}} cita(s):

{{4}}

¡Que tengas un excelente día! 🐾
```

**Variables:** 1=nombre_vet, 2=fecha_hoy, 3=cantidad_citas, 4=resumen_citas

---

## 7. `recordatorio_vacuna` ⏳ (Pendiente)

**Categoría:** Utilidad | **Idioma:** es_CL | **Disparador:** pg_cron diario 9:00 AM (14 días antes)

**Cuerpo:**
```
💉 *Recordatorio de Vacuna — SEVET*

Hola {{1}}, te informamos que la vacuna de {{2}} para tu mascota *{{3}}* vence el {{4}}.

Te recomendamos agendar una cita para mantener al día su protección.

📞 Llámanos o agenda por la web.
```

**Variables:** 1=nombre_dueño, 2=nombre_vacuna, 3=nombre_mascota, 4=fecha_vencimiento

---

## 8. `recordatorio_control` ⏳ (Pendiente)

**Categoría:** Utilidad | **Idioma:** es_CL | **Disparador:** pg_cron diario 9:00 AM (7 días antes)

**Cuerpo:**
```
🩺 *Control Pendiente — SEVET*

Hola {{1}}, te recordamos que tu mascota *{{2}}* tiene un control de {{3}} programado para el {{4}}.

Agenda tu cita para asegurar su bienestar.

📞 Llámanos o agenda por la web.
```

**Variables:** 1=nombre_dueño, 2=nombre_mascota, 3=tipo_control, 4=fecha_control

---

## 9. `cancelacion_cita` ⏳ (Pendiente)

**Categoría:** Utilidad | **Idioma:** es_CL | **Disparador:** Al cancelar cita

**Cuerpo:**
```
❌ *Cita Cancelada — SEVET*

Hola {{1}}, te informamos que tu cita de {{2}} del {{3}} a las {{4}} ha sido cancelada.

Si deseas reagendar, puedes hacerlo desde nuestra web o llamando al +56 2 2773 1554.
```

**Variables:** 1=nombre_cliente, 2=servicio, 3=fecha, 4=hora

---

## 🔧 Comandos curl para crear plantillas

> Reemplaza `$TOKEN` por tu System User Token permanente.

### recordatorio_cita_24h
```bash
curl -X POST "https://graph.facebook.com/v22.0/229745983408226/message_templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "recordatorio_cita_24h",
    "language": "es_CL",
    "category": "UTILITY",
    "components": [
      {
        "type": "BODY",
        "text": "⏰ *Recordatorio de Cita — SEVET*\n\nHola {{1}}, te recordamos que mañana tienes una cita:\n\n🩺 *Servicio:* {{2}}\n👨‍⚕️ *Profesional:* {{3}}\n📅 *Fecha:* {{4}}\n🕐 *Hora:* {{5}}\n\n📍 Av. San Pablo 6106, Lo Prado.\nSi no puedes asistir, por favor avísanos con anticipación.",
        "example": { "body_text": [["Miguel", "Consulta General", "Dr. Sánchez", "lunes 17 de marzo", "10:00"]] }
      },
      {
        "type": "FOOTER",
        "text": "SEVET – Veterinaria San Alberto"
      }
    ]
  }'
```

### recordatorio_cita_1h
```bash
curl -X POST "https://graph.facebook.com/v22.0/229745983408226/message_templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "recordatorio_cita_1h",
    "language": "es_CL",
    "category": "UTILITY",
    "components": [
      {
        "type": "BODY",
        "text": "🔔 *Tu cita es en 1 hora — SEVET*\n\nHola {{1}}, te recordamos que tu cita para {{2}} es hoy a las {{3}}.\n\n📍 Av. San Pablo 6106, Lo Prado.\n¡Te esperamos!",
        "example": { "body_text": [["Miguel", "Consulta General", "10:00"]] }
      },
      {
        "type": "FOOTER",
        "text": "SEVET – Veterinaria San Alberto"
      }
    ]
  }'
```

### nueva_cita_recepcion
```bash
curl -X POST "https://graph.facebook.com/v22.0/229745983408226/message_templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "nueva_cita_recepcion",
    "language": "es_CL",
    "category": "UTILITY",
    "components": [
      {
        "type": "BODY",
        "text": "📋 *Nueva Cita Agendada*\n\n👤 *Cliente:* {{1}}\n🐾 *Mascota:* {{2}}\n🩺 *Servicio:* {{3}}\n👨‍⚕️ *Profesional:* {{4}}\n📅 *Fecha:* {{5}}\n🕐 *Hora:* {{6}}\n\nAgendada desde la web.",
        "example": { "body_text": [["Miguel", "Luna", "Consulta General", "Dr. Sánchez", "lunes 17 de marzo", "10:00"]] }
      },
      {
        "type": "FOOTER",
        "text": "SEVET – Veterinaria San Alberto"
      }
    ]
  }'
```

### nueva_cita_vet
```bash
curl -X POST "https://graph.facebook.com/v22.0/229745983408226/message_templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "nueva_cita_vet",
    "language": "es_CL",
    "category": "UTILITY",
    "components": [
      {
        "type": "BODY",
        "text": "📌 *Nueva cita asignada — SEVET*\n\nTienes una nueva cita agendada:\n\n👤 *Cliente:* {{1}}\n🐾 *Mascota:* {{2}}\n🩺 *Servicio:* {{3}}\n📅 *Fecha:* {{4}}\n🕐 *Hora:* {{5}}",
        "example": { "body_text": [["Miguel", "Luna", "Consulta General", "lunes 17 de marzo", "10:00"]] }
      },
      {
        "type": "FOOTER",
        "text": "SEVET – Veterinaria San Alberto"
      }
    ]
  }'
```

### agenda_diaria_vet
```bash
curl -X POST "https://graph.facebook.com/v22.0/229745983408226/message_templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "agenda_diaria_vet",
    "language": "es_CL",
    "category": "UTILITY",
    "components": [
      {
        "type": "BODY",
        "text": "☀️ *Buenos días, {{1}}*\n\nTu agenda de hoy ({{2}}) tiene {{3}} cita(s):\n\n{{4}}\n\n¡Que tengas un excelente día! 🐾",
        "example": { "body_text": [["Dr. Sánchez", "lunes 17 marzo", "3", "09:00 Consulta - Luna\n10:00 Vacuna - Rocky\n11:30 Control - Max"]] }
      },
      {
        "type": "FOOTER",
        "text": "SEVET – Veterinaria San Alberto"
      }
    ]
  }'
```

### recordatorio_vacuna
```bash
curl -X POST "https://graph.facebook.com/v22.0/229745983408226/message_templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "recordatorio_vacuna",
    "language": "es_CL",
    "category": "UTILITY",
    "components": [
      {
        "type": "BODY",
        "text": "💉 *Recordatorio de Vacuna — SEVET*\n\nHola {{1}}, te informamos que la vacuna de {{2}} para tu mascota *{{3}}* vence el {{4}}.\n\nTe recomendamos agendar una cita para mantener al día su protección.\n\n📞 Llámanos o agenda por la web.",
        "example": { "body_text": [["Miguel", "Antirrábica", "Luna", "viernes 28 de marzo"]] }
      },
      {
        "type": "FOOTER",
        "text": "SEVET – Veterinaria San Alberto"
      }
    ]
  }'
```

### recordatorio_control
```bash
curl -X POST "https://graph.facebook.com/v22.0/229745983408226/message_templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "recordatorio_control",
    "language": "es_CL",
    "category": "UTILITY",
    "components": [
      {
        "type": "BODY",
        "text": "🩺 *Control Pendiente — SEVET*\n\nHola {{1}}, te recordamos que tu mascota *{{2}}* tiene un control de {{3}} programado para el {{4}}.\n\nAgenda tu cita para asegurar su bienestar.\n\n📞 Llámanos o agenda por la web.",
        "example": { "body_text": [["Miguel", "Luna", "post-cirugía", "viernes 28 de marzo"]] }
      },
      {
        "type": "FOOTER",
        "text": "SEVET – Veterinaria San Alberto"
      }
    ]
  }'
```

### cancelacion_cita
```bash
curl -X POST "https://graph.facebook.com/v22.0/229745983408226/message_templates" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "cancelacion_cita",
    "language": "es_CL",
    "category": "UTILITY",
    "components": [
      {
        "type": "BODY",
        "text": "❌ *Cita Cancelada — SEVET*\n\nHola {{1}}, te informamos que tu cita de {{2}} del {{3}} a las {{4}} ha sido cancelada.\n\nSi deseas reagendar, puedes hacerlo desde nuestra web o llamando al +56 2 2773 1554.",
        "example": { "body_text": [["Miguel", "Consulta General", "lunes 17 de marzo", "10:00"]] }
      },
      {
        "type": "FOOTER",
        "text": "SEVET – Veterinaria San Alberto"
      }
    ]
  }'
```
