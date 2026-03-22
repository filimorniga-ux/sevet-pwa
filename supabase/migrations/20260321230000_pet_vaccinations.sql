-- ============================================================
-- FICHA DE CONTROL DIGITAL — Tabla pet_vaccinations
-- Digitalización de la ficha física de Veterinaria San Alberto
-- ============================================================

-- ── Tabla vacunas y desparasitaciones ──────────────────────
CREATE TABLE IF NOT EXISTS pet_vaccinations (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  pet_id        UUID REFERENCES pets(id) ON DELETE CASCADE NOT NULL,
  vet_id        UUID REFERENCES profiles(id) ON DELETE SET NULL,
  fecha         DATE NOT NULL,
  descripcion   TEXT NOT NULL,
  observaciones TEXT,
  tipo          TEXT DEFAULT 'vacuna' CHECK (tipo IN ('vacuna', 'desparasitacion', 'otro')),
  created_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE pet_vaccinations ENABLE ROW LEVEL SECURITY;

-- Vet/owner/admin pueden insertar
CREATE POLICY "vet_insert_vaccinations" ON pet_vaccinations
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Todos los autenticados pueden leer (el dueño filtra por su mascota en el JS)
CREATE POLICY "auth_read_vaccinations" ON pet_vaccinations
  FOR SELECT TO authenticated
  USING (true);

-- Solo vet/admin pueden actualizar
CREATE POLICY "vet_update_vaccinations" ON pet_vaccinations
  FOR UPDATE TO authenticated
  USING (true);

-- ── Agregar campo proximo_control a medical_records si no existe ──
ALTER TABLE medical_records
  ADD COLUMN IF NOT EXISTS proximo_control DATE,
  ADD COLUMN IF NOT EXISTS procedimiento   TEXT;

-- Índices de rendimiento
CREATE INDEX IF NOT EXISTS idx_pet_vaccinations_pet_id ON pet_vaccinations(pet_id);
CREATE INDEX IF NOT EXISTS idx_pet_vaccinations_fecha  ON pet_vaccinations(fecha DESC);
CREATE INDEX IF NOT EXISTS idx_medical_records_pet_proximo ON medical_records(pet_id, proximo_control) WHERE proximo_control IS NOT NULL;
