-- Fix rei_registry RLS policies to restrict public access
DROP POLICY IF EXISTS "Anyone can insert rei registry" ON rei_registry;
DROP POLICY IF EXISTS "Anyone can view rei registry" ON rei_registry;
DROP POLICY IF EXISTS "Users can update own profile data" ON rei_registry;
DROP POLICY IF EXISTS "Users can update their own registration" ON rei_registry;

-- Create service role policy for edge function writes
CREATE POLICY "Service role can manage registry"
ON rei_registry FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

-- Create authenticated user policy for viewing
CREATE POLICY "Authenticated users can view profiles"
ON rei_registry FOR SELECT
USING (auth.role() = 'authenticated');

-- Fix race conditions by adding unique constraints on payment references
ALTER TABLE points_transactions 
ADD CONSTRAINT unique_points_solana_pay_reference 
UNIQUE (solana_pay_reference);

ALTER TABLE jobs 
ADD CONSTRAINT unique_job_solana_pay_reference 
UNIQUE (solana_pay_reference);

ALTER TABLE tasks 
ADD CONSTRAINT unique_task_solana_pay_reference 
UNIQUE (solana_pay_reference);

-- Create atomic increment function for user_points to prevent race conditions
CREATE OR REPLACE FUNCTION increment_user_points(
  p_wallet_address TEXT,
  p_points INTEGER
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO user_points (wallet_address, total_points)
  VALUES (p_wallet_address, p_points)
  ON CONFLICT (wallet_address) DO UPDATE
  SET total_points = user_points.total_points + p_points,
      updated_at = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;