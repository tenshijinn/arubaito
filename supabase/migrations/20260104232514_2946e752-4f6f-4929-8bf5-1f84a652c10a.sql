-- Seed job_sources with the three RSS feeds
INSERT INTO job_sources (name, type, config, is_active) VALUES
('Crypto Tasks Feed', 'rss', '{"url": "https://rss.app/feeds/_C0zO8Iow4tqAss7u.xml", "target_table": "tasks"}', true),
('Crypto Jobs Feed', 'rss', '{"url": "https://rss.app/feeds/_k7AQyIypli69cyZK.xml", "target_table": "jobs"}', true),
('AskRei Mentions Feed', 'rss', '{"url": "https://rss.app/feeds/r3YhNgA9gWSEkSgA.xml", "target_table": "mentions"}', true)
ON CONFLICT DO NOTHING;

-- Add rate limit tracking columns to oracle_processed_tweets
ALTER TABLE oracle_processed_tweets 
ADD COLUMN IF NOT EXISTS request_date date DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS daily_count integer DEFAULT 1;

-- Create index for efficient rate limit lookups
CREATE INDEX IF NOT EXISTS idx_oracle_author_date 
ON oracle_processed_tweets (author_handle, request_date);