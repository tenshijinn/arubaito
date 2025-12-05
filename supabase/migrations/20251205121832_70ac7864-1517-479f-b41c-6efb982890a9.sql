-- Fix 1: Restrict twitter_whitelist_submissions to admins and owners only
DROP POLICY IF EXISTS "Anyone can view whitelist submissions" ON public.twitter_whitelist_submissions;

-- Admins can view all submissions
CREATE POLICY "Admins can view all submissions"
ON public.twitter_whitelist_submissions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own submission by x_user_id
CREATE POLICY "Users can view own submission"
ON public.twitter_whitelist_submissions
FOR SELECT
USING (x_user_id = ((current_setting('request.jwt.claims', true))::json ->> 'x_user_id'));

-- Admins can update submissions
CREATE POLICY "Admins can update submissions"
ON public.twitter_whitelist_submissions
FOR UPDATE
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Fix 2: Restrict payment_references updates to service role only
DROP POLICY IF EXISTS "Allow payment verification updates" ON public.payment_references;

-- Only service role can update payment references (via edge functions)
CREATE POLICY "Only service role can update payments"
ON public.payment_references
FOR UPDATE
USING ((auth.jwt() ->> 'role'::text) = 'service_role')
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role');