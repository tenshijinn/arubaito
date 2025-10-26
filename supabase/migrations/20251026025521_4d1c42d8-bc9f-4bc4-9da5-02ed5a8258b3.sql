-- Create jobs table
CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  role_tags TEXT[] DEFAULT '{}',
  compensation TEXT,
  employer_wallet TEXT NOT NULL,
  payment_tx_signature TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'filled'))
);

-- Create tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  link TEXT NOT NULL,
  role_tags TEXT[] DEFAULT '{}',
  compensation TEXT,
  employer_wallet TEXT NOT NULL,
  payment_tx_signature TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed', 'completed'))
);

-- Create talent_views table (tracks paid profile views)
CREATE TABLE public.talent_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employer_wallet TEXT NOT NULL,
  talent_x_user_id TEXT NOT NULL,
  payment_tx_signature TEXT NOT NULL UNIQUE,
  viewed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(employer_wallet, talent_x_user_id)
);

-- Create chat_conversations table
CREATE TABLE public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  wallet_address TEXT NOT NULL UNIQUE,
  user_type TEXT CHECK (user_type IN ('talent', 'employer')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create chat_messages table
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.talent_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policies for jobs
CREATE POLICY "Anyone can view active jobs"
  ON public.jobs FOR SELECT
  USING (status = 'active');

CREATE POLICY "Employers can insert their own jobs"
  ON public.jobs FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Employers can update their own jobs"
  ON public.jobs FOR UPDATE
  USING (employer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- RLS Policies for tasks
CREATE POLICY "Anyone can view active tasks"
  ON public.tasks FOR SELECT
  USING (status = 'active');

CREATE POLICY "Employers can insert their own tasks"
  ON public.tasks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Employers can update their own tasks"
  ON public.tasks FOR UPDATE
  USING (employer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- RLS Policies for talent_views
CREATE POLICY "Employers can view their own talent views"
  ON public.talent_views FOR SELECT
  USING (employer_wallet = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Employers can insert talent views"
  ON public.talent_views FOR INSERT
  WITH CHECK (true);

-- RLS Policies for chat_conversations
CREATE POLICY "Users can view their own conversations"
  ON public.chat_conversations FOR SELECT
  USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

CREATE POLICY "Users can insert their own conversations"
  ON public.chat_conversations FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Users can update their own conversations"
  ON public.chat_conversations FOR UPDATE
  USING (wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address');

-- RLS Policies for chat_messages
CREATE POLICY "Users can view their own messages"
  ON public.chat_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = conversation_id
      AND wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    )
  );

CREATE POLICY "Users can insert their own messages"
  ON public.chat_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE id = conversation_id
      AND wallet_address = current_setting('request.jwt.claims', true)::json->>'wallet_address'
    )
  );

-- Create indexes for performance
CREATE INDEX idx_jobs_employer ON public.jobs(employer_wallet);
CREATE INDEX idx_jobs_status ON public.jobs(status);
CREATE INDEX idx_tasks_employer ON public.tasks(employer_wallet);
CREATE INDEX idx_tasks_status ON public.tasks(status);
CREATE INDEX idx_talent_views_employer ON public.talent_views(employer_wallet);
CREATE INDEX idx_talent_views_talent ON public.talent_views(talent_x_user_id);
CREATE INDEX idx_chat_messages_conversation ON public.chat_messages(conversation_id);
CREATE INDEX idx_chat_conversations_wallet ON public.chat_conversations(wallet_address);

-- Create trigger for updating timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_jobs_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at
  BEFORE UPDATE ON public.tasks
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chat_conversations_updated_at
  BEFORE UPDATE ON public.chat_conversations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();