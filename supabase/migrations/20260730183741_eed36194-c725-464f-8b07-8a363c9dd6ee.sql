CREATE TABLE public.block_clock_status (
  id INTEGER PRIMARY KEY DEFAULT 1,
  state TEXT NOT NULL DEFAULT 'countdown',
  current_block BIGINT NOT NULL DEFAULT 0,
  target_block BIGINT NOT NULL DEFAULT 0,
  blocks_remaining BIGINT NOT NULL DEFAULT 0,
  seconds_remaining BIGINT NOT NULL DEFAULT 0,
  time_remaining_human TEXT NOT NULL DEFAULT '',
  progress_percent NUMERIC NOT NULL DEFAULT 0,
  signup_open BOOLEAN NOT NULL DEFAULT false,
  signup_window_minutes INTEGER NOT NULL DEFAULT 60,
  signup_minutes_remaining INTEGER NOT NULL DEFAULT 0,
  unlocked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  CONSTRAINT block_clock_status_singleton CHECK (id = 1)
);

GRANT SELECT ON public.block_clock_status TO anon;
GRANT SELECT ON public.block_clock_status TO authenticated;
GRANT ALL ON public.block_clock_status TO service_role;

ALTER TABLE public.block_clock_status ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read block clock status"
ON public.block_clock_status
FOR SELECT
USING (true);

CREATE TRIGGER update_block_clock_status_updated_at
BEFORE UPDATE ON public.block_clock_status
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.block_clock_status (id) VALUES (1) ON CONFLICT (id) DO NOTHING;