-- Create referral_codes table
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address text UNIQUE NOT NULL,
  x_user_id text,
  referral_code text UNIQUE NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  is_active boolean NOT NULL DEFAULT true
);

-- Create referral_clicks table with click_date column for deduplication
CREATE TABLE public.referral_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code text NOT NULL,
  clicked_at timestamptz NOT NULL DEFAULT now(),
  click_date date NOT NULL DEFAULT CURRENT_DATE,
  ip_hash text NOT NULL,
  user_agent_hash text,
  source_url text,
  target_path text,
  session_id text NOT NULL,
  points_awarded boolean NOT NULL DEFAULT false
);

-- Create referral_conversions table
CREATE TABLE public.referral_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referral_code text NOT NULL,
  conversion_type text NOT NULL CHECK (conversion_type IN ('registration', 'payment')),
  converted_wallet text NOT NULL,
  payment_amount numeric,
  points_awarded integer NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  click_id uuid REFERENCES public.referral_clicks(id)
);

-- Create indexes for performance
CREATE INDEX idx_referral_codes_wallet ON public.referral_codes(wallet_address);
CREATE INDEX idx_referral_codes_code ON public.referral_codes(referral_code);
CREATE INDEX idx_referral_clicks_code ON public.referral_clicks(referral_code);
CREATE INDEX idx_referral_clicks_session ON public.referral_clicks(session_id);
CREATE INDEX idx_referral_clicks_dedup ON public.referral_clicks(referral_code, ip_hash, click_date);
CREATE INDEX idx_referral_conversions_code ON public.referral_conversions(referral_code);
CREATE INDEX idx_referral_conversions_wallet ON public.referral_conversions(converted_wallet);

-- Enable RLS
ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.referral_conversions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for referral_codes
CREATE POLICY "Users can view their own referral code"
ON public.referral_codes FOR SELECT
USING (
  wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text)
  OR x_user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'x_user_id'::text)
);

CREATE POLICY "Service role can manage referral codes"
ON public.referral_codes FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Admins can view all referral codes"
ON public.referral_codes FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for referral_clicks
CREATE POLICY "Service role can manage referral clicks"
ON public.referral_clicks FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can view clicks for their referral code"
ON public.referral_clicks FOR SELECT
USING (
  referral_code IN (
    SELECT rc.referral_code FROM public.referral_codes rc
    WHERE rc.wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text)
    OR rc.x_user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'x_user_id'::text)
  )
);

CREATE POLICY "Admins can view all referral clicks"
ON public.referral_clicks FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS Policies for referral_conversions
CREATE POLICY "Service role can manage referral conversions"
ON public.referral_conversions FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

CREATE POLICY "Users can view conversions for their referral code"
ON public.referral_conversions FOR SELECT
USING (
  referral_code IN (
    SELECT rc.referral_code FROM public.referral_codes rc
    WHERE rc.wallet_address = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text)
    OR rc.x_user_id = ((current_setting('request.jwt.claims'::text, true))::json ->> 'x_user_id'::text)
  )
);

CREATE POLICY "Admins can view all referral conversions"
ON public.referral_conversions FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));