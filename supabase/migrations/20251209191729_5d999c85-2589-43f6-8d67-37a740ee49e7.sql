-- Drop existing SELECT policies on rei_registry
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.rei_registry;
DROP POLICY IF EXISTS "Paid employers can view purchased profiles" ON public.rei_registry;
DROP POLICY IF EXISTS "Users can view own profile" ON public.rei_registry;

-- Recreate policies with TO authenticated to block anonymous access

-- Admins can view all profiles (authenticated only)
CREATE POLICY "Admins can view all profiles"
ON public.rei_registry
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Paid employers can view profiles they've purchased (authenticated only)
CREATE POLICY "Paid employers can view purchased profiles"
ON public.rei_registry
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM talent_views tv
    WHERE tv.talent_x_user_id = rei_registry.x_user_id
    AND tv.employer_wallet = (
      (current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'
    )
  )
);

-- Users can view their own profile (authenticated only)
CREATE POLICY "Users can view own profile"
ON public.rei_registry
FOR SELECT
TO authenticated
USING (
  wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address')
  OR x_user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'x_user_id')
);