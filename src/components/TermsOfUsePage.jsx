import React from 'react';
import { useNavigate } from 'react-router-dom';

const Section = ({ title, children }) => (
  <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
    <h2 style={{ color: '#333', marginBottom: '1rem', fontSize: '1.3rem' }}>{title}</h2>
    <div style={{ color: '#555', lineHeight: 1.8, fontSize: '1rem' }}>{children}</div>
  </div>
);

const TermsOfUsePage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: "'Segoe UI', sans-serif", direction: 'rtl' }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '2rem', textAlign: 'center', color: 'white' }}>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '1rem' }}>
          ← חזרה לדף הבית
        </button>
        <h1 style={{ fontSize: '2.2rem', margin: '0 0 0.5rem 0' }}>📄 תנאי שימוש</h1>
        <p style={{ opacity: 0.9, fontSize: '1rem' }}>עודכן לאחרונה: אוגוסט 2026</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>

        <Section title="1. כללי">
          <p>
            ברוכים הבאים ל-BonApp ("המערכת" / "השירות"), מערכת דיגיטלית לניהול תשלומי ותפעול ארוחות בבתי ספר,
            המופעלת על ידי Innosys ("החברה", "אנחנו"). השימוש במערכת - לרבות הרשמה, כניסה, תשלום, וצפייה במידע -
            כפוף לתנאים המפורטים במסמך זה. הרשמה לשירות או שימוש בו מהווים הסכמה לתנאים אלה.
          </p>
        </Section>

        <Section title="2. הרשמה וחשבון משתמש">
          <p>
            ההרשמה למערכת נעשית על ידי הורה/אפוטרופוס עבור עצמו ועבור ילדיו הקטינים הלומדים בבית ספר המשתמש
            בשירות. הנרשם מצהיר כי הוא ההורה/האפוטרופוס החוקי של הילדים שפרטיהם נמסרים, וכי הפרטים שנמסרו
            (לרבות פרטי קשר ופרטי הילדים) נכונים ומדויקים. באחריות המשתמש לעדכן את פרטיו במקרה של שינוי,
            ולשמור על סודיות פרטי ההתחברות לחשבונו.
          </p>
        </Section>

        <Section title="3. תשלומים וסליקה">
          <p>
            תשלומים במערכת מתבצעים באמצעות ספקי סליקה חיצוניים (כגון Grow, Paybox או ספק אחר כפי שמוגדר על
            ידי בית הספר), ופרטי אמצעי התשלום (כרטיס אשראי וכדומה) אינם נשמרים בשרתי BonApp - הם מטופלים
            ישירות מול ספק הסליקה. אופן חישוב הסכומים לתשלום (מנוי חודשי / תשלום יומי לארוחה), מחירי הארוחות,
            ומדיניות הביטולים וההחזרים נקבעים על ידי בית הספר בו לומד הילד - ראו{' '}
            <a href="/school-policy" target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2' }}>
              מדיניות בית הספר
            </a>{' '}
            לפרטים.
          </p>
        </Section>

        <Section title="4. שימוש בשירות">
          <p>
            כל תלמיד מקבל קוד/כרטיס QR אישי המשמש לזיהוי בעת רכישת ארוחה במזנון בית הספר. האחריות על שמירת
            הקוד ואי-מסירתו לאחרים חלה על ההורה והתלמיד. חיובים המתבצעים באמצעות הקוד ייחשבו כפעולות שבוצעו
            בהסכמת בעל החשבון, אלא אם דווח על אובדן/גניבה של הקוד מראש למזכירות בית הספר.
          </p>
        </Section>

        <Section title="5. אחריות והגבלת אחריות">
          <p>
            BonApp מספקת תשתית טכנולוגית לניהול תשלומים ותפעול ארוחות, ואינה אחראית לאיכות, כמות, הרכב
            תזונתי או הגשת המזון בפועל - אחריות זו חלה על בית הספר ומפעילי המזנון. החברה עושה מאמצים סבירים
            לשמור על זמינות ותקינות המערכת, אך אינה מתחייבת לזמינות רציפה ללא תקלות, ולא תישא באחריות לנזק
            עקיף שייגרם כתוצאה משימוש או אי-יכולת שימוש בשירות.
          </p>
        </Section>

        <Section title="6. קניין רוחני">
          <p>
            כל הזכויות במערכת, לרבות עיצובה, קוד המקור, הלוגו והתכנים בה, שייכות ל-Innosys ואין להעתיק,
            להפיץ או לעשות בהם שימוש מסחרי ללא אישור מראש ובכתב.
          </p>
        </Section>

        <Section title="7. שינויים בתנאים">
          <p>
            החברה רשאית לעדכן תנאים אלה מעת לעת. שימוש מתמשך בשירות לאחר פרסום עדכון מהווה הסכמה לתנאים
            המעודכנים.
          </p>
        </Section>

        <Section title="8. דין וסמכות שיפוט">
          <p>
            על תנאים אלה יחולו דיני מדינת ישראל, וסמכות השיפוט הבלעדית בכל מחלוקת תהיה נתונה לבתי המשפט
            המוסמכים במחוז מרכז.
          </p>
        </Section>

        <Section title="9. יצירת קשר">
          <p>
            לשאלות בנוגע לתנאי השימוש ניתן לפנות דרך{' '}
            <a href="/contact" style={{ color: '#1976d2' }}>עמוד צור קשר</a>.
          </p>
        </Section>

      </div>
    </div>
  );
};

export default TermsOfUsePage;
