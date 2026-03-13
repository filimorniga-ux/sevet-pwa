
-- Drop the existing merged SELECT policy
DROP POLICY IF EXISTS "merged_select_appointments_5c6b3cce" ON appointments;

-- Create updated policy that includes owner, groomer, receptionist
CREATE POLICY "staff_and_owners_can_read_appointments" ON appointments
FOR SELECT USING (
  -- Pet owners can see their own pet's appointments
  pet_id IN (
    SELECT p.id FROM pets p
    JOIN profiles pr ON pr.id = p.owner_id
    WHERE pr.user_id = auth.uid()
  )
  OR
  -- Staff can see all appointments
  EXISTS (
    SELECT 1 FROM profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('vet', 'admin', 'owner', 'groomer', 'receptionist')
  )
);
;
