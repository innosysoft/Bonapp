import React, { useState } from 'react';
import { loginUser } from '../api';
import { setToken } from '../auth';
import { useNavigate } from 'react-router-dom';
import { User, Lock, Eye, EyeOff, Home, AlertCircle, Check } from 'lucide-react';

// עיצוב מסך הכניסה - מבוסס על דגם bonapp-login-design.html שאושר.
// לוגיקת ההתחברות (state, handleLogin, handleInputChange, ניתוב לפי תפקיד) נשמרה
// במלואה כפי שהייתה - רק שכבת התצוגה הוחלפה.
const UniversalLogin = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (error) setError(''); // מנקה שגיאה כשמתחילים להקליד
  };

  const handleLogin = async (e) => {
  e.preventDefault();
  setIsLoading(true);
  setError('');
  setSuccess('');

  // בדיקות בסיס
  if (!formData.username || !formData.password) {
    setError('נא למלא את כל השדות');
    setIsLoading(false);
    return;
  }

  try {
    // קריאה אמיתית לserver
    const result = await loginUser(formData.username, formData.password);

    if (!result.success) {
      setError(result.message || 'שגיאה בהתחברות');
      setIsLoading(false);
      return;
    }

    // הצלחה - הודעה ומעבר
    setSuccess(`ברוך הבא ${result.user.name}! מעביר אותך למערכת...`);

    // שמירת פרטי המשתמש וה-token
    localStorage.setItem('currentUser', JSON.stringify(result.user));
    setToken(result.token);

    // מעבר לדף המתאים
    setTimeout(() => {
      switch(result.user.type) {
        case 'parent':
          navigate('/parent-dashboard');
          break;
        case 'kitchen':
          navigate('/kitchen-scanner');
          break;

        case 'secretary':
  navigate('/secretary-panel');
  break;

        case 'admin':
case 'super_admin':
  navigate('/admin');
  break;
default:
  navigate('/parent-dashboard');

      }
    }, 1000);

  } catch (error) {
    setError('שגיאה בהתחברות. נסה שוב.');
    setIsLoading(false);
  }
};

  return (
    <div className="bap-login">
      <style>{`
        .bap-login{
          --navy:#17324a;--blue:#356b8c;--green:#75a843;--paper:#f7faf8;--white:#fff;
          --muted:#607482;--line:#dce6e9;--soft:#eef6e9;
          font-family:'Heebo',Arial,sans-serif;color:var(--navy);background:var(--white);
        }
        .bap-login *{box-sizing:border-box}
        .bap-login button,.bap-login input,.bap-login a{font:inherit}
        .bap-login a{color:inherit;text-decoration:none}
        .bap-login .screen{min-height:100vh;display:grid;grid-template-columns:minmax(440px,44%) 1fr}
        .bap-login .form-side{background:#fff;display:flex;flex-direction:column;padding:30px 7vw 24px;position:relative}
        .bap-login .brand-row{display:flex;align-items:center;justify-content:space-between}
        .bap-login .brand{font-size:29px;font-weight:700;color:var(--blue);letter-spacing:-1px;cursor:pointer;background:none;border:none;padding:0}
        .bap-login .brand i{font-style:normal;color:var(--green)}
        .bap-login .home-link{display:inline-flex;gap:8px;align-items:center;color:var(--muted);font-size:14px;background:none;border:none;cursor:pointer;padding:0}
        .bap-login .home-link span{width:34px;height:34px;border:1px solid var(--line);border-radius:10px;display:grid;place-items:center;color:var(--blue)}
        .bap-login .form-wrap{width:min(430px,100%);margin:auto}
        .bap-login .kicker{font-size:14px;color:var(--green);font-weight:700;margin-bottom:8px}
        .bap-login .form-wrap h1{font-size:40px;letter-spacing:-1px;line-height:1.15;margin:0 0 10px}
        .bap-login .intro{color:var(--muted);font-size:17px;margin:0 0 34px}
        .bap-login .field{margin-bottom:20px}
        .bap-login .field-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px}
        .bap-login .field label{font-size:14px;font-weight:600}
        .bap-login .input-wrap{position:relative}
        .bap-login .input-wrap input{width:100%;height:52px;border:1px solid var(--line);border-radius:11px;padding:0 46px 0 14px;color:var(--navy);background:#fff;font-size:16px;outline:none}
        .bap-login .input-wrap input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(53,107,140,.12)}
        .bap-login .input-wrap input:disabled{background:#f5f7f8;cursor:not-allowed}
        .bap-login .input-icon{position:absolute;right:15px;top:50%;transform:translateY(-50%);color:#78909c;pointer-events:none}
        .bap-login .show{position:absolute;left:6px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:var(--blue);padding:8px;cursor:pointer;display:flex;align-items:center;border-radius:8px}
        .bap-login .show:focus-visible,.bap-login .home-link:focus-visible,.bap-login .brand:focus-visible,.bap-login .new a:focus-visible{outline:3px solid var(--green);outline-offset:2px}
        .bap-login .login-btn{width:100%;height:52px;border:0;border-radius:11px;background:var(--blue);color:#fff;font-weight:700;cursor:pointer;margin-top:6px;box-shadow:0 8px 20px rgba(53,107,140,.18);display:flex;align-items:center;justify-content:center;gap:10px;font-size:16px}
        .bap-login .login-btn:hover:not(:disabled){background:#2e5f7d}
        .bap-login .login-btn:disabled{opacity:.7;cursor:not-allowed}
        .bap-login .login-btn:focus-visible{outline:3px solid var(--green);outline-offset:2px}
        .bap-login .spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:bap-spin 0.8s linear infinite}
        @keyframes bap-spin{to{transform:rotate(360deg)}}
        .bap-login .new{text-align:center;color:var(--muted);font-size:14px;margin-top:24px}
        .bap-login .new a{color:var(--blue);font-weight:700}
        .bap-login .secure{display:flex;gap:8px;align-items:center;justify-content:center;color:var(--muted);font-size:12px;margin-top:28px}
        .bap-login .form-footer{font-size:12px;color:#8a9da7;text-align:center;margin-top:24px}
        .bap-login .message{display:flex;align-items:flex-start;gap:8px;padding:12px 14px;border-radius:10px;margin-bottom:18px;font-size:14px;line-height:1.5}
        .bap-login .message.error{background:#fdecea;color:#a83236;border:1px solid #f3c8c9}
        .bap-login .message.success{background:var(--soft);color:#3f6b1f;border:1px solid #d7e8cb}
        .bap-login .visual{position:relative;overflow:hidden;background:url('/images/hero-banner.png') center/cover no-repeat}
        .bap-login .visual::after{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(16,43,61,.1),rgba(16,43,61,.62))}
        .bap-login .visual-copy{position:absolute;z-index:1;right:8%;bottom:9%;max-width:560px;color:#fff;text-shadow:0 2px 20px rgba(7,28,38,.45)}
        .bap-login .visual-copy .pill{display:inline-block;background:rgba(255,255,255,.92);color:var(--green);padding:7px 14px;border-radius:999px;font-size:13px;font-weight:700;text-shadow:none}
        .bap-login .visual-copy h2{font-size:43px;line-height:1.12;letter-spacing:-1px;margin:16px 0 12px}
        .bap-login .visual-copy p{font-size:18px;line-height:1.6;margin:0;max-width:520px}
        .bap-login .trust{display:flex;gap:24px;margin-top:26px;font-size:14px;list-style:none;padding:0}
        .bap-login .trust li::before{content:"✓";color:#b9dc9f;font-weight:700;margin-left:7px}

        @media(max-width:800px){
          .bap-login .screen{display:flex;flex-direction:column;min-height:100vh}
          .bap-login .visual{order:0;height:200px;flex:none;background-position:center}
          .bap-login .visual::after{background:linear-gradient(180deg,rgba(16,43,61,.03),rgba(16,43,61,.45))}
          .bap-login .visual-copy{right:20px;left:20px;bottom:18px}
          .bap-login .visual-copy .pill,.bap-login .visual-copy p,.bap-login .trust{display:none}
          .bap-login .visual-copy h2{font-size:25px;margin:0}
          .bap-login .form-side{order:1;flex:1;padding:20px 22px 26px}
          .bap-login .brand-row{position:absolute;z-index:3;top:-200px;right:20px;left:20px}
          .bap-login .brand{display:none}
          .bap-login .brand-row{justify-content:flex-end}
          .bap-login .home-link{color:#fff}
          .bap-login .home-link span{background:rgba(255,255,255,.93);color:var(--blue);border:0}
          .bap-login .form-wrap{margin:30px auto 20px}
          .bap-login .form-wrap h1{font-size:32px}
          .bap-login .intro{font-size:16px;margin-bottom:27px}
          .bap-login .form-footer{margin-top:auto;padding-bottom:80px}
        }
      `}</style>

      <main className="screen">
        <section className="form-side">
          <header className="brand-row">
            <button className="brand" onClick={() => navigate('/')}>Bon<i>App</i></button>
            <button className="home-link" onClick={() => navigate('/')}>
              <span><Home size={16} /></span>
              חזרה לדף הבית
            </button>
          </header>

          <div className="form-wrap">
            <div className="kicker">טוב לראות אותך שוב</div>
            <h1>כניסה למערכת</h1>
            <p className="intro">הזינו את פרטי ההתחברות כדי להמשיך לחשבון שלכם.</p>

            {error && (
              <div className="message error" role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{error}</span>
              </div>
            )}
            {success && (
              <div className="message success" role="status">
                <Check size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{success}</span>
              </div>
            )}

            <form onSubmit={handleLogin} noValidate>
              <div className="field">
                <div className="field-head">
                  <label htmlFor="login-username">שם משתמש</label>
                </div>
                <div className="input-wrap">
                  <input
                    id="login-username"
                    type="text"
                    name="username"
                    autoComplete="username"
                    value={formData.username}
                    onChange={handleInputChange}
                    placeholder="מייל או מספר טלפון"
                    disabled={isLoading}
                  />
                  <User size={18} className="input-icon" />
                </div>
              </div>

              <div className="field">
                <div className="field-head">
                  <label htmlFor="login-password">סיסמה</label>
                </div>
                <div className="input-wrap">
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="הקלידו סיסמה"
                    disabled={isLoading}
                  />
                  <Lock size={18} className="input-icon" />
                  <button
                    type="button"
                    className="show"
                    onClick={() => setShowPassword(s => !s)}
                    disabled={isLoading}
                    aria-label={showPassword ? 'הסתרת סיסמה' : 'הצגת סיסמה'}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <button type="submit" className="login-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner" />
                    מתחבר...
                  </>
                ) : (
                  'כניסה למערכת'
                )}
              </button>
            </form>

            <div className="new">
              עדיין אין לכם חשבון? <a href="/register" onClick={(e) => { e.preventDefault(); navigate('/register'); }}>רישום הורה חדש</a>
            </div>

            <div className="secure">✓ החיבור מאובטח והמידע שלכם נשמר בבטחה</div>
          </div>

          <footer className="form-footer">© {new Date().getFullYear()} BonApp מבית Innosys</footer>
        </section>

        <section className="visual" aria-label="תמונת רקע: ארוחה בריאה בבית הספר">
          <div className="visual-copy">
            <span className="pill">פחות התעסקות. יותר שקט.</span>
            <h2>כל מה שצריך לניהול הארוחות, במקום אחד</h2>
            <p>גישה פשוטה להורים, לצוות בית הספר ולמנהלי חדר האוכל.</p>
            <ul className="trust">
              <li>מאובטח</li>
              <li>פשוט לשימוש</li>
              <li>תמיכה אנושית</li>
            </ul>
          </div>
        </section>
      </main>
    </div>
  );
};

export default UniversalLogin;
