-- =========================================
-- SEVET – Módulo de Contabilidad
-- Tabla: billing_records
-- Skill activos: financial-precision-math, rbac-pin-security, timezone-santiago
-- =========================================

-- ── Tabla principal de cobros ──
CREATE TABLE IF NOT EXISTS public.billing_records (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Relaciones
  appointment_id   UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  client_profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  pet_id           UUID REFERENCES public.pets(id) ON DELETE SET NULL,

  -- Datos del servicio (desnormalizado para histórico estable)
  service_name     TEXT NOT NULL,

  -- Montos en CLP como INTEGER (skill: financial-precision-math → NUNCA FLOAT)
  amount_clp       INTEGER NOT NULL CHECK (amount_clp >= 0),
  discount_clp     INTEGER NOT NULL DEFAULT 0 CHECK (discount_clp >= 0),
  total_clp        INTEGER GENERATED ALWAYS AS (amount_clp - discount_clp) STORED,

  -- Pago
  payment_method   TEXT NOT NULL DEFAULT 'pendiente'
                   CHECK (payment_method IN ('efectivo','tarjeta','transferencia','pendiente','cortesia')),
  payment_status   TEXT NOT NULL DEFAULT 'pendiente'
                   CHECK (payment_status IN ('pagado','pendiente','anulado')),
  paid_at          TIMESTAMPTZ,  -- NULL si aún no se ha pagado

  -- Auditoría
  notes            TEXT,
  created_by       UUID REFERENCES public.profiles(id),
  created_at       TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at       TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ── Índices de rendimiento ──
CREATE INDEX IF NOT EXISTS idx_billing_client
  ON public.billing_records(client_profile_id);

CREATE INDEX IF NOT EXISTS idx_billing_appointment
  ON public.billing_records(appointment_id);

CREATE INDEX IF NOT EXISTS idx_billing_status
  ON public.billing_records(payment_status);

CREATE INDEX IF NOT EXISTS idx_billing_date
  ON public.billing_records(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_billing_paid_at
  ON public.billing_records(paid_at DESC)
  WHERE paid_at IS NOT NULL;

-- ── Trigger para updated_at ──
CREATE OR REPLACE FUNCTION public.handle_billing_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER billing_records_updated_at
  BEFORE UPDATE ON public.billing_records
  FOR EACH ROW EXECUTE FUNCTION public.handle_billing_updated_at();

-- ── RLS (Row Level Security) ──
ALTER TABLE public.billing_records ENABLE ROW LEVEL SECURITY;

-- Staff (owner/admin/receptionist) puede ver todos los cobros
CREATE POLICY "billing_staff_all_select" ON public.billing_records
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('owner','admin','receptionist')
    )
  );

-- Clientes solo ven sus propios cobros
CREATE POLICY "billing_client_own_select" ON public.billing_records
  FOR SELECT TO authenticated
  USING (
    client_profile_id IN (
      SELECT id FROM public.profiles WHERE user_id = auth.uid()
    )
  );

-- Solo staff puede insertar cobros
CREATE POLICY "billing_staff_insert" ON public.billing_records
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('owner','admin','receptionist')
    )
  );

-- Solo owner/admin puede actualizar cobros (correcciones)
CREATE POLICY "billing_owner_admin_update" ON public.billing_records
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role IN ('owner','admin')
    )
  );

-- Solo owner puede eliminar/anular
CREATE POLICY "billing_owner_delete" ON public.billing_records
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.user_id = auth.uid()
        AND p.role = 'owner'
    )
  );

-- ── Vista: Resumen de contabilidad por cliente ──
-- (Usa timezone America/Santiago para fechas, skill: timezone-santiago)
CREATE OR REPLACE VIEW public.billing_summary_by_client WITH (security_invoker = true) AS
SELECT
  p.id                               AS client_profile_id,
  p.full_name                        AS client_name,
  p.email                            AS client_email,
  p.phone                            AS client_phone,

  -- Totales financieros (siempre INTEGER, skill: financial-precision-math)
  COALESCE(SUM(CASE WHEN br.payment_status = 'pagado'   THEN br.total_clp ELSE 0 END), 0) AS total_pagado_clp,
  COALESCE(SUM(CASE WHEN br.payment_status = 'pendiente' THEN br.total_clp ELSE 0 END), 0) AS total_pendiente_clp,
  COALESCE(SUM(br.total_clp), 0)     AS total_facturado_clp,
  COALESCE(SUM(br.discount_clp), 0)  AS total_descuentos_clp,
  COUNT(br.id)                       AS total_cobros,

  -- Conteo de citas (join con appointments via billing)
  COUNT(DISTINCT br.appointment_id)  AS citas_con_cobro,
  COUNT(DISTINCT CASE WHEN a.status = 'completada' THEN a.id END) AS citas_completadas,
  COUNT(DISTINCT CASE WHEN a.status = 'no_show'    THEN a.id END) AS citas_no_show,
  COUNT(DISTINCT CASE WHEN a.status = 'cancelada'  THEN a.id END) AS citas_canceladas,

  -- Última actividad (en UTC, frontend convierte a Santiago)
  MAX(br.created_at)                 AS ultimo_cobro_at,
  MAX(br.paid_at)                    AS ultimo_pago_at

FROM public.profiles p
LEFT JOIN public.billing_records br ON br.client_profile_id = p.id
  AND br.payment_status != 'anulado'
LEFT JOIN public.appointments a ON a.id = br.appointment_id
WHERE p.role = 'client'
GROUP BY p.id, p.full_name, p.email, p.phone;

-- Acceso a la vista solo para staff
GRANT SELECT ON public.billing_summary_by_client TO authenticated;
