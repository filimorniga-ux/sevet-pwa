
-- 1. Expand role constraint to include client, receptionist, groomer
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check 
  CHECK (role IN ('owner','client','receptionist','vet','groomer','admin'));

-- 2. Add staff-specific columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS specialty text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS license_number text;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email text;

-- 3. Staff weekly schedules
CREATE TABLE IF NOT EXISTS staff_schedules (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  day_of_week int NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  UNIQUE(staff_id, day_of_week)
);

-- 4. Staff time off (vacations, sick leave, etc.)
CREATE TABLE IF NOT EXISTS staff_time_off (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  staff_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('vacation','sick_leave','personal','other')),
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','approved','rejected')),
  approved_by uuid REFERENCES profiles(id),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- 5. Enable RLS on new tables
ALTER TABLE staff_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_time_off ENABLE ROW LEVEL SECURITY;

-- 6. RLS policies for staff_schedules
CREATE POLICY "Staff can view all schedules" ON staff_schedules
  FOR SELECT USING (true);

CREATE POLICY "Staff can manage own schedule" ON staff_schedules
  FOR ALL USING (
    staff_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin can manage all schedules" ON staff_schedules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin','owner'))
  );

-- 7. RLS policies for staff_time_off
CREATE POLICY "Staff can view own time off" ON staff_time_off
  FOR SELECT USING (
    staff_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin','owner','receptionist'))
  );

CREATE POLICY "Staff can request time off" ON staff_time_off
  FOR INSERT WITH CHECK (
    staff_id = (SELECT id FROM profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Admin can manage time off" ON staff_time_off
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('admin','owner'))
  );

-- 8. Expand appointments for advanced scheduling
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS service_id uuid REFERENCES services(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS booked_by uuid REFERENCES profiles(id);
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS source text DEFAULT 'web';
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS duration_min int DEFAULT 30;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS google_event_id text;

-- Drop and recreate source check if it doesn't exist
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'appointments_source_check'
  ) THEN
    ALTER TABLE appointments ADD CONSTRAINT appointments_source_check
      CHECK (source IN ('web','chatbot','phone','walk_in'));
  END IF;
END $$;

-- 9. Expand services for specialties
ALTER TABLE services ADD COLUMN IF NOT EXISTS specialty text DEFAULT 'general';
ALTER TABLE services ADD COLUMN IF NOT EXISTS requires_vet boolean DEFAULT true;
;
