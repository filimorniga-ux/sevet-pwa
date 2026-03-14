-- SEVET - Fase 4
-- Habilita agendamiento real para invitados (sin cuenta).

BEGIN;

ALTER TABLE public.appointments
  ALTER COLUMN pet_id DROP NOT NULL;

ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS guest_name text,
  ADD COLUMN IF NOT EXISTS guest_phone text,
  ADD COLUMN IF NOT EXISTS guest_email text,
  ADD COLUMN IF NOT EXISTS guest_pet_name text;

ALTER TABLE public.appointments
  DROP CONSTRAINT IF EXISTS appointments_guest_contact_check;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_guest_contact_check
  CHECK (
    pet_id IS NOT NULL
    OR (
      btrim(COALESCE(guest_name, '')) <> ''
      AND btrim(COALESCE(guest_phone, '')) <> ''
      AND btrim(COALESCE(guest_pet_name, '')) <> ''
    )
  );

CREATE INDEX IF NOT EXISTS idx_appointments_guest_phone
  ON public.appointments(guest_phone);

CREATE INDEX IF NOT EXISTS idx_appointments_guest_email
  ON public.appointments(guest_email);

COMMIT;
