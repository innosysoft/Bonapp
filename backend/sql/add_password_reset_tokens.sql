-- "Forgot password" flow for the login screen: adds a one-time reset token + expiry
-- to the users table. Purely additive - does not touch existing columns or data.
--
-- HOW TO APPLY:
--   Run this script in the Supabase SQL Editor (same as the other scripts in backend/sql).
--   Must be applied BEFORE deploying the backend code that uses /api/forgot-password
--   and /api/reset-password, otherwise those endpoints will fail.

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS reset_token TEXT,
  ADD COLUMN IF NOT EXISTS reset_token_expires TIMESTAMPTZ;

-- Fast lookup by token during POST /api/reset-password.
CREATE INDEX IF NOT EXISTS idx_users_reset_token
  ON public.users(reset_token)
  WHERE reset_token IS NOT NULL;
