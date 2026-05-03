
CREATE TABLE public.careers_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id text NOT NULL,
  job_title text NOT NULL,
  telegram text,
  twitter text,
  cv_path text,
  cv_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.careers_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit application"
ON public.careers_applications FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Anyone can view application counts"
ON public.careers_applications FOR SELECT
TO anon, authenticated
USING (true);

CREATE INDEX idx_careers_applications_job_id ON public.careers_applications(job_id);
