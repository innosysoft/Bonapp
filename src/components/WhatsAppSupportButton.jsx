import React, { useState } from 'react';

// עדכן כאן את מספר הוואטסאפ של התמיכה בפורמט בינלאומי (לדוגמה '972501234567').
// כל עוד השדה ריק, הכפתור לא יוצג בכלל - כדי שאף אחד לא יכתוב למספר לא קיים.
export const SUPPORT_WHATSAPP_NUMBER = '972522494183';

// נשלח כחלק מהודעת הפתיחה, כדי שבצד התמיכה (שהמספר משותף גם לאתרים אחרים) יידעו שהפנייה הגיעה מ-BonApp.
export const SUPPORT_SOURCE_TAG = 'פנייה מאתר BonApp 🎓';

export const buildWhatsAppUrl = (message) =>
  `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;

// חלון צ'אט שנראה כמו ווידג'ט תמיכה בתוך האתר - אבל בפועל רק מרכיב הודעה ופותח וואטסאפ איתה.
// אין כאן בוט אמיתי שמגיב; זו רק חוויית "צ'אט" למילוי ההודעה לפני שעוברים לוואטסאפ.
export const WhatsAppChatPanel = ({ onClose }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    const message = `${SUPPORT_SOURCE_TAG}\n${text.trim() || 'שלום, אני צריך/ה עזרה'}`;
    window.open(buildWhatsAppUrl(message), '_blank', 'noopener,noreferrer');
    onClose();
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: '90px',
      left: '20px',
      width: '320px',
      maxWidth: 'calc(100vw - 40px)',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
      zIndex: 10000,
      overflow: 'hidden',
      direction: 'rtl',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{
        background: '#25D366', color: 'white', padding: '1rem',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <div style={{ fontWeight: '700' }}>💬 תמיכה בוואטסאפ</div>
        <button
          onClick={onClose}
          aria-label="סגור"
          style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1, padding: 0 }}
        >
          ×
        </button>
      </div>

      <div style={{ padding: '1rem', background: '#ECE5DD' }}>
        <div style={{
          background: 'white', borderRadius: '10px', padding: '0.75rem 1rem', maxWidth: '90%',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)', fontSize: '0.9rem', color: '#333', lineHeight: 1.5
        }}>
          שלום! 👋 איך נוכל לעזור? כתבו כאן את הפנייה שלכם, ונעביר אתכם לוואטסאפ עם ההודעה כבר מוכנה.
        </div>
      </div>

      <div style={{ padding: '0.75rem', borderTop: '1px solid #eee', display: 'flex', gap: '0.5rem' }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="כתבו הודעה..."
          autoFocus
          style={{
            flex: 1, padding: '0.6rem 0.9rem', borderRadius: '20px',
            border: '1px solid #ddd', fontSize: '0.9rem', outline: 'none'
          }}
        />
        <button
          onClick={handleSend}
          title="שלח לוואטסאפ"
          style={{
            background: '#25D366', color: 'white', border: 'none', borderRadius: '50%',
            width: '40px', height: '40px', cursor: 'pointer', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.1rem'
          }}
        >
          ➤
        </button>
      </div>
    </div>
  );
};

const WhatsAppSupportButton = () => {
  const [open, setOpen] = useState(false);

  if (!SUPPORT_WHATSAPP_NUMBER) return null;

  return (
    <>
      {open && <WhatsAppChatPanel onClose={() => setOpen(false)} />}
      <button
        onClick={() => setOpen(o => !o)}
        title="תמיכה בוואטסאפ"
        style={{
          position: 'fixed',
          bottom: '20px',
          left: '20px',
          width: '56px',
          height: '56px',
          borderRadius: '50%',
          background: '#25D366',
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          zIndex: 9999
        }}
      >
        <svg viewBox="0 0 24 24" width="30" height="30" fill="white" aria-hidden="true">
          <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2 22l5.28-1.39a9.9 9.9 0 0 0 4.76 1.21h.01c5.46 0 9.9-4.45 9.9-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm5.83 14.07c-.24.68-1.4 1.32-1.93 1.4-.5.08-1.11.11-1.79-.11-.41-.13-.94-.31-1.62-.6-2.86-1.24-4.72-4.12-4.87-4.31-.14-.19-1.16-1.55-1.16-2.96 0-1.41.74-2.1 1-2.39.26-.29.57-.36.76-.36.19 0 .38 0 .55.01.18.01.41-.07.64.49.24.58.81 2 .88 2.14.07.14.12.31.02.5-.09.19-.14.31-.28.48-.14.17-.29.37-.42.5-.14.14-.28.29-.12.57.16.28.71 1.17 1.53 1.9 1.05.94 1.94 1.23 2.22 1.37.28.14.44.12.6-.07.16-.19.68-.79.86-1.06.18-.27.36-.22.6-.13.24.09 1.53.72 1.79.85.26.13.43.19.5.3.07.11.07.62-.17 1.3z"/>
        </svg>
      </button>
    </>
  );
};

export default WhatsAppSupportButton;
