import React, { useState } from 'react';
import { loginUser } from '../api';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  Lock, 
  ArrowRight, 
  Eye, 
  EyeOff,
  LogIn,
  Home,
  Phone,
  Mail,
  AlertCircle,
  Check
} from 'lucide-react';

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
    
    // שמירת פרטי המשתמש
    localStorage.setItem('currentUser', JSON.stringify(result.user));

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

  const mainStyles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    formContainer: {
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(20px)',
      borderRadius: '24px',
      padding: '3rem',
      width: '100%',
      maxWidth: '450px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)',
      border: '1px solid rgba(255, 255, 255, 0.3)'
    },
    header: {
      textAlign: 'center',
      marginBottom: '2.5rem'
    },
    logo: {
      width: '80px',
      height: '80px',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 1.5rem'
    },
    title: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#333',
      margin: '0 0 0.5rem 0'
    },
    subtitle: {
      color: '#666',
      fontSize: '1rem',
      margin: 0
    },
    form: {
      width: '100%'
    },
    fieldGroup: {
      marginBottom: '1.5rem'
    },
    label: {
      display: 'block',
      fontSize: '0.9rem',
      fontWeight: '600',
      color: '#555',
      marginBottom: '0.5rem'
    },
    inputWrapper: {
      position: 'relative'
    },
    input: {
      width: '100%',
      padding: '1rem 1rem 1rem 3rem',
      border: '2px solid #e1e5e9',
      borderRadius: '12px',
      fontSize: '1rem',
      transition: 'all 0.3s',
      background: 'white',
      boxSizing: 'border-box'
    },
    inputFocused: {
      borderColor: '#667eea',
      boxShadow: '0 0 0 3px rgba(102, 126, 234, 0.1)'
    },
    inputIcon: {
      position: 'absolute',
      left: '1rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#999'
    },
    passwordToggle: {
      position: 'absolute',
      right: '1rem',
      top: '50%',
      transform: 'translateY(-50%)',
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      color: '#999',
      padding: '0.25rem'
    },
    submitButton: {
      width: '100%',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: 'white',
      border: 'none',
      padding: '1rem 2rem',
      borderRadius: '12px',
      fontSize: '1.1rem',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
      marginTop: '1rem'
    },
    submitButtonDisabled: {
      opacity: 0.7,
      cursor: 'not-allowed'
    },
    homeButton: {
      position: 'absolute',
      top: '2rem',
      left: '2rem',
      background: 'rgba(255, 255, 255, 0.9)',
      border: 'none',
      borderRadius: '50%',
      width: '50px',
      height: '50px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'all 0.3s',
      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.1)'
    },
    demoUsers: {
      marginTop: '2rem',
      padding: '1.5rem',
      background: 'rgba(102, 126, 234, 0.05)',
      borderRadius: '12px',
      border: '1px solid rgba(102, 126, 234, 0.1)'
    },
    demoTitle: {
      fontSize: '0.9rem',
      fontWeight: '600',
      color: '#667eea',
      marginBottom: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    demoUser: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.5rem 0',
      borderBottom: '1px solid rgba(102, 126, 234, 0.1)',
      fontSize: '0.85rem'
    },
    demoUser_last: {
      borderBottom: 'none'
    },
    demoUsername: {
      color: '#333',
      fontWeight: '500'
    },
    demoType: {
      color: '#666',
      fontSize: '0.8rem'
    },
    message: {
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      margin: '1rem 0',
      fontSize: '0.9rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    errorMessage: {
      background: '#fee',
      color: '#c33',
      border: '1px solid #fcc'
    },
    successMessage: {
      background: '#efe',
      color: '#393',
      border: '1px solid #cfc'
    }
  };

  return (
    <div style={mainStyles.container}>
      {/* כפתור חזרה לבית */}
      <button 
        style={mainStyles.homeButton}
        onClick={() => navigate('/')}
        title="חזרה לדף הבית"
      >
        <Home size={20} color="#667eea" />
      </button>

      <div style={mainStyles.formContainer}>
        {/* כותרת */}
        <div style={mainStyles.header}>
          <div style={mainStyles.logo}>
            <LogIn size={40} color="white" />
          </div>
          <h1 style={mainStyles.title}>כניסה למערכת</h1>
          <p style={mainStyles.subtitle}>
            הזן את פרטי ההתחברות שלך
          </p>
        </div>

        {/* הודעות שגיאה/הצלחה */}
        {error && (
          <div style={{...mainStyles.message, ...mainStyles.errorMessage}}>
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {success && (
          <div style={{...mainStyles.message, ...mainStyles.successMessage}}>
            <Check size={16} />
            {success}
          </div>
        )}

        {/* טופס התחברות */}
        <form style={mainStyles.form} onSubmit={handleLogin}>
          <div style={mainStyles.fieldGroup}>
            <label style={mainStyles.label}>שם משתמש</label>
            <div style={mainStyles.inputWrapper}>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleInputChange}
                placeholder="מייל או מספר טלפון"
                style={mainStyles.input}
                disabled={isLoading}
              />
              <User size={18} style={mainStyles.inputIcon} />
            </div>
          </div>

          <div style={mainStyles.fieldGroup}>
            <label style={mainStyles.label}>סיסמה</label>
            <div style={mainStyles.inputWrapper}>
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder="הזן סיסמה"
                style={mainStyles.input}
                disabled={isLoading}
              />
              <Lock size={18} style={mainStyles.inputIcon} />
              <button
                type="button"
                style={mainStyles.passwordToggle}
                onClick={() => setShowPassword(!showPassword)}
                disabled={isLoading}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{
              ...mainStyles.submitButton,
              ...(isLoading ? mainStyles.submitButtonDisabled : {})
            }}
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <div style={{ 
                  width: '18px', 
                  height: '18px', 
                  border: '2px solid rgba(255,255,255,0.3)',
                  borderTop: '2px solid white',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }} />
                מתחבר...
              </>
            ) : (
              <>
                כניסה
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </form>
</div>
        

      {/* CSS לאנימציה */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default UniversalLogin;