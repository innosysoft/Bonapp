import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const ContactPage = () => {
  const navigate = useNavigate();
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [form, setForm] = useState({ name: '', phone: '', email: '', message: '' });
  const [suggestion, setSuggestion] = useState({ name: '', email: '', message: '' });
  const [sentContact, setSentContact] = useState(false);
  const [sentSuggestion, setSentSuggestion] = useState(false);

  const handleContactSubmit = async () => {
    if (!form.name || !form.message || !form.phone || !form.email) {
      alert('נא למלא את כל השדות: שם, טלפון, מייל והודעה');
      return;
    }

    try {
      await fetch('https://api.bonapp.dev/api/school-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: 'פנייה מדף צור קשר',
          type: 'contact',
          fullName: form.name,
          email: form.email || 'לא צוין',
          phone: form.phone || 'לא צוין',
          message: form.message
        })
      });
      setSentContact(true);
    } catch (e) {
      alert('שגיאה בשליחה');
    }
  };

  const handleSuggestionSubmit = async () => {
    if (!suggestion.message) {
      alert('נא למלא הצעה');
      return;
    }
    try {
      await fetch('https://api.bonapp.dev/api/school-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: 'הצעה לשיפור',
          type: 'suggestion',
          fullName: suggestion.name || 'אנונימי',
          email: suggestion.email || 'לא צוין',
          phone: 'לא צוין',
          message: suggestion.message
        })
      });
      setSentSuggestion(true);
    } catch (e) {
      alert('שגיאה בשליחה');
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: "'Segoe UI', sans-serif", direction: 'rtl' }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '2rem', textAlign: 'center', color: 'white' }}>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '1rem' }}>
          ← חזרה לדף הבית
        </button>
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>📞 צור קשר</h1>
        <p style={{ opacity: 0.9, fontSize: '1.1rem' }}>אנחנו כאן בשבילכם</p>
      </div>

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* פרטי קשר */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
          <h2 style={{ color: '#333', marginBottom: '1.5rem' }}>📬 פרטי יצירת קשר</h2>
          <div style={{ display: 'grid', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>📞</span>
              <div>
                <div style={{ fontWeight: '600', color: '#333' }}>טלפון</div>
                <div style={{ color: '#667eea', fontSize: '1.1rem' }}>1-700-50-20-42</div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: '#f8f9fa', borderRadius: '8px' }}>
              <span style={{ fontSize: '1.5rem' }}>⏰</span>
              <div>
                <div style={{ fontWeight: '600', color: '#333' }}>שעות תמיכה</div>
                <div style={{ color: '#555' }}>ימים א-ה, 8:00-17:00</div>
              </div>
            </div>
          </div>
        </div>

        {/* טופס פנייה */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', marginBottom: '2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
          <h2 style={{ color: '#333', marginBottom: '1rem' }}>✉️ שלח פנייה</h2>
          
          {sentContact ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#4CAF50' }}>
              <div style={{ fontSize: '3rem' }}>✅</div>
              <h3>הפנייה נשלחה בהצלחה!</h3>
              <p>נחזור אליך בהקדם.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <input type="text" placeholder="שמך *" value={form.name}
                onChange={e => setForm({...form, name: e.target.value})}
                style={{ padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem' }} />
              <input type="tel" placeholder="טלפון" value={form.phone}
                onChange={e => setForm({...form, phone: e.target.value})}
                style={{ padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem' }} />
              <input type="email" placeholder="מייל" value={form.email}
                onChange={e => setForm({...form, email: e.target.value})}
                style={{ padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem' }} />
              <textarea placeholder="הודעה *" value={form.message}
                onChange={e => setForm({...form, message: e.target.value})}
                rows={4}
                style={{ padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', resize: 'vertical' }} />
              <button onClick={handleContactSubmit}
                style={{ padding: '1rem', background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>
                שלח פנייה 📨
              </button>
            </div>
          )}
        </div>

        {/* הצעות לשיפור */}
        <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
          <h2 style={{ color: '#333', marginBottom: '0.5rem' }}>💡 רוצים להשפיע?</h2>
          <p style={{ color: '#666', marginBottom: '1.5rem' }}>
            רעיונות והצעות לשיפור יתקבלו בברכה! אנחנו מקשיבים לכם.
          </p>
          
          {!showSuggestion ? (
            <button onClick={() => setShowSuggestion(true)}
              style={{ padding: '1rem 2rem', background: 'linear-gradient(135deg, #4CAF50, #66bb6a)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>
              שתף רעיון 🚀
            </button>
          ) : sentSuggestion ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#4CAF50' }}>
              <div style={{ fontSize: '3rem' }}>🎉</div>
              <h3>תודה על ההצעה!</h3>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem' }}>
              <input type="text" placeholder="שמך (אופציונלי)" value={suggestion.name}
                onChange={e => setSuggestion({...suggestion, name: e.target.value})}
                style={{ padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem' }} />
              <input type="email" placeholder="מייל (אופציונלי)" value={suggestion.email}
                onChange={e => setSuggestion({...suggestion, email: e.target.value})}
                style={{ padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem' }} />
              <textarea placeholder="ספרו לנו את הרעיון שלכם..." value={suggestion.message}
                onChange={e => setSuggestion({...suggestion, message: e.target.value})}
                rows={5}
                style={{ padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', fontSize: '1rem', resize: 'vertical' }} />
              <button onClick={handleSuggestionSubmit}
                style={{ padding: '1rem', background: 'linear-gradient(135deg, #4CAF50, #66bb6a)', color: 'white', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '600', cursor: 'pointer' }}>
                שלח הצעה 💌
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default ContactPage;