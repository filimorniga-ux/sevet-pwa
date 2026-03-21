-- ============================================================
-- SEED: Servicios veterinarios + Fichas clínicas de prueba
-- Fecha: 2026-03-21
-- ============================================================

-- ── 1. SERVICIOS (para landing page y panel admin) ──────────
INSERT INTO services (name, description, category, icon, price, duration_min, active)
VALUES
  ('Consulta General', 'Revisión clínica completa del paciente. Diagnóstico y plan de tratamiento.', 'Consultas', '🩺', 15000, 30, true),
  ('Consulta de Urgencia', 'Atención inmediata para casos críticos. Disponible de lunes a viernes.', 'Urgencias', '🚨', 25000, 45, true),
  ('Vacunación Polivalente', 'Vacuna 5 en 1: moquillo, hepatitis, parvovirus, parainfluenza y leptospirosis.', 'Vacunas', '💉', 18000, 20, true),
  ('Vacuna Antirrábica', 'Vacuna obligatoria anual contra la rabia.', 'Vacunas', '🔬', 12000, 15, true),
  ('Control de Desparasitación', 'Desparasitación interna y externa. Incluye antiparasitario.', 'Prevención', '🧪', 10000, 20, true),
  ('Cirugía General', 'Procedimientos quirúrgicos menores y mayores con equipo especializado.', 'Cirugías', '🏥', 120000, 120, true),
  ('Esterilización Hembra', 'Ovariohisterectomía. Previene enfermedades reproductivas y cáncer.', 'Cirugías', '⚕️', 85000, 90, true),
  ('Esterilización Macho', 'Orquiectomía. Reduce comportamientos agresivos y previene enfermedades.', 'Cirugías', '⚕️', 65000, 60, true),
  ('Peluquería Canina Básica', 'Baño, secado, corte de uñas y limpieza de oídos.', 'Peluquería', '✂️', 20000, 60, true),
  ('Peluquería Canina Premium', 'Baño, corte de pelo a tijera, secado profesional, aromaterapia y moño.', 'Peluquería', '✨', 35000, 90, true),
  ('Peluquería Felina', 'Baño, secado, corte de uñas y deslanado felino.', 'Peluquería', '🐱', 25000, 60, true),
  ('Radiografía Digital', 'Diagnóstico por imagen digital. Resultado inmediato en pantalla.', 'Diagnóstico', '📡', 30000, 30, true),
  ('Examen de Sangre (hemograma)', 'Análisis completo de sangre con resultados en 24 horas.', 'Diagnóstico', '🔬', 28000, 15, true),
  ('Ecografía Abdominal', 'Examen ecográfico abdominal para diagnóstico de órganos internos.', 'Diagnóstico', '📊', 45000, 30, true),
  ('Limpieza Dental', 'Profilaxis dental con ultrasonido bajo anestesia. Previene enfermedad periodontal.', 'Dental', '🦷', 55000, 60, true),
  ('Hospitalización Diaria', 'Cuidado y monitoreo durante 24 horas con veterinario de turno.', 'Hospitalización', '🏨', 35000, 1440, true)
ON CONFLICT DO NOTHING;

-- ── 2. FICHAS CLÍNICAS DE PRUEBA ────────────────────────────
-- Necesitamos al menos un perfil de tipo vet y una mascota.
-- Insertamos fichas usando los IDs de perfil y mascota del sistema.
-- Como no sabemos los UUIDs exactos, usamos subqueries.

DO $$
DECLARE
  v_vet_id       uuid;
  v_pet_id       uuid;
  v_owner_id     uuid;
BEGIN
  -- Obtener el primer veterinario disponible (rol 'vet' o 'owner')
  SELECT id INTO v_vet_id
  FROM profiles
  WHERE role IN ('vet', 'owner')
  ORDER BY created_at
  LIMIT 1;

  -- Obtener la primera mascota disponible
  SELECT id INTO v_pet_id
  FROM pets
  ORDER BY created_at
  LIMIT 1;

  -- Si existen ambos, insertar fichas de prueba
  IF v_vet_id IS NOT NULL AND v_pet_id IS NOT NULL THEN

    INSERT INTO medical_records (pet_id, vet_id, record_type, subjective, objective, assessment, plan, created_at)
    VALUES
      (
        v_pet_id, v_vet_id, 'consulta',
        'Propietario reporta que el paciente lleva 2 días sin comer bien y con decaimiento generalizado.',
        'Temperatura: 39.1°C. FC: 88 lpm. FR: 22 rpm. Mucosas rosadas y húmedas. Linfnodos normales. Abdomen sin dolor a la palpación.',
        'Compatible con gastroenteritis leve. Descartar causa parasitaria.',
        'Se prescribe: omeprazol 1mg/kg/día por 5 días, dieta blanda por 3 días. Retorno en 1 semana o antes si empeora.',
        NOW() - INTERVAL '30 days'
      ),
      (
        v_pet_id, v_vet_id, 'vacuna',
        'Paciente en control de vacunas anuales. Buen estado general, activo y con buen apetito.',
        'Peso: 12.3 kg. Temperatura: 38.6°C. Sin hallazgos patológicos al examen clínico.',
        'Paciente sano. Vacuna polivalente y antirrábica al día.',
        'Se aplica vacuna polivalente 5en1 y antirrábica. Próximo control en 12 meses (marzo 2027). Desparasitación trimestral pendiente.',
        NOW() - INTERVAL '15 days'
      ),
      (
        v_pet_id, v_vet_id, 'control',
        'Control post-gastroenteritis. Propietario indica que el paciente volvió a comer con normalidad desde hace 5 días.',
        'Peso: 12.5 kg. Temperatura: 38.4°C. Mucosas normales. Abdomen sin dolor. Deposiciones normales.',
        'Resolución completa de gastroenteritis. Paciente en buen estado general.',
        'Alta médica. Mantener dieta regular. Próximo control de vacunas en 11 meses.',
        NOW() - INTERVAL '8 days'
      )
    ON CONFLICT DO NOTHING;

    RAISE NOTICE 'Fichas clínicas de prueba insertadas correctamente.';
  ELSE
    RAISE NOTICE 'No se encontraron veterinario o mascota. Las fichas no se insertaron. Agrega datos de perfil y mascota primero.';
  END IF;
END $$;
