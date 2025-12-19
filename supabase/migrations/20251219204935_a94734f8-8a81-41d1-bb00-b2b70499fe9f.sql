-- Add 'manual' to the verification_type enum if it doesn't exist
ALTER TYPE public.verification_type ADD VALUE IF NOT EXISTS 'manual';

-- Add RLS policy for admins to manage the twitter whitelist
CREATE POLICY "Admins can manage whitelist" 
ON public.twitter_whitelist 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));