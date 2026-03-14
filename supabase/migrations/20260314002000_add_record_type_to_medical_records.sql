-- SEVET - Fase 3
-- Agrega tipificación explícita a fichas SOAP para filtros y reportería.

BEGIN;

ALTER TABLE public.medical_records
  ADD COLUMN IF NOT EXISTS record_type text;

UPDATE public.medical_records mr
SET record_type = COALESCE(a.service_type, 'consulta')
FROM public.appointments a
WHERE mr.appointment_id = a.id
  AND (mr.record_type IS NULL OR btrim(mr.record_type) = '');

UPDATE public.medical_records
SET record_type = 'consulta'
WHERE record_type IS NULL OR btrim(record_type) = '';

ALTER TABLE public.medical_records
  ALTER COLUMN record_type SET DEFAULT 'consulta',
  ALTER COLUMN record_type SET NOT NULL;

ALTER TABLE public.medical_records
  DROP CONSTRAINT IF EXISTS medical_records_record_type_check;

ALTER TABLE public.medical_records
  ADD CONSTRAINT medical_records_record_type_check
  CHECK (record_type IN (
    'consulta',
    'vacuna',
    'vacunacion',
    'urgencia',
    'cirugia',
    'control',
    'peluqueria',
    'guarderia'
  ));

CREATE INDEX IF NOT EXISTS idx_medical_records_record_type
  ON public.medical_records(record_type);

COMMIT;
