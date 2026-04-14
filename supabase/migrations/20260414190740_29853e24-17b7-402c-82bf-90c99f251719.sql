
-- 1. Question Bank
CREATE TABLE public.question_bank (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID REFERENCES public.school_accounts(id) ON DELETE CASCADE,
  curriculum TEXT,
  grade_level TEXT,
  subject TEXT NOT NULL,
  question_text TEXT NOT NULL,
  answer TEXT NOT NULL,
  options JSONB DEFAULT '[]'::jsonb,
  difficulty TEXT DEFAULT 'medium' CHECK (difficulty IN ('easy','medium','hard')),
  tags TEXT[] DEFAULT '{}'::text[],
  question_type TEXT DEFAULT 'multiple_choice',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.question_bank ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view question bank" ON public.question_bank
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "School admins manage their question bank" ON public.question_bank
  FOR ALL TO authenticated USING (
    school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid())
  );
CREATE POLICY "Teachers manage their question bank" ON public.question_bank
  FOR ALL TO authenticated USING (created_by = auth.uid());

-- 2. Study Buddy Memory
CREATE TABLE public.study_buddy_memory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  memory_key TEXT NOT NULL,
  memory_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, memory_key)
);
ALTER TABLE public.study_buddy_memory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own memory" ON public.study_buddy_memory
  FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

-- 3. Parent-Teacher Threads
CREATE TABLE public.parent_teacher_threads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  teacher_id UUID REFERENCES public.school_teachers(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  school_id UUID REFERENCES public.school_accounts(id) ON DELETE CASCADE NOT NULL,
  last_message_at TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(parent_id, teacher_id, student_id)
);
ALTER TABLE public.parent_teacher_threads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parents view own threads" ON public.parent_teacher_threads
  FOR ALL TO authenticated USING (parent_id = auth.uid()) WITH CHECK (parent_id = auth.uid());
CREATE POLICY "Teachers view own threads" ON public.parent_teacher_threads
  FOR SELECT TO authenticated USING (
    teacher_id IN (SELECT id FROM public.school_teachers WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true)
  );
CREATE POLICY "School admins view all threads" ON public.parent_teacher_threads
  FOR SELECT TO authenticated USING (
    school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid())
  );

-- 4. Parent-Teacher Messages
CREATE TABLE public.parent_teacher_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  thread_id UUID REFERENCES public.parent_teacher_threads(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  message TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.parent_teacher_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Thread participants can view messages" ON public.parent_teacher_messages
  FOR SELECT TO authenticated USING (
    thread_id IN (
      SELECT id FROM public.parent_teacher_threads
      WHERE parent_id = auth.uid()
      OR teacher_id IN (SELECT id FROM public.school_teachers WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true)
    )
  );
CREATE POLICY "Thread participants can send messages" ON public.parent_teacher_messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND
    thread_id IN (
      SELECT id FROM public.parent_teacher_threads
      WHERE parent_id = auth.uid()
      OR teacher_id IN (SELECT id FROM public.school_teachers WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true)
    )
  );
CREATE POLICY "Recipients can mark messages read" ON public.parent_teacher_messages
  FOR UPDATE TO authenticated USING (
    thread_id IN (
      SELECT id FROM public.parent_teacher_threads
      WHERE parent_id = auth.uid()
      OR teacher_id IN (SELECT id FROM public.school_teachers WHERE lower(email) = lower(auth.jwt() ->> 'email') AND is_active = true)
    )
  );

-- 5. Referrals
CREATE TABLE public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  referred_email TEXT NOT NULL,
  referred_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','completed','rewarded')),
  reward_claimed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own referrals" ON public.referrals
  FOR SELECT TO authenticated USING (referrer_id = auth.uid() OR referred_id = auth.uid());
CREATE POLICY "Users create referrals" ON public.referrals
  FOR INSERT TO authenticated WITH CHECK (referrer_id = auth.uid());

-- 6. User Usage
CREATE TABLE public.user_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature TEXT NOT NULL,
  count INTEGER DEFAULT 0,
  period_start DATE NOT NULL DEFAULT date_trunc('month', CURRENT_DATE)::date,
  period_end DATE NOT NULL DEFAULT (date_trunc('month', CURRENT_DATE) + interval '1 month' - interval '1 day')::date,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, feature, period_start)
);
ALTER TABLE public.user_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own usage" ON public.user_usage
  FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System manages usage" ON public.user_usage
  FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Add columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code TEXT UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT false;

-- Generate referral codes for existing users
UPDATE public.profiles SET referral_code = substr(md5(id::text || now()::text), 1, 8) WHERE referral_code IS NULL;
