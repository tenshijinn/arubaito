-- Remove twitter_user_id from twitter_whitelist
ALTER TABLE twitter_whitelist DROP COLUMN IF EXISTS twitter_user_id;

-- Create table for whitelist submission requests
CREATE TABLE IF NOT EXISTS twitter_whitelist_submissions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  twitter_handle TEXT NOT NULL,
  x_user_id TEXT,
  display_name TEXT,
  profile_image_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  notes TEXT
);

-- Enable RLS
ALTER TABLE twitter_whitelist_submissions ENABLE ROW LEVEL SECURITY;

-- Allow anyone to submit and view their own submissions
CREATE POLICY "Anyone can submit whitelist requests"
  ON twitter_whitelist_submissions
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can view whitelist submissions"
  ON twitter_whitelist_submissions
  FOR SELECT
  USING (true);

-- Create index for faster lookups
CREATE INDEX idx_twitter_whitelist_submissions_handle ON twitter_whitelist_submissions(twitter_handle);
CREATE INDEX idx_twitter_whitelist_submissions_status ON twitter_whitelist_submissions(status);