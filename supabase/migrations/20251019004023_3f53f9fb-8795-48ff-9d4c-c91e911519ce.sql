-- Add scoring_details column to store detailed qualitative/quantitative breakdown
ALTER TABLE cv_analyses 
ADD COLUMN IF NOT EXISTS scoring_details JSONB;