import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  QrCode, 
  Menu as MenuIcon, 
  ChefHat, 
  Wallet,
  ArrowRight,
  Share2,
  Download,
  Home,
  User
} from 'lucide-react';

const MobileParentApp = () => {
  const { token } = useParams(); // קוד גישה ייחודי
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [parentData, setParentData] = useState(null);
  const [children, setChildren] = useState([]);
  const [selectedChild, setSelectedChild] = useState(0);
  const [currentQR, setCurrentQR] = useState(null);
  const [weeklyMenu, setWeeklyMenu] = useState([]);
  const [schoolName, setSchoolName] = useState('');
  const [activeTab, setActiveTab] = useState('qr'); // qr, menu, info

  useEffect(() => {
    loadMobileData();
  }, [token]);

  const loadMobileData = async () => {
    try {
      // טען נתונים לפי ה-token
      const response = await fetch(`https://api.bonapp.dev/api/mobile/parent/${token}`);
      const data = await response.json();

      if (data.success) {
        setParentData(data.parent);
        setChildren(data.children);
        setSchoolName(data.schoolName);
        setWeeklyMenu(data.weeklyMenu || []);
        
        // טען QR אוטומטית לילד הראשון
        if (data.children.length > 0) {
          loadQR(data.children[0].id);
        }
      }
    } catch (error) {
      console.error('Error loading mobile data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadQR = async (studentId) => {
    try {
      const createResponse = await fetch(`https://api.bonapp.dev/api/students/${studentId}/create-qr`, {
        method: 'POST'
      });
      await createResponse.json();

      const imageResponse = await fetch(`https://api.bonapp.dev/api/students/${studentId}/generate-qr`, {
        method: 'POST'
      });
      const imageResult = await imageResponse.json();

      if (imageResult.success) {
        setCurrentQR(imageResult);
      }
    } catch (error) {
      console.error('QR error:', error);
    }
  };

  const handleChildChange = (index) => {
    setSelectedChild(index);
    loadQR(children[index].id);
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      // Web Share API - אם זמין
      try {
        await navigator.share({
          title: `${schoolName} - אפליקציית הורים`,
          text: `גישה לאפליקציית ${schoolName}`,
          url: url
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      // Fallback - העתק לינק
      navigator.clipboard.writeText(url);
      alert('✅ הלינק הועתק! שתף אותו עם ההורה');
    }
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      paddingBottom: '80px'
    },
    header: {
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '1.5rem 1rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
      position: 'sticky',
      top: 0,
      zIndex: 100
    },
    headerContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    title: {
      fontSize: '1.3rem',
      fontWeight: 'bold',
      color: '#2c3e50',
      margin: 0
    },
    subtitle: {
      fontSize: '0.9rem',
      color: '#7f8c8d',
      margin: '0.25rem 0 0 0'
    },
    childSelector: {
      display: 'flex',
      gap: '0.5rem',
      padding: '1rem',
      overflowX: 'auto',
      background: 'rgba(255,255,255,0.1)',
      WebkitOverflowScrolling: 'touch'
    },
    childButton: {
      minWidth: '80px',
      padding: '0.75rem 1rem',
      borderRadius: '12px',
      border: 'none',
      fontWeight: '600',
      fontSize: '0.9rem',
      cursor: 'pointer',
      whiteSpace: 'nowrap',
      transition: 'all 0.3s'
    },
    content: {
      padding: '1rem'
    },
    card: {
      background: 'white',
      borderRadius: '16px',
      padding: '1.5rem',
      marginBottom: '1rem',
      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
    },
    qrContainer: {
      textAlign: 'center'
    },
    qrImage: {
      width: '100%',
      maxWidth: '280px',
      height: 'auto',
      margin: '1rem auto',
      border: '3px solid #e9ecef',
      borderRadius: '12px',
      padding: '0.75rem',
      background: 'white'
    },
    qrCode: {
      fontSize: '1.4rem',
      fontWeight: 'bold',
      color: '#2c3e50',
      margin: '1rem 0',
      fontFamily: 'monospace',
      background: '#f8f9fa',
      padding: '0.75rem',
      borderRadius: '8px'
    },
    balanceCard: {
      background: 'linear-gradient(135deg, #4CAF50, #45a049)',
      color: 'white',
      padding: '1.5rem',
      borderRadius: '16px',
      textAlign: 'center',
      marginBottom: '1rem'
    },
    balance: {
      fontSize: '2.5rem',
      fontWeight: 'bold',
      margin: '0.5rem 0'
    },
    menuDay: {
      padding: '1rem',
      background: '#f8f9fa',
      borderRadius: '12px',
      marginBottom: '0.75rem',
      border: '1px solid #e9ecef'
    },
    dayName: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '0.5rem',
      fontWeight: 'bold',
      color: '#2c3e50'
    },
    price: {
      background: '#4CAF50',
      color: 'white',
      padding: '0.25rem 0.75rem',
      borderRadius: '12px',
      fontSize: '0.85rem',
      fontWeight: 'bold'
    },
    bottomNav: {
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      background: 'white',
      boxShadow: '0 -4px 12px rgba(0,0,0,0.1)',
      display: 'flex',
      justifyContent: 'space-around',
      padding: '0.75rem 0',
      zIndex: 100
    },
    navButton: {
      background: 'none',
      border: 'none',
      padding: '0.5rem',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '0.25rem',
      color: '#7f8c8d',
      fontSize: '0.75rem',
      transition: 'all 0.3s'
    },
    shareButton: {
      position: 'fixed',
      bottom: '90px',
      right: '20px',
      background: '#25D366',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      width: '56px',
      height: '56px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(37, 211, 102, 0.4)',
      zIndex: 99
    }
  };

  if (loading) {
    return (
      <div style={{
        ...styles.container,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: '1.2rem'
      }}>
        טוען...
      </div>
    );
  }

  const child = children[selectedChild];

  return (
    <div style={styles.container}>
      {/* כותרת */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div>
            <h1 style={styles.title}>{schoolName}</h1>
            <p style={styles.subtitle}>שלום, {parentData?.name}</p>
          </div>
          <QrCode size={32} color="#667eea" />
        </div>
      </div>

      {/* בורר ילדים */}
      <div style={styles.childSelector}>
        {children.map((c, index) => (
          <button
            key={c.id}
            onClick={() => handleChildChange(index)}
            style={{
              ...styles.childButton,
              background: selectedChild === index ? 
                'linear-gradient(135deg, #667eea, #764ba2)' : 
                'rgba(255,255,255,0.9)',
              color: selectedChild === index ? 'white' : '#666'
            }}
          >
            {c.first_name}
          </button>
        ))}
      </div>

      {/* תוכן */}
      <div style={styles.content}>
        {/* כרטיס יתרה */}
        <div style={styles.balanceCard}>
          <div style={{ fontSize: '1rem', opacity: 0.9 }}>יתרה נוכחית</div>
          <div style={styles.balance}>₪{(child?.balance || 0).toFixed(2)}</div>
          <div style={{ fontSize: '0.9rem', opacity: 0.9 }}>
            {child?.first_name} {child?.last_name}
          </div>
        </div>

        {/* תוכן לפי טאב */}
        {activeTab === 'qr' && currentQR && (
          <div style={styles.card}>
            <div style={styles.qrContainer}>
              <h2 style={{ 
                fontSize: '1.3rem', 
                fontWeight: 'bold', 
                color: '#2c3e50',
                marginBottom: '1rem'
              }}>
                QR Code - {child?.first_name}
              </h2>
              
              <img 
                src={currentQR.qrImage} 
                alt="QR Code"
                style={styles.qrImage}
              />
              
              <div style={styles.qrCode}>
                {currentQR.qrCode}
              </div>
              
              <p style={{
                fontSize: '0.85rem',
                color: '#7f8c8d',
                marginTop: '1rem'
              }}>
                סרוק במזנון לביצוע רכישות
              </p>
              
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = currentQR.qrImage;
                  link.download = `QR_${child?.first_name}.png`;
                  link.click();
                }}
                style={{
                  marginTop: '1rem',
                  padding: '0.75rem 2rem',
                  background: '#5cb85c',
                  color: 'white',
                  border: 'none',
                  borderRadius: '12px',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  margin: '1rem auto 0',
                  boxShadow: '0 2px 8px rgba(92, 184, 92, 0.3)'
                }}
              >
                <Download size={18} />
                הורד QR
              </button>
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div style={styles.card}>
            <h2 style={{ 
              fontSize: '1.3rem', 
              fontWeight: 'bold', 
              color: '#2c3e50',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}>
              <ChefHat size={24} />
              תפריט השבוע
            </h2>
            
            {weeklyMenu.length > 0 ? (
              weeklyMenu.map((day, index) => (
                <div key={index} style={styles.menuDay}>
                  <div style={styles.dayName}>
                    <span>{day.day}</span>
                    <span style={styles.price}>₪{day.price}</span>
                  </div>
                  <div style={{
                    fontSize: '0.9rem',
                    color: '#555',
                    lineHeight: 1.4
                  }}>
                    {day.menu}
                  </div>
                </div>
              ))
            ) : (
              <p style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
                לא הוגדר תפריט
              </p>
            )}
          </div>
        )}

        {activeTab === 'info' && (
          <div style={styles.card}>
            <h2 style={{ 
              fontSize: '1.3rem', 
              fontWeight: 'bold', 
              color: '#2c3e50',
              marginBottom: '1rem'
            }}>
              פרטי תלמיד
            </h2>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '0.75rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.75rem',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <span style={{ color: '#7f8c8d' }}>שם:</span>
                <span style={{ fontWeight: '600' }}>
                  {child?.first_name} {child?.last_name}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.75rem',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <span style={{ color: '#7f8c8d' }}>כיתה:</span>
                <span style={{ fontWeight: '600' }}>{child?.grade}</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.75rem',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <span style={{ color: '#7f8c8d' }}>טלפון:</span>
                <span style={{ fontWeight: '600' }}>{child?.student_phone || 'לא הוגדר'}</span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                padding: '0.75rem',
                background: '#f8f9fa',
                borderRadius: '8px'
              }}>
                <span style={{ color: '#7f8c8d' }}>מגבלת הוצאה:</span>
                <span style={{ fontWeight: '600', color: '#4CAF50' }}>
                  ₪{child?.spending_limit || 50}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* כפתור שיתוף */}
      <button onClick={handleShare} style={styles.shareButton}>
        <Share2 size={24} />
      </button>

      {/* ניווט תחתון */}
      <div style={styles.bottomNav}>
        <button
          onClick={() => setActiveTab('qr')}
          style={{
            ...styles.navButton,
            color: activeTab === 'qr' ? '#667eea' : '#7f8c8d'
          }}
        >
          <QrCode size={24} />
          QR
        </button>
        
        <button
          onClick={() => setActiveTab('menu')}
          style={{
            ...styles.navButton,
            color: activeTab === 'menu' ? '#667eea' : '#7f8c8d'
          }}
        >
          <MenuIcon size={24} />
          תפריט
        </button>
        
        <button
          onClick={() => setActiveTab('info')}
          style={{
            ...styles.navButton,
            color: activeTab === 'info' ? '#667eea' : '#7f8c8d'
          }}
        >
          <User size={24} />
          פרטים
        </button>
      </div>
    </div>
  );
};

export default MobileParentApp;
