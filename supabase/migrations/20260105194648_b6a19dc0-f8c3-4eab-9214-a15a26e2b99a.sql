-- Add opportunity_type to jobs table
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS opportunity_type TEXT DEFAULT 'job';

-- Add opportunity_type to tasks table  
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS opportunity_type TEXT DEFAULT 'task';