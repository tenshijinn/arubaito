
CREATE TABLE public.guest_list_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  twitter_handle text NOT NULL,
  checked_at timestamptz NOT NULL DEFAULT now(),
  result_found boolean NOT NULL DEFAULT false,
  followed_by text
);
ALTER TABLE public.guest_list_checks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Service role can manage checks" ON public.guest_list_checks FOR ALL USING (auth.role() = 'service_role'::text);

ALTER TABLE public.twitter_whitelist ADD COLUMN twitter_user_id text;
