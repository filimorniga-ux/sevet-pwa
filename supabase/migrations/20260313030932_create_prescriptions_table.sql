
-- Prescriptions: links medical records to products for purchase validation
CREATE TABLE prescriptions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id uuid REFERENCES medical_records(id) ON DELETE CASCADE,
  product_id uuid REFERENCES products(id),
  pet_id uuid REFERENCES pets(id),
  prescribed_by uuid REFERENCES profiles(id),
  dosage text,
  frequency text,
  duration_days int,
  is_chronic boolean DEFAULT false,
  status text DEFAULT 'active' CHECK (status IN ('active','completed','cancelled')),
  created_at timestamptz DEFAULT now()
);

-- RLS
ALTER TABLE prescriptions ENABLE ROW LEVEL SECURITY;

-- Owners can read their own pet prescriptions
CREATE POLICY "owners_read_own_pet_prescriptions"
  ON prescriptions FOR SELECT
  USING (pet_id IN (SELECT id FROM pets WHERE owner_id IN (SELECT id FROM profiles WHERE user_id = auth.uid())));

-- Vets/admins can manage prescriptions
CREATE POLICY "vets_manage_prescriptions"
  ON prescriptions FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE user_id = auth.uid() AND role IN ('vet','admin')));

-- Index for common queries
CREATE INDEX idx_prescriptions_pet_id ON prescriptions(pet_id);
CREATE INDEX idx_prescriptions_status ON prescriptions(status);
;
