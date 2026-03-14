-- SEVET - Fase 3
-- Restrict inventory_movements RLS to admin and owner roles

BEGIN;

-- Drop permissive policies
DROP POLICY IF EXISTS "Authenticated can view inventory" ON public.inventory_movements;
DROP POLICY IF EXISTS "Authenticated can insert inventory" ON public.inventory_movements;

-- Create strict policies for inventory_movements
CREATE POLICY inventory_movements_select_admin ON public.inventory_movements
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('admin', 'owner')
    )
  );

CREATE POLICY inventory_movements_insert_admin ON public.inventory_movements
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles pr
      WHERE pr.user_id = (select auth.uid())
        AND pr.role IN ('admin', 'owner')
    )
  );

COMMIT;
