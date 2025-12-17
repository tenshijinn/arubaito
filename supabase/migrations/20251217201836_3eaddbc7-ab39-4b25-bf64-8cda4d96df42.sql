-- Add expires_at column for signal TTL (7-30 days)
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS expires_at timestamp with time zone;

-- Add apply_url for external application links
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS apply_url text;

-- Create index for efficient signal queries
CREATE INDEX IF NOT EXISTS idx_jobs_source_expires ON public.jobs(source, expires_at) WHERE source = 'x_signal';

-- Create index for deduplication lookups
CREATE INDEX IF NOT EXISTS idx_jobs_external_id ON public.jobs(external_id) WHERE external_id IS NOT NULL;