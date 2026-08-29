-- Self-service item kiosk: item images + student PIN identification.
-- Purely additive - does not touch existing columns, data, or the 'daily' menu_type flow.
--
-- HOW TO APPLY:
--   Run this script in the Supabase SQL Editor (same as the other scripts in backend/sql).

ALTER TABLE public.menu_items
  ADD COLUMN IF NOT EXISTS image_url TEXT;

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS pin TEXT;

-- A PIN only needs to be unique among students of the same school (kiosk is per-school).
CREATE UNIQUE INDEX IF NOT EXISTS idx_students_school_pin
  ON public.students(school_id, pin)
  WHERE pin IS NOT NULL;
