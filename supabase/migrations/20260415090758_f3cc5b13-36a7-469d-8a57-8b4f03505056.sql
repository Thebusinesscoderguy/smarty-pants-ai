
-- Create school news/announcements table
CREATE TABLE public.school_news (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  school_id UUID NOT NULL REFERENCES public.school_accounts(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.school_teachers(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  link_title TEXT,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.school_news ENABLE ROW LEVEL SECURITY;

-- Teachers can manage their own posts
CREATE POLICY "Teachers can manage own news posts"
ON public.school_news
FOR ALL
TO authenticated
USING (
  teacher_id IN (
    SELECT id FROM public.school_teachers
    WHERE lower(email) = lower((auth.jwt() ->> 'email'::text))
    AND is_active = true
  )
)
WITH CHECK (
  teacher_id IN (
    SELECT id FROM public.school_teachers
    WHERE lower(email) = lower((auth.jwt() ->> 'email'::text))
    AND is_active = true
  )
);

-- School admins can manage all news in their school
CREATE POLICY "School admins manage all news"
ON public.school_news
FOR ALL
TO authenticated
USING (
  school_id IN (
    SELECT id FROM public.school_accounts
    WHERE admin_user_id = auth.uid()
  )
)
WITH CHECK (
  school_id IN (
    SELECT id FROM public.school_accounts
    WHERE admin_user_id = auth.uid()
  )
);

-- Students enrolled in the school can view news
CREATE POLICY "Students can view school news"
ON public.school_news
FOR SELECT
TO authenticated
USING (
  school_id IN (
    SELECT school_id FROM public.school_student_relationships
    WHERE student_id = auth.uid() AND is_active = true
  )
);

-- Parents can view news for schools their children attend
CREATE POLICY "Parents can view school news"
ON public.school_news
FOR SELECT
TO authenticated
USING (
  school_id IN (
    SELECT ssr.school_id FROM public.school_student_relationships ssr
    JOIN public.parent_child_relationships pcr ON pcr.child_id = ssr.student_id
    WHERE pcr.parent_id = auth.uid() AND ssr.is_active = true
  )
);

-- Index for fast lookups
CREATE INDEX idx_school_news_school_id ON public.school_news(school_id);
CREATE INDEX idx_school_news_created_at ON public.school_news(created_at DESC);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION public.update_school_news_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_school_news_updated_at
BEFORE UPDATE ON public.school_news
FOR EACH ROW
EXECUTE FUNCTION public.update_school_news_updated_at();
