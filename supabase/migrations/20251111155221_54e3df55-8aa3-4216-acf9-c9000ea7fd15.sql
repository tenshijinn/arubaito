-- Create job drafts table
CREATE TABLE job_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  title TEXT,
  description TEXT,
  requirements TEXT,
  company_name TEXT,
  compensation TEXT,
  deadline TIMESTAMPTZ,
  link TEXT,
  role_tags TEXT[],
  og_image TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'confirming', 'payment_pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create task drafts table
CREATE TABLE task_drafts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL,
  title TEXT,
  description TEXT,
  company_name TEXT,
  compensation TEXT,
  end_date TIMESTAMPTZ,
  link TEXT,
  role_tags TEXT[],
  og_image TEXT,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'confirming', 'payment_pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE job_drafts ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_drafts ENABLE ROW LEVEL SECURITY;

-- Policies for job_drafts: users can only see their own drafts
CREATE POLICY "Users can view own job drafts"
ON job_drafts FOR SELECT
USING (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));

CREATE POLICY "Users can insert own job drafts"
ON job_drafts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own job drafts"
ON job_drafts FOR UPDATE
USING (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));

CREATE POLICY "Users can delete own job drafts"
ON job_drafts FOR DELETE
USING (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));

-- Same policies for task_drafts
CREATE POLICY "Users can view own task drafts"
ON task_drafts FOR SELECT
USING (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));

CREATE POLICY "Users can insert own task drafts"
ON task_drafts FOR INSERT
WITH CHECK (true);

CREATE POLICY "Users can update own task drafts"
ON task_drafts FOR UPDATE
USING (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));

CREATE POLICY "Users can delete own task drafts"
ON task_drafts FOR DELETE
USING (wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));