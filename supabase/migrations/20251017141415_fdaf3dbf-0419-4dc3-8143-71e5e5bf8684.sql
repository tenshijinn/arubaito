-- Create storage bucket for CV uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('cv-uploads', 'cv-uploads', false);

-- Create storage policies for CV uploads
CREATE POLICY "Users can upload their own CVs"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'cv-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own CVs"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'cv-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Create table for CV analysis results
CREATE TABLE public.cv_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  overall_score INTEGER NOT NULL,
  content_score INTEGER NOT NULL,
  structure_score INTEGER NOT NULL,
  formatting_score INTEGER NOT NULL,
  keywords_score INTEGER NOT NULL,
  experience_score INTEGER NOT NULL,
  feedback TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cv_analyses ENABLE ROW LEVEL SECURITY;

-- Create policies for CV analyses
CREATE POLICY "Users can view their own analyses"
ON public.cv_analyses
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own analyses"
ON public.cv_analyses
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_cv_analyses_user_id ON public.cv_analyses(user_id);
CREATE INDEX idx_cv_analyses_created_at ON public.cv_analyses(created_at DESC);