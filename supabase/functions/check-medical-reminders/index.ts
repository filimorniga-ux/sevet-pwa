import "@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "@supabase/supabase-js";

/**
 * Edge Function: check-medical-reminders
 *
 * Revisa vacunas próximas a vencer (14 días) y controles médicos
 * pendientes (7 días), y envía recordatorios por WhatsApp.
 *
 * Invocada por pg_cron diariamente a las 9:00 AM Santiago.
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const META_ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN') || '';
const PHONE_NUMBER_ID = Deno.env.get('PHONE_NUMBER_ID') || '1006914325847395';
const GRAPH_API_VERSION = 'v22.0';

async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  parameters: string[]
): Promise<{ success: boolean; message_id?: string; error?: string }> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}/messages`;
  const cleanPhone = to.replace(/[^\d]/g, '');

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

  const body = {
    messaging_product: 'whatsapp',
    to: cleanPhone,
    type: 'template',
    template: {
      name: templateName,
      language: { code: 'es_CL' },
      components: parameters.length > 0
        ? [{ type: 'body', parameters: parameters.map(p => ({ type: 'text', text: p })) }]
        : []
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body),
      signal: controller.signal
    });

    const rawText = await res.text();
    clearTimeout(timeoutId);

    let data;
    try {
      data = JSON.parse(rawText);
    } catch {
      return { success: false, error: `Non-JSON response: ${rawText.substring(0, 200)}` };
    }

    if (data.messages?.[0]) {
      return { success: true, message_id: data.messages[0].id };
    }
    return { success: false, error: data.error?.message || rawText.substring(0, 200) };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof DOMException && err.name === 'AbortError') {
      return { success: false, error: 'Request timed out after 10s' };
    }
    return { success: false, error: String(err) };
  }
}

function getTodayAndFutureDates(): {
  todayStr: string;
  in7days: string;
  in14days: string;
} {
  const now = new Date();

  const formatter = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric', month: '2-digit', day: '2-digit'
  });

  const parts = formatter.formatToParts(now);
  const year = parseInt(parts.find(p => p.type === 'year')!.value);
  const month = parseInt(parts.find(p => p.type === 'month')!.value);
  const day = parseInt(parts.find(p => p.type === 'day')!.value);

  const todayStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Build a local date representing Santiago's midnight to accurately compute +7/+14 days locally
  const localToday = new Date(year, month - 1, day);

  const d7 = new Date(localToday);
  d7.setDate(d7.getDate() + 7);
  const d14 = new Date(localToday);
  d14.setDate(d14.getDate() + 14);

  const in7days = `${d7.getFullYear()}-${String(d7.getMonth() + 1).padStart(2, '0')}-${String(d7.getDate()).padStart(2, '0')}`;
  const in14days = `${d14.getFullYear()}-${String(d14.getMonth() + 1).padStart(2, '0')}-${String(d14.getDate()).padStart(2, '0')}`;

  return { todayStr, in7days, in14days };
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('es-CL', {
    weekday: 'long', day: 'numeric', month: 'long',
    timeZone: 'America/Santiago'
  });
}

interface ReminderResult {
  type: 'vaccine' | 'control';
  pet: string;
  owner: string;
  status: 'sent' | 'failed' | 'skipped';
  error?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    });
  }

  if (!META_ACCESS_TOKEN) {
    return new Response(
      JSON.stringify({ error: 'META_ACCESS_TOKEN not configured' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { todayStr, in7days, in14days } = getTodayAndFutureDates();
  const results: ReminderResult[] = [];

  try {
    // ────── RECORDATORIO DE VACUNAS ──────
    // Buscar vacunas cuyo next_due_date esté entre hoy y 14 días
    const { data: upcomingVaccines, error: vaccErr } = await supabase
      .from('vaccinations')
      .select(`
        id, vaccine_name, next_due_date,
        pet:pets!inner(
          id, name,
          owner:profiles!inner(full_name, phone, whatsapp)
        )
      `)
      .gte('next_due_date', todayStr)
      .lte('next_due_date', in14days);

    if (vaccErr) {
      console.error('[check-medical-reminders] Error fetching vaccines:', vaccErr);
    }

    for (const vacc of (upcomingVaccines || [])) {
      try {
        const pet = vacc.pet as unknown as {
          id: string; name: string;
          owner: { full_name: string; phone: string | null; whatsapp: string | null } | null;
        } | null;
        if (!pet?.owner) continue;

        const ownerPhone = pet.owner.whatsapp || pet.owner.phone;
        if (!ownerPhone) continue;

        const ownerName = pet.owner.full_name || 'Cliente';
        const petName = pet.name || 'Mascota';
        const vaccineName = vacc.vaccine_name || 'Vacuna';
        const dueDate = formatDate(vacc.next_due_date);

        // Insert optimista
        // Deduplicación basada en restricción de unicidad en BD
        const { data: logEntry, error: insertErr } = await supabase
          .from('notification_log')
          .insert({
            notification_type: 'reminder_vaccine',
            channel: 'whatsapp',
            recipient_phone: ownerPhone,
            recipient_name: ownerName,
            status: 'sent'
          })
          .select('id')
          .single();

        if (insertErr) {
          if (insertErr.code === '23505') {
            results.push({ type: 'vaccine', pet: petName, owner: ownerName, status: 'skipped' });
            continue;
          }
          console.error(`[check-medical-reminders] Insert error for ${ownerName}:`, insertErr);
          continue;
        }

        // Enviar plantilla: recordatorio_vacuna
        // Variables: 1=nombre_dueño, 2=nombre_vacuna, 3=nombre_mascota, 4=fecha_vencimiento
        const result = await sendWhatsAppTemplate(
          ownerPhone,
          'recordatorio_vacuna',
          [ownerName, vaccineName, petName, dueDate]
        );

        if (!result.success) {
          await supabase
            .from('notification_log')
            .update({ status: 'failed', error_message: result.error })
            .eq('id', logEntry.id);
        } else {
          await supabase
            .from('notification_log')
            .update({ meta_message_id: result.message_id })
            .eq('id', logEntry.id);
        }

        results.push({
          type: 'vaccine',
          pet: petName,
          owner: ownerName,
          status: result.success ? 'sent' : 'failed',
          error: result.error
        });
      } catch (err) {
        console.error('[check-medical-reminders] Error processing vaccine:', err);
        results.push({ type: 'vaccine', pet: 'unknown', owner: 'unknown', status: 'failed', error: String(err) });
      }
    }

    // ────── RECORDATORIO DE CONTROLES ──────
    // Buscar appointments de tipo 'control' en los próximos 7 días
    const { data: upcomingControls, error: ctrlErr } = await supabase
      .from('appointments')
      .select(`
        id, date_time, service_type,
        guest_name, guest_phone, guest_pet_name,
        service:services!inner(name)
      `)
      .eq('service_type', 'control')
      .in('status', ['pendiente', 'confirmada'])
      .gte('date_time', todayStr + 'T00:00:00')
      .lte('date_time', in7days + 'T23:59:59');

    if (ctrlErr) {
      console.error('[check-medical-reminders] Error fetching controls:', ctrlErr);
    }

    for (const ctrl of (upcomingControls || [])) {
      try {
        const phone = ctrl.guest_phone;
        if (!phone) continue;

        const clientName = ctrl.guest_name || 'Cliente';
        const petName = ctrl.guest_pet_name || 'Mascota';
        const serviceName = (ctrl.service as unknown as { name: string } | null)?.name || 'Control';
        const controlDate = new Date(ctrl.date_time).toLocaleDateString('es-CL', {
          weekday: 'long', day: 'numeric', month: 'long',
          timeZone: 'America/Santiago'
        });

        // Insert optimista
        // Deduplicación basada en restricción de unicidad en BD
        const { data: logEntry, error: insertErr } = await supabase
          .from('notification_log')
          .insert({
            appointment_id: ctrl.id,
            notification_type: 'reminder_control',
            channel: 'whatsapp',
            recipient_phone: phone,
            recipient_name: clientName,
            status: 'sent'
          })
          .select('id')
          .single();

        if (insertErr) {
          if (insertErr.code === '23505') {
            results.push({ type: 'control', pet: petName, owner: clientName, status: 'skipped' });
            continue;
          }
          console.error(`[check-medical-reminders] Insert error for ${clientName}:`, insertErr);
          continue;
        }

        // Enviar plantilla: recordatorio_control
        // Variables: 1=nombre_dueño, 2=nombre_mascota, 3=tipo_control, 4=fecha_control
        const result = await sendWhatsAppTemplate(
          phone,
          'recordatorio_control',
          [clientName, petName, serviceName, controlDate]
        );

        if (!result.success) {
          await supabase
            .from('notification_log')
            .update({ status: 'failed', error_message: result.error })
            .eq('id', logEntry.id);
        } else {
          await supabase
            .from('notification_log')
            .update({ meta_message_id: result.message_id })
            .eq('id', logEntry.id);
        }

        results.push({
          type: 'control',
          pet: petName,
          owner: clientName,
          status: result.success ? 'sent' : 'failed',
          error: result.error
        });
      } catch (err) {
        console.error('[check-medical-reminders] Error processing control:', err);
        results.push({ type: 'control', pet: 'unknown', owner: 'unknown', status: 'failed', error: String(err) });
      }
    }

    const response = {
      checked_at: new Date().toISOString(),
      vaccines: {
        found: (upcomingVaccines || []).length,
        sent: results.filter(r => r.type === 'vaccine' && r.status === 'sent').length,
        skipped: results.filter(r => r.type === 'vaccine' && r.status === 'skipped').length,
        failed: results.filter(r => r.type === 'vaccine' && r.status === 'failed').length
      },
      controls: {
        found: (upcomingControls || []).length,
        sent: results.filter(r => r.type === 'control' && r.status === 'sent').length,
        skipped: results.filter(r => r.type === 'control' && r.status === 'skipped').length,
        failed: results.filter(r => r.type === 'control' && r.status === 'failed').length
      },
      details: results
    };

    console.log('[check-medical-reminders] Summary:', JSON.stringify(response));

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' }
    });

  } catch (error) {
    console.error('[check-medical-reminders] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
