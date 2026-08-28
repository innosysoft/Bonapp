-- Adds a short explanation field to tutorial videos, shown under the title on the support page.
--
-- HOW TO APPLY:
--   Run this script in the Supabase SQL Editor (same as the other scripts in backend/sql).

ALTER TABLE public.tutorial_videos
  ADD COLUMN IF NOT EXISTS description TEXT;
