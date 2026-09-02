import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMenuItems, processMealPurchase } from '../api';
import { authFetch } from '../auth';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { Lock, ShoppingCart, Plus, Minus, CheckCircle, CreditCard, UtensilsCrossed, Delete, Check, X } from 'lucide-react';

const API_URL = 'https://api.bonapp.dev/api';

// מסך קיוסק עצמאי - עיצוב לפי דגם bonapp-self-service-kiosk-design.html שאושר.
// התלמיד עצמו מזהה את עצמו (QR או PIN) ובוחר פריטים. כל הלוגיקה העסקית (זיהוי, יתרה,
// מגבלות רכישה, חישוב סכום, תשלום, נעילת יציאה, איפוס לאחר עסקה) נשמרה כפי שהייתה -
// רק שכבת התצוגה הוחלפה. היציאה נעולה מאחורי הסיסמה האישית של איש הצוות שמחובר בפועל.
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

  // תצוגת עגלה (UI בלבד - לא משנה נתונים/לוגיקה)
  const [cartOpen, setCartOpen] = useState(false);

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
    setCartOpen(false);
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
    if (!loading && identifyMode === 'scan' && isScanning && !scannerReady && !student) {
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
  }, [loading, identifyMode, isScanning, student]);

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

  // מסך תוספות: כשמוצר עם תוספות נלחץ, נפתח כאן לבחירה (מרובה) לפני שמוסיפים לעגלה בפועל.
  const [addonItem, setAddonItem] = useState(null);
  const [selectedAddonIds, setSelectedAddonIds] = useState([]);

  const categories = [...new Set(menuItems.filter(i => i.available).map(i => i.category))];
  const itemsInCategory = menuItems.filter(i => i.available && i.category === selectedCategory);
  const cartTotal = cart.reduce((sum, c) => sum + (c.price + (c.addonsPrice || 0)) * c.quantity, 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  // מוצר בלי תוספות מתנהג בדיוק כמו קודם: נכנס לעגלה מיד, שורה אחת לכל מוצר, כמות מצטברת.
  // מוצר עם תוספות פותח קודם את מסך הבחירה (handleProductTap) - זו הפונקציה שבאמת מכניסה
  // לעגלה, עם lineKey ייחודי לכל שילוב מוצר+תוספות כדי שאפשר יהיה להזמין אותו מוצר פעמיים
  // עם תוספות שונות בשתי שורות נפרדות.
  const addToCart = (item, addons = []) => {
    setPurchaseError('');
    const lineKey = addons.length > 0
      ? `${item.id}::${addons.map(a => a.id).sort().join(',')}`
      : item.id;
    const addonsPrice = addons.reduce((sum, a) => sum + (parseFloat(a.price_delta) || 0), 0);

    setCart(prev => {
      const existing = prev.find(c => c.lineKey === lineKey);
      if (existing) {
        return prev.map(c => c.lineKey === lineKey ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, {
        lineKey,
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        addonIds: addons.map(a => a.id),
        addonNames: addons.map(a => a.name),
        addonsPrice
      }];
    });
  };

  const removeFromCart = (lineKey) => {
    setCart(prev => prev
      .map(c => c.lineKey === lineKey ? { ...c, quantity: c.quantity - 1 } : c)
      .filter(c => c.quantity > 0));
  };

  // מגדיל כמות של שורה קיימת בעגלה (כולל תוספות שכבר נבחרו לה) - לא בונה מחדש lineKey.
  const incrementCartLine = (lineKey) => {
    setCart(prev => prev.map(c => c.lineKey === lineKey ? { ...c, quantity: c.quantity + 1 } : c));
  };

  const handleProductTap = (item) => {
    if (item.addons && item.addons.length > 0) {
      setSelectedAddonIds([]);
      setAddonItem(item);
    } else {
      addToCart(item);
    }
  };

  const toggleAddonId = (addonId) => {
    setSelectedAddonIds(prev => prev.includes(addonId) ? prev.filter(id => id !== addonId) : [...prev, addonId]);
  };

  const confirmAddonSelection = () => {
    const chosen = (addonItem.addons || []).filter(a => selectedAddonIds.includes(a.id));
    addToCart(addonItem, chosen);
    setAddonItem(null);
    setSelectedAddonIds([]);
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
        cart.map(c => ({ id: c.id, quantity: c.quantity, addonIds: c.addonIds || [] })),
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

  const initials = student ? `${student.first_name?.[0] || ''}${student.last_name?.[0] || ''}` : '';

  return (
    <div className="bap-kiosk">
      <style>{`
        .bap-kiosk{
          --navy:#17324a;--blue:#356b8c;--green:#75a843;--green2:#eef6e9;--paper:#f4f7f7;
          --white:#fff;--muted:#607482;--line:#dce6e9;--danger:#b64e4e;--warn:#b9812e;
          --shadow:0 10px 30px rgba(23,50,74,.1);
          font-family:'Heebo',Arial,sans-serif;color:var(--navy);background:var(--paper);
          font-size:16px;min-height:100vh;padding-bottom:118px;
        }
        .bap-kiosk *{box-sizing:border-box}
        .bap-kiosk button{font:inherit}
        .bap-kiosk button:focus-visible,.bap-kiosk input:focus-visible{outline:3px solid var(--green);outline-offset:2px}

        .bap-kiosk .kiosk-head{min-height:108px;background:#fff;border-bottom:1px solid var(--line);display:grid;grid-template-columns:1fr auto 1fr;align-items:center;padding:10px 34px;position:sticky;top:0;z-index:10;gap:12px}
        .bap-kiosk .identity{display:flex;align-items:center;gap:16px;justify-self:start;min-height:58px}
        .bap-kiosk .avatar{width:58px;height:58px;border-radius:16px;background:var(--green2);color:var(--green);display:grid;place-items:center;font-weight:700;font-size:22px;flex-shrink:0}
        .bap-kiosk .identity strong{display:block;font-size:26px}
        .bap-kiosk .identity span{font-size:17px;color:var(--muted)}
        .bap-kiosk .brand{text-align:center;display:flex;flex-direction:column;align-items:center;gap:2px}
        .bap-kiosk .kiosk-logo{height:44px;width:auto}
        .bap-kiosk .brand small{font-size:13px;font-weight:500;color:var(--muted)}
        .bap-kiosk .balance{justify-self:end;text-align:left;background:#eaf3f7;padding:10px 20px;border-radius:12px;min-height:58px}
        .bap-kiosk .balance span{display:block;font-size:14px;color:var(--muted)}
        .bap-kiosk .balance strong{font-size:32px;color:var(--blue)}

        .bap-kiosk .lock{position:fixed;left:20px;top:124px;width:48px;height:48px;border:1px solid var(--line);background:#fff;border-radius:13px;color:var(--muted);box-shadow:var(--shadow);display:grid;place-items:center;z-index:50;cursor:pointer}
        .bap-kiosk .lock:hover{background:var(--paper)}

        .bap-kiosk .content{width:min(1380px,calc(100% - 48px));margin:26px auto}
        .bap-kiosk .welcome{display:flex;align-items:flex-end;justify-content:space-between;margin-bottom:22px;gap:16px;flex-wrap:wrap}
        .bap-kiosk .welcome h1{font-size:32px;margin:0}
        .bap-kiosk .welcome p{font-size:17px;color:var(--muted);margin:4px 0 0}
        .bap-kiosk .categories{display:flex;gap:9px;overflow-x:auto;padding-bottom:2px;-webkit-overflow-scrolling:touch}
        .bap-kiosk .cat{height:48px;padding:0 22px;border:1px solid var(--line);background:#fff;border-radius:999px;color:var(--muted);font-weight:600;white-space:nowrap;cursor:pointer;flex-shrink:0}
        .bap-kiosk .cat.active{background:var(--blue);border-color:var(--blue);color:#fff}

        .bap-kiosk .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
        .bap-kiosk .meal{position:relative;min-height:310px;background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:var(--shadow);text-align:right;padding:0;cursor:pointer;display:flex;flex-direction:column}
        .bap-kiosk .meal:hover{border-color:#9ab8c8}
        .bap-kiosk .meal.selected{border:3px solid var(--green)}
        .bap-kiosk .meal-photo{height:190px;background-position:center;background-size:cover;background-color:var(--green2);display:flex;align-items:center;justify-content:center;color:var(--green);flex-shrink:0}
        .bap-kiosk .meal-photo img{width:100%;height:100%;object-fit:cover}
        .bap-kiosk .meal-body{padding:16px 18px;display:flex;flex-direction:column;flex:1}
        .bap-kiosk .meal-body strong{display:block;font-size:19px}
        .bap-kiosk .meal-body small{color:var(--muted);font-size:14px;display:block;margin-top:2px}
        .bap-kiosk .meal-bottom{display:flex;justify-content:space-between;align-items:center;margin-top:auto;padding-top:12px}
        .bap-kiosk .meal-price{font-size:22px;color:var(--blue);font-weight:700}
        .bap-kiosk .plus{width:44px;height:44px;border-radius:12px;border:0;background:var(--green2);color:var(--green);font-size:22px;display:grid;place-items:center;flex-shrink:0}
        .bap-kiosk .meal.selected .plus{background:var(--green);color:#fff}
        .bap-kiosk .qty{position:absolute;top:12px;left:12px;min-width:38px;height:38px;padding:0 8px;border-radius:11px;background:var(--green);color:#fff;display:grid;place-items:center;font-weight:700;box-shadow:0 5px 15px rgba(42,101,48,.25);font-size:16px;z-index:2}
        .bap-kiosk .empty-note{text-align:center;padding:60px 20px;color:var(--muted);font-size:18px}

        .bap-kiosk .summary{position:fixed;bottom:0;right:0;left:0;min-height:108px;background:#fff;border-top:1px solid var(--line);box-shadow:0 -8px 30px rgba(23,50,74,.12);display:grid;grid-template-columns:1fr auto auto auto;align-items:center;gap:24px;padding:15px 34px;z-index:20}
        .bap-kiosk .summary-title{font-size:20px;font-weight:700}
        .bap-kiosk .summary-items{color:var(--muted);font-size:17px;margin-top:3px}
        .bap-kiosk .summary-total{display:flex;align-items:baseline;gap:10px}
        .bap-kiosk .summary-total span{font-size:18px;color:var(--muted)}
        .bap-kiosk .summary-total strong{font-size:40px;color:var(--navy)}
        .bap-kiosk .pay{height:62px;min-width:220px;border:0;border-radius:13px;background:var(--green);color:#fff;font-weight:700;font-size:22px;box-shadow:0 7px 20px rgba(70,130,50,.25);cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px}
        .bap-kiosk .pay:disabled{background:#cfd8db;color:#8a9490;cursor:not-allowed;box-shadow:none}
        .bap-kiosk .pay.warn{background:var(--warn);box-shadow:0 7px 20px rgba(185,129,46,.25)}
        .bap-kiosk .edit{height:56px;border:1px solid var(--line);border-radius:11px;background:#fff;padding:0 20px;color:var(--blue);font-weight:600;cursor:pointer;display:flex;align-items:center;gap:8px;font-size:18px}
        .bap-kiosk .summary-error{color:var(--danger);font-size:16px;font-weight:600;margin-top:5px}

        .bap-kiosk .cart-drawer{position:fixed;left:0;right:0;bottom:108px;background:#fff;border-top:1px solid var(--line);box-shadow:0 -8px 30px rgba(23,50,74,.12);max-height:50vh;overflow-y:auto;z-index:19;padding:20px 34px}
        .bap-kiosk .cart-drawer h3{margin:0 0 16px;font-size:22px;display:flex;align-items:center;gap:10px}
        .bap-kiosk .cart-row{display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid var(--line)}
        .bap-kiosk .cart-row:last-child{border-bottom:0}
        .bap-kiosk .cart-row .name{font-weight:600;font-size:19px}
        .bap-kiosk .cart-row .unit{font-size:16px;color:var(--muted)}
        .bap-kiosk .cart-qty{display:flex;align-items:center;gap:12px}
        .bap-kiosk .qty-btn{width:40px;height:40px;border-radius:50%;border:1px solid var(--line);background:#fff;display:grid;place-items:center;cursor:pointer;color:var(--navy)}

        .bap-kiosk .center-screen{min-height:calc(100vh - 96px);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:2rem;text-align:center}
        .bap-kiosk .id-title{font-size:30px;margin:0 0 28px}
        .bap-kiosk .mode-tabs{display:flex;gap:8px;background:#fff;border:1px solid var(--line);padding:6px;border-radius:14px;margin-bottom:28px}
        .bap-kiosk .mode-tab{padding:14px 26px;border-radius:10px;border:0;background:transparent;color:var(--muted);font-weight:700;font-size:17px;cursor:pointer}
        .bap-kiosk .mode-tab.active{background:var(--blue);color:#fff}
        .bap-kiosk .pin-display{font-size:2.5rem;letter-spacing:1rem;margin-bottom:1.5rem;background:#fff;border:1px solid var(--line);padding:1rem 2rem;border-radius:14px;min-width:260px;box-shadow:var(--shadow)}
        .bap-kiosk .pin-pad{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;width:280px}
        .bap-kiosk .pin-key{padding:1rem;font-size:1.4rem;border-radius:14px;border:1px solid var(--line);background:#fff;cursor:pointer;font-weight:700;min-height:60px;color:var(--navy)}
        .bap-kiosk .pin-key:hover{background:var(--paper)}
        .bap-kiosk .pin-key.muted{color:var(--muted)}
        .bap-kiosk .id-error{color:var(--danger);margin-top:1.5rem;font-weight:700;font-size:17px}
        .bap-kiosk .qr-box{width:340px;max-width:90vw;background:#fff;border:1px solid var(--line);border-radius:16px;padding:16px;box-shadow:var(--shadow)}

        .bap-kiosk .success-screen{min-height:calc(100vh - 96px);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:10px;text-align:center}
        .bap-kiosk .success-icon{width:96px;height:96px;border-radius:50%;background:var(--green2);color:var(--green);display:grid;place-items:center;margin-bottom:10px}
        .bap-kiosk .success-screen h2{font-size:28px;color:var(--green);margin:0}
        .bap-kiosk .success-screen p{font-size:19px;color:var(--muted);margin:4px 0 0}

        .bap-kiosk .modal-overlay{position:fixed;inset:0;background:rgba(23,50,74,.6);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px}
        .bap-kiosk .modal-card{background:#fff;border-radius:18px;padding:32px;width:100%;max-width:380px;text-align:center;box-shadow:0 20px 60px rgba(0,0,0,.3)}
        .bap-kiosk .modal-icon{width:56px;height:56px;border-radius:50%;background:var(--green2);color:var(--blue);display:grid;place-items:center;margin:0 auto}
        .bap-kiosk .modal-card h3{margin:16px 0}
        .bap-kiosk .modal-card input{width:100%;padding:14px;border:2px solid var(--line);border-radius:10px;text-align:center;font-size:1.1rem;box-sizing:border-box}
        .bap-kiosk .modal-error{color:var(--danger);margin-top:.5rem;font-weight:600}
        .bap-kiosk .modal-actions{display:flex;gap:.75rem;margin-top:1.5rem}
        .bap-kiosk .btn-secondary{flex:1;padding:14px;border-radius:10px;border:1px solid var(--line);background:#fff;color:var(--navy);cursor:pointer;font-weight:700}
        .bap-kiosk .btn-primary{flex:1;padding:14px;border-radius:10px;border:0;background:var(--blue);color:#fff;cursor:pointer;font-weight:700}

        .bap-kiosk .addon-modal{background:#fff;border-radius:20px;padding:28px;width:100%;max-width:640px;max-height:85vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)}
        .bap-kiosk .addon-modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
        .bap-kiosk .addon-modal-head h3{margin:0;font-size:22px;color:var(--navy)}
        .bap-kiosk .addon-close{background:var(--paper);border:none;border-radius:50%;width:38px;height:38px;display:grid;place-items:center;cursor:pointer;color:var(--navy)}
        .bap-kiosk .addon-hint{color:var(--muted);margin:0 0 18px}
        .bap-kiosk .addon-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(140px,1fr));gap:14px;margin-bottom:22px}
        .bap-kiosk .addon-tile{position:relative;background:var(--paper);border:2px solid var(--line);border-radius:16px;padding:14px;display:flex;flex-direction:column;align-items:center;gap:8px;cursor:pointer;text-align:center}
        .bap-kiosk .addon-tile.checked{border-color:var(--green);background:var(--green2)}
        .bap-kiosk .addon-check{position:absolute;top:8px;left:8px;width:24px;height:24px;border-radius:50%;background:var(--green);color:#fff;display:grid;place-items:center}
        .bap-kiosk .addon-photo{width:64px;height:64px;border-radius:14px;background:#fff;display:grid;place-items:center;color:var(--muted);overflow:hidden}
        .bap-kiosk .addon-photo img{width:100%;height:100%;object-fit:cover}
        .bap-kiosk .addon-name{font-weight:700;color:var(--navy)}
        .bap-kiosk .addon-price{color:var(--green);font-weight:700;font-size:14px}
        .bap-kiosk .addon-confirm{width:100%;padding:16px;font-size:17px}

        @media(max-width:1000px){
          .bap-kiosk .grid{grid-template-columns:repeat(3,1fr)}
          .bap-kiosk .welcome{align-items:flex-start;flex-direction:column;gap:14px}
          .bap-kiosk .kiosk-head{padding:10px 20px}
        }
        @media(max-width:680px){
          .bap-kiosk{padding-bottom:198px}
          .bap-kiosk .kiosk-head{grid-template-columns:1fr 1fr;padding:10px 16px;gap:8px}
          .bap-kiosk .brand{grid-column:1/-1;grid-row:1}
          .bap-kiosk .kiosk-logo{height:32px}
          .bap-kiosk .brand small{display:none}
          .bap-kiosk .identity{grid-column:2;grid-row:2;justify-self:start}
          .bap-kiosk .avatar{width:44px;height:44px;font-size:17px}
          .bap-kiosk .identity strong{font-size:19px}
          .bap-kiosk .identity span{font-size:14px}
          .bap-kiosk .balance{grid-column:1;grid-row:2;padding:8px 14px}
          .bap-kiosk .balance span{font-size:13px}
          .bap-kiosk .balance strong{font-size:24px}
          .bap-kiosk .lock{top:149px;left:12px}
          .bap-kiosk .content{width:calc(100% - 24px);margin:16px auto}
          .bap-kiosk .welcome h1{font-size:24px}
          .bap-kiosk .welcome p{font-size:15px}
          .bap-kiosk .grid{grid-template-columns:repeat(2,1fr);gap:12px}
          .bap-kiosk .meal{min-height:250px;border-radius:14px}
          .bap-kiosk .meal-photo{height:130px}
          .bap-kiosk .meal-body{padding:12px}
          .bap-kiosk .meal-body strong{font-size:18px}
          .bap-kiosk .meal-price{font-size:19px}
          .bap-kiosk .plus{width:40px;height:40px}
          .bap-kiosk .summary{min-height:172px;grid-template-columns:1fr auto;gap:10px 14px;padding:12px 16px}
          .bap-kiosk .summary-title{font-size:18px}
          .bap-kiosk .summary-items{font-size:15px}
          .bap-kiosk .summary-total span{font-size:16px}
          .bap-kiosk .summary-total strong{font-size:32px}
          .bap-kiosk .pay{grid-column:1/-1;width:100%;font-size:20px}
          .bap-kiosk .edit{height:48px;font-size:16px}
          .bap-kiosk .cart-drawer{bottom:172px;padding:16px}
          .bap-kiosk .cart-drawer h3{font-size:19px}
          .bap-kiosk .cart-row .name{font-size:17px}
        }
      `}</style>

      {/* כותרת עליונה */}
      <header className="kiosk-head">
        <div className="identity">
          {student && (
            <>
              <div className="avatar">{initials}</div>
              <div>
                <strong>שלום, {student.first_name}</strong>
                <span>אפשר לבחור את הארוחה שלך</span>
              </div>
            </>
          )}
        </div>
        <div className="brand">
          <img className="kiosk-logo" src="/images/Bonapp-logo.png" alt="BonApp" />
          <small>קיוסק ארוחות עצמאי</small>
        </div>
        <div className="balance">
          {student && (
            <>
              <span>היתרה שלך</span>
              <strong>₪{student.balance.toFixed(2)}</strong>
            </>
          )}
        </div>
      </header>

      {/* נעילת יציאה */}
      <button className="lock" aria-label="נעילת הקיוסק" onClick={() => setShowExitPrompt(true)}>
        <Lock size={20} />
      </button>

      {loading ? (
        <div className="center-screen">
          <p style={{ fontSize: 20, color: 'var(--muted)' }}>טוען...</p>
        </div>
      ) : !student ? (
        // מסך זיהוי
        <div className="center-screen">
          <h1 className="id-title">🍽️ ברוכים הבאים לקיוסק</h1>

          <div className="mode-tabs">
            <button
              className={`mode-tab ${identifyMode === 'scan' ? 'active' : ''}`}
              onClick={() => { setIdentifyMode('scan'); setIsScanning(true); setIdentifyError(''); }}
            >
              📷 סריקת QR
            </button>
            <button
              className={`mode-tab ${identifyMode === 'pin' ? 'active' : ''}`}
              onClick={() => { setIdentifyMode('pin'); setPinInput(''); setIdentifyError(''); }}
            >
              🔢 קוד אישי (PIN)
            </button>
          </div>

          {identifyMode === 'scan' ? (
            <div className="qr-box">
              <div id="kiosk-qr-reader" />
            </div>
          ) : (
            <div>
              <div className="pin-display">{pinInput.padEnd(4, '•')}</div>
              <div className="pin-pad">
                {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map(d => (
                  <button key={d} className="pin-key" onClick={() => handlePinDigit(d)}>{d}</button>
                ))}
                <button className="pin-key muted" onClick={() => setPinInput('')}>נקה</button>
                <button className="pin-key" onClick={() => handlePinDigit('0')}>0</button>
                <button className="pin-key muted" aria-label="מחק ספרה" onClick={() => setPinInput(pinInput.slice(0, -1))}>
                  <Delete size={20} style={{ margin: '0 auto' }} />
                </button>
              </div>
            </div>
          )}

          {identifyError && (
            <p className="id-error" role="alert">{identifyError}</p>
          )}
        </div>
      ) : successInfo ? (
        // מסך הצלחה
        <div className="success-screen" role="status">
          <div className="success-icon"><CheckCircle size={52} /></div>
          <h2>הרכישה בוצעה בהצלחה!</h2>
          <p>שולם: ₪{successInfo.total.toFixed(2)}</p>
          <p>יתרה חדשה: ₪{successInfo.newBalance.toFixed(2)}</p>
        </div>
      ) : (
        // מסך קניה
        <main className="content">
          <div className="welcome">
            <div>
              <h1>מה תרצה לאכול היום?</h1>
              <p>בחר מנה אחת או יותר והמשך לתשלום</p>
            </div>
            {categories.length > 0 && (
              <nav className="categories" aria-label="קטגוריות">
                {categories.map(cat => (
                  <button
                    key={cat}
                    className={`cat ${selectedCategory === cat ? 'active' : ''}`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </nav>
            )}
          </div>

          {itemsInCategory.length === 0 ? (
            <div className="empty-note">אין מנות זמינות כרגע</div>
          ) : (
            <section className="grid">
              {itemsInCategory.map(item => {
                const cartLinesForItem = cart.filter(c => c.id === item.id);
                const totalQtyInCart = cartLinesForItem.reduce((sum, c) => sum + c.quantity, 0);
                const hasAddons = item.addons && item.addons.length > 0;
                return (
                  <button
                    key={item.id}
                    className={`meal ${totalQtyInCart > 0 ? 'selected' : ''}`}
                    onClick={() => handleProductTap(item)}
                    aria-label={`${hasAddons ? 'בחר תוספות עבור' : 'הוסף'} ${item.name}, ₪${item.price.toFixed(2)}${totalQtyInCart ? `, כבר נבחרו ${totalQtyInCart}` : ''}`}
                  >
                    {totalQtyInCart > 0 && <span className="qty">{totalQtyInCart}</span>}
                    <div className="meal-photo">
                      {item.image_url ? (
                        <img src={item.image_url} alt="" />
                      ) : (
                        <UtensilsCrossed size={44} />
                      )}
                    </div>
                    <div className="meal-body">
                      <strong>{item.name}</strong>
                      {(item.description || item.category) && <small>{item.description || item.category}</small>}
                      <div className="meal-bottom">
                        <span className="meal-price">₪{item.price.toFixed(2)}</span>
                        <i className="plus">+</i>
                      </div>
                    </div>
                  </button>
                );
              })}
            </section>
          )}
        </main>
      )}

      {/* מגירת עגלה (תצוגה בלבד - אותה לוגיקת עגלה בדיוק) */}
      {cartOpen && student && !successInfo && cart.length > 0 && (
        <div className="cart-drawer">
          <h3><ShoppingCart size={18} /> העגלה שלי</h3>
          {cart.map(c => (
            <div key={c.lineKey} className="cart-row">
              <div>
                <div className="name">{c.name}</div>
                {c.addonNames && c.addonNames.length > 0 && (
                  <div className="unit">+ {c.addonNames.join(', ')}</div>
                )}
                <div className="unit">₪{(c.price + (c.addonsPrice || 0)).toFixed(2)} ליחידה</div>
              </div>
              <div className="cart-qty">
                <button className="qty-btn" onClick={() => removeFromCart(c.lineKey)} aria-label={`הפחת כמות של ${c.name}`}>
                  <Minus size={16} />
                </button>
                <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 700, fontSize: 18 }}>{c.quantity}</span>
                <button className="qty-btn" onClick={() => incrementCartLine(c.lineKey)} aria-label={`הוסף כמות של ${c.name}`}>
                  <Plus size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* סרגל סיכום קבוע */}
      {student && !successInfo && (
        <footer className="summary">
          <div>
            <div className="summary-title">סיכום ההזמנה</div>
            <div className="summary-items" aria-live="polite">
              {cart.length === 0
                ? 'העגלה ריקה'
                : `${cart.map(c => `${c.name} × ${c.quantity}`).join(' · ')} · ${cartCount === 1 ? 'פריט אחד' : `${cartCount} פריטים`}`}
            </div>
            {purchaseError && <div className="summary-error" role="alert">{purchaseError}</div>}
          </div>

          <button className="edit" onClick={() => setCartOpen(o => !o)} disabled={cart.length === 0}>
            <ShoppingCart size={18} />
            {cartOpen ? 'הסתר עגלה' : 'צפייה בעגלה'}
          </button>

          <div className="summary-total">
            <span>סה״כ</span>
            <strong>₪{cartTotal.toFixed(2)}</strong>
          </div>

          {exceedsBalance ? (
            <button className="pay warn" onClick={handlePayForBalance}>
              <CreditCard size={22} />
              תשלום להשלמת יתרה
            </button>
          ) : (
            <button className="pay" onClick={handleCheckout} disabled={cart.length === 0 || processing}>
              <CheckCircle size={22} />
              {processing ? 'מעבד...' : 'המשך לתשלום'}
            </button>
          )}
        </footer>
      )}

      {/* בקשת סיסמת יציאה */}
      {/* מסך בחירת תוספות - נפתח כשלוחצים על מוצר עם תוספות מוגדרות, לפני הכניסה לעגלה */}
      {addonItem && (
        <div className="modal-overlay">
          <div className="addon-modal">
            <div className="addon-modal-head">
              <h3>תוספות ל{addonItem.name}</h3>
              <button className="addon-close" onClick={() => setAddonItem(null)} aria-label="סגירה">
                <X size={22} />
              </button>
            </div>
            <p className="addon-hint">אפשר לבחור כמה שרוצים</p>
            <div className="addon-grid">
              {addonItem.addons.map(addon => {
                const checked = selectedAddonIds.includes(addon.id);
                return (
                  <button
                    key={addon.id}
                    type="button"
                    className={`addon-tile ${checked ? 'checked' : ''}`}
                    onClick={() => toggleAddonId(addon.id)}
                  >
                    <div className="addon-check">{checked && <Check size={16} />}</div>
                    <div className="addon-photo">
                      {addon.image_url ? <img src={addon.image_url} alt="" /> : <UtensilsCrossed size={28} />}
                    </div>
                    <div className="addon-name">{addon.name}</div>
                    {parseFloat(addon.price_delta) > 0 && (
                      <div className="addon-price">+₪{parseFloat(addon.price_delta).toFixed(2)}</div>
                    )}
                  </button>
                );
              })}
            </div>
            <button className="btn-primary addon-confirm" onClick={confirmAddonSelection}>
              הוסף לעגלה
            </button>
          </div>
        </div>
      )}

      {showExitPrompt && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-icon"><Lock size={26} /></div>
            <h3>סיסמת מנהל מטבח ליציאה</h3>
            <input
              type="password"
              value={exitPassword}
              onChange={(e) => setExitPassword(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleExitSubmit()}
              autoFocus
            />
            {exitError && <p className="modal-error" role="alert">{exitError}</p>}
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => { setShowExitPrompt(false); setExitPassword(''); setExitError(''); }}>ביטול</button>
              <button className="btn-primary" onClick={handleExitSubmit}>אישור</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SelfServiceKiosk;
