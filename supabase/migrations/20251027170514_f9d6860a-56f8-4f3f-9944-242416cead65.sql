-- Extend rei_registry table with professional profile fields
ALTER TABLE public.rei_registry
ADD COLUMN IF NOT EXISTS bio text,
ADD COLUMN IF NOT EXISTS skills jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS work_experience jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS portfolio_links text;

-- Create policy allowing verified members to view other verified profiles
CREATE POLICY "Verified members can view other verified profiles"
ON public.rei_registry
FOR SELECT
USING (
  verified = true AND
  EXISTS (
    SELECT 1 FROM public.rei_registry AS viewer
    WHERE viewer.wallet_address = (current_setting('request.jwt.claims'::text, true)::json->>'wallet_address')
    AND viewer.verified = true
  )
);

-- Create policy for users to update their own profile data
CREATE POLICY "Users can update own profile data"
ON public.rei_registry
FOR UPDATE
USING (wallet_address = (current_setting('request.jwt.claims'::text, true)::json->>'wallet_address'))
WITH CHECK (wallet_address = (current_setting('request.jwt.claims'::text, true)::json->>'wallet_address'));