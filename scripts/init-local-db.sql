CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE,
  bananas integer DEFAULT 0,
  eggs integer DEFAULT 0,
  balance numeric(12,2) DEFAULT 0,
  kyc_status text DEFAULT 'pending',
  kyc_submitted_at timestamptz,
  kyc_approved_at timestamptz,
  kyc_rejection_reason text,
  subscription text,
  referral_code text,
  is_admin boolean DEFAULT false,
  role text DEFAULT 'user',
  admin_granted_at timestamptz,
  admin_revoked_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- quick index for email lookups
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON public.users(email);
