import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';import { getSchools } from '../api';
import { 
  Users, 
  ChefHat, 
  FileText,
  UserCheck,
  School,
  ArrowRight,
  Clock,
  DollarSign,
  TrendingUp,
  Shield
} from 'lucide-react';

const MainHomepage = () => {
  const navigate = useNavigate();
  const [hoveredCard, setHoveredCard] = useState(null);
  const [schoolCount, setSchoolCount] = useState(0);

  React.useEffect(() => {
  const loadSchools = async () => {
    try {
      const result = await getSchools();
      if (result.success) {
        setSchoolCount(result.schools.length);
      }
    } catch (error) {
      console.error('Error loading schools:', error);
    }
  };
  
  loadSchools();
}, []);

  const userTypes = [
    {
      id: 'login',
      title: 'כניסה למערכת',
      description: 'כניסה עם שם משתמש וסיסמה - המערכת תכוון אותך לאזור המתאים',
      icon: UserCheck,
      color: '#2196F3',
      features: ['הורים', 'עובדי מטבח', 'מזכירות', 'מנהלי מערכת']
    },
    {
      id: 'register',
      title: 'הרשמה חדשה',
      description: 'הרשמה חדשה למערכת עבור הורים חדשים',
      icon: Users,
      color: '#4CAF50',
      features: ['הרשמת הורים', 'הוספת ילדים', 'פתיחת חשבון', 'יצירת כרטיס QR']
    }
  ];

  const stats = [
    { label: 'בתי ספר במערכת', value: schoolCount.toString(), icon: School, color: '#4CAF50' },
    { label: 'גרסת מערכת', value: 'v1.0', icon: TrendingUp, color: '#2196F3' }
  ];

  const mainStyles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    topBar: {
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '1rem 2rem',
      backdropFilter: 'blur(10px)',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    logoIcon: {
      width: '50px',
      height: '50px',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      borderRadius: '12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    logoText: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#667eea'
    },
    schoolName: {
      fontSize: '0.9rem',
      color: '#666',
      marginTop: '0.25rem'
    },
    systemStatus: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      color: '#4CAF50',
      fontSize: '0.9rem',
      fontWeight: '600'
    },
    hero: {
      textAlign: 'center',
      padding: '4rem 2rem',
      color: 'white'
    },
    heroTitle: {
      fontSize: '3.5rem',
      fontWeight: 'bold',
      margin: '0 0 1rem 0',
      textShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
      lineHeight: 1.2
    },
    heroSubtitle: {
      fontSize: '1.3rem',
      opacity: 0.9,
      maxWidth: '600px',
      margin: '0 auto 3rem',
      lineHeight: 1.5
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '1.5rem',
      maxWidth: '900px',
      margin: '0 auto 4rem'
    },
    statCard: {
      background: 'rgba(255, 255, 255, 0.15)',
      backdropFilter: 'blur(20px)',
      borderRadius: '16px',
      padding: '1.5rem',
      textAlign: 'center',
      border: '1px solid rgba(255, 255, 255, 0.2)'
    },
    statIcon: {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      margin: '0 auto 1rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    statValue: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: 'white',
      margin: '0 0 0.5rem 0'
    },
    statLabel: {
      fontSize: '0.9rem',
      color: 'rgba(255, 255, 255, 0.8)'
    },
    main: {
      padding: '2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    },
    sectionTitle: {
      textAlign: 'center',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      color: 'white',
      marginBottom: '3rem',
      textShadow: '0 2px 8px rgba(0, 0, 0, 0.2)'
    },
    cardsGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
      gap: '2rem',
      marginBottom: '3rem'
    },
    card: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '24px',
      padding: '2.5rem',
      cursor: 'pointer',
      transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
      boxShadow: '0 10px 40px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(20px)',
      border: '1px solid rgba(255, 255, 255, 0.3)',
      position: 'relative',
      overflow: 'hidden'
    },
    cardHovered: {
      transform: 'translateY(-12px) scale(1.02)',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.2)'
    },
    cardGlow: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: '24px',
      opacity: 0,
      transition: 'opacity 0.3s',
      pointerEvents: 'none'
    },
    cardGlowVisible: {
      opacity: 0.1
    },
    cardContent: {
      position: 'relative',
      zIndex: 1
    },
    cardIcon: {
      width: '80px',
      height: '80px',
      borderRadius: '20px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 1.5rem',
      transition: 'all 0.3s',
      position: 'relative'
    },
    cardIconHovered: {
      transform: 'scale(1.1) rotate(5deg)'
    },
    cardTitle: {
      fontSize: '1.6rem',
      fontWeight: 'bold',
      color: '#333',
      margin: '0 0 1rem 0',
      textAlign: 'center'
    },
    cardDescription: {
      color: '#666',
      fontSize: '1rem',
      lineHeight: 1.6,
      marginBottom: '1.5rem',
      textAlign: 'center'
    },
    cardFeatures: {
      marginBottom: '2rem'
    },
    feature: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      marginBottom: '0.75rem',
      fontSize: '0.9rem',
      color: '#555'
    },
    featureBullet: {
      width: '6px',
      height: '6px',
      borderRadius: '50%',
      flexShrink: 0
    },
    cardButton: {
      width: '100%',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: 'white',
      border: 'none',
      padding: '1rem 2rem',
      borderRadius: '16px',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontSize: '1rem',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.75rem',
      boxShadow: '0 8px 25px rgba(102, 126, 234, 0.3)'
    },
    cardButtonHovered: {
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 35px rgba(102, 126, 234, 0.4)'
    },
    footer: {
      background: 'rgba(255, 255, 255, 0.1)',
      backdropFilter: 'blur(20px)',
      padding: '2rem',
      textAlign: 'center',
      marginTop: '4rem',
      borderTop: '1px solid rgba(255, 255, 255, 0.1)'
    },
    footerText: {
      color: 'rgba(255, 255, 255, 0.8)',
      fontSize: '0.9rem',
      margin: 0
    }
  };

  const handleCardClick = (userType) => {
    switch(userType) {
      case 'login':
        navigate('/login');
        break;
      case 'register':
        navigate('/register');
        break;
      default:
        console.log('Unknown user type:', userType);
    }
  };

  return (
    <div style={mainStyles.container}>
      {/* שורה עליונה */}
      <div style={mainStyles.topBar}>
        <div style={mainStyles.logo}>
          <div style={mainStyles.logoIcon}>
            <School size={28} color="white" />
          </div>
          <div>
            <div style={mainStyles.logoText}>מערכת ארוחות</div>
            <div style={mainStyles.schoolName}>BonApp - מערכת ארוחות חכמה</div>
          </div>
        </div>
        
        <div style={mainStyles.systemStatus}>
          <Shield size={16} />
          <span>מערכת פעילה</span>
        </div>
      </div>

      {/* קטע גיבור */}
      <div style={mainStyles.hero}>
        <h1 style={mainStyles.heroTitle}>ברוכים הבאים</h1>
        <p style={mainStyles.heroSubtitle}>
          מערכת ניהול ארוחות דיגיטלית לבית הספר
          <br />
          התחברו או הירשמו כדי להתחיל
        </p>

        {/* סטטיסטיקות */}
        <div style={mainStyles.statsGrid}>
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div key={index} style={mainStyles.statCard}>
                <div 
                  style={{
                    ...mainStyles.statIcon,
                    background: `linear-gradient(135deg, ${stat.color}, ${stat.color}dd)`
                  }}
                >
                  <IconComponent size={24} color="white" />
                </div>
                <div style={mainStyles.statValue}>{stat.value}</div>
                <div style={mainStyles.statLabel}>{stat.label}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* תוכן ראשי */}
      <div style={mainStyles.main}>
        <h2 style={mainStyles.sectionTitle}>כניסה למערכת</h2>

        <div style={mainStyles.cardsGrid}>
          {userTypes.map(userType => {
            const IconComponent = userType.icon;
            const isHovered = hoveredCard === userType.id;
            
            return (
              <div
                key={userType.id}
                style={{
                  ...mainStyles.card,
                  ...(isHovered ? mainStyles.cardHovered : {})
                }}
                onClick={() => handleCardClick(userType.id)}
                onMouseEnter={() => setHoveredCard(userType.id)}
                onMouseLeave={() => setHoveredCard(null)}
              >
                <div 
                  style={{
                    ...mainStyles.cardGlow,
                    background: `linear-gradient(135deg, ${userType.color}, ${userType.color}66)`,
                    ...(isHovered ? mainStyles.cardGlowVisible : {})
                  }}
                />
                
                <div style={mainStyles.cardContent}>
                  <div 
                    style={{
                      ...mainStyles.cardIcon,
                      background: `linear-gradient(135deg, ${userType.color}, ${userType.color}dd)`,
                      ...(isHovered ? mainStyles.cardIconHovered : {})
                    }}
                  >
                    <IconComponent size={40} color="white" />
                  </div>

                  <h3 style={mainStyles.cardTitle}>{userType.title}</h3>
                  <p style={mainStyles.cardDescription}>{userType.description}</p>

                  <div style={mainStyles.cardFeatures}>
                    {userType.features.map((feature, index) => (
                      <div key={index} style={mainStyles.feature}>
                        <div 
                          style={{
                            ...mainStyles.featureBullet,
                            background: userType.color
                          }}
                        />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>

                  <button 
                    style={{
                      ...mainStyles.cardButton,
                      ...(isHovered ? mainStyles.cardButtonHovered : {})
                    }}
                  >
                    <span>{userType.id === 'login' ? 'כניסה' : 'הרשמה'}</span>
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* תחתית */}
      <div style={mainStyles.footer}>
        <p style={mainStyles.footerText}>
          מערכת ארוחות בית ספר • גרסה 1.0 • כל הזכויות שמורות ל Innosys © 2024
        </p>
      </div>

{/* כפתור Super Admin נסתר */}
      <button
        onClick={() => {
          localStorage.clear();
          window.location.href = '/admin';
        }}
        style={{
          position: 'fixed',
          bottom: '10px',
          left: '10px',
          width: '30px',
          height: '30px',
          background: 'rgba(102, 126, 234, 0.1)',
          border: '1px solid rgba(102, 126, 234, 0.3)',
          borderRadius: '50%',
          cursor: 'pointer',
          fontSize: '0.7rem',
          color: '#667eea',
          zIndex: 999
        }}
        title="Super Admin Access"
      >
        🔑
      </button>
      
    </div>
  );
};


export default MainHomepage;