
-- Add PayPal subscription ID field to the subscribers table
ALTER TABLE public.subscribers 
ADD COLUMN paypal_subscription_id TEXT;
