
DROP POLICY IF EXISTS "Users can view their own verification codes" ON public.parent_verification_codes;

REVOKE SELECT (cardholder_name) ON public.invoice_payments FROM authenticated, anon;
