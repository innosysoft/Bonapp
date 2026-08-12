-- Tracks which calendar months a student's monthly meal package has been paid for.
--
-- Replaces trying to track a decrementing "days remaining" balance for monthly-package
-- students. A row here means "this student is paid up for this calendar month" - the
-- parent-facing UI just checks whether a row exists for the current month (שולם / לא שולם),
-- no daily cron job needed. Actual meal consumption is tracked separately in `transactions`
-- as before (type = 'meal'), independent of package payment status.
--
-- HOW TO APPLY:
--   Run this script in the Supabase SQL Editor (same as backend/sql/enable_rls.sql).

CREATE TABLE IF NOT EXISTS public.monthly_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  school_id UUID NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, year, month)
);

CREATE INDEX IF NOT EXISTS idx_monthly_payments_student_period
  ON public.monthly_payments (student_id, year, month);

ALTER TABLE public.monthly_payments ENABLE ROW LEVEL SECURITY;
