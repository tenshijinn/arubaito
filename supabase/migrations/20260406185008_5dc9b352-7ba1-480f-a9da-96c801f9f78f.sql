CREATE TABLE public.club_verifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  verified boolean DEFAULT true,
  cv_score numeric,
  bluechip_verified boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.club_verifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification" ON public.club_verifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own verification" ON public.club_verifications
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Service role full access" ON public.club_verifications
  FOR ALL USING (auth.role() = 'service_role');

CREATE TRIGGER update_club_verifications_updated_at
  BEFORE UPDATE ON public.club_verifications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();