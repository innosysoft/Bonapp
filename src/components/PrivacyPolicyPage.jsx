import React from 'react';
import { useNavigate } from 'react-router-dom';

const Section = ({ title, children }) => (
  <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
    <h2 style={{ color: '#333', marginBottom: '1rem', fontSize: '1.3rem' }}>{title}</h2>
    <div style={{ color: '#555', lineHeight: 1.8, fontSize: '1rem' }}>{children}</div>
  </div>
);

const PrivacyPolicyPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: "'Segoe UI', sans-serif", direction: 'rtl' }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '2rem', textAlign: 'center', color: 'white' }}>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '1rem' }}>
          ← חזרה לדף הבית
        </button>
        <h1 style={{ fontSize: '2.2rem', margin: '0 0 0.5rem 0' }}>🔒 מדיניות פרטיות</h1>
        <p style={{ opacity: 0.9, fontSize: '1rem' }}>עודכן לאחרונה: אוגוסט 2026</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>

        <Section title="1. איזה מידע אנחנו אוספים">
          <p>
            <strong>פרטי הורה/אפוטרופוס:</strong> שם מלא, טלפון, כתובת דוא"ל, סיסמה (מוצפנת).<br />
            <strong>פרטי תלמיד:</strong> שם מלא, כיתה/שכבה, טלפון, תמונה (אופציונלי), הגבלות הוצאה שהוגדרו על ידי ההורה.<br />
            <strong>נתוני שימוש ותשלום:</strong> יתרת חשבון, היסטוריית עסקאות ורכישות ארוחות, אמצעי תשלום שנבחר
            (חודשי/יומי). פרטי כרטיס אשראי עצמם <strong>אינם</strong> נשמרים במערכת - הם מטופלים ישירות מול ספק
            הסליקה.
          </p>
        </Section>

        <Section title="2. לשם מה נאסף המידע">
          <p>
            המידע משמש לצורך תפעול השירות: ניהול חשבון המשתמש, חיוב וזיכוי יתרות, זיהוי תלמידים בקופת המזנון
            (באמצעות קוד QR), שליחת התראות (תשלום, יתרה נמוכה וכדומה) בהתאם להעדפות שהוגדרו, והפקת דוחות
            לבית הספר ולהורה.
          </p>
        </Section>

        <Section title="3. שיתוף מידע עם צדדים שלישיים">
          <p>
            המערכת עובדת עם ספקים חיצוניים לצורך תפעול השירות: ספקי סליקת תשלומים (כגון Grow, Paybox), שירות
            דיוור אלקטרוני לשליחת התראות ואישורים, ושירותי אחסון ענן (AWS) לאחסון המידע. מידע אינו נמכר או
            משותף עם גורמים שאינם קשורים למתן השירות. פרטי תלמיד גלויים גם לצוות בית הספר בו הוא רשום
            (מזכירות, הנהלה, מטבח) לצורך תפעול המזנון.
          </p>
        </Section>

        <Section title="4. מידע על קטינים">
          <p>
            פרטי הילדים נמסרים למערכת אך ורק על ידי ההורה/האפוטרופוס החוקי, במסגרת תהליך ההרשמה, ולא נאספים
            ישירות מהקטין. השימוש במידע זה מוגבל לצורך תפעול שירות הארוחות בבית הספר בלבד.
          </p>
        </Section>

        <Section title="5. אבטחת מידע">
          <p>
            הגישה למידע מוגנת באמצעות מנגנון הזדהות (JWT) והרשאות מדורגות לפי תפקיד (הורה, מזכירות, מטבח,
            הנהלה) - כל משתמש רואה רק את המידע הרלוונטי לתפקידו ולבית הספר שלו. סיסמאות נשמרות בצורה מוצפנת
            ואינן ניתנות לשחזור. חרף האמור, אין מערכת חסינה לחלוטין מפני פרצות אבטחה, ואנו פועלים באופן שוטף
            לשפר את רמת האבטחה.
          </p>
        </Section>

        <Section title="6. שמירת מידע ומחיקתו">
          <p>
            המידע נשמר למשך תקופת השימוש בשירות, ולאחריה בהתאם לצרכים תפעוליים וחוקיים (כגון רישומי עסקאות
            לצורכי הנהלת חשבונות). ניתן לבקש עיון, תיקון או מחיקה של מידע אישי בפנייה כמפורט בסעיף 8.
          </p>
        </Section>

        <Section title="7. זכויותיך">
          <p>
            בהתאם לחוק הגנת הפרטיות, התשמ"א-1981, זכותך לעיין במידע שנשמר עליך ועל ילדיך, לבקש את תיקונו אם
            אינו נכון, ולבקש את מחיקתו (בכפוף למגבלות חוקיות ותפעוליות, כגון שמירת רישומי תשלום).
          </p>
        </Section>

        <Section title="8. יצירת קשר בנושאי פרטיות">
          <p>
            לכל שאלה או בקשה הנוגעת למידע האישי שלך, ניתן לפנות דרך{' '}
            <a href="/contact" style={{ color: '#1976d2' }}>עמוד צור קשר</a> או דרך מזכירות בית הספר.
          </p>
        </Section>

      </div>
    </div>
  );
};

export default PrivacyPolicyPage;
