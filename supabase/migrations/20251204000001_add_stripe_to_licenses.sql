-- Add Stripe-related columns to licenses table
ALTER TABLE public.licenses
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_licenses_stripe_customer 
ON public.licenses(stripe_customer_id);

CREATE INDEX IF NOT EXISTS idx_licenses_stripe_subscription 
ON public.licenses(stripe_subscription_id);

-- Add unique constraint to prevent duplicate subscriptions
ALTER TABLE public.licenses
ADD CONSTRAINT unique_stripe_subscription 
UNIQUE (stripe_subscription_id);
