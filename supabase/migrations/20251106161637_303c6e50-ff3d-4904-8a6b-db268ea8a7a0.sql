-- Add indexes for community-contributed jobs and tasks for better performance
CREATE INDEX IF NOT EXISTS idx_jobs_source ON jobs(source) WHERE source = 'community_contributed';
CREATE INDEX IF NOT EXISTS idx_tasks_source ON tasks(source) WHERE source = 'community_contributed';