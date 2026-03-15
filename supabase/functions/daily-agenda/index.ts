import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/**
 * Edge Function: daily-agenda
 *
 * Envía a cada profesional su agenda diaria por WhatsApp
 * usando la plantilla 'agenda_diaria_vet'.
 * Invocada por pg_cron a las 7:00 AM hora Santiago.
 */

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const META_ACCESS_TOKEN = Deno.env.get('META_ACCESS_TOKEN') || '';
const PHONE_NUMBER_ID = Deno.env.get('PHONE_NUMBER_ID') || '1006914325847395';
const GRAPH_API_VERSION = 'v22.0';

interface VetAgenda {
  vet_id: string;
  vet_name: string;
  vet_phone: string;
  appointments: AppointmentSummary[];
}

interface AppointmentSummary {
  id: string;
  time: string;
  service: string;
  client: string;
  pet: string;
}

async function sendWhatsAppTemplate(
  to: string,
  templateName: string,
  parameters: string[]
): Promise<{ success: boolean; message_id?: string; error?: string }> {
  const url = `https://graph.facebook.com/${GRAPH_API_VERSION}/${PHONE_NUMBER_ID}/messages`;
  const cleanPhone = to.replace(/[^\d]/g, '');

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

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000);

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

    const responseText = await res.text();
    clearTimeout(timeoutId);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (_e) {
      return { success: false, error: `Invalid JSON response: ${responseText.substring(0, 100)}` };
    }

    if (data.messages?.[0]) {
      return { success: true, message_id: data.messages[0].id };
    }
    return { success: false, error: data.error?.message || JSON.stringify(data) };
  } catch (err) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      return { success: false, error: 'Request to WhatsApp API timed out' };
    }
    return { success: false, error: String(err) };
  }
}

function getTodayRange(): { start: string; end: string; dateLabel: string } {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    year: 'numeric', month: '2-digit', day: '2-digit',
    timeZoneName: 'longOffset'
  });
  const parts = formatter.formatToParts(now);
  const year = parts.find(p => p.type === 'year')!.value;
  const month = parts.find(p => p.type === 'month')!.value;
  const day = parts.find(p => p.type === 'day')!.value;
  const offsetStr = parts.find(p => p.type === 'timeZoneName')?.value.replace('GMT', '') || '-03:00';

  const start = `${year}-${month}-${day}T00:00:00${offsetStr}`;
  const end = `${year}-${month}-${day}T23:59:59${offsetStr}`;

  const labelFormatter = new Intl.DateTimeFormat('es-CL', {
    timeZone: 'America/Santiago',
    weekday: 'long', day: 'numeric', month: 'long'
  });
  const dateLabel = labelFormatter.format(now);

  return { start, end, dateLabel };
}

function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('es-CL', {
    hour: '2-digit', minute: '2-digit', hour12: false,
    timeZone: 'America/Santiago'
  });
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
  const { start, end, dateLabel } = getTodayRange();
  const results: Array<{ vet: string; status: string; appointments: number; error?: string }> = [];

  try {
    // Obtener todas las citas de hoy que no estén canceladas
    const { data: todayAppointments, error: aptErr } = await supabase
      .from('appointments')
      .select(`
        id, date_time, service_type, status,
        guest_name, guest_pet_name,
        vet_id,
        vet_profile:profiles!appointments_vet_id_fkey(id, full_name, phone, whatsapp),
        service:services!appointments_service_id_fkey(name)
      `)
      .gte('date_time', start)
      .lte('date_time', end)
      .neq('status', 'cancelada')
      .order('date_time', { ascending: true });

    if (aptErr) {
      console.error('[daily-agenda] Error fetching appointments:', aptErr);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch appointments', details: aptErr.message }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    if (!todayAppointments || todayAppointments.length === 0) {
      console.log('[daily-agenda] No appointments today');
      return new Response(
        JSON.stringify({ checked_at: new Date().toISOString(), date: dateLabel, total_appointments: 0, vets_notified: 0 }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Agrupar citas por profesional
    const vetAgendas = new Map<string, VetAgenda>();

    for (const apt of todayAppointments) {
      if (!apt.vet_id || !apt.vet_profile) continue;

      const vetProfile = apt.vet_profile as { id: string; full_name: string; phone: string | null; whatsapp: string | null };
      const vetPhone = vetProfile.whatsapp || vetProfile.phone;
      if (!vetPhone) continue;

      if (!vetAgendas.has(apt.vet_id)) {
        vetAgendas.set(apt.vet_id, {
          vet_id: apt.vet_id,
          vet_name: vetProfile.full_name || 'Profesional',
          vet_phone: vetPhone,
          appointments: []
        });
      }

      const agenda = vetAgendas.get(apt.vet_id)!;
      const serviceName = (apt.service as { name: string } | null)?.name || apt.service_type || 'Consulta';
      const clientName = apt.guest_name || 'Cliente';
      const petName = apt.guest_pet_name || '';

      agenda.appointments.push({
        id: apt.id,
        time: formatTime(apt.date_time),
        service: serviceName,
        client: clientName,
        pet: petName
      });
    }

    // Enviar agenda a cada profesional
    for (const [vetId, agenda] of vetAgendas) {
      try {
        if (agenda.appointments.length === 0) continue;

        // PREVENT RACE CONDITION: Intentar leer si ya existe el log de este día para el vet.
        const { data: existing } = await supabase
          .from('notification_log')
          .select('id, status')
          .eq('notification_type', 'daily_agenda')
          .eq('recipient_phone', agenda.vet_phone)
          .gte('created_at', start)
          .neq('status', 'failed')
          .limit(1);

        if (existing && existing.length > 0 && existing[0].status === 'sent') {
          results.push({ vet: agenda.vet_name, status: 'skipped', appointments: agenda.appointments.length });
          continue;
        }

        // Inserción optimista para reservar el spot. Como pg no bloquea race con select
        // Si hay unique keys en la db saltará, si no se mitigará la mayoria.
        // Restituimos las columnas eliminadas del logging!
        const { data: insertData, error: insertSentError } = await supabase
          .from('notification_log')
          .insert({
            notification_type: 'daily_agenda',
            channel: 'whatsapp',
            recipient_phone: agenda.vet_phone,
            recipient_name: agenda.vet_name,
            status: 'sent' // Optimistically mark as sent to claim it
          })
          .select('id')
          .single();

        if (insertSentError) {
          if (insertSentError.code === '23505') { // Unique violation
            results.push({ vet: agenda.vet_name, status: 'skipped', appointments: agenda.appointments.length });
            continue;
          }
          console.error(`[daily-agenda] Error inserting log for ${agenda.vet_name}:`, insertSentError);
          continue;
        }

        const logId = insertData.id;

        // Construir resumen de citas
        const summary = agenda.appointments
          .map(a => `${a.time} ${a.service} - ${a.client}${a.pet ? ` (${a.pet})` : ''}`)
          .join('\n');

        // Enviar plantilla: agenda_diaria_vet
        // Variables: 1=nombre_vet, 2=fecha_hoy, 3=cantidad_citas, 4=resumen_citas
        const result = await sendWhatsAppTemplate(
          agenda.vet_phone,
          'agenda_diaria_vet',
          [
            agenda.vet_name,
            dateLabel,
            String(agenda.appointments.length),
            summary
          ]
        );

        if (!result.success) {
          // Update the log status to failed
          await supabase
            .from('notification_log')
            .update({
              status: 'failed',
              error_message: result.error || 'Unknown error'
            })
            .eq('id', logId);
        } else {
          // Guardar el meta_message_id
          await supabase
            .from('notification_log')
            .update({
              meta_message_id: result.message_id || null
            })
            .eq('id', logId);
        }

        results.push({
          vet: agenda.vet_name,
          status: result.success ? 'sent' : 'failed',
          appointments: agenda.appointments.length,
          error: result.error
        });
      } catch (vetError) {
        console.error(`[daily-agenda] Error processing vet ${agenda.vet_name}:`, vetError);
        results.push({
          vet: agenda.vet_name,
          status: 'failed',
          appointments: agenda.appointments.length,
          error: String(vetError)
        });
      }
    }

    const response = {
      checked_at: new Date().toISOString(),
      date: dateLabel,
      total_appointments: todayAppointments.length,
      vets_notified: results.filter(r => r.status === 'sent').length,
      vets_skipped: results.filter(r => r.status === 'skipped').length,
      details: results
    };

    console.log('[daily-agenda] Summary:', JSON.stringify(response));

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Connection': 'keep-alive' }
    });

  } catch (error) {
    console.error('[daily-agenda] Fatal error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
