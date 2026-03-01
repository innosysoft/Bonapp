
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Utensils, 
  Smartphone, 
  CreditCard, 
  BarChart3, 
  Shield, 
  Clock,
  CheckCircle,
  ArrowRight,
  Users,
  Zap,
  Phone,
  Mail
} from 'lucide-react';

const LandingPage = () => {
  const navigate = useNavigate();

  const styles = {
    // Header
    header: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      background: 'rgba(255, 255, 255, 0.95)',
      backdropFilter: 'blur(10px)',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
      zIndex: 1000
    },
    logo: {
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent'
    },
    logoIcon: {
      width: '40px',
      height: '40px',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      borderRadius: '10px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    headerButtons: {
      display: 'flex',
      gap: '1rem'
    },
    loginBtn: {
      padding: '0.75rem 1.5rem',
      background: 'transparent',
      border: '2px solid #667eea',
      borderRadius: '10px',
      color: '#667eea',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s'
    },
    signupBtn: {
      padding: '0.75rem 1.5rem',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      border: 'none',
      borderRadius: '10px',
      color: 'white',
      fontWeight: '600',
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
    },

    // Hero Section
    hero: {
  minHeight: '100vh',
  background: `url('/images/hero-banner.png')`,
  backgroundSize: 'cover',
  backgroundPosition: 'center',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '6rem 2rem 4rem',
  textAlign: 'center',
  color: '#4a6fa5'
},
    heroContent: {
      maxWidth: '800px'
    },
    heroTitle: {
  fontSize: '2.8rem',
  fontWeight: 'bold',
  marginBottom: '1.5rem',
  lineHeight: '1.2',
  color: '#7cb342'
},
    heroSubtitle: {
  fontSize: '1.4rem',
  fontWeight: '500',
  marginBottom: '2.5rem',
  lineHeight: '1.8',
  color: '#4a6fa5',
  maxWidth: '700px',
  margin: '0 auto 2.5rem'
},

    heroCTA: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '1.25rem 2.5rem',
      background: 'white',
      color: '#667eea',
      border: 'none',
      borderRadius: '12px',
      fontSize: '1.2rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
    },

    // Features Section
    features: {
      padding: '6rem 2rem',
      background: '#f8f9fa'
    },
    sectionTitle: {
      textAlign: 'center',
      fontSize: '2.5rem',
      fontWeight: 'bold',
      marginBottom: '1rem',
      color: '#333'
    },
    sectionSubtitle: {
      textAlign: 'center',
      fontSize: '1.1rem',
      color: '#666',
      marginBottom: '4rem',
      maxWidth: '600px',
      margin: '0 auto 4rem'
    },
    featuresGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
      gap: '2rem',
      maxWidth: '1200px',
      margin: '0 auto'
    },
    featureCard: {
      background: 'white',
      padding: '2rem',
      borderRadius: '16px',
      boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
      transition: 'all 0.3s',
      textAlign: 'center'
    },
    featureIcon: {
      width: '70px',
      height: '70px',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      margin: '0 auto 1.5rem'
    },
    featureTitle: {
      fontSize: '1.3rem',
      fontWeight: 'bold',
      marginBottom: '0.75rem',
      color: '#333'
    },
    featureDesc: {
      color: '#666',
      lineHeight: '1.6'
    },

    // How It Works
    howItWorks: {
      padding: '6rem 2rem',
      background: 'white'
    },
    stepsContainer: {
      maxWidth: '1000px',
      margin: '0 auto',
      display: 'grid',
      gap: '3rem'
    },
    step: {
      display: 'flex',
      gap: '2rem',
      alignItems: 'center'
    },
    stepNumber: {
      width: '60px',
      height: '60px',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '1.5rem',
      fontWeight: 'bold',
      flexShrink: 0
    },
    stepContent: {
      flex: 1
    },
    stepTitle: {
      fontSize: '1.4rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
      color: '#333'
    },
    stepDesc: {
      color: '#666',
      lineHeight: '1.6'
    },

    // CTA Section
    cta: {
      padding: '6rem 2rem',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      textAlign: 'center',
      color: 'white'
    },
    ctaTitle: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      marginBottom: '1.5rem'
    },
    ctaSubtitle: {
      fontSize: '1.2rem',
      marginBottom: '2.5rem',
      opacity: 0.95
    },
    ctaButton: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.75rem',
      padding: '1.25rem 2.5rem',
      background: 'white',
      color: '#667eea',
      border: 'none',
      borderRadius: '12px',
      fontSize: '1.2rem',
      fontWeight: 'bold',
      cursor: 'pointer',
      transition: 'all 0.3s',
      boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
    }
  };

  const features = [
    {
      icon: <Smartphone size={32} color="white" />,
      title: 'סריקת QR פשוטה',
      desc: 'תלמידים סורקים QR ומזמינים ארוחות בקלות ובמהירות'
    },
    {
      icon: <CreditCard size={32} color="white" />,
      title: 'תשלומים מאובטחים',
      desc: 'הורים מטעינים יתרה דרך Paybox, Bit או מזומן במזכירות'
    },
    {
      icon: <BarChart3 size={32} color="white" />,
      title: 'דוחות ותובנות',
      desc: 'מערכת ניהול מלאה עם דוחות מכירות וניהול תפריט'
    },
    {
      icon: <Shield size={32} color="white" />,
      title: 'בטוח ומוגן',
      desc: 'הצפנה מלאה של נתונים ותשלומים מאובטחים'
    },
    {
      icon: <Clock size={32} color="white" />,
      title: 'חוסך זמן',
      desc: 'אין יותר תורים ארוכים - הכל מהיר ויעיל'
    },
    {
      icon: <Users size={32} color="white" />,
      title: 'ניהול קל',
      desc: 'פאנל ניהול נוח למזכירות ולמנהלי בתי ספר'
    }
  ];

  const steps = [
    {
      title: 'הרשמה ויצירת חשבון',
      desc: 'הורים נרשמים למערכת עם פרטי הילדים ומקבלים QR code ייחודי לכל תלמיד'
    },
    {
      title: 'טעינת יתרה',
      desc: 'הורים מטעינים כסף דרך Paybox, Bit או מזומן במזכירות בית הספר'
    },
    {
      title: 'סריקה ורכישה',
      desc: 'תלמידים סורקים QR במזנון, בוחרים מנות ומשלמים מהיתרה'
    },
    {
      title: 'מעקב ובקרה',
      desc: 'הורים רואים דוחות מכירות ויכולים לנהל הגדרות וגבולות הוצאה'
    }
  ];

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}>
      {/* Header */}
      <header style={styles.header}>
        <div style={styles.logo}>
  <img 
    src="/images/bonapp-logo.png" 
    alt="BonApp Logo" 
    style={{ height: '30px', width: 'auto' }}
  />
</div>
        <div style={styles.headerButtons}>
          <button 
            style={styles.loginBtn}
            onClick={() => navigate('/login')}
            onMouseEnter={(e) => {
              e.target.style.background = '#667eea';
              e.target.style.color = 'white';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = 'transparent';
              e.target.style.color = '#667eea';
            }}
          >
            התחברות
          </button>
          <button 
            style={styles.signupBtn}
            onClick={() => navigate('/register')}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
            }}
          >
            הרשמה
          </button>
        </div>
      </header>

      {/* Hero */}
      <section style={styles.hero}>
        <div style={styles.heroContent}>
          <h1 style={styles.heroTitle}>
            מערכת ניהול ארוחות חכמה<br/>לבתי ספר
          </h1>
          <p style={styles.heroSubtitle}>
  פתרון דיגיטלי מלא לניהול מזנון בית הספר<br />
  סריקת QR • תשלומים מקוונים • דוחות בזמן אמת
</p>
          <button 
  style={styles.heroCTA}
  onClick={() => navigate('/school-contact')}
            onMouseEnter={(e) => {
              e.target.style.transform = 'scale(1.05)';
              e.target.style.boxShadow = '0 15px 40px rgba(0,0,0,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'scale(1)';
              e.target.style.boxShadow = '0 10px 30px rgba(0,0,0,0.2)';
            }}
          >
            התחל עכשיו
            <ArrowRight size={24} />
          </button>
        </div>
      </section>

      {/* Features */}
      <section style={styles.features}>
        <h2 style={styles.sectionTitle}>למה לבחור ב-BonApp?</h2>
        <p style={styles.sectionSubtitle}>
          מערכת מקיפה שחוסכת זמן, כסף ומביאה שקט נפשי להורים ולבית הספר
        </p>
        <div style={styles.featuresGrid}>
          {features.map((feature, index) => (
            <div 
              key={index} 
              style={styles.featureCard}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-10px)';
                e.currentTarget.style.boxShadow = '0 8px 30px rgba(0,0,0,0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 4px 20px rgba(0,0,0,0.08)';
              }}
            >
              <div style={styles.featureIcon}>
                {feature.icon}
              </div>
              <h3 style={styles.featureTitle}>{feature.title}</h3>
              <p style={styles.featureDesc}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section style={styles.howItWorks}>
        <h2 style={styles.sectionTitle}>איך זה עובד?</h2>
        <p style={styles.sectionSubtitle}>
          4 צעדים פשוטים להתחלה
        </p>
        <div style={styles.stepsContainer}>
          {steps.map((step, index) => (
            <div key={index} style={styles.step}>
              <div style={styles.stepNumber}>{index + 1}</div>
              <div style={styles.stepContent}>
                <h3 style={styles.stepTitle}>{step.title}</h3>
                <p style={styles.stepDesc}>{step.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section style={styles.cta}>
        <h2 style={styles.ctaTitle}>מוכנים להתחיל?</h2>
        <p style={styles.ctaSubtitle}>
          הצטרפו למאות בתי ספר שכבר משתמשים ב-BonApp
        </p>
        <button 
  style={styles.ctaButton}
  onClick={() => navigate('/school-contact')}
          onMouseEnter={(e) => {
            e.target.style.transform = 'scale(1.05)';
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = 'scale(1)';
          }}
        >
          הרשמה חינם
          <Zap size={24} />
        </button>
      </section>

{/* Footer */}
      <footer style={{
        background: 'linear-gradient(135deg, #2c3e50 0%, #34495e 100%)',
        padding: '3rem 2rem',
        color: 'white',
        textAlign: 'center'
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto'
        }}>
          {/* Logo and Tagline */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              marginBottom: '1rem'
            }}>
              <span style={{
                fontSize: '1.8rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                BonApp
              </span>
              <span style={{ color: '#bdc3c7', fontSize: '1.2rem' }}>מבית</span>
              <span style={{
                fontSize: '1.8rem',
                fontWeight: 'bold',
                color: '#ff8c42'
              }}>
                Innosys
              </span>
            </div>
            <p style={{
              color: '#bdc3c7',
              fontSize: '1rem',
              margin: 0
            }}>
              מערכת ניהול ארוחות חכמה לבתי ספר
            </p>
          </div>

          {/* Contact Info */}
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            gap: '3rem',
            flexWrap: 'wrap',
            marginBottom: '2rem'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Phone size={20} color="#ff8c42" />
              <a 
                href="tel:1-700-502042" 
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '1.1rem'
                }}
                onMouseEnter={(e) => e.target.style.color = '#ff8c42'}
                onMouseLeave={(e) => e.target.style.color = 'white'}
              >
                1-700-502042
              </a>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <Mail size={20} color="#ff8c42" />
              <a 
                href="https://innosys.co.il/websites" 
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: 'white',
                  textDecoration: 'none',
                  fontSize: '1.1rem'
                }}
                onMouseEnter={(e) => e.target.style.color = '#ff8c42'}
                onMouseLeave={(e) => e.target.style.color = 'white'}
              >
                innosys.co.il/websites
              </a>
            </div>
          </div>

          {/* Copyright */}
          <div style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.1)',
            paddingTop: '1.5rem',
            color: '#95a5a6',
            fontSize: '0.9rem'
          }}>
            <p style={{ margin: 0 }}>
              © {new Date().getFullYear()} BonApp by Innosys. כל הזכויות שמורות.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};



export default LandingPage;
