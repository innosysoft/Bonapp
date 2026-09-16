-- הוספת הגדרת "הדפסת בון אוטומטית" לבית ספר - האם להדפיס אוטומטית בון (כרטיס
-- הזמנה) בכל מכירה שמתבצעת בקופת המטבח / קופה מהירה. ברירת מחדל: כבוי, כדי
-- שלא תתחיל להדפיס אוטומטית אצל בית ספר שלא ביקש את זה.
--
-- HOW TO APPLY:
--   הרץ את הסקריפט הזה ב-Supabase SQL Editor (כמו שאר הסקריפטים ב-backend/sql).
--   חובה להריץ לפני פריסת הקוד שמשתמש בעמודה הזו.

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS auto_print_receipt BOOLEAN NOT NULL DEFAULT false;
