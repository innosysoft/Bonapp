import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const SupportPage = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);

const handleTicketSubmit = async () => {
    if (!ticket.name || !ticket.phone || !ticket.email || !ticket.message) {
      alert('נא למלא את כל השדות');
      return;
    }
    try {
      await fetch('https://api.bonapp.dev/api/school-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          organizationName: 'קריאת שירות',
          type: 'support',
          fullName: ticket.name,
          email: ticket.email,
          phone: ticket.phone,
          message: ticket.message
        })
      });
      setSentTicket(true);
    } catch (e) {
      alert('שגיאה בשליחה');
    }
  };

  const [showTicket, setShowTicket] = useState(false);
const [sentTicket, setSentTicket] = useState(false);
const [ticket, setTicket] = useState({ name: '', phone: '', email: '', message: '' });

  useEffect(() => {
    fetch('https://api.bonapp.dev/api/tutorial-videos')
      .then(r => r.json())
      .then(data => { if (data.success) setVideos(data.videos); });
  }, []);

  const faqs = [
    {
      category: 'הורים',
      items: [
        { q: 'איך נרשמים למערכת?', a: 'לחצו על "הרשמה" בדף הבית, מלאו את פרטיכם ופרטי ילדיכם, ובחרו את בית הספר.' },
        { q: 'איך מוסיפים כסף לחשבון?', a: 'היכנסו לפאנל ההורה, לחצו על "הוסף כסף" ובחרו את אמצעי התשלום.' },
        { q: 'איך רואים את היתרה?', a: 'היתרה מוצגת בראש דף פאנל ההורה ליד שם הילד.' },
        { q: 'מה קורה אם היתרה אפסה?', a: 'תקבלו התראה כשהיתרה נמוכה. יש להוסיף כסף כדי שהילד יוכל לקנות ארוחות.' },
      ]
    },
    {
      category: 'מנהל בית ספר',
      items: [
        { q: 'איך מוסיפים תלמידים?', a: 'בפאנל המזכירה, לכו ל"תלמידים" ולחצו "הוסף תלמיד".' },
        { q: 'איך מגדירים שכבות?', a: 'בפאנל המזכירה, לכו ל"שכבות" וצרו שכבות לפי הצורך.' },
        { q: 'איך מגדירים ימי לימוד?', a: 'בפאנל המזכירה, בחרו שכבה וסמנו ימי לימוד בלוח השנה.' },
        { q: 'איך מאשרים הרשמה חדשה?', a: 'בפאנל המזכירה, לכו ל"הרשמות חדשות" ואשרו או דחו כל בקשה.' },
      ]
    },
    {
      category: 'מנהל מטבח',
      items: [
        { q: 'איך מגדירים תפריט שבועי?', a: 'בדף ניהול תפריט, בחרו "תפריט יומי" והגדירו תפריט לכל יום.' },
        { q: 'איך סורקים תלמיד?', a: 'השתמשו במסך הסריקה, סרקו את ה-QR של התלמיד או חפשו לפי שם.' },
        { q: 'איך מגדירים מחיר ארוחה?', a: 'בדף ניהול תפריט, גללו למעלה להגדרות מחירים.' },
      ]
    }
  ];

  const getYoutubeId = (url) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/);
    return match ? match[1] : null;
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', fontFamily: "'Segoe UI', sans-serif", direction: 'rtl' }}>
      
      {/* Header */}
      <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', padding: '2rem', textAlign: 'center', color: 'white' }}>
        <button onClick={() => navigate('/')} style={{ background: 'rgba(255,255,255,0.2)', border: 'none', color: 'white', padding: '0.5rem 1rem', borderRadius: '8px', cursor: 'pointer', marginBottom: '1rem' }}>
          ← חזרה לדף הבית
        </button>
        <h1 style={{ fontSize: '2.5rem', margin: '0 0 0.5rem 0' }}>🎓 מרכז תמיכה</h1>
        <p style={{ opacity: 0.9, fontSize: '1.1rem' }}>כל מה שצריך לדעת על BonApp</p>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>

        {/* סרטוני הסבר */}
        {videos.length > 0 && (
          <div style={{ marginBottom: '3rem' }}>
            <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '1.5rem' }}>🎬 סרטוני הסבר</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {videos.map(video => {
                const videoId = getYoutubeId(video.youtube_url);
                return (
                  <div key={video.id} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 15px rgba(0,0,0,0.08)' }}>
                    {videoId && (
                      <iframe
                        width="100%"
                        height="200"
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title={video.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    )}
                    <div style={{ padding: '1rem' }}>
                      <h3 style={{ margin: 0, fontSize: '1rem', color: '#333' }}>{video.title}</h3>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* שאלות ותשובות */}
        <h2 style={{ fontSize: '1.8rem', color: '#333', marginBottom: '1.5rem' }}>❓ שאלות נפוצות</h2>
        {faqs.map((section, si) => (
          <div key={si} style={{ marginBottom: '2rem' }}>
            <h3 style={{ fontSize: '1.3rem', color: '#667eea', marginBottom: '1rem', padding: '0.5rem 1rem', background: '#f0f2ff', borderRadius: '8px' }}>
              {section.category === 'הורים' ? '👨‍👩‍👧' : section.category === 'מנהל בית ספר' ? '🏫' : '👨‍🍳'} {section.category}
            </h3>
            {section.items.map((item, ii) => (
              <div key={ii} style={{ background: 'white', borderRadius: '8px', marginBottom: '0.5rem', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <button
                  onClick={() => setOpenFaq(`${si}-${ii}`)}
                  style={{ width: '100%', padding: '1rem', background: 'none', border: 'none', textAlign: 'right', cursor: 'pointer', fontSize: '1rem', fontWeight: '600', color: '#333', display: 'flex', justifyContent: 'space-between' }}
                >
                  {item.q}
                  <span>{openFaq === `${si}-${ii}` ? '▲' : '▼'}</span>
                </button>
                {openFaq === `${si}-${ii}` && (
                  <div style={{ padding: '0 1rem 1rem', color: '#555', lineHeight: 1.6 }}>
                    {item.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

{/* לא מצאתם תשובה */}
        <div style={{ background: 'linear-gradient(135deg, #667eea, #764ba2)', borderRadius: '16px', padding: '2rem', textAlign: 'center', color: 'white', marginTop: '2rem' }}>
          <h2 style={{ margin: '0 0 1rem 0' }}>🤔 לא מצאתם תשובה?</h2>
          <p style={{ opacity: 0.9, marginBottom: '1.5rem' }}>
            פתחו קריאת שירות ונחזור אליכם בהקדם.
          </p>
          
          {!showTicket ? (
            <button onClick={() => setShowTicket(true)}
              style={{ padding: '1rem 2rem', background: 'white', color: '#667eea', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer' }}>
              פתח קריאת שירות 📨
            </button>
          ) : sentTicket ? (
            <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '12px', padding: '2rem' }}>
              <div style={{ fontSize: '3rem' }}>✅</div>
              <h3>הקריאה נפתחה בהצלחה!</h3>
              <p>נחזור אליך בהקדם.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gap: '1rem', textAlign: 'right' }}>
              <input type="text" placeholder="שמך *" value={ticket.name}
                onChange={e => setTicket({...ticket, name: e.target.value})}
                style={{ padding: '0.75rem', border: 'none', borderRadius: '8px', fontSize: '1rem' }} />
              <input type="tel" placeholder="טלפון *" value={ticket.phone}
                onChange={e => setTicket({...ticket, phone: e.target.value})}
                style={{ padding: '0.75rem', border: 'none', borderRadius: '8px', fontSize: '1rem' }} />
              <input type="email" placeholder="מייל *" value={ticket.email}
                onChange={e => setTicket({...ticket, email: e.target.value})}
                style={{ padding: '0.75rem', border: 'none', borderRadius: '8px', fontSize: '1rem' }} />
              <textarea placeholder="תארו את הבעיה *" value={ticket.message}
                onChange={e => setTicket({...ticket, message: e.target.value})}
                rows={4}
                style={{ padding: '0.75rem', border: 'none', borderRadius: '8px', fontSize: '1rem', resize: 'vertical' }} />
              <button onClick={handleTicketSubmit}
                style={{ padding: '1rem', background: 'white', color: '#667eea', border: 'none', borderRadius: '8px', fontSize: '1rem', fontWeight: '700', cursor: 'pointer' }}>
                שלח קריאת שירות 🚀
              </button>
            </div>
          )}
        </div>

    </div>
  );
};

export default SupportPage;