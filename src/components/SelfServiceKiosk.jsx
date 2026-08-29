import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMenuItems, processMealPurchase } from '../api';
import { authFetch } from '../auth';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Lock, ShoppingCart, X } from 'lucide-react';

const API_URL = 'https://api.bonapp.dev/api';

// מסך קיוסק עצמאי - התלמיד עצמו מזהה את עצמו (QR או PIN) ובוחר פריטים.
// היציאה נעולה מאחורי הסיסמה האישית של איש הצוות שמחובר בפועל.
const SelfServiceKiosk = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);

  // זיהוי תלמיד
  const [identifyMode, setIdentifyMode] = useState('scan'); // 'scan' | 'pin'
  const [isScanning, setIsScanning] = useState(true);
  const [scannerReady, setScannerReady] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [identifyError, setIdentifyError] = useState('');

  // קניה
  const [student, setStudent] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [cart, setCart] = useState([]);
  const [processing, setProcessing] = useState(false);
  const [purchaseError, setPurchaseError] = useState('');
  const [successInfo, setSuccessInfo] = useState(null);

  // נעילת יציאה
  const [showExitPrompt, setShowExitPrompt] = useState(false);
  const [exitPassword, setExitPassword] = useState('');
  const [exitError, setExitError] = useState('');

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user || !['kitchen', 'secretary', 'admin'].includes(user.type)) {
      navigate('/login');
      return;
    }

    getMenuItems(user.school_id)
      .then(data => {
        if (data.success) setMenuItems(data.menuItems || []);
      })
      .finally(() => setLoading(false));
  }, [navigate]);

  // נועלים את היציאה - ניווט אחורה בדפדפן פותח את בקשת הסיסמה במקום לצאת בפועל
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const onPopState = () => {
      window.history.pushState(null, '', window.location.href);
      setShowExitPrompt(true);
    };
    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  const resetToIdle = useCallback(() => {
    setStudent(null);
    setCart([]);
    setSelectedCategory('');
    setPurchaseError('');
    setSuccessInfo(null);
    setPinInput('');
    setIdentifyError('');
    setIsScanning(true);
    setIdentifyMode('scan');
  }, []);

  // --- זיהוי תלמיד ---

  const identifyStudent = async (payload) => {
    setIdentifyError('');
    try {
      const response = await authFetch(`${API_URL}/kiosk/identify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await response.json();
      if (data.success) {
        setStudent(data.student);
        setIsScanning(false);
        const categories = [...new Set(menuItems.filter(i => i.available).map(i => i.category))];
        setSelectedCategory(categories[0] || '');
      } else {
        setIdentifyError(data.message || 'תלמיד לא נמצא');
      }
    } catch (error) {
      setIdentifyError('שגיאה בזיהוי תלמיד');
    }
  };

  const onScanSuccess = (decodedText) => {
    setIsScanning(false);
    identifyStudent({ qrCode: decodedText });
  };

  const scannerInstanceRef = useRef(null);
  const scannerClearingRef = useRef(Promise.resolve());

  useEffect(() => {
    if (identifyMode === 'scan' && isScanning && !scannerReady && !student) {
      let cancelled = false;
      scannerClearingRef.current.then(() => {
        if (cancelled) return;
        const scanner = new Html5QrcodeScanner(
          'kiosk-qr-reader',
          {
            fps: 10,
            qrbox: (viewfinderWidth, viewfinderHeight) => {
              const edge = Math.floor(Math.min(viewfinderWidth, viewfinderHeight) * 0.9);
              return { width: edge, height: edge };
            },
            aspectRatio: 1.0
          },
          false
        );
        scannerInstanceRef.current = scanner;
        scanner.render(onScanSuccess, () => {});
        setScannerReady(true);
      });

      return () => {
        cancelled = true;
        const instance = scannerInstanceRef.current;
        scannerInstanceRef.current = null;
        setScannerReady(false);
        if (instance) {
          scannerClearingRef.current = instance.clear().catch(() => {});
        }
      };
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [identifyMode, isScanning, student]);

  const handlePinDigit = (digit) => {
    setPinInput(prev => (prev.length >= 4 ? prev : prev + digit));
  };

  useEffect(() => {
    if (pinInput.length === 4) {
      identifyStudent({ pin: pinInput });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinInput]);

  // --- עגלה ---

  const categories = [...new Set(menuItems.filter(i => i.available).map(i => i.category))];
  const itemsInCategory = menuItems.filter(i => i.available && i.category === selectedCategory);
  const cartTotal = cart.reduce((sum, c) => sum + c.price * c.quantity, 0);

  const addToCart = (item) => {
    setPurchaseError('');
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) {
        return prev.map(c => c.id === item.id ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { id: item.id, name: item.name, price: item.price, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId) => {
    setCart(prev => prev
      .map(c => c.id === itemId ? { ...c, quantity: c.quantity - 1 } : c)
      .filter(c => c.quantity > 0));
  };

  const remainingDailyLimit = student?.spending_limit
    ? Math.max(0, student.spending_limit - (student.spent_today || 0))
    : null;

  const exceedsBalance = student && cartTotal > student.balance;
  const exceedsDailyLimit = remainingDailyLimit !== null && cartTotal > remainingDailyLimit;

  const handleCheckout = async () => {
    if (!student || cart.length === 0) return;

    if (exceedsDailyLimit) {
      setPurchaseError(`חריגה ממגבלת ההוצאה היומית שקבע ההורה (נותרו ₪${remainingDailyLimit.toFixed(2)} להיום)`);
      return;
    }
    if (exceedsBalance) {
      setPurchaseError('אין מספיק יתרה');
      return;
    }

    setProcessing(true);
    setPurchaseError('');
    try {
      const result = await processMealPurchase(
        student.id,
        cart.map(c => ({ id: c.id, quantity: c.quantity })),
        cartTotal
      );
      if (result.success) {
        setSuccessInfo({ newBalance: student.balance - cartTotal, total: cartTotal });
        setTimeout(resetToIdle, 5000);
      } else {
        setPurchaseError(result.message || 'שגיאה בביצוע הרכישה');
      }
    } catch (error) {
      setPurchaseError('שגיאה בביצוע הרכישה');
    } finally {
      setProcessing(false);
    }
  };

  const handlePayForBalance = async () => {
    const shortfall = Math.max(1, Math.ceil(cartTotal - student.balance));
    try {
      const response = await authFetch(`${API_URL}/create-grow-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parent_name: `${student.first_name} ${student.last_name}`,
          parent_phone: '',
          amount: shortfall,
          student_name: `${student.first_name} ${student.last_name}`,
          description: `BonApp-${student.id}`,
          student_id: student.id
        })
      });
      const result = await response.json();
      if (result.success && result.paymentUrl) {
        window.location.href = result.paymentUrl;
      } else {
        setPurchaseError('שגיאה ביצירת קישור תשלום');
      }
    } catch (error) {
      setPurchaseError('שגיאה ביצירת קישור תשלום');
    }
  };

  // --- נעילת יציאה ---

  const handleExitSubmit = async () => {
    setExitError('');
    try {
      const response = await authFetch(`${API_URL}/verify-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: exitPassword })
      });
      const result = await response.json();
      if (result.success) {
        navigate('/menu-management');
      } else {
        setExitError('סיסמה שגויה');
      }
    } catch (error) {
      setExitError('שגיאה באימות');
    } finally {
      setExitPassword('');
    }
  };

  if (loading) {
    return <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>טוען...</div>;
  }

  return (
    <div style={{
      minHeight: '100vh', background: '#f8f9fa', fontFamily: "'Segoe UI', sans-serif",
      direction: 'rtl', position: 'relative', overflow: 'hidden'
    }}>

      {/* כפתור יציאה קטן ודיסקרטי */}
      <button
        onClick={() => setShowExitPrompt(true)}
        style={{
          position: 'fixed', top: '1rem', left: '1rem', zIndex: 500,
          background: 'rgba(0,0,0,0.15)', border: 'none', borderRadius: '50%',
          width: '40px', height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', color: 'white'
        }}
      >
        <Lock size={18} />
      </button>

      {!student ? (
        // מסך זיהוי
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <h1 style={{ fontSize: '2rem', color: '#333', marginBottom: '2rem' }}>🍽️ ברוכים הבאים לקיוסק</h1>

          <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
            <button
              onClick={() => { setIdentifyMode('scan'); setIsScanning(true); setIdentifyError(''); }}
              style={{
                padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none', fontWeight: '600', cursor: 'pointer',
                background: identifyMode === 'scan' ? '#667eea' : '#e0e0e0', color: identifyMode === 'scan' ? 'white' : '#555'
              }}
            >
              📷 סריקת QR
            </button>
            <button
              onClick={() => { setIdentifyMode('pin'); setPinInput(''); setIdentifyError(''); }}
              style={{
                padding: '0.75rem 1.5rem', borderRadius: '12px', border: 'none', fontWeight: '600', cursor: 'pointer',
                background: identifyMode === 'pin' ? '#667eea' : '#e0e0e0', color: identifyMode === 'pin' ? 'white' : '#555'
              }}
            >
              🔢 קוד אישי (PIN)
            </button>
          </div>

          {identifyMode === 'scan' ? (
            <div style={{ width: '320px', maxWidth: '90vw' }}>
              <div id="kiosk-qr-reader" />
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <div style={{
                fontSize: '2.5rem', letterSpacing: '1rem', marginBottom: '1.5rem',
                background: 'white', padding: '1rem 2rem', borderRadius: '12px', minWidth: '260px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
              }}>
                {pinInput.padEnd(4, '•')}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.75rem', width: '260px' }}>
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                  <button key={d} onClick={() => handlePinDigit(d)} style={pinKeyStyle}>{d}</button>
                ))}
                <button onClick={() => setPinInput('')} style={{ ...pinKeyStyle, background: '#f5f5f5' }}>נקה</button>
                <button onClick={() => handlePinDigit('0')} style={pinKeyStyle}>0</button>
                <button onClick={() => setPinInput(pinInput.slice(0, -1))} style={{ ...pinKeyStyle, background: '#f5f5f5' }}>⌫</button>
              </div>
            </div>
          )}

          {identifyError && (
            <p style={{ color: '#f44336', marginTop: '1.5rem', fontWeight: '600' }}>{identifyError}</p>
          )}
        </div>
      ) : successInfo ? (
        // מסך הצלחה
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ fontSize: '4rem' }}>✅</div>
          <h2 style={{ fontSize: '1.8rem', color: '#2e7d32' }}>הרכישה בוצעה בהצלחה!</h2>
          <p style={{ fontSize: '1.2rem', color: '#555' }}>שולם: ₪{successInfo.total.toFixed(2)}</p>
          <p style={{ fontSize: '1rem', color: '#888' }}>יתרה חדשה: ₪{successInfo.newBalance.toFixed(2)}</p>
        </div>
      ) : (
        // מסך קניה
        <div style={{ display: 'flex', minHeight: '100vh', paddingBottom: '90px' }}>
          {/* סרגל קטגוריות */}
          <div style={{ width: '160px', background: 'white', boxShadow: '2px 0 8px rgba(0,0,0,0.05)', paddingTop: '1rem' }}>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  display: 'block', width: '100%', padding: '1rem', border: 'none', cursor: 'pointer',
                  background: selectedCategory === cat ? '#667eea' : 'transparent',
                  color: selectedCategory === cat ? 'white' : '#555',
                  fontWeight: '600', fontSize: '1rem', textAlign: 'center'
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* פריטים */}
          <div style={{ flex: 1, padding: '1.5rem' }}>
            <p style={{ color: '#667eea', fontWeight: '600', marginBottom: '1rem' }}>
              שלום {student.first_name}! יתרה: ₪{student.balance.toFixed(2)}
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '1rem' }}>
              {itemsInCategory.map(item => (
                <div
                  key={item.id}
                  onClick={() => addToCart(item)}
                  style={{
                    background: 'white', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)', textAlign: 'center'
                  }}
                >
                  {item.image_url ? (
                    <div style={{ width: '100%', height: '160px', background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <img src={item.image_url} alt="" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  ) : (
                    <div style={{ width: '100%', height: '160px', background: '#f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🍽️</div>
                  )}
                  <div style={{ padding: '0.75rem' }}>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>{item.name}</div>
                    <div style={{ color: '#667eea', fontWeight: '700' }}>₪{item.price.toFixed(2)}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* עגלה */}
          {cart.length > 0 && (
            <div style={{ width: '260px', background: 'white', boxShadow: '-2px 0 8px rgba(0,0,0,0.05)', padding: '1rem', overflowY: 'auto' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}><ShoppingCart size={18} /> העגלה שלי</h3>
              {cart.map(c => (
                <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid #f0f0f0' }}>
                  <div>
                    <div style={{ fontSize: '0.9rem', fontWeight: '600' }}>{c.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#888' }}>₪{c.price.toFixed(2)} × {c.quantity}</div>
                  </div>
                  <button onClick={() => removeFromCart(c.id)} style={{ background: '#fdecea', border: 'none', borderRadius: '50%', width: '28px', height: '28px', cursor: 'pointer' }}>
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* סרגל תשלום קבוע */}
      {student && !successInfo && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, background: 'white',
          boxShadow: '0 -2px 12px rgba(0,0,0,0.1)', padding: '1rem 1.5rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem'
        }}>
          <div>
            <div style={{ fontSize: '1.3rem', fontWeight: '700' }}>סה"כ: ₪{cartTotal.toFixed(2)}</div>
            {purchaseError && <div style={{ color: '#f44336', fontSize: '0.9rem' }}>{purchaseError}</div>}
          </div>
          {exceedsBalance ? (
            <button onClick={handlePayForBalance} style={{ padding: '1rem 2rem', background: '#ff9800', color: 'white', border: 'none', borderRadius: '12px', fontWeight: '700', cursor: 'pointer', fontSize: '1rem' }}>
              💳 תשלום להשלמת יתרה
            </button>
          ) : (
            <button
              onClick={handleCheckout}
              disabled={cart.length === 0 || processing}
              style={{
                padding: '1rem 2rem', background: cart.length === 0 ? '#ccc' : '#4CAF50', color: 'white',
                border: 'none', borderRadius: '12px', fontWeight: '700', cursor: cart.length === 0 ? 'default' : 'pointer', fontSize: '1rem'
              }}
            >
              {processing ? 'מעבד...' : '✅ שלם'}
            </button>
          )}
        </div>
      )}

      {/* בקשת סיסמת יציאה */}
      {showExitPrompt && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '2rem', width: '90%', maxWidth: '360px', textAlign: 'center' }}>
            <Lock size={32} color="#667eea" />
            <h3 style={{ margin: '1rem 0' }}>סיסמת מנהל מטבח ליציאה</h3>
            <input
              type="password"
              value={exitPassword}
              onChange={(e) => setExitPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExitSubmit()}
              style={{ width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px', textAlign: 'center', fontSize: '1.1rem', boxSizing: 'border-box' }}
              autoFocus
            />
            {exitError && <p style={{ color: '#f44336', marginTop: '0.5rem' }}>{exitError}</p>}
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
              <button onClick={() => { setShowExitPrompt(false); setExitPassword(''); setExitError(''); }} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#f5f5f5', cursor: 'pointer' }}>ביטול</button>
              <button onClick={handleExitSubmit} style={{ flex: 1, padding: '0.75rem', borderRadius: '8px', border: 'none', background: '#667eea', color: 'white', cursor: 'pointer', fontWeight: '600' }}>אישור</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const pinKeyStyle = {
  padding: '1rem', fontSize: '1.3rem', borderRadius: '12px', border: '2px solid #e0e0e0',
  background: 'white', cursor: 'pointer', fontWeight: '600'
};

export default SelfServiceKiosk;
