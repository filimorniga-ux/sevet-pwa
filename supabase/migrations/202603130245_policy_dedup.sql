-- SEVET - Deduplicate permissive RLS policies flagged by lint 0006
-- Target tables: products, vaccinations, medical_records, diagnostic_images, grooming_bookings

BEGIN;

-- Remove previous auto-generated merged policies on target tables, if any.
DO $$
DECLARE
  rec record;
BEGIN
  FOR rec IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('products', 'vaccinations', 'medical_records', 'diagnostic_images', 'grooming_bookings')
      AND policyname LIKE 'merged_%'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', rec.policyname, rec.schemaname, rec.tablename);
  END LOOP;
END $$;

-- Common predicates
-- is_vet_or_admin:
-- EXISTS (SELECT 1 FROM public.profiles WHERE user_id = (select auth.uid()) AND role IN ('vet', 'admin'))
-- is_admin:
-- EXISTS (SELECT 1 FROM public.profiles WHERE user_id = (select auth.uid()) AND role = 'admin')
-- owns_pet(table_alias.pet_id):
-- table_alias.pet_id IN (
--   SELECT p.id
--   FROM public.pets p
--   JOIN public.profiles pr ON pr.id = p.owner_id
--   WHERE pr.user_id = (select auth.uid())
-- )

-- =========================================
-- PRODUCTS
-- =========================================
DROP POLICY IF EXISTS "Admin gestiona productos" ON public.products;
DROP POLICY IF EXISTS "Admin inserta productos" ON public.products;
DROP POLICY IF EXISTS "Admin actualiza productos" ON public.products;
DROP POLICY IF EXISTS "Admin elimina productos" ON public.products;

CREATE POLICY "Admin inserta productos" ON public.products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role = 'admin'
    )
  );

CREATE POLICY "Admin actualiza productos" ON public.products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role = 'admin'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role = 'admin'
    )
  );

CREATE POLICY "Admin elimina productos" ON public.products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role = 'admin'
    )
  );

-- =========================================
-- VACCINATIONS
-- =========================================
DROP POLICY IF EXISTS "Dueño ve vacunas" ON public.vaccinations;
DROP POLICY IF EXISTS "Vets gestionan vacunas" ON public.vaccinations;
DROP POLICY IF EXISTS "Vets crean vacunas" ON public.vaccinations;
DROP POLICY IF EXISTS "Vets actualizan vacunas" ON public.vaccinations;
DROP POLICY IF EXISTS "Vets eliminan vacunas" ON public.vaccinations;

CREATE POLICY "Dueño ve vacunas" ON public.vaccinations
  FOR SELECT
  USING (
    pet_id IN (
      SELECT p.id
      FROM public.pets p
      JOIN public.profiles pr ON pr.id = p.owner_id
      WHERE pr.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role IN ('vet', 'admin')
    )
  );

CREATE POLICY "Vets crean vacunas" ON public.vaccinations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role IN ('vet', 'admin')
    )
  );

CREATE POLICY "Vets actualizan vacunas" ON public.vaccinations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role IN ('vet', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role IN ('vet', 'admin')
    )
  );

CREATE POLICY "Vets eliminan vacunas" ON public.vaccinations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role IN ('vet', 'admin')
    )
  );

-- =========================================
-- MEDICAL RECORDS
-- =========================================
DROP POLICY IF EXISTS "Dueño ve historial" ON public.medical_records;
DROP POLICY IF EXISTS "Vets gestionan historial" ON public.medical_records;
DROP POLICY IF EXISTS "Vets crean historial" ON public.medical_records;
DROP POLICY IF EXISTS "Vets actualizan historial" ON public.medical_records;
DROP POLICY IF EXISTS "Vets eliminan historial" ON public.medical_records;

CREATE POLICY "Dueño ve historial" ON public.medical_records
  FOR SELECT
  USING (
    pet_id IN (
      SELECT p.id
      FROM public.pets p
      JOIN public.profiles pr ON pr.id = p.owner_id
      WHERE pr.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role IN ('vet', 'admin')
    )
  );

CREATE POLICY "Vets crean historial" ON public.medical_records
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role IN ('vet', 'admin')
    )
  );

CREATE POLICY "Vets actualizan historial" ON public.medical_records
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role IN ('vet', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role IN ('vet', 'admin')
    )
  );

CREATE POLICY "Vets eliminan historial" ON public.medical_records
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role IN ('vet', 'admin')
    )
  );

-- =========================================
-- DIAGNOSTIC IMAGES
-- =========================================
DROP POLICY IF EXISTS "Dueño ve imágenes" ON public.diagnostic_images;
DROP POLICY IF EXISTS "Vets gestionan imágenes" ON public.diagnostic_images;
DROP POLICY IF EXISTS "Vets crean imágenes" ON public.diagnostic_images;
DROP POLICY IF EXISTS "Vets actualizan imágenes" ON public.diagnostic_images;
DROP POLICY IF EXISTS "Vets eliminan imágenes" ON public.diagnostic_images;

CREATE POLICY "Dueño ve imágenes" ON public.diagnostic_images
  FOR SELECT
  USING (
    pet_id IN (
      SELECT p.id
      FROM public.pets p
      JOIN public.profiles pr ON pr.id = p.owner_id
      WHERE pr.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role IN ('vet', 'admin')
    )
  );

CREATE POLICY "Vets crean imágenes" ON public.diagnostic_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role IN ('vet', 'admin')
    )
  );

CREATE POLICY "Vets actualizan imágenes" ON public.diagnostic_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role IN ('vet', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role IN ('vet', 'admin')
    )
  );

CREATE POLICY "Vets eliminan imágenes" ON public.diagnostic_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role IN ('vet', 'admin')
    )
  );

-- =========================================
-- GROOMING BOOKINGS
-- =========================================
DROP POLICY IF EXISTS "Dueño ve sus reservas grooming" ON public.grooming_bookings;
DROP POLICY IF EXISTS "Dueño agenda grooming" ON public.grooming_bookings;
DROP POLICY IF EXISTS "Vets gestionan grooming" ON public.grooming_bookings;
DROP POLICY IF EXISTS "Vets actualizan grooming" ON public.grooming_bookings;
DROP POLICY IF EXISTS "Vets eliminan grooming" ON public.grooming_bookings;

CREATE POLICY "Dueño ve sus reservas grooming" ON public.grooming_bookings
  FOR SELECT
  USING (
    pet_id IN (
      SELECT p.id
      FROM public.pets p
      JOIN public.profiles pr ON pr.id = p.owner_id
      WHERE pr.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role IN ('vet', 'admin')
    )
  );

CREATE POLICY "Dueño agenda grooming" ON public.grooming_bookings
  FOR INSERT
  WITH CHECK (
    pet_id IN (
      SELECT p.id
      FROM public.pets p
      JOIN public.profiles pr ON pr.id = p.owner_id
      WHERE pr.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role IN ('vet', 'admin')
    )
  );

CREATE POLICY "Vets actualizan grooming" ON public.grooming_bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role IN ('vet', 'admin')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role IN ('vet', 'admin')
    )
  );

CREATE POLICY "Vets eliminan grooming" ON public.grooming_bookings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles
      WHERE user_id = (select auth.uid())
        AND role IN ('vet', 'admin')
    )
  );

COMMIT;
