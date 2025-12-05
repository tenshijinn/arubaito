-- Drop existing SELECT policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.rei_registry;
DROP POLICY IF EXISTS "Paid employers can view purchased profiles" ON public.rei_registry;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.rei_registry;

-- Recreate policies with explicit authentication requirement
-- Users can view their own profile (must be authenticated)
CREATE POLICY "Users can view own profile"
ON public.rei_registry
FOR SELECT
TO authenticated
USING (
  wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text)
  OR x_user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'x_user_id'::text)
);

-- Paid employers can view profiles they purchased (must be authenticated)
CREATE POLICY "Paid employers can view purchased profiles"
ON public.rei_registry
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.talent_views tv
    WHERE tv.talent_x_user_id = rei_registry.x_user_id
    AND tv.employer_wallet = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text)
  )
);

-- Admins can view all profiles (must be authenticated)
CREATE POLICY "Admins can view all profiles"
ON public.rei_registry
FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));