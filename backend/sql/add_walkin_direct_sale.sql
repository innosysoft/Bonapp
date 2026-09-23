-- תמיכה ב"לקוח מזדמן" (מכירה ישירה בלי הזדהות) בקופה המהירה ובקיוסק העצמאי.
--
-- רעיון: כל בית ספר מקבל שורת "תלמיד" מדומה אחת (is_walkin_placeholder=true) שמשמשת
-- כ-student_id לכל מכירה ישירה (כי transactions.student_id הוא NOT NULL וזה נשאר כך -
-- לא משנים את המבנה הקיים). השם/טלפון האמיתיים שהוזנו (אם הוזנו) נשמרים בנפרד
-- בעמודות guest_name/guest_phone על העסקה עצמה, כדי שהבון/הדוחות יראו את השם האמיתי,
-- לא "לקוח מזדמן" גנרי. שורת התלמיד המדומה מסוננת החוצה מכל ספירה של "כמה תלמידים יש".
--
-- pending_guest_sales - החזקה זמנית של פרטי עגלה למכירת "לקוח מזדמן" בקיוסק שמשלמת
-- באשראי/ביט דרך Grow (בניגוד לקופה המהירה, שם הצוות מאשר תשלום ידנית בלי שער תשלום).
-- הקיוסק לא יכול לשלוח את כל העגלה בתיאור התשלום ל-Grow (מוגבל לטקסט קצר), אז שומרים
-- אותה כאן ומעבירים רק מזהה קצר; ה-webhook משלים את המכירה בפועל אחרי אישור תשלום אמיתי.
--
-- HOW TO APPLY:
--   הרץ את הסקריפט הזה ב-Supabase SQL Editor (כמו שאר הסקריפטים ב-backend/sql).
--   חובה להריץ לפני פריסת הקוד שמשתמש בעמודות/בטבלה האלה.

ALTER TABLE public.students
  ADD COLUMN IF NOT EXISTS is_walkin_placeholder BOOLEAN NOT NULL DEFAULT false;

-- payment_method כבר קיים בטבלה (בשימוש ע"י add-money/grow-webhook/paybox-callback) -
-- רק מוסיפים guest_name/guest_phone.
ALTER TABLE public.transactions
  ADD COLUMN IF NOT EXISTS guest_name TEXT,
  ADD COLUMN IF NOT EXISTS guest_phone TEXT;

CREATE TABLE IF NOT EXISTS public.pending_guest_sales (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL,
  items JSONB NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  guest_name TEXT,
  guest_phone TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.pending_guest_sales ENABLE ROW LEVEL SECURITY;
