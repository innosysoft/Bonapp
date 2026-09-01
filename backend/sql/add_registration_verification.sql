-- Auto email-verification for parent registration (replaces the secretary-approval
-- gate for new signups going forward). Purely additive - existing columns, existing
-- pending_registrations rows, and the existing approve/reject flow are untouched.
--
-- HOW TO APPLY:
--   Run this script in the Supabase SQL Editor (same as the other scripts in backend/sql).
--   Must be applied BEFORE deploying the backend code that uses the new
--   POST /api/pending-registrations password field, GET /api/verify-registration/:token,
--   and the secretary "block family" endpoints.

ALTER TABLE public.pending_registrations
  ADD COLUMN IF NOT EXISTS password_hash TEXT,
  ADD COLUMN IF NOT EXISTS verification_token TEXT,
  ADD COLUMN IF NOT EXISTS verification_token_expires TIMESTAMPTZ;

-- Fast lookup by token during GET /api/verify-registration/:token.
CREATE INDEX IF NOT EXISTS idx_pending_registrations_verification_token
  ON public.pending_registrations(verification_token)
  WHERE verification_token IS NOT NULL;

-- Needed for the secretary "block family" action. Defaults every existing user
-- (parents, secretaries, kitchen, admins - everyone) to 'active', so no current
-- account is affected. Only rows a secretary explicitly blocks going forward will
-- ever hold 'blocked'.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active';
