import React, { useState } from 'react';
import { 
  UserPlus, 
  LogIn, 
  LayoutDashboard, 
  Camera, 
  Receipt,
  School,
  ArrowRight
} from 'lucide-react';

const ScreenSelector = () => {
  const screens = [
    {
      id: 'registration',
      title: 'הרשמת הורים',
      description: 'מסך הרשמה חדשה למערכת',
      icon: UserPlus,
      color: '#4CAF50',
      file: 'ParentRegistrationForm.jsx'
    },
    {
      id: 'login',
      title: 'כניסה להורים',
      description: 'מסך כניסה למערכת',
      icon: LogIn,
      color: '#2196F3',
      file: 'ParentLogin.jsx'
    },
    {
      id: 'dashboard',
      title: 'דשבורד הורה',
      description: 'מסך ראשי עם יתרות וילדים',
      icon: LayoutDashboard,
      color: '#9C27B0',
      file: 'ParentDashboard.jsx'
    },
    {
      id: 'kitchen',
      title: 'מסך מטבח',
      description: 'סריקת QR וניהול ארוחות',
      icon: Camera,
      color: '#FF5722',
      file: 'KitchenQRScanner.jsx'
    },
    {
      id: 'secretary',
      title: 'פאנל מזכירה',
      description: 'ניהול תשלומים ותלמידים',
      icon: Receipt,
      color: '#607D8B',
      file: 'SecretaryPanel.jsx'
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
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '2rem',
      maxWidth: '1200px',
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
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 1.5rem',
      transition: 'all 0.3s'
    },
    cardTitle: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#333',
      margin: '0 0 1rem 0'
    },
    cardDescription: {
      color: '#666',
      fontSize: '1rem',
      lineHeight: 1.5,
      marginBottom: '1rem'
    },
    cardFile: {
      background: '#f0f4f8',
      color: '#555',
      fontSize: '0.9rem',
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      marginBottom: '1.5rem',
      fontFamily: 'monospace'
    },
    cardButton: {
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: 'white',
      border: 'none',
      padding: '0.75rem 2rem',
      borderRadius: '25px',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontSize: '1rem',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      margin: '0 auto'
    }
  };

  const handleCardClick = (screenId) => {
    const screen = screens.find(s => s.id === screenId);
    alert(`כדי לראות את המסך "${screen.title}", עדכן את src/App.js ויבא את ${screen.file}`);
  };

  // המשך מחלק 1...

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
          בחר מסך לצפייה ובדיקה
        </p>
      </div>

      <div style={selectorStyles.grid}>
        {screens.map(screen => {
          const IconComponent = screen.icon;
          return (
            <div
              key={screen.id}
              style={selectorStyles.card}
              onClick={() => handleCardClick(screen.id)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px)';
                e.currentTarget.style.boxShadow = '0 16px 48px rgba(0, 0, 0, 0.2)';
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
                <IconComponent size={40} color="white" />
              </div>
              
              <h3 style={selectorStyles.cardTitle}>{screen.title}</h3>
              <p style={selectorStyles.cardDescription}>{screen.description}</p>
              <div style={selectorStyles.cardFile}>{screen.file}</div>
              
              <button style={selectorStyles.cardButton}>
                <span>הצג הנחיות</span>
                <ArrowRight size={16} />
              </button>
            </div>
          );
        })}
      </div>

      <div style={{
        background: 'rgba(255, 255, 255, 0.9)',
        borderRadius: '16px',
        padding: '2rem',
        marginTop: '3rem',
        maxWidth: '800px',
        margin: '3rem auto 0',
        textAlign: 'right'
      }}>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '1rem'
        }}>איך לראות כל מסך:</h3>
        
        <div style={{
          textAlign: 'right',
          color: '#555',
          lineHeight: 1.6
        }}>
          <p><strong>איך לעבור בין המסכים:</strong></p>
          
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '1rem',
            marginTop: '1rem',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            textAlign: 'left',
            direction: 'ltr'
          }}>
{`1. לראות דשבורד הורה:
   בקובץ src/App.js החלף ל:
   import ParentDashboard from './components/ParentDashboard';
   
2. לראות מסך מטבח:
   import KitchenQRScanner from './components/KitchenQRScanner';
   
3. לראות פאנל מזכירה:
   import SecretaryPanel from './components/SecretaryPanel';`}
          </div>
          
          <br />
          <p><strong>המסכים שבנינו:</strong></p>
          <ul style={{paddingRight: '2rem'}}>
            <li>✅ ParentRegistrationForm.jsx - הרשמת הורים עם 2 שלבים</li>
            <li>✅ ParentLogin.jsx - כניסה עם טלפון וסיסמה</li>  
            <li>✅ ParentDashboard.jsx - יתרות, תשלומים, היסטוריה</li>
            <li>✅ KitchenQRScanner.jsx - סריקת QR ואשראי חירום</li>
            <li>✅ SecretaryPanel.jsx - ניהול תשלומים ידניים</li>
          </ul>
          
          <p><strong>דוגמת App.js מלאה:</strong></p>
          <div style={{
            background: '#f8f9fa',
            border: '1px solid #e0e0e0',
            borderRadius: '8px',
            padding: '1rem',
            marginTop: '1rem',
            fontFamily: 'monospace',
            fontSize: '0.9rem',
            textAlign: 'left',
            direction: 'ltr'
          }}>
{`import ParentDashboard from './components/ParentDashboard';
import './App.css';

function App() {
  return (
    <div className="App">
      <ParentDashboard />
    </div>
  );
}

export default App;`}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ScreenSelector;