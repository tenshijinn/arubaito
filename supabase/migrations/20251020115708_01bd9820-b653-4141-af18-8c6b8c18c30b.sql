-- Fix function search path security issue by recreating trigger
DROP TRIGGER IF EXISTS update_rei_registry_updated_at ON public.rei_registry;
DROP FUNCTION IF EXISTS public.update_rei_registry_updated_at();

CREATE OR REPLACE FUNCTION public.update_rei_registry_updated_at()
RETURNS TRIGGER 
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_rei_registry_updated_at
  BEFORE UPDATE ON public.rei_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rei_registry_updated_at();