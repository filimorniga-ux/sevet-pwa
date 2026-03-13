-- SEVET - Fase 2
-- Alinea contrato frontend <-> base de datos y corrige warnings RLS de lint.

BEGIN;

-- =====================================================
-- 1) Compatibilidad de esquema: profiles
-- =====================================================
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email text,
  ADD COLUMN IF NOT EXISTS specialty text,
  ADD COLUMN IF NOT EXISTS is_active boolean NOT NULL DEFAULT true;

UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.user_id = u.id
  AND p.email IS NULL;

UPDATE public.profiles
SET role = 'client'
WHERE role IS NULL OR btrim(role) = '';

ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role IN ('client', 'owner', 'vet', 'groomer', 'receptionist', 'admin'));

CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- =====================================================
-- 2) Compatibilidad de esquema: services
-- =====================================================
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS specialty text;

UPDATE public.services
SET specialty = COALESCE(NULLIF(specialty, ''), NULLIF(category, ''), 'general');

UPDATE public.services
SET category = COALESCE(NULLIF(category, ''), NULLIF(specialty, ''), 'general');

CREATE OR REPLACE FUNCTION public.sync_services_category_specialty()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.category := COALESCE(NULLIF(NEW.category, ''), NULLIF(NEW.specialty, ''), 'general');
  NEW.specialty := COALESCE(NULLIF(NEW.specialty, ''), NEW.category, 'general');
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_services_category_specialty ON public.services;

CREATE TRIGGER trg_sync_services_category_specialty
BEFORE INSERT OR UPDATE ON public.services
FOR EACH ROW
EXECUTE FUNCTION public.sync_services_category_specialty();

-- =====================================================
-- 3) Compatibilidad de esquema: appointments
-- =====================================================
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS service_id uuid,
  ADD COLUMN IF NOT EXISTS booked_by uuid,
  ADD COLUMN IF NOT EXISTS source text,
  ADD COLUMN IF NOT EXISTS duration_min integer;

UPDATE public.appointments
SET source = 'web'
WHERE source IS NULL OR btrim(source) = '';

UPDATE public.appointments
SET duration_min = 30
WHERE duration_min IS NULL OR duration_min <= 0;

ALTER TABLE public.appointments
  ALTER COLUMN source SET DEFAULT 'web',
  ALTER COLUMN source SET NOT NULL,
  ALTER COLUMN duration_min SET DEFAULT 30,
  ALTER COLUMN duration_min SET NOT NULL;

ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_duration_min_check;

ALTER TABLE public.appointments
  ADD CONSTRAINT appointments_duration_min_check CHECK (duration_min > 0);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'appointments_service_id_fkey'
      AND conrelid = 'public.appointments'::regclass
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_service_id_fkey
      FOREIGN KEY (service_id) REFERENCES public.services(id) ON DELETE SET NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'appointments_booked_by_fkey'
      AND conrelid = 'public.appointments'::regclass
  ) THEN
    ALTER TABLE public.appointments
      ADD CONSTRAINT appointments_booked_by_fkey
      FOREIGN KEY (booked_by) REFERENCES public.profiles(id) ON DELETE SET NULL;
  END IF;
END $$;

UPDATE public.appointments a
SET booked_by = p.owner_id
FROM public.pets p
WHERE a.pet_id = p.id
  AND a.booked_by IS NULL;

UPDATE public.appointments a
SET service_id = COALESCE(
      a.service_id,
      (
        SELECT s.id
        FROM public.services s
        WHERE s.category = a.service_type
           OR s.specialty = a.service_type
        ORDER BY s.created_at ASC
        LIMIT 1
      )
    ),
    duration_min = CASE
      WHEN a.duration_min = 30 THEN COALESCE(
        (
          SELECT s.duration_min
          FROM public.services s
          WHERE s.category = a.service_type
             OR s.specialty = a.service_type
          ORDER BY s.created_at ASC
          LIMIT 1
        ),
        30
      )
      ELSE a.duration_min
    END
WHERE a.service_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_appointments_service_id ON public.appointments(service_id);
CREATE INDEX IF NOT EXISTS idx_appointments_booked_by ON public.appointments(booked_by);
CREATE INDEX IF NOT EXISTS idx_appointments_vet_date_time ON public.appointments(vet_id, date_time);

-- =====================================================
-- 4) Nuevas tablas para agenda de staff
-- =====================================================
CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

CREATE TABLE IF NOT EXISTS public.staff_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_schedules_time_check CHECK (start_time < end_time),
  CONSTRAINT staff_schedules_staff_day_key UNIQUE (staff_id, day_of_week)
);

CREATE TABLE IF NOT EXISTS public.staff_time_off (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  staff_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type text NOT NULL DEFAULT 'personal'
    CHECK (type IN ('vacation', 'sick_leave', 'personal', 'other')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'approved', 'rejected')),
  notes text,
  approved_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT staff_time_off_date_check CHECK (start_date <= end_date)
);

CREATE INDEX IF NOT EXISTS idx_staff_schedules_staff_day_active
  ON public.staff_schedules(staff_id, day_of_week, is_active);
CREATE INDEX IF NOT EXISTS idx_staff_time_off_staff_dates
  ON public.staff_time_off(staff_id, start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_staff_time_off_status
  ON public.staff_time_off(status);

DROP TRIGGER IF EXISTS set_staff_schedules_updated_at ON public.staff_schedules;
CREATE TRIGGER set_staff_schedules_updated_at
BEFORE UPDATE ON public.staff_schedules
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

DROP TRIGGER IF EXISTS set_staff_time_off_updated_at ON public.staff_time_off;
CREATE TRIGGER set_staff_time_off_updated_at
BEFORE UPDATE ON public.staff_time_off
FOR EACH ROW
EXECUTE FUNCTION public.touch_updated_at();

ALTER TABLE public.staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_time_off ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 5) Trigger de signup endurecido (search_path + rol client)
-- =====================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
AS $$
DECLARE
  target_role text;
BEGIN
  target_role := lower(COALESCE(NEW.raw_user_meta_data->>'role', 'client'));

  IF target_role NOT IN ('client', 'owner', 'vet', 'groomer', 'receptionist', 'admin') THEN
    target_role := 'client';
  END IF;

  INSERT INTO public.profiles (user_id, full_name, phone, email, role, is_active)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NULLIF(split_part(COALESCE(NEW.email, ''), '@', 1), ''),
      'Usuario'
    ),
    NEW.raw_user_meta_data->>'phone',
    NEW.email,
    target_role,
    true
  )
  ON CONFLICT (user_id) DO UPDATE
  SET full_name = COALESCE(EXCLUDED.full_name, public.profiles.full_name),
      phone = COALESCE(EXCLUDED.phone, public.profiles.phone),
      email = COALESCE(EXCLUDED.email, public.profiles.email),
      updated_at = now();

  RETURN NEW;
END;
$$;

ALTER FUNCTION public.handle_new_user() SET search_path = public, auth, extensions;

-- =====================================================
-- 6) RLS: eliminar duplicados y definir políticas únicas por acción
-- =====================================================
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'products',
        'vaccinations',
        'medical_records',
        'diagnostic_images',
        'grooming_bookings',
        'staff_schedules',
        'staff_time_off'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', pol.policyname, pol.schemaname, pol.tablename);
  END LOOP;
END $$;

-- PRODUCTS
CREATE POLICY products_select_public ON public.products
  FOR SELECT
  USING (true);

CREATE POLICY products_insert_admin ON public.products
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('admin', 'owner')
    )
  );

CREATE POLICY products_update_admin ON public.products
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('admin', 'owner')
    )
  );

CREATE POLICY products_delete_admin ON public.products
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('admin', 'owner')
    )
  );

-- VACCINATIONS
CREATE POLICY vaccinations_select_owner_or_staff ON public.vaccinations
  FOR SELECT
  USING (
    pet_id IN (
      SELECT p.id
      FROM public.pets p
      JOIN public.profiles owner_pr ON owner_pr.id = p.owner_id
      WHERE owner_pr.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('vet', 'admin', 'owner')
    )
  );

CREATE POLICY vaccinations_insert_staff ON public.vaccinations
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('vet', 'admin', 'owner')
    )
  );

CREATE POLICY vaccinations_update_staff ON public.vaccinations
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('vet', 'admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('vet', 'admin', 'owner')
    )
  );

CREATE POLICY vaccinations_delete_staff ON public.vaccinations
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('vet', 'admin', 'owner')
    )
  );

-- MEDICAL RECORDS
CREATE POLICY medical_records_select_owner_or_staff ON public.medical_records
  FOR SELECT
  USING (
    pet_id IN (
      SELECT p.id
      FROM public.pets p
      JOIN public.profiles owner_pr ON owner_pr.id = p.owner_id
      WHERE owner_pr.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('vet', 'admin', 'owner')
    )
  );

CREATE POLICY medical_records_insert_staff ON public.medical_records
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('vet', 'admin', 'owner')
    )
  );

CREATE POLICY medical_records_update_staff ON public.medical_records
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('vet', 'admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('vet', 'admin', 'owner')
    )
  );

CREATE POLICY medical_records_delete_staff ON public.medical_records
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('vet', 'admin', 'owner')
    )
  );

-- DIAGNOSTIC IMAGES
CREATE POLICY diagnostic_images_select_owner_or_staff ON public.diagnostic_images
  FOR SELECT
  USING (
    pet_id IN (
      SELECT p.id
      FROM public.pets p
      JOIN public.profiles owner_pr ON owner_pr.id = p.owner_id
      WHERE owner_pr.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('vet', 'admin', 'owner')
    )
  );

CREATE POLICY diagnostic_images_insert_staff ON public.diagnostic_images
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('vet', 'admin', 'owner')
    )
  );

CREATE POLICY diagnostic_images_update_staff ON public.diagnostic_images
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('vet', 'admin', 'owner')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('vet', 'admin', 'owner')
    )
  );

CREATE POLICY diagnostic_images_delete_staff ON public.diagnostic_images
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('vet', 'admin', 'owner')
    )
  );

-- GROOMING BOOKINGS
CREATE POLICY grooming_bookings_select_owner_or_staff ON public.grooming_bookings
  FOR SELECT
  USING (
    pet_id IN (
      SELECT p.id
      FROM public.pets p
      JOIN public.profiles owner_pr ON owner_pr.id = p.owner_id
      WHERE owner_pr.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('groomer', 'vet', 'admin', 'owner', 'receptionist')
    )
  );

CREATE POLICY grooming_bookings_insert_owner_or_staff ON public.grooming_bookings
  FOR INSERT
  WITH CHECK (
    pet_id IN (
      SELECT p.id
      FROM public.pets p
      JOIN public.profiles owner_pr ON owner_pr.id = p.owner_id
      WHERE owner_pr.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('groomer', 'vet', 'admin', 'owner', 'receptionist')
    )
  );

CREATE POLICY grooming_bookings_update_staff ON public.grooming_bookings
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('groomer', 'vet', 'admin', 'owner', 'receptionist')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('groomer', 'vet', 'admin', 'owner', 'receptionist')
    )
  );

CREATE POLICY grooming_bookings_delete_staff ON public.grooming_bookings
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('groomer', 'vet', 'admin', 'owner', 'receptionist')
    )
  );

-- STAFF SCHEDULES
CREATE POLICY staff_schedules_select_self_or_admin ON public.staff_schedules
  FOR SELECT
  USING (
    staff_id IN (
      SELECT pr.id
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('admin', 'owner', 'receptionist')
    )
  );

CREATE POLICY staff_schedules_insert_self_or_admin ON public.staff_schedules
  FOR INSERT
  WITH CHECK (
    staff_id IN (
      SELECT pr.id
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('admin', 'owner', 'receptionist')
    )
  );

CREATE POLICY staff_schedules_update_self_or_admin ON public.staff_schedules
  FOR UPDATE
  USING (
    staff_id IN (
      SELECT pr.id
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('admin', 'owner', 'receptionist')
    )
  )
  WITH CHECK (
    staff_id IN (
      SELECT pr.id
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('admin', 'owner', 'receptionist')
    )
  );

CREATE POLICY staff_schedules_delete_self_or_admin ON public.staff_schedules
  FOR DELETE
  USING (
    staff_id IN (
      SELECT pr.id
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('admin', 'owner', 'receptionist')
    )
  );

-- STAFF TIME OFF
CREATE POLICY staff_time_off_select_self_or_admin ON public.staff_time_off
  FOR SELECT
  USING (
    staff_id IN (
      SELECT pr.id
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('admin', 'owner', 'receptionist')
    )
  );

CREATE POLICY staff_time_off_insert_self_or_admin ON public.staff_time_off
  FOR INSERT
  WITH CHECK (
    staff_id IN (
      SELECT pr.id
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('admin', 'owner', 'receptionist')
    )
  );

CREATE POLICY staff_time_off_update_self_or_admin ON public.staff_time_off
  FOR UPDATE
  USING (
    staff_id IN (
      SELECT pr.id
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('admin', 'owner', 'receptionist')
    )
  )
  WITH CHECK (
    (
      staff_id IN (
        SELECT pr.id
        FROM public.profiles pr
        WHERE pr.user_id = (select auth.uid())
      )
      AND status = 'pending'
    )
    OR EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('admin', 'owner', 'receptionist')
    )
  );

CREATE POLICY staff_time_off_delete_admin ON public.staff_time_off
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('admin', 'owner', 'receptionist')
    )
  );

COMMIT;
