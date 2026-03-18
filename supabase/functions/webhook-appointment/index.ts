import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

// ── Environment Variables ──────────────────────────────────────
const SUPABASE_URL             = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const META_WHATSAPP_TOKEN      = Deno.env.get('META_ACCESS_TOKEN') || Deno.env.get('META_WHATSAPP_TOKEN') || '';
const META_PHONE_ID            = Deno.env.get('META_PHONE_ID') || '';
const RESEND_API_KEY           = Deno.env.get('RESEND_API_KEY') || '';
const CLINIC_EMAIL             = Deno.env.get('CLINIC_EMAIL') || 'sanalberto2807@gmail.com';
const RECEPTIONIST_PHONE       = Deno.env.get('RECEPTIONIST_PHONE') || '56965911058';
const RECEPTIONIST_NAME        = Deno.env.get('RECEPTIONIST_NAME') || 'Recepción SEVET';
const WHATSAPP_TEMPLATE_NAME   = 'confirmacion_cita_sevet';

// ── CORS Headers ───────────────────────────────────────────────
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// ── Helpers ────────────────────────────────────────────────────
function cleanPhone(phone: string): string {
  return phone.replace(/[\s\-\+\(\)]/g, '');
}

function buildEmailHtml(p: Record<string, string>): string {
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Confirmación de Cita – SEVET</title>
</head>
<body style="margin:0;padding:0;background:#f5f0f5;font-family:'Segoe UI',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f0f5;padding:40px 0;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);max-width:600px;width:100%;">

        <!-- Header -->
        <tr>
          <td style="background:linear-gradient(135deg,#8b2d8b,#6b1d8b);padding:40px;text-align:center;">
            <div style="font-size:2.5rem;margin-bottom:8px;">🐾</div>
            <h1 style="color:#ffffff;margin:0;font-size:1.6rem;font-weight:700;letter-spacing:-0.5px;">¡Cita Confirmada!</h1>
            <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;font-size:0.95rem;">Veterinaria San Alberto · SEVET</p>
          </td>
        </tr>

        <!-- Body -->
        <tr>
          <td style="padding:40px;">
            <p style="color:#374151;font-size:1rem;margin:0 0 24px;">Hola <strong>${p.guest_name || 'Cliente'}</strong>, tu cita ha sido registrada exitosamente. Aquí están los detalles:</p>

            <!-- Details Card -->
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f9f0f9;border-radius:12px;padding:24px;margin-bottom:24px;">
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #e9d5e9;">
                  <span style="font-size:0.8rem;color:#8b2d8b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">📅 Fecha</span>
                  <div style="font-size:1rem;color:#1f2937;font-weight:600;margin-top:4px;">${p.date || '-'}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #e9d5e9;">
                  <span style="font-size:0.8rem;color:#8b2d8b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">🕐 Hora</span>
                  <div style="font-size:1rem;color:#1f2937;font-weight:600;margin-top:4px;">${p.time || '-'}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #e9d5e9;">
                  <span style="font-size:0.8rem;color:#8b2d8b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">🩺 Servicio</span>
                  <div style="font-size:1rem;color:#1f2937;font-weight:600;margin-top:4px;">${p.service || '-'}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;border-bottom:1px solid #e9d5e9;">
                  <span style="font-size:0.8rem;color:#8b2d8b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">👩‍⚕️ Profesional</span>
                  <div style="font-size:1rem;color:#1f2937;font-weight:600;margin-top:4px;">${p.professional || 'Por confirmar'}</div>
                </td>
              </tr>
              <tr>
                <td style="padding:8px 0;">
                  <span style="font-size:0.8rem;color:#8b2d8b;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;">🐾 Paciente</span>
                  <div style="font-size:1rem;color:#1f2937;font-weight:600;margin-top:4px;">${p.guest_pet_name || '-'}</div>
                </td>
              </tr>
            </table>

            <p style="color:#6b7280;font-size:0.88rem;margin:0 0 24px;">Si necesitas cancelar o reagendar, contáctanos con anticipación. ¡Gracias por confiar en SEVET!</p>

            <!-- CTA -->
            <div style="text-align:center;margin-bottom:32px;">
              <a href="https://sevet-pwa.vercel.app/pages/mi-agenda.html"
                 style="background:linear-gradient(135deg,#8b2d8b,#6b1d8b);color:#ffffff;text-decoration:none;padding:14px 32px;border-radius:50px;font-weight:700;font-size:0.95rem;display:inline-block;">
                Ver Mi Agenda 📅
              </a>
            </div>
          </td>
        </tr>

        <!-- Footer -->
        <tr>
          <td style="background:#f9f0f9;padding:24px;text-align:center;border-top:1px solid #e9d5e9;">
            <p style="color:#8b2d8b;font-weight:700;margin:0 0 4px;font-size:0.9rem;">🏥 Veterinaria San Alberto – SEVET</p>
            <p style="color:#9ca3af;font-size:0.78rem;margin:0;">Este es un correo automático. No responder directamente.</p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function buildReceptionistEmailHtml(p: Record<string, string>): string {
  return `<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"/><title>Nueva Cita – SEVET</title></head>
<body style="font-family:'Segoe UI',Arial,sans-serif;background:#f5f5f5;padding:32px;">
  <div style="background:#fff;border-radius:12px;padding:32px;max-width:500px;margin:0 auto;box-shadow:0 2px 12px rgba(0,0,0,0.08);">
    <h2 style="color:#8b2d8b;margin-top:0;">🔔 Nueva Cita Agendada</h2>
    <table width="100%" cellpadding="6">
      <tr><td style="color:#6b7280;font-size:0.85rem">📅 Fecha</td><td><strong>${p.date}</strong></td></tr>
      <tr><td style="color:#6b7280;font-size:0.85rem">🕐 Hora</td><td><strong>${p.time}</strong></td></tr>
      <tr><td style="color:#6b7280;font-size:0.85rem">🩺 Servicio</td><td><strong>${p.service}</strong></td></tr>
      <tr><td style="color:#6b7280;font-size:0.85rem">👩‍⚕️ Profesional</td><td><strong>${p.professional || 'Sin asignar'}</strong></td></tr>
      <tr><td style="color:#6b7280;font-size:0.85rem">🐾 Mascota</td><td><strong>${p.guest_pet_name || '-'}</strong></td></tr>
      <tr><td style="color:#6b7280;font-size:0.85rem">👤 Tutor</td><td><strong>${p.guest_name || '-'}</strong></td></tr>
      <tr><td style="color:#6b7280;font-size:0.85rem">📱 Teléfono</td><td><strong>${p.guest_phone || '-'}</strong></td></tr>
      <tr><td style="color:#6b7280;font-size:0.85rem">📧 Email</td><td><strong>${p.guest_email || '-'}</strong></td></tr>
      <tr><td style="color:#6b7280;font-size:0.85rem">🌐 Origen</td><td><strong>${p.source || 'web'}</strong></td></tr>
    </table>
  </div>
</body>
</html>`;
}

// ── Send Email via Resend ──────────────────────────────────────
async function sendEmail(opts: {
  to: string;
  subject: string;
  html: string;
  from?: string;
}): Promise<{ ok: boolean; error?: string }> {
  if (!RESEND_API_KEY) {
    console.warn('[notify] RESEND_API_KEY not set, skipping email');
    return { ok: false, error: 'RESEND_API_KEY not configured' };
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: opts.from || 'SEVET Veterinaria <onboarding@resend.dev>',
      to: [opts.to],
      subject: opts.subject,
      html: opts.html,
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[notify] Resend error:', data);
    return { ok: false, error: JSON.stringify(data) };
  }
  return { ok: true };
}

// ── Send WhatsApp via Meta API ─────────────────────────────────
async function sendWhatsApp(opts: {
  phone: string;
  templateName: string;
  params: string[];
}): Promise<{ ok: boolean; error?: string }> {
  if (!META_WHATSAPP_TOKEN || !META_PHONE_ID) {
    console.warn('[notify] META credentials not set, skipping WhatsApp');
    return { ok: false, error: 'META credentials not configured' };
  }

  const rawPhone = cleanPhone(opts.phone);
  // Ensure Chilean format: starts with 56
  const phone = rawPhone.startsWith('56') ? rawPhone : `56${rawPhone}`;

  const res = await fetch(`https://graph.facebook.com/v20.0/${META_PHONE_ID}/messages`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${META_WHATSAPP_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      messaging_product: 'whatsapp',
      to: phone,
      type: 'template',
      template: {
        name: opts.templateName,
        language: { code: 'es_CL' },
        components: [{
          type: 'body',
          parameters: opts.params.map(text => ({ type: 'text', text })),
        }],
      },
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[notify] WhatsApp API error:', data);
    return { ok: false, error: JSON.stringify(data) };
  }
  return { ok: true };
}

// ── Log notification result ───────────────────────────────────
async function logNotification(
  // deno-lint-ignore no-explicit-any
  supabase: any,
  opts: { type: string; status: string; error?: string; meta?: Record<string, unknown> }
) {
  try {
    await supabase.from('notification_log').insert({
      notification_type: opts.type,
      status: opts.status,
      error_message: opts.error || null,
      meta: opts.meta || null,
    });
  } catch (e) {
    console.warn('[notify] Failed to log notification:', e);
  }
}

// ── Main Handler ───────────────────────────────────────────────
Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const eventType = payload.type || 'unknown';
    console.log(`[webhook-appointment] Event: ${eventType}`, JSON.stringify(payload));

    // ── Enrich payload from Supabase ─────────────────────────
    const p: Record<string, string> = { ...payload };

    if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

      // Lookup vet profile
      if (p.vet_id) {
        const { data: vetProfile } = await supabase
          .from('profiles')
          .select('full_name, phone, whatsapp, email')
          .eq('id', p.vet_id)
          .single();
        if (vetProfile) {
          p.vet_phone = vetProfile.whatsapp || vetProfile.phone || '';
          p.vet_name = vetProfile.full_name || p.professional || '';
          p.vet_email = vetProfile.email || '';
        }
      }

      // Lookup client email from JWT if missing
      if (!p.guest_email && req.headers.get('Authorization')) {
        try {
          const token = req.headers.get('Authorization')?.replace('Bearer ', '');
          if (token) {
            const { data: { user } } = await supabase.auth.getUser(token);
            if (user?.email) {
              p.guest_email = user.email;
              p.guest_name = p.guest_name || user.user_metadata?.full_name || '';
            }
          }
        } catch (_) {
          console.warn('[notify] Auth lookup failed');
        }
      }

      // Fallback: lookup by phone
      if (!p.guest_email && p.guest_phone) {
        const phone = p.guest_phone;
        const { data: phoneProfile } = await supabase
          .from('profiles')
          .select('email, full_name, whatsapp')
          .or(`phone.eq.${phone},whatsapp.eq.${phone},whatsapp.eq.+${phone}`)
          .limit(1)
          .single();
        if (phoneProfile?.email) {
          p.guest_email = phoneProfile.email;
          p.guest_name = p.guest_name || phoneProfile.full_name || '';
        }
      }

      p.receptionist_phone = RECEPTIONIST_PHONE;
      p.receptionist_name = RECEPTIONIST_NAME;
    }

    // ── Only send notifications for new appointments ──────────
    if (eventType !== 'new_appointment') {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'Not a new_appointment event' }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders },
      });
    }

    const results: Record<string, unknown> = {};
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // ── 1. Email confirmación al cliente ──────────────────────
    if (p.guest_email) {
      const emailResult = await sendEmail({
        to: p.guest_email,
        subject: `✅ Cita confirmada – ${p.service || 'Consulta'} · SEVET`,
        html: buildEmailHtml(p),
      });
      results.client_email = emailResult;
      await logNotification(supabase, {
        type: 'confirmation_email_client',
        status: emailResult.ok ? 'sent' : 'failed',
        error: emailResult.error,
        meta: { to: p.guest_email },
      });
    } else {
      results.client_email = { ok: false, error: 'No email provided' };
      console.warn('[notify] No client email — skipping client email');
    }

    // ── 2. Email aviso a recepción ────────────────────────────
    const receptionEmail = await sendEmail({
      to: CLINIC_EMAIL,
      subject: `🔔 Nueva cita: ${p.guest_pet_name || 'Mascota'} · ${p.date} ${p.time}`,
      html: buildReceptionistEmailHtml(p),
    });
    results.reception_email = receptionEmail;
    await logNotification(supabase, {
      type: 'confirmation_email_reception',
      status: receptionEmail.ok ? 'sent' : 'failed',
      error: receptionEmail.error,
      meta: { to: CLINIC_EMAIL },
    });

    // ── 3. WhatsApp confirmación al cliente ───────────────────
    const clientPhone = p.guest_phone || '';
    if (clientPhone) {
      const waResult = await sendWhatsApp({
        phone: clientPhone,
        templateName: WHATSAPP_TEMPLATE_NAME,
        params: [
          p.guest_name || 'Cliente',
          p.guest_pet_name || 'su mascota',
          p.service || 'la consulta',
          `${p.date} a las ${p.time}`,
        ],
      });
      results.client_whatsapp = waResult;
      await logNotification(supabase, {
        type: 'confirmation_whatsapp_client',
        status: waResult.ok ? 'sent' : 'failed',
        error: waResult.error,
        meta: { to: clientPhone },
      });
    } else {
      results.client_whatsapp = { ok: false, error: 'No phone provided' };
      console.warn('[notify] No client phone — skipping WhatsApp');
    }

    console.log('[webhook-appointment] Results:', JSON.stringify(results));

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
    });

  } catch (error) {
    console.error('[webhook-appointment] Critical error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...corsHeaders } }
    );
  }
});
