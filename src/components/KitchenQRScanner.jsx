import React, { useState, useEffect, useRef } from 'react';
import { getMenuItems, scanStudent, processMealPurchase, getSchools, searchStudents, getRecentTransactions } from '../api';
import { QrCode, Camera, ShoppingCart, User, DollarSign, Clock, CheckCircle, XCircle, RefreshCw, Settings, LogOut, ChefHat } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Html5QrcodeScanner } from 'html5-qrcode';

const KitchenQRScanner = () => {
  const navigate = useNavigate();
  const [isScanning, setIsScanning] = useState(false);
  const [scannedStudent, setScannedStudent] = useState(null);
  const [cart, setCart] = useState([]);
  const [todayMenu, setTodayMenu] = useState([]);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [scanResult, setScanResult] = useState('');
  const videoRef = useRef(null);
  const canvasRef = useRef(null);

  // דמה של תפריט יומי
  const [menuItems, setMenuItems] = useState([]);
const [loading, setLoading] = useState(true);
const [currentUser, setCurrentUser] = useState(null);
const [schoolName, setSchoolName] = useState('');
const [menuType, setMenuType] = useState('items');
const [dailyMenuData, setDailyMenuData] = useState([]);
const [activeTab, setActiveTab] = useState('stats'); // 'stats' או 'settings'

const [schoolSettings, setSchoolSettings] = useState({
  allow_negative_balance: false,
  max_negative_balance: -50.00,
  menu_type: 'items',
  kitchen_open_time: '08:00',
  kitchen_close_time: '16:00'
});

const [searchTerm, setSearchTerm] = useState('');
const [searchResults, setSearchResults] = useState([]);
const [showSearchResults, setShowSearchResults] = useState(false);
const [scanning, setScanning] = useState(false);
const [scannerReady, setScannerReady] = useState(false);

useEffect(() => {
  if (scanning && !scannerReady) {
    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      { 
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0
      },
      false
    );

    scanner.render(onScanSuccess, onScanError);
    setScannerReady(true);

    return () => {
      scanner.clear().catch(error => {
        console.error("Failed to clear scanner:", error);
      });
    };
  }
}, [scanning]);

const onScanSuccess = async (decodedText) => {
  console.log('QR Code scanned:', decodedText);
  setScanning(false);
  setScannerReady(false);
  
  try {
    const response = await fetch('https://api.bonapp.dev/api/scan-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCode: decodedText })
    });
    
    const result = await response.json();
    
    if (result.success) {
      setScannedStudent(result.student);
      setCart([]);
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


// הוסף useEffect לטעינת תפריט:
useEffect(() => {
  const loadData = async () => {
    try {
      // טען משתמש נוכחי
      const user = JSON.parse(localStorage.getItem('currentUser'));
      if (!user) {
        window.location.href = '/login';
        return;
      }
      setCurrentUser(user);
      
     // טען שם בית ספר וסוג תפריט
const response = await fetch(`https://api.bonapp.dev/api/schools/${user.school_id}`);
const schoolData = await response.json();

if (schoolData.success) {
  const school = schoolData.school;
  console.log('=== LOADED SCHOOL ===');
  console.log('School ID:', school.id);
  console.log('School Name:', school.name);
  console.log('Kitchen hours:', school.kitchen_open_time, '-', school.kitchen_close_time);
  
  if (school) {
  setSchoolName(school.name);
  setMenuType(school.menu_type || 'items');
  setSchoolSettings({
  allow_negative_balance: school.allow_negative_balance || false,
  max_negative_balance: school.max_negative_balance || -50.00,
  menu_type: school.menu_type || 'items',
  kitchen_open_time: school.kitchen_open_time || '08:00',
  kitchen_close_time: school.kitchen_close_time || '16:00'
});
    
    // טען תפריט לפי סוג
    if (school.menu_type === 'daily') {
      const dailyResponse = await fetch(`https://api.bonapp.dev/api/daily-menu/${school.id}`);
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
  const formattedTransactions = transactionsResult.transactions.map(t => ({
    id: t.id,
    student: {
      first_name: t.students.first_name,
      last_name: t.students.last_name
    },
    items: t.items || [],
    total: parseFloat(t.amount),
    timestamp: new Date(t.created_at).toLocaleString('he-IL'),
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
}, []);


  // סטטיסטיקות יומיות
  const [dailyStats, setDailyStats] = useState({
  totalSales: 0,
  transactionCount: 0,
  averageTransaction: 0,
  topItem: ''
});


const saveSchoolSettings = async () => {
  try {
    const response = await fetch(`https://api.bonapp.dev/api/schools/${currentUser.school_id}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schoolSettings)
    });
    
    const result = await response.json();
    if (result.success) {
      alert('ההגדרות נשמרו בהצלחה!');
      setMenuType(schoolSettings.menu_type);
    } else {
      alert('שגיאה בשמירת הגדרות');
    }
  } catch (error) {
    alert('שגיאה בשמירת הגדרות');
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
  setScanResult(`נבחר: ${student.first_name} ${student.last_name}`);
  setSearchTerm('');
  setSearchResults([]);
  setShowSearchResults(false);
};

  const startScanning = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' } 
      });
      videoRef.current.srcObject = stream;
      setIsScanning(true);
    } catch (error) {
      alert('לא ניתן לגשת למצלמה. בדוק הרשאות.');
    }
  };

  const stopScanning = () => {
    if (videoRef.current?.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop());
    }
    setIsScanning(false);
  };

  const simulateQRScan = async (studentId = 'ff65765e-22c7-4bae-a5ad-5f2052069b81') => {
  try {
    const result = await scanStudent(studentId);
    if (result.success) {
      setScannedStudent(result.student);
      setScanResult(`QR סורק: ${result.student.first_name} ${result.student.last_name} זוהה בהצלחה`);
    } else {
      setScanResult('שגיאה: תלמיד לא נמצא');
    }
    stopScanning();
  } catch (error) {
    setScanResult('שגיאה בסריקה');
  }
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

  const processPayment = async () => {
  if (!scannedStudent || cart.length === 0) {
    alert('אין תלמיד או פריטים בעגלה');
    return;
  }

  const total = calculateTotal();
  if (scannedStudent.balance < total) {
    alert(`יתרה לא מספיקה! יתרה: ₪${scannedStudent.balance.toFixed(2)}, סה"כ: ₪${total.toFixed(2)}`);
    return;
  }

  try {
    const result = await processMealPurchase(scannedStudent.id, cart, total);
    
    if (result.success) {
      // עדכן יתרת התלמיד
      setScannedStudent(prev => ({ ...prev, balance: result.newBalance }));
      
      // הוסף לעסקאות אחרונות
      const newTransaction = {
        id: Date.now(),
        student: scannedStudent,
        items: [...cart],
        total: total,
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

      // נקה עגלה
      setCart([]);
      
      alert(`תשלום בוצע בהצלחה!\nסה"כ: ₪${total.toFixed(2)}\nיתרה חדשה: ₪${result.newBalance.toFixed(2)}`);
      
    } else {
      alert(result.message || 'שגיאה בעיבוד התשלום');
    }
  } catch (error) {
    alert('שגיאה בעיבוד התשלום');
  }
};

  const clearStudent = () => {
    setScannedStudent(null);
    setCart([]);
    setScanResult('');
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>


      
      {/* כותרת */}

      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        padding: '1.5rem 2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
        backdropFilter: 'blur(20px)'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          maxWidth: '1400px',
          margin: '0 auto'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '1rem'
          }}>
            <div style={{
              width: '50px',
              height: '50px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <QrCode size={28} color="white" />
            </div>
            <div>
              <div style={{
                fontSize: '1.6rem',
                fontWeight: 'bold',
                color: '#667eea'
              }}>
                מזנון בית הספר
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#666',
                marginTop: '0.25rem'
              }}>
               מערכת קופה ו-QR • {schoolName || 'בית ספר'}
              </div>
            </div>
          </div>

          <div style={{
            display: 'flex',
            gap: '2rem',
            alignItems: 'center'
          }}>
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: '#667eea',
                margin: 0
              }}>
                ₪{dailyStats.totalSales.toFixed(0)}
              </p>
              <p style={{
                fontSize: '0.8rem',
                color: '#666',
                margin: '0.25rem 0 0 0'
              }}>
                מכירות היום
              </p>
            </div>
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: '#667eea',
                margin: 0
              }}>
                {dailyStats.transactionCount}
              </p>
              <p style={{
                fontSize: '0.8rem',
                color: '#666',
                margin: '0.25rem 0 0 0'
              }}>
                עסקאות
              </p>
            </div>
          </div>

          <div style={{
  display: 'flex',
  alignItems: 'center',
  gap: '1rem'
}}>
  <div style={{ textAlign: 'right' }}>
  <div style={{
    fontWeight: '600',
    fontSize: '1.1rem',
    color: '#333'
  }}>
    {currentUser?.name || 'מנהל מטבח'}
  </div>
  <div style={{
    fontSize: '0.9rem',
    color: '#777'
  }}>
    {schoolSettings.kitchen_open_time && schoolSettings.kitchen_close_time ? 
      `משמרת ${schoolSettings.kitchen_open_time}-${schoolSettings.kitchen_close_time}` : 
      'מנהל מטבח'}
  </div>
</div>
  
  <button 
  style={{
    background: 'linear-gradient(135deg, #4CAF50, #45a049)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem'
  }}
  onClick={() => navigate('/kitchen-pos')}
  title="קופה מהירה"
>
  <QrCode size={20} />
  קופה מהירה
</button>

  <button 
    style={{
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      color: 'white',
      border: 'none',
      borderRadius: '12px',
      padding: '0.75rem 1.5rem',
      cursor: 'pointer',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    }}
    onClick={() => navigate('/menu-management')}
    title="ניהול תפריט"
  >
    <ChefHat size={20} />
    ניהול תפריט
  </button>
  
  <button 
    style={{
      background: '#f8f9fa',
      border: 'none',
      borderRadius: '12px',
      padding: '1rem',
      cursor: 'pointer'
    }}
    onClick={() => navigate('/')}
  >
    <LogOut size={20} />
  </button>
</div>
        </div>
      </div>

      {/* טאבים */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem 2rem 0'
      }}>
        <div style={{
          display: 'flex',
          gap: '1rem',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '0.5rem',
          borderRadius: '16px',
          marginBottom: '2rem',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}>
          <button
            onClick={() => setActiveTab('stats')}
            style={{
              flex: 1,
              padding: '1rem',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              background: activeTab === 'stats' ? 
                'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
              color: activeTab === 'stats' ? 'white' : '#666',
              transition: 'all 0.3s'
            }}
          >
            📊 סטטיסטיקות
          </button>
          
          <button
            onClick={() => setActiveTab('settings')}
            style={{
              flex: 1,
              padding: '1rem',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '1rem',
              background: activeTab === 'settings' ? 
                'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
              color: activeTab === 'settings' ? 'white' : '#666',
              transition: 'all 0.3s'
            }}
          >
            ⚙️ הגדרות
          </button>
        </div>
      </div>

      {activeTab === 'stats' ? (
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr 1fr',
        gap: '2rem',
        padding: '2rem',
        maxWidth: '1400px',
        margin: '0 auto',
        minHeight: 'calc(100vh - 120px)'
      }}>
        
        {/* עמודה אמצעית - תפריט ועגלה */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(20px)'
        }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <ShoppingCart size={24} />
            תפריט וקופה
          </h3>

          {/* תפריט */}
          <div style={{
            marginBottom: '2rem',
            maxHeight: '300px',
            overflowY: 'auto'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#555' }}>
  {menuType === 'daily' ? 'תפריט היום' : 'תפריט המזנון'}
</h4>

{menuType === 'daily' ? (
  // תפריט יומי
  <div>
    {(() => {
      const today = new Date().getDay(); // 0=ראשון, 1=שני...
      const todayMenu = dailyMenuData.find(d => d.day_of_week === today);
      
      if (!todayMenu) {
        return (
          <div style={{
            padding: '2rem',
            textAlign: 'center',
            color: '#999',
            background: '#f8f9fa',
            borderRadius: '8px'
          }}>
            לא הוגדר תפריט להיום
          </div>
        );
      }
      
      return (
        <div style={{
          padding: '1.5rem',
          background: 'white',
          borderRadius: '8px',
          border: '2px solid #667eea'
        }}>
          <div style={{
            fontWeight: '600',
            fontSize: '1.1rem',
            color: '#333',
            marginBottom: '1rem'
          }}>
            ארוחת היום
          </div>
          <div style={{
            color: '#666',
            marginBottom: '1rem',
            lineHeight: 1.5
          }}>
            {todayMenu.menu_description}
          </div>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <span style={{
              fontWeight: 'bold',
              color: '#667eea',
              fontSize: '1.2rem'
            }}>
              ₪{todayMenu.price.toFixed(2)}
            </span>
            <button
              onClick={() => addToCart({
                id: `daily-${today}`,
                name: 'ארוחת היום',
                price: todayMenu.price,
                category: 'ארוחה',
                available: todayMenu.active
              })}
              disabled={!todayMenu.active || !scannedStudent}
              style={{
                background: !todayMenu.active || !scannedStudent ? '#e0e0e0' : 'linear-gradient(135deg, #667eea, #764ba2)',
                color: !todayMenu.active || !scannedStudent ? '#999' : 'white',
                border: 'none',
                borderRadius: '20px',
                padding: '0.75rem 1.5rem',
                cursor: !todayMenu.active || !scannedStudent ? 'not-allowed' : 'pointer',
                fontSize: '1rem',
                fontWeight: '600'
              }}
            >
              הוסף לעגלה
            </button>
          </div>
        </div>
      );
    })()}
  </div>
) : (
  // תפריט פריטים (הקוד הקיים)
  menuItems.map(item => (
    <div key={item.id} style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '0.75rem',
      marginBottom: '0.5rem',
      background: item.available ? 'white' : '#f5f5f5',
      borderRadius: '8px',
      border: '1px solid #e0e0e0',
      opacity: item.available ? 1 : 0.6
    }}>
      <div>
        <div style={{ fontWeight: '600', color: '#333' }}>
          {item.name}
        </div>
        <div style={{ fontSize: '0.8rem', color: '#666' }}>
          {item.category}
        </div>
      </div>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '1rem'
      }}>
        <span style={{
          fontWeight: 'bold',
          color: '#667eea',
          fontSize: '1rem'
        }}>
          ₪{item.price.toFixed(2)}
        </span>
        <button
          onClick={() => addToCart(item)}
          disabled={!item.available || !scannedStudent}
          style={{
            background: !item.available || !scannedStudent ? '#e0e0e0' : 'linear-gradient(135deg, #667eea, #764ba2)',
            color: !item.available || !scannedStudent ? '#999' : 'white',
            border: 'none',
            borderRadius: '20px',
            padding: '0.5rem 1rem',
            cursor: !item.available || !scannedStudent ? 'not-allowed' : 'pointer',
            fontSize: '0.8rem',
            fontWeight: '600'
          }}
        >
          הוסף
        </button>
      </div>
    </div>
  ))
)}
          </div>

          {/* עגלת קניות */}
          <div style={{
            background: '#f8f9fa',
            padding: '1.5rem',
            borderRadius: '12px'
          }}>
            <h4 style={{ margin: '0 0 1rem 0', color: '#555' }}>
              עגלת קניות ({cart.length} פריטים)
            </h4>
            
            {cart.length === 0 ? (
              <p style={{ color: '#999', textAlign: 'center', margin: '2rem 0' }}>
                העגלה ריקה
              </p>
            ) : (
              <>
                {cart.map(item => (
                  <div key={item.id} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '0.75rem',
                    paddingBottom: '0.75rem',
                    borderBottom: '1px solid #e0e0e0'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', fontSize: '0.9rem' }}>
                        {item.name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        ₪{item.price.toFixed(2)} × {item.quantity}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        style={{
                          background: '#e0e0e0',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem'
                        }}
                      >
                        -
                      </button>
                      <span style={{ minWidth: '20px', textAlign: 'center', fontSize: '0.9rem' }}>
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        style={{
                          background: '#e0e0e0',
                          border: 'none',
                          borderRadius: '50%',
                          width: '24px',
                          height: '24px',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: '0.8rem'
                        }}
                      >
                        +
                      </button>
                      <button
                        onClick={() => removeFromCart(item.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#f44336',
                          cursor: 'pointer',
                          marginLeft: '0.5rem'
                        }}
                      >
                        <XCircle size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                
                <div style={{
                  borderTop: '2px solid #667eea',
                  paddingTop: '1rem',
                  marginTop: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: '1rem'
                  }}>
                    <strong style={{ fontSize: '1.2rem', color: '#333' }}>
                      סה״כ:
                    </strong>
                    <strong style={{ fontSize: '1.4rem', color: '#667eea' }}>
                      ₪{calculateTotal().toFixed(2)}
                    </strong>
                  </div>
                  
                  <button
                    onClick={processPayment}
                    disabled={!scannedStudent || cart.length === 0}
                    style={{
                      width: '100%',
                      background: !scannedStudent || cart.length === 0 ? '#e0e0e0' : 'linear-gradient(135deg, #4CAF50, #45a049)',
                      color: !scannedStudent || cart.length === 0 ? '#999' : 'white',
                      border: 'none',
                      padding: '1rem',
                      borderRadius: '25px',
                      cursor: !scannedStudent || cart.length === 0 ? 'not-allowed' : 'pointer',
                      fontSize: '1.1rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <DollarSign size={20} />
                    בצע תשלום
                  </button>
                </div>
              </>
            )}
          </div>
        </div>

        {/* עמודה ימנית - עסקאות אחרונות וסטטיסטיקות */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '2rem',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(20px)'
        }}>
          <h3 style={{
            fontSize: '1.5rem',
            fontWeight: 'bold',
            color: '#333',
            marginBottom: '2rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <Clock size={24} />
            עסקאות אחרונות
          </h3>

          <div style={{
            maxHeight: '500px',
            overflowY: 'auto'
          }}>
            {recentTransactions.length === 0 ? (
              <div style={{
                textAlign: 'center',
                color: '#999',
                padding: '2rem'
              }}>
                <Clock size={48} style={{ opacity: 0.5, marginBottom: '1rem' }} />
                <p>אין עסקאות עדיין</p>
              </div>
            ) : (
              recentTransactions.map(transaction => (
                <div key={transaction.id} style={{
                  background: 'white',
                  border: '1px solid #e0e0e0',
                  borderRadius: '8px',
                  padding: '1rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: '0.5rem'
                  }}>
                    <div>
                      <div style={{ fontWeight: '600', color: '#333' }}>
                        {transaction.student.first_name} {transaction.student.last_name}
                      </div>
                      <div style={{ fontSize: '0.8rem', color: '#666' }}>
                        {transaction.timestamp}
                      </div>
                    </div>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span style={{
                        fontWeight: 'bold',
                        color: '#4CAF50'
                      }}>
                        ₪{transaction.total.toFixed(2)}
                      </span>
                      <CheckCircle size={16} color="#4CAF50" />
                    </div>
                  </div>
                  
                  <div style={{ fontSize: '0.8rem', color: '#666' }}>
                    {transaction.items.map(item => 
                      `${item.name} (${item.quantity})`
                    ).join(', ')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
  
  ) : (
    // טאב הגדרות
    <div style={{
      padding: '0 2rem 2rem',
      maxWidth: '800px',
      margin: '0 auto'
    }}>
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '2.5rem',
        boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)'
      }}>
        <h2 style={{
          fontSize: '1.8rem',
          fontWeight: 'bold',
          color: '#333',
          marginBottom: '2rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem'
        }}>
          <Settings size={28} />
          הגדרות בית הספר
        </h2>

        {/* סוג תפריט */}
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          background: '#f8f9fa',
          borderRadius: '12px'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#333' }}>
            סוג תפריט
          </h3>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={() => setSchoolSettings({...schoolSettings, menu_type: 'items'})}
              style={{
                flex: 1,
                padding: '1rem',
                borderRadius: '8px',
                border: '2px solid',
                borderColor: schoolSettings.menu_type === 'items' ? '#667eea' : '#e0e0e0',
                background: schoolSettings.menu_type === 'items' ? '#667eea' : 'white',
                color: schoolSettings.menu_type === 'items' ? 'white' : '#666',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📋 פריטים בודדים
            </button>
            <button
              onClick={() => setSchoolSettings({...schoolSettings, menu_type: 'daily'})}
              style={{
                flex: 1,
                padding: '1rem',
                borderRadius: '8px',
                border: '2px solid',
                borderColor: schoolSettings.menu_type === 'daily' ? '#667eea' : '#e0e0e0',
                background: schoolSettings.menu_type === 'daily' ? '#667eea' : 'white',
                color: schoolSettings.menu_type === 'daily' ? 'white' : '#666',
                cursor: 'pointer',
                fontWeight: '600'
              }}
            >
              📅 תפריט יומי
            </button>
          </div>
        </div>

        {/* הגדרות מינוס */}
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          background: '#f8f9fa',
          borderRadius: '12px'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#333' }}>
            ניהול יתרות שליליות
          </h3>
          
          <label style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            marginBottom: '1.5rem',
            cursor: 'pointer',
            fontSize: '1rem'
          }}>
            <input
              type="checkbox"
              checked={schoolSettings.allow_negative_balance}
              onChange={(e) => setSchoolSettings({
                ...schoolSettings,
                allow_negative_balance: e.target.checked
              })}
              style={{
                width: '24px',
                height: '24px',
                cursor: 'pointer'
              }}
            />
            <span style={{ fontWeight: '600' }}>אפשר יתרה שלילית (מינוס)</span>
          </label>

          {schoolSettings.allow_negative_balance && (
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
                color: '#555'
              }}>
                מינוס מקסימלי מותר (₪)
              </label>
              <input
                type="number"
                step="0.5"
                value={Math.abs(schoolSettings.max_negative_balance)}
                onChange={(e) => setSchoolSettings({
                  ...schoolSettings,
                  max_negative_balance: -Math.abs(parseFloat(e.target.value) || 0)
                })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
              <p style={{
                margin: '0.5rem 0 0 0',
                fontSize: '0.85rem',
                color: '#666'
              }}>
                תלמידים יוכלו להגיע עד מינוס {Math.abs(schoolSettings.max_negative_balance).toFixed(2)} ₪
              </p>
            </div>
          )}
        </div>

{/* שעות פתיחת המטבח */}
        <div style={{
          marginBottom: '2rem',
          padding: '1.5rem',
          background: '#f8f9fa',
          borderRadius: '12px'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#333' }}>
            ⏰ שעות פעילות המטבח
          </h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
                color: '#555'
              }}>
                שעת פתיחה
              </label>
              <input
                type="time"
                value={schoolSettings.kitchen_open_time}
                onChange={(e) => setSchoolSettings({
                  ...schoolSettings,
                  kitchen_open_time: e.target.value
                })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <div>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
                color: '#555'
              }}>
                שעת סגירה
              </label>
              <input
                type="time"
                value={schoolSettings.kitchen_close_time}
                onChange={(e) => setSchoolSettings({
                  ...schoolSettings,
                  kitchen_close_time: e.target.value
                })}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '1rem',
                  boxSizing: 'border-box'
                }}
              />
            </div>
          </div>

          <p style={{
            margin: '1rem 0 0 0',
            fontSize: '0.85rem',
            color: '#666'
          }}>
            השעות יוצגו למנהל המטבח בכותרת העליונה
          </p>
        </div>

        {/* כפתור שמירה */}
        <button
          onClick={saveSchoolSettings}
          style={{
            width: '100%',
            padding: '1.25rem',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #4CAF50, #45a049)',
            color: 'white',
            fontSize: '1.2rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.75rem'
          }}
        >
          <CheckCircle size={24} />
          שמור הגדרות
        </button>
      </div>
    </div>
  )}
    </div>
  );
};

export default KitchenQRScanner;