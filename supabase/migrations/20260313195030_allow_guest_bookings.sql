-- Allow anyone (including unauthenticated users) to insert appointments
-- This enables guest booking without requiring login
DROP POLICY IF EXISTS "Dueño agenda citas" ON appointments;

CREATE POLICY "anyone_can_book" ON appointments
  FOR INSERT
  WITH CHECK (true);

-- Keep SELECT restricted to authenticated staff/owners
-- (existing select policy remains);
