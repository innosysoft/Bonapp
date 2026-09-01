import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { verifyRegistration } from '../api';
import { Check, AlertCircle, Home } from 'lucide-react';

// מסך אימות הרשמת הורה, מגיע מקישור שנשלח במייל אחרי מילוי טופס ההרשמה
// (/verify-registration?token=...). מפעיל את החשבון בפועל מול השרת.
const VerifyRegistrationPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [status, setStatus] = useState('loading'); // loading | success | error
  const [message, setMessage] = useState('');
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
        const result = await verifyRegistration(token);
        if (result.success) {
          setStatus('success');
        } else {
          setStatus('error');
          setMessage(result.message || 'שגיאה באימות ההרשמה');
        }
      } catch (error) {
        setStatus('error');
        setMessage('שגיאה באימות ההרשמה. נסו שוב או פנו לבית הספר.');
      }
    })();
  }, [token]);

  return (
    <div className="bap-verify">
      <style>{`
        .bap-verify{
          --navy:#17324a;--blue:#356b8c;--green:#75a843;--paper:#f7faf8;--white:#fff;
          --muted:#607482;--line:#dce6e9;--soft:#eef6e9;
          font-family:'Heebo',Arial,sans-serif;color:var(--navy);background:var(--paper);
          min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;
        }
        .bap-verify *{box-sizing:border-box}
        .bap-verify button{font:inherit}
        .bap-verify .brand{font-size:26px;font-weight:700;color:var(--blue);letter-spacing:-1px;background:none;border:0;cursor:pointer;margin-bottom:24px}
        .bap-verify .brand i{font-style:normal;color:var(--green)}
        .bap-verify .card{background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 10px 30px rgba(23,50,74,.08);padding:36px;width:100%;max-width:440px;text-align:center}
        .bap-verify h1{font-size:24px;margin:0 0 10px}
        .bap-verify .intro{color:var(--muted);font-size:15px;margin:0;line-height:1.6}
        .bap-verify .icon{width:60px;height:60px;border-radius:50%;display:grid;place-items:center;margin:0 auto 18px}
        .bap-verify .icon.success{background:var(--soft);color:var(--green)}
        .bap-verify .icon.error{background:#fdecea;color:#a83236}
        .bap-verify .spinner{width:40px;height:40px;border:3px solid rgba(53,107,140,.2);border-top-color:var(--blue);border-radius:50%;animation:bap-verify-spin .8s linear infinite;margin:0 auto 18px}
        @keyframes bap-verify-spin{to{transform:rotate(360deg)}}
        .bap-verify .login-link{display:inline-flex;align-items:center;gap:8px;color:var(--blue);font-weight:700;background:none;border:0;cursor:pointer;margin-top:20px;font-size:15px}
        .bap-verify .login-link:focus-visible{outline:3px solid var(--green);outline-offset:2px}
      `}</style>

      <button className="brand" onClick={() => navigate('/')}>Bon<i>App</i></button>

      <div className="card">
        {status === 'loading' && (
          <>
            <div className="spinner" />
            <h1>מאמת את ההרשמה...</h1>
            <p className="intro">רגע אחד, זה ייקח כמה שניות.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="icon success"><Check size={30} /></div>
            <h1>ההרשמה אומתה בהצלחה!</h1>
            <p className="intro">החשבון פעיל עכשיו. אפשר להתחבר עם המייל והסיסמה שקבעתם בהרשמה.</p>
            <button className="login-link" onClick={() => navigate('/login')}>
              <Home size={16} />
              מעבר לדף הכניסה
            </button>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="icon error"><AlertCircle size={30} /></div>
            <h1>לא ניתן לאמת את ההרשמה</h1>
            <p className="intro">{message}</p>
            <button className="login-link" onClick={() => navigate('/register')}>
              <Home size={16} />
              חזרה לטופס ההרשמה
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default VerifyRegistrationPage;
