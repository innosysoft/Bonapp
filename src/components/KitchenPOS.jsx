import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { searchStudents, getMenuItems, processMealPurchase, getSchools, scanStudent } from '../api';
import { QrCode, Search, ShoppingCart, DollarSign, X, Plus, Minus, Settings, ChefHat } from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';


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

  
  // תפריט ועגלה
  const [menuItems, setMenuItems] = useState([]);
  const [dailyMenuData, setDailyMenuData] = useState([]);
  const [cart, setCart] = useState([]);
  const [showWarning, setShowWarning] = useState(false);
const [warningData, setWarningData] = useState(null);

const onScanSuccess = async (decodedText) => {
  console.log('QR Code scanned:', decodedText);
  setIsScanning(false);
  setScannerReady(false);
  
  try {
    const response = await fetch('https://api.bonapp.dev/api/scan-student', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ qrCode: decodedText })
    });
    
    const result = await response.json();
    
    if (result.success) {
      setSelectedStudent(result.student);
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


useEffect(() => {
  if (isScanning && !scannerReady) {
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
            
            if (school.menu_type === 'daily') {
              const dailyResponse = await fetch(`https://api.bonapp.dev/api/daily-menu/${school.id}`);
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

  const processPayment = async (forceOverride = false) => {
  if (!selectedStudent || cart.length === 0) {
    alert('אין פריטים בעגלה');
    return;
  }

  const total = calculateTotal();

  try {
    const result = await processMealPurchase(selectedStudent.id, cart, total, forceOverride);
    
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
  
  // איפוס
  setSelectedStudent(null);
  setShowConfirm(false);
  setCart([]);
  
  // חזרה למצב סריקה עם מצלמה פתוחה
  setSearchMode('scan');
  setIsScanning(true);

    } else {
      alert(result.message || 'שגיאה בעיבוד התשלום');
    }
  } catch (error) {
    alert('שגיאה בעיבוד התשלום');
  }
};


  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    header: {
      background: 'rgba(255, 255, 255, 0.95)',
      padding: '1rem 2rem',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
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
    title: {
      fontSize: '1.6rem',
      fontWeight: 'bold',
      color: '#667eea',
      margin: 0
    },
    subtitle: {
      fontSize: '0.9rem',
      color: '#666',
      marginTop: '0.25rem'
    },
    buttons: {
      display: 'flex',
      gap: '1rem'
    },
    iconButton: {
      background: '#f8f9fa',
      border: 'none',
      borderRadius: '12px',
      padding: '0.75rem',
      cursor: 'pointer',
      transition: 'all 0.3s'
    },
    main: {
      padding: '2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    }
  };

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.logo}>
          <div style={styles.logoIcon}>
            <QrCode size={28} color="white" />
          </div>
          <div>
            <div style={styles.title}>קופה מהירה</div>
            <div style={styles.subtitle}>{schoolName || 'בית ספר'}</div>
          </div>
        </div>

        <div style={styles.buttons}>
          <button
  style={{
    background: '#f8f9fa',
    border: 'none',
    borderRadius: '12px',
    padding: '0.75rem 1.5rem',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    color: '#666'
  }}
  onClick={() => navigate('/kitchen-scanner')}
  title="חזור לניהול"
>
  <Settings size={20} />
  חזור לניהול
</button>

          <button
            style={styles.iconButton}
            onClick={() => navigate('/menu-management')}
            title="תפריט"
          >
            <ChefHat size={20} />
          </button>
        </div>
      </div>

      <div style={styles.main}>
        {!selectedStudent ? (
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
/>
        ) : showConfirm ? (
          // מסך אישור תלמיד
          <ConfirmScreen
            student={selectedStudent}
            onConfirm={confirmStudent}
            onCancel={cancelStudent}
          />
        ) : (
          // מסך מכירה
          <SalesScreen
            student={selectedStudent}
            menuType={menuType}
            menuItems={menuItems}
            dailyMenuData={dailyMenuData}
            cart={cart}
            onAddToCart={addToCart}
            onUpdateQuantity={updateQuantity}
            onCalculateTotal={calculateTotal}
            onProcessPayment={processPayment}
            onCancel={cancelStudent}
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

    </div>
  );
};

// קומפוננטות עזר - נוסיף בשלב הבא
const SearchScreen = ({ searchTerm, onSearchChange, searchResults, onSelectStudent, searchMode, onSearchModeChange, isScanning, onStartScanning, onStopScanning, setIsScanning, setScannerReady }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 200px)'
  }}>
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '24px',
      padding: '3rem',
      maxWidth: '600px',
      width: '100%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      backdropFilter: 'blur(20px)'
    }}>
      <div style={{
        textAlign: 'center',
        marginBottom: '2rem'
      }}>
        <QrCode size={64} color="#667eea" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: '#333',
          margin: '0 0 0.5rem 0'
        }}>
          זיהוי תלמיד
        </h2>
        <p style={{
          color: '#666',
          fontSize: '1rem',
          margin: 0
        }}>
          בחר אפשרות זיהוי
        </p>
      </div>

      {/* טאבים */}
      <div style={{
        display: 'flex',
        gap: '1rem',
        marginBottom: '2rem',
        background: '#f8f9fa',
        padding: '0.5rem',
        borderRadius: '12px'
      }}>
        <button
          onClick={() => onSearchModeChange('scan')}
          style={{
            flex: 1,
            padding: '0.75rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            background: searchMode === 'scan' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
            color: searchMode === 'scan' ? 'white' : '#666',
            transition: 'all 0.3s'
          }}
        >
          📷 סריקת QR
        </button>
        
        <button
          onClick={() => onSearchModeChange('search')}
          style={{
            flex: 1,
            padding: '0.75rem',
            borderRadius: '8px',
            border: 'none',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '1rem',
            background: searchMode === 'search' ? 'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
            color: searchMode === 'search' ? 'white' : '#666',
            transition: 'all 0.3s'
          }}
        >
          🔍 חיפוש
        </button>
      </div>

      {searchMode === 'scan' ? (
        // מצב סריקה
        <div style={{ textAlign: 'center' }}>
          {!isScanning ? (
            <button
  onClick={() => {
    setIsScanning(true);
  }}
  style={{
                width: '100%',
                padding: '3rem 2rem',
                borderRadius: '12px',
                border: '3px dashed #667eea',
                background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                color: '#667eea',
                fontSize: '1.2rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '1rem'
              }}
            >
              <QrCode size={64} />
              לחץ לסריקת QR
            </button>
          ) : (
  <div>
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '2rem',
      marginBottom: '1rem'
    }}>
      <h3 style={{ textAlign: 'center', marginBottom: '1rem', color: '#333' }}>
        📷 מכוון את המצלמה לכיוון ה-QR Code
      </h3>
      <div id="qr-reader" style={{ width: '100%', transform: 'scaleX(-1)' }}>

        
      </div>
    </div>
    <button
  onClick={() => {
    setIsScanning(false);
    setScannerReady(false);
  }}
  style={{
    width: '100%',
    padding: '1rem',
    borderRadius: '12px',
    border: 'none',
    background: '#e0e0e0',
    color: '#666',
    fontSize: '1rem',
    fontWeight: '600',
    cursor: 'pointer'
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
          <div style={{ position: 'relative', marginBottom: '1.5rem' }}>
            <Search 
              size={20} 
              style={{
                position: 'absolute',
                right: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#999'
              }}
            />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="הקלד לפחות 2 תווים..."
              autoFocus
              style={{
                width: '100%',
                padding: '1rem 3rem 1rem 1rem',
                border: '2px solid #e0e0e0',
                borderRadius: '12px',
                fontSize: '1.1rem',
                boxSizing: 'border-box',
                transition: 'all 0.3s'
              }}
              onFocus={(e) => e.target.style.borderColor = '#667eea'}
              onBlur={(e) => e.target.style.borderColor = '#e0e0e0'}
            />
          </div>

          {searchResults.length > 0 && (
            <div style={{
              background: 'white',
              border: '2px solid #667eea',
              borderRadius: '12px',
              maxHeight: '400px',
              overflowY: 'auto'
            }}>
              {searchResults.map(student => (
                <div
                  key={student.id}
                  onClick={() => onSelectStudent(student)}
                  style={{
                    padding: '1.25rem',
                    borderBottom: '1px solid #f0f0f0',
                    cursor: 'pointer',
                    transition: 'background 0.2s',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '1rem'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = '#f8f9fa'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'white'}
                >
                  <img 
                    src={student.photo_url || `https://via.placeholder.com/60/4CAF50/FFFFFF?text=${student.first_name?.[0] || 'X'}`}
                    alt={student.first_name}
                    style={{
                      width: '60px',
                      height: '60px',
                      borderRadius: '50%',
                      objectFit: 'cover',
                      border: '3px solid #4CAF50'
                    }}
                  />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '1.1rem', color: '#333' }}>
                      {student.first_name} {student.last_name}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#666', marginTop: '0.25rem' }}>
                      כיתה {student.grade} • {student.student_phone}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: '#4CAF50', marginTop: '0.25rem', fontWeight: '600' }}>
                      יתרה: ₪{student.balance.toFixed(2)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {searchTerm.length >= 2 && searchResults.length === 0 && (
            <div style={{
              textAlign: 'center',
              padding: '2rem',
              color: '#999'
            }}>
              לא נמצאו תוצאות
            </div>
          )}
        </>
      )}
    </div>
  </div>
);

const ConfirmScreen = ({ student, onConfirm, onCancel }) => (
  <div style={{
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 200px)'
  }}>
    <div style={{
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '24px',
      padding: '3rem',
      maxWidth: '500px',
      width: '100%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
      backdropFilter: 'blur(20px)',
      textAlign: 'center'
    }}>
      <h2 style={{
        fontSize: '1.8rem',
        fontWeight: 'bold',
        color: '#333',
        margin: '0 0 2rem 0'
      }}>
        אישור תלמיד
      </h2>

      <img 
        src={student.photo_url || `https://via.placeholder.com/200/4CAF50/FFFFFF?text=${student.first_name?.[0] || 'X'}`}
        alt={student.first_name}
        style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          objectFit: 'cover',
          border: '5px solid #4CAF50',
          margin: '0 auto 2rem',
          boxShadow: '0 8px 24px rgba(0,0,0,0.15)'
        }}
      />

      <div style={{
        background: '#f8f9fa',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem'
      }}>
        <h3 style={{
          fontSize: '1.8rem',
          fontWeight: 'bold',
          color: '#333',
          margin: '0 0 1rem 0'
        }}>
          {student.first_name} {student.last_name}
        </h3>
        
        <div style={{ fontSize: '1.1rem', color: '#666', marginBottom: '0.5rem' }}>
          כיתה {student.grade}
        </div>
        
        <div style={{ fontSize: '1rem', color: '#666', marginBottom: '1rem' }}>
          {student.student_phone}
        </div>
        
        <div style={{
          fontSize: '2rem',
          fontWeight: 'bold',
          color: student.balance > 50 ? '#4CAF50' : student.balance > 20 ? '#FF9800' : '#f44336',
          marginTop: '1rem'
        }}>
          יתרה: ₪{student.balance.toFixed(2)}
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center'
      }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '1rem 2rem',
            borderRadius: '12px',
            border: '2px solid #e0e0e0',
            background: 'white',
            color: '#666',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          ביטול
        </button>
        
        <button
          onClick={onConfirm}
          style={{
            flex: 1,
            padding: '1rem 2rem',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #4CAF50, #45a049)',
            color: 'white',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
          }}
        >
          ✓ אישור
        </button>
      </div>
    </div>
  </div>
);

const WarningModal = ({ warningData, onConfirm, onCancel }) => (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999
  }}>
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '2.5rem',
      maxWidth: '500px',
      width: '90%',
      boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
    }}>
      <div style={{
        fontSize: '3rem',
        textAlign: 'center',
        marginBottom: '1rem'
      }}>
        ⚠️
      </div>
      
      <h3 style={{
        fontSize: '1.5rem',
        fontWeight: 'bold',
        color: '#FF9800',
        textAlign: 'center',
        marginBottom: '1.5rem'
      }}>
        אזהרת מינוס
      </h3>
      
      <div style={{
        background: '#fff3e0',
        borderRadius: '12px',
        padding: '1.5rem',
        marginBottom: '2rem',
        whiteSpace: 'pre-line',
        textAlign: 'center',
        fontSize: '1.1rem',
        lineHeight: 1.6
      }}>
        {warningData?.message}
      </div>
      
      <div style={{
        display: 'flex',
        gap: '1rem'
      }}>
        <button
          onClick={onCancel}
          style={{
            flex: 1,
            padding: '1rem 2rem',
            borderRadius: '12px',
            border: '2px solid #e0e0e0',
            background: 'white',
            color: '#666',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer'
          }}
        >
          ביטול
        </button>
        
        <button
          onClick={onConfirm}
          style={{
            flex: 1,
            padding: '1rem 2rem',
            borderRadius: '12px',
            border: 'none',
            background: 'linear-gradient(135deg, #FF9800, #F57C00)',
            color: 'white',
            fontSize: '1.1rem',
            fontWeight: '600',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(255, 152, 0, 0.3)'
          }}
        >
          אשר בכל זאת
        </button>
      </div>
    </div>
  </div>
);


const SalesScreen = ({ student, menuType, menuItems, dailyMenuData, cart, onAddToCart, onUpdateQuantity, onCalculateTotal, onProcessPayment, onCancel }) => {
  const today = new Date().getDay();
  const todayMenu = dailyMenuData.find(d => d.day_of_week === today);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '300px 1fr 400px',
      gap: '2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    }}>
      {/* עמודה שמאל - פרטי תלמיד */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
        height: 'fit-content',
        position: 'sticky',
        top: '2rem'
      }}>
        <img 
          src={student.photo_url || `https://via.placeholder.com/120/4CAF50/FFFFFF?text=${student.first_name?.[0] || 'X'}`}
          alt={student.first_name}
          style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            objectFit: 'cover',
            border: '4px solid #4CAF50',
            margin: '0 auto 1rem',
            display: 'block'
          }}
        />
        
        <h3 style={{
          fontSize: '1.3rem',
          fontWeight: 'bold',
          color: '#333',
          margin: '0 0 0.5rem 0',
          textAlign: 'center'
        }}>
          {student.first_name} {student.last_name}
        </h3>
        
        <div style={{ textAlign: 'center', color: '#666', fontSize: '0.9rem', marginBottom: '1rem' }}>
          כיתה {student.grade}
        </div>
        
        <div style={{
          background: '#f8f9fa',
          borderRadius: '12px',
          padding: '1rem',
          marginBottom: '1rem',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '0.85rem', color: '#666', marginBottom: '0.5rem' }}>
            יתרה נוכחית
          </div>
          <div style={{
            fontSize: '1.8rem',
            fontWeight: 'bold',
            color: student.balance > 50 ? '#4CAF50' : student.balance > 20 ? '#FF9800' : '#f44336'
          }}>
            ₪{student.balance.toFixed(2)}
          </div>
        </div>

        <button
          onClick={onCancel}
          style={{
            width: '100%',
            padding: '0.75rem',
            borderRadius: '12px',
            border: '2px solid #e0e0e0',
            background: 'white',
            color: '#666',
            fontSize: '1rem',
            fontWeight: '600',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.5rem'
          }}
        >
          <X size={18} />
          בטל עסקה
        </button>
      </div>

      {/* עמודה אמצע - תפריט */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 12px 40px rgba(0,0,0,0.1)'
      }}>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#333',
          margin: '0 0 1.5rem 0'
        }}>
          {menuType === 'daily' ? 'תפריט היום' : 'תפריט'}
        </h3>

        <div style={{ maxHeight: '600px', overflowY: 'auto' }}>
          {menuType === 'daily' ? (
            // תפריט יומי
            todayMenu ? (
              <div style={{
                padding: '1.5rem',
                background: 'white',
                borderRadius: '12px',
                border: '2px solid #667eea',
                marginBottom: '1rem'
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
                    fontSize: '1.3rem'
                  }}>
                    ₪{todayMenu.price.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onAddToCart({
                      id: `daily-${today}`,
                      name: 'ארוחת היום',
                      price: todayMenu.price,
                      category: 'ארוחה',
                      available: todayMenu.active
                    })}
                    disabled={!todayMenu.active}
                    style={{
                      background: !todayMenu.active ? '#e0e0e0' : 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: !todayMenu.active ? '#999' : 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.75rem 1.5rem',
                      cursor: !todayMenu.active ? 'not-allowed' : 'pointer',
                      fontSize: '1rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
                  >
                    <Plus size={18} />
                    הוסף
                  </button>
                </div>
              </div>
            ) : (
              <div style={{
                textAlign: 'center',
                padding: '3rem',
                color: '#999'
              }}>
                לא הוגדר תפריט להיום
              </div>
            )
          ) : (
            // תפריט פריטים
            menuItems.map(item => (
              <div key={item.id} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '1rem',
                marginBottom: '0.75rem',
                background: item.available ? 'white' : '#f5f5f5',
                borderRadius: '12px',
                border: '1px solid #e0e0e0',
                opacity: item.available ? 1 : 0.6
              }}>
                <div>
                  <div style={{ fontWeight: '600', color: '#333', fontSize: '1rem' }}>
                    {item.name}
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#666' }}>
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
                    fontSize: '1.1rem'
                  }}>
                    ₪{item.price.toFixed(2)}
                  </span>
                  <button
                    onClick={() => onAddToCart(item)}
                    disabled={!item.available}
                    style={{
                      background: !item.available ? '#e0e0e0' : 'linear-gradient(135deg, #667eea, #764ba2)',
                      color: !item.available ? '#999' : 'white',
                      border: 'none',
                      borderRadius: '12px',
                      padding: '0.5rem 1rem',
                      cursor: !item.available ? 'not-allowed' : 'pointer',
                      fontSize: '0.9rem',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}
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

      {/* עמודה ימין - עגלה */}
      <div style={{
        background: 'rgba(255, 255, 255, 0.95)',
        borderRadius: '20px',
        padding: '2rem',
        boxShadow: '0 12px 40px rgba(0,0,0,0.1)',
        height: 'fit-content',
        position: 'sticky',
        top: '2rem'
      }}>
        <h3 style={{
          fontSize: '1.5rem',
          fontWeight: 'bold',
          color: '#333',
          margin: '0 0 1.5rem 0',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <ShoppingCart size={24} />
          עגלת קניות
        </h3>

        {cart.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '3rem 1rem',
            color: '#999'
          }}>
            העגלה ריקה
          </div>
        ) : (
          <>
            <div style={{ marginBottom: '1.5rem' }}>
              {cart.map(item => (
                <div key={item.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1rem',
                  paddingBottom: '1rem',
                  borderBottom: '1px solid #e0e0e0'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', fontSize: '0.95rem' }}>
                      {item.name}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: '#666' }}>
                      ₪{item.price.toFixed(2)} × {item.quantity}
                    </div>
                  </div>
                  <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem'
                  }}>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity - 1)}
                      style={{
                        background: '#e0e0e0',
                        border: 'none',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Minus size={14} />
                    </button>
                    <span style={{ minWidth: '24px', textAlign: 'center', fontWeight: '600' }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                      style={{
                        background: '#e0e0e0',
                        border: 'none',
                        borderRadius: '50%',
                        width: '28px',
                        height: '28px',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}
                    >
                      <Plus size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div style={{
              borderTop: '2px solid #667eea',
              paddingTop: '1.5rem',
              marginBottom: '1.5rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '1.5rem'
              }}>
                <strong style={{ fontSize: '1.3rem', color: '#333' }}>
                  סה״כ:
                </strong>
                <strong style={{ fontSize: '1.8rem', color: '#667eea' }}>
                  ₪{onCalculateTotal().toFixed(2)}
                </strong>
              </div>

              <button
                onClick={() => onProcessPayment()}
                style={{
                  width: '100%',
                  background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                  color: 'white',
                  border: 'none',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  fontSize: '1.2rem',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
                }}
              >
                <DollarSign size={24} />
                בצע תשלום
              </button>
            </div>
          </>
        )}

        
      </div>
      
      

    </div>
  );
};

export default KitchenPOS;