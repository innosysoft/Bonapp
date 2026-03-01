import React, { useState } from 'react';
import { 
  X, 
  Mail, 
  MessageSquare, 
  Smartphone,
  Copy,
  Check,
  Send
} from 'lucide-react';

const SendToPhoneModal = ({ show, onClose, userType, userId, userName, userEmail }) => {
  const [mobileUrl, setMobileUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState('whatsapp');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(userEmail || '');

  React.useEffect(() => {
    if (show && !mobileUrl) {
      generateMobileLink();
    }
  }, [show]);

  const generateMobileLink = async () => {
    try {
      setLoading(true);
      
      const endpoint = userType === 'parent' ? 
        '/api/mobile/generate-parent-token' : 
        '/api/mobile/generate-student-token';
      
      const response = await fetch(`https://api.bonapp.dev${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentId: userType === 'parent' ? userId : undefined,
          studentId: userType === 'student' ? userId : undefined
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setMobileUrl(data.url);
      }
    } catch (error) {
      console.error('Error generating link:', error);
      alert('שגיאה ביצירת קישור');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(mobileUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSendWhatsApp = () => {
    const message = `היי! 👋
    
הנה הקישור לאפליקציית ניהול הארוחות של בית הספר:

📱 ${mobileUrl}

לחץ על הקישור כדי לפתוח את האפליקציה בטלפון שלך.
תוכל גם להוסיף אותה למסך הבית!`;

    const whatsappUrl = `https://wa.me/${phone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const handleSendSMS = async () => {
    try {
      const response = await fetch('https://api.bonapp.dev/api/mobile/send-link-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone,
          url: mobileUrl,
          type: userType
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        alert('✅ SMS נשלח בהצלחה!');
      }
    } catch (error) {
      console.error('SMS error:', error);
      alert('❌ שגיאה בשליחת SMS');
    }
  };

  const handleSendEmail = async () => {
    try {
      const response = await fetch('https://api.bonapp.dev/api/mobile/send-link-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          url: mobileUrl,
          name: userName,
          type: userType
        })
      });
      
const handleShareWhatsApp = () => {

console.log('🔍 WhatsApp clicked!');
  console.log('📱 Phone:', phone);
  console.log('🔗 URL:', mobileUrl);

  if (!phone || phone.trim() === '') {
    alert('❌ נא להזין מספר טלפון');
    return;
  }
  
  const message = `היי! 👋

הנה הקישור לאפליקציית ארוחות בית הספר:

📱 ${mobileUrl}

לחץ על הקישור כדי לפתוח את האפליקציה בטלפון שלך.
תוכל גם להוסיף אותה למסך הבית!`;
  
console.log('💬 Message:', message);

  const cleanPhone = phone.replace(/\D/g, '');
console.log('📞 Clean phone:', cleanPhone);

  const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
  console.log('🌐 WhatsApp URL:', whatsappUrl);
  
  window.open(whatsappUrl, '_blank');
};

      const data = await response.json();
      
      if (data.success) {
        alert('✅ מייל נשלח בהצלחה!');
      }
    } catch (error) {
      console.error('Email error:', error);
      alert('❌ שגיאה בשליחת מייל');
    }
  };

  if (!show) return null;

  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
      padding: '1rem'
    },
    modal: {
      background: 'white',
      borderRadius: '20px',
      padding: '2rem',
      maxWidth: '500px',
      width: '100%',
      maxHeight: '90vh',
      overflowY: 'auto',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '1.5rem',
      paddingBottom: '1rem',
      borderBottom: '2px solid #f0f0f0'
    },
    title: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#2c3e50',
      margin: 0
    },
    closeButton: {
      background: '#f8f9fa',
      border: 'none',
      borderRadius: '50%',
      width: '40px',
      height: '40px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    linkBox: {
      background: '#f8f9fa',
      padding: '1rem',
      borderRadius: '12px',
      marginBottom: '1.5rem',
      wordBreak: 'break-all',
      fontSize: '0.9rem',
      color: '#555',
      border: '2px dashed #667eea'
    },
    copyButton: {
      width: '100%',
      padding: '0.75rem',
      background: copied ? '#5cb85c' : '#667eea',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      fontSize: '1rem',
      fontWeight: '600',
      cursor: 'pointer',
      marginBottom: '2rem',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.5rem',
      transition: 'all 0.3s'
    },
    methodSelector: {
      display: 'flex',
      gap: '0.75rem',
      marginBottom: '1.5rem'
    },
    methodButton: {
      flex: 1,
      padding: '1rem',
      border: '2px solid',
      borderRadius: '12px',
      cursor: 'pointer',
      transition: 'all 0.3s',
      textAlign: 'center',
      background: 'white',
      fontSize: '0.9rem',
      fontWeight: '600'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e0e0e0',
      borderRadius: '12px',
      fontSize: '1rem',
      marginBottom: '1rem',
      boxSizing: 'border-box'
    },
    sendButton: {
      width: '100%',
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
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={styles.title}>📱 שלח לטלפון</h2>
          <button onClick={onClose} style={styles.closeButton}>
            <X size={24} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>
            יוצר קישור...
          </div>
        ) : (
          <>
            <div style={styles.linkBox}>
              {mobileUrl}
            </div>

            <button onClick={handleCopyLink} style={styles.copyButton}>
              {copied ? (
                <>
                  <Check size={20} />
                  הועתק!
                </>
              ) : (
                <>
                  <Copy size={20} />
                  העתק קישור
                </>
              )}
            </button>

            <h3 style={{
              fontSize: '1.1rem',
              fontWeight: 'bold',
              color: '#2c3e50',
              marginBottom: '1rem'
            }}>
              בחר אמצעי שליחה:
            </h3>

            <div style={styles.methodSelector}>
              <button
                onClick={() => setSelectedMethod('whatsapp')}
                style={{
                  ...styles.methodButton,
                  borderColor: selectedMethod === 'whatsapp' ? '#25D366' : '#e0e0e0',
                  color: selectedMethod === 'whatsapp' ? '#25D366' : '#999'
                }}
              >
                💬<br/>WhatsApp
              </button>

              <button
                onClick={() => setSelectedMethod('sms')}
                style={{
                  ...styles.methodButton,
                  borderColor: selectedMethod === 'sms' ? '#2196F3' : '#e0e0e0',
                  color: selectedMethod === 'sms' ? '#2196F3' : '#999'
                }}
              >
                📱<br/>SMS
              </button>

              <button
                onClick={() => setSelectedMethod('email')}
                style={{
                  ...styles.methodButton,
                  borderColor: selectedMethod === 'email' ? '#f44336' : '#e0e0e0',
                  color: selectedMethod === 'email' ? '#f44336' : '#999'
                }}
              >
                📧<br/>Email
              </button>
            </div>

            {(selectedMethod === 'whatsapp' || selectedMethod === 'sms') && (
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="מספר טלפון (עם קידומת)"
                style={styles.input}
              />
            )}

            {selectedMethod === 'email' && (
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="כתובת אימייל"
                style={styles.input}
              />
            )}

            {selectedMethod === 'whatsapp' && (
              <button
                onClick={handleSendWhatsApp}
                disabled={!phone}
                style={{
                  ...styles.sendButton,
                  background: !phone ? '#e0e0e0' : '#25D366',
                  color: !phone ? '#999' : 'white',
                  cursor: !phone ? 'not-allowed' : 'pointer'
                }}
              >
                <MessageSquare size={20} />
                שלח ב-WhatsApp
              </button>
            )}

            {selectedMethod === 'sms' && (
              <button
                onClick={handleSendSMS}
                disabled={!phone}
                style={{
                  ...styles.sendButton,
                  background: !phone ? '#e0e0e0' : '#2196F3',
                  color: !phone ? '#999' : 'white',
                  cursor: !phone ? 'not-allowed' : 'pointer'
                }}
              >
                <Smartphone size={20} />
                שלח SMS
              </button>
            )}

            {selectedMethod === 'email' && (
              <button
                onClick={handleSendEmail}
                disabled={!email}
                style={{
                  ...styles.sendButton,
                  background: !email ? '#e0e0e0' : '#f44336',
                  color: !email ? '#999' : 'white',
                  cursor: !email ? 'not-allowed' : 'pointer'
                }}
              >
                <Mail size={20} />
                שלח מייל
              </button>
            )}

            <div style={{
              marginTop: '1.5rem',
              padding: '1rem',
              background: '#e3f2fd',
              borderRadius: '12px',
              fontSize: '0.85rem',
              color: '#1976d2',
              lineHeight: 1.5
            }}>
              💡 <strong>טיפ:</strong> לאחר פתיחת הקישור בטלפון, ניתן ללחוץ על "הוסף למסך הבית" כדי להפוך את האפליקציה לזמינה בקלות!
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default SendToPhoneModal;
