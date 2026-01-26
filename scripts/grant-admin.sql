-- Replace the email below if needed
\set admin_email 'parrokitty@gmail.com'

-- 1) Confirm the auth user exists (returns id if present)
SELECT id, email, email_confirmed_at FROM auth.users WHERE email = :'admin_email';

-- 2) Mark auth user as confirmed (so login isn't blocked by confirmation)
UPDATE auth.users
SET email_confirmed_at = now()
WHERE email = :'admin_email';

-- 3) Optional: Add simple admin markers into auth user metadata (some apps check this)
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{is_admin}', 'true'::jsonb, true),
    raw_app_meta_data = jsonb_set(COALESCE(raw_app_meta_data, '{}'::jsonb), '{role}', '"admin"'::jsonb, true)
WHERE email = :'admin_email';

-- 4) Upsert a public.users row using the auth UID and set kyc_status = 'approved'
--    This will only insert if the auth user exists. If row exists, it updates the flags.
WITH a AS (
  SELECT id, email FROM auth.users WHERE email = :'admin_email'
)
INSERT INTO public.users (id, email, is_admin, role, kyc_status, kyc_approved_at, admin_granted_at, created_at)
SELECT a.id, a.email, true, 'admin', 'approved', now(), now(), now()
FROM a
ON CONFLICT (id) DO UPDATE
  SET is_admin = TRUE,
      role = 'admin',
      kyc_status = 'approved',
      kyc_approved_at = now(),
      admin_granted_at = now(),
      email = EXCLUDED.email;

-- 5) Verify
SELECT p.id, p.email, p.is_admin, p.role, p.kyc_status, p.kyc_approved_at, a.email_confirmed_at
FROM public.users p
LEFT JOIN auth.users a ON p.id = a.id
WHERE p.email = :'admin_email';

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Ensure email uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

-- Upsert admin by email (local DB only)
INSERT INTO public.users (id, email, is_admin, role, kyc_status, kyc_approved_at, admin_granted_at, created_at)
VALUES (
  COALESCE((SELECT id FROM public.users WHERE email = 'parrokitty@gmail.com'), gen_random_uuid()),
  'parrokitty@gmail.com',
  true,
  'admin',
  'approved',
  now(),
  now(),
  now()
)
ON CONFLICT (email) DO UPDATE
  SET is_admin = TRUE,
      role = 'admin',
      kyc_status = 'approved',
      kyc_approved_at = now(),
      admin_granted_at = now(),
      email = EXCLUDED.email;

SELECT id, email, is_admin, role, kyc_status FROM public.users WHERE email = 'parrokitty@gmail.com';
