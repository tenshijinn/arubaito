
CREATE TABLE public.club_member_showcase (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twitter_handle text NOT NULL UNIQUE,
  profile_image_url text,
  membership_type text NOT NULL DEFAULT 'whitelist',
  cv_score numeric,
  top_activities jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.club_member_showcase ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view showcase" ON public.club_member_showcase FOR SELECT USING (true);

CREATE POLICY "Service role manages showcase" ON public.club_member_showcase FOR ALL USING (auth.role() = 'service_role');
