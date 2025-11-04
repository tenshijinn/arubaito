-- Create payment_references table for x402 payment tracking
CREATE TABLE public.payment_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  amount numeric NOT NULL,
  memo text,
  payer text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  payment_type text NOT NULL DEFAULT 'x402',
  tx_signature text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.payment_references ENABLE ROW LEVEL SECURITY;

-- Policy: Anyone can insert payment references (for creating payments)
CREATE POLICY "Anyone can insert payment references"
ON public.payment_references
FOR INSERT
WITH CHECK (true);

-- Policy: Users can view their own payment references
CREATE POLICY "Users can view their own payment references"
ON public.payment_references
FOR SELECT
USING (payer = ((current_setting('request.jwt.claims'::text, true))::json ->> 'wallet_address'::text));

-- Policy: Service role can manage all payment references
CREATE POLICY "Service role can manage all payment references"
ON public.payment_references
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Policy: Allow updates for payment verification
CREATE POLICY "Allow payment verification updates"
ON public.payment_references
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX idx_payment_references_reference ON public.payment_references(reference);
CREATE INDEX idx_payment_references_status ON public.payment_references(status);
CREATE INDEX idx_payment_references_payer ON public.payment_references(payer);
CREATE INDEX idx_payment_references_created_at ON public.payment_references(created_at DESC);

-- Add trigger for updating updated_at timestamp
CREATE TRIGGER update_payment_references_updated_at
BEFORE UPDATE ON public.payment_references
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();