-- ============================================================
-- Google Calendar Sync — Columnas de tokens OAuth
-- ============================================================
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS google_access_token   TEXT,
  ADD COLUMN IF NOT EXISTS google_refresh_token  TEXT,
  ADD COLUMN IF NOT EXISTS google_token_expires   TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS gcal_enabled           BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS google_gcal_event_ids  JSONB DEFAULT '{}'::jsonb;

-- Solo el propio usuario puede leer/actualizar su token
-- (los tokens son sensibles — no deben ser visibles por otros)
DROP POLICY IF EXISTS "user_manage_own_gcal_token" ON profiles;

-- NOTA: Los tokens se protegen a nivel de columna — la policy de profiles
-- ya restringe a "el usuario solo puede ver/editar su propio perfil".
-- Si no existe esa policy general, agregar:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Users can update own profile'
  ) THEN
    CREATE POLICY "Users can update own profile" ON profiles
      FOR UPDATE TO authenticated
      USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;
END $$;
