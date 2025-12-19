-- Add RLS policy to allow users to view their points via x_user_id
CREATE POLICY "Users can view points by x_user_id" 
ON public.user_points 
FOR SELECT 
USING (x_user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'x_user_id'::text));

-- Update the existing user_points record to link the x_user_id
UPDATE public.user_points 
SET x_user_id = '1288555819248877568'
WHERE wallet_address = '9uWumeoGGTgnq7T2fR44tFotrog6FpPXgifQyryKuRbi';