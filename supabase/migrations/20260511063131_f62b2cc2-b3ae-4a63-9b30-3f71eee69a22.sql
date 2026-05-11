
-- Assignments
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  section_id uuid,
  subject_id uuid,
  created_by uuid NOT NULL,
  title text NOT NULL,
  description text,
  due_date timestamptz,
  total_points numeric NOT NULL DEFAULT 100,
  attachment_urls text[] NOT NULL DEFAULT '{}',
  allow_late boolean NOT NULL DEFAULT true,
  late_penalty_pct numeric NOT NULL DEFAULT 0,
  published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;

CREATE TABLE public.assignment_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_id uuid NOT NULL,
  content text,
  attachment_urls text[] NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'draft',
  score numeric,
  feedback text,
  graded_by uuid,
  graded_at timestamptz,
  submitted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (assignment_id, student_id)
);
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_assignments_school ON public.assignments(school_id);
CREATE INDEX idx_assignments_section ON public.assignments(section_id);
CREATE INDEX idx_subs_assignment ON public.assignment_submissions(assignment_id);
CREATE INDEX idx_subs_student ON public.assignment_submissions(student_id);

-- Helper: is school admin
CREATE OR REPLACE FUNCTION public.is_school_admin_of(_user_id uuid, _school_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.school_accounts WHERE id = _school_id AND admin_user_id = _user_id);
$$;

-- RLS assignments
CREATE POLICY "School admin manages assignments" ON public.assignments FOR ALL
  USING (public.is_school_admin_of(auth.uid(), school_id))
  WITH CHECK (public.is_school_admin_of(auth.uid(), school_id));

CREATE POLICY "Teacher manages own assignments" ON public.assignments FOR ALL
  USING (created_by = auth.uid())
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Students view published assignments in their section" ON public.assignments FOR SELECT
  USING (
    published = true AND EXISTS (
      SELECT 1 FROM public.section_students ss
      WHERE ss.section_id = assignments.section_id AND ss.student_id = auth.uid()
    )
  );

-- RLS submissions
CREATE POLICY "Students manage own submissions" ON public.assignment_submissions FOR ALL
  USING (student_id = auth.uid())
  WITH CHECK (student_id = auth.uid());

CREATE POLICY "Teacher views/grades submissions for own assignments" ON public.assignment_submissions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.created_by = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND a.created_by = auth.uid()));

CREATE POLICY "School admin views all submissions" ON public.assignment_submissions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND public.is_school_admin_of(auth.uid(), a.school_id)))
  WITH CHECK (EXISTS (SELECT 1 FROM public.assignments a WHERE a.id = assignment_id AND public.is_school_admin_of(auth.uid(), a.school_id)));

CREATE TRIGGER trg_assignments_updated BEFORE UPDATE ON public.assignments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER trg_subs_updated BEFORE UPDATE ON public.assignment_submissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket
INSERT INTO storage.buckets (id, name, public) VALUES ('assignments', 'assignments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users upload to own assignment folder" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'assignments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users read own assignment files" ON storage.objects FOR SELECT
  USING (bucket_id = 'assignments' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users delete own assignment files" ON storage.objects FOR DELETE
  USING (bucket_id = 'assignments' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Report card templates + settings extensions
CREATE TABLE public.report_card_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL,
  name text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  layout_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.report_card_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admin manages templates" ON public.report_card_templates FOR ALL
  USING (public.is_school_admin_of(auth.uid(), school_id))
  WITH CHECK (public.is_school_admin_of(auth.uid(), school_id));

CREATE POLICY "Members view templates" ON public.report_card_templates FOR SELECT
  USING (true);

CREATE TRIGGER trg_rct_updated BEFORE UPDATE ON public.report_card_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Extend report_card_settings (idempotent)
ALTER TABLE public.report_card_settings
  ADD COLUMN IF NOT EXISTS layout_config jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS header_logo_url text,
  ADD COLUMN IF NOT EXISTS footer_text text,
  ADD COLUMN IF NOT EXISTS accent_color text DEFAULT '#f97316',
  ADD COLUMN IF NOT EXISTS font_family text DEFAULT 'helvetica';
