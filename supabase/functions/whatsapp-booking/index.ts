/**
 * SEVET — WhatsApp Booking Bot
 * Agendamiento automático de citas via Meta WhatsApp Cloud API
 *
 * ENV VARS requeridos (Supabase Edge Function Secrets):
 *   WHATSAPP_ACCESS_TOKEN     — Token de Meta (Graph API)
 *   WHATSAPP_PHONE_NUMBER_ID  — ID del número en Meta
 *   WHATSAPP_VERIFY_TOKEN     — Token propio para verificar webhook
 *   SUPABASE_URL              — Auto-inyectado por Supabase
 *   SUPABASE_SERVICE_ROLE_KEY — Auto-inyectado por Supabase
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// ── Env vars ──────────────────────────────────────────────────
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WA_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") ?? "";
const WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";
const WA_VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "sevet_verify";
const WA_APP_SECRET = Deno.env.get("WHATSAPP_APP_SECRET") ?? "";
const APP_URL = "https://sevet-pwa.vercel.app";

const supabase = createClient(SUPABASE_URL, SUPABASE_SRK);

// ── Servicios disponibles ────────────────────────────────────
const SERVICES: Record<
  string,
  { label: string; type: string; duration: number; triage: string }
> = {
  "1": {
    label: "Consulta Médica 🩺",
    type: "consulta",
    duration: 30,
    triage: "normal",
  },
  "2": {
    label: "Vacunación 💉",
    type: "vacuna",
    duration: 20,
    triage: "normal",
  },
  "3": { label: "Control 📋", type: "control", duration: 20, triage: "normal" },
  "4": {
    label: "Urgencia 🚨",
    type: "urgencia",
    duration: 45,
    triage: "urgente",
  },
  "5": {
    label: "Peluquería ✂️",
    type: "peluqueria",
    duration: 60,
    triage: "normal",
  },
  "6": {
    label: "Guardería 🏠",
    type: "guarderia",
    duration: 480,
    triage: "normal",
  },
};

// ── Horarios disponibles ─────────────────────────────────────
const TIME_SLOTS = [
  "09:00",
  "09:30",
  "10:00",
  "10:30",
  "11:00",
  "11:30",
  "14:00",
  "14:30",
  "15:00",
  "15:30",
  "16:00",
  "16:30",
  "17:00",
  "17:30",
];

// ── Días de la semana ────────────────────────────────────────
const DAYS: Record<string, number> = {
  lunes: 1,
  martes: 2,
  miércoles: 3,
  miercoles: 3,
  jueves: 4,
  viernes: 5,
  sábado: 6,
  sabado: 6,
};

// ── Utilidades ───────────────────────────────────────────────
function nextWeekday(targetDay: number): Date {
  const now = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }),
  );
  const diff = (targetDay - now.getDay() + 7) % 7 || 7;
  const result = new Date(now);
  result.setDate(now.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatDateCL(date: Date): string {
  return date.toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    timeZone: "America/Santiago",
  });
}

// ── Enviar mensaje WhatsApp ───────────────────────────────────
async function sendMessage(to: string, text: string): Promise<string | null> {
  if (!WA_TOKEN || !WA_PHONE_ID) {
    console.warn('[whatsapp-booking] Faltan WHATSAPP_ACCESS_TOKEN o WHATSAPP_PHONE_NUMBER_ID');
    return null;
  }
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${WA_PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${WA_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text, preview_url: false },
      }),
    },
  );
  if (!res.ok) {
    console.error('[whatsapp-booking] Error enviando mensaje:', await res.text());
    return null;
  }
  const data = await res.json().catch(() => ({}));
  return (data as Record<string, unknown[]>)?.messages?.[0]
    ? ((data as Record<string, unknown[]>).messages[0] as Record<string, string>).id ?? null
    : null;
}

// ── Persistencia en Inbox ─────────────────────────────────────
async function getOrCreateConversation(
  phone: string,
  lastMessage: string,
  profileId: string | null = null,
  contactName: string | null = null,
): Promise<string | null> {
  const { data, error } = await supabase.rpc('upsert_wa_conversation', {
    p_wa_contact_id: phone,
    p_contact_phone: `+${phone}`,
    p_contact_name:  contactName,
    p_profile_id:    profileId,
    p_last_message:  lastMessage,
  });
  if (error) { console.error('[inbox] upsert_wa_conversation error:', error); return null; }
  return data as string;
}

async function saveInboxMessage(
  convId: string,
  direction: 'inbound' | 'outbound',
  text: string,
  isBot: boolean,
  waMessageId: string | null = null,
): Promise<void> {
  const { error } = await supabase.from('wa_messages').insert({
    conversation_id: convId,
    wa_message_id:   waMessageId,
    direction,
    message_type:    'text',
    content:         { text },
    is_bot:          isBot,
  });
  if (error) console.error('[inbox] saveInboxMessage error:', error);
}

// Wrapper: enviar + guardar outbound en inbox
async function sendAndSave(to: string, text: string, convId: string | null): Promise<void> {
  const waId = await sendMessage(to, text);
  if (convId) await saveInboxMessage(convId, 'outbound', text, true, waId);
}

// ── Gestión de sesión ────────────────────────────────────────
interface Session {
  phone: string;
  state: string;
  context: Record<string, unknown>;
}

async function getSession(phone: string): Promise<Session> {
  const { data } = await supabase
    .from("whatsapp_sessions")
    .select("phone, state, context")
    .eq("phone", phone)
    .gt("expires_at", new Date().toISOString())
    .single();

  return data ?? { phone, state: "idle", context: {} };
}

async function saveSession(
  phone: string,
  state: string,
  context: Record<string, unknown>,
  currentState?: string,
): Promise<boolean> {
  const payload = {
    phone,
    state,
    context,
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  };

  if (currentState) {
    const { data, error } = await supabase
      .from("whatsapp_sessions")
      .update(payload)
      .eq("phone", phone)
      .eq("state", currentState)
      .select();

    return !error && data && data.length > 0;
  } else {
    const { error } = await supabase.from("whatsapp_sessions").upsert(payload);
    return !error;
  }
}

async function clearSession(phone: string): Promise<void> {
  await supabase.from("whatsapp_sessions").delete().eq("phone", phone);
}

// ── Buscar usuario registrado por teléfono ───────────────────
async function findUserByPhone(
  phone: string,
): Promise<{ id: string; user_id: string; full_name: string } | null> {
  // Normalizar: quitar el prefijo 56 si es chileno, buscar ambas variantes
  const withCode = phone.startsWith("56") ? phone : `56${phone}`;
  const withoutCode = phone.startsWith("56") ? phone.slice(2) : phone;

  const { data } = await supabase
    .from("profiles")
    .select("id, user_id, full_name, phone")
    .or(`phone.eq.${withCode},phone.eq.${withoutCode}`)
    .limit(1)
    .single();

  return data ?? null;
}

// ── Crear cita en appointments ───────────────────────────────
async function createAppointment(params: {
  petId:       string | null;
  vetId:       string | null;
  serviceType: string;
  dateTime:    string;
  triage:      string;
  notes:       string;
  guestPhone:  string;
  guestName?:  string;
}): Promise<string | null> {
  const { data, error } = await supabase
    .from("appointments")
    .insert({
      pet_id:       params.petId,
      vet_id:       params.vetId,
      service_type: params.serviceType,
      date_time:    params.dateTime,
      status:       "pendiente",
      triage_level: params.triage,
      notes:        params.notes,
      guest_phone:  params.guestPhone,
      guest_name:   params.guestName ?? null,
      source:       'whatsapp',
    })
    .select("id")
    .single();

  if (error) {
    console.error("[whatsapp-booking] Error creando cita:", error);
    return null;
  }
  return data?.id ?? null;
}

// ── Máquina de estados del bot ──────────────────────────────
async function processMessage(phone: string, text: string, convId: string | null): Promise<void> {
  const input   = text.trim().toLowerCase();
  const session = await getSession(phone);
  const state = session.state;
  const ctx = session.context;

  // ── Comando de cancelar en cualquier momento ──
  if (["cancelar", "cancel", "salir", "exit", "0"].includes(input)) {
    await clearSession(phone);
    await sendAndSave(phone,
      '❌ Reserva cancelada. Escribe "hola" cuando quieras agendar nuevamente.\n\n' +
      `También puedes hacerlo desde nuestra app: ${APP_URL}`,
      convId
    );
    return;
  }

  // ─────────────────── ESTADO: idle ───────────────────────────
  if (state === 'idle') {
    await saveSession(phone, 'selecting_service', {});
    await sendAndSave(phone,
      '¡Hola! 🐾 Bienvenido a *SEVET Clínica Veterinaria*.\n\n' +
      'Estoy aquí para ayudarte a agendar una cita.\n\n' +
      '*¿Qué servicio necesitas?*\n\n' +
      '1️⃣ Consulta Médica\n' +
      '2️⃣ Vacunación\n' +
      '3️⃣ Control\n' +
      '4️⃣ Urgencia\n' +
      '5️⃣ Peluquería\n' +
      '6️⃣ Guardería\n\n' +
      '_Responde con el número de tu elección._\n' +
      '_Escribe *cancelar* en cualquier momento para salir._',
      convId
    );
    return;
  }

  // ─────────────────── ESTADO: selecting_service ──────────────
  if (state === "selecting_service") {
    const svc = SERVICES[input];
    if (!svc) {
      await sendAndSave(phone, '⚠️ Por favor responde con un número del 1 al 6.', convId);
      return;
    }

    await saveSession(phone, 'selecting_date', { service: input, serviceLabel: svc.label, serviceType: svc.type, triage: svc.triage, duration: svc.duration });
    await sendAndSave(phone,
      `✅ *${svc.label}* seleccionada.\n\n` +
      '*¿Qué día prefieres?*\n\n' +
      '📅 Lunes\n📅 Martes\n📅 Miércoles\n📅 Jueves\n📅 Viernes\n📅 Sábado\n\n' +
      '_Escribe el nombre del día (ej: "lunes")_',
      convId
    );
    return;
  }

  // ─────────────────── ESTADO: selecting_date ─────────────────
  if (state === "selecting_date") {
    const dayNum = DAYS[input];
    if (!dayNum) {
      await sendAndSave(phone, '⚠️ No reconocí ese día. Por favor escribe: lunes, martes, miércoles, jueves, viernes o sábado.', convId);
      return;
    }

    const date = nextWeekday(dayNum);
    const dateStr = date.toISOString().split("T")[0]; // YYYY-MM-DD

    await saveSession(phone, 'selecting_time', { ...ctx, date: dateStr, dateLegible: formatDateCL(date) });
    await sendAndSave(phone,
      `📅 *${formatDateCL(date)}*\n\n` +
      '*Horarios disponibles:*\n\n' +
      TIME_SLOTS.map((t, i) => `${String(i + 1).padStart(2, '0')}. ${t}`).join('\n') +
      '\n\n_Responde con el número del horario que prefieres._',
      convId
    );
    return;
  }

  // ─────────────────── ESTADO: selecting_time ─────────────────
  if (state === "selecting_time") {
    const slotNum = parseInt(input) - 1;
    if (isNaN(slotNum) || slotNum < 0 || slotNum >= TIME_SLOTS.length) {
      await sendAndSave(phone, `⚠️ Por favor responde con un número del 1 al ${TIME_SLOTS.length}.`, convId);
      return;
    }

    const time = TIME_SLOTS[slotNum];
    const dateTime = `${ctx.date}T${time}:00-03:00`;
    const newCtx = { ...ctx, time, dateTime };

    await saveSession(phone, 'confirming', newCtx);
    await sendAndSave(phone,
      `🕐 *${time} hrs* seleccionado.\n\n` +
      '*¿Confirmas tu reserva?*\n\n' +
      `📋 Servicio: ${ctx.serviceLabel}\n` +
      `📅 Fecha: ${ctx.dateLegible}\n` +
      `🕐 Hora: ${time} hrs\n\n` +
      'Responde *sí* para confirmar o *no* para cancelar.',
      convId
    );
    return;
  }

  // ─────────────────── ESTADO: confirming ─────────────────────
  if (state === "confirming") {
    if (
      !["sí", "si", "yes", "s", "1", "confirmar", "confirmo"].includes(input)
    ) {
      await clearSession(phone);
      await sendAndSave(phone, '❌ Reserva cancelada. Escribe "hola" cuando quieras intentarlo de nuevo.', convId);
      return;
    }

    // Buscar si el cliente está registrado
    const user = await findUserByPhone(phone);

    const notes = user
      ? `Reserva vía WhatsApp — ${phone}`
      : `Reserva vía WhatsApp (sin cuenta) — ${phone}`;

    const apptId = await createAppointment({
      petId:       null,
      vetId:       null,
      serviceType: ctx.serviceType as string,
      dateTime:    ctx.dateTime as string,
      triage:      ctx.triage as string,
      notes,
      guestPhone:  phone,
      guestName:   ctx.petName as string ?? undefined,
    });

    if (!apptId) {
      await sendAndSave(phone,
        '❌ Hubo un problema al crear tu cita. Por favor intenta de nuevo o llámanos directamente.',
        convId
      );
      return;
    }

    await clearSession(phone);

    if (user) {
      // Cliente registrado ✅
      await sendAndSave(phone,
        `✅ *¡Cita confirmada, ${user.full_name}!*\n\n` +
        `📋 ${ctx.serviceLabel}\n` +
        `📅 ${ctx.dateLegible}\n` +
        `🕐 ${ctx.time} hrs\n\n` +
        '🔔 Recibirás un recordatorio antes de tu cita.\n\n' +
        `Gestiona todas tus citas desde la app:\n${APP_URL}`,
        convId
      );
    } else {
      // Cliente sin cuenta 🆕
      await sendAndSave(phone,
        '✅ *¡Cita confirmada!*\n\n' +
        `📋 ${ctx.serviceLabel}\n` +
        `📅 ${ctx.dateLegible}\n` +
        `🕐 ${ctx.time} hrs\n\n` +
        '─────────────────\n' +
        '🐾 *¿Sabías que puedes hacer mucho más con SEVET?*\n\n' +
        'Regístrate gratis y accede a:\n' +
        '• 📋 Historial clínico digital de tu mascota\n' +
        '• 💉 Cartilla de vacunas y controles\n' +
        '• 📅 Gestión de citas desde el celular\n' +
        '• 🔔 Recordatorios automáticos\n\n' +
        `👉 *Regístrate aquí (2 minutos):*\n${APP_URL}/pages/auth.html\n\n` +
        '_Tu cita queda agendada de todas formas. ¡Hasta pronto! 🐶🐱_',
        convId
      );
    }

    // Limpiar sesiones expiradas periódicamente
    try {
      await supabase.rpc("cleanup_expired_whatsapp_sessions");
    } catch (err) {
      console.error("[whatsapp-booking] Error cleaning sessions:", err);
    }

    return;
  }

  // ─────────────────── Estado desconocido → reset ─────────────
  await clearSession(phone);
  await saveSession(phone, 'selecting_service', {});
  await sendAndSave(phone,
    '¡Hola! 🐾 Bienvenido a *SEVET Clínica Veterinaria*.\n\n' +
    '*¿Qué servicio necesitas?*\n\n' +
    '1️⃣ Consulta Médica\n' +
    '2️⃣ Vacunación\n' +
    '3️⃣ Control\n' +
    '4️⃣ Urgencia\n' +
    '5️⃣ Peluquería\n' +
    '6️⃣ Guardería\n\n' +
    '_Responde con el número de tu elección._',
    convId
  );
}

// ── Handler principal ────────────────────────────────────────
Deno.serve(async (req) => {
  const url = new URL(req.url);

  // ── GET: Verificación del webhook de Meta ──
  if (req.method === "GET") {
    const mode = url.searchParams.get("hub.mode");
    const token = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");

    if (mode === "subscribe" && token === WA_VERIFY_TOKEN && challenge) {
      console.info("[whatsapp-booking] Webhook verificado ✅");
      return new Response(challenge, { status: 200 });
    }
    return new Response("Forbidden", { status: 403 });
  }

  // ── POST: Mensajes entrantes de WhatsApp ──
  if (req.method === "POST") {
    const signature = req.headers.get("x-hub-signature-256");
    const rawBody = await req.text();

    if (!WA_APP_SECRET) {
      console.error("[whatsapp-booking] WHATSAPP_APP_SECRET no configurado");
      return new Response("Internal Server Error", { status: 500 });
    }

    if (!signature) {
      console.error("[whatsapp-booking] Falta firma HMAC en la petición");
      return new Response("Forbidden", { status: 403 });
    }

    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      "raw",
      encoder.encode(WA_APP_SECRET),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );

    const signatureBytes = await crypto.subtle.sign(
      "HMAC",
      key,
      encoder.encode(rawBody),
    );

    const hashArray = Array.from(new Uint8Array(signatureBytes));
    const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    const expectedSignature = `sha256=${hashHex}`;

    if (signature !== expectedSignature) {
      console.error("[whatsapp-booking] Firma HMAC inválida");
      return new Response("Forbidden", { status: 403 });
    }

    let body: any;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return new Response("Bad Request", { status: 400 });
    }

    try {
      // Extraer mensaje del payload de Meta
      const entry = (body?.entry as any[])?.[0];
      const change = (entry?.changes as any[])?.[0];
      const value = change?.value;
      const messages = value?.messages as any[];

      if (!messages?.length) {
        // Puede ser una notificación de estado (leído, entregado) — ignorar
        return new Response("OK", { status: 200 });
      }

      const msg = messages[0];
      const phone = msg?.from as string;
      const type = msg?.type as string;

      if (!phone) {
        return new Response("OK", { status: 200 });
      }

      // Solo procesar mensajes de texto
      let text = "";
      if (type === "text") {
        text = msg?.text?.body ?? "";
      } else if (type === "interactive") {
        // Botones / listas de WhatsApp (para futuro upgrade)
        const interactive = msg?.interactive;
        text = interactive?.button_reply?.id ??
          interactive?.list_reply?.id ??
          "";
      } else {
        // Audio, imagen, etc. — responder que no se entiende
        await sendMessage(
          phone,
          "⚠️ Por favor escríbeme un mensaje de texto para agendar tu cita 🐾",
        );
        return new Response("OK", { status: 200 });
      }

      if (text) {
        // Buscar perfil para enriquecer la conversación
        const profile = await findUserByPhone(phone).catch(() => null);
        // Crear/actualizar conversación en inbox
        const convId = await getOrCreateConversation(
          phone,
          text,
          profile?.id ?? null,
          profile?.full_name ?? null,
        ).catch(() => null);
        // Guardar mensaje entrante
        const waId = (msg as Record<string, unknown>).id as string | null;
        if (convId) await saveInboxMessage(convId, 'inbound', text, false, waId).catch(() => {});
        // Procesar con el bot
        await processMessage(phone, text, convId);
      }
    } catch (err) {
      console.error("[whatsapp-booking] Error procesando mensaje:", err);
      // Siempre responder 200 a Meta para evitar reintentos
    }

    return new Response("OK", { status: 200 });
  }

  return new Response("Method Not Allowed", { status: 405 });
});
