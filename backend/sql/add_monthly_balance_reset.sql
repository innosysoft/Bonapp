-- איפוס יתרה חודשי למי ששילם מנוי חודשי (מופעל לפי בית ספר).
--
-- schools.monthly_balance_reset   - כשפעיל, בתחילת כל חודש (ימים 1-3, שעון ישראל) היתרה החיובית
--                                   של כל תלמיד ששילם חודשי לחודש שנגמר מתאפסת. תשלום מראש לחודש
--                                   החדש נשמר (לא נמחק). יתרה שלילית (חוב) לא נוגעים בה.
-- monthly_balance_resets          - ספר פעולות: כל איפוס נרשם פעם אחת בלבד לכל (תלמיד, שנה, חודש),
--                                   עם יתרה לפני/אחרי. מונע איפוס כפול ומאפשר ביקורת ושחזור.
-- apply_monthly_balance_reset()   - פעולה אטומית ברמת בסיס הנתונים: נועלת את שורת התלמיד, מחסירה
--                                   בדיוק את הסכום המחושב (לא "מאפסת למספר"), כך שרכישה שמתבצעת
--                                   באותו רגע לא נדרסת, ורושמת עסקה גלויה מסוג adjustment.
--
-- HOW TO APPLY: הרץ ב-Supabase SQL Editor לפני פריסת הקוד. הקובץ רק מוסיף. ההגדרה כבויה כברירת
-- מחדל בכל בית ספר - שום איפוס לא קורה עד שמפעילים אותה במפורש.

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS monthly_balance_reset BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS public.monthly_balance_resets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL,
  student_id UUID NOT NULL,
  year INTEGER NOT NULL,
  month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  amount NUMERIC(10,2) NOT NULL,
  balance_before NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(10,2) NOT NULL,
  prepaid_kept NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (student_id, year, month)
);

CREATE INDEX IF NOT EXISTS monthly_balance_resets_school_idx
  ON public.monthly_balance_resets (school_id, year, month);

ALTER TABLE public.monthly_balance_resets ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.apply_monthly_balance_reset(
  p_student_id UUID,
  p_school_id UUID,
  p_year INTEGER,
  p_month INTEGER,
  p_prepaid NUMERIC
)
RETURNS TABLE (result_status TEXT, reset_amount NUMERIC, balance_before NUMERIC, balance_after NUMERIC)
LANGUAGE plpgsql
AS $$
DECLARE
  v_balance NUMERIC;
  v_amount NUMERIC;
BEGIN
  SELECT balance INTO v_balance
  FROM public.students
  WHERE id = p_student_id AND school_id = p_school_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN QUERY SELECT 'not_found'::TEXT, 0::NUMERIC, 0::NUMERIC, 0::NUMERIC;
    RETURN;
  END IF;

  IF EXISTS (
    SELECT 1 FROM public.monthly_balance_resets
    WHERE student_id = p_student_id AND year = p_year AND month = p_month
  ) THEN
    RETURN QUERY SELECT 'already_done'::TEXT, 0::NUMERIC, v_balance, v_balance;
    RETURN;
  END IF;

  v_balance := COALESCE(v_balance, 0);
  v_amount := ROUND(GREATEST(0, v_balance - COALESCE(p_prepaid, 0)), 2);

  INSERT INTO public.monthly_balance_resets
    (school_id, student_id, year, month, amount, balance_before, balance_after, prepaid_kept)
  VALUES
    (p_school_id, p_student_id, p_year, p_month, v_amount, v_balance, v_balance - v_amount, COALESCE(p_prepaid, 0));

  IF v_amount > 0 THEN
    UPDATE public.students SET balance = balance - v_amount WHERE id = p_student_id;

    INSERT INTO public.transactions
      (student_id, school_id, type, transaction_type, status, amount, payment_type, description, transaction_date)
    VALUES
      (p_student_id, p_school_id, 'adjustment', 'adjustment', 'completed', v_amount, 'monthly_reset',
       'איפוס יתרה חודשי - מנוי חודשי ' || p_month || '/' || p_year, now());
  END IF;

  RETURN QUERY SELECT 'ok'::TEXT, v_amount, v_balance, v_balance - v_amount;
END;
$$;
