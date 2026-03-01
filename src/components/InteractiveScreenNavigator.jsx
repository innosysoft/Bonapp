import React, { useState } from 'react';
import { 
  UserPlus, 
  LogIn, 
  LayoutDashboard, 
  Camera, 
  Receipt,
  School,
  ArrowRight,
  Home
} from 'lucide-react';

// רכיבי דמה במקום הרכיבים האמיתיים (כי artifacts לא יכולים לייבא)
const DemoParentRegistration = () => (
  <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #e3f2fd 0%, #e8eaf6 100%)', padding: '2rem', textAlign: 'center', paddingTop: '10rem'}}>
    <h1 style={{color: '#1976d2', fontSize: '3rem', marginBottom: '2rem'}}>🎯 מסך הרשמת הורים</h1>
    <p style={{fontSize: '1.2rem', color: '#555'}}>זה דמה של מסך ההרשמה</p>
    <p style={{fontSize: '1rem', color: '#777', marginTop: '1rem'}}>
      במצב רגיל כאן יהיה המסך האמיתי של <code>ParentRegistrationForm</code>
    </p>
  </div>
);

const DemoParentLogin = () => (
  <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #e3f2fd 0%, #e8eaf6 100%)', padding: '2rem', textAlign: 'center', paddingTop: '10rem'}}>
    <h1 style={{color: '#2196F3', fontSize: '3rem', marginBottom: '2rem'}}>🔐 מסך כניסת הורים</h1>
    <p style={{fontSize: '1.2rem', color: '#555'}}>זה דמה של מסך הכניסה</p>
    <p style={{fontSize: '1rem', color: '#777', marginTop: '1rem'}}>
      במצב רגיל כאן יהיה המסך האמיתי של <code>ParentLogin</code>
    </p>
  </div>
);

const DemoParentDashboard = () => (
  <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #e3f2fd 0%, #e8eaf6 100%)', padding: '2rem', textAlign: 'center', paddingTop: '10rem'}}>
    <h1 style={{color: '#9C27B0', fontSize: '3rem', marginBottom: '2rem'}}>📊 דשבורד הורה</h1>
    <p style={{fontSize: '1.2rem', color: '#555'}}>זה דמה של הדשבורד</p>
    <p style={{fontSize: '1rem', color: '#777', marginTop: '1rem'}}>
      במצב רגיל כאן יהיה המסך האמיתי של <code>ParentDashboard</code>
    </p>
  </div>
);

const DemoKitchenScanner = () => (
  <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)', padding: '2rem', textAlign: 'center', paddingTop: '10rem'}}>
    <h1 style={{color: 'white', fontSize: '3rem', marginBottom: '2rem'}}>📱 מסך מטבח</h1>
    <p style={{fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)'}}>זה דמה של מסך המטבח</p>
    <p style={{fontSize: '1rem', color: 'rgba(255,255,255,0.7)', marginTop: '1rem'}}>
      במצב רגיל כאן יהיה המסך האמיתי של <code>KitchenQRScanner</code>
    </p>
  </div>
);

const DemoSecretaryPanel = () => (
  <div style={{minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', padding: '2rem', textAlign: 'center', paddingTop: '10rem'}}>
    <h1 style={{color: 'white', fontSize: '3rem', marginBottom: '2rem'}}>📋 פאנל מזכירה</h1>
    <p style={{fontSize: '1.2rem', color: 'rgba(255,255,255,0.9)'}}>זה דמה של פאנל המזכירה</p>
    <p style={{fontSize: '1rem', color: 'rgba(255,255,255,0.7)', marginTop: '1rem'}}>
      במצב רגיל כאן יהיה המסך האמיתי של <code>SecretaryPanel</code>
    </p>
  </div>
);

const InteractiveScreenNavigator = () => {
  const [currentScreen, setCurrentScreen] = useState('home');

  const screens = [
    {
      id: 'registration',
      title: 'הרשמת הורים',
      description: 'מסך הרשמה חדשה למערכת',
      icon: UserPlus,
      color: '#4CAF50',
      component: DemoParentRegistration
    },
    {
      id: 'login',
      title: 'כניסה להורים',
      description: 'מסך כניסה למערכת',
      icon: LogIn,
      color: '#2196F3',
      component: DemoParentLogin
    },
    {
      id: 'dashboard',
      title: 'דשבורד הורה',
      description: 'מסך ראשי עם יתרות וילדים',
      icon: LayoutDashboard,
      color: '#9C27B0',
      component: DemoParentDashboard
    },
    {
      id: 'kitchen',
      title: 'מסך מטבח',
      description: 'סריקת QR וניהול ארוחות',
      icon: Camera,
      color: '#FF5722',
      component: DemoKitchenScanner
    },
    {
      id: 'secretary',
      title: 'פאנל מזכירה',
      description: 'ניהול תשלומים ותלמידים',
      icon: Receipt,
      color: '#607D8B',
      component: DemoSecretaryPanel
    }
  ];

  const selectorStyles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: '2rem'
    },
    header: {
      textAlign: 'center',
      marginBottom: '3rem'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '1rem',
      marginBottom: '2rem'
    },
    logoIcon: {
      width: '60px',
      height: '60px',
      background: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    title: {
      fontSize: '3rem',
      fontWeight: 'bold',
      color: 'white',
      margin: 0,
      textShadow: '0 4px 8px rgba(0, 0, 0, 0.3)'
    },
    subtitle: {
      fontSize: '1.2rem',
      color: 'rgba(255, 255, 255, 0.9)',
      margin: '1rem 0 0 0'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '2rem',
      maxWidth: '1000px',
      margin: '0 auto'
    },
    card: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      padding: '2rem',
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(10px)',
      textAlign: 'center',
      border: '2px solid transparent'
    },
    cardIcon: {
      width: '70px',
      height: '70px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 1rem',
      transition: 'all 0.3s'
    },
    cardTitle: {
      fontSize: '1.3rem',
      fontWeight: 'bold',
      color: '#333',
      margin: '0 0 0.5rem 0'
    },
    cardDescription: {
      color: '#666',
      fontSize: '0.9rem',
      lineHeight: 1.4,
      marginBottom: '1.5rem'
    },
    cardButton: {
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '25px',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontSize: '0.95rem',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      margin: '0 auto'
    },
    backButton: {
      position: 'fixed',
      top: '2rem',
      right: '2rem',
      background: 'rgba(255, 255, 255, 0.9)',
      border: 'none',
      borderRadius: '50px',
      padding: '1rem 1.5rem',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontSize: '1rem',
      fontWeight: '600',
      color: '#667eea',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.1)',
      zIndex: 100,
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    instructionsBox: {
      background: 'rgba(255, 255, 255, 0.9)',
      borderRadius: '16px',
      padding: '1.5rem',
      marginTop: '2rem',
      textAlign: 'right'
    }
  };

  // אם נבחר מסך ספציפי, הצג אותו
  if (currentScreen !== 'home') {
    const selectedScreen = screens.find(screen => screen.id === currentScreen);
    const ScreenComponent = selectedScreen.component;
    
    return (
      <div>
        <button 
          onClick={() => setCurrentScreen('home')}
          style={selectorStyles.backButton}
        >
          <Home size={20} />
          חזור לדף הבית
        </button>
        <ScreenComponent />
      </div>
    );
  }

  // הצג דף הבחירה
  return (
    <div style={selectorStyles.container}>
      <div style={selectorStyles.header}>
        <div style={selectorStyles.logo}>
          <div style={selectorStyles.logoIcon}>
            <School size={32} color="#667eea" />
          </div>
        </div>
        <h1 style={selectorStyles.title}>מערכת ארוחות בית ספר</h1>
        <p style={selectorStyles.subtitle}>
          לחץ על כל מסך כדי לראות אותו
        </p>
      </div>

      <div style={selectorStyles.grid}>
        {screens.map(screen => {
          const IconComponent = screen.icon;
          return (
            <div
              key={screen.id}
              style={selectorStyles.card}
              onClick={() => setCurrentScreen(screen.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-8px)';
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.1)';
              }}
            >
              <div 
                style={{
                  ...selectorStyles.cardIcon,
                  background: `linear-gradient(135deg, ${screen.color}, ${screen.color}dd)`
                }}
              >
                <IconComponent size={35} color="white" />
              </div>
              
              <h3 style={selectorStyles.cardTitle}>{screen.title}</h3>
              <p style={selectorStyles.cardDescription}>{screen.description}</p>
              
              <button style={selectorStyles.cardButton}>
                <span>פתח מסך</span>
                <ArrowRight size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <div style={selectorStyles.instructionsBox}>
        <h3 style={{fontSize: '1.2rem', fontWeight: 'bold', color: '#333', marginBottom: '1rem'}}>
          💡 איך זה עובד:
        </h3>
        <p style={{color: '#666', lineHeight: 1.6}}>
          <strong>כאן בartifact:</strong> תראה דמה של כל מסך<br/>
          <strong>בפרויקט שלך:</strong> החלף את הרכיבי הדמה ברכיבים האמיתיים שבנית<br/>
          <strong>כלומר:</strong> במקום <code>DemoParentDashboard</code> תשים <code>ParentDashboard</code>
        </p>
      </div>
    </div>
  );
};

export default InteractiveScreenNavigator;