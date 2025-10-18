-- Add wallet verification fields to cv_analyses table
ALTER TABLE cv_analyses 
ADD COLUMN IF NOT EXISTS wallet_address TEXT,
ADD COLUMN IF NOT EXISTS bluechip_verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS bluechip_score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS bluechip_details JSONB;