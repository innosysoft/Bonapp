import React from 'react';
import { useNavigate } from 'react-router-dom';

const Section = ({ title, children }) => (
  <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
    <h2 style={{ color: '#333', marginBottom: '1rem', fontSize: '1.3rem' }}>{title}</h2>
    <div style={{ color: '#555', lineHeight: 1.8, fontSize: '1rem' }}>{children}</div>
  </div>
);

const AccessibilityStatementPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: "'Segoe UI', sans-serif", direction: 'rtl' }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '2rem', textAlign: 'center', color: 'white' }}>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '1rem' }}>
          ← חזרה לדף הבית
        </button>
        <h1 style={{ fontSize: '2.2rem', margin: '0 0 0.5rem 0' }}>♿ הצהרת נגישות</h1>
        <p style={{ opacity: 0.9, fontSize: '1rem' }}>עודכן לאחרונה: אוגוסט 2026</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>

        <Section title="1. מחויבותנו לנגישות">
          <p>
            אנו ב-BonApp (Innosys) פועלים להנגיש את האתר לאנשים עם מוגבלות, מתוך אמונה כי לכל אדם מגיעה
            גישה שווה למידע ולשירות. אנו שואפים לעמוד בדרישות תקנות שוויון זכויות לאנשים עם מוגבלות (התאמות
            נגישות לשירות), התשע"ג-2013, ובהתבסס על תקן ישראלי 5568 (המבוסס על הנחיות WCAG 2.0 ברמה AA).
          </p>
        </Section>

        <Section title="2. מה בוצע באתר">
          <p>
            באתר קיים תפריט נגישות צף (כפתור ♿ בפינת המסך), המאפשר: הגדלה/הקטנה של גודל הטקסט, מעבר למצב
            ניגודיות גבוהה, הדגשת קישורים, עצירת אנימציות ומעבר לגופן קריא. כמו כן, האתר בנוי כולו בפריסת
            RTL מותאמת לעברית, ואלמנטים הניתנים לניווט מקלדת מסומנים בהדגשה ויזואלית ברורה בעת מעבר עליהם
            במקלדת (focus).
          </p>
        </Section>

        <Section title="3. מגבלות ידועות">
          <p>
            האתר נמצא בתהליך שיפור מתמשך ברמת הנגישות. ייתכן שחלקים מסוימים - בפרט מסכי ניהול פנימיים
            (פאנל מזכירה, מטבח והנהלה) - טרם עברו התאמה מלאה לדרישות התקן, לרבות תיוג מלא לקוראי מסך וניווט
            מקלדת מקיף. אנו פועלים לצמצם פערים אלה בהדרגה.
          </p>
        </Section>

        <Section title="4. פנייה בנושא נגישות">
          <p>
            נתקלתם בבעיית נגישות באתר, או זקוקים לסיוע בגישה לתוכן? נשמח לעזור - ניתן לפנות דרך{' '}
            <a href="/contact" style={{ color: '#1976d2' }}>עמוד צור קשר</a>{' '}
            או בטלפון{' '}
            <a href="tel:1-700-502042" style={{ color: '#1976d2' }}>1-700-502042</a>.
            נעשה כמיטב יכולתנו להשיב ולטפל בפנייה בהקדם האפשרי.
          </p>
        </Section>

      </div>
    </div>
  );
};

export default AccessibilityStatementPage;
