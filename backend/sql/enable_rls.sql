-- Enable Row Level Security on sensitive tables.
--
-- The backend talks to Supabase over the anon key today, so PostgREST
-- currently grants it whatever the default table grants allow (usually
-- full CRUD). If that anon key ever leaks (client bundle, log, etc.),
-- anyone can read/write these tables directly via the PostgREST API.
--
-- HOW TO APPLY:
--   1. Get the service_role key from Supabase Dashboard -> Project Settings -> API.
--   2. Add it to backend/.env as SUPABASE_SERVICE_ROLE_KEY=<key>.
--      (server.js already prefers SUPABASE_SERVICE_ROLE_KEY over SUPABASE_ANON_KEY
--      if it's set, and falls back to the anon key otherwise, so the app keeps
--      working before and after this migration.)
--   3. Restart the backend (pm2 restart bonapp-api) so it picks up the new key.
--   4. Run this script in the Supabase SQL Editor.
--
-- After this runs: the service_role key (used only by the backend, never
-- shipped to the browser) bypasses RLS as normal, so the app keeps working
-- unchanged. The anon/authenticated Postgres roles get zero access to these
-- tables since RLS is enabled with no policies defined for them -- direct
-- PostgREST access with just the anon key is blocked.

ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.study_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grade_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_menu ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tutorial_videos ENABLE ROW LEVEL SECURITY;
