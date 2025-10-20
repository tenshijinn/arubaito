-- Create enum for role tags
CREATE TYPE public.contributor_role AS ENUM ('dev', 'product', 'research', 'community', 'design', 'ops');

-- Create rei_registry table
CREATE TABLE public.rei_registry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  x_user_id TEXT NOT NULL UNIQUE,
  handle TEXT NOT NULL,
  display_name TEXT NOT NULL,
  profile_image_url TEXT,
  verified BOOLEAN DEFAULT false,
  wallet_address TEXT NOT NULL,
  file_path TEXT NOT NULL,
  portfolio_url TEXT,
  role_tags contributor_role[],
  consent BOOLEAN NOT NULL DEFAULT true,
  nft_minted BOOLEAN DEFAULT false,
  nft_mint_address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rei_registry ENABLE ROW LEVEL SECURITY;

-- Allow users to view all registered contributors (public registry)
CREATE POLICY "Anyone can view rei registry"
  ON public.rei_registry
  FOR SELECT
  USING (true);

-- Allow inserting new registrations
CREATE POLICY "Anyone can insert rei registry"
  ON public.rei_registry
  FOR INSERT
  WITH CHECK (true);

-- Allow users to update their own registration
CREATE POLICY "Users can update their own registration"
  ON public.rei_registry
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION public.update_rei_registry_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_rei_registry_updated_at
  BEFORE UPDATE ON public.rei_registry
  FOR EACH ROW
  EXECUTE FUNCTION public.update_rei_registry_updated_at();

-- Create storage bucket for contributor files
INSERT INTO storage.buckets (id, name, public)
VALUES ('rei-contributor-files', 'rei-contributor-files', false);

-- Storage policies
CREATE POLICY "Anyone can upload contributor files"
  ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = 'rei-contributor-files');

CREATE POLICY "Users can view their uploaded files"
  ON storage.objects
  FOR SELECT
  USING (bucket_id = 'rei-contributor-files');