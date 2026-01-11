-- Create skill_categories table for dynamic AI-driven categorization
CREATE TABLE public.skill_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  keywords TEXT[] DEFAULT '{}',
  parent_category_id UUID REFERENCES public.skill_categories(id),
  job_count INTEGER DEFAULT 0,
  task_count INTEGER DEFAULT 0,
  talent_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT skill_categories_name_unique UNIQUE (name)
);

-- Index for fast keyword matching
CREATE INDEX idx_skill_categories_keywords ON public.skill_categories USING GIN(keywords);
CREATE INDEX idx_skill_categories_name_lower ON public.skill_categories(LOWER(name));

-- RLS policies
ALTER TABLE public.skill_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view skill categories" 
ON public.skill_categories 
FOR SELECT 
USING (true);

-- Trigger for updated_at
CREATE TRIGGER update_skill_categories_updated_at
  BEFORE UPDATE ON public.skill_categories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add skill_category_ids to jobs table
ALTER TABLE public.jobs ADD COLUMN skill_category_ids UUID[] DEFAULT '{}';
CREATE INDEX idx_jobs_skill_categories ON public.jobs USING GIN(skill_category_ids);

-- Add skill_category_ids to tasks table
ALTER TABLE public.tasks ADD COLUMN skill_category_ids UUID[] DEFAULT '{}';
CREATE INDEX idx_tasks_skill_categories ON public.tasks USING GIN(skill_category_ids);

-- Add skill_category_ids to rei_registry table
ALTER TABLE public.rei_registry ADD COLUMN skill_category_ids UUID[] DEFAULT '{}';
CREATE INDEX idx_rei_registry_skill_categories ON public.rei_registry USING GIN(skill_category_ids);