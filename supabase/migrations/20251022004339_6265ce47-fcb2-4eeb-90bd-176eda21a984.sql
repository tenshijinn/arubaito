-- Create enum for verification types
CREATE TYPE public.verification_type AS ENUM (
  'followed_by_web3_project',
  'kol',
  'thought_leader',
  'web3_founder'
);

-- Create whitelist table for verified Twitter accounts
CREATE TABLE public.twitter_whitelist (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  twitter_handle TEXT NOT NULL UNIQUE,
  twitter_user_id TEXT UNIQUE,
  verification_type verification_type NOT NULL,
  notes TEXT,
  verified_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.twitter_whitelist ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can read the whitelist (to check verification)
CREATE POLICY "Anyone can read twitter whitelist"
ON public.twitter_whitelist
FOR SELECT
USING (true);

-- Policy: Only admins can insert/update whitelist (will be enforced via edge function)
CREATE POLICY "Service role can manage whitelist"
ON public.twitter_whitelist
FOR ALL
USING (auth.jwt()->>'role' = 'service_role');

-- Add trigger for updated_at
CREATE TRIGGER update_twitter_whitelist_updated_at
  BEFORE UPDATE ON public.twitter_whitelist
  FOR EACH ROW
  EXECUTE FUNCTION update_rei_registry_updated_at();

-- Add indexes for performance
CREATE INDEX idx_twitter_whitelist_handle ON public.twitter_whitelist(twitter_handle);
CREATE INDEX idx_twitter_whitelist_user_id ON public.twitter_whitelist(twitter_user_id);

-- Update rei_registry to make Twitter fields nullable (since verification happens first)
ALTER TABLE public.rei_registry ALTER COLUMN x_user_id DROP NOT NULL;
ALTER TABLE public.rei_registry ALTER COLUMN handle DROP NOT NULL;
ALTER TABLE public.rei_registry ALTER COLUMN display_name DROP NOT NULL;