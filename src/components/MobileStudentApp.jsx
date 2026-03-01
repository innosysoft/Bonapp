import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  QrCode, 
  ChefHat, 
  Wallet,
  Download,
  Share2,
  Calendar
} from 'lucide-react';

const MobileStudentApp = () => {
  const { token } = useParams();
  const [loading, setLoading] = useState(true);
  const [studentData, setStudentData] = useState(null);
  const [qrData, setQRData] = useState(null);
  const [todayMenu, setTodayMenu] = useState(null);
  const [schoolName, setSchoolName] = useState('');

  useEffect(() => {
    loadStudentData();
  }, [token]);

  const loadStudentData = async () => {
    try {
      const response = await fetch(`https://api.bonapp.dev/api/mobile/student/${token}`);
      const data = await response.json();

      if (data.success) {
        setStudentData(data.student);
        setSchoolName(data.schoolName);
        setTodayMenu(data.todayMenu);
        
        // טען QR
        await loadQR(data.student.id);
      }
    } catch (error) {
      console.error('Error loading student data:', error);
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
        setQRData(imageResult);
      }
    } catch (error) {
      console.error('QR error:', error);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${schoolName} - QR Code`,
          text: `QR Code של ${studentData?.first_name}`,
          url: url
        });
      } catch (err) {
        console.log('Share cancelled');
      }
    } else {
      navigator.clipboard.writeText(url);
      alert('✅ הלינק הועתק!');
    }
  };

  const getTodayName = () => {
    const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
    return days[new Date().getDay()];
  };

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
      padding: '1rem'
    },
    header: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      padding: '2rem 1.5rem',
      marginBottom: '1.5rem',
      textAlign: 'center',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
    },
    schoolName: {
      fontSize: '1.1rem',
      color: '#7f8c8d',
      margin: '0 0 0.5rem 0'
    },
    studentName: {
      fontSize: '2rem',
      fontWeight: 'bold',
      color: '#2c3e50',
      margin: '0 0 0.25rem 0'
    },
    grade: {
      fontSize: '1rem',
      color: '#95a5a6',
      margin: 0
    },
    card: {
      background: 'white',
      borderRadius: '20px',
      padding: '2rem 1.5rem',
      marginBottom: '1.5rem',
      boxShadow: '0 4px 16px rgba(0,0,0,0.1)'
    },
    qrContainer: {
      textAlign: 'center'
    },
    qrTitle: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#2c3e50',
      marginBottom: '1.5rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem'
    },
    qrImage: {
      width: '100%',
      maxWidth: '300px',
      height: 'auto',
      margin: '0 auto',
      border: '4px solid #667eea',
      borderRadius: '16px',
      padding: '1rem',
      background: 'white'
    },
    qrCode: {
      fontSize: '1.8rem',
      fontWeight: 'bold',
      color: '#667eea',
      margin: '1.5rem 0',
      fontFamily: 'monospace',
      background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)',
      padding: '1rem',
      borderRadius: '12px',
      letterSpacing: '3px'
    },
    qrInstruction: {
      fontSize: '0.95rem',
      color: '#7f8c8d',
      lineHeight: 1.6,
      marginTop: '1rem'
    },
    balanceCard: {
      background: 'linear-gradient(135deg, #4CAF50, #45a049)',
      color: 'white',
      padding: '2rem 1.5rem',
      borderRadius: '20px',
      textAlign: 'center',
      marginBottom: '1.5rem',
      boxShadow: '0 8px 24px rgba(76, 175, 80, 0.3)'
    },
    balanceLabel: {
      fontSize: '1rem',
      opacity: 0.9,
      margin: '0 0 0.5rem 0'
    },
    balance: {
      fontSize: '3rem',
      fontWeight: 'bold',
      margin: '0.5rem 0'
    },
    balanceNote: {
      fontSize: '0.9rem',
      opacity: 0.85,
      margin: '0.5rem 0 0 0'
    },
    menuCard: {
      background: 'linear-gradient(135deg, #FF9800, #F57C00)',
      color: 'white',
      padding: '2rem 1.5rem',
      borderRadius: '20px',
      marginBottom: '1.5rem',
      boxShadow: '0 8px 24px rgba(255, 152, 0, 0.3)'
    },
    menuTitle: {
      fontSize: '1.3rem',
      fontWeight: 'bold',
      marginBottom: '0.5rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    menuDay: {
      fontSize: '0.9rem',
      opacity: 0.9,
      marginBottom: '1rem'
    },
    menuContent: {
      fontSize: '1.1rem',
      lineHeight: 1.6,
      background: 'rgba(255,255,255,0.2)',
      padding: '1rem',
      borderRadius: '12px',
      marginBottom: '1rem'
    },
    menuPrice: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      textAlign: 'center'
    },
    buttonContainer: {
      display: 'flex',
      gap: '1rem',
      marginTop: '1.5rem'
    },
    button: {
      flex: 1,
      padding: '1rem',
      border: 'none',
      borderRadius: '12px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      transition: 'all 0.3s'
    },
    downloadButton: {
      background: '#5cb85c',
      color: 'white',
      boxShadow: '0 4px 12px rgba(92, 184, 92, 0.3)'
    },
    shareButton: {
      background: '#25D366',
      color: 'white',
      boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)'
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
        fontSize: '1.5rem'
      }}>
        טוען...
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* כותרת */}
      <div style={styles.header}>
        <p style={styles.schoolName}>{schoolName}</p>
        <h1 style={styles.studentName}>
          {studentData?.first_name} {studentData?.last_name}
        </h1>
        <p style={styles.grade}>כיתה {studentData?.grade}</p>
      </div>

      {/* יתרה */}
      <div style={styles.balanceCard}>
        <p style={styles.balanceLabel}>היתרה שלי</p>
        <div style={styles.balance}>
          ₪{(studentData?.balance || 0).toFixed(2)}
        </div>
        <p style={styles.balanceNote}>
          מגבלה יומית: ₪{studentData?.spending_limit || 50}
        </p>
      </div>

      {/* QR Code */}
      {qrData && (
        <div style={styles.card}>
          <div style={styles.qrContainer}>
            <h2 style={styles.qrTitle}>
              <QrCode size={28} />
              קוד QR שלי
            </h2>
            
            <img 
              src={qrData.qrImage} 
              alt="QR Code"
              style={styles.qrImage}
            />
            
            <div style={styles.qrCode}>
              {qrData.qrCode}
            </div>
            
            <p style={styles.qrInstruction}>
              📱 הצג את הקוד הזה במזנון<br/>
              כדי לקנות ארוחה או חטיף
            </p>

            <div style={styles.buttonContainer}>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = qrData.qrImage;
                  link.download = `QR_${studentData?.first_name}.png`;
                  link.click();
                }}
                style={{...styles.button, ...styles.downloadButton}}
              >
                <Download size={20} />
                הורד
              </button>
              
              <button
                onClick={handleShare}
                style={{...styles.button, ...styles.shareButton}}
              >
                <Share2 size={20} />
                שתף
              </button>
            </div>
          </div>
        </div>
      )}

      {/* תפריט היום */}
      {todayMenu && (
        <div style={styles.menuCard}>
          <div style={styles.menuTitle}>
            <ChefHat size={24} />
            תפריט היום
          </div>
          <div style={styles.menuDay}>
            <Calendar size={16} style={{display: 'inline', marginLeft: '0.25rem'}} />
            {getTodayName()}
          </div>
          <div style={styles.menuContent}>
            {todayMenu.menu || 'אין תפריט להיום'}
          </div>
          <div style={styles.menuPrice}>
            ₪{todayMenu.price || 0}
          </div>
        </div>
      )}

      {/* הוראות */}
      <div style={{
        ...styles.card,
        background: 'rgba(255,255,255,0.95)',
        textAlign: 'center'
      }}>
        <h3 style={{
          fontSize: '1.2rem',
          color: '#2c3e50',
          marginBottom: '1rem'
        }}>
          💡 איך להשתמש?
        </h3>
        <ol style={{
          textAlign: 'right',
          lineHeight: 2,
          color: '#555',
          paddingRight: '1.5rem'
        }}>
          <li>הגע למזנון בית הספר</li>
          <li>הצג את קוד ה-QR למוכר</li>
          <li>המוכר יסרוק את הקוד</li>
          <li>תהנה מהארוחה! 🍔</li>
        </ol>
      </div>
    </div>
  );
};

export default MobileStudentApp;
