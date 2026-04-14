
-- Create user_streaks table
CREATE TABLE public.user_streaks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  total_active_days INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view their own streak"
ON public.user_streaks FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own streak"
ON public.user_streaks FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own streak"
ON public.user_streaks FOR UPDATE
USING (auth.uid() = user_id);

-- Function to update streak
CREATE OR REPLACE FUNCTION public.update_user_streak(p_user_id UUID)
RETURNS public.user_streaks
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result public.user_streaks;
  today DATE := CURRENT_DATE;
BEGIN
  INSERT INTO public.user_streaks (user_id, current_streak, longest_streak, last_active_date, total_active_days)
  VALUES (p_user_id, 1, 1, today, 1)
  ON CONFLICT (user_id) DO UPDATE SET
    current_streak = CASE
      WHEN user_streaks.last_active_date = today THEN user_streaks.current_streak
      WHEN user_streaks.last_active_date = today - 1 THEN user_streaks.current_streak + 1
      ELSE 1
    END,
    longest_streak = GREATEST(
      user_streaks.longest_streak,
      CASE
        WHEN user_streaks.last_active_date = today THEN user_streaks.current_streak
        WHEN user_streaks.last_active_date = today - 1 THEN user_streaks.current_streak + 1
        ELSE 1
      END
    ),
    total_active_days = CASE
      WHEN user_streaks.last_active_date = today THEN user_streaks.total_active_days
      ELSE user_streaks.total_active_days + 1
    END,
    last_active_date = today,
    updated_at = now()
  RETURNING * INTO result;
  
  RETURN result;
END;
$$;

-- Leaderboard view for XP rankings
CREATE OR REPLACE VIEW public.student_leaderboard AS
SELECT 
  p.id as user_id,
  p.display_name,
  p.avatar_url,
  COALESCE(us.current_streak, 0) as current_streak,
  COALESCE(us.longest_streak, 0) as longest_streak,
  COALESCE(us.total_active_days, 0) as total_active_days,
  COALESCE(quest_xp.xp, 0) as quest_xp,
  COALESCE(quiz_xp.xp, 0) as quiz_xp,
  (COALESCE(quest_xp.xp, 0) + COALESCE(quiz_xp.xp, 0) + COALESCE(us.total_active_days, 0) * 5) as total_xp
FROM profiles p
LEFT JOIN user_streaks us ON us.user_id = p.id
LEFT JOIN (
  SELECT user_id, COUNT(*) * 10 as xp
  FROM user_quest_progress
  WHERE completed = true
  GROUP BY user_id
) quest_xp ON quest_xp.user_id = p.id
LEFT JOIN (
  SELECT user_id, SUM(score) as xp
  FROM quiz_attempts
  GROUP BY user_id
) quiz_xp ON quiz_xp.user_id = p.id
WHERE p.leaderboard_visible = true OR p.leaderboard_visible IS NULL;
