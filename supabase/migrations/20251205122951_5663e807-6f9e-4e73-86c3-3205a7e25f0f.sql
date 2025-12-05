-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.rei_registry;

-- Allow users to view their own profile
CREATE POLICY "Users can view own profile"
ON public.rei_registry
FOR SELECT
USING (
  wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text)
  OR x_user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'x_user_id'::text)
);

-- Allow employers who have paid to view specific talent profiles
CREATE POLICY "Paid employers can view purchased profiles"
ON public.rei_registry
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.talent_views tv
    WHERE tv.talent_x_user_id = rei_registry.x_user_id
    AND tv.employer_wallet = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text)
  )
);

-- Allow admins to view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.rei_registry
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));