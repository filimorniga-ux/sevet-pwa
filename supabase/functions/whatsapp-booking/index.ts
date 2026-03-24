/**
 * SEVET — WhatsApp Booking Bot v13
 * Fix: source='chatbot', RPC sin profile_id
 */

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SRK = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const WA_TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN") ?? "";
const WA_PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID") ?? "";
const WA_VERIFY_TOKEN = Deno.env.get("WHATSAPP_VERIFY_TOKEN") ?? "sevet_verify";
const APP_URL = "https://sevet-pwa.vercel.app";

const supabase = createClient(SUPABASE_URL, SUPABASE_SRK);

const SERVICES: Record<string, { label: string; type: string; duration: number; triage: string }> = {
  "1": { label: "Consulta Médica",  type: "consulta",   duration: 30,  triage: "normal" },
  "2": { label: "Vacunación",       type: "vacunacion",  duration: 20,  triage: "normal" },
  "3": { label: "Control",           type: "control",    duration: 20,  triage: "normal" },
  "4": { label: "Urgencia",          type: "urgencia",   duration: 30,  triage: "urgente" },
  "5": { label: "Peluquería",       type: "peluqueria", duration: 60,  triage: "normal" },
  "6": { label: "Guardería",        type: "guarderia",  duration: 480, triage: "normal" },
};

const TIME_SLOTS = [
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30",
  "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
];

const DAYS: Record<string, number> = {
  lunes: 1, martes: 2, miércoles: 3, miercoles: 3,
  jueves: 4, viernes: 5, sábado: 6, sabado: 6,
};

function nextWeekday(targetDay: number): Date {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Santiago" }));
  const diff = (targetDay - now.getDay() + 7) % 7 || 7;
  const result = new Date(now);
  result.setDate(now.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
}

function formatDateCL(date: Date): string {
  return date.toLocaleDateString("es-CL", { weekday: "long", day: "numeric", month: "long", timeZone: "America/Santiago" });
}

async function sendMessage(to: string, text: string): Promise<string | null> {
  if (!WA_TOKEN || !WA_PHONE_ID) return null;
  const res = await fetch(`https://graph.facebook.com/v20.0/${WA_PHONE_ID}/messages`, {
    method: "POST",
    headers: { Authorization: `Bearer ${WA_TOKEN}`, "Content-Type": "application/json" },
    body: JSON.stringify({ messaging_product: "whatsapp", to, type: "text", text: { preview_url: false, body: text } }),
  });
  const json = await res.json();
  if (!res.ok) { console.error('[bot] sendMessage error:', JSON.stringify(json)); return null; }
  return json?.messages?.[0]?.id ?? null;
}

async function upsertConversation(phone: string, displayName: string, lastMessage: string): Promise<string | null> {
  const { data, error } = await supabase.rpc('upsert_wa_conversation', {
    p_wa_contact_id: phone,
    p_contact_phone: phone,
    p_contact_name:  displayName,
    p_profile_id:    null,
    p_last_message:  lastMessage,
  });
  if (error) { console.error('[inbox] upsert error:', JSON.stringify(error)); return null; }
  return data as string;
}

async function saveInboxMessage(convId: string, direction: 'inbound' | 'outbound', text: string, isBot: boolean, waId: string | null = null): Promise<void> {
  const { error } = await supabase.from('wa_messages').insert({
    conversation_id: convId, wa_message_id: waId, direction,
    message_type: 'text', content: { text }, is_bot: isBot,
  });
  if (error) console.error('[inbox] saveMessage error:', JSON.stringify(error));
}

async function sendAndSave(to: string, text: string, convId: string | null): Promise<void> {
  const waId = await sendMessage(to, text);
  if (convId) await saveInboxMessage(convId, 'outbound', text, true, waId);
}

interface Session { phone: string; state: string; context: Record<string, unknown>; }

async function getSession(phone: string): Promise<Session> {
  const { data } = await supabase.from("whatsapp_sessions")
    .select("phone, state, context").eq("phone", phone)
    .gt("expires_at", new Date().toISOString()).single();
  return data ?? { phone, state: "idle", context: {} };
}

async function saveSession(phone: string, state: string, context: Record<string, unknown>): Promise<void> {
  await supabase.from("whatsapp_sessions").upsert({
    phone, state, context,
    updated_at: new Date().toISOString(),
    expires_at: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
  });
}

async function clearSession(phone: string): Promise<void> {
  await supabase.from("whatsapp_sessions").delete().eq("phone", phone);
}

async function createAppointment(params: {
  serviceType: string; dateTime: string; triage: string; notes: string;
  guestPhone: string; guestName: string; guestPetName: string;
}): Promise<string | null> {
  const { data, error } = await supabase.from("appointments").insert({
    pet_id: null, vet_id: null,
    service_type:   params.serviceType,
    date_time:      params.dateTime,
    status:         "pendiente",
    triage_level:   params.triage,
    notes:          params.notes,
    guest_phone:    params.guestPhone,
    guest_name:     params.guestName,
    guest_pet_name: params.guestPetName,
    source:         'chatbot',   // ✔ valor válido según constraint
  }).select("id").single();
  if (error) { console.error("[bot] createAppointment error:", JSON.stringify(error)); return null; }
  return data?.id ?? null;
}

async function processMessage(phone: string, text: string, convId: string | null): Promise<void> {
  const input   = text.trim().toLowerCase();
  const session = await getSession(phone);
  const state   = session.state;
  const ctx     = session.context;

  if (["cancelar", "cancel", "salir", "exit", "0"].includes(input)) {
    await clearSession(phone);
    await sendAndSave(phone, `❌ Reserva cancelada. Escribe "hola" cuando quieras agendar nuevamente.\n\n🌐 ${APP_URL}`, convId);
    return;
  }

  if (state === 'idle') {
    await saveSession(phone, 'selecting_service', {});
    await sendAndSave(phone,
      '¡Hola! 🐾 Bienvenido a *SEVET Clínica Veterinaria*.\n\nEstoy aquí para ayudarte a agendar una cita.\n\n' +
      '*¿Qué servicio necesitas?*\n\n' +
      '1️⃣ Consulta Médica\n2️⃣ Vacunación\n3️⃣ Control\n4️⃣ Urgencia\n5️⃣ Peluquería\n6️⃣ Guardería\n\n' +
      '_Responde con el número de tu elección._\n_Escribe *cancelar* en cualquier momento para salir._', convId);
    return;
  }

  if (state === "selecting_service") {
    const svc = SERVICES[input];
    if (!svc) { await sendAndSave(phone, '⚠️ Por favor responde con un número del 1 al 6.', convId); return; }
    await saveSession(phone, 'awaiting_owner_name', { service: input, serviceLabel: svc.label, serviceType: svc.type, triage: svc.triage, duration: svc.duration });
    await sendAndSave(phone, `✅ *${svc.label}* seleccionada.\n\n👤 *¿Cuál es tu nombre?*\n\n_Escribe tu nombre completo._`, convId);
    return;
  }

  if (state === "awaiting_owner_name") {
    const ownerName = text.trim();
    if (ownerName.length < 2) { await sendAndSave(phone, '⚠️ Por favor escribe tu nombre completo.', convId); return; }
    await saveSession(phone, 'awaiting_pet_name', { ...ctx, ownerName });
    await sendAndSave(phone, `👋 *${ownerName}*!\n\n🐾 *¿Cómo se llama tu mascota?*\n\n_Escribe el nombre._`, convId);
    return;
  }

  if (state === "awaiting_pet_name") {
    const petName = text.trim();
    if (petName.length < 1) { await sendAndSave(phone, '⚠️ Por favor escribe el nombre de tu mascota.', convId); return; }
    await saveSession(phone, 'selecting_date', { ...ctx, petName });
    await sendAndSave(phone,
      `❤️ *${petName}* registrado.\n\n📅 *¿Qué día prefieres?*\n\n` +
      '📅 Lunes\n📅 Martes\n📅 Miércoles\n📅 Jueves\n📅 Viernes\n📅 Sábado\n\n_Escribe el nombre del día (ej: "lunes")_', convId);
    return;
  }

  if (state === "selecting_date") {
    const dayNum = DAYS[input];
    if (!dayNum) { await sendAndSave(phone, '⚠️ No reconocí ese día. Por favor escribe: lunes, martes, miércoles, jueves, viernes o sábado.', convId); return; }
    const date    = nextWeekday(dayNum);
    const dateStr = date.toISOString().split("T")[0];
    await saveSession(phone, 'selecting_time', { ...ctx, date: dateStr, dateLegible: formatDateCL(date) });
    await sendAndSave(phone,
      `📅 *${formatDateCL(date)}*\n\n*Horarios disponibles:*\n\n` +
      TIME_SLOTS.map((t, i) => `${String(i + 1).padStart(2, '0')}. ${t}`).join('\n') +
      '\n\n_Responde con el número del horario que prefieres._', convId);
    return;
  }

  if (state === "selecting_time") {
    const slotNum = parseInt(input) - 1;
    if (isNaN(slotNum) || slotNum < 0 || slotNum >= TIME_SLOTS.length) {
      await sendAndSave(phone, `⚠️ Por favor responde con un número del 1 al ${TIME_SLOTS.length}.`, convId); return;
    }
    const time     = TIME_SLOTS[slotNum];
    const dateTime = `${ctx.date}T${time}:00-03:00`;
    await saveSession(phone, 'confirming', { ...ctx, time, dateTime });
    await sendAndSave(phone,
      `🕐 *${time} hrs* seleccionado.\n\n*¿Confirmas tu reserva?*\n\n` +
      `👤 Titular: ${ctx.ownerName}\n🐾 Mascota: ${ctx.petName}\n📋 Servicio: ${ctx.serviceLabel}\n📅 Fecha: ${ctx.dateLegible}\n🕐 Hora: ${time} hrs\n\n` +
      'Responde *sí* para confirmar o *no* para cancelar.', convId);
    return;
  }

  if (state === "confirming") {
    if (!["sí", "si", "yes", "s", "1", "confirmar", "confirmo"].includes(input)) {
      await clearSession(phone);
      await sendAndSave(phone, '❌ Reserva cancelada. Escribe "hola" cuando quieras intentarlo de nuevo.', convId);
      return;
    }
    const apptId = await createAppointment({
      serviceType:  ctx.serviceType  as string,
      dateTime:     ctx.dateTime     as string,
      triage:       ctx.triage       as string,
      notes:        `Reserva vía WhatsApp — ${phone}`,
      guestPhone:   phone,
      guestName:    ctx.ownerName    as string,
      guestPetName: ctx.petName      as string,
    });
    if (!apptId) {
      await sendAndSave(phone, '❌ Hubo un problema al crear tu cita. Por favor intenta de nuevo o llámanos directamente.', convId);
      return;
    }
    await clearSession(phone);
    await sendAndSave(phone,
      `✅ *¡Cita confirmada!* 🐾\n\n` +
      `👤 *Titular:* ${ctx.ownerName}\n🐾 *Mascota:* ${ctx.petName}\n` +
      `📋 *Servicio:* ${ctx.serviceLabel}\n📅 *Fecha:* ${ctx.dateLegible}\n🕐 *Hora:* ${ctx.time} hrs\n\n` +
      `Te esperamos en nuestra clínica.\n📍 San Pablo 6106-A, Lo Prado\n🌐 ${APP_URL}`, convId);
    return;
  }

  await clearSession(phone);
  await sendAndSave(phone, '¡Hola! 🐾 Escribe "hola" para comenzar a agendar tu cita.', convId);
}

Deno.serve(async (req) => {
  if (req.method === "GET") {
    const url       = new URL(req.url);
    const mode      = url.searchParams.get("hub.mode");
    const token     = url.searchParams.get("hub.verify_token");
    const challenge = url.searchParams.get("hub.challenge");
    if (mode === "subscribe" && token === WA_VERIFY_TOKEN) return new Response(challenge, { status: 200 });
    return new Response("Forbidden", { status: 403 });
  }

  if (req.method === "POST") {
    let body: Record<string, unknown>;
    try { body = await req.json(); } catch { return new Response("Bad Request", { status: 400 }); }

    const entries = (body.entry as unknown[]) ?? [];
    for (const entry of entries) {
      const changes = ((entry as Record<string, unknown>).changes as unknown[]) ?? [];
      for (const change of changes) {
        const value    = (change as Record<string, unknown>).value as Record<string, unknown>;
        const messages = (value.messages as unknown[]) ?? [];
        for (const msg of messages) {
          const m       = msg as Record<string, unknown>;
          const phone   = m.from as string;
          const msgId   = m.id as string;
          const msgType = m.type as string;
          if (msgType !== "text") continue;
          const text        = ((m.text as Record<string, unknown>)?.body as string) ?? "";
          const contacts    = (value.contacts as unknown[]) ?? [];
          const contact     = (contacts[0] as Record<string, unknown>) ?? {};
          const displayName = ((contact.profile as Record<string, unknown>)?.name as string) ?? phone;
          const convId      = await upsertConversation(phone, displayName, text);
          if (convId) await saveInboxMessage(convId, 'inbound', text, false, msgId);
          await processMessage(phone, text, convId);
        }
      }
    }
    return new Response("OK", { status: 200 });
  }

  return new Response("Method Not Allowed", { status: 405 });
});
