-- Add Solana Pay fields to jobs table
ALTER TABLE jobs 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS deadline TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS solana_pay_reference TEXT UNIQUE;

-- Add Solana Pay fields to tasks table
ALTER TABLE tasks 
ADD COLUMN IF NOT EXISTS company_name TEXT,
ADD COLUMN IF NOT EXISTS end_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS solana_pay_reference TEXT UNIQUE;

-- Add Solana Pay tracking to points_transactions table
ALTER TABLE points_transactions
ADD COLUMN IF NOT EXISTS solana_pay_reference TEXT,
ADD COLUMN IF NOT EXISTS payment_token_mint TEXT,
ADD COLUMN IF NOT EXISTS payment_token_amount NUMERIC;

-- Create index for faster reference lookups
CREATE INDEX IF NOT EXISTS idx_jobs_solana_pay_reference ON jobs(solana_pay_reference);
CREATE INDEX IF NOT EXISTS idx_tasks_solana_pay_reference ON tasks(solana_pay_reference);
CREATE INDEX IF NOT EXISTS idx_points_solana_pay_reference ON points_transactions(solana_pay_reference);