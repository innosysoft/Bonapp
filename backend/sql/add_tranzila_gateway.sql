-- תמיכה בסליקה דרך Tranzila (לצד Grow), לפי הגדרת בית הספר (schools.payment_gateway = 'tranzila').
--
-- schools.tranzila_terminal        - שם המסוף של בית הספר ב-Tranzila (נקבע ע"י מנהל-על).
-- school_gateway_credentials       - App Key + Secret (מוצפן) לכל בית ספר. טבלה נפרדת בכוונה, כדי
--                                    שאף שאילתת select('*') על schools לא תחשוף מפתחות. ללא מפתחות
--                                    בבית הספר, השרת משתמש במפתחות ברירת המחדל של החשבון (env).
-- gateway_checkouts                - ספר הזמנות לתשלומי סליקה אונליין: הסכום, הרפרנס והמסוף נקבעים
--                                    בשרת; האימות מול Tranzila נעשה מול הרשומה הזו, לא מול ה-notify.
--                                    האינדקס הייחודי (terminal, transaction_index) מונע שימוש חוזר
--                                    באותה עסקה בשתי הזמנות.
--
-- HOW TO APPLY:
--   הרץ ב-Supabase SQL Editor לפני פריסת הקוד. כל הטבלאות נעולות (RLS ללא policies) - גישה רק
--   דרך השרת עם service role, כמו שאר הטבלאות הרגישות.

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS tranzila_terminal TEXT;

CREATE TABLE IF NOT EXISTS public.school_gateway_credentials (
  school_id UUID PRIMARY KEY,
  tranzila_app_key TEXT,
  tranzila_secret_enc TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.gateway_checkouts (
  id UUID PRIMARY KEY,
  school_id UUID NOT NULL,
  gateway TEXT NOT NULL DEFAULT 'tranzila',
  terminal TEXT NOT NULL,
  reference_desc TEXT NOT NULL,
  correlation TEXT NOT NULL UNIQUE,
  amount_minor INTEGER NOT NULL CHECK (amount_minor > 0),
  currency TEXT NOT NULL DEFAULT '1',
  status TEXT NOT NULL DEFAULT 'pending',
  fields JSONB NOT NULL,
  notified_index BIGINT,
  transaction_index BIGINT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  paid_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS gateway_checkouts_terminal_txn_uniq
  ON public.gateway_checkouts (terminal, transaction_index)
  WHERE transaction_index IS NOT NULL;

CREATE INDEX IF NOT EXISTS gateway_checkouts_school_idx
  ON public.gateway_checkouts (school_id, created_at DESC);

ALTER TABLE public.school_gateway_credentials ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gateway_checkouts ENABLE ROW LEVEL SECURITY;
