-- Create cv_portfolio_images table for storing portfolio images per CV analysis
CREATE TABLE public.cv_portfolio_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  analysis_id UUID NOT NULL REFERENCES public.cv_analyses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  image_path TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cv_portfolio_images ENABLE ROW LEVEL SECURITY;

-- Users can view portfolio images of any CV they can view
CREATE POLICY "Users can view their own portfolio images"
ON public.cv_portfolio_images
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Users can insert their own portfolio images
CREATE POLICY "Users can insert their own portfolio images"
ON public.cv_portfolio_images
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own portfolio images
CREATE POLICY "Users can delete their own portfolio images"
ON public.cv_portfolio_images
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create storage bucket for portfolio images (public for easy display)
INSERT INTO storage.buckets (id, name, public) VALUES ('cv-portfolio', 'cv-portfolio', true);

-- Storage policies for portfolio images
CREATE POLICY "Users can upload portfolio images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'cv-portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Anyone can view portfolio images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'cv-portfolio');

CREATE POLICY "Users can delete their own portfolio images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'cv-portfolio' AND auth.uid()::text = (storage.foldername(name))[1]);