import React from 'react';
import { useNavigate } from 'react-router-dom';

const AboutPage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: "'Segoe UI', sans-serif", direction: 'rtl' }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '2rem', textAlign: 'center', color: 'white' }}>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '1rem' }}>
          ← חזרה לדף הבית
        </button>
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>🏫 אודות BonApp</h1>
        <p style={{ opacity: 0.9, fontSize: '1.1rem' }}>המערכת החכמה לניהול ארוחות בבתי ספר</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* מי אנחנו */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
          <h2 style={{ color: '#333', marginBottom: '1rem' }}>👋 מי אנחנו?</h2>
          <p style={{ color: '#555', lineHeight: 1.8, fontSize: '1.05rem' }}>
            BonApp היא מערכת דיגיטלית מתקדמת לניהול ארוחות צהריים בבתי ספר. 
            המערכת פותחה על ידי חברת Innosys במטרה לפשט ולייעל את תהליך ניהול תשלומי הארוחות 
            עבור הורים, מנהלי בתי ספר ומנהלי מטבח.
          </p>
        </div>

        {/* היתרונות */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
          <h2 style={{ color: '#333', marginBottom: '1.5rem' }}>✨ למה BonApp?</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            {[
              { icon: '💳', title: 'תשלום דיגיטלי', desc: 'תשלום מקוון נוח ומאובטח דרך Grow' },
              { icon: '📱', title: 'QR Code', desc: 'סריקה מהירה של תלמידים בקופה' },
              { icon: '📊', title: 'דוחות בזמן אמת', desc: 'מעקב אחר יתרות, הוצאות ועסקאות' },
              { icon: '🏫', title: 'מרובי בתי ספר', desc: 'מערכת המתאימה לכל סוגי בתי הספר' },
              { icon: '👨‍👩‍👧', title: 'פאנל הורים', desc: 'ניהול נוח של חשבון הילד מכל מקום' },
              { icon: '🔒', title: 'אבטחה מלאה', desc: 'נתוני התלמידים מאובטחים ומוגנים' },
            ].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
                <span style={{ fontSize: '2rem' }}>{item.icon}</span>
                <div>
                  <div style={{ fontWeight: '600', color: '#333' }}>{item.title}</div>
                  <div style={{ color: '#666', fontSize: '0.9rem' }}>{item.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* פיתוח */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
          <h2 style={{ color: '#333', marginBottom: '1rem' }}>🛠️ הטכנולוגיה</h2>
          <p style={{ color: '#555', lineHeight: 1.8 }}>
            BonApp פותחה עם הטכנולוגיות המתקדמות ביותר: React, Node.js, Supabase ו-AWS. 
            המערכת מאפשרת ניהול של מספר בתי ספר במקביל עם הפרדה מלאה בין הנתונים.
          </p>
          <p style={{ color: '#555', lineHeight: 1.8, marginTop: '1rem' }}>
            פותח על ידי <strong>Innosys</strong> | <a href="mailto:support@bonapp.dev" style={{ color: '#667eea' }}>support@bonapp.dev</a>
          </p>
        </div>

      </div>
    </div>
  );
};

export default AboutPage;