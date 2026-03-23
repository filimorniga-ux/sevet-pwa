-- ============================================================
-- Google Calendar Sync — Tabla de tokens OAuth (user_tokens)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_tokens (
  user_id                UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  google_access_token    TEXT,
  google_refresh_token   TEXT,
  google_token_expires   TIMESTAMPTZ,
  gcal_enabled           BOOLEAN DEFAULT false,
  google_gcal_event_ids  JSONB DEFAULT '{}'::jsonb,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS
ALTER TABLE public.user_tokens ENABLE ROW LEVEL SECURITY;

-- Solo el propio usuario puede leer/actualizar sus tokens
DROP POLICY IF EXISTS "Users can manage own tokens" ON public.user_tokens;

CREATE POLICY "Users can manage own tokens" ON public.user_tokens
  FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Migrar datos existentes (si los hay)
INSERT INTO public.user_tokens (user_id, google_access_token, google_refresh_token, google_token_expires, gcal_enabled, google_gcal_event_ids)
SELECT user_id, google_access_token, google_refresh_token, google_token_expires, gcal_enabled, google_gcal_event_ids
FROM public.profiles
WHERE google_access_token IS NOT NULL
ON CONFLICT (user_id) DO NOTHING;

-- Remover las columnas de perfiles
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS google_access_token,
  DROP COLUMN IF EXISTS google_refresh_token,
  DROP COLUMN IF EXISTS google_token_expires,
  DROP COLUMN IF EXISTS gcal_enabled,
  DROP COLUMN IF EXISTS google_gcal_event_ids;

-- Función RPC para actualizar JSONB sin race conditions
CREATE OR REPLACE FUNCTION update_gcal_event_id(
  p_user_id UUID,
  p_appointment_id TEXT,
  p_event_id TEXT
) RETURNS void AS $$
BEGIN
  IF p_event_id IS NULL THEN
    -- Delete the key
    UPDATE public.user_tokens
    SET google_gcal_event_ids = google_gcal_event_ids - p_appointment_id,
        updated_at = NOW()
    WHERE user_id = p_user_id;
  ELSE
    -- Set or update the key
    UPDATE public.user_tokens
    SET google_gcal_event_ids = jsonb_set(
          COALESCE(google_gcal_event_ids, '{}'::jsonb),
          ARRAY[p_appointment_id],
          to_jsonb(p_event_id)
        ),
        updated_at = NOW()
    WHERE user_id = p_user_id;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Restringir acceso al RPC (solo service_role o admin, no public)
REVOKE ALL ON FUNCTION public.update_gcal_event_id(UUID, TEXT, TEXT) FROM public;
REVOKE ALL ON FUNCTION public.update_gcal_event_id(UUID, TEXT, TEXT) FROM authenticated;
REVOKE ALL ON FUNCTION public.update_gcal_event_id(UUID, TEXT, TEXT) FROM anon;
GRANT EXECUTE ON FUNCTION public.update_gcal_event_id(UUID, TEXT, TEXT) TO service_role;
