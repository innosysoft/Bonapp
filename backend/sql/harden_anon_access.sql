-- הקשחת גישת המפתח הציבורי (anon) ל-Supabase - ממצא A15 בדוח אבטחה 04.11.2026.
--
-- מצב לפני (נבדק בקריאה בלבד ב-06.11.2026 עם המפתח הציבורי):
--   * המפתח הציבורי קורא שורות מהטבלאות: student_qr_codes, pending_registrations (אסימוני אימות והאשים),
--     transactions, meal_transactions, menu_items, meal_schedules, parent_mobile_tokens (קישורי כניסה של הורים).
--   * הוא גם יכול להפעיל ישירות את charge_student_balance / credit_student_balance / apply_monthly_balance_reset
--     (כלומר לזכות/לחייב יתרה בלי לעבור בשרת).
--   * המפתח עצמו לא חשוף בקוד, בקבצים הנעקבים או בבאנדל הציבורי - זו הגנה לעומק למקרה שיודלף.
--
-- מה הסקריפט עושה (מוסיף הגנות בלבד, לא משנה נתונים):
--   1. RLS על כל טבלה ב-public. בלי policies = אין גישה ל-anon/authenticated. השרת משתמש ב-service_role
--      (עוקף RLS), ולכן האפליקציה ממשיכה לעבוד כרגיל.
--   2. מסיר policies קיימות שנותנות גישה ל-anon/authenticated/public (אם יש; זה מה שמאפשר כיום קריאה בחלק מהטבלאות).
--   3. מבטל הרשאת הרצה של פונקציות היתרה ל-anon/authenticated/PUBLIC; רק service_role מריץ אותן.
--   4. מבטל הרשאות טבלה ל-anon/authenticated (שכבה שנייה מעבר ל-RLS).
--
-- תנאי מוקדם (מתקיים נכון ל-06.11.2026): השרת משתמש ב-SUPABASE_SERVICE_ROLE_KEY בכל הקבצים
-- (server.js, middleware/auth.js, mobileRoutes.js - האחרון תוקן בגרסה e395e98).
--
-- HOW TO APPLY: הרץ ב-Supabase SQL Editor של פרויקט BonApp (לא של In-Desk!). אפשר להריץ שוב בלי נזק.
-- אימות אחרי ההרצה: node backend/scripts/check_anon_exposure.js  (אמור להדפיס "ANON CAN READ: (none)").
-- שחזור אם משהו נשבר: ראו הערות ROLLBACK בסוף הקובץ.

-- 1. RLS על כל הטבלאות
DO $$
DECLARE r record;
BEGIN
  FOR r IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', r.tablename);
  END LOOP;
END $$;

-- 2. הסרת policies פתוחות ל-anon / authenticated / public
DO $$
DECLARE p record;
BEGIN
  FOR p IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public' AND roles && ARRAY['anon', 'authenticated', 'public']::name[]
  LOOP
    EXECUTE format('DROP POLICY %I ON %I.%I', p.policyname, p.schemaname, p.tablename);
  END LOOP;
END $$;

-- 3. פונקציות היתרה: רק השרת (service_role)
REVOKE ALL ON FUNCTION public.charge_student_balance(UUID, NUMERIC, BOOLEAN, BOOLEAN, NUMERIC) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.credit_student_balance(UUID, NUMERIC) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.apply_monthly_balance_reset(UUID, UUID, INTEGER, INTEGER, NUMERIC, NUMERIC) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.charge_student_balance(UUID, NUMERIC, BOOLEAN, BOOLEAN, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.credit_student_balance(UUID, NUMERIC) TO service_role;
GRANT EXECUTE ON FUNCTION public.apply_monthly_balance_reset(UUID, UUID, INTEGER, INTEGER, NUMERIC, NUMERIC) TO service_role;

-- 4. הרשאות טבלה
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon, authenticated;

-- ROLLBACK (רק אם האפליקציה הפסיקה לעבוד, למשל קובץ שרת שנשאר על מפתח anon):
--   GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated;
--   (ו/או השבתת RLS לטבלה ספציפית: ALTER TABLE public.<table> DISABLE ROW LEVEL SECURITY;)
