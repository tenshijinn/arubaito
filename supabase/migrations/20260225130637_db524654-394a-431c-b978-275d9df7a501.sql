
CREATE TABLE public.ns_quiz_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  x_user_id text,
  twitter_handle text,
  device_fingerprint text NOT NULL,
  score numeric NOT NULL DEFAULT 0,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  passed boolean NOT NULL DEFAULT false,
  solana_wallet text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.ns_quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public insert for quiz submissions" 
ON public.ns_quiz_attempts FOR INSERT WITH CHECK (true);

CREATE POLICY "Public select to check fingerprint" 
ON public.ns_quiz_attempts FOR SELECT USING (true);

CREATE POLICY "Admins can manage quiz attempts" 
ON public.ns_quiz_attempts FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_ns_quiz_device_fingerprint ON public.ns_quiz_attempts(device_fingerprint);
