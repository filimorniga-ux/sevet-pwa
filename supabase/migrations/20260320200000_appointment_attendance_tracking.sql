-- =========================================
-- SEVET – Tracking de Asistencia de Citas
-- Migración: 20260320200000
-- Skills activos: timezone-santiago, supabase-postgres-best-practices
-- =========================================

-- 1. Ampliar el CHECK de status para incluir 'no_show'
ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_status_check;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_status_check
    CHECK (status IN (
      'pendiente',
      'confirmada',
      'en_curso',
      'completada',
      'cancelada',
      'no_show'        -- Cliente no se presentó
    ));

-- 2. Campos de tiempo de atención (todos en UTC, se muestran en America/Santiago en UI)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS check_in_at         TIMESTAMPTZ,  -- Hora en que el cliente llegó a la clínica
  ADD COLUMN IF NOT EXISTS consultation_start_at TIMESTAMPTZ, -- Hora en que el vet comenzó la atención
  ADD COLUMN IF NOT EXISTS consultation_end_at   TIMESTAMPTZ; -- Hora en que terminó la consulta

-- 3. Campos de incidencias de puntualidad
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS was_client_late      BOOLEAN DEFAULT false, -- ¿Llegó tarde el cliente?
  ADD COLUMN IF NOT EXISTS client_delay_minutes INTEGER,               -- Cuántos minutos de retraso
  ADD COLUMN IF NOT EXISTS late_reason          TEXT;                  -- Motivo (si el cliente lo indicó)

-- 4. Campos de reagendamiento
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS rescheduled_from     UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS reschedule_reason    TEXT CHECK (reschedule_reason IN (
    'cliente_tarde',      -- El cliente llegó tarde y no alcanzó
    'no_show',            -- No se presentó
    'cancelacion_cliente',-- Lo canceló el cliente
    'emergencia_clinica', -- La clínica tuvo una emergencia
    'vet_ausente',        -- El veterinario no estaba disponible
    'otro'                -- Otro motivo
  ));

-- 5. Quién registró el check-in (para auditoría RBAC)
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS checked_in_by UUID REFERENCES public.profiles(id);

-- 6. Índices de rendimiento para consultas frecuentes
-- (skill: supabase-postgres-best-practices → query-missing-indexes)
CREATE INDEX IF NOT EXISTS idx_appointments_check_in
  ON public.appointments(check_in_at)
  WHERE check_in_at IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_no_show
  ON public.appointments(status)
  WHERE status = 'no_show';

CREATE INDEX IF NOT EXISTS idx_appointments_rescheduled
  ON public.appointments(rescheduled_from)
  WHERE rescheduled_from IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_late_clients
  ON public.appointments(was_client_late)
  WHERE was_client_late = true;

CREATE INDEX IF NOT EXISTS idx_appointments_vet_date
  ON public.appointments(vet_id, date_time DESC);

-- 7. Vista útil para reportes de asistencia (con cálculos en America/Santiago)
-- skill: timezone-santiago → almacenamiento en UTC, conversión solo en display/queries
CREATE OR REPLACE VIEW public.appointment_attendance_report AS
SELECT
  a.id,
  a.date_time,
  a.date_time AT TIME ZONE 'America/Santiago' AS date_time_cl,
  a.status,
  a.check_in_at AT TIME ZONE 'America/Santiago'            AS check_in_cl,
  a.consultation_start_at AT TIME ZONE 'America/Santiago'  AS consultation_start_cl,
  a.consultation_end_at AT TIME ZONE 'America/Santiago'    AS consultation_end_cl,

  -- Minutos de espera del cliente (desde llegada hasta inicio de consulta)
  CASE
    WHEN a.check_in_at IS NOT NULL AND a.consultation_start_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (a.consultation_start_at - a.check_in_at)) / 60
    ELSE NULL
  END AS wait_time_minutes,

  -- Duración de la consulta en minutos
  CASE
    WHEN a.consultation_start_at IS NOT NULL AND a.consultation_end_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (a.consultation_end_at - a.consultation_start_at)) / 60
    ELSE NULL
  END AS consultation_duration_minutes,

  -- Retraso del cliente vs hora programada
  CASE
    WHEN a.check_in_at IS NOT NULL
    THEN EXTRACT(EPOCH FROM (a.check_in_at - a.date_time)) / 60
    ELSE NULL
  END AS arrival_delay_minutes,

  a.was_client_late,
  a.client_delay_minutes,
  a.late_reason,
  a.reschedule_reason,
  a.rescheduled_from,

  -- Datos relacionados
  p.name AS pet_name,
  p.species,
  pr_vet.full_name AS vet_name,
  pr_owner.full_name AS owner_name

FROM public.appointments a
LEFT JOIN public.pets p ON p.id = a.pet_id
LEFT JOIN public.profiles pr_vet ON pr_vet.id = a.vet_id
LEFT JOIN public.pets pet2 ON pet2.id = a.pet_id
LEFT JOIN public.profiles pr_owner ON pr_owner.id = pet2.owner_id;

-- 8. Comentarios de columnas (documentación en DB)
COMMENT ON COLUMN public.appointments.check_in_at
  IS 'Timestamp UTC en que el cliente hizo check-in físico en la clínica';
COMMENT ON COLUMN public.appointments.consultation_start_at
  IS 'Timestamp UTC en que el veterinario inició la atención';
COMMENT ON COLUMN public.appointments.consultation_end_at
  IS 'Timestamp UTC en que concluyó la consulta';
COMMENT ON COLUMN public.appointments.was_client_late
  IS 'true si el cliente llegó después de la hora programada (por su culpa)';
COMMENT ON COLUMN public.appointments.rescheduled_from
  IS 'UUID de la cita original si esta cita es una reagendación';
