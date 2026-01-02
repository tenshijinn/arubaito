-- Create oracle_processed_tweets table for n8n deduplication and rate limiting
CREATE TABLE public.oracle_processed_tweets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  tweet_id TEXT NOT NULL UNIQUE,
  author_id TEXT,
  author_handle TEXT,
  tweet_text TEXT,
  intent TEXT CHECK (intent IN ('job_query', 'task', 'general', 'irrelevant', 'rss_item')),
  reply_tweet_id TEXT,
  processed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  replied_at TIMESTAMP WITH TIME ZONE
);

-- Create index for efficient 7-day window queries
CREATE INDEX idx_oracle_processed_tweets_processed_at ON public.oracle_processed_tweets (processed_at DESC);
CREATE INDEX idx_oracle_processed_tweets_tweet_id ON public.oracle_processed_tweets (tweet_id);
CREATE INDEX idx_oracle_processed_tweets_intent ON public.oracle_processed_tweets (intent);

-- Enable RLS
ALTER TABLE public.oracle_processed_tweets ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (for edge functions)
CREATE POLICY "Service role can manage oracle tweets"
ON public.oracle_processed_tweets
FOR ALL
USING ((auth.jwt() ->> 'role'::text) = 'service_role'::text)
WITH CHECK ((auth.jwt() ->> 'role'::text) = 'service_role'::text);

-- Allow admins to view for monitoring
CREATE POLICY "Admins can view oracle tweets"
ON public.oracle_processed_tweets
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));