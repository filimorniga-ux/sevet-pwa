-- FASE 2: AUDITORIA BASE DE DATOS - CORRECCIONES

-- 1. Añadir columnas created_at y updated_at si faltan en las tablas usando ALTER TABLE
ALTER TABLE public.clinic_settings ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.clinic_settings ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.automation_rules ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.wa_contacts ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.wa_contacts ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.wa_conversations ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.wa_conversations ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

ALTER TABLE public.wa_messages ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now();
ALTER TABLE public.wa_messages ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 2. Asegurar RLS en clinic_settings (legible auth, escribible owner/admin)
ALTER TABLE public.clinic_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "clinic_settings_select" ON public.clinic_settings;
CREATE POLICY "clinic_settings_select" ON public.clinic_settings
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "clinic_settings_insert" ON public.clinic_settings;
CREATE POLICY "clinic_settings_insert" ON public.clinic_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "clinic_settings_update" ON public.clinic_settings;
CREATE POLICY "clinic_settings_update" ON public.clinic_settings
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

DROP POLICY IF EXISTS "clinic_settings_delete" ON public.clinic_settings;
CREATE POLICY "clinic_settings_delete" ON public.clinic_settings
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('admin', 'owner')
    )
  );

-- 3. Crear índices para performance
CREATE INDEX IF NOT EXISTS idx_appointments_date_time ON public.appointments(date_time);
CREATE INDEX IF NOT EXISTS idx_appointments_vet_id ON public.appointments(vet_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON public.appointments(status);
CREATE INDEX IF NOT EXISTS idx_wa_messages_conversation_id ON public.wa_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_wa_conversations_wa_contact_id ON public.wa_conversations(wa_contact_id);
CREATE INDEX IF NOT EXISTS idx_automation_rules_active_priority ON public.automation_rules(is_active, priority);
