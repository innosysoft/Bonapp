import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PaymentSuccess = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // אחרי 5 שניות חזור לפאנל הורה
    const timer = setTimeout(() => {
      window.location.href = '/parent-dashboard';
    }, 5000);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #356b8c 0%, #17324a 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{
        background: 'white',
        borderRadius: '20px',
        padding: '3rem',
        textAlign: 'center',
        maxWidth: '500px',
        width: '90%',
        boxShadow: '0 20px 60px rgba(0,0,0,0.2)'
      }}>
        <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>✅</div>
        <h1 style={{ color: '#5f8a36', fontSize: '2rem', marginBottom: '1rem' }}>
          התשלום התקבל בהצלחה!
        </h1>
        <p style={{ color: '#607482', fontSize: '1.1rem', marginBottom: '1rem' }}>
          היתרה תתעדכן בקרוב בחשבונך
        </p>
        <p style={{ color: '#607482', fontSize: '0.95rem', marginBottom: '2rem', 
          background: '#f4f7f7', padding: '1rem', borderRadius: '8px' }}>
          📧 חשבונית תשלום תישלח למייל שלך.<br/>
          אם לא מופיעה - בדוק בתיקיית הספאם.
        </p>
        
        <p style={{ color: '#607482', fontSize: '0.9rem', marginBottom: '2rem' }}>
          מועבר לפאנל ההורה בעוד 5 שניות...
        </p>
        <button
          onClick={() => navigate('/parent-dashboard')}
          style={{
            background: 'linear-gradient(135deg, #75a843, #5f8a36)',
            color: 'white',
            border: 'none',
            padding: '1rem 2rem',
            borderRadius: '12px',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          חזור לפאנל ההורה
        </button>
      </div>
    </div>
  );
};

export default PaymentSuccess;