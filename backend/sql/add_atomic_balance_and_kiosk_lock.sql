-- תיקון בעיית תזמון (race condition) בעדכון יתרת תלמיד + נעילת קיוסק אופציונלית.
--
-- הבעיה שתוקנת: כל מקום שמעדכן יתרת תלמיד היה עושה "קרא יתרה -> חשב יתרה חדשה
-- בג'אווהסקריפט -> כתוב בחזרה" - שלוש פעולות נפרדות. אם שתי בקשות לאותו תלמיד
-- מתבצעות כמעט בו-זמנית (למשל שתי עמדות קופה, או הורה משלם וקופה מחייבת יחד),
-- שתיהן יכולות לקרוא את אותה יתרה לפני שהראשונה הספיקה לכתוב את התוצאה שלה,
-- וכתיבה אחת "דורסת" את השנייה - כסף נעלם או מוכפל בטעות.
--
-- הפתרון: שתי פונקציות Postgres (charge_student_balance / credit_student_balance)
-- שעושות את כל הפעולה (קריאה+בדיקה+כתיבה) בתוך פעולת מסד-נתונים אחת אטומית,
-- עם נעילת השורה (FOR UPDATE) לכל משך הפעולה - כך ששתי בקשות בו-זמנית לאותו
-- תלמיד מתבצעות אחת אחרי השנייה במקום לדרוס זו את זו.
--
-- HOW TO APPLY:
--   הרץ את הסקריפט הזה ב-Supabase SQL Editor (כמו שאר הסקריפטים ב-backend/sql).
--   חובה להריץ לפני פריסת הקוד שמשתמש בפונקציות/בטבלה/בעמודה האלה.

-- חיוב אטומי (הוצאת כסף - רכישת ארוחה). שומר בדיוק על אותה לוגיקת עסקים כמו
-- שהייתה בקוד: אם יש מספיק יתרה - מחייב. אם אין ו-forceOverride=true - מחייב
-- בכל מקרה (המשתמש כבר אישר). אם אין, allow_negative כבוי - דוחה. אם אין,
-- allow_negative דלוק אבל זה יעביר את המינוס המקסימלי - דוחה. אחרת - מחזיר
-- "requires_confirmation" בלי לחייב בפועל (בדיוק כמו קודם - מחכה לאישור הלקוח).
CREATE OR REPLACE FUNCTION public.charge_student_balance(
  p_student_id UUID,
  p_amount NUMERIC,
  p_force_override BOOLEAN,
  p_allow_negative BOOLEAN,
  p_max_negative NUMERIC
) RETURNS TABLE(result_status TEXT, current_balance NUMERIC, new_balance NUMERIC) AS $$
DECLARE
  v_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  SELECT balance INTO v_balance FROM public.students WHERE id = p_student_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'not_found'::TEXT, NULL::NUMERIC, NULL::NUMERIC;
    RETURN;
  END IF;

  v_balance := COALESCE(v_balance, 0);
  v_new_balance := v_balance - p_amount;

  IF v_balance < p_amount AND NOT p_force_override THEN
    IF p_allow_negative THEN
      IF v_new_balance < COALESCE(p_max_negative, 0) THEN
        RETURN QUERY SELECT 'insufficient_exceeds_max'::TEXT, v_balance, v_new_balance;
        RETURN;
      END IF;
      RETURN QUERY SELECT 'requires_confirmation'::TEXT, v_balance, v_new_balance;
      RETURN;
    ELSE
      RETURN QUERY SELECT 'insufficient_no_negative'::TEXT, v_balance, NULL::NUMERIC;
      RETURN;
    END IF;
  END IF;

  UPDATE public.students SET balance = v_new_balance WHERE id = p_student_id;
  RETURN QUERY SELECT 'ok'::TEXT, v_balance, v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- זיכוי אטומי (הכנסת כסף - תשלום הורה/מזכירה). פשוט יותר - תמיד מוסיף, אין
-- מצב דחייה.
CREATE OR REPLACE FUNCTION public.credit_student_balance(
  p_student_id UUID,
  p_amount NUMERIC
) RETURNS TABLE(result_status TEXT, new_balance NUMERIC) AS $$
DECLARE
  v_balance NUMERIC;
  v_new_balance NUMERIC;
BEGIN
  SELECT balance INTO v_balance FROM public.students WHERE id = p_student_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'not_found'::TEXT, NULL::NUMERIC;
    RETURN;
  END IF;

  v_new_balance := COALESCE(v_balance, 0) + p_amount;
  UPDATE public.students SET balance = v_new_balance WHERE id = p_student_id;
  RETURN QUERY SELECT 'ok'::TEXT, v_new_balance;
END;
$$ LANGUAGE plpgsql;

-- נעילת קיוסק אופציונלית (כבויה כברירת מחדל) - מונעת מאותו תלמיד להיות מזוהה
-- בשני קיוסקים עצמאיים בו-זמנית (למשל שיתוף קוד QR עם חבר). נעילה עם תפוגה
-- אוטומטית (לא נעילה "קבועה" שצריך לשחרר ידנית) - כך שאם קיוסק נסגר/קורס
-- באמצע, הנעילה נעלמת מעצמה אחרי כמה דקות ולא נשארת תקועה לתמיד.
ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS enable_kiosk_lock BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.kiosk_active_sessions (
  student_id UUID PRIMARY KEY REFERENCES public.students(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kiosk_active_sessions ENABLE ROW LEVEL SECURITY;
