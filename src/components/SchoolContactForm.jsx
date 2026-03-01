import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Home, Building2, Phone, Mail, CheckCircle, AlertCircle } from 'lucide-react';

const SchoolContactForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
  organizationName: '',
  fullName: '',
  phone: '',
  email: ''
});

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // בדיקות
    if (!formData.organizationName || !formData.fullName || !formData.phone || !formData.email) {
  setError('נא למלא את כל השדות');
  return;
}

    setIsSubmitting(true);

    try {
      // שליחה לשרת
      const response = await fetch('https://api.bonapp.dev/api/school-contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        setSuccess(true);
        setFormData({ organizationName: '', fullName: '', phone: '', email: '' });
      } else {
        setError('שגיאה בשליחת הטופס');
      }
    } catch (error) {
      console.error('Submit error:', error);
      setError('שגיאה בשליחת הטופס');
    }

    setIsSubmitting(false);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const styles = {
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
      maxWidth: '550px',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
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
    inputIcon: {
      position: 'absolute',
      left: '1rem',
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#999'
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
      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)',
      marginTop: '1rem'
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
    message: {
      padding: '0.75rem 1rem',
      borderRadius: '8px',
      margin: '1rem 0',
      fontSize: '0.9rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    successMessage: {
      background: '#efe',
      color: '#393',
      border: '1px solid #cfc'
    },
    errorMessage: {
      background: '#fee',
      color: '#c33',
      border: '1px solid #fcc'
    },
    infoBox: {
      background: '#f0f4ff',
      padding: '1.5rem',
      borderRadius: '12px',
      marginTop: '1.5rem',
      border: '2px solid #667eea'
    },
    infoText: {
      color: '#667eea',
      fontSize: '0.95rem',
      lineHeight: '1.6',
      margin: 0,
      textAlign: 'center'
    }
  };

  return (
    <div style={styles.container}>
      <button 
        style={styles.homeButton}
        onClick={() => navigate('/')}
        title="חזרה לדף הבית"
      >
        <Home size={20} color="#667eea" />
      </button>

      <div style={styles.formContainer}>
        <div style={styles.header}>
          <div style={styles.logo}>
            <Building2 size={40} color="white" />
          </div>
          <h1 style={styles.title}>הצטרפות בית ספר</h1>
          <p style={styles.subtitle}>
            השאירו פרטים ונחזור אליכם בהקדם
          </p>
        </div>

        {success ? (
          <div style={{...styles.message, ...styles.successMessage}}>
            <CheckCircle size={20} />
            <div>
              <strong>תודה רבה!</strong><br />
              קיבלנו את הפרטים ונחזור אליכם בהקדם האפשרי.
            </div>
          </div>
        ) : (
          <>
            {error && (
              <div style={{...styles.message, ...styles.errorMessage}}>
                <AlertCircle size={16} />
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={styles.fieldGroup}>
  <label style={styles.label}>שם הארגון / בית הספר</label>
  <div style={styles.inputWrapper}>
    <input
      type="text"
      name="organizationName"
      value={formData.organizationName}
      onChange={handleChange}
      placeholder="בית הספר היסודי..."
      style={styles.input}
      disabled={isSubmitting}
    />
    <Building2 size={18} style={styles.inputIcon} />
  </div>
</div>

<div style={styles.fieldGroup}>
  <label style={styles.label}>שם מלא</label>
  <div style={styles.inputWrapper}>
    <input
      type="text"
      name="fullName"
      value={formData.fullName}
      onChange={handleChange}
      placeholder="ישראל ישראלי"
      style={styles.input}
      disabled={isSubmitting}
    />
    <Building2 size={18} style={styles.inputIcon} />
  </div>
</div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>טלפון</label>
                <div style={styles.inputWrapper}>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    placeholder="050-1234567"
                    style={styles.input}
                    disabled={isSubmitting}
                  />
                  <Phone size={18} style={styles.inputIcon} />
                </div>
              </div>

              <div style={styles.fieldGroup}>
                <label style={styles.label}>אימייל</label>
                <div style={styles.inputWrapper}>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="school@example.com"
                    style={styles.input}
                    disabled={isSubmitting}
                  />
                  <Mail size={18} style={styles.inputIcon} />
                </div>
              </div>

              <button
                type="submit"
                style={styles.submitButton}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'שולח...' : 'שלח פרטים'}
              </button>
            </form>

            <div style={styles.infoBox}>
              <p style={styles.infoText}>
                💡 נציג שלנו יצור איתכם קשר תוך 24 שעות<br />
                לקבלת הסבר מפורט והדגמה של המערכת
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SchoolContactForm;