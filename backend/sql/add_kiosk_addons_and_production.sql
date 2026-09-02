-- שכלול הקיוסק: תוספות למוצרים + תפקיד/מסך ייצור (מטבח) + מספור הזמנות.
-- לא נוגע בשום טבלה/עמודה קיימת - רק מוסיף חדשות. אין השפעה על נתונים/פונקציות קיימות.
--
-- HOW TO APPLY:
--   הרץ את הסקריפט הזה ב-Supabase SQL Editor (כמו שאר הסקריפטים ב-backend/sql).
--   חובה להריץ לפני פריסת הקוד שמשתמש בטבלאות האלה (תוספות בקיוסק, מסך ייצור).

-- תוספות/תת-מוצרים לכל פריט תפריט (למשל: לפלאפל אפשר טחינה/סלט/בצל/צ'יפס, חלקן בתוספת מחיר)
CREATE TABLE IF NOT EXISTS public.menu_item_addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price_delta NUMERIC(10,2) NOT NULL DEFAULT 0,
  image_url TEXT,
  available BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_menu_item_addons_menu_item_id
  ON public.menu_item_addons(menu_item_id);

-- הזמנות למסך הייצור/מטבח - טבלה נפרדת מ-transactions בכוונה, כדי לא לגעת בלוגיקת
-- התשלום/יתרה הקיימת בכלל. כל רכישה מוצלחת בקיוסק יוצרת כאן שורה אחת, עם מספור רץ גלובלי.
CREATE TABLE IF NOT EXISTS public.kitchen_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number BIGSERIAL,
  transaction_id UUID REFERENCES public.transactions(id) ON DELETE SET NULL,
  school_id UUID NOT NULL,
  student_name TEXT,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_kitchen_orders_school_status
  ON public.kitchen_orders(school_id, status);
