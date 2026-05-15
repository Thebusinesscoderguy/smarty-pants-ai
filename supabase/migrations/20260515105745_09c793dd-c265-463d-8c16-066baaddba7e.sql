
CREATE TABLE IF NOT EXISTS public.school_invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES public.school_accounts(id) ON DELETE CASCADE,
  student_id UUID NOT NULL,
  parent_id UUID,
  title TEXT NOT NULL,
  description TEXT,
  amount_cents INTEGER NOT NULL CHECK (amount_cents >= 0),
  currency TEXT NOT NULL DEFAULT 'usd',
  status TEXT NOT NULL DEFAULT 'issued',
  due_date DATE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ,
  stripe_session_id TEXT,
  stripe_payment_intent_id TEXT,
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  notes TEXT,
  created_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_school_invoices_school ON public.school_invoices(school_id);
CREATE INDEX IF NOT EXISTS idx_school_invoices_student ON public.school_invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_school_invoices_parent ON public.school_invoices(parent_id);
CREATE INDEX IF NOT EXISTS idx_school_invoices_status ON public.school_invoices(status);

ALTER TABLE public.school_invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "School admins manage invoices"
ON public.school_invoices FOR ALL
USING (public.is_school_admin_of(auth.uid(), school_id))
WITH CHECK (public.is_school_admin_of(auth.uid(), school_id));

CREATE POLICY "Parents view their children invoices"
ON public.school_invoices FOR SELECT
USING (
  parent_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.parent_child_relationships pcr
    WHERE pcr.parent_id = auth.uid() AND pcr.child_id = school_invoices.student_id
  )
);

CREATE POLICY "Students view own invoices"
ON public.school_invoices FOR SELECT
USING (student_id = auth.uid());

CREATE TRIGGER trg_school_invoices_updated_at
BEFORE UPDATE ON public.school_invoices
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
