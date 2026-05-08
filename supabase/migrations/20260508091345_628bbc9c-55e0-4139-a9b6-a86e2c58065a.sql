-- =========================================
-- 1. ATTENDANCE
-- =========================================
CREATE TABLE public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  section_id uuid REFERENCES public.school_sections(id) ON DELETE SET NULL,
  school_id uuid NOT NULL REFERENCES public.school_accounts(id) ON DELETE CASCADE,
  date date NOT NULL,
  period int,
  status text NOT NULL CHECK (status IN ('present','absent','late','excused')),
  notes text,
  marked_by uuid,
  marked_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(student_id, date, period)
);
CREATE INDEX idx_attendance_section_date ON public.attendance_records(section_id, date);
CREATE INDEX idx_attendance_student_date ON public.attendance_records(student_id, date);
ALTER TABLE public.attendance_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage attendance" ON public.attendance_records FOR ALL
  USING (school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid()))
  WITH CHECK (school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid()));

CREATE POLICY "Teachers manage attendance for assigned sections" ON public.attendance_records FOR ALL
  USING (EXISTS (SELECT 1 FROM public.school_teachers t WHERE t.school_id = attendance_records.school_id AND lower(t.email) = lower((auth.jwt()->>'email'))))
  WITH CHECK (EXISTS (SELECT 1 FROM public.school_teachers t WHERE t.school_id = attendance_records.school_id AND lower(t.email) = lower((auth.jwt()->>'email'))));

CREATE POLICY "Students view own attendance" ON public.attendance_records FOR SELECT
  USING (student_id = auth.uid());

CREATE TABLE public.attendance_settings (
  school_id uuid PRIMARY KEY REFERENCES public.school_accounts(id) ON DELETE CASCADE,
  mode text NOT NULL DEFAULT 'daily' CHECK (mode IN ('daily','period')),
  periods_per_day int NOT NULL DEFAULT 1,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.attendance_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School admins manage attendance settings" ON public.attendance_settings FOR ALL
  USING (school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid()))
  WITH CHECK (school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid()));
CREATE POLICY "Authenticated read attendance settings" ON public.attendance_settings FOR SELECT TO authenticated USING (true);

-- =========================================
-- 2. REPORT CARDS
-- =========================================
CREATE TABLE public.report_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL,
  school_id uuid NOT NULL REFERENCES public.school_accounts(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.school_sections(id) ON DELETE SET NULL,
  term text NOT NULL,
  academic_year text NOT NULL,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  pdf_url text,
  published boolean NOT NULL DEFAULT false,
  generated_by uuid,
  generated_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz,
  UNIQUE(student_id, term, academic_year)
);
CREATE INDEX idx_report_cards_school ON public.report_cards(school_id);
CREATE INDEX idx_report_cards_student ON public.report_cards(student_id);
ALTER TABLE public.report_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage report cards" ON public.report_cards FOR ALL
  USING (school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid()))
  WITH CHECK (school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid()));
CREATE POLICY "Students view own published report cards" ON public.report_cards FOR SELECT
  USING (student_id = auth.uid() AND published = true);

CREATE TABLE public.report_card_settings (
  school_id uuid PRIMARY KEY REFERENCES public.school_accounts(id) ON DELETE CASCADE,
  school_name text,
  school_address text,
  principal_name text,
  letterhead_url text,
  signature_url text,
  grading_scale jsonb DEFAULT '[{"min":90,"grade":"A"},{"min":80,"grade":"B"},{"min":70,"grade":"C"},{"min":60,"grade":"D"},{"min":0,"grade":"F"}]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.report_card_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School admins manage report card settings" ON public.report_card_settings FOR ALL
  USING (school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid()))
  WITH CHECK (school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid()));
CREATE POLICY "Authenticated read report card settings" ON public.report_card_settings FOR SELECT TO authenticated USING (true);

-- =========================================
-- 3. SCHOOL STAFF / RBAC
-- =========================================
CREATE TABLE public.school_staff (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.school_accounts(id) ON DELETE CASCADE,
  user_id uuid,
  email text NOT NULL,
  full_name text,
  staff_role text NOT NULL CHECK (staff_role IN ('principal','vice_principal','registrar','accountant')),
  permissions jsonb DEFAULT '{}'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(school_id, email)
);
ALTER TABLE public.school_staff ENABLE ROW LEVEL SECURITY;
CREATE POLICY "School admins manage staff" ON public.school_staff FOR ALL
  USING (school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid()))
  WITH CHECK (school_id IN (SELECT id FROM public.school_accounts WHERE admin_user_id = auth.uid()));
CREATE POLICY "Staff view own record" ON public.school_staff FOR SELECT
  USING (user_id = auth.uid() OR lower(email) = lower((auth.jwt()->>'email')));

CREATE OR REPLACE FUNCTION public.get_school_staff_role(_user_id uuid, _email text)
RETURNS TABLE(school_id uuid, staff_role text, permissions jsonb)
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT s.school_id, s.staff_role, s.permissions
  FROM public.school_staff s
  WHERE s.is_active = true
    AND (s.user_id = _user_id OR lower(s.email) = lower(_email));
$$;