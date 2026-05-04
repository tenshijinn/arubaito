create table if not exists public.twitter_cache (
  cache_key text primary key,
  handle text not null,
  followers integer not null default 0,
  tweet_count integer not null default 0,
  latest_tweet jsonb,
  source text,
  fetched_at timestamp with time zone not null default now(),
  expires_at timestamp with time zone not null,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now()
);

alter table public.twitter_cache enable row level security;

create index if not exists twitter_cache_expires_at_idx
  on public.twitter_cache (expires_at);

create trigger update_twitter_cache_updated_at
before update on public.twitter_cache
for each row
execute function public.update_updated_at_column();