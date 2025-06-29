
-- Create task_shares table for sharing tasks between users
CREATE TABLE public.task_shares (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id UUID REFERENCES public.tasks(id) ON DELETE CASCADE NOT NULL,
  shared_by_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  shared_with_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  permission TEXT CHECK (permission IN ('view', 'edit')) DEFAULT 'view',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(task_id, shared_with_user_id)
);

-- Enable Row Level Security on task_shares
ALTER TABLE public.task_shares ENABLE ROW LEVEL SECURITY;

-- Update existing RLS policies for tasks to work with the new sharing system
DROP POLICY IF EXISTS "Users can view their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update their own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete their own tasks" ON public.tasks;

-- Profiles policies (allow users to view all profiles for sharing)
CREATE POLICY "Users can view all profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Tasks policies
CREATE POLICY "Users can view own tasks" ON public.tasks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view shared tasks" ON public.tasks
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.task_shares
      WHERE task_shares.task_id = tasks.id
      AND task_shares.shared_with_user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own tasks" ON public.tasks
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tasks" ON public.tasks
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can update shared tasks with edit permission" ON public.tasks
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.task_shares
      WHERE task_shares.task_id = tasks.id
      AND task_shares.shared_with_user_id = auth.uid()
      AND task_shares.permission = 'edit'
    )
  );

CREATE POLICY "Users can delete own tasks" ON public.tasks
  FOR DELETE USING (auth.uid() = user_id);

-- Task shares policies
CREATE POLICY "Users can view task shares they created" ON public.task_shares
  FOR SELECT USING (auth.uid() = shared_by_user_id);

CREATE POLICY "Users can view task shares made to them" ON public.task_shares
  FOR SELECT USING (auth.uid() = shared_with_user_id);

CREATE POLICY "Users can create task shares for their own tasks" ON public.task_shares
  FOR INSERT WITH CHECK (
    auth.uid() = shared_by_user_id AND
    EXISTS (
      SELECT 1 FROM public.tasks
      WHERE tasks.id = task_id AND tasks.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete task shares they created" ON public.task_shares
  FOR DELETE USING (auth.uid() = shared_by_user_id);
