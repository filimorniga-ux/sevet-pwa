CREATE TABLE IF NOT EXISTS public.notification_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
    notification_type TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'sent',
    sent_at TIMESTAMPTZ DEFAULT now(),
    error_message TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_notification_log_appointment_type
ON public.notification_log (appointment_id, notification_type)
WHERE status = 'sent';
