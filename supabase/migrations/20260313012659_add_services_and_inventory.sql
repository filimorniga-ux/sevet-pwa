
-- Tabla de servicios de la clínica
CREATE TABLE IF NOT EXISTS public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  description text,
  price numeric(10,2) NOT NULL DEFAULT 0,
  duration_min integer DEFAULT 30,
  active boolean DEFAULT true,
  icon text DEFAULT '🩺',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Movimientos de inventario
CREATE TABLE IF NOT EXISTS public.inventory_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid REFERENCES public.products(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('entrada', 'salida', 'ajuste')),
  quantity integer NOT NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Políticas 
CREATE POLICY "Services viewable by everyone" ON public.services FOR SELECT USING (true);
CREATE POLICY "Authenticated can view inventory" ON public.inventory_movements FOR SELECT USING (auth.role() = 'authenticated');
CREATE POLICY "Authenticated can insert inventory" ON public.inventory_movements FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Insertar servicios
INSERT INTO public.services (name, category, price, duration_min, description, icon) VALUES
  ('Consulta General', 'consulta', 15000, 30, 'Evaluación médica integral', '🩺'),
  ('Vacunación', 'preventivo', 12000, 15, 'Esquema de vacunas completo', '💉'),
  ('Cirugía Menor', 'cirugia', 80000, 60, 'Intervenciones quirúrgicas ambulatorias', '🔬'),
  ('Cirugía Mayor', 'cirugia', 150000, 120, 'Cirugías de alta complejidad', '🏥'),
  ('Peluquería Básica', 'estetica', 12000, 45, 'Baño, corte y secado', '✂️'),
  ('Peluquería Premium', 'estetica', 22000, 90, 'Baño, corte, secado, perfume y lazo', '🎀'),
  ('Telemedicina', 'teleconsulta', 20000, 30, 'Consulta remota por videollamada', '📱'),
  ('Guardería por Día', 'guarderia', 15000, 480, 'Cuidado diurno con actividades', '🏠'),
  ('Desparasitación', 'preventivo', 8000, 15, 'Tratamiento antiparasitario', '💊'),
  ('Control de Peso', 'nutricion', 10000, 20, 'Evaluación nutricional y plan alimentario', '⚖️');

-- Insertar productos de ejemplo
INSERT INTO public.products (name, category, price_clp, stock, description, image_url) VALUES
  ('Royal Veterinary Adult Pro', 'alimento', 28990, 25, 'Alimento premium para perros adultos', '/assets/images/product-dog-food.png'),
  ('NutriVet Feline Elite', 'alimento', 19490, 18, 'Alimento premium para gatos indoor', '/assets/images/product-cat-food.png'),
  ('VetComplex Articular Pro', 'suplemento', 14990, 30, 'Glucosamina + Condroitina + MSM', '/assets/images/product-supplements.png'),
  ('Wild Bites Grain Free', 'accesorio', 5990, 50, 'Treats naturales de venado y arándano', '/assets/images/product-treats.png'),
  ('ProBiotic Digest Plus', 'suplemento', 11990, 20, 'Probióticos para salud digestiva', NULL),
  ('Shampoo Dermiclinic', 'higiene', 8990, 15, 'Shampoo dermatológico hipoalergénico', NULL),
  ('Collar Antipulgas Premium', 'accesorio', 16990, 12, 'Protección hasta 8 meses', NULL),
  ('Pipeta Frontguard X3', 'medicamento', 22990, 40, 'Pack 3 pipetas antiparasitarias', NULL);
;
