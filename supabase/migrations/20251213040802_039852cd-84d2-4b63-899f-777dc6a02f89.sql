-- Create table for supperclub interest registrations
CREATE TABLE public.supperclub_interests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.supperclub_interests ENABLE ROW LEVEL SECURITY;

-- Allow inserts from anyone (public form)
CREATE POLICY "Anyone can register interest" 
ON public.supperclub_interests 
FOR INSERT 
WITH CHECK (true);

-- Only admins can view registrations
CREATE POLICY "Admins can view all interests" 
ON public.supperclub_interests 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));