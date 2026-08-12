import React from 'react';
import { useNavigate } from 'react-router-dom';

const Section = ({ title, children }) => (
  <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', marginBottom: '1.5rem', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
    <h2 style={{ color: '#333', marginBottom: '1rem', fontSize: '1.3rem' }}>{title}</h2>
    <div style={{ color: '#555', lineHeight: 1.8, fontSize: '1rem' }}>{children}</div>
  </div>
);

const SchoolPolicyPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: "'Segoe UI', sans-serif", direction: 'rtl' }}>
      <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '2rem', textAlign: 'center', color: 'white' }}>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '1rem' }}>
          ← חזרה לדף הבית
        </button>
        <h1 style={{ fontSize: '2.2rem', margin: '0 0 0.5rem 0' }}>🏫 מדיניות בית הספר - ארוחות ותשלומים</h1>
        <p style={{ opacity: 0.9, fontSize: '1rem' }}>עודכן לאחרונה: אוגוסט 2026</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>

        <div style={{ background: '#fff3e0', border: '1px solid #ffcc02', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem', color: '#7a5200', fontSize: '0.9rem', lineHeight: 1.6 }}>
          המדיניות המפורטת כאן היא כללית ועשויה להשתנות בפרטים מסוימים בין בית ספר לבית ספר. בכל מקרה של
          סתירה, ההנחיה המחייבת היא זו שנמסרה על ידי מזכירות בית הספר בו לומד התלמיד.
        </div>

        <Section title="1. אמצעי תשלום">
          <p>
            בהתאם להגדרות בית הספר, ניתן לשלם עבור ארוחות באחד או יותר מהאופנים הבאים: מנוי חודשי (תשלום
            מרוכז מראש), תשלום יומי לפי ארוחה, או מזומן במזכירות. אמצעי התשלום הזמינים בפועל נקבעים על ידי
            כל בית ספר בנפרד.
          </p>
        </Section>

        <Section title="2. תשלום במזומן">
          <p>
            תשלום במזומן מתבצע מול מזכירות בית הספר בלבד. היתרה בחשבון התלמיד מתעדכנת רק לאחר שהמזכירות
            אישרה את קבלת הכסף בפועל - העברת מזומן להורה/לתלמיד אינה מזכה את החשבון באופן אוטומטי.
          </p>
        </Section>

        <Section title="3. מנוי חודשי">
          <p>
            מנוי חודשי תקף לחודש הקלנדרי שעבורו שולם. תשלום שבוצע לא מתחדש אוטומטית לחודש הבא - יש לבצע
            תשלום מחדש בתחילת כל חודש. ככל שההורה יבחר לשלם מראש עבור יותר מחודש אחד, הדבר ייזקף לחשבון
            בהתאם. ניצול בפועל של הארוחות (כמה ארוחות נאכלו בחודש) מדווח בנפרד ואינו משפיע על גובה התשלום
            החודשי הקבוע.
          </p>
        </Section>

        <Section title="4. חיוב בימי היעדרות">
          <p>
            בהתאם להגדרת בית הספר, ייתכן ותלמיד במסלול מנוי חודשי יחויב עבור ימי לימוד גם אם נעדר ולא ניצל
            את הארוחה, שכן המנוי מבוסס על מספר ימי הלימוד הקבוע מראש ולא על צריכה בפועל בכל יום. בירור לגבי
            מדיניות ההיעדרות הספציפית של בית הספר ניתן לבצע מול המזכירות.
          </p>
        </Section>

        <Section title="5. קוד QR וזיהוי תלמיד">
          <p>
            כל תלמיד מקבל קוד QR אישי המשמש לחיוב במזנון. יש לשמור על הקוד ולא למוסרו לתלמידים אחרים - שימוש
            בקוד ייחשב כפעולה שביצע התלמיד עצמו. אובדן קוד יש לדווח מיידית למזכירות לצורך הנפקת קוד חדש.
          </p>
        </Section>

        <Section title="6. שינויים וביטולים">
          <p>
            בקשות לשינוי מסלול תשלום, ביטול מנוי או בירור לגבי יתרה שגויה - יש להפנות למזכירות בית הספר,
            שהיא הגורם המוסמך לאשר שינויים וזיכויים בחשבון התלמיד.
          </p>
        </Section>

        <Section title="7. עדכוני מדיניות">
          <p>
            בית הספר רשאי לעדכן מדיניות זו מעת לעת, לרבות מחירי ארוחות ותנאי תשלום. עדכונים מהותיים יובאו
            לידיעת ההורים.
          </p>
        </Section>

      </div>
    </div>
  );
};

export default SchoolPolicyPage;
