
CREATE TABLE public.block_clock_config (
  id integer NOT NULL DEFAULT 1 PRIMARY KEY,
  start_block bigint NOT NULL DEFAULT 0,
  target_blocks bigint NOT NULL DEFAULT 1000000,
  start_timestamp timestamptz NOT NULL DEFAULT now(),
  signup_window_minutes integer NOT NULL DEFAULT 60,
  is_unlocked boolean NOT NULL DEFAULT false,
  unlocked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.block_clock_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view block clock config"
  ON public.block_clock_config FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admins can manage block clock config"
  ON public.block_clock_config FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage block clock config"
  ON public.block_clock_config FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

INSERT INTO public.block_clock_config (id, start_block, target_blocks, start_timestamp)
VALUES (1, 0, 1000000, now());

CREATE TABLE public.block_clock_reminders (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  notified boolean NOT NULL DEFAULT false
);

ALTER TABLE public.block_clock_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe to reminders"
  ON public.block_clock_reminders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view reminders"
  ON public.block_clock_reminders FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Service role can manage reminders"
  ON public.block_clock_reminders FOR ALL
  TO public
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');
