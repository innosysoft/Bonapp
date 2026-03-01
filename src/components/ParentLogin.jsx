import React, { useState } from 'react';
import { Eye, EyeOff, Phone, Lock, School, LogIn } from 'lucide-react';
import { loginUser } from '../api';
import { useNavigate } from 'react-router-dom';

const ParentLogin = () => {
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    phone: '',
    password: ''
  });
  
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');
  

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(''); // נקה שגיאות כשהמשתמש מתחיל להקליד
  };

  const handleLogin = async () => {
  setError('');
  
  if (!formData.phone || !formData.password) {
    setError('אנא מלא את כל השדות');
    return;
  }
  
  setIsLoading(true);
  
  try {
    // קריאה אמיתית לשרת (לא סימולציה)
    const result = await loginUser(formData.phone, formData.password);
    
    if (!result.success) {
      setError(result.message || 'שגיאה בהתחברות');
      setIsLoading(false);
      return;
    }
    
    // שמירת פרטי המשתמש
    localStorage.setItem('currentUser', JSON.stringify(result.user));
    
    // מעבר לדשבורד הורים
    navigate('/parent-dashboard');
    
  } catch (err) {
    setError('שגיאה בכניסה. בדוק את הפרטים ונסה שוב.');
    setIsLoading(false);
  }
};

  const handleForgotPassword = () => {
    alert('קישור איפוס סיסמה יישלח לטלפון שלך בקרוב');
  };

  const loginStyles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #e3f2fd 0%, #e8eaf6 100%)',
      padding: '2rem 1rem',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    card: {
      maxWidth: '400px',
      width: '100%',
      background: 'white',
      borderRadius: '16px',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      padding: '3rem 2rem'
    },
    header: {
      textAlign: 'center',
      marginBottom: '3rem'
    },
    iconContainer: {
      width: '64px',
      height: '64px',
      background: '#e3f2fd',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 1rem'
    },
    title: {
      fontSize: '2rem',
      fontWeight: '700',
      color: '#1a1a1a',
      margin: '0.5rem 0'
    },
    subtitle: {
      color: '#666',
      fontSize: '1rem'
    },
    formGroup: {
      marginBottom: '1.5rem'
    },
    label: {
      display: 'block',
      fontWeight: '600',
      color: '#333',
      marginBottom: '0.5rem',
      textAlign: 'right',
      fontSize: '0.9rem'
    },
    inputWrapper: {
      position: 'relative',
      display: 'flex',
      alignItems: 'center'
    },
    input: {
      width: '100%',
      padding: '12px 48px 12px 16px',
      border: '2px solid #e0e0e0',
      borderRadius: '8px',
      fontSize: '1rem',
      transition: 'all 0.3s',
      boxSizing: 'border-box'
    },
    inputIcon: {
      position: 'absolute',
      right: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#999'
    },
    passwordToggle: {
      position: 'absolute',
      left: '12px',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      color: '#999',
      cursor: 'pointer',
      padding: '4px',
      borderRadius: '4px',
      transition: 'color 0.3s'
    },
    button: {
      width: '100%',
      padding: '12px 24px',
      borderRadius: '8px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      border: 'none',
      background: '#2196f3',
      color: 'white',
      marginBottom: '1rem'
    },
    buttonDisabled: {
      background: '#e0e0e0',
      color: '#999',
      cursor: 'not-allowed'
    },
    forgotPassword: {
      background: 'none',
      border: 'none',
      color: '#2196f3',
      cursor: 'pointer',
      textDecoration: 'underline',
      fontSize: '0.9rem',
      padding: '0.5rem',
      width: '100%'
    },
    errorBanner: {
      background: '#ffebee',
      border: '1px solid #f44336',
      borderRadius: '8px',
      padding: '1rem',
      marginBottom: '1.5rem',
      textAlign: 'right'
    },
    errorText: {
      color: '#f44336',
      fontSize: '0.9rem',
      margin: 0
    },
    registerSection: {
      textAlign: 'center',
      marginTop: '2rem',
      paddingTop: '2rem',
      borderTop: '1px solid #e0e0e0'
    },
    registerText: {
      color: '#666',
      margin: 0
    },
    registerLink: {
      background: 'none',
      border: 'none',
      color: '#2196f3',
      cursor: 'pointer',
      textDecoration: 'underline',
      marginRight: '0.5rem'
    },
    infoSection: {
      marginTop: '2rem'
    },
    infoBox: {
      background: '#f5f9ff',
      border: '1px solid #e3f2fd',
      borderRadius: '8px',
      padding: '1rem'
    },
    infoTitle: {
      fontSize: '1rem',
      fontWeight: '600',
      color: '#1976d2',
      textAlign: 'right',
      margin: '0 0 0.5rem 0'
    },
    infoList: {
      margin: 0,
      paddingRight: '1rem',
      textAlign: 'right'
    },
    infoListItem: {
      color: '#666',
      fontSize: '0.9rem',
      marginBottom: '0.25rem'
    },
    supportSection: {
      textAlign: 'center',
      marginTop: '2rem'
    },
    supportText: {
      color: '#666'
    },
    supportLink: {
      color: '#2196f3',
      textDecoration: 'none',
      marginRight: '0.5rem'
    },
    spinner: {
      width: '20px',
      height: '20px',
      border: '2px solid #ffffff',
      borderTop: '2px solid transparent',
      borderRadius: '50%',
      animation: 'spin 1s linear infinite'
    }
  };

  return (
    <>
      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}
      </style>
      <div style={loginStyles.container}>
        <div style={loginStyles.card}>
          {/* כותרת */}
          <div style={loginStyles.header}>
            <div style={loginStyles.iconContainer}>
              <School size={32} color="#2196f3" />
            </div>
            <h1 style={loginStyles.title}>כניסה למערכת ארוחות</h1>
            <p style={loginStyles.subtitle}>הזן את פרטי הכניסה שלך</p>
          </div>

          <div>
            {error && (
              <div style={loginStyles.errorBanner}>
                <p style={loginStyles.errorText}>{error}</p>
              </div>
            )}

            {/* טלפון */}
            <div style={loginStyles.formGroup}>
              <label style={loginStyles.label}>
                מספר טלפון *
              </label>
              <div style={loginStyles.inputWrapper}>
                <Phone style={loginStyles.inputIcon} size={20} />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  style={{
                    ...loginStyles.input,
                    textAlign: 'right'
                  }}
                  placeholder="050-1234567"
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* סיסמה */}
            <div style={loginStyles.formGroup}>
              <label style={loginStyles.label}>
                סיסמה *
              </label>
              <div style={loginStyles.inputWrapper}>
                <Lock style={loginStyles.inputIcon} size={20} />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={loginStyles.passwordToggle}
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={formData.password}
                  onChange={(e) => updateFormData('password', e.target.value)}
                  style={{
                    ...loginStyles.input,
                    paddingRight: '48px',
                    paddingLeft: '48px'
                  }}
                  placeholder="הכנס סיסמה"
                  disabled={isLoading}
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleLogin();
                    }
                  }}
                />
              </div>
            </div>

            {/* כפתור כניסה */}
            <div>
              <button
                onClick={handleLogin}
                disabled={isLoading || !formData.phone || !formData.password}
                style={{
                  ...loginStyles.button,
                  ...(isLoading || !formData.phone || !formData.password ? loginStyles.buttonDisabled : {})
                }}
              >
                {isLoading ? (
                  <>
                    <div style={loginStyles.spinner}></div>
                    <span>מתחבר...</span>
                  </>
                ) : (
                  <>
                    <LogIn size={20} />
                    <span>כניסה</span>
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleForgotPassword}
                style={loginStyles.forgotPassword}
                disabled={isLoading}
              >
                שכחתי סיסמה
              </button>
            </div>
          </div>

          {/* הרשמה חדשה */}
          <div style={loginStyles.registerSection}>
            <p style={loginStyles.registerText}>
              עדיין אין לך חשבון? 
              <button style={loginStyles.registerLink}>
                הרשם כאן
              </button>
            </p>
          </div>

          {/* מידע נוסף */}
          <div style={loginStyles.infoSection}>
            <div style={loginStyles.infoBox}>
              <h3 style={loginStyles.infoTitle}>זוכרים את הפרטים?</h3>
              <ul style={loginStyles.infoList}>
                <li style={loginStyles.infoListItem}>טלפון = אותו מספר שרשמתם בהרשמה</li>
                <li style={loginStyles.infoListItem}>סיסמה = הסיסמה שיצרתם בהרשמה</li>
                <li style={loginStyles.infoListItem}>אם שכחתם, לחצו על "שכחתי סיסמה"</li>
              </ul>
            </div>
          </div>
        </div>

        {/* תמיכה */}
        <div style={loginStyles.supportSection}>
          <p style={loginStyles.supportText}>
            נתקלתם בבעיה? 
            <a href="mailto:support@schoollunch.co.il" style={loginStyles.supportLink}>
              צרו קשר עם התמיכה
            </a>
          </p>
        </div>
      </div>
    </>
  );
};

export default ParentLogin;