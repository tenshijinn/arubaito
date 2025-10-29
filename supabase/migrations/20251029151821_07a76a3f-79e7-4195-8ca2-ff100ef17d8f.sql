-- Phase 1: Add columns to existing jobs and tasks tables for internal team uploads
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS og_image text,
ADD COLUMN IF NOT EXISTS link text,
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS external_id text;

ALTER TABLE public.tasks
ADD COLUMN IF NOT EXISTS og_image text,
ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS external_id text;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_external_id ON public.jobs(external_id) WHERE external_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_external_id ON public.tasks(external_id) WHERE external_id IS NOT NULL;

-- Phase 1: Create job_sources table for RSS/API configuration
CREATE TABLE IF NOT EXISTS public.job_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  type text NOT NULL CHECK (type IN ('rss', 'api', 'manual')),
  config jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_active boolean DEFAULT true,
  last_synced_at timestamp with time zone,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.job_sources ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for job_sources
DROP POLICY IF EXISTS "Admins can manage job sources" ON public.job_sources;
CREATE POLICY "Admins can manage job sources"
ON public.job_sources
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Phase 2: Create community_submissions table
CREATE TABLE IF NOT EXISTS public.community_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_type text NOT NULL CHECK (submission_type IN ('job', 'task')),
  submitter_wallet text NOT NULL,
  submitter_x_user_id text,
  title text NOT NULL,
  description text NOT NULL,
  link text NOT NULL,
  og_image text,
  compensation text,
  role_tags text[] DEFAULT '{}',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'duplicate')),
  duplicate_of uuid,
  points_awarded integer DEFAULT 0,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamp with time zone,
  rejection_reason text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.community_submissions ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for community_submissions
DROP POLICY IF EXISTS "Users can view their own submissions" ON public.community_submissions;
DROP POLICY IF EXISTS "Anyone can insert submissions" ON public.community_submissions;
DROP POLICY IF EXISTS "Admins can manage all submissions" ON public.community_submissions;

CREATE POLICY "Users can view their own submissions"
ON public.community_submissions
FOR SELECT
TO authenticated
USING (submitter_wallet = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));

CREATE POLICY "Anyone can insert submissions"
ON public.community_submissions
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Admins can manage all submissions"
ON public.community_submissions
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Phase 2: Create user_points table
CREATE TABLE IF NOT EXISTS public.user_points (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  x_user_id text,
  total_points integer DEFAULT 0,
  points_pending integer DEFAULT 0,
  lifetime_earnings_sol numeric DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_points ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for user_points
DROP POLICY IF EXISTS "Users can view their own points" ON public.user_points;
DROP POLICY IF EXISTS "Users can insert their own points" ON public.user_points;
DROP POLICY IF EXISTS "Admins can manage all points" ON public.user_points;

CREATE POLICY "Users can view their own points"
ON public.user_points
FOR SELECT
TO authenticated
USING (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));

CREATE POLICY "Users can insert their own points"
ON public.user_points
FOR INSERT
TO authenticated
WITH CHECK (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));

CREATE POLICY "Admins can manage all points"
ON public.user_points
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Phase 2: Create points_transactions table
CREATE TABLE IF NOT EXISTS public.points_transactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  transaction_type text NOT NULL CHECK (transaction_type IN ('earned', 'converted', 'bonus')),
  points integer NOT NULL,
  submission_id uuid REFERENCES public.community_submissions(id),
  sol_amount numeric,
  tx_signature text,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.points_transactions ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for points_transactions
DROP POLICY IF EXISTS "Users can view their own transactions" ON public.points_transactions;
DROP POLICY IF EXISTS "Admins can view all transactions" ON public.points_transactions;

CREATE POLICY "Users can view their own transactions"
ON public.points_transactions
FOR SELECT
TO authenticated
USING (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));

CREATE POLICY "Admins can view all transactions"
ON public.points_transactions
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

-- Phase 2: Create rei_treasury_wallet table
CREATE TABLE IF NOT EXISTS public.rei_treasury_wallet (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text NOT NULL,
  balance_sol numeric DEFAULT 0,
  total_distributed numeric DEFAULT 0,
  last_updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.rei_treasury_wallet ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies for rei_treasury_wallet
DROP POLICY IF EXISTS "Anyone can view treasury" ON public.rei_treasury_wallet;
DROP POLICY IF EXISTS "Admins can manage treasury" ON public.rei_treasury_wallet;

CREATE POLICY "Anyone can view treasury"
ON public.rei_treasury_wallet
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Admins can manage treasury"
ON public.rei_treasury_wallet
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_submissions_status ON public.community_submissions(status);
CREATE INDEX IF NOT EXISTS idx_community_submissions_wallet ON public.community_submissions(submitter_wallet);
CREATE INDEX IF NOT EXISTS idx_points_transactions_wallet ON public.points_transactions(wallet_address);

-- Create triggers for updated_at columns
DROP TRIGGER IF EXISTS update_job_sources_updated_at ON public.job_sources;
CREATE TRIGGER update_job_sources_updated_at
BEFORE UPDATE ON public.job_sources
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_community_submissions_updated_at ON public.community_submissions;
CREATE TRIGGER update_community_submissions_updated_at
BEFORE UPDATE ON public.community_submissions
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_points_updated_at ON public.user_points;
CREATE TRIGGER update_user_points_updated_at
BEFORE UPDATE ON public.user_points
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();