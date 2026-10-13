-- תמיכה בסליקה דרך Tranzila (לצד Grow), לפי הגדרת בית הספר.
--
-- schools.tranzila_terminal: שם המסוף של בית הספר ב-Tranzila (אותיות קטנות באנגלית ומספרים,
--   3-16 תווים). הספק נבחר בשדה הקיים schools.payment_gateway ('grow' | 'tranzila').
--   אין סיסמה או מפתח: דף התשלום המאוחסן של Tranzila דורש רק את שם המסוף.
--
-- gateway_notifications: מניעת עיבוד כפול כש-Tranzila שולחת את אותו notify יותר מפעם אחת
--   (המפתח הוא מזהה העסקה אצל Tranzila).
--
-- HOW TO APPLY:
--   הרץ ב-Supabase SQL Editor לפני פריסת הקוד. בלי הטבלה אישורי תשלום מ-Tranzila יידחו.

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS tranzila_terminal TEXT;

CREATE TABLE IF NOT EXISTS public.gateway_notifications (
  id TEXT PRIMARY KEY,
  reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.gateway_notifications ENABLE ROW LEVEL SECURITY;
