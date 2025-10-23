-- Change score columns from integer to numeric to support decimal values
ALTER TABLE public.cv_analyses 
  ALTER COLUMN overall_score TYPE NUMERIC(5,2),
  ALTER COLUMN content_score TYPE NUMERIC(5,2),
  ALTER COLUMN structure_score TYPE NUMERIC(5,2),
  ALTER COLUMN formatting_score TYPE NUMERIC(5,2),
  ALTER COLUMN keywords_score TYPE NUMERIC(5,2),
  ALTER COLUMN experience_score TYPE NUMERIC(5,2),
  ALTER COLUMN bluechip_score TYPE NUMERIC(5,2);