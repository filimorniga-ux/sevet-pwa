
-- Expand category constraint to include subcategories
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE products ADD CONSTRAINT products_category_check 
  CHECK (category IN ('alimento','medicamento','suplemento','accesorio','higiene','antiparasitario','dermatologia','urgencia'));

-- Add subcategory column for finer filtering
ALTER TABLE products ADD COLUMN IF NOT EXISTS subcategory text;

-- Update existing products with subcategories
UPDATE products SET subcategory = 'antiparasitario_externo' WHERE name = 'Pipeta Frontguard X3';
UPDATE products SET subcategory = 'articular' WHERE name = 'VetComplex Articular Pro';
UPDATE products SET subcategory = 'digestivo' WHERE name = 'ProBiotic Digest Plus';
UPDATE products SET subcategory = 'dermatologia' WHERE name = 'Shampoo Dermiclinic';

-- Insert new pharmacy products
INSERT INTO products (name, category, subcategory, description, price_clp, stock, is_prescription, image_url) VALUES
  ('Milbemax Perro Adulto', 'medicamento', 'antiparasitario_interno', 'Desparasitante interno de amplio espectro. Tratamiento contra cestodos y nematodos.', 15990, 25, true, null),
  ('Drontal Cat', 'medicamento', 'antiparasitario_interno', 'Desparasitante oral para gatos. Efectivo contra parásitos redondos y planos.', 12990, 30, false, null),
  ('Advantage Multi Perro', 'medicamento', 'antiparasitario_externo', 'Pipeta mensual contra pulgas, ácaros, gusano del corazón y parásitos intestinales.', 19990, 20, true, null),
  ('Fuciderm Gel Dermatológico', 'medicamento', 'dermatologia', 'Gel antibacteriano y antiinflamatorio para dermatitis bacteriana canina.', 14990, 15, true, null),
  ('Otomax Gotas Óticas', 'medicamento', 'otico', 'Gotas óticas con antibiótico, antimicótico y corticoide para otitis externa.', 11990, 18, true, null),
  ('Glucosamina Renal Support', 'suplemento', 'renal', 'Suplemento de soporte renal con EPA/DHA y antioxidantes para función renal.', 16990, 22, false, null),
  ('Omega-3 Cardioprotector', 'suplemento', 'cardiovascular', 'Ácidos grasos Omega-3 de alta pureza para salud cardiovascular y piel.', 13990, 28, false, null),
  ('Botiquín Veterinario Básico', 'accesorio', 'urgencia', 'Kit de primeros auxilios: gasas, vendajes, antiséptico, termómetro, pinzas.', 24990, 10, false, null),
  ('Suero Oral Rehidratante', 'medicamento', 'urgencia', 'Solución de rehidratación oral con electrolitos para deshidratación leve-moderada.', 6990, 35, false, null),
  ('Vendaje Cohesivo Vet', 'accesorio', 'urgencia', 'Vendaje autoadhesivo flexible. No se pega al pelo. Pack de 6 rollos.', 3990, 40, false, null),
  ('Cepillo Dental Enzimático', 'higiene', 'dental', 'Kit de cepillo triple cabezal + pasta enzimática sabor pollo. Uso veterinario.', 7990, 20, false, null),
  ('Limpiador Oídos Premium', 'higiene', 'otico', 'Solución limpiadora de oídos con ácido salicílico. Previene infecciones.', 9990, 25, false, null);
;
