import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { SUPPORT_WHATSAPP_NUMBER, WhatsAppChatPanel } from './WhatsAppSupportButton';

const SupportPage = () => {
  const navigate = useNavigate();
  const [videos, setVideos] = useState([]);
  const [openFaq, setOpenFaq] = useState(null);
  const [showWhatsAppChat, setShowWhatsAppChat] = useState(false);

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
    <div className="bap-support">
      <style>{`
        .bap-support{
          --navy:#17324a;--blue:#667eea;--purple:#764ba2;--green:#75a843;
          --paper:#f6f8fc;--white:#fff;--muted:#607482;--line:#dce6e9;--dark-text:#2c3345;
          font-family:'Heebo',Arial,sans-serif;color:var(--dark-text);background:var(--paper);
          min-height:100vh;
        }
        .bap-support *{box-sizing:border-box}
        .bap-support button{font:inherit}
        .bap-support .container{max-width:1220px;width:100%;margin-inline:auto;padding:0 32px}
        @media (max-width:767px){ .bap-support .container{padding:0 16px} }

        /* היירו */
        .bap-support .hero{
          position:relative;overflow:hidden;
          background:linear-gradient(135deg,var(--blue),var(--purple));
          color:#fff;text-align:center;padding:36px 16px 44px;
        }
        .bap-support .hero::before,.bap-support .hero::after{
          content:'';position:absolute;border-radius:50%;background:rgba(255,255,255,.08);
        }
        .bap-support .hero::before{width:280px;height:280px;top:-120px;left:-80px}
        .bap-support .hero::after{width:220px;height:220px;bottom:-110px;right:-60px}
        .bap-support .hero-inner{position:relative;z-index:1;max-width:720px;margin:0 auto}
        .bap-support .hero-back{
          display:inline-flex;align-items:center;gap:6px;background:rgba(255,255,255,.18);
          border:none;color:#fff;padding:.5rem 1rem;border-radius:10px;cursor:pointer;
          font-size:14px;font-weight:600;margin-bottom:18px;
        }
        .bap-support .hero-back:hover{background:rgba(255,255,255,.28)}
        .bap-support .hero-logo{font-size:26px;font-weight:700;letter-spacing:-1px;margin-bottom:10px}
        .bap-support .hero-logo i{font-style:normal;color:#b7e39a}
        .bap-support .hero h1{font-size:clamp(28px,4vw,42px);margin:0 0 10px;font-weight:800}
        .bap-support .hero p{opacity:.92;font-size:clamp(15px,2vw,18px);margin:0;line-height:1.5}
        .bap-support .hero-back:focus-visible,
        .bap-support button:focus-visible,
        .bap-support a:focus-visible{outline:3px solid #b7e39a;outline-offset:2px}

        .bap-support .section{padding:44px 0}
        .bap-support .section-title{font-size:clamp(22px,2.6vw,28px);color:var(--dark-text);margin:0 0 22px;font-weight:800}

        /* סרטונים */
        .bap-support .videos-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:24px}
        @media (min-width:1200px){ .bap-support .videos-grid{grid-template-columns:repeat(4,1fr)} }
        @media (max-width:767px){ .bap-support .videos-grid{grid-template-columns:1fr} }
        .bap-support .video-card{
          background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 18px rgba(23,50,74,.08);
          display:flex;flex-direction:column;height:100%;transition:transform .2s ease,box-shadow .2s ease;
        }
        .bap-support .video-card:hover{transform:translateY(-3px);box-shadow:0 10px 26px rgba(23,50,74,.14)}
        .bap-support .video-frame-wrap{position:relative;width:100%;aspect-ratio:16/9;overflow:hidden;background:#0e2636}
        .bap-support .video-frame-wrap iframe{position:absolute;inset:0;width:100%;height:100%;border:0}
        .bap-support .video-body{padding:18px;flex:1;display:flex;flex-direction:column;gap:6px}
        .bap-support .video-body h3{margin:0;font-size:16px;color:var(--dark-text)}
        .bap-support .video-body p{margin:0;font-size:14px;color:var(--muted);line-height:1.55}

        /* מדריך מהיר */
        .bap-support .guide-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:20px}
        .bap-support .guide-card{background:#fff;border-radius:16px;padding:22px;box-shadow:0 4px 18px rgba(23,50,74,.08)}
        .bap-support .guide-card .emoji{font-size:30px;margin-bottom:8px}
        .bap-support .guide-card h3{margin:0 0 8px;font-size:16px;color:var(--dark-text)}
        .bap-support .guide-card p{margin:0;font-size:14px;color:var(--muted);line-height:1.6}

        /* שאלות נפוצות */
        .bap-support .faq-columns{display:grid;grid-template-columns:repeat(3,1fr);gap:24px;align-items:start}
        @media (max-width:1023px){ .bap-support .faq-columns{grid-template-columns:repeat(2,1fr)} }
        @media (max-width:767px){ .bap-support .faq-columns{grid-template-columns:1fr} }
        .bap-support .faq-card{background:#fff;border-radius:16px;padding:20px;box-shadow:0 4px 18px rgba(23,50,74,.08)}
        .bap-support .faq-cat-title{
          display:flex;align-items:center;gap:8px;font-size:16px;font-weight:700;color:var(--blue);
          margin:0 0 14px;padding:.6rem .9rem;background:#f0f2ff;border-radius:10px;
        }
        .bap-support .faq-item{background:var(--paper);border:1px solid var(--line);border-radius:10px;margin-bottom:10px;overflow:hidden}
        .bap-support .faq-item:last-child{margin-bottom:0}
        .bap-support .faq-q{
          width:100%;padding:14px 16px;background:none;border:none;text-align:right;cursor:pointer;
          font-size:15px;font-weight:600;color:var(--dark-text);display:flex;justify-content:space-between;align-items:center;gap:10px;
        }
        .bap-support .faq-q .chev{color:var(--blue);flex-shrink:0}
        .bap-support .faq-a{padding:0 16px 16px;color:var(--muted);line-height:1.65;font-size:14.5px}

        /* יצירת קשר */
        .bap-support .cta{
          background:linear-gradient(135deg,var(--blue),var(--purple));border-radius:20px;
          padding:40px 28px;text-align:center;color:#fff;
        }
        .bap-support .cta h2{margin:0 0 10px;font-size:clamp(22px,2.6vw,28px)}
        .bap-support .cta > p{opacity:.92;margin:0 0 22px;font-size:15px}
        .bap-support .cta-actions{display:flex;gap:14px;justify-content:center;flex-wrap:wrap}
        .bap-support .btn{
          padding:1rem 2rem;border:none;border-radius:12px;font-size:1rem;font-weight:700;cursor:pointer;
          display:inline-flex;align-items:center;gap:.5rem;
        }
        .bap-support .btn-primary{background:#fff;color:var(--blue)}
        .bap-support .btn-primary:hover{background:#f2f4ff}
        .bap-support .btn-whatsapp{background:#25D366;color:#fff}
        .bap-support .btn-whatsapp:hover{background:#20bd5a}
        .bap-support .cta-success{background:rgba(255,255,255,.18);border-radius:14px;padding:2rem;max-width:420px;margin:0 auto}
        .bap-support .cta-success .icon{font-size:3rem}
        .bap-support .ticket-form{display:grid;gap:1rem;text-align:right;max-width:460px;margin:0 auto}
        .bap-support .ticket-form input,.bap-support .ticket-form textarea{
          padding:.85rem 1rem;border:none;border-radius:10px;font-size:1rem;font-family:inherit;
        }
        .bap-support .ticket-form textarea{resize:vertical}
        .bap-support .ticket-form .btn-primary{width:100%;justify-content:center}
      `}</style>

      {/* Header */}
      <div className="hero">
        <div className="hero-inner">
          <button className="hero-back" onClick={() => navigate('/')}>
            ← חזרה לדף הבית
          </button>
          <div className="hero-logo">Bon<i>app</i></div>
          <h1>🎓 מרכז תמיכה</h1>
          <p>כל מה שצריך לדעת על BonApp</p>
        </div>
      </div>

      <div className="container">

        {/* סרטוני הסבר */}
        {videos.length > 0 && (
          <div className="section">
            <h2 className="section-title">🎬 סרטוני הסבר</h2>
            <div className="videos-grid">
              {videos.map(video => {
                const videoId = getYoutubeId(video.youtube_url);
                return (
                  <div key={video.id} className="video-card">
                    {videoId && (
                      <div className="video-frame-wrap">
                        <iframe
                          src={`https://www.youtube.com/embed/${videoId}`}
                          title={video.title}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                      </div>
                    )}
                    <div className="video-body">
                      <h3>{video.title}</h3>
                      {video.description && <p>{video.description}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* מדריך מהיר */}
        <div className="section">
          <h2 className="section-title">🚀 מדריך מהיר</h2>
          <div className="guide-grid">
            <div className="guide-card">
              <div className="emoji">🔑</div>
              <h3>התחברות למערכת</h3>
              <p>נכנסים לדף הכניסה עם כתובת המייל והסיסמה שנרשמתם איתם. שכחתם סיסמה? לוחצים על "שכחתי סיסמה" במסך הכניסה ומקבלים קישור לאיפוס במייל.</p>
            </div>

            <div className="guide-card">
              <div className="emoji">💳</div>
              <h3>ביצוע תשלום</h3>
              <p>בפאנל ההורה בוחרים את הילד/ה ולוחצים על "הוספת יתרה". אפשר לבחור תשלום חודשי קבוע או תשלום בודד, לפי מה שהבית ספר מאפשר.</p>
            </div>

            <div className="guide-card">
              <div className="emoji">📱</div>
              <h3>הורדת ברקוד לילד</h3>
              <p>בפאנל ההורה, בכרטיס הילד/ה לוחצים על סמל ה-QR ואז על "הורדה" - הקוד נשמר כתמונה שאפשר להדפיס. יש גם קוד PIN אישי שאפשר להקליד בקופה בלי לסרוק.</p>
            </div>

            <div className="guide-card">
              <div className="emoji">⬇️</div>
              <h3>אפליקציה לטלפון</h3>
              <p>פותחים את bonapp.dev בדפדפן הטלפון, ובתפריט הדפדפן בוחרים "הוסף למסך הבית". כך האתר נפתח כמו אפליקציה רגילה, בלי צורך בהתקנה מחנות אפליקציות.</p>
            </div>
          </div>
        </div>

        {/* שאלות ותשובות */}
        <div className="section">
          <h2 className="section-title">❓ שאלות נפוצות</h2>
          <div className="faq-columns">
            {faqs.map((section, si) => (
              <div key={si} className="faq-card">
                <h3 className="faq-cat-title">
                  {section.category === 'הורים' ? '👨‍👩‍👧' : section.category === 'מנהל בית ספר' ? '🏫' : '👨‍🍳'} {section.category}
                </h3>
                {section.items.map((item, ii) => {
                  const faqKey = `${si}-${ii}`;
                  const isOpen = openFaq === faqKey;
                  const answerId = `faq-answer-${faqKey}`;
                  return (
                    <div key={ii} className="faq-item">
                      <button
                        onClick={() => setOpenFaq(current => current === faqKey ? null : faqKey)}
                        aria-expanded={isOpen}
                        aria-controls={answerId}
                        className="faq-q"
                      >
                        {item.q}
                        <span className="chev">{isOpen ? '▲' : '▼'}</span>
                      </button>
                      {isOpen && (
                        <div id={answerId} className="faq-a">
                          {item.a}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        {/* לא מצאתם תשובה */}
        <div className="cta">
          <h2>🤔 לא מצאתם תשובה?</h2>
          <p>פתחו קריאת שירות ונחזור אליכם בהקדם.</p>

          {!showTicket ? (
            <div className="cta-actions">
              <button onClick={() => setShowTicket(true)} className="btn btn-primary">
                פתח קריאת שירות 📨
              </button>
              {SUPPORT_WHATSAPP_NUMBER && (
                <button
                  onClick={() => setShowWhatsAppChat(true)}
                  className="btn btn-whatsapp"
                >
                  💬 שלח הודעה בוואטסאפ
                </button>
              )}
              {showWhatsAppChat && <WhatsAppChatPanel onClose={() => setShowWhatsAppChat(false)} />}
            </div>
          ) : sentTicket ? (
            <div className="cta-success">
              <div className="icon">✅</div>
              <h3>הקריאה נפתחה בהצלחה!</h3>
              <p>נחזור אליך בהקדם.</p>
            </div>
          ) : (
            <div className="ticket-form">
              <input type="text" placeholder="שמך *" value={ticket.name}
                onChange={e => setTicket({...ticket, name: e.target.value})} />
              <input type="tel" placeholder="טלפון *" value={ticket.phone}
                onChange={e => setTicket({...ticket, phone: e.target.value})} />
              <input type="email" placeholder="מייל *" value={ticket.email}
                onChange={e => setTicket({...ticket, email: e.target.value})} />
              <textarea placeholder="תארו את הבעיה *" value={ticket.message}
                onChange={e => setTicket({...ticket, message: e.target.value})}
                rows={4} />
              <button onClick={handleTicketSubmit} className="btn btn-primary">
                שלח קריאת שירות 🚀
              </button>
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default SupportPage;
