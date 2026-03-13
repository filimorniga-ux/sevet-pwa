
-- =========================================
-- SEVET – Ecosistema Pet-Tech 360
-- Esquema inicial de base de datos
-- =========================================

-- ── Perfiles de usuario ──
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  full_name TEXT NOT NULL,
  phone TEXT,
  rut TEXT,
  role TEXT NOT NULL DEFAULT 'owner' CHECK (role IN ('owner', 'vet', 'admin')),
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Mascotas ──
CREATE TABLE public.pets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  species TEXT NOT NULL CHECK (species IN ('perro', 'gato', 'otro')),
  breed TEXT,
  birth_date DATE,
  weight_kg NUMERIC(5,2),
  photo_url TEXT,
  chip_number TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ── Citas ──
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  vet_id UUID REFERENCES public.profiles(id),
  service_type TEXT NOT NULL CHECK (service_type IN ('consulta', 'vacuna', 'urgencia', 'cirugia', 'control', 'peluqueria', 'guarderia')),
  date_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'confirmada', 'en_curso', 'completada', 'cancelada')),
  triage_level TEXT DEFAULT 'normal' CHECK (triage_level IN ('normal', 'prioritario', 'urgente')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Historial médico (SOAP) ──
CREATE TABLE public.medical_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  vet_id UUID REFERENCES public.profiles(id) NOT NULL,
  appointment_id UUID REFERENCES public.appointments(id),
  subjective TEXT,
  objective TEXT,
  assessment TEXT,
  plan TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Vacunas ──
CREATE TABLE public.vaccinations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  vaccine_name TEXT NOT NULL,
  applied_date DATE NOT NULL,
  next_due_date DATE,
  batch_number TEXT,
  vet_id UUID REFERENCES public.profiles(id),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Productos (tienda/farmacia) ──
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('alimento', 'medicamento', 'suplemento', 'accesorio', 'higiene')),
  description TEXT,
  price_clp INTEGER NOT NULL,
  stock INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  is_prescription BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Imágenes diagnósticas ──
CREATE TABLE public.diagnostic_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  record_id UUID REFERENCES public.medical_records(id),
  image_url TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('radiografia', 'laboratorio', 'ecografia', 'otro')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Reservas peluquería/guardería ──
CREATE TABLE public.grooming_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID REFERENCES public.pets(id) ON DELETE CASCADE NOT NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('bano', 'corte', 'bano_corte', 'guarderia')),
  date_time TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'recepcion', 'en_proceso', 'listo', 'entregado', 'cancelado')),
  timeline_stage TEXT DEFAULT 'recepcion',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ── Trigger para crear perfil automático al registrarse ──
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, phone, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Usuario'),
    NEW.raw_user_meta_data->>'phone',
    'owner'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ── RLS (Row Level Security) ──
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vaccinations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diagnostic_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grooming_bookings ENABLE ROW LEVEL SECURITY;

-- Perfiles: el usuario ve su propio perfil; vets y admins ven todos
CREATE POLICY "Usuarios ven su perfil" ON public.profiles
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Vets ven todos los perfiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('vet', 'admin'))
  );
CREATE POLICY "Usuarios actualizan su perfil" ON public.profiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Mascotas: dueño ve sus mascotas; vets ven todas
CREATE POLICY "Dueño ve sus mascotas" ON public.pets
  FOR SELECT USING (
    owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Vets ven todas las mascotas" ON public.pets
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('vet', 'admin'))
  );
CREATE POLICY "Dueño registra mascotas" ON public.pets
  FOR INSERT WITH CHECK (
    owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );
CREATE POLICY "Dueño actualiza sus mascotas" ON public.pets
  FOR UPDATE USING (
    owner_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

-- Citas: dueño ve citas de sus mascotas; vets ven todas
CREATE POLICY "Dueño ve sus citas" ON public.appointments
  FOR SELECT USING (
    pet_id IN (
      SELECT p.id FROM public.pets p
      JOIN public.profiles pr ON pr.id = p.owner_id
      WHERE pr.user_id = auth.uid()
    )
  );
CREATE POLICY "Vets ven todas las citas" ON public.appointments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('vet', 'admin'))
  );
CREATE POLICY "Dueño agenda citas" ON public.appointments
  FOR INSERT WITH CHECK (
    pet_id IN (
      SELECT p.id FROM public.pets p
      JOIN public.profiles pr ON pr.id = p.owner_id
      WHERE pr.user_id = auth.uid()
    )
  );

-- Productos: lectura pública
CREATE POLICY "Todos ven productos" ON public.products
  FOR SELECT USING (true);
CREATE POLICY "Admin gestiona productos" ON public.products
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role = 'admin')
  );

-- Vacunas: dueño ve vacunas de sus mascotas; vets ven/crean todas
CREATE POLICY "Dueño ve vacunas" ON public.vaccinations
  FOR SELECT USING (
    pet_id IN (
      SELECT p.id FROM public.pets p
      JOIN public.profiles pr ON pr.id = p.owner_id
      WHERE pr.user_id = auth.uid()
    )
  );
CREATE POLICY "Vets gestionan vacunas" ON public.vaccinations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('vet', 'admin'))
  );

-- Historial médico: dueño ve de sus mascotas; vets gestionan
CREATE POLICY "Dueño ve historial" ON public.medical_records
  FOR SELECT USING (
    pet_id IN (
      SELECT p.id FROM public.pets p
      JOIN public.profiles pr ON pr.id = p.owner_id
      WHERE pr.user_id = auth.uid()
    )
  );
CREATE POLICY "Vets gestionan historial" ON public.medical_records
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('vet', 'admin'))
  );

-- Imágenes diagnósticas: mismas reglas que historial
CREATE POLICY "Dueño ve imágenes" ON public.diagnostic_images
  FOR SELECT USING (
    pet_id IN (
      SELECT p.id FROM public.pets p
      JOIN public.profiles pr ON pr.id = p.owner_id
      WHERE pr.user_id = auth.uid()
    )
  );
CREATE POLICY "Vets gestionan imágenes" ON public.diagnostic_images
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('vet', 'admin'))
  );

-- Grooming: dueño ve sus reservas; vets/admin ven todas
CREATE POLICY "Dueño ve sus reservas grooming" ON public.grooming_bookings
  FOR SELECT USING (
    pet_id IN (
      SELECT p.id FROM public.pets p
      JOIN public.profiles pr ON pr.id = p.owner_id
      WHERE pr.user_id = auth.uid()
    )
  );
CREATE POLICY "Vets gestionan grooming" ON public.grooming_bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('vet', 'admin'))
  );
CREATE POLICY "Dueño agenda grooming" ON public.grooming_bookings
  FOR INSERT WITH CHECK (
    pet_id IN (
      SELECT p.id FROM public.pets p
      JOIN public.profiles pr ON pr.id = p.owner_id
      WHERE pr.user_id = auth.uid()
    )
  );

-- ── Índices de rendimiento ──
CREATE INDEX idx_pets_owner ON public.pets(owner_id);
CREATE INDEX idx_appointments_pet ON public.appointments(pet_id);
CREATE INDEX idx_appointments_date ON public.appointments(date_time);
CREATE INDEX idx_appointments_status ON public.appointments(status);
CREATE INDEX idx_medical_records_pet ON public.medical_records(pet_id);
CREATE INDEX idx_vaccinations_pet ON public.vaccinations(pet_id);
CREATE INDEX idx_products_category ON public.products(category);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_diagnostic_images_pet ON public.diagnostic_images(pet_id);
CREATE INDEX idx_grooming_pet ON public.grooming_bookings(pet_id);
;
