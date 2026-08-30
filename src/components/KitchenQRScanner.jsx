import React, { useState, useEffect, useRef } from 'react';
import { getMenuItems, scanStudent, processMealPurchase, getSchools, searchStudents, getRecentTransactions } from '../api';
import { authFetch } from '../auth';
import { QrCode, ShoppingCart, Clock, CheckCircle, XCircle, Settings, LogOut, ChefHat, Plus, Minus, AlertCircle, MoreVertical, Search } from 'lucide-react';

import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate, useLocation } from 'react-router-dom';

// מסך ראשי למטבח - עיצוב לפי דגם bonapp-kitchen-dashboard-design.html שאושר.
// כל הלוגיקה העסקית (עגלה, חיוב, הגדרות) נשמרה כפי שהייתה - רק שכבת התצוגה הוחלפה.
// זיהוי תלמיד (סריקה/חיפוש לפי שם) מתבצע במסך "קופה מהירה" הנפרד (/kitchen-pos) -
// כפתור הכותרת מנווט לשם, בדיוק כפי שהיה לפני העיצוב מחדש.
const KitchenQRScanner = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [scannedStudent, setScannedStudent] = useState(null);
  const [studentPaymentType, setStudentPaymentType] = useState('daily');

  const [cart, setCart] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);

  const [menuItems, setMenuItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [schoolName, setSchoolName] = useState('');
  const [menuType, setMenuType] = useState('items');
  const [dailyMenuData, setDailyMenuData] = useState([]);
  const [activeTab, setActiveTab] = useState('stats'); // 'stats' (קופה) או 'settings' (הגדרות) - מנגנון קיים, לא שונה

  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isNarrow, setIsNarrow] = useState(window.innerWidth < 560);
  const [showMoreActions, setShowMoreActions] = useState(false);

  // הודעות מצב - מציגות בתוך המסך במקום alert() של הדפדפן
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  // סינון וחיפוש מקומי בתפריט (לא משנה API/DB - רק תצוגה)
  const [selectedCategory, setSelectedCategory] = useState('');
  const [productQuery, setProductQuery] = useState('');

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsNarrow(window.innerWidth < 560);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const [schoolSettings, setSchoolSettings] = useState({
    allow_negative_balance: false,
    max_negative_balance: -50.00,
    menu_type: 'items',
    kitchen_open_time: '08:00',
    kitchen_close_time: '16:00',
    monthly_meal_price: 0,
    daily_meal_price: 0
  });

  const getMealPrice = () => {
    return studentPaymentType === 'monthly'
      ? schoolSettings?.monthly_meal_price || 0
      : schoolSettings?.daily_meal_price || 0;
  };

  useEffect(() => {
    if (scannedStudent) {
      authFetch(`https://api.bonapp.dev/api/students/${scannedStudent.id}/last-payment-type`)
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
  }, [scannedStudent]);

  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [scannerReady, setScannerReady] = useState(false);

  const scannerInstanceRef = useRef(null);
  const scannerClearingRef = useRef(Promise.resolve());

  useEffect(() => {
    if (scanning && !scannerReady) {
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  const onScanSuccess = async (decodedText) => {
    setScanning(false);
    setScannerReady(false);

    try {
      const response = await authFetch('https://api.bonapp.dev/api/scan-student', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode: decodedText })
      });

      const result = await response.json();

      if (result.success) {
        setErrorMessage('');
        setScannedStudent(result.student);
        setCart([]);

        try {
          const paymentResponse = await authFetch(
            `https://api.bonapp.dev/api/students/${result.student.id}/last-payment-type`
          );
          const paymentData = await paymentResponse.json();
          if (paymentData.success) {
            setStudentPaymentType(paymentData.payment_type || 'daily');
          }
        } catch (e) {
          setStudentPaymentType('daily');
        }
      } else {
        setErrorMessage('QR לא תקין או תלמיד לא נמצא');
      }
    } catch (error) {
      console.error('Scan error:', error);
      setErrorMessage('שגיאה בזיהוי תלמיד');
    }
  };

  const onScanError = (error) => {
    // התעלם משגיאות סריקה רגילות
  };

  // הוסף useEffect לטעינת תפריט:
  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        // טען משתמש נוכחי
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
          window.location.href = '/login';
          return;
        }
        setCurrentUser(user);

        // טען שם בית ספר וסוג תפריט
        const response = await authFetch(`https://api.bonapp.dev/api/schools/${user.school_id}`);
        const schoolData = await response.json();

        if (schoolData.success) {
          const school = schoolData.school;
          if (school) {
            setSchoolName(school.name);
            setMenuType(school.menu_type || 'items');
            setSchoolSettings({
              allow_negative_balance: school.allow_negative_balance || false,
              max_negative_balance: school.max_negative_balance || -50.00,
              menu_type: school.menu_type || 'items',
              kitchen_open_time: school.kitchen_open_time || '08:00',
              kitchen_close_time: school.kitchen_close_time || '16:00',
              monthly_meal_price: school.monthly_meal_price || 0,
              daily_meal_price: school.daily_meal_price || 0
            });

            // טען תפריט לפי סוג
            if (school.menu_type === 'daily') {
              const dailyResponse = await authFetch(`https://api.bonapp.dev/api/daily-menu/${school.id}`);
              const dailyData = await dailyResponse.json();
              if (dailyData.success) {
                setDailyMenuData(dailyData.dailyMenu);
              }
            }
          }
        }

        // טען תפריט של בית הספר
        const result = await getMenuItems(user.school_id);
        if (result.success) {
          setMenuItems(result.menuItems);
        }

        // טען עסקאות אחרונות
        const transactionsResult = await getRecentTransactions(user.school_id, 10);
        if (transactionsResult.success) {
          const formattedTransactions = transactionsResult.transactions
            .filter(t => t.students)
            .map(t => ({
              id: t.id,
              student: {
                first_name: t.students?.first_name || '',
                last_name: t.students?.last_name || ''
              },
              items: t.items || [],
              total: parseFloat(t.amount),
              timestamp: t.transaction_date ? new Date(t.transaction_date).toLocaleString('he-IL') : new Date(t.created_at).toLocaleString('he-IL'),
              status: 'completed'
            }));

          setRecentTransactions(formattedTransactions);
        }

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [location.pathname]);

  // סטטיסטיקות יומיות
  const [dailyStats, setDailyStats] = useState({
    totalSales: 0,
    transactionCount: 0,
    averageTransaction: 0,
    topItem: ''
  });

  const saveSchoolSettings = async () => {
    try {
      const response = await authFetch(`https://api.bonapp.dev/api/schools/${currentUser.school_id}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(schoolSettings)
      });

      const result = await response.json();
      if (result.success) {
        setSuccessMessage('ההגדרות נשמרו בהצלחה!');
        setErrorMessage('');
        setMenuType(schoolSettings.menu_type);
      } else {
        setErrorMessage('שגיאה בשמירת הגדרות');
      }
    } catch (error) {
      setErrorMessage('שגיאה בשמירת הגדרות');
    }
  };

  const handleSearch = async (term) => {
    setSearchTerm(term);

    if (term.length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    try {
      const result = await searchStudents(currentUser.school_id, term);
      if (result.success) {
        setSearchResults(result.students);
        setShowSearchResults(result.students.length > 0);
      }
    } catch (error) {
      console.error('Search error:', error);
    }
  };

  const selectStudent = (student) => {
    setScannedStudent(student);
    setSearchTerm('');
    setSearchResults([]);
    setShowSearchResults(false);
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

  const removeFromCart = (itemId) => {
    setCart(prev => prev.filter(item => item.id !== itemId));
  };

  const updateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(itemId);
      return;
    }
    setCart(prev => prev.map(item =>
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const calculateTotal = () => {
    return cart.reduce((total, item) => total + (item.price * item.quantity), 0);
  };

  // עוזר תצוגה בלבד: עסקאות שבוצעו דרך הקיוסק העצמאי שומרות רק {id, quantity} לכל
  // פריט (בלי name) - לכן מתקבל "undefined" כשמנסים להציג item.name ישירות. כאן
  // מאתרים את השם האמיתי מהתפריט הטעון, ואם הפריט כבר לא קיים בתפריט (נמחק וכו')
  // מציגים ניסוח חלופי בטוח במקום להסתיר את זה בשקט.
  const getItemDisplayName = (item) => {
    if (item.name) return item.name;
    const fromMenu = menuItems.find(m => m.id === item.id);
    return fromMenu?.name || 'פריט ללא שם';
  };

  const processPayment = async () => {
    if (!scannedStudent || cart.length === 0) {
      setErrorMessage('אין תלמיד או פריטים בעגלה');
      return;
    }

    const total = calculateTotal();
    if (scannedStudent.balance < total) {
      setErrorMessage(`יתרה לא מספיקה! יתרה: ₪${scannedStudent.balance.toFixed(2)}, סה"כ: ₪${total.toFixed(2)}`);
      return;
    }

    setIsProcessingPayment(true);
    setErrorMessage('');
    try {
      const result = await processMealPurchase(scannedStudent.id, cart, total);
      if (result.success) {
        setScannedStudent(prev => ({ ...prev, balance: result.newBalance }));

        const newTransaction = {
          id: Date.now(),
          student: scannedStudent,
          items: [...cart],
          total: result.chargeAmount || total,
          timestamp: new Date().toLocaleString('he-IL'),
          status: 'completed'
        };

        setRecentTransactions(prev => [newTransaction, ...prev.slice(0, 9)]);

        setDailyStats(prev => ({
          totalSales: prev.totalSales + total,
          transactionCount: prev.transactionCount + 1,
          averageTransaction: (prev.totalSales + total) / (prev.transactionCount + 1),
          topItem: prev.topItem
        }));

        setSuccessMessage(`תשלום בוצע בהצלחה! סה"כ: ₪${total.toFixed(2)} · יתרה חדשה: ₪${result.newBalance.toFixed(2)}`);

        // איפוס וחזרה אוטומטית למצב סריקה, מוכן לתלמיד הבא
        clearStudent();
        setScanning(true);

      } else {
        setErrorMessage(result.message || 'שגיאה בעיבוד התשלום');
      }
    } catch (error) {
      setErrorMessage('שגיאה בעיבוד התשלום');
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const clearStudent = () => {
    setScannedStudent(null);
    setCart([]);
  };

  const categories = [...new Set(menuItems.map(i => i.category).filter(Boolean))];
  const filteredItems = menuItems.filter(item => {
    if (selectedCategory && item.category !== selectedCategory) return false;
    if (productQuery && !item.name?.toLowerCase().includes(productQuery.toLowerCase())) return false;
    return true;
  });

  const today = new Date().getDay();
  const todayMenu = dailyMenuData.find(d => d.day_of_week === today);

  return (
    <div className="bap-kitchen">
      <style>{`
        .bap-kitchen{
          --navy:#17324a;--blue:#356b8c;--green:#75a843;--green2:#eef6e9;--paper:#f4f7f7;
          --white:#fff;--muted:#607482;--line:#dce6e9;--danger:#b64e4e;
          --shadow:0 8px 25px rgba(23,50,74,.08);
          font-family:'Heebo',Arial,sans-serif;color:var(--navy);background:var(--paper);
          font-size:15px;min-height:100vh;
        }
        .bap-kitchen *{box-sizing:border-box}
        .bap-kitchen button{font:inherit}
        .bap-kitchen .top{min-height:76px;background:#fff;border-bottom:1px solid var(--line);display:flex;align-items:center;flex-wrap:wrap;padding:12px 38px;gap:20px}
        .bap-kitchen .school{display:flex;align-items:center;gap:13px;margin-left:auto}
        .bap-kitchen .school-logo{width:42px;height:42px;border-radius:12px;background:var(--blue);color:#fff;display:grid;place-items:center;font-weight:700;flex-shrink:0}
        .bap-kitchen .school strong{display:block;font-size:19px}
        .bap-kitchen .school small{color:var(--muted)}
        .bap-kitchen .metrics{display:flex;gap:28px}
        .bap-kitchen .metric{text-align:center}
        .bap-kitchen .metric strong{display:block;font-size:20px;color:var(--blue)}
        .bap-kitchen .metric span{color:var(--muted);font-size:12px}
        .bap-kitchen .shift{display:flex;align-items:center;gap:10px;padding:9px 14px;background:var(--green2);border-radius:10px}
        .bap-kitchen .live{width:8px;height:8px;border-radius:50%;background:var(--green);flex-shrink:0}
        .bap-kitchen .top-actions{display:flex;gap:9px;flex-wrap:wrap;align-items:center}
        .bap-kitchen .action{height:44px;border:1px solid var(--line);background:#fff;color:var(--navy);border-radius:10px;padding:0 16px;font-weight:600;cursor:pointer;display:inline-flex;align-items:center;gap:8px;white-space:nowrap}
        .bap-kitchen .action.primary{background:var(--blue);border-color:var(--blue);color:#fff}
        .bap-kitchen .action.scan{background:var(--green);border-color:var(--green);color:#fff}
        .bap-kitchen .action:disabled{opacity:.6;cursor:not-allowed}
        .bap-kitchen .action:focus-visible,.bap-kitchen .logout:focus-visible,.bap-kitchen .tab:focus-visible,.bap-kitchen .category:focus-visible,.bap-kitchen .product:focus-visible,.bap-kitchen .login-btn:focus-visible{outline:3px solid var(--green);outline-offset:2px}
        .bap-kitchen .logout{border:0;background:transparent;color:var(--muted);cursor:pointer;width:42px;height:42px;border-radius:10px;display:grid;place-items:center}
        .bap-kitchen .logout:hover{background:var(--paper)}
        .bap-kitchen .shell{width:min(1440px,calc(100% - 48px));margin:26px auto}
        .bap-kitchen .toolbar{display:flex;align-items:center;justify-content:space-between;margin-bottom:20px;flex-wrap:wrap;gap:12px}
        .bap-kitchen .toolbar h1{font-size:29px;margin:0}
        .bap-kitchen .toolbar p{margin:2px 0 0;color:var(--muted)}
        .bap-kitchen .tabs{display:flex;background:#e8eff1;padding:4px;border-radius:11px}
        .bap-kitchen .tab{border:0;background:transparent;padding:9px 24px;border-radius:8px;color:var(--muted);font-weight:600;cursor:pointer}
        .bap-kitchen .tab.active{background:#fff;color:var(--blue);box-shadow:0 2px 8px rgba(23,50,74,.07)}
        .bap-kitchen .workspace{display:grid;grid-template-columns:minmax(480px,1.15fr) minmax(330px,.7fr);gap:20px;align-items:start}
        .bap-kitchen .panel{background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);overflow:hidden}
        .bap-kitchen .panel-head{display:flex;align-items:center;justify-content:space-between;padding:20px 22px;border-bottom:1px solid var(--line);gap:12px;flex-wrap:wrap}
        .bap-kitchen .panel-title{display:flex;align-items:center;gap:10px}
        .bap-kitchen .panel-title i{width:38px;height:38px;border-radius:10px;background:#eaf3f7;color:var(--blue);display:grid;place-items:center;font-style:normal;flex-shrink:0}
        .bap-kitchen .panel-title h2{font-size:20px;margin:0}
        .bap-kitchen .panel-title small{display:block;color:var(--muted)}
        .bap-kitchen .search-box{position:relative;width:210px}
        .bap-kitchen .search-box input{width:100%;height:40px;border:1px solid var(--line);border-radius:9px;padding:0 38px 0 13px;text-align:right;font-size:16px}
        .bap-kitchen .search-box svg{position:absolute;right:12px;top:50%;transform:translateY(-50%);color:var(--muted);pointer-events:none}
        .bap-kitchen .products{padding:18px 22px}
        .bap-kitchen .categories{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
        .bap-kitchen .category{border:1px solid var(--line);background:#fff;border-radius:999px;padding:7px 14px;color:var(--muted);cursor:pointer;font-weight:600}
        .bap-kitchen .category.active{background:var(--blue);color:#fff;border-color:var(--blue)}
        .bap-kitchen .product-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
        .bap-kitchen .product{min-height:96px;border:1px solid var(--line);border-radius:13px;background:#fff;padding:15px;text-align:right;display:flex;flex-direction:column;cursor:pointer}
        .bap-kitchen .product:hover:not(:disabled){border-color:#9ab9c9;background:#fbfdfe}
        .bap-kitchen .product:disabled{opacity:.55;cursor:not-allowed;background:#f7f9f9}
        .bap-kitchen .product strong{font-size:17px}
        .bap-kitchen .product small{color:var(--muted)}
        .bap-kitchen .product-bottom{margin-top:auto;display:flex;align-items:center;justify-content:space-between;padding-top:8px}
        .bap-kitchen .price{font-weight:700;color:var(--blue);font-size:18px}
        .bap-kitchen .add-badge{width:34px;height:34px;border-radius:9px;background:var(--green2);color:var(--green);font-size:22px;display:grid;place-items:center;flex-shrink:0}
        .bap-kitchen .cart{margin:0 22px 22px;background:#f8faf9;border:1px solid var(--line);border-radius:13px;padding:17px}
        .bap-kitchen .cart-head{display:flex;justify-content:space-between;margin-bottom:14px;align-items:center}
        .bap-kitchen .cart-empty{min-height:68px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:6px;color:var(--muted);border:1px dashed #cbd9dd;border-radius:10px;padding:16px;text-align:center}
        .bap-kitchen .student-chip{display:flex;align-items:center;justify-content:space-between;background:#fff;border:1px solid var(--line);border-radius:10px;padding:12px 14px;margin-bottom:14px}
        .bap-kitchen .student-chip strong{display:block;font-size:16px}
        .bap-kitchen .student-chip .balance{font-weight:700;color:var(--blue);font-size:17px}
        .bap-kitchen .student-chip .balance.low{color:var(--danger)}
        .bap-kitchen .cart-line{display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--line)}
        .bap-kitchen .cart-line:last-child{border-bottom:0}
        .bap-kitchen .qty-btn{width:28px;height:28px;border-radius:50%;border:1px solid var(--line);background:#fff;display:grid;place-items:center;cursor:pointer;color:var(--navy)}
        .bap-kitchen .cart-total{display:flex;justify-content:space-between;align-items:center;padding-top:14px;margin-top:8px;border-top:2px solid var(--blue);font-size:18px;font-weight:700}
        .bap-kitchen .pay-btn{width:100%;margin-top:14px;height:54px;border:0;border-radius:12px;background:var(--green);color:#fff;font-weight:700;font-size:16px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px}
        .bap-kitchen .pay-btn:disabled{background:#cdd6d3;color:#8a9490;cursor:not-allowed}
        .bap-kitchen .transactions{max-height:596px;overflow:auto;scrollbar-width:thin;scrollbar-color:#c6d3d8 transparent}
        .bap-kitchen .transactions::-webkit-scrollbar{width:6px}
        .bap-kitchen .transactions::-webkit-scrollbar-thumb{background:#c6d3d8;border-radius:99px}
        .bap-kitchen .transaction{padding:15px 20px;border-bottom:1px solid var(--line);display:grid;grid-template-columns:1fr auto;gap:7px}
        .bap-kitchen .transaction:hover{background:#fbfcfc}
        .bap-kitchen .tr-name{font-weight:600}
        .bap-kitchen .tr-time{color:var(--muted);font-size:12px}
        .bap-kitchen .tr-items{color:var(--muted);font-size:13px}
        .bap-kitchen .tr-amount{font-size:18px;font-weight:700;color:var(--green);text-align:left}
        .bap-kitchen .tr-status{font-size:12px;color:var(--green);text-align:left;display:flex;align-items:center;gap:4px;justify-content:flex-end}
        .bap-kitchen .empty-note{padding:40px;text-align:center;color:var(--muted)}
        .bap-kitchen .banner{display:flex;align-items:flex-start;gap:10px;padding:14px 16px;border-radius:10px;margin:0 22px 16px;font-size:14px;line-height:1.5}
        .bap-kitchen .banner.error{background:#fdecea;color:#a83236;border:1px solid #f3c8c9}
        .bap-kitchen .banner.success{background:var(--green2);color:#3f6b1f;border:1px solid #d7e8cb}
        .bap-kitchen .scan-box{margin:0 22px 22px;background:#fff;border:1px solid var(--line);border-radius:13px;padding:24px;text-align:center}
        .bap-kitchen .scan-box h3{margin:0 0 14px}
        .bap-kitchen .cancel-scan{margin-top:14px;height:44px;padding:0 20px;border-radius:10px;border:1px solid var(--line);background:#fff;color:var(--navy);cursor:pointer;font-weight:600}
        .bap-kitchen .loading-note{padding:60px 22px;text-align:center;color:var(--muted)}
        .bap-kitchen .more-menu{position:relative}
        .bap-kitchen .more-menu-panel{position:absolute;top:calc(100% + 6px);left:0;background:#fff;border:1px solid var(--line);border-radius:11px;box-shadow:var(--shadow);padding:6px;display:flex;flex-direction:column;gap:2px;z-index:20;min-width:160px}
        .bap-kitchen .more-menu-panel button{text-align:right;padding:10px 12px;border-radius:8px}
        .bap-kitchen .more-menu-panel button:hover{background:var(--paper)}
        .bap-kitchen .settings-wrap{max-width:800px;margin:0 auto;padding:0 24px 40px}
        .bap-kitchen .settings-card{background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);padding:28px}
        .bap-kitchen .settings-card h2{font-size:22px;margin:0 0 22px;display:flex;align-items:center;gap:10px}
        .bap-kitchen .settings-block{margin-bottom:22px;padding:18px;background:var(--paper);border-radius:12px}
        .bap-kitchen .settings-block h3{margin:0 0 14px;font-size:16px}
        .bap-kitchen .toggle-row{display:flex;gap:12px}
        .bap-kitchen .toggle-btn{flex:1;padding:14px;border-radius:9px;border:2px solid var(--line);background:#fff;color:var(--muted);cursor:pointer;font-weight:600}
        .bap-kitchen .toggle-btn.active{border-color:var(--blue);background:var(--blue);color:#fff}
        .bap-kitchen .save-btn{width:100%;padding:16px;border-radius:12px;border:0;background:var(--green);color:#fff;font-size:16px;font-weight:700;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:10px}
        .bap-kitchen .mobile-primary-actions{display:none}
        .bap-kitchen .scan-hint{display:flex;align-items:center;gap:8px;background:var(--green2);color:#3f6b1f;border:1px solid #d7e8cb;border-radius:10px;padding:10px 14px;margin-bottom:14px;font-size:14px;font-weight:600}

        @media(max-width:950px){
          .bap-kitchen .top{padding:12px 18px}
          .bap-kitchen .school{margin-left:0;flex:1}
          .bap-kitchen .metrics{order:3;width:100%;justify-content:center;border-top:1px solid var(--line);padding-top:10px}
          .bap-kitchen .shell{width:min(100% - 24px,1440px);margin:16px auto}
          .bap-kitchen .toolbar p{display:none}
          .bap-kitchen .workspace{grid-template-columns:1fr}
          .bap-kitchen .product-grid{grid-template-columns:repeat(2,1fr)}
          .bap-kitchen .transactions{max-height:none}
          .bap-kitchen .search-box{width:150px}
          .bap-kitchen .shell{padding-bottom:90px}
        }
        @media(max-width:560px){
          .bap-kitchen .top{gap:12px}
          .bap-kitchen .school strong{font-size:16px}
          .bap-kitchen .school small{font-size:11px}
          .bap-kitchen .shift{display:none}
          .bap-kitchen .top-actions .action.scan,.bap-kitchen .top-actions .action.kiosk{display:none}
          .bap-kitchen .action span.label{display:none}
          .bap-kitchen .action{padding:0 12px}
          .bap-kitchen .mobile-primary-actions{display:flex;gap:10px;margin:0 12px 12px}
          .bap-kitchen .mobile-action-btn{flex:1;min-height:44px;border:0;border-radius:10px;font-weight:700;font-size:14px;display:flex;align-items:center;justify-content:center;gap:8px;cursor:pointer;color:#fff}
          .bap-kitchen .mobile-action-btn.scan{background:var(--green)}
          .bap-kitchen .mobile-action-btn.kiosk{background:var(--blue)}
          .bap-kitchen .toolbar h1{font-size:23px}
          .bap-kitchen .tabs .tab{padding:8px 15px}
          .bap-kitchen .panel-head{padding:15px}
          .bap-kitchen .panel-title i{display:none}
          .bap-kitchen .search-box{display:none}
          .bap-kitchen .products{padding:14px}
          .bap-kitchen .product{min-height:96px;padding:13px}
          .bap-kitchen .cart{margin:0 14px 14px}
          .bap-kitchen .banner{margin:0 14px 14px}
          .bap-kitchen .scan-box{margin:0 14px 14px}
        }
      `}</style>

      {/* כותרת עליונה */}
      <header className="top">
        <div className="school">
          <div className="school-logo"><QrCode size={20} /></div>
          <div>
            <strong>{schoolName || 'מזנון בית הספר'}</strong>
            <small>מערכת קופה וניהול ארוחות</small>
          </div>
        </div>

        <div className="metrics">
          <div className="metric">
            <strong>₪{dailyStats.totalSales.toFixed(0)}</strong>
            <span>מכירות היום</span>
          </div>
          <div className="metric">
            <strong>{dailyStats.transactionCount}</strong>
            <span>עסקאות</span>
          </div>
        </div>

        <div className="shift">
          <i className="live" />
          <div>
            <strong>{currentUser?.name || 'מנהל מטבח'}</strong>
            <small>
              {schoolSettings.kitchen_open_time && schoolSettings.kitchen_close_time
                ? `משמרת ${schoolSettings.kitchen_open_time}–${schoolSettings.kitchen_close_time}`
                : ''}
            </small>
          </div>
        </div>

        <div className="top-actions">
          <button className="action scan" onClick={() => navigate('/kitchen-pos')} title="קופה מהירה">
            <QrCode size={18} />
            <span className="label">קופה מהירה</span>
          </button>
          <button className="action primary kiosk" onClick={() => navigate('/self-service-kiosk')}>
            <span className="label">פתח קיוסק עצמאי</span>
          </button>

          {!isNarrow && (
            <>
              <button className="action" onClick={() => navigate('/menu-management')}>
                <ChefHat size={18} />
                <span className="label">ניהול תפריט</span>
              </button>
              <button className="action" onClick={() => setActiveTab('settings')}>
                <Settings size={18} />
                <span className="label">הגדרות</span>
              </button>
            </>
          )}

          {isNarrow && (
            <div className="more-menu">
              <button className="action" aria-label="פעולות נוספות" aria-expanded={showMoreActions} onClick={() => setShowMoreActions(s => !s)}>
                <MoreVertical size={18} />
              </button>
              {showMoreActions && (
                <div className="more-menu-panel">
                  <button onClick={() => { navigate('/menu-management'); setShowMoreActions(false); }}>ניהול תפריט</button>
                  <button onClick={() => { setActiveTab('settings'); setShowMoreActions(false); }}>הגדרות</button>
                </div>
              )}
            </div>
          )}
        </div>

        <button className="logout" aria-label="יציאה" onClick={() => navigate('/')}>
          <LogOut size={20} />
        </button>
      </header>

      {/* שורת פעולות ראשיות למובייל בלבד (≤560px) - טקסט גלוי במקום אייקונים */}
      <div className="mobile-primary-actions">
        <button className="mobile-action-btn scan" onClick={() => navigate('/kitchen-pos')}>
          <QrCode size={18} />
          קופה מהירה
        </button>
        <button className="mobile-action-btn kiosk" onClick={() => navigate('/self-service-kiosk')}>
          קיוסק עצמאי
        </button>
      </div>

      <main className="shell">
        <div className="toolbar">
          <div>
            <h1>קופת המטבח</h1>
            <p>בחירת מנות ומעקב אחר העסקאות האחרונות</p>
          </div>
          <div className="tabs">
            <button className={`tab ${activeTab === 'stats' ? 'active' : ''}`} onClick={() => setActiveTab('stats')}>קופה</button>
            <button className={`tab ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>הגדרות</button>
          </div>
        </div>

        {activeTab === 'stats' ? (
          loading ? (
            <div className="panel"><div className="loading-note">טוען נתונים...</div></div>
          ) : (
          <div className="workspace">
            {/* עמודה ראשית - תפריט הקופה + עגלה */}
            <section className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <i><ShoppingCart size={18} /></i>
                  <div>
                    <h2>תפריט הקופה</h2>
                    <small>בחרו מנה להוספה לעגלה</small>
                  </div>
                </div>
                {menuType === 'items' && menuItems.length > 4 && (
                  <div className="search-box">
                    <input
                      value={productQuery}
                      onChange={(e) => setProductQuery(e.target.value)}
                      placeholder="חיפוש מנה"
                      aria-label="חיפוש מנה"
                    />
                    <Search size={16} />
                  </div>
                )}
              </div>

              {errorMessage && (
                <div className="banner error" role="alert">
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}
              {successMessage && (
                <div className="banner success" role="status">
                  <CheckCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{successMessage}</span>
                </div>
              )}

              {scanning ? (
                <div className="scan-box">
                  <h3>📷 מכוונים את המצלמה לכיוון ה-QR</h3>
                  <div id="qr-reader" style={{ width: '100%' }} />
                  <button className="cancel-scan" onClick={() => { setScanning(false); setScannerReady(false); }}>
                    ביטול
                  </button>
                </div>
              ) : (
                <div className="products">
                  {!scannedStudent && (
                    <div className="scan-hint">
                      <QrCode size={16} />
                      <span>יש לסרוק תלמיד לפני בחירת מנות</span>
                    </div>
                  )}
                  {menuType === 'daily' ? (
                    todayMenu ? (
                      <button
                        className="product"
                        style={{ width: '100%', minHeight: '112px' }}
                        onClick={() => addToCart({
                          id: `daily-${today}`,
                          name: 'ארוחת היום',
                          price: getMealPrice(),
                          category: 'ארוחה',
                          available: todayMenu.active
                        })}
                        disabled={!todayMenu.active || !scannedStudent}
                      >
                        <strong>ארוחת היום</strong>
                        <small>{todayMenu.menu_description}</small>
                        <span className="product-bottom">
                          <b className="price">₪{getMealPrice().toFixed(2)}</b>
                          <i className="add-badge">+</i>
                        </span>
                      </button>
                    ) : (
                      <div className="empty-note">לא הוגדר תפריט להיום</div>
                    )
                  ) : (
                    <>
                      {categories.length > 1 && (
                        <div className="categories">
                          <button className={`category ${!selectedCategory ? 'active' : ''}`} onClick={() => setSelectedCategory('')}>הכול</button>
                          {categories.map(cat => (
                            <button key={cat} className={`category ${selectedCategory === cat ? 'active' : ''}`} onClick={() => setSelectedCategory(cat)}>{cat}</button>
                          ))}
                        </div>
                      )}
                      {menuItems.length === 0 ? (
                        <div className="empty-note">אין מנות בתפריט כרגע</div>
                      ) : filteredItems.length === 0 ? (
                        <div className="empty-note">לא נמצאו מנות מתאימות</div>
                      ) : (
                        <div className="product-grid">
                          {filteredItems.map(item => (
                            <button
                              key={item.id}
                              className="product"
                              onClick={() => addToCart(item)}
                              disabled={!item.available || !scannedStudent}
                              aria-label={`הוסף ${item.name} לעגלה, ₪${item.price.toFixed(2)}`}
                            >
                              <strong>{item.name}</strong>
                              {item.category && <small>{item.category}</small>}
                              <span className="product-bottom">
                                <b className="price">₪{item.price.toFixed(2)}</b>
                                <i className="add-badge">+</i>
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              )}

              {/* עגלה */}
              <div className="cart">
                <div className="cart-head">
                  <strong>עגלה נוכחית</strong>
                  <span>{cart.length} פריטים</span>
                </div>

                {!scannedStudent ? (
                  <div className="cart-empty">סרקו תלמיד ובחרו מנות</div>
                ) : (
                  <>
                    <div className="student-chip">
                      <div>
                        <strong>{scannedStudent.first_name} {scannedStudent.last_name}</strong>
                        {scannedStudent.grade && <small style={{ color: 'var(--muted)' }}>כיתה {scannedStudent.grade}</small>}
                      </div>
                      <span className={`balance ${scannedStudent.balance < 20 ? 'low' : ''}`}>
                        יתרה: ₪{scannedStudent.balance.toFixed(2)}
                      </span>
                    </div>

                    {cart.length === 0 ? (
                      <div className="cart-empty">בחרו מנות מהתפריט</div>
                    ) : (
                      <div aria-live="polite">
                        {cart.map(item => (
                          <div key={item.id} className="cart-line">
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>{getItemDisplayName(item)}</div>
                              <div style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>₪{item.price.toFixed(2)} × {item.quantity}</div>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity - 1)} aria-label={`הפחת כמות של ${getItemDisplayName(item)}`}>
                                <Minus size={14} />
                              </button>
                              <span style={{ minWidth: 20, textAlign: 'center', fontWeight: 600 }}>{item.quantity}</span>
                              <button className="qty-btn" onClick={() => updateQuantity(item.id, item.quantity + 1)} aria-label={`הוסף כמות של ${getItemDisplayName(item)}`}>
                                <Plus size={14} />
                              </button>
                              <button className="qty-btn" onClick={() => removeFromCart(item.id)} aria-label={`הסר ${getItemDisplayName(item)} מהעגלה`} style={{ color: 'var(--danger)' }}>
                                <XCircle size={14} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {cart.length > 0 && (
                      <div className="cart-total">
                        <span>סה"כ:</span>
                        <span>₪{calculateTotal().toFixed(2)}</span>
                      </div>
                    )}

                    <button
                      className="pay-btn"
                      onClick={processPayment}
                      disabled={!scannedStudent || cart.length === 0 || isProcessingPayment}
                    >
                      <CheckCircle size={20} />
                      {isProcessingPayment ? 'מבצע חיוב...' : 'בצע תשלום'}
                    </button>
                  </>
                )}
              </div>
            </section>

            {/* עמודה שנייה - עסקאות אחרונות */}
            <aside className="panel">
              <div className="panel-head">
                <div className="panel-title">
                  <i><Clock size={18} /></i>
                  <div>
                    <h2>עסקאות אחרונות</h2>
                    <small>מתעדכן בזמן אמת</small>
                  </div>
                </div>
              </div>
              <div className="transactions">
                {recentTransactions.length === 0 ? (
                  <div className="empty-note">אין עסקאות עדיין</div>
                ) : (
                  recentTransactions.map(transaction => (
                    <div key={transaction.id} className="transaction">
                      <div>
                        <div className="tr-name">{transaction.student.first_name} {transaction.student.last_name}</div>
                        <div className="tr-time">{transaction.timestamp}</div>
                        <div className="tr-items">
                          {transaction.items.map(item => `${getItemDisplayName(item)} (${item.quantity})`).join(', ')}
                        </div>
                      </div>
                      <div>
                        <div className="tr-amount">₪{transaction.total.toFixed(2)}</div>
                        <div className="tr-status"><CheckCircle size={12} /> הושלם</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </aside>
          </div>
          )
        ) : (
          // טאב הגדרות - אותה לוגיקה/שדות בדיוק, רק עיצוב חדש
          <div className="settings-wrap">
            <div className="settings-card">
              <h2><Settings size={22} /> הגדרות בית הספר</h2>

              {successMessage && (
                <div className="banner success" role="status" style={{ margin: '0 0 16px' }}>
                  <CheckCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{successMessage}</span>
                </div>
              )}
              {errorMessage && (
                <div className="banner error" role="alert" style={{ margin: '0 0 16px' }}>
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{errorMessage}</span>
                </div>
              )}

              <div className="settings-block">
                <h3>סוג תפריט</h3>
                <div className="toggle-row">
                  <button
                    className={`toggle-btn ${schoolSettings.menu_type === 'items' ? 'active' : ''}`}
                    onClick={() => setSchoolSettings({ ...schoolSettings, menu_type: 'items' })}
                  >
                    📋 פריטים בודדים
                  </button>
                  <button
                    className={`toggle-btn ${schoolSettings.menu_type === 'daily' ? 'active' : ''}`}
                    onClick={() => setSchoolSettings({ ...schoolSettings, menu_type: 'daily' })}
                  >
                    📅 תפריט יומי
                  </button>
                </div>
              </div>

              <div className="settings-block">
                <h3>ניהול יתרות שליליות</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={schoolSettings.allow_negative_balance}
                    onChange={(e) => setSchoolSettings({ ...schoolSettings, allow_negative_balance: e.target.checked })}
                    style={{ width: 22, height: 22, cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: 600 }}>אפשר יתרה שלילית (מינוס)</span>
                </label>

                {schoolSettings.allow_negative_balance && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>מינוס מקסימלי מותר (₪)</label>
                    <input
                      type="number"
                      step="0.5"
                      value={Math.abs(schoolSettings.max_negative_balance)}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, max_negative_balance: -Math.abs(parseFloat(e.target.value) || 0) })}
                      style={{ width: '100%', padding: '0.75rem', border: '2px solid var(--line)', borderRadius: 8, fontSize: 16, boxSizing: 'border-box' }}
                    />
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>
                      תלמידים יוכלו להגיע עד מינוס {Math.abs(schoolSettings.max_negative_balance).toFixed(2)} ₪
                    </p>
                  </div>
                )}
              </div>

              <div className="settings-block">
                <h3>⏰ שעות פעילות המטבח</h3>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>שעת פתיחה</label>
                    <input
                      type="time"
                      value={schoolSettings.kitchen_open_time}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, kitchen_open_time: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', border: '2px solid var(--line)', borderRadius: 8, fontSize: 16, boxSizing: 'border-box' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: 600 }}>שעת סגירה</label>
                    <input
                      type="time"
                      value={schoolSettings.kitchen_close_time}
                      onChange={(e) => setSchoolSettings({ ...schoolSettings, kitchen_close_time: e.target.value })}
                      style={{ width: '100%', padding: '0.75rem', border: '2px solid var(--line)', borderRadius: 8, fontSize: 16, boxSizing: 'border-box' }}
                    />
                  </div>
                </div>
                <p style={{ margin: '1rem 0 0', fontSize: '0.85rem', color: 'var(--muted)' }}>השעות יוצגו למנהל המטבח בכותרת העליונה</p>
              </div>

              <button className="save-btn" onClick={saveSchoolSettings}>
                <CheckCircle size={22} />
                שמור הגדרות
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default KitchenQRScanner;
