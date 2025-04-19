
-- Create table for storing user avatar information
CREATE TABLE IF NOT EXISTS public.user_avatars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  description TEXT NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  CONSTRAINT user_avatars_user_id_key UNIQUE (user_id)
);

-- Add RLS policies
ALTER TABLE public.user_avatars ENABLE ROW LEVEL SECURITY;

-- Allow users to view only their own avatar
CREATE POLICY "Users can view their own avatar" 
  ON public.user_avatars
  FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to insert their own avatar
CREATE POLICY "Users can insert their own avatar" 
  ON public.user_avatars
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow users to update their own avatar
CREATE POLICY "Users can update their own avatar" 
  ON public.user_avatars
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Add a function to update the updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add trigger to update the updated_at column
CREATE TRIGGER update_user_avatars_updated_at
  BEFORE UPDATE ON public.user_avatars
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
