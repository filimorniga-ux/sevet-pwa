-- ============================================================
-- WhatsApp Bot — Tabla de sesiones de conversación
-- ============================================================
CREATE TABLE IF NOT EXISTS public.whatsapp_sessions (
  phone       TEXT PRIMARY KEY,           -- Número E.164 ej: 56912345678
  state       TEXT NOT NULL DEFAULT 'idle',
  context     JSONB DEFAULT '{}',         -- Datos parciales: service, date, time, etc.
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW(),
  expires_at  TIMESTAMPTZ DEFAULT NOW() + INTERVAL '30 minutes'
);

-- Índice para limpiar sesiones expiradas
CREATE INDEX IF NOT EXISTS idx_whatsapp_sessions_expires
  ON public.whatsapp_sessions (expires_at);

-- La Edge Function usa service_role — no necesita RLS permisivo
ALTER TABLE public.whatsapp_sessions ENABLE ROW LEVEL SECURITY;

-- Solo service_role puede acceder (la Edge Function)
DROP POLICY IF EXISTS "Service role only" ON public.whatsapp_sessions;
CREATE POLICY "Service role only" ON public.whatsapp_sessions
  FOR ALL TO service_role
  USING (true)
  WITH CHECK (true);

-- Limpiar sesiones expiradas automáticamente (se llama desde la Edge Function)
CREATE OR REPLACE FUNCTION cleanup_expired_whatsapp_sessions()
RETURNS void AS $$
BEGIN
  DELETE FROM public.whatsapp_sessions WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.cleanup_expired_whatsapp_sessions() TO service_role;
