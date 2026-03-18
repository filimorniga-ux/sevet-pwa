import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";
import { addHours, addMinutes } from "https://esm.sh/date-fns@3.3.1";
import { formatInTimeZone } from "https://esm.sh/date-fns-tz@3.0.0";

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const META_WHATSAPP_TOKEN = Deno.env.get('META_ACCESS_TOKEN') || Deno.env.get('META_WHATSAPP_TOKEN') || '';
const META_PHONE_ID = Deno.env.get('META_PHONE_ID') || '';
const TIMEZONE = 'America/Santiago';

serve(async (req) => {
  try {
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Get current time in UTC
    const nowUtc = new Date();

    // Calculate windows for 24h (23h to 25h) and 1h (30m to 90m) in absolute UTC time
    // The query will compare UTC to UTC in the database, avoiding timezone shifts
    const window24hStart = addHours(nowUtc, 23);
    const window24hEnd = addHours(nowUtc, 25);

    const window1hStart = addMinutes(nowUtc, 30);
    const window1hEnd = addMinutes(nowUtc, 90);

    // Fetch appointments within these absolute time windows
    const { data: appointments, error: appointmentsError } = await supabase
      .from('appointments')
      .select(`
        id,
        date_time,
        status,
        service_type,
        pet_id,
        pets (
          name,
          owner_id,
          profiles (
            full_name,
            phone,
            whatsapp
          )
        )
      `)
      .in('status', ['pendiente', 'confirmada'])
      .or(`and(date_time.gte.${window24hStart.toISOString()},date_time.lte.${window24hEnd.toISOString()}),and(date_time.gte.${window1hStart.toISOString()},date_time.lte.${window1hEnd.toISOString()})`);

    if (appointmentsError) throw appointmentsError;

    const results = [];

    for (const appt of appointments || []) {
      const apptTimeUtc = new Date(appt.date_time);

      let reminderType = '';
      if (apptTimeUtc >= window24hStart && apptTimeUtc <= window24hEnd) {
        reminderType = 'recordatorio_cita_24h';
      } else if (apptTimeUtc >= window1hStart && apptTimeUtc <= window1hEnd) {
        reminderType = 'recordatorio_cita_1h';
      } else {
        continue;
      }

      const owner = appt.pets?.profiles;
      if (!owner) continue;

      const phone = owner.whatsapp || owner.phone;
      if (!phone) continue;

      // Clean phone number (remove +, spaces, hyphens)
      const cleanPhone = phone.replace(/[\s\-\+]/g, '');

      try {
        // PREVENT RACE CONDITION: Insert optimistic log entry first.
        // If it already exists and is 'sent', the unique constraint will fail,
        // which means another process has already handled this notification.
        const { data: insertData, error: insertSentError } = await supabase
            .from('notification_log')
            .insert({
                appointment_id: appt.id,
                notification_type: reminderType,
                status: 'sent' // Optimistically mark as sent to claim it
            })
            .select('id')
            .single();

        if (insertSentError) {
            if (insertSentError.code === '23505') { // Unique violation
                // Already sent by another process, skip
                continue;
            } else {
                throw insertSentError;
            }
        }

        const logId = insertData.id;

        try {
            // Send WhatsApp template
            // Format time correctly in America/Santiago timezone for the WhatsApp message
            const formattedTime = formatInTimeZone(apptTimeUtc, TIMEZONE, 'dd/MM/yyyy HH:mm');

            const waResponse = await fetch(`https://graph.facebook.com/v18.0/${META_PHONE_ID}/messages`, {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${META_WHATSAPP_TOKEN}`,
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({
                messaging_product: "whatsapp",
                to: cleanPhone,
                type: "template",
                template: {
                  name: reminderType,
                  language: {
                    code: "es_CL"
                  },
                  components: [
                    {
                      type: "body",
                      parameters: [
                        { type: "text", text: owner.full_name || 'Cliente' },
                        { type: "text", text: appt.pets?.name || 'su mascota' },
                        { type: "text", text: formattedTime }
                      ]
                    }
                  ]
                }
              })
            });

            if (!waResponse.ok) {
              const errorData = await waResponse.text();
              throw new Error(`WhatsApp API Error: ${waResponse.status} ${errorData}`);
            }

            results.push({ id: appt.id, type: reminderType, status: 'success' });

        } catch (waError) {
             console.error(`Error sending ${reminderType} to ${cleanPhone}:`, waError);

             // If WhatsApp sending failed, update the log status to failed
             await supabase
                .from('notification_log')
                .update({
                    status: 'failed',
                    error_message: waError instanceof Error ? waError.message : String(waError)
                })
                .eq('id', logId);

             results.push({ id: appt.id, type: reminderType, status: 'failed', error: waError instanceof Error ? waError.message : String(waError) });
        }

      } catch (error) {
        console.error(`Error processing appointment ${appt.id}:`, error);
      }
    }

    return new Response(JSON.stringify({ success: true, processed: results }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Critical error in check-reminders:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
