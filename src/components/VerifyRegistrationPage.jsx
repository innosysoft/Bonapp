import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyRegistration } from '../api';
import { Check, AlertCircle, Home, LogIn, Wallet, Download, Smartphone, Copy, QrCode } from 'lucide-react';

// מסך אימות הרשמת הורה, מגיע מקישור שנשלח במייל אחרי מילוי טופס ההרשמה
// (/verify-registration?token=...). מפעיל את החשבון בפועל מול השרת, ומציג בהצלחה
// את כל מה שההורה צריך בשביל הצעד הבא: התחברות, תשלום, QR/PIN לילדים, אפליקציית מובייל.
const VerifyRegistrationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');
  const [result, setResult] = useState(null);
  const [copied, setCopied] = useState(false);
  const calledRef = useRef(false);

  useEffect(() => {
    if (calledRef.current) return;
    calledRef.current = true;

    if (!token) {
      setStatus('error');
      setMessage('קישור לא תקין. יש לבדוק שהעתקתם את הקישור המלא מהמייל.');
      return;
    }

    (async () => {
      try {
        const data = await verifyRegistration(token);
        if (data.success) {
          setResult(data);
          setStatus('success');
        } else {
          setStatus('error');
          setMessage(data.message || 'שגיאה באימות ההרשמה');
        }
      } catch (error) {
        setStatus('error');
        setMessage('שגיאה באימות ההרשמה. נסו שוב או פנו לבית הספר.');
      }
    })();
  }, [token]);

  const handleDownloadQR = (student) => {
    if (!student.qrImage) return;
    const link = document.createElement('a');
    link.href = student.qrImage;
    link.download = `QR_${student.name}.png`;
    link.click();
  };

  const handleCopyMobileLink = () => {
    if (!result?.mobileUrl) return;
    navigator.clipboard.writeText(result.mobileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bap-verify">
      <style>{`
        .bap-verify{
          --navy:#17324a;--blue:#356b8c;--green:#75a843;--paper:#f7faf8;--white:#fff;
          --muted:#607482;--line:#dce6e9;--soft:#eef6e9;
          font-family:'Heebo',Arial,sans-serif;color:var(--navy);background:var(--paper);
          min-height:100vh;display:flex;flex-direction:column;align-items:center;padding:32px 16px 48px;
        }
        .bap-verify *{box-sizing:border-box}
        .bap-verify button{font:inherit}
        .bap-verify .brand{font-size:26px;font-weight:700;color:var(--blue);letter-spacing:-1px;background:none;border:0;cursor:pointer;margin-bottom:24px}
        .bap-verify .brand i{font-style:normal;color:var(--green)}
        .bap-verify .card{background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 10px 30px rgba(23,50,74,.08);padding:36px;width:100%;max-width:440px;text-align:center}
        .bap-verify .card.wide{max-width:640px;text-align:right}
        .bap-verify h1{font-size:24px;margin:0 0 10px}
        .bap-verify .intro{color:var(--muted);font-size:15px;margin:0;line-height:1.6}
        .bap-verify .icon{width:60px;height:60px;border-radius:50%;display:grid;place-items:center;margin:0 auto 18px}
        .bap-verify .icon.success{background:var(--soft);color:var(--green)}
        .bap-verify .icon.error{background:#fdecea;color:#a83236}
        .bap-verify .spinner{width:40px;height:40px;border:3px solid rgba(53,107,140,.2);border-top-color:var(--blue);border-radius:50%;animation:bap-verify-spin .8s linear infinite;margin:0 auto 18px}
        @keyframes bap-verify-spin{to{transform:rotate(360deg)}}
        .bap-verify .login-link{display:inline-flex;align-items:center;gap:8px;color:var(--blue);font-weight:700;background:none;border:0;cursor:pointer;margin-top:20px;font-size:15px}
        .bap-verify .login-link:focus-visible{outline:3px solid var(--green);outline-offset:2px}

        .bap-verify .head{text-align:center;margin-bottom:8px}
        .bap-verify .section{border:1px solid var(--line);border-radius:14px;padding:22px;margin-top:20px}
        .bap-verify .section h2{font-size:17px;margin:0 0 6px;display:flex;align-items:center;gap:8px;color:var(--navy)}
        .bap-verify .section p{color:var(--muted);font-size:14px;line-height:1.6;margin:0 0 14px}
        .bap-verify .cta-btn{display:inline-flex;align-items:center;gap:8px;background:var(--blue);color:#fff;border:0;border-radius:10px;padding:12px 20px;font-weight:700;font-size:15px;cursor:pointer;text-decoration:none}
        .bap-verify .cta-btn:hover{background:#2a5570}
        .bap-verify .cta-btn.green{background:var(--green)}
        .bap-verify .cta-btn.green:hover{background:#649636}
        .bap-verify .info-box{background:var(--paper);border-radius:10px;padding:12px 14px;font-size:14px;margin-bottom:14px}
        .bap-verify .info-box b{color:var(--navy)}
        .bap-verify .children-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:14px}
        .bap-verify .child-card{border:1px solid var(--line);border-radius:12px;padding:16px;text-align:center;background:var(--paper)}
        .bap-verify .child-card h3{margin:0 0 10px;font-size:15px;color:var(--navy)}
        .bap-verify .child-card img{width:140px;height:140px;border-radius:8px;border:1px solid var(--line);background:#fff}
        .bap-verify .pin{margin:10px 0;font-size:20px;font-weight:700;letter-spacing:4px;color:var(--green)}
        .bap-verify .pin-label{font-size:12px;color:var(--muted);margin-bottom:2px}
        .bap-verify .dl-btn{display:inline-flex;align-items:center;gap:6px;margin-top:10px;background:#fff;border:1px solid var(--blue);color:var(--blue);border-radius:8px;padding:7px 12px;font-size:13px;font-weight:600;cursor:pointer}
        .bap-verify .dl-btn:hover{background:var(--soft)}
        .bap-verify .mobile-box{display:flex;align-items:center;gap:10px;background:var(--paper);border:1px dashed var(--blue);border-radius:10px;padding:12px 14px;font-size:13px;word-break:break-all;color:var(--muted);margin-bottom:12px}
        .bap-verify .copy-btn{display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px 16px;font-size:14px;font-weight:600;color:var(--navy);cursor:pointer}
        .bap-verify .copy-btn.copied{background:var(--soft);border-color:var(--green);color:#3f6b1f}
        .bap-verify .tip{margin-top:14px;background:#e3f2fd;color:#1565c0;border-radius:10px;padding:12px 14px;font-size:13px;line-height:1.5}
      `}</style>

      <button className="brand" onClick={() => navigate('/')}>Bon<i>App</i></button>

      {status === 'loading' && (
        <div className="card">
          <div className="spinner" />
          <h1>מאמת את ההרשמה...</h1>
          <p className="intro">רגע אחד, זה ייקח כמה שניות.</p>
        </div>
      )}

      {status === 'error' && (
        <div className="card">
          <div className="icon error"><AlertCircle size={30} /></div>
          <h1>לא ניתן לאמת את ההרשמה</h1>
          <p className="intro">{message}</p>
          <button className="login-link" onClick={() => navigate('/register')}>
            <Home size={16} />
            חזרה לטופס ההרשמה
          </button>
        </div>
      )}

      {status === 'success' && result && (
        <div className="card wide">
          <div className="head">
            <div className="icon success"><Check size={30} /></div>
            <h1>ההרשמה אומתה בהצלחה!</h1>
            <p className="intro">החשבון פעיל עכשיו. הנה כל מה שצריך כדי להתחיל.</p>
          </div>

          <div className="section">
            <h2><LogIn size={18} /> התחברות למערכת</h2>
            <div className="info-box">
              <b>שם משתמש:</b> {result.parentEmail}<br />
              <b>סיסמה:</b> הסיסמה שבחרתם בטופס ההרשמה
            </div>
            <a className="cta-btn" href="/login">
              <LogIn size={16} />
              כניסה למערכת
            </a>
          </div>

          <div className="section">
            <h2><Wallet size={18} /> ביצוע תשלום</h2>
            <p>אחרי הכניסה, בעמוד ההורה אפשר לבחור תשלום חודשי או תשלום בודד ולהוסיף יתרה לכל ילד/ה.</p>
            <a className="cta-btn green" href="/login">
              <Wallet size={16} />
              כניסה לתשלום
            </a>
          </div>

          {result.students?.length > 0 && (
            <div className="section">
              <h2><QrCode size={18} /> ברקוד וקוד PIN לילדים</h2>
              <p>סורקים את קוד ה-QR (או מקלידים את קוד ה-PIN) בקופה או בקיוסק העצמאי בבית הספר.</p>
              <div className="children-grid">
                {result.students.map(student => (
                  <div key={student.id} className="child-card">
                    <h3>{student.name}</h3>
                    {student.qrImage && <img src={student.qrImage} alt={`QR - ${student.name}`} />}
                    {student.pin && (
                      <>
                        <div className="pin-label">קוד PIN</div>
                        <div className="pin">{student.pin}</div>
                      </>
                    )}
                    {student.qrImage && (
                      <button className="dl-btn" onClick={() => handleDownloadQR(student)}>
                        <Download size={14} />
                        הורדת QR
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {result.mobileUrl && (
            <div className="section">
              <h2><Smartphone size={18} /> אפליקציה לטלפון</h2>
              <p>קישור אישי לפאנל ההורה הידידותי לנייד - אפשר לפתוח אותו בטלפון ולהוסיף למסך הבית.</p>
              <div className="mobile-box">{result.mobileUrl}</div>
              <button className={`copy-btn ${copied ? 'copied' : ''}`} onClick={handleCopyMobileLink}>
                {copied ? <Check size={16} /> : <Copy size={16} />}
                {copied ? 'הועתק!' : 'העתקת קישור'}
              </button>
              <div className="tip">
                💡 <b>טיפ:</b> אחרי פתיחת הקישור בטלפון, אפשר ללחוץ על "הוסף למסך הבית" כדי להפוך אותו לזמין כמו אפליקציה.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default VerifyRegistrationPage;
