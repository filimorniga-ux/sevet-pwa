import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GOOGLE_CLIENT_ID = Deno.env.get('GOOGLE_CLIENT_ID')!;
const GOOGLE_CLIENT_SECRET = Deno.env.get('GOOGLE_CLIENT_SECRET')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── Refrescar access_token de Google ──────────────────────
async function refreshGoogleToken(refreshToken: string): Promise<string | null> {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }),
  });
  if (!res.ok) {
    console.error('[gcal] Token refresh error:', await res.text());
    return null;
  }
  const json = await res.json();
  return json.access_token ?? null;
}

// ── Crear/actualizar/eliminar evento en Google Calendar ───
async function syncEvent(
  accessToken: string,
  action: 'create' | 'update' | 'delete',
  event: Record<string, unknown>,
  gcalEventId?: string
): Promise<string | null> {
  const baseUrl = `https://www.googleapis.com/calendar/v3/calendars/primary/events`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
  };

  if (action === 'delete' && gcalEventId) {
    await fetch(`${baseUrl}/${gcalEventId}`, { method: 'DELETE', headers });
    return null;
  }

  if (action === 'update' && gcalEventId) {
    const res = await fetch(`${baseUrl}/${gcalEventId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(event),
    });
    const json = await res.json();
    return json.id ?? gcalEventId;
  }

  // create
  const res = await fetch(baseUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify(event),
  });
  const json = await res.json();
  return json.id ?? null;
}

// ── Construir objeto de evento Google Calendar ─────────────
function buildGcalEvent(appt: Record<string, unknown>, role: string) {
  const start = new Date(appt.date_time as string);
  const durationMin = (appt.duration_min as number) || 30;
  const end = new Date(start.getTime() + durationMin * 60 * 1000);

  const petName = (appt.guest_pet_name as string) || (appt.pets as Record<string, unknown>)?.name as string || 'Mascota';
  const service = (appt.service_type as string) || 'Cita Veterinaria';
  const status = appt.status as string;

  const roleEmoji: Record<string, string> = {
    client: '🐾', vet: '🩺', owner: '🏥', admin: '📋', receptionist: '📋', groomer: '✂️'
  };

  const title = `${roleEmoji[role] || '🐾'} SEVET: ${service} — ${petName}`;
  const description = [
    `Mascota: ${petName}`,
    `Servicio: ${service}`,
    `Estado: ${status}`,
    appt.notes ? `Notas: ${appt.notes}` : '',
    '',
    'Gestionado en SEVET Pet-Tech 360 · sevet-pwa.vercel.app',
  ].filter(Boolean).join('\n');

  return {
    summary: title,
    description,
    start: { dateTime: start.toISOString(), timeZone: 'America/Santiago' },
    end:   { dateTime: end.toISOString(),   timeZone: 'America/Santiago' },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup',  minutes: 60  },
        { method: 'popup',  minutes: 15  },
        { method: 'email',  minutes: 1440 }, // 24h antes
      ],
    },
    source: {
      title: 'SEVET Pet-Tech 360',
      url:   'https://sevet-pwa.vercel.app',
    },
  };
}

// ── Handler principal ─────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, content-type',
      },
    });
  }

  try {
    const { appointment_id, user_ids, action = 'create' } = await req.json() as {
      appointment_id: string;
      user_ids: string[];
      action?: 'create' | 'update' | 'delete';
    };

    if (!appointment_id || !user_ids?.length) {
      return new Response(JSON.stringify({ error: 'appointment_id y user_ids son requeridos' }), { status: 400 });
    }

    // Cargar la cita
    const { data: appt, error: apptErr } = await supabase
      .from('appointments')
      .select('*, pets(name, species), services(name, duration_min)')
      .eq('id', appointment_id)
      .single();

    if (apptErr || !appt) {
      return new Response(JSON.stringify({ error: 'Cita no encontrada' }), { status: 404 });
    }

    if (appt.services?.duration_min) appt.duration_min = appt.services.duration_min;
    if (appt.services?.name)        appt.service_type  = appt.services.name;

    const results: Record<string, string> = {};

    // Sincronizar para cada usuario
    for (const userId of user_ids) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('google_refresh_token, gcal_enabled, role, google_gcal_event_ids')
        .eq('user_id', userId)
        .single();

      if (!profile?.gcal_enabled || !profile?.google_refresh_token) {
        results[userId] = 'skipped (gcal not enabled)';
        continue;
      }

      const accessToken = await refreshGoogleToken(profile.google_refresh_token);
      if (!accessToken) {
        results[userId] = 'error (token refresh failed)';
        continue;
      }

      const gcalEvent = buildGcalEvent(appt, profile.role);
      const existingIds = (profile.google_gcal_event_ids as Record<string, string>) || {};
      const existingId = existingIds[appointment_id];

      const newEventId = await syncEvent(accessToken, action, gcalEvent, existingId);

      // Guardar el event ID para futuras actualizaciones/eliminaciones
      if (newEventId && action !== 'delete') {
        await supabase.from('profiles').update({
          google_gcal_event_ids: { ...existingIds, [appointment_id]: newEventId },
        }).eq('user_id', userId);
      } else if (action === 'delete') {
        const updatedIds = { ...existingIds };
        delete updatedIds[appointment_id];
        await supabase.from('profiles').update({
          google_gcal_event_ids: updatedIds,
        }).eq('user_id', userId);
      }

      results[userId] = action === 'delete' ? 'deleted' : `synced:${newEventId}`;
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });

  } catch (err) {
    console.error('[sync-to-gcal]', err);
    return new Response(JSON.stringify({ error: String(err) }), { status: 500 });
  }
});
