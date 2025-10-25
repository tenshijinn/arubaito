-- Add AI profile analysis columns to rei_registry table
ALTER TABLE public.rei_registry
ADD COLUMN profile_analysis jsonb,
ADD COLUMN analysis_summary text,
ADD COLUMN profile_score numeric;