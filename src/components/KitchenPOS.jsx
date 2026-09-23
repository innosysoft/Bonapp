import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchStudents, getMenuItems, processMealPurchase, processDirectSale, getSchools, scanStudent } from '../api';
import { authFetch } from '../auth';
import { QrCode, Search, ShoppingCart, DollarSign, X, Plus, Minus, Settings, ChefHat, AlertCircle, UserPlus, Wallet, Banknote, CreditCard, Smartphone, ArrowRight } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';

// עיצוב לפי דגם bonapp-kitchen-dashboard-design.html שאושר (אותה שפת עיצוב כמו KitchenQRScanner.jsx).
// כל הלוגיקה העסקית (סריקה, חיפוש, עגלה, חיוב, אזהרת מינוס) נשמרה כפי שהייתה - רק שכבת התצוגה הוחלפה.
const getBalanceColorVar = (balance) => (balance > 50 ? 'var(--green)' : balance > 20 ? 'var(--warn)' : 'var(--danger)');

const KitchenPOS = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [schoolName, setSchoolName] = useState('');
  const [menuType, setMenuType] = useState('items');

  // תלמיד
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [searchMode, setSearchMode] = useState('scan'); // 'scan' או 'search'
const [isScanning, setIsScanning] = useState(false);
const [scannerReady, setScannerReady] = useState(false);
const [isMobile, setIsMobile] = useState(window.innerWidth < 900);

useEffect(() => {
  const handleResize = () => setIsMobile(window.innerWidth < 900);
  window.addEventListener('resize', handleResize);
  return () => window.removeEventListener('resize', handleResize);
}, []);


  // תפריט ועגלה
  const [menuItems, setMenuItems] = useState([]);
  const [dailyMenuData, setDailyMenuData] = useState([]);
  const [cart, setCart] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
const [warningData, setWarningData] = useState(null);
const [studentPaymentType, setStudentPaymentType] = useState('daily');
const [schoolSettings, setSchoolSettings] = useState({
  monthly_meal_price: 0,
  daily_meal_price: 0,
  auto_print_receipt: false
});
const [printOrder, setPrintOrder] = useState(null);

// "לקוח מזדמן" - בחירת מנות בלי הזדהות מראש. הזדהות (אם בכלל) קורית רק בשלב
// התשלום, ורק אם בוחרים לשלם מיתרה. לא נוגע בכלל בזרימת הזיהוי הרגילה למעלה.
const [walkinMode, setWalkinMode] = useState(false);
const [showPaymentChoice, setShowPaymentChoice] = useState(false);
const [identifyForBalance, setIdentifyForBalance] = useState(false);
const [balanceSearchTerm, setBalanceSearchTerm] = useState('');
const [balanceSearchResults, setBalanceSearchResults] = useState([]);
const [directSaleMethod, setDirectSaleMethod] = useState(null); // 'cash' | 'credit' | 'bit'
const [guestName, setGuestName] = useState('');
const [guestPhone, setGuestPhone] = useState('');
const [directSaleProcessing, setDirectSaleProcessing] = useState(false);
const [directSaleResult, setDirectSaleResult] = useState(null);

useEffect(() => {
  if (selectedStudent) {
    authFetch(`https://api.bonapp.dev/api/students/${selectedStudent.id}/last-payment-type`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          setStudentPaymentType(data.payment_type || 'daily');
        }
      })
      .catch(() => setStudentPaymentType('daily'));
  } else {
    setStudentPaymentType('daily');
  }
}, [selectedStudent]);

const getMealPrice = () => {
  return studentPaymentType === 'monthly'
    ? schoolSettings?.monthly_meal_price || 0
    : schoolSettings?.daily_meal_price || 0;
};

const onScanSuccess = async (decodedText) => {
  console.log('QR Code scanned:', decodedText);
  setIsScanning(false);
  setScannerReady(false);

  try {
    const response = await authFetch('https://api.bonapp.dev/api/scan-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCode: decodedText })
    });

    const result = await response.json();

    if (result.success) {
      setSelectedStudent(result.student);
      setCart([]);
      setShowConfirm(true);
    } else {
      alert('QR לא תקין או תלמיד לא נמצא');
    }
  } catch (error) {
    console.error('Scan error:', error);
    alert('שגיאה בזיהוי תלמיד');
  }
};

const onScanError = (error) => {
  // התעלם משגיאות סריקה רגילות
};


const scannerInstanceRef = useRef(null);
const scannerClearingRef = useRef(Promise.resolve());

useEffect(() => {
  if (isScanning && !scannerReady) {
    let cancelled = false;

    // scanner.clear() is async and releases the camera; if a new scanner is created into
    // the same DOM node before the previous clear() finishes, the camera can fail to
    // restart. Wait for any pending clear() before rendering the next scanner.
    scannerClearingRef.current.then(() => {
      if (cancelled) return;
      const scanner = new Html5QrcodeScanner(
        "qr-reader",
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
      scanner.render(onScanSuccess, onScanError);
      setScannerReady(true);
    });

    return () => {
      cancelled = true;
      const instance = scannerInstanceRef.current;
      scannerInstanceRef.current = null;
      if (instance) {
        scannerClearingRef.current = instance.clear().catch(error => {
          console.error("Failed to clear scanner:", error);
        });
      }
    };
  }
}, [isScanning]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
          navigate('/login');
          return;
        }
        setCurrentUser(user);

        const schoolsData = await getSchools();
        if (schoolsData.success) {
          const school = schoolsData.schools.find(s => s.id === user.school_id);
          if (school) {
            setSchoolName(school.name);
            setMenuType(school.menu_type || 'items');
            setSchoolSettings({
  monthly_meal_price: school.monthly_meal_price || 0,
  daily_meal_price: school.daily_meal_price || 0,
  auto_print_receipt: school.auto_print_receipt || false
});

            if (school.menu_type === 'daily') {
              const dailyResponse = await authFetch(`https://api.bonapp.dev/api/daily-menu/${school.id}`);
              const dailyData = await dailyResponse.json();
              if (dailyData.success) {
                setDailyMenuData(dailyData.dailyMenu);
              }
            }
          }
        }

        const result = await getMenuItems(user.school_id);
        if (result.success) {
          setMenuItems(result.menuItems);
        }
      } catch (error) {
        console.error('Error loading data:', error);
      }
    };

    loadData();
  }, [navigate]);

  const handleSearch = async (term) => {
    setSearchTerm(term);

    if (term.length < 2) {
      setSearchResults([]);
      return;
    }

    try {
      const result = await searchStudents(currentUser.school_id, term);
      if (result.success) {
        setSearchResults(result.students);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const selectStudent = (student) => {
    setSelectedStudent(student);
    setShowConfirm(true);
    setSearchTerm('');
    setSearchResults([]);
  };

  const confirmStudent = () => {
    setShowConfirm(false);
  };

  const cancelStudent = () => {
    setSelectedStudent(null);
    setShowConfirm(false);
    setCart([]);
  };

  const handleQRScan = async (qrCode) => {
  try {
    setIsScanning(false);
    const result = await scanStudent(qrCode);

    if (result.success) {
      selectStudent(result.student);
    } else {
      alert('QR לא תקין או תלמיד לא נמצא');
    }
  } catch (error) {
    alert('שגיאה בסריקת QR');
  }
};

const startScanning = () => {
  setIsScanning(true);
};

const stopScanning = () => {
  setIsScanning(false);
};

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(cartItem => cartItem.id === item.id);
      if (existing) {
        return prev.map(cartItem =>
          cartItem.id === item.id
            ? { ...cartItem, quantity: cartItem.quantity + 1 }
            : cartItem
        );
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      setCart(prev => prev.filter(item => item.id !== itemId));
      return;
    }
    setCart(prev => prev.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  const processPayment = async (forceOverride = false, studentOverride = null) => {
  const student = studentOverride || selectedStudent;
  if (!student || cart.length === 0) {
    alert('אין פריטים בעגלה');
    return;
  }

  const total = calculateTotal();

  try {
    const result = await processMealPurchase(student.id, cart, total, forceOverride);

    if (result.requireConfirmation) {
      // הצג אזהרת מינוס
      setWarningData({
        message: result.message,
        newBalance: result.newBalance
      });
      setShowWarning(true);
      return;
    }

    if (result.success) {
  alert(`תשלום בוצע בהצלחה!\nסה"כ: ₪${total.toFixed(2)}\nיתרה חדשה: ₪${result.newBalance.toFixed(2)}`);

  if (schoolSettings.auto_print_receipt) {
    setPrintOrder({
      orderNumber: result.orderNumber,
      studentName: `${student.first_name} ${student.last_name}`,
      items: [...cart],
      createdAt: new Date().toISOString()
    });
    setTimeout(() => {
      window.print();
      setPrintOrder(null);
    }, 50);
  }

  // איפוס
  resetToIdentify();

    } else {
      alert(result.message || 'שגיאה בעיבוד התשלום');
    }
  } catch (error) {
    alert('שגיאה בעיבוד התשלום');
  }
};

  // מאפס הכל בחזרה למסך הזיהוי הראשוני (אחרי מכירה מוצלחת מכל סוג - רגילה, לקוח
  // מזדמן ששילם מיתרה, או מכירה ישירה) - באותו מצב (סריקה/חיפוש) שהיה פעיל.
  const resetToIdentify = () => {
    setSelectedStudent(null);
    setShowConfirm(false);
    setCart([]);
    setSearchTerm('');
    setSearchResults([]);
    setWalkinMode(false);
    setShowPaymentChoice(false);
    setIdentifyForBalance(false);
    setBalanceSearchTerm('');
    setBalanceSearchResults([]);
    setDirectSaleMethod(null);
    setGuestName('');
    setGuestPhone('');
    setDirectSaleResult(null);
    if (searchMode === 'scan') {
      setIsScanning(true);
    }
  };

  const handleStartWalkin = () => {
    setWalkinMode(true);
    setCart([]);
  };

  const handleBalanceSearch = async (term) => {
    setBalanceSearchTerm(term);
    if (term.length < 2) {
      setBalanceSearchResults([]);
      return;
    }
    try {
      const result = await searchStudents(currentUser.school_id, term);
      if (result.success) setBalanceSearchResults(result.students);
    } catch (error) {
      console.error('Balance identify search error:', error);
    }
  };

  const handleIdentifyForBalance = async (student) => {
    setSelectedStudent(student);
    setWalkinMode(false);
    setShowPaymentChoice(false);
    setIdentifyForBalance(false);
    await processPayment(false, student);
  };

  const handleDirectSale = async (method) => {
    setDirectSaleProcessing(true);
    try {
      const result = await processDirectSale(cart, method, guestName || null, guestPhone || null);
      if (result.success) {
        setDirectSaleResult({ orderNumber: result.orderNumber, chargeAmount: result.chargeAmount });
        if (schoolSettings.auto_print_receipt) {
          setPrintOrder({
            orderNumber: result.orderNumber,
            studentName: guestName || 'לקוח מזדמן',
            items: [...cart],
            createdAt: new Date().toISOString()
          });
          setTimeout(() => {
            window.print();
            setPrintOrder(null);
          }, 50);
        }
      } else {
        alert(result.message || 'שגיאה בעיבוד המכירה');
      }
    } catch (error) {
      alert('שגיאה בעיבוד המכירה');
    } finally {
      setDirectSaleProcessing(false);
    }
  };

  return (
    <div className="bap-pos">
      <style>{`
        .bap-pos{
          --navy:#17324a;--blue:#356b8c;--green:#75a843;--green2:#eef6e9;--paper:#f4f7f7;
          --white:#fff;--muted:#607482;--line:#dce6e9;--danger:#b64e4e;--warn:#b9812e;
          --shadow:0 8px 25px rgba(23,50,74,.08);
          font-family:'Heebo',Arial,sans-serif;color:var(--navy);background:var(--paper);
          font-size:15px;min-height:100vh;
        }
        .bap-pos *{box-sizing:border-box}
        .bap-pos button{font:inherit}
        .bap-pos button:focus-visible{outline:3px solid var(--green);outline-offset:2px}
        .bap-pos input:focus-visible{outline:3px solid var(--green);outline-offset:2px}

        .bap-pos .top{min-height:76px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;flex-wrap:wrap;padding:12px 32px;gap:16px}
        .bap-pos .brand{display:flex;align-items:center;gap:13px;margin-left:auto}
        .bap-pos .brand-icon{width:46px;height:46px;border-radius:12px;background:var(--blue);color:#fff;display:grid;place-items:center;flex-shrink:0}
        .bap-pos .brand h1{font-size:19px;margin:0;color:var(--navy)}
        .bap-pos .brand .sub{color:var(--muted);font-size:13px}
        .bap-pos .top-actions{display:flex;gap:9px;flex-wrap:wrap}
        .bap-pos .action{height:42px;border:1px solid var(--line);background:#fff;color:var(--navy);border-radius:10px;padding:0 14px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px;white-space:nowrap}
        .bap-pos .action:hover{background:var(--paper)}

        .bap-pos .main{padding:26px;max-width:1400px;margin:0 auto}
        .bap-pos .center-wrap{display:flex;justify-content:center;align-items:center;min-height:calc(100vh - 220px)}

        .bap-pos .card{background:#fff;border:1px solid var(--line);border-radius:20px;padding:36px;max-width:600px;width:100%;box-shadow:var(--shadow)}
        .bap-pos .card.narrow{max-width:480px;text-align:center}
        .bap-pos .card-head{text-align:center;margin-bottom:26px}
        .bap-pos .card-icon{width:70px;height:70px;border-radius:50%;background:var(--green2);color:var(--green);display:grid;place-items:center;margin:0 auto 14px}
        .bap-pos .card-head h2{font-size:24px;margin:0 0 6px;color:var(--navy)}
        .bap-pos .card-head p{margin:0;color:var(--muted)}

        .bap-pos .mode-tabs{display:flex;gap:8px;background:var(--paper);padding:6px;border-radius:12px;margin-bottom:22px}
        .bap-pos .mode-tab{flex:1;padding:12px;border-radius:9px;border:0;background:transparent;color:var(--muted);font-weight:700;font-size:15px;cursor:pointer}
        .bap-pos .mode-tab.active{background:#fff;color:var(--blue);box-shadow:var(--shadow)}

        .bap-pos .scan-cta{width:100%;padding:44px 22px;border-radius:14px;border:3px dashed var(--blue);background:rgba(53,107,140,.06);color:var(--blue);font-size:17px;font-weight:700;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:12px}
        .bap-pos .scan-box{background:#fff;border:1px solid var(--line);border-radius:14px;padding:22px;margin-bottom:14px;text-align:center}
        .bap-pos .scan-box h3{margin:0 0 14px;color:var(--navy);font-size:16px;font-weight:600}
        .bap-pos .cancel-scan{width:100%;padding:14px;border-radius:12px;border:1px solid var(--line);background:#fff;color:var(--navy);font-weight:700;cursor:pointer}

        .bap-pos .search-input-wrap{position:relative;margin-bottom:20px}
        .bap-pos .search-input-wrap svg{position:absolute;right:14px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none}
        .bap-pos .search-input-wrap input{width:100%;padding:14px 44px 14px 14px;border:2px solid var(--line);border-radius:12px;font-size:16px}
        .bap-pos .search-input-wrap input:focus{border-color:var(--blue)}

        .bap-pos .results{background:#fff;border:2px solid var(--blue);border-radius:12px;max-height:400px;overflow-y:auto}
        .bap-pos .result-row{padding:14px 16px;border-bottom:1px solid var(--line);cursor:pointer;display:flex;align-items:center;gap:14px;text-align:right;width:100%;background:none;border-inline:0;border-top:0}
        .bap-pos .result-row:last-child{border-bottom:0}
        .bap-pos .result-row:hover{background:var(--paper)}
        .bap-pos .avatar{width:54px;height:54px;border-radius:50%;object-fit:cover;border:3px solid var(--green);flex-shrink:0}
        .bap-pos .result-row strong{display:block;font-size:16px;color:var(--navy)}
        .bap-pos .result-row .meta{font-size:13px;color:var(--muted);margin-top:2px}
        .bap-pos .result-row .bal{font-size:13px;font-weight:700;margin-top:2px}
        .bap-pos .no-results{text-align:center;padding:26px;color:var(--muted)}

        .bap-pos .confirm-photo{width:170px;height:170px;border-radius:50%;object-fit:cover;border:5px solid var(--green);margin:0 auto 22px;display:block;box-shadow:var(--shadow)}
        .bap-pos .confirm-info{background:var(--paper);border-radius:12px;padding:20px;margin-bottom:24px}
        .bap-pos .confirm-info h3{margin:0 0 10px;font-size:21px;color:var(--navy)}
        .bap-pos .confirm-info .meta{color:var(--muted);margin-bottom:4px;font-size:15px}
        .bap-pos .confirm-balance{font-size:26px;font-weight:800;margin-top:10px}
        .bap-pos .confirm-actions{display:flex;gap:12px;justify-content:center}
        .bap-pos .btn-secondary{flex:1;padding:14px;border-radius:12px;border:2px solid var(--line);background:#fff;color:var(--navy);font-weight:700;cursor:pointer;font-size:15px;display:flex;align-items:center;justify-content:center;gap:8px}
        .bap-pos .btn-primary{flex:1;padding:14px;border-radius:12px;border:0;background:var(--green);color:#fff;font-weight:700;cursor:pointer;font-size:15px}

        .bap-pos .modal-overlay{position:fixed;inset:0;background:rgba(23,50,74,.55);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px}
        .bap-pos .modal-card{background:#fff;border-radius:18px;padding:30px;max-width:480px;width:100%;box-shadow:0 20px 60px rgba(0,0,0,.25)}
        .bap-pos .modal-icon{width:56px;height:56px;border-radius:50%;background:#fbeee0;color:var(--warn);display:grid;place-items:center;margin:0 auto 14px}
        .bap-pos .modal-card h3{text-align:center;color:var(--warn);margin:0 0 16px;font-size:19px}
        .bap-pos .modal-message{background:#fbeee0;border-radius:12px;padding:16px;margin-bottom:20px;white-space:pre-line;text-align:center;line-height:1.6}
        .bap-pos .modal-actions{display:flex;gap:12px}
        .bap-pos .btn-warn{flex:1;padding:14px;border-radius:12px;border:0;background:var(--warn);color:#fff;font-weight:700;cursor:pointer;font-size:15px}

        .bap-pos .sales-grid{display:grid;gap:20px;max-width:1400px;margin:0 auto}
        .bap-pos .side-panel{background:#fff;border:1px solid var(--line);border-radius:16px;padding:24px;box-shadow:var(--shadow);height:fit-content}
        .bap-pos .student-photo{width:104px;height:104px;border-radius:50%;object-fit:cover;border:4px solid var(--green);margin:0 auto 14px;display:block}
        .bap-pos .student-name{text-align:center;font-size:18px;font-weight:700;color:var(--navy);margin:0 0 4px}
        .bap-pos .student-meta{text-align:center;color:var(--muted);font-size:14px;margin-bottom:14px}
        .bap-pos .balance-box{background:var(--paper);border-radius:12px;padding:16px;text-align:center;margin-bottom:14px}
        .bap-pos .balance-box .label{font-size:13px;color:var(--muted);margin-bottom:6px}
        .bap-pos .balance-box .value{font-size:25px;font-weight:800}
        .bap-pos .cancel-btn{width:100%;padding:12px;border-radius:12px;border:2px solid var(--line);background:#fff;color:var(--navy);font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px}

        .bap-pos .menu-panel,.bap-pos .cart-panel{background:#fff;border:1px solid var(--line);border-radius:16px;padding:24px;box-shadow:var(--shadow)}
        .bap-pos .menu-panel h3,.bap-pos .cart-panel h3{font-size:18px;margin:0 0 18px;color:var(--navy);display:flex;align-items:center;gap:8px}
        .bap-pos .menu-list{max-height:600px;overflow-y:auto}
        .bap-pos .daily-item{padding:20px;background:#fff;border:2px solid var(--blue);border-radius:12px;margin-bottom:14px}
        .bap-pos .daily-item .name{font-weight:700;font-size:16px;color:var(--navy);margin-bottom:8px}
        .bap-pos .daily-item .desc{color:var(--muted);margin-bottom:14px;line-height:1.5}
        .bap-pos .daily-item .row{display:flex;justify-content:space-between;align-items:center}
        .bap-pos .empty-note{text-align:center;padding:40px;color:var(--muted)}

        .bap-pos .menu-item-row{display:flex;justify-content:space-between;align-items:center;padding:14px;margin-bottom:10px;border:1px solid var(--line);border-radius:12px;background:#fff}
        .bap-pos .menu-item-row.disabled{background:var(--paper);opacity:.6}
        .bap-pos .menu-item-row .name{font-weight:700;color:var(--navy)}
        .bap-pos .menu-item-row .cat{font-size:13px;color:var(--muted)}
        .bap-pos .price-tag{font-weight:800;color:var(--blue);font-size:16px}
        .bap-pos .add-btn{background:var(--blue);color:#fff;border:0;border-radius:10px;padding:9px 16px;font-weight:700;cursor:pointer;display:flex;align-items:center;gap:6px;font-size:14px}
        .bap-pos .add-btn:disabled{background:#cfd8db;color:#8a9490;cursor:not-allowed}

        .bap-pos .empty-cart{text-align:center;padding:44px 16px;color:var(--muted)}
        .bap-pos .cart-item{display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;padding-bottom:14px;border-bottom:1px solid var(--line)}
        .bap-pos .qty-btn{width:28px;height:28px;border-radius:50%;border:1px solid var(--line);background:#fff;display:grid;place-items:center;cursor:pointer;color:var(--navy)}
        .bap-pos .cart-total-row{display:flex;justify-content:space-between;align-items:center;border-top:2px solid var(--blue);padding-top:16px;margin-top:6px;margin-bottom:18px;font-size:19px;font-weight:800;color:var(--navy)}
        .bap-pos .pay-btn{width:100%;background:var(--green);color:#fff;border:0;padding:18px;border-radius:12px;cursor:pointer;font-size:17px;font-weight:800;display:flex;align-items:center;justify-content:center;gap:10px}
        .bap-pos .pay-btn:hover{filter:brightness(.95)}

        @media(max-width:900px){
          .bap-pos .top{padding:12px 18px}
          .bap-pos .brand{margin-left:0;flex:1}
          .bap-pos .main{padding:16px}
        }
        @media(max-width:560px){
          .bap-pos .brand h1{font-size:16px}
          .bap-pos .action span.label{display:none}
          .bap-pos .action{padding:0 12px}
          .bap-pos .card{padding:22px}
        }

        .bap-pos .walkin-btn{width:100%;padding:14px;border-radius:12px;border:2px dashed var(--line);background:var(--paper);color:var(--navy);font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px;margin-top:6px}
        .bap-pos .walkin-btn:hover{background:#eef2f3;border-color:var(--blue)}
        .bap-pos .walkin-avatar{width:104px;height:104px;border-radius:50%;background:var(--green2);color:var(--green);display:flex;align-items:center;justify-content:center;margin:0 auto 14px}
        .bap-pos .payment-choice-btn{width:100%;padding:18px;border-radius:14px;border:2px solid var(--line);background:#fff;color:var(--navy);cursor:pointer;display:flex;align-items:center;gap:14px;text-align:right;margin-bottom:14px}
        .bap-pos .payment-choice-btn:hover{border-color:var(--blue);background:var(--paper)}
        .bap-pos .payment-choice-btn strong{display:block;font-size:16px}
        .bap-pos .payment-choice-btn span{display:block;font-size:13px;color:var(--muted);margin-top:2px}
        .bap-pos .payment-choice-row{display:flex;gap:10px;margin-bottom:6px}
        .bap-pos .payment-choice-btn.small{flex:1;flex-direction:column;padding:16px 8px;text-align:center;gap:8px;font-weight:700;font-size:14px;margin-bottom:0}

        .bap-pos .print-ticket{display:none}
        @media print {
          .bap-pos > *:not(.print-ticket){display:none !important}
          .bap-pos .print-ticket{display:block !important;width:280px;padding:12px;font-family:monospace}
          .bap-pos .print-ticket h2{text-align:center;font-size:20px;margin:0 0 8px}
          .bap-pos .print-ticket .pt-num{text-align:center;font-size:32px;font-weight:800;margin:8px 0}
          .bap-pos .print-ticket .pt-line{border-top:1px dashed #000;margin:8px 0}
          .bap-pos .print-ticket .pt-item{font-size:15px;margin:4px 0}
        }
      `}</style>

      {/* Header */}
      <header className="top">
        <div className="brand">
          <div className="brand-icon"><QrCode size={22} /></div>
          <div>
            <h1>קופה מהירה</h1>
            <div className="sub">{schoolName || 'בית ספר'}</div>
          </div>
        </div>

        <div className="top-actions">
          <button className="action" onClick={() => navigate('/kitchen-scanner')} title="חזור לניהול">
            <Settings size={18} />
            <span className="label">חזור לניהול</span>
          </button>
          <button className="action" onClick={() => navigate('/menu-management')} title="ניהול תפריט">
            <ChefHat size={18} />
            <span className="label">ניהול תפריט</span>
          </button>
        </div>
      </header>

      <div className="main">
        {!selectedStudent && !walkinMode ? (
          // מסך חיפוש
          <SearchScreen
  searchTerm={searchTerm}
  onSearchChange={handleSearch}
  searchResults={searchResults}
  onSelectStudent={selectStudent}
  searchMode={searchMode}
  onSearchModeChange={setSearchMode}
  isScanning={isScanning}
  onStartScanning={startScanning}
  onStopScanning={stopScanning}
  setIsScanning={setIsScanning}
  setScannerReady={setScannerReady}
  isMobile={isMobile}
  onWalkin={handleStartWalkin}
/>
        ) : showConfirm ? (
          // מסך אישור תלמיד
          <ConfirmScreen
            student={selectedStudent}
            onConfirm={confirmStudent}
            onCancel={cancelStudent}
            isMobile={isMobile}
          />
        ) : showPaymentChoice ? (
          identifyForBalance ? (
            <BalanceIdentifyScreen
              searchTerm={balanceSearchTerm}
              onSearchChange={handleBalanceSearch}
              searchResults={balanceSearchResults}
              onSelectStudent={handleIdentifyForBalance}
              onBack={() => setIdentifyForBalance(false)}
            />
          ) : directSaleResult ? (
            <DirectSaleSuccessScreen result={directSaleResult} onDone={resetToIdentify} />
          ) : directSaleMethod ? (
            <DirectSaleDetailsScreen
              method={directSaleMethod}
              total={calculateTotal()}
              guestName={guestName}
              guestPhone={guestPhone}
              onGuestNameChange={setGuestName}
              onGuestPhoneChange={setGuestPhone}
              onConfirm={() => handleDirectSale(directSaleMethod)}
              onBack={() => setDirectSaleMethod(null)}
              processing={directSaleProcessing}
            />
          ) : (
            <PaymentChoiceScreen
              total={calculateTotal()}
              onPayFromBalance={() => setIdentifyForBalance(true)}
              onDirectPayment={(method) => setDirectSaleMethod(method)}
              onBack={() => setShowPaymentChoice(false)}
            />
          )
        ) : (
          // מסך מכירה
          <SalesScreen
            student={selectedStudent}
            walkinMode={walkinMode}
            menuType={menuType}
            menuItems={menuItems}
            dailyMenuData={dailyMenuData}
            cart={cart}
            onAddToCart={addToCart}
            onUpdateQuantity={updateQuantity}
            onCalculateTotal={calculateTotal}
            onProcessPayment={() => walkinMode ? setShowPaymentChoice(true) : processPayment()}
            onCancel={walkinMode ? resetToIdentify : cancelStudent}
            isMobile={isMobile}
            getMealPrice={getMealPrice}
          />
        )}
      </div>

      {/* מודל אזהרה */}
      {showWarning && warningData && (
        <WarningModal
          warningData={warningData}
          onConfirm={() => {
            setShowWarning(false);
            processPayment(true);
          }}
          onCancel={() => {
            setShowWarning(false);
            setWarningData(null);
          }}
        />
      )}

      {printOrder && (
        <div className="print-ticket">
          <h2>BonApp</h2>
          {printOrder.orderNumber && <div className="pt-num">#{printOrder.orderNumber}</div>}
          <div className="pt-line" />
          <div className="pt-item">{printOrder.studentName}</div>
          <div className="pt-line" />
          {(printOrder.items || []).map((item, idx) => (
            <div key={idx} className="pt-item">{item.quantity}x {item.name}</div>
          ))}
          <div className="pt-line" />
          <div className="pt-item">{new Date(printOrder.createdAt).toLocaleString('he-IL')}</div>
        </div>
      )}

    </div>
  );
};

const SearchScreen = ({ searchTerm, onSearchChange, searchResults, onSelectStudent, searchMode, onSearchModeChange, isScanning, onStartScanning, onStopScanning, setIsScanning, setScannerReady, isMobile, onWalkin }) => (
  <div className="center-wrap">
    <div className="card">
      <div className="card-head">
        <div className="card-icon"><QrCode size={34} /></div>
        <h2>זיהוי תלמיד</h2>
        <p>בחר אפשרות זיהוי</p>
      </div>

      {/* טאבים */}
      <div className="mode-tabs">
        <button
          className={`mode-tab ${searchMode === 'scan' ? 'active' : ''}`}
          onClick={() => onSearchModeChange('scan')}
        >
          📷 סריקת QR
        </button>

        <button
          className={`mode-tab ${searchMode === 'search' ? 'active' : ''}`}
          onClick={() => onSearchModeChange('search')}
        >
          🔍 חיפוש
        </button>
      </div>

      <button className="walkin-btn" onClick={onWalkin}>
        <UserPlus size={20} />
        לקוח מזדמן - בחירת מנות בלי הזדהות
      </button>

      {searchMode === 'scan' ? (
        // מצב סריקה
        <div>
          {!isScanning ? (
            <button className="scan-cta" onClick={() => { setIsScanning(true); }}>
              <QrCode size={56} />
              לחץ לסריקת QR
            </button>
          ) : (
            <div>
              <div className="scan-box">
                <h3>📷 מכוון את המצלמה לכיוון ה-QR Code</h3>
                <div id="qr-reader" style={{ width: '100%' }} />
              </div>
              <button
                className="cancel-scan"
                onClick={() => {
                  setIsScanning(false);
                  setScannerReady(false);
                }}
              >
                ביטול
              </button>
            </div>
          )}
        </div>
      ) : (
        // מצב חיפוש
        <>
          <div className="search-input-wrap">
            <Search size={20} />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="הקלד לפחות 2 תווים..."
              autoFocus
            />
          </div>

          {searchResults.length > 0 && (
            <div className="results">
              {searchResults.map(student => (
                <button
                  key={student.id}
                  className="result-row"
                  onClick={() => onSelectStudent(student)}
                >
                  <img
                    className="avatar"
                    src={student.photo_url || `https://via.placeholder.com/60/75A843/FFFFFF?text=${student.first_name?.[0] || 'X'}`}
                    alt={student.first_name}
                  />
                  <div style={{ flex: 1 }}>
                    <strong>{student.first_name} {student.last_name}</strong>
                    <div className="meta">כיתה {student.grade} • {student.student_phone}</div>
                    <div className="bal" style={{ color: getBalanceColorVar(student.balance) }}>
                      יתרה: ₪{student.balance.toFixed(2)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {searchTerm.length >= 2 && searchResults.length === 0 && (
            <div className="no-results">לא נמצאו תוצאות</div>
          )}
        </>
      )}
    </div>
  </div>
);

const ConfirmScreen = ({ student, onConfirm, onCancel, isMobile }) => (
  <div className="center-wrap">
    <div className="card narrow">
      <div className="card-head" style={{ marginBottom: '20px' }}>
        <h2>אישור תלמיד</h2>
      </div>

      <img
        className="confirm-photo"
        src={student.photo_url || `https://via.placeholder.com/200/75A843/FFFFFF?text=${student.first_name?.[0] || 'X'}`}
        alt={student.first_name}
      />

      <div className="confirm-info">
        <h3>{student.first_name} {student.last_name}</h3>
        <div className="meta">כיתה {student.grade}</div>
        <div className="meta">{student.student_phone}</div>
        <div className="confirm-balance" style={{ color: getBalanceColorVar(student.balance) }}>
          יתרה: ₪{student.balance.toFixed(2)}
        </div>
      </div>

      <div className="confirm-actions">
        <button className="btn-secondary" onClick={onCancel}>ביטול</button>
        <button className="btn-primary" onClick={onConfirm}>✓ אישור</button>
      </div>
    </div>
  </div>
);

const WarningModal = ({ warningData, onConfirm, onCancel }) => (
  <div className="modal-overlay">
    <div className="modal-card">
      <div className="modal-icon"><AlertCircle size={28} /></div>
      <h3>אזהרת מינוס</h3>
      <div className="modal-message">{warningData?.message}</div>
      <div className="modal-actions">
        <button className="btn-secondary" onClick={onCancel}>ביטול</button>
        <button className="btn-warn" onClick={onConfirm}>אשר בכל זאת</button>
      </div>
    </div>
  </div>
);


const SalesScreen = ({ student, walkinMode, menuType, menuItems, dailyMenuData, cart, onAddToCart, onUpdateQuantity, onCalculateTotal, onProcessPayment, onCancel, getMealPrice, isMobile }) => {
  const today = new Date().getDay();
  const todayMenu = dailyMenuData.find(d => d.day_of_week === today);

  return (
    <div className="sales-grid" style={{ gridTemplateColumns: isMobile ? '1fr' : '280px 1fr 360px' }}>
      {/* עמודה - פרטי תלמיד (או "לקוח מזדמן" אם אין הזדהות) */}
      <div className="side-panel" style={{ position: isMobile ? 'static' : 'sticky', top: '20px' }}>
        {walkinMode ? (
          <>
            <div className="walkin-avatar"><UserPlus size={40} /></div>
            <h3 className="student-name">לקוח מזדמן</h3>
            <div className="student-meta">אמצעי התשלום ייבחר בסוף</div>
          </>
        ) : (
          <>
            <img
              className="student-photo"
              src={student.photo_url || `https://via.placeholder.com/120/75A843/FFFFFF?text=${student.first_name?.[0] || 'X'}`}
              alt={student.first_name}
            />
            <h3 className="student-name">{student.first_name} {student.last_name}</h3>
            <div className="student-meta">כיתה {student.grade}</div>

            <div className="balance-box">
              <div className="label">יתרה נוכחית</div>
              <div className="value" style={{ color: getBalanceColorVar(student.balance) }}>
                ₪{student.balance.toFixed(2)}
              </div>
            </div>
          </>
        )}

        <button className="cancel-btn" onClick={onCancel}>
          <X size={18} />
          בטל עסקה
        </button>
      </div>

      {/* עמודה - תפריט */}
      <div className="menu-panel">
        <h3>{menuType === 'daily' ? 'תפריט היום' : 'תפריט'}</h3>

        <div className="menu-list">
          {menuType === 'daily' ? (
            // תפריט יומי
            todayMenu ? (
              <div className="daily-item">
                <div className="name">ארוחת היום</div>
                <div className="desc">{todayMenu.menu_description}</div>
                <div className="row">
                  <span className="price-tag">₪{getMealPrice().toFixed(2)}</span>
                  <button
                    className="add-btn"
                    onClick={() => onAddToCart({
                      id: `daily-${today}`,
                      name: 'ארוחת היום',
                      price: getMealPrice(),
                      category: 'ארוחה',
                      available: todayMenu.active
                    })}
                    disabled={!todayMenu.active}
                  >
                    <Plus size={16} />
                    הוסף
                  </button>
                </div>
              </div>
            ) : (
              <div className="empty-note">לא הוגדר תפריט להיום</div>
            )
          ) : (
            // תפריט פריטים
            menuItems.map(item => (
              <div key={item.id} className={`menu-item-row ${!item.available ? 'disabled' : ''}`}>
                <div>
                  <div className="name">{item.name}</div>
                  <div className="cat">{item.category}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span className="price-tag">₪{item.price.toFixed(2)}</span>
                  <button
                    className="add-btn"
                    onClick={() => onAddToCart(item)}
                    disabled={!item.available}
                  >
                    <Plus size={16} />
                    הוסף
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* עמודה - עגלה */}
      <div className="cart-panel" style={{ position: isMobile ? 'static' : 'sticky', top: '20px', height: 'fit-content' }}>
        <h3><ShoppingCart size={20} /> עגלת קניות</h3>

        {cart.length === 0 ? (
          <div className="empty-cart">העגלה ריקה</div>
        ) : (
          <>
            <div>
              {cart.map(item => (
                <div key={item.id} className="cart-item">
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{item.name}</div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>₪{item.price.toFixed(2)} × {item.quantity}</div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button className="qty-btn" onClick={() => onUpdateQuantity(item.id, item.quantity - 1)} aria-label={`הפחת כמות של ${item.name}`}>
                      <Minus size={14} />
                    </button>
                    <span style={{ minWidth: 24, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                    <button className="qty-btn" onClick={() => onUpdateQuantity(item.id, item.quantity + 1)} aria-label={`הוסף כמות של ${item.name}`}>
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="cart-total-row">
              <span>סה"כ:</span>
              <span>₪{onCalculateTotal().toFixed(2)}</span>
            </div>

            <button className="pay-btn" onClick={() => onProcessPayment()}>
              <DollarSign size={22} />
              {walkinMode ? 'המשך לתשלום' : 'בצע תשלום'}
            </button>
          </>
        )}
      </div>
    </div>
  );
};

// מסך "איך לשלם?" - מוצג רק בנתיב "לקוח מזדמן", אחרי בחירת המנות.
const PaymentChoiceScreen = ({ total, onPayFromBalance, onDirectPayment, onBack }) => (
  <div className="center-wrap">
    <div className="card narrow">
      <div className="card-head">
        <div className="card-icon"><Wallet size={34} /></div>
        <h2>איך לשלם?</h2>
        <p>סה"כ לתשלום: ₪{total.toFixed(2)}</p>
      </div>

      <button className="payment-choice-btn" onClick={onPayFromBalance}>
        <Wallet size={22} />
        <div>
          <strong>שלם מיתרה</strong>
          <span>יש להזדהות (QR / חיפוש)</span>
        </div>
      </button>

      <div className="payment-choice-row">
        <button className="payment-choice-btn small" onClick={() => onDirectPayment('cash')}>
          <Banknote size={20} />
          מזומן
        </button>
        <button className="payment-choice-btn small" onClick={() => onDirectPayment('credit')}>
          <CreditCard size={20} />
          אשראי
        </button>
        <button className="payment-choice-btn small" onClick={() => onDirectPayment('bit')}>
          <Smartphone size={20} />
          ביט
        </button>
      </div>

      <button className="btn-secondary" style={{ marginTop: 16, width: '100%' }} onClick={onBack}>
        <ArrowRight size={18} />
        חזרה לעגלה
      </button>
    </div>
  </div>
);

// זיהוי תלמיד בשלב התשלום (רק כשבוחרים "שלם מיתרה" בנתיב לקוח מזדמן) - חיפוש קצר
// לפי שם/טלפון, בלי המנגנון המלא של סריקת מצלמה (מהיר יותר לצורך הזיהוי הנקודתי הזה).
const BalanceIdentifyScreen = ({ searchTerm, onSearchChange, searchResults, onSelectStudent, onBack }) => (
  <div className="center-wrap">
    <div className="card">
      <div className="card-head">
        <div className="card-icon"><Search size={34} /></div>
        <h2>הזדהות לתשלום מיתרה</h2>
        <p>חפש לפי שם או טלפון</p>
      </div>

      <div className="search-input-wrap">
        <Search size={20} />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="הקלד לפחות 2 תווים..."
          autoFocus
        />
      </div>

      {searchResults.length > 0 && (
        <div className="results">
          {searchResults.map(student => (
            <button key={student.id} className="result-row" onClick={() => onSelectStudent(student)}>
              <img
                className="avatar"
                src={student.photo_url || `https://via.placeholder.com/60/75A843/FFFFFF?text=${student.first_name?.[0] || 'X'}`}
                alt={student.first_name}
              />
              <div style={{ flex: 1 }}>
                <strong>{student.first_name} {student.last_name}</strong>
                <div className="meta">כיתה {student.grade} • {student.student_phone}</div>
                <div className="bal" style={{ color: getBalanceColorVar(student.balance) }}>
                  יתרה: ₪{student.balance.toFixed(2)}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {searchTerm.length >= 2 && searchResults.length === 0 && (
        <div className="no-results">לא נמצאו תוצאות</div>
      )}

      <button className="btn-secondary" style={{ marginTop: 16, width: '100%' }} onClick={onBack}>
        <ArrowRight size={18} />
        חזרה
      </button>
    </div>
  </div>
);

// פרטים אחרונים לפני מכירה ישירה - שם/טלפון אופציונליים (יוצגו בבון), ואישור סופי.
const DirectSaleDetailsScreen = ({ method, total, guestName, guestPhone, onGuestNameChange, onGuestPhoneChange, onConfirm, onBack, processing }) => {
  const methodLabel = { cash: 'מזומן', credit: 'אשראי', bit: 'ביט' }[method];
  const methodIcon = { cash: <Banknote size={34} />, credit: <CreditCard size={34} />, bit: <Smartphone size={34} /> }[method];
  return (
    <div className="center-wrap">
      <div className="card narrow">
        <div className="card-head">
          <div className="card-icon">{methodIcon}</div>
          <h2>תשלום ב{methodLabel}</h2>
          <p>סה"כ: ₪{total.toFixed(2)}</p>
        </div>

        <div style={{ textAlign: 'right', marginBottom: 16 }}>
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>שם (יופיע בבון, אופציונלי)</label>
          <input
            type="text"
            value={guestName}
            onChange={(e) => onGuestNameChange(e.target.value)}
            placeholder="לדוגמה: דני כהן"
            style={{ width: '100%', padding: 12, border: '2px solid var(--line)', borderRadius: 10, fontSize: 15, boxSizing: 'border-box', marginBottom: 12 }}
          />
          <label style={{ display: 'block', marginBottom: 6, fontWeight: 600, fontSize: 14 }}>טלפון (אופציונלי)</label>
          <input
            type="tel"
            value={guestPhone}
            onChange={(e) => onGuestPhoneChange(e.target.value)}
            placeholder="050-1234567"
            style={{ width: '100%', padding: 12, border: '2px solid var(--line)', borderRadius: 10, fontSize: 15, boxSizing: 'border-box' }}
          />
        </div>

        <div className="confirm-actions">
          <button className="btn-secondary" onClick={onBack} disabled={processing}>ביטול</button>
          <button className="btn-primary" onClick={onConfirm} disabled={processing}>
            {processing ? 'מעבד...' : `✓ אשר תשלום ב${methodLabel}`}
          </button>
        </div>
      </div>
    </div>
  );
};

const DirectSaleSuccessScreen = ({ result, onDone }) => (
  <div className="center-wrap">
    <div className="card narrow">
      <div className="card-head">
        <div className="card-icon" style={{ background: 'var(--green2)', color: 'var(--green)' }}>✓</div>
        <h2>המכירה נרשמה בהצלחה!</h2>
        <p>שולם: ₪{(result.chargeAmount || 0).toFixed(2)}</p>
      </div>
      {result.orderNumber && (
        <div style={{ textAlign: 'center', margin: '0 0 20px', fontSize: 32, fontWeight: 800, color: 'var(--blue)' }}>
          #{result.orderNumber}
        </div>
      )}
      <button className="btn-primary" style={{ width: '100%' }} onClick={onDone}>סיום - חזרה למסך הזיהוי</button>
    </div>
  </div>
);

export default KitchenPOS;
