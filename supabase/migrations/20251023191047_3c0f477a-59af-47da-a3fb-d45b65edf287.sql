-- Add unique constraint on wallet_address to support upsert operations
ALTER TABLE public.rei_registry 
ADD CONSTRAINT rei_registry_wallet_address_key UNIQUE (wallet_address);