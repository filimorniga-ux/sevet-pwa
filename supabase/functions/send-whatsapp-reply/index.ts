// send-whatsapp-reply — Permite al staff responder conversaciones WhatsApp
// desde el inbox de SEVET. Requiere JWT (autenticación de staff).

import { createClient } from "jsr:@supabase/supabase-js@2";

const PHONE_ID = Deno.env.get("WHATSAPP_PHONE_NUMBER_ID")!;
const TOKEN = Deno.env.get("WHATSAPP_ACCESS_TOKEN")!;
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const sb = createClient(SUPABASE_URL, SERVICE_KEY);

async function sendWhatsAppMessage(to: string, text: string): Promise<string> {
  const res = await fetch(
    `https://graph.facebook.com/v19.0/${PHONE_ID}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to,
        type: "text",
        text: { body: text },
      }),
    },
  );
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(`WhatsApp API error: ${JSON.stringify(err)}`);
  }
  const data = await res.json();
  return data?.messages?.[0]?.id ?? "";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
    });
  }

  // Verificar JWT del staff
  const authHeader = req.headers.get("Authorization");
  if (!authHeader?.startsWith("Bearer ")) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  const token = authHeader.slice(7);
  const sbUser = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY") ?? SERVICE_KEY);
  const { data: { user }, error: authErr } = await sbUser.auth.getUser(token);
  if (authErr || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
    });
  }

  // Verificar rol del staff
  const { data: profile } = await sb
    .from("profiles")
    .select("id, role")
    .eq("user_id", user.id)
    .single();

  if (!profile || !["owner", "admin", "recepcionista"].includes(profile.role)) {
    return new Response(JSON.stringify({ error: "Forbidden" }), {
      status: 403,
    });
  }

  let body: { conversation_id: string; message_type?: string; content: { text: string } };
  try {
    body = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
    });
  }

  const { conversation_id, content } = body;
  if (!conversation_id || !content?.text?.trim()) {
    return new Response(
      JSON.stringify({ error: "conversation_id y content.text son requeridos" }),
      { status: 400 },
    );
  }

  // Obtener conversación para saber el número del contacto
  const { data: conv, error: convErr } = await sb
    .from("wa_conversations")
    .select("wa_contact_id, status")
    .eq("id", conversation_id)
    .single();

  if (convErr || !conv) {
    return new Response(
      JSON.stringify({ error: "Conversación no encontrada" }),
      { status: 404 },
    );
  }

  if (conv.status === "resolved") {
    return new Response(
      JSON.stringify({ error: "La conversación ya está resuelta" }),
      { status: 400 },
    );
  }

  // Enviar mensaje por WhatsApp
  let waMessageId: string;
  try {
    waMessageId = await sendWhatsAppMessage(conv.wa_contact_id, content.text.trim());
  } catch (err) {
    console.error("[send-reply] WhatsApp error:", err);
    return new Response(
      JSON.stringify({ error: "Error al enviar mensaje por WhatsApp" }),
      { status: 502 },
    );
  }

  // Guardar mensaje en wa_messages
  const { error: insertErr } = await sb.from("wa_messages").insert({
    conversation_id,
    wa_message_id: waMessageId,
    direction: "outbound",
    message_type: "text",
    content: { text: content.text.trim() },
    is_bot: false,
    sent_by: profile.id,
  });

  if (insertErr) {
    console.error("[send-reply] DB insert error:", insertErr);
    // No fallamos - el mensaje ya fue enviado
  }

  // Actualizar timestamp de conversación
  await sb.from("wa_conversations").update({
    last_message_at: new Date().toISOString(),
    last_message_txt: content.text.trim(),
    status: "waiting",
  }).eq("id", conversation_id);

  return new Response(
    JSON.stringify({ success: true, wa_message_id: waMessageId }),
    {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    },
  );
});
