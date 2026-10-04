-- אשראי בקופה המהירה דרך דף תשלום של Grow (במקום אישור ידני של הצוות).
--
-- pos_credit_via_grow: כשפעיל, בחירה ב"אשראי" אצל "לקוח מזדמן" בקופה המהירה יוצרת קישור
-- תשלום Grow (אותו מנגנון כמו בקיוסק). הקופה בודקת לבד שהתשלום אושר וחוזרת למסך אישור.
-- כשכבוי - נשאר כמו היום (הצוות מאשר ידנית שהתשלום התקבל).
--
-- pending_guest_sales.transaction_id: ה-webhook שומר כאן את העסקה שנוצרה אחרי אישור התשלום,
-- כדי שהקופה תוכל להציג את מספר ההזמנה.
--
-- HOW TO APPLY:
--   הרץ ב-Supabase SQL Editor לפני פריסת הקוד. ההפעלה לצפירה נמצאת בשורה האחרונה.

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS pos_credit_via_grow BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE public.pending_guest_sales
  ADD COLUMN IF NOT EXISTS transaction_id UUID;

UPDATE public.schools
  SET pos_credit_via_grow = true
  WHERE id = '72d7a7dc-d24e-43ea-aa79-2aad06bbc4ab'; -- אולפנת צפירה
