CREATE TABLE public.invoice_payments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  invoice_id UUID NOT NULL REFERENCES public.school_invoices(id) ON DELETE CASCADE,
  paid_by UUID NOT NULL,
  cardholder_name TEXT NOT NULL,
  card_last4 TEXT NOT NULL,
  card_brand TEXT,
  amount_cents INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'usd',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_invoice_payments_invoice ON public.invoice_payments(invoice_id);

ALTER TABLE public.invoice_payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Payers can view their own payment records"
ON public.invoice_payments FOR SELECT
USING (auth.uid() = paid_by);

CREATE POLICY "School admins can view payments for their school invoices"
ON public.invoice_payments FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.school_invoices si
  JOIN public.school_accounts sa ON sa.id = si.school_id
  WHERE si.id = invoice_payments.invoice_id
    AND sa.admin_user_id = auth.uid()
));

CREATE POLICY "Authenticated users can record their own payments"
ON public.invoice_payments FOR INSERT
WITH CHECK (auth.uid() = paid_by);
