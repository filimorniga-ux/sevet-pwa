-- Eliminar política problemática
DROP POLICY IF EXISTS "merged_select_profiles_9ee60193" ON profiles;

-- Función para verificar si el usuario es staff/admin sin causar recursión (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION public.check_user_is_staff()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE user_id = auth.uid()
    AND role IN ('admin', 'owner', 'vet', 'receptionist', 'groomer')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Crear políticas limpias
CREATE POLICY "Public profiles are viewable by owner, staff and self"
ON profiles FOR SELECT
USING (
  auth.uid() = user_id 
  OR 
  check_user_is_staff()
);

-- Asegurar que los usuarios puedan actualizar su propio perfil
DROP POLICY IF EXISTS "Usuarios actualizan su perfil" ON profiles;
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = user_id);
;
