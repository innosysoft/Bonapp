import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { resetPasswordWithToken } from '../api';
import { Lock, Eye, EyeOff, AlertCircle, Check, Home } from 'lucide-react';

// מסך קביעת סיסמה חדשה, מגיע מקישור איפוס סיסמה שנשלח במייל (/reset-password?token=...).
const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token') || '';

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!token) {
      setError('קישור לא תקין. יש לבקש קישור חדש מדף הכניסה.');
      return;
    }
    if (!password || !confirmPassword) {
      setError('נא למלא את שני שדות הסיסמה');
      return;
    }
    if (password.length < 6) {
      setError('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    if (password !== confirmPassword) {
      setError('הסיסמאות אינן תואמות');
      return;
    }

    setIsLoading(true);
    try {
      const result = await resetPasswordWithToken(token, password);
      if (result.success) {
        setSuccess(true);
      } else {
        setError(result.message || 'שגיאה באיפוס הסיסמה');
      }
    } catch (error) {
      setError('שגיאה באיפוס הסיסמה. נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bap-reset">
      <style>{`
        .bap-reset{
          --navy:#17324a;--blue:#356b8c;--green:#75a843;--paper:#f7faf8;--white:#fff;
          --muted:#607482;--line:#dce6e9;--soft:#eef6e9;
          font-family:'Heebo',Arial,sans-serif;color:var(--navy);background:var(--paper);
          min-height:100vh;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;
        }
        .bap-reset *{box-sizing:border-box}
        .bap-reset button,.bap-reset input,.bap-reset a{font:inherit}
        .bap-reset .brand{font-size:26px;font-weight:700;color:var(--blue);letter-spacing:-1px;background:none;border:0;cursor:pointer;margin-bottom:24px}
        .bap-reset .brand i{font-style:normal;color:var(--green)}
        .bap-reset .card{background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:0 10px 30px rgba(23,50,74,.08);padding:36px;width:100%;max-width:420px}
        .bap-reset h1{font-size:26px;margin:0 0 8px}
        .bap-reset .intro{color:var(--muted);font-size:15px;margin:0 0 24px;line-height:1.5}
        .bap-reset .field{margin-bottom:18px}
        .bap-reset .field label{display:block;font-size:14px;font-weight:600;margin-bottom:8px}
        .bap-reset .input-wrap{position:relative}
        .bap-reset .input-wrap input{width:100%;height:50px;border:1px solid var(--line);border-radius:11px;padding:0 46px 0 14px;font-size:16px;outline:none}
        .bap-reset .input-wrap input:focus{border-color:var(--blue);box-shadow:0 0 0 3px rgba(53,107,140,.12)}
        .bap-reset .input-icon{position:absolute;right:15px;top:50%;transform:translateY(-50%);color:#78909c;pointer-events:none}
        .bap-reset .show{position:absolute;left:6px;top:50%;transform:translateY(-50%);border:0;background:transparent;color:var(--blue);padding:8px;cursor:pointer;display:flex;align-items:center;border-radius:8px}
        .bap-reset .submit-btn{width:100%;height:50px;border:0;border-radius:11px;background:var(--blue);color:#fff;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;font-size:16px}
        .bap-reset .submit-btn:disabled{opacity:.7;cursor:not-allowed}
        .bap-reset .submit-btn:focus-visible,.bap-reset .show:focus-visible,.bap-reset .login-link:focus-visible{outline:3px solid var(--green);outline-offset:2px}
        .bap-reset .spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,.35);border-top-color:#fff;border-radius:50%;animation:bap-reset-spin .8s linear infinite}
        @keyframes bap-reset-spin{to{transform:rotate(360deg)}}
        .bap-reset .message{display:flex;align-items:flex-start;gap:8px;padding:12px 14px;border-radius:10px;margin-bottom:18px;font-size:14px;line-height:1.5}
        .bap-reset .message.error{background:#fdecea;color:#a83236;border:1px solid #f3c8c9}
        .bap-reset .message.success{background:var(--soft);color:#3f6b1f;border:1px solid #d7e8cb}
        .bap-reset .success-icon{width:56px;height:56px;border-radius:50%;background:var(--soft);color:var(--green);display:grid;place-items:center;margin:0 auto 16px}
        .bap-reset .center{text-align:center}
        .bap-reset .login-link{display:inline-flex;align-items:center;gap:8px;color:var(--blue);font-weight:700;background:none;border:0;cursor:pointer;margin-top:8px;font-size:15px}
      `}</style>

      <button className="brand" onClick={() => navigate('/')}>Bon<i>App</i></button>

      <div className="card">
        {success ? (
          <div className="center">
            <div className="success-icon"><Check size={28} /></div>
            <h1>הסיסמה עודכנה בהצלחה</h1>
            <p className="intro">אפשר להתחבר עכשיו עם הסיסמה החדשה.</p>
            <button className="login-link" onClick={() => navigate('/login')}>
              <Home size={16} />
              מעבר לדף הכניסה
            </button>
          </div>
        ) : (
          <>
            <h1>קביעת סיסמה חדשה</h1>
            <p className="intro">הזינו סיסמה חדשה לחשבון שלכם.</p>

            {!token && (
              <div className="message error" role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>הקישור אינו תקין. יש לבקש קישור חדש מדף הכניסה.</span>
              </div>
            )}
            {error && (
              <div className="message error" role="alert">
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: '1px' }} />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate>
              <div className="field">
                <label htmlFor="new-password">סיסמה חדשה</label>
                <div className="input-wrap">
                  <input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="לפחות 6 תווים"
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

              <div className="field">
                <label htmlFor="confirm-password">אימות סיסמה</label>
                <div className="input-wrap">
                  <input
                    id="confirm-password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="הקלידו שוב את הסיסמה"
                    disabled={isLoading}
                  />
                  <Lock size={18} className="input-icon" />
                </div>
              </div>

              <button type="submit" className="submit-btn" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <span className="spinner" />
                    מעדכן...
                  </>
                ) : (
                  'עדכון סיסמה'
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};

export default ResetPasswordPage;
