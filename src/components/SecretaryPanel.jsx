import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getParentData, getTransactions, generateQRCode } from '../api';
import { getSchoolStudents, addMoney, getSchoolTransactions, getPendingRegistrations, handleRegistrationAction, getParentDetails, getSchools } from '../api';
import * as XLSX from 'xlsx';
import { 
  Search, Plus, DollarSign, Receipt, Edit, Eye, CreditCard, Banknote, Clock, 
  CheckCircle, User, Phone, Mail, FileText, Download, Filter, Settings, LogOut,
  AlertCircle, XCircle, Calendar, TrendingUp, Users, Home, Bell, RefreshCw,
  Printer, Check, X, UserCheck, UserX, Wallet, PiggyBank, QrCode
} from 'lucide-react';

const SecretaryPanel = () => {
  const navigate = useNavigate();
  const [showReportModal, setShowReportModal] = useState(false);
const [currentReport, setCurrentReport] = useState(null);
const [reportType, setReportType] = useState('');
  const [activeTab, setActiveTab] = useState('payments');
  const [currentUser, setCurrentUser] = useState(null);
  const [schoolName, setSchoolName] = useState('');
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('today');
  const [showAdminPanel, setShowAdminPanel] = useState(false);
const [adminPassword, setAdminPassword] = useState('');
const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
const [schools, setSchools] = useState([]);
const [transactions, setTransactions] = useState([]);
const [parentDetails, setParentDetails] = useState(null);
const [showParentDetails, setShowParentDetails] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
  
  
    studentId: '',
    amount: '',
    paymentMethod: 'cash',
    checkNumber: '',
    bankName: '',
    notes: ''
  });

  // סטטיסטיקות דשבורד בזמן אמת
  const [dailyStats, setDailyStats] = useState({
    totalPayments: 2450.00,
    transactionCount: 18,
    averageTransaction: 136.11,
    pendingApprovals: 3,
    lowBalanceStudents: 7,
    lastUpdate: new Date()
  });

useEffect(() => {
  const loadSchoolData = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));

      setCurrentUser(currentUser);

      if (!currentUser) {
        navigate('/login');
        return;
      }

      const schoolData = await getSchoolStudents(currentUser.school_id);
      if (schoolData.success) {
        setStudents(schoolData.students);
      }

      // טען שם בית ספר
const schoolsData = await getSchools();
if (schoolsData.success) {
  const school = schoolsData.schools.find(s => s.id === currentUser.school_id);
  if (school) {
    setSchoolName(school.name);
  }
}

      // טען עסקאות של בית הספר
      const transactionsData = await getSchoolTransactions(currentUser.school_id);

      if (transactionsData.success) {
        setTransactions(transactionsData.transactions);
      }

      // טען הרשמות ממתינות
const registrationsData = await getPendingRegistrations(currentUser.school_id);
if (registrationsData.success) {
  setPendingRegistrations(registrationsData.registrations);
}

// חשב סטטיסטיקות אמיתיות
      const today = new Date().toISOString().split('T')[0];
      const todayTransactions = transactionsData.transactions?.filter(t => 
        new Date(t.transaction_date).toISOString().split('T')[0] === today
      ) || [];

      const totalPayments = todayTransactions.reduce((sum, t) => sum + (t.amount || 0), 0);
      const transactionCount = todayTransactions.length;
      const averageTransaction = transactionCount > 0 ? totalPayments / transactionCount : 0;
      const lowBalanceStudents = schoolData.students?.filter(s => s.balance < 20).length || 0;

      setDailyStats({
        totalPayments,
        transactionCount,
        averageTransaction,
        pendingApprovals: registrationsData.registrations?.length || 0,
        lowBalanceStudents,
        lastUpdate: new Date()
      });

    } catch (error) {
      console.error('Error loading school data:', error);
    } finally {
      setLoading(false);
    }
  };

  loadSchoolData();
}, [navigate]);

  // רפרש סטטיסטיקות כל 30 שניות
  useEffect(() => {
    const interval = setInterval(() => {
      setDailyStats(prev => ({
        ...prev,
        lastUpdate: new Date()
      }));
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  // דמה של תלמידים מורחבת
  const [students, setStudents] = useState([]);
const [loading, setLoading] = useState(true);
   

  // הרשמות ממתינות לאישור
const [pendingRegistrations, setPendingRegistrations] = useState([
  
  ]);



  const handleAddPayment = async () => {
  if (paymentForm.studentId && paymentForm.amount && parseFloat(paymentForm.amount) > 0) {
    try {
      const result = await addMoney(paymentForm.studentId, parseFloat(paymentForm.amount), paymentForm.paymentMethod);
      
      if (result.success) {
        // עדכן את יתרת התלמיד ב-state המקומי
        setStudents(prev => prev.map(student => 
          student.id == paymentForm.studentId 
            ? { ...student, balance: result.newBalance }
            : student
        ));
        
        // **הוסף את השורות האלה:**
        // רענן את רשימת העסקאות
        const transactionsData = await getSchoolTransactions(currentUser.school_id);

        if (transactionsData.success) {
          setTransactions(transactionsData.transactions);
        }
        
        const receiptNumber = `REC${String(Date.now()).slice(-6)}`;
        const student = students.find(s => s.id == paymentForm.studentId);
        
        alert(`התשלום נוסף בהצלחה!\nקבלה מס׳: ${receiptNumber}\nעבור: ${student?.first_name} ${student?.last_name}\nסכום: ₪${parseFloat(paymentForm.amount).toFixed(2)}\nיתרה חדשה: ₪${result.newBalance.toFixed(2)}`);
        
        setShowAddPayment(false);
        setPaymentForm({
          studentId: '', amount: '', paymentMethod: 'cash',
          checkNumber: '', bankName: '', notes: ''
        });
        
      } else {
        alert(result.message || 'שגיאה בהוספת תשלום');
      }
    } catch (error) {
      alert('שגיאה בהוספת תשלום. נסה שוב.');
    }
  }
};

  const handleApproveRegistration = async (registrationId, approve) => {
  try {
    const action = approve ? 'approve' : 'reject';
    let reason = '';
    
    if (!approve) {
      reason = prompt('סיבת דחייה (יישלח למשפחה):');
      if (!reason) return;
    }
    
    const result = await handleRegistrationAction(registrationId, action, reason);
    
    if (result.success) {
      // הסר מהרשימה
      setPendingRegistrations(prev => prev.filter(r => r.id !== registrationId));
      
      if (approve) {
  // רענן את רשימת התלמידים
  const schoolData = await getSchoolStudents(currentUser.school_id);
  if (schoolData.success) {
    setStudents(schoolData.students);
    
    // צור QR לכל תלמיד חדש
    for (const student of schoolData.students) {
      try {
        await generateQRCode(student.id);
      } catch (error) {
        console.log('QR creation error for student:', student.id);
      }
    }
  }
  
  if (result.parentPassword) {
  const currentRegistration = pendingRegistrations.find(r => r.id === registrationId);
  if (currentRegistration) {
    const copyText = `אימייל: ${currentRegistration.parent_email}\nסיסמה: ${result.parentPassword}`;
    
    const detailsDiv = document.createElement('div');
    detailsDiv.innerHTML = `
  <div style="position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%); 
              background: white; padding: 2rem; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
              z-index: 1000; direction: rtl; text-align: center;">
    <h3 style="color: #4CAF50; margin-bottom: 1rem;">ההרשמה אושרה בהצלחה!</h3>
    <div style="background: #f0f8ff; padding: 1rem; border-radius: 8px; margin: 1rem 0;">
      <h4>פרטי גישה להורה:</h4>
      <p><strong>אימייל:</strong> ${currentRegistration.parent_email}</p>
      <p><strong>סיסמה:</strong> <span style="font-family: monospace; font-size: 1.2rem; color: #2196F3;">${result.parentPassword}</span></p>
    </div>
    <div style="margin-top: 1rem;">
      <button onclick="this.parentElement.parentElement.remove()" 
              style="background: #4CAF50; color: white; border: none; padding: 0.75rem 1.5rem; 
                     border-radius: 25px; cursor: pointer; margin-left: 0.5rem;">
        סגור
      </button>
      <button id="copyBtn" style="background: #2196F3; color: white; border: none; padding: 0.75rem 1.5rem; 
                         border-radius: 25px; cursor: pointer;">
        העתק פרטים
      </button>
    </div>
    <p style="font-size: 0.9rem; color: #666; margin-top: 1rem;">
      אימייל נשלח אוטומטית להורה עם פרטי הגישה
    </p>
  </div>
`;

document.body.appendChild(detailsDiv);
    
    // פעולת העתקה - רק פעם אחת
    document.getElementById('copyBtn').onclick = () => {
      navigator.clipboard.writeText(copyText);
      alert('הועתק ללוח!');
    };



    // שלח אימייל רק אם יש סיסמה חדשה (הורה חדש)
// שלח אימייל
    try {
      await fetch(`https://api.bonapp.dev/api/send-login-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          parentEmail: currentRegistration.parent_email,
          parentName: currentRegistration.parent_name,
          password: result.parentPassword
        })
      });
    } catch (error) {
      console.log('שגיאה בשליחת אימייל:', error);
    }
  }
} else {
  alert('ההרשמה אושרה והתלמידים נוספו להורה קיים');
}
} else {
  alert('ההרשמה נדחתה והודעה נשלחה למשפחה.');
}

    } else {
      alert(result.message || 'שגיאה בעיבוד הרשמה');
    }
  } catch (error) {
    alert('שגיאה בעיבוד הרשמה. נסה שוב.');
  }
};
 
// הוסף פונקציה לטעינת פרטי הורה:
const loadParentDetails = async (studentId) => {
  try {
    const result = await getParentDetails(studentId);
    if (result.success) {
      setParentDetails(result.parent);
      setShowParentDetails(true);
    } else {
      alert('לא נמצאו פרטי הורה לתלמיד זה');
    }
  } catch (error) {
    alert('שגיאה בטעינת פרטי הורה');
  }
};


const generateReport = (type) => {
  const reports = {
    daily: 'דוח יומי',
    weekly: 'דוח שבועי', 
    monthly: 'דוח חודשי',
    students: 'דוח תלמידים',
    debts: 'דוח חובות'
  };
  
  let reportData = [];
  
  switch(type) {
    case 'students':
      reportData = students.map(student => ({
        'שם מלא': `${student?.first_name} ${student?.last_name || ''}`,
        'כיתה': student.grade,
        'יתרה': `₪${(student.balance || 0).toFixed(2)}`,
        'טלפון הורה': student.users?.phone,
        'טלפון תלמיד': student.studentPhone,
        'פעילות אחרונה': student.lastActivity,
        'סטטוס': student.status === 'active' ? 'פעיל' : 
                 student.status === 'debt' ? 'חוב' : 'יתרה נמוכה'
      }));
      break;
    case 'debts':
      reportData = students.filter(student => student.balance < 0).map(student => ({
        'שם מלא': `${student?.first_name} ${student?.last_name || ''}`,
        'כיתה': student.grade,
        'חוב': `₪${Math.abs(student.balance || 0).toFixed(2)}`,
        'טלפון הורה': student.users?.phone,
        'הערות': student.notes || 'אין הערות'
      }));
      break;
    default:
      reportData = transactions.map(payment => ({
        'שם תלמיד': payment.students ? `${payment.students.first_name || ''} ${payment.students.last_name || ''}` : `תלמיד ${payment.student_id}`,
        'סכום': `₪${(payment.amount || 0).toFixed(2)}`,
        'אמצעי תשלום': payment.payment_method || 'לא ידוע',
        'זמן': payment.transaction_date ? new Date(payment.transaction_date).toLocaleString('he-IL') : 'לא ידוע',
        'מספר קבלה': payment.id || 'לא ידוע'
      }));
  }
  
  // הצג את הדוח על המסך במקום להוריד
  setCurrentReport(reportData);
  setReportType(reports[type]);
  setShowReportModal(true);
};

const downloadReport = () => {
  if (!currentReport || !reportType) return;
  
  // יצירת worksheet
  const ws = XLSX.utils.json_to_sheet(currentReport);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, reportType);
  
  // הורדת הקובץ
  const filename = `${reportType}_${new Date().toISOString().split('T')[0]}.xlsx`;
  XLSX.writeFile(wb, filename);
};
    
  

  const filteredStudents = students.filter(student => 
  student && student.first_name && 
  (`${student.first_name} ${student?.last_name || ''}`.includes(searchQuery) ||
   student.users?.phone?.includes(searchQuery) ||
   student.student_phone?.includes(searchQuery) ||
   student.users?.email?.toLowerCase().includes(searchQuery.toLowerCase()))
);

  const filteredPayments = transactions.filter(payment =>
  `${payment.students?.first_name || ''} ${payment.students?.last_name || ''}`.includes(searchQuery) ||
  payment.description?.includes(searchQuery) ||
  payment.payment_method?.includes(searchQuery)
);

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      {/* כותרת עם סטטיסטיקות */}
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
          margin: '0 auto',
          flexWrap: 'wrap',
          gap: '1rem'
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
              <Receipt size={28} color="white" />
            </div>
            <div>
              <div style={{
                fontSize: '1.6rem',
                fontWeight: 'bold',
                color: '#667eea'
              }}>
                פאנל מזכירה
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#666',
                marginTop: '0.25rem'
              }}>
               {schoolName || 'בית ספר'} • עדכון אחרון: {dailyStats.lastUpdate.toLocaleTimeString('he-IL')}
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
                ₪{(dailyStats.totalPayments || 0).toFixed(0)}
              </p>
              <p style={{
                fontSize: '0.8rem',
                color: '#666',
                margin: '0.25rem 0 0 0'
              }}>
                תשלומים היום
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
            <div style={{ textAlign: 'center' }}>
              <p style={{
                fontSize: '1.2rem',
                fontWeight: 'bold',
                color: dailyStats.pendingApprovals > 0 ? '#f44336' : '#4CAF50',
                margin: 0
              }}>
                {dailyStats.pendingApprovals}
              </p>
              <p style={{
                fontSize: '0.8rem',
                color: '#666',
                margin: '0.25rem 0 0 0'
              }}>
                ממתינים לאישור
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
                {currentUser?.name || 'מזכירה'}
              </div>
              <div style={{
                fontSize: '0.9rem',
                color: '#777'
              }}>
                מזכירה ראשית
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button 
  style={{
    background: '#f8f9fa',
    border: 'none',
    borderRadius: '12px',
    padding: '1rem',
    cursor: 'pointer',
    transition: 'all 0.3s'
  }}
  onClick={() => setShowAdminPanel(true)}
  title="הגדרות מתקדמות"
>
  <Settings size={20} />
</button>

              <button 
                style={{
                  background: '#f8f9fa',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
                onClick={() => navigate('/')}
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        padding: '2rem'
      }}>
        {/* טאבים */}
        <div style={{
          display: 'flex',
          gap: '0.5rem',
          marginBottom: '2rem',
          background: 'rgba(255, 255, 255, 0.95)',
          padding: '0.75rem',
          borderRadius: '16px',
          boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(20px)'
        }}>
          <button
            onClick={() => setActiveTab('payments')}
            style={{
              padding: '1rem 2rem',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontWeight: '600',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: activeTab === 'payments' ? 
                'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
              color: activeTab === 'payments' ? 'white' : '#667eea',
              boxShadow: activeTab === 'payments' ? 
                '0 4px 15px rgba(102, 126, 234, 0.3)' : 'none'
            }}
          >
            <DollarSign size={20} />
            תשלומים
          </button>
          
          <button
            onClick={() => setActiveTab('students')}
            style={{
              padding: '1rem 2rem',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontWeight: '600',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: activeTab === 'students' ? 
                'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
              color: activeTab === 'students' ? 'white' : '#667eea',
              boxShadow: activeTab === 'students' ? 
                '0 4px 15px rgba(102, 126, 234, 0.3)' : 'none'
            }}
          >
            <Users size={20} />
            תלמידים
          </button>

          <button
            onClick={() => setActiveTab('registrations')}
            style={{
              padding: '1rem 2rem',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontWeight: '600',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: activeTab === 'registrations' ? 
                'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
              color: activeTab === 'registrations' ? 'white' : '#667eea',
              boxShadow: activeTab === 'registrations' ? 
                '0 4px 15px rgba(102, 126, 234, 0.3)' : 'none',
              position: 'relative'
            }}
          >
            <UserCheck size={20} />
            הרשמות חדשות
            {pendingRegistrations.length > 0 && (
              <span style={{
                background: '#f44336',
                color: 'white',
                borderRadius: '50%',
                width: '20px',
                height: '20px',
                fontSize: '0.75rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginLeft: '0.5rem',
                animation: 'pulse 2s infinite'
              }}>
                {pendingRegistrations.length}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('reports')}
            style={{
              padding: '1rem 2rem',
              borderRadius: '12px',
              border: 'none',
              cursor: 'pointer',
              transition: 'all 0.3s',
              fontWeight: '600',
              fontSize: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              background: activeTab === 'reports' ? 
                'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
              color: activeTab === 'reports' ? 'white' : '#667eea',
              boxShadow: activeTab === 'reports' ? 
                '0 4px 15px rgba(102, 126, 234, 0.3)' : 'none'
            }}
          >
            <FileText size={20} />
            דוחות
          </button>
        </div>

        {/* תוכן ראשי */}
        <div style={{
          background: 'rgba(255, 255, 255, 0.95)',
          borderRadius: '20px',
          padding: '2.5rem',
          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
          backdropFilter: 'blur(20px)',
          minHeight: '600px'
        }}>
          
          {/* טאב תשלומים */}
          {activeTab === 'payments' && (
            <>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <DollarSign size={32} />
                ניהול תשלומים
              </h2>

              {/* סטטיסטיקות מפורטות */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                gap: '1.5rem',
                marginBottom: '2.5rem'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1))',
                  padding: '2rem',
                  borderRadius: '16px',
                  textAlign: 'center',
                  border: '1px solid rgba(102, 126, 234, 0.1)'
                }}>
                  <p style={{
                    fontSize: '2.2rem',
                    fontWeight: 'bold',
                    color: '#667eea',
                    margin: '0 0 0.5rem 0'
                  }}>
                    ₪{(dailyStats.totalPayments || 0).toFixed(2)}
                  </p>
                  <p style={{
                    color: '#666',
                    fontSize: '0.95rem',
                    fontWeight: '500'
                  }}>
                    סה״כ תשלומים היום
                  </p>
                </div>
                
                <div style={{
                  background: 'linear-gradient(135deg, rgba(76, 175, 80, 0.1), rgba(69, 160, 73, 0.1))',
                  padding: '2rem',
                  borderRadius: '16px',
                  textAlign: 'center',
                  border: '1px solid rgba(76, 175, 80, 0.1)'
                }}>
                  <p style={{
                    fontSize: '2.2rem',
                    fontWeight: 'bold',
                    color: '#4CAF50',
                    margin: '0 0 0.5rem 0'
                  }}>
                    {dailyStats.transactionCount}
                  </p>
                  <p style={{
                    color: '#666',
                    fontSize: '0.95rem',
                    fontWeight: '500'
                  }}>
                    עסקאות היום
                  </p>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(245, 124, 0, 0.1))',
                  padding: '2rem',
                  borderRadius: '16px',
                  textAlign: 'center',
                  border: '1px solid rgba(255, 152, 0, 0.1)'
                }}>
                  <p style={{
                    fontSize: '2.2rem',
                    fontWeight: 'bold',
                    color: '#FF9800',
                    margin: '0 0 0.5rem 0'
                  }}>
                    ₪{(dailyStats.averageTransaction || 0 ).toFixed(0)}
                  </p>
                  <p style={{
                    color: '#666',
                    fontSize: '0.95rem',
                    fontWeight: '500'
                  }}>
                    ממוצע עסקה
                  </p>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, rgba(244, 67, 54, 0.1), rgba(211, 47, 47, 0.1))',
                  padding: '2rem',
                  borderRadius: '16px',
                  textAlign: 'center',
                  border: '1px solid rgba(244, 67, 54, 0.1)'
                }}>
                  <p style={{
                    fontSize: '2.2rem',
                    fontWeight: 'bold',
                    color: '#f44336',
                    margin: '0 0 0.5rem 0'
                  }}>
                    {dailyStats.lowBalanceStudents}
                  </p>
                  <p style={{
                    color: '#666',
                    fontSize: '0.95rem',
                    fontWeight: '500'
                  }}>
                    יתרות נמוכות
                  </p>
                </div>
              </div>

              {/* כלי חיפוש ופילטור */}
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                flexWrap: 'wrap',
                gap: '1rem',
                padding: '1rem',
                background: '#f8f9fa',
                borderRadius: '12px'
              }}>
                <div style={{
                  position: 'relative',
                  maxWidth: '350px',
                  flex: 1
                }}>
                  <Search size={20} style={{
                    position: 'absolute',
                    left: '1.25rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#999'
                  }} />
                  <input
                    type="text"
                    placeholder="חפש תלמיד, הורה או מספר קבלה..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '1rem 1rem 1rem 3.5rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '25px',
                      fontSize: '1rem',
                      transition: 'all 0.3s',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
                
                <div style={{
                  display: 'flex',
                  gap: '1rem',
                  alignItems: 'center'
                }}>
                  <select 
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value)}
                    style={{
                      padding: '0.75rem 1rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '12px',
                      fontSize: '0.9rem',
                      background: 'white',
                      cursor: 'pointer'
                    }}
                  >
                    <option value="today">היום</option>
                    <option value="week">השבוע</option>
                    <option value="month">החודש</option>
                    <option value="all">הכל</option>
                  </select>
                  
                  <button
                  
  onClick={() => {
    setPaymentForm({
      studentId: '',
      amount: '',
      paymentMethod: 'cash',
      checkNumber: '',
      bankName: '',
      notes: ''
    });
    setShowAddPayment(true);
  }}

                    style={{
                      background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                      color: 'white',
                      border: 'none',
                      padding: '1rem 2rem',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      transition: 'all 0.3s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      fontSize: '1rem',
                      fontWeight: '600',
                      boxShadow: '0 6px 20px rgba(76, 175, 80, 0.3)'
                    }}
                  >
                    <Plus size={20} />
                    הוסף תשלום
                  </button>
                </div>
              </div>

              {/* טבלת תשלומים */}
              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
                }}>
                  <thead style={{
                    background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)'
                  }}>
                    <tr>
                      <th style={{
                        padding: '1.25rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#555',
                        borderBottom: '2px solid #e0e0e0',
                        fontSize: '0.95rem'
                      }}>פעולות</th>
                      <th style={{
                        padding: '1.25rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#555',
                        borderBottom: '2px solid #e0e0e0',
                        fontSize: '0.95rem'
                      }}>הערות</th>
                      <th style={{
                        padding: '1.25rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#555',
                        borderBottom: '2px solid #e0e0e0',
                        fontSize: '0.95rem'
                      }}>מספר קבלה</th>
                      <th style={{
                        padding: '1.25rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#555',
                        borderBottom: '2px solid #e0e0e0',
                        fontSize: '0.95rem'
                      }}>זמן</th>
                      <th style={{
                        padding: '1.25rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#555',
                        borderBottom: '2px solid #e0e0e0',
                        fontSize: '0.95rem'
                      }}>אמצעי תשלום</th>
                      <th style={{
                        padding: '1.25rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#555',
                        borderBottom: '2px solid #e0e0e0',
                        fontSize: '0.95rem'
                      }}>סכום</th>
                      <th style={{
                        padding: '1.25rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#555',
                        borderBottom: '2px solid #e0e0e0',
                        fontSize: '0.95rem'
                      }}>תלמיד</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map(payment => (
                      <tr key={payment.id} style={{
                        transition: 'all 0.3s',
                        cursor: 'pointer'
                      }}>
                        <td style={{
                          padding: '1.25rem',
                          textAlign: 'right',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '0.9rem'
                        }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#666', padding: '0.25rem',
                              borderRadius: '4px',
                              transition: 'background 0.3s'
                            }}
                            title="צפה בפרטים"
                            >
                              <Eye size={16} />
                            </button>
                            <button style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#666', padding: '0.25rem',
                              borderRadius: '4px',
                              transition: 'background 0.3s'
                            }}
                            title="הדפס קבלה"
                            >
                              <Printer size={16} />
                            </button>
                          </div>
                        </td>
                        <td style={{
                          padding: '1.25rem',
                          textAlign: 'right',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '0.9rem'
                        }}>
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>
                            {payment.description || '-'}
                          </span>
                        </td>
                        <td style={{
                          padding: '1.25rem',
                          textAlign: 'right',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '0.9rem'
                        }}>
                          <span style={{ fontWeight: '600', color: '#667eea' }}>
                            {payment.id || '-'}
                          </span>
                        </td>
                        <td style={{
                          padding: '1.25rem',
                          textAlign: 'right',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '0.9rem'
                        }}>{new Date(payment.transaction_date).toLocaleString('he-IL')}</td>
                        <td style={{
                          padding: '1.25rem',
                          textAlign: 'right',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '0.9rem'
                        }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.4rem 1rem',
                            borderRadius: '16px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            background: payment.method === 'cash' ? '#e8f5e8' :
                                       payment.method === 'check' ? '#e3f2fd' :
                                       payment.method === 'bit' ? '#f3e5f5' :
                                       payment.method === 'credit_card' ? '#fff8e1' : '#fce4ec',
                            color: payment.method === 'cash' ? '#2e7d32' :
                                  payment.method === 'check' ? '#1976d2' :
                                  payment.method === 'bit' ? '#7b1fa2' :
                                  payment.method === 'credit_card' ? '#f57c00' : '#c2185b'
                          }}>
                            {payment.payment_method === 'cash' ? 'מזומן' :
payment.payment_method === 'check' ? 'שיק' :
payment.payment_method === 'bit' ? 'ביט' :
payment.payment_method === 'credit_card' ? 'כרטיס אשראי' : 'התאמה'}
                          </span>
                        </td>
                        <td style={{
                          padding: '1.25rem',
                          textAlign: 'right',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '0.9rem'
                        }}>
                          <span style={{
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            color: '#4CAF50'
                          }}>
                            +₪{(payment.amount || 0).toFixed(2)}
                          </span>
                        </td>
                        <td style={{
                          padding: '1.25rem',
                          textAlign: 'right',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '0.9rem'
                        }}>
                          <span style={{
                            fontWeight: '600',
                            color: '#333'
                          }}>{payment.students?.first_name} {payment.students?.last_name || ''}</span>
                          <br />
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>
                            
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* טאב תלמידים */}
          {activeTab === 'students' && (
            <>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <Users size={32} />
                ניהול תלמידים
              </h2>

              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '2rem',
                flexWrap: 'wrap',
                gap: '1rem',
                padding: '1rem',
                background: '#f8f9fa',
                borderRadius: '12px'
              }}>
                <div style={{
                  position: 'relative',
                  maxWidth: '350px',
                  flex: 1
                }}>
                  <Search size={20} style={{
                    position: 'absolute',
                    left: '1.25rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#999'
                  }} />
                  <input
                    type="text"
                    placeholder="חפש תלמיד, הורה או טלפון..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '1rem 1rem 1rem 3.5rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '25px',
                      fontSize: '1rem',
                      transition: 'all 0.3s',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>

              <div style={{ overflowX: 'auto' }}>
                <table style={{
                  width: '100%',
                  borderCollapse: 'separate',
                  borderSpacing: 0,
                  background: 'white',
                  borderRadius: '12px',
                  overflow: 'hidden',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)'
                }}>
                  <thead style={{
                    background: 'linear-gradient(135deg, #f8f9fa, #e9ecef)'
                  }}>
                    <tr>
                      <th style={{
                        padding: '1.25rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#555',
                        borderBottom: '2px solid #e0e0e0',
                        fontSize: '0.95rem'
                      }}>פעולות</th>
                      <th style={{
                        padding: '1.25rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#555',
                        borderBottom: '2px solid #e0e0e0',
                        fontSize: '0.95rem'
                      }}>סטטוס</th>
                      <th style={{
                        padding: '1.25rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#555',
                        borderBottom: '2px solid #e0e0e0',
                        fontSize: '0.95rem'
                      }}>פעילות אחרונה</th>
                      <th style={{
                        padding: '1.25rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#555',
                        borderBottom: '2px solid #e0e0e0',
                        fontSize: '0.95rem'
                      }}>טלפון הורה</th>
                      <th style={{
                        padding: '1.25rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#555',
                        borderBottom: '2px solid #e0e0e0',
                        fontSize: '0.95rem'
                      }}>יתרה</th>
                      <th style={{
                        padding: '1.25rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#555',
                        borderBottom: '2px solid #e0e0e0',
                        fontSize: '0.95rem'
                      }}>כיתה</th>
                      <th style={{
                        padding: '1.25rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        color: '#555',
                        borderBottom: '2px solid #e0e0e0',
                        fontSize: '0.95rem'
                      }}>שם</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => (
                      <tr 
                        key={student.id} 
                        style={{
                          transition: 'all 0.3s',
                          cursor: 'pointer'
                        }}
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowStudentDetails(true);
                        }}
                      >
                        <td style={{
                          padding: '1.25rem',
                          textAlign: 'right',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '0.9rem'
                        }}>
                          <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#667eea', padding: '0.25rem',
                              borderRadius: '4px',
                              transition: 'background 0.3s'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudent(student);
                              setShowStudentDetails(true);
                            }}
                            title="עריכת פרטים"
                            >
                              <Edit size={16} />
                            </button>
                            <button style={{
                              background: 'none', border: 'none', cursor: 'pointer',
                              color: '#667eea', padding: '0.25rem',
                              borderRadius: '4px',
                              transition: 'background 0.3s'
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudent(student);
                              setShowAddPayment(true);
                              setPaymentForm(prev => ({...prev, studentId: student.id.toString()}));
                            }}
                            title="הוסף תשלום"
                            >
                              <Wallet size={16} />
                            </button>
                          </div>
                        </td>
                        <td style={{
                          padding: '1.25rem',
                          textAlign: 'right',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '0.9rem'
                        }}>
                          <span style={{
                            display: 'inline-block',
                            padding: '0.4rem 1rem',
                            borderRadius: '20px',
                            fontSize: '0.8rem',
                            fontWeight: '600',
                            background: student.status === 'active' ? '#e8f5e8' :
                                       student.status === 'debt' ? '#ffebee' : '#fff3e0',
                            color: student.status === 'active' ? '#2e7d32' :
                                  student.status === 'debt' ? '#c62828' : '#f57c00'
                          }}>
                            {student.status === 'active' ? 'פעיל' :
                             student.status === 'debt' ? 'חוב' : 'יתרה נמוכה'}
                          </span>
                        </td>
                        <td style={{
                          padding: '1.25rem',
                          textAlign: 'right',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '0.9rem'
                        }}>{student.lastActivity}</td>
                        <td style={{
                          padding: '1.25rem',
                          textAlign: 'right',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '0.9rem'
                        }}>
                          {student.users?.phone}
                          
                        </td>
                        <td style={{
                          padding: '1.25rem',
                          textAlign: 'right',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '0.9rem'
                        }}>
                          <span style={{
                            fontWeight: 'bold',
                            fontSize: '1rem',
                            color: student.balance >= 0 ? 
                                   student.balance > 20 ? '#4CAF50' : '#FF9800' :
                                   '#f44336'
                          }}>
                            ₪{(student.balance || 0).toFixed(2)}
                          </span>
                        </td>
                        <td style={{
                          padding: '1.25rem',
                          textAlign: 'right',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '0.9rem'
                        }}>{student.grade}</td>
                        <td style={{
                          padding: '1.25rem',
                          textAlign: 'right',
                          borderBottom: '1px solid #f0f0f0',
                          fontSize: '0.9rem'
                        }}>
                          <span style={{
                            fontWeight: '600',
                            color: '#333'
                          }}>
                            {student?.first_name} {student?.last_name || ''}
                          </span>
                          <br />
                          <span style={{ fontSize: '0.8rem', color: '#666' }}>
                            {student.className}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}



          {/* טאב הרשמות */}
          {activeTab === 'registrations' && (
  <>
    <h2 style={{
      fontSize: '1.8rem',
      fontWeight: 'bold',
      color: '#333',
      marginBottom: '2rem',
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    }}>
      <UserCheck size={32} />
      הרשמות ממתינות לאישור
      {pendingRegistrations && pendingRegistrations.length > 0 && (
        <span style={{
          background: '#f44336',
          color: 'white',
          borderRadius: '50%',
          width: '30px',
          height: '30px',
          fontSize: '0.9rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontWeight: 'bold'
        }}>
          {pendingRegistrations.length}
        </span>
      )}
    </h2>

    {!pendingRegistrations || pendingRegistrations.length === 0 ? (
      <div style={{
        textAlign: 'center',
        padding: '4rem',
        color: '#999'
      }}>
        <CheckCircle size={60} style={{ opacity: 0.5, marginBottom: '1rem' }} />
        <h3 style={{ marginBottom: '0.5rem' }}>אין הרשמות ממתינות</h3>
        <p>כל ההרשמות אושרו או נדחו</p>
      </div>
    ) : (
      <div style={{
        display: 'grid',
        gap: '1.5rem'
      }}>
        {pendingRegistrations.map(registration => {
          const children = JSON.parse(registration.children_data || '[]');
          return (
            <div key={registration.id} style={{
              background: 'white',
              border: '2px solid #f0f0f0',
              borderRadius: '16px',
              padding: '2rem',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
              transition: 'all 0.3s'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1.5rem'
              }}>
                <div>
                  <h3 style={{
                    fontSize: '1.3rem',
                    fontWeight: 'bold',
                    color: '#333',
                    margin: '0 0 0.5rem 0'
                  }}>
                    {registration.parent_name}
                  </h3>
                  <p style={{
                    color: '#666',
                    fontSize: '0.9rem',
                    margin: '0.25rem 0'
                  }}>
                    {registration.parent_phone} • {registration.parent_email}
                  </p>
                  <p style={{
                    color: '#666',
                    fontSize: '0.9rem',
                    margin: '0.25rem 0'
                  }}>
                    הוגש: {new Date(registration.created_at).toLocaleString('he-IL')}
                  </p>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => handleApproveRegistration(registration.id, false)}
                    style={{
                      background: 'linear-gradient(135deg, #ffebee, #ffcdd2)',
                      color: '#c62828',
                      border: '2px solid #ffcdd2',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.3s'
                    }}
                  >
                    <X size={16} />
                    דחה
                  </button>
                  
                  <button
                    onClick={() => handleApproveRegistration(registration.id, true)}
                    style={{
                      background: 'linear-gradient(135deg, #e8f5e8, #c8e6c9)',
                      color: '#2e7d32',
                      border: '2px solid #c8e6c9',
                      padding: '0.75rem 1.5rem',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      transition: 'all 0.3s'
                    }}
                  >
                    <Check size={16} />
                    אשר
                  </button>
                </div>
              </div>
              
              <div style={{
                background: '#f8f9fa',
                padding: '1rem',
                borderRadius: '8px',
                marginBottom: '1rem'
              }}>
                <h4 style={{
                  fontSize: '1rem',
                  fontWeight: '600',
                  margin: '0 0 0.75rem 0',
                  color: '#555'
                }}>
                  ילדים להרשמה:
                </h4>
                {children.map((child, index) => (
                  <div key={index} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 0',
                    borderBottom: index < children.length - 1 ? '1px solid #e0e0e0' : 'none'
                  }}>
                    <span style={{ fontWeight: '600' }}>
                      {child.firstName} {child.lastName}
                    </span>
                    <div style={{ fontSize: '0.9rem', color: '#666' }}>
                      <span>כיתה {child.grade}</span> • <span>{child.phone}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    )}
  </>
)}
          {/* טאב דוחות */}
          {activeTab === 'reports' && (
            <>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 'bold',
                color: '#333',
                marginBottom: '2rem',
                display: 'flex',
                alignItems: 'center',
                gap: '1rem'
              }}>
                <FileText size={32} />
                דוחות ונתונים
              </h2>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                gap: '2rem'
              }}>
                <div style={{
                  background: 'linear-gradient(135deg, #ffffff, #f8f9fa)',
                  padding: '2rem',
                  borderRadius: '16px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                  textAlign: 'center',
                  border: '1px solid #e9ecef',
                  transition: 'all 0.3s'
                }}>
                  <AlertCircle size={40} style={{ color: '#f44336', marginBottom: '1rem' }} />
                  <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>דוח חובות</h3>
                  <p style={{ color: '#666', marginBottom: '2rem', lineHeight: '1.5' }}>
                    תלמידים עם יתרה שלילית וחובות פתוחים
                  </p>
                  <button
                    onClick={() => generateReport('debts')}
                    style={{
                      background: 'linear-gradient(135deg, #f44336, #d32f2f)',
                      color: 'white',
                      border: 'none',
                      padding: '1rem 2rem',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      margin: '0 auto',
                      transition: 'all 0.3s'
                    }}
                  >
                    <Download size={16} />
                    הורד דוח חובות
                  </button>
                </div>

                <div style={{
                  background: 'linear-gradient(135deg, #ffffff, #f8f9fa)',
                  padding: '2rem',
                  borderRadius: '16px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                  textAlign: 'center',
                  border: '1px solid #e9ecef',
                  transition: 'all 0.3s'
                }}>
                  <Users size={40} style={{ color: '#FF9800', marginBottom: '1rem' }} />
                  <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>דוח תלמידים</h3>
                  <p style={{ color: '#666', marginBottom: '2rem', lineHeight: '1.5' }}>
                    יתרות, פעילות וסטטיסטיקות כל התלמידים
                  </p>
                  <button
                    onClick={() => generateReport('students')}
                    style={{
                      background: 'linear-gradient(135deg, #FF9800, #f57c00)',
                      color: 'white',
                      border: 'none',
                      padding: '1rem 2rem',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      margin: '0 auto',
                      transition: 'all 0.3s'
                    }}
                  >
                    <Download size={16} />
                    הורד דוח תלמידים
                  </button>
                </div>

                {/* דוח נוסף - שבועי */}
                <div style={{
                  background: 'linear-gradient(135deg, #ffffff, #f8f9fa)',
                  padding: '2rem',
                  borderRadius: '16px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                  textAlign: 'center',
                  border: '1px solid #e9ecef',
                  transition: 'all 0.3s'
                }}>
                  <Calendar size={40} style={{ color: '#9C27B0', marginBottom: '1rem' }} />
                  <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>דוח שבועי</h3>
                  <p style={{ color: '#666', marginBottom: '2rem', lineHeight: '1.5' }}>
                    סיכום פעילות שבועית והשוואות
                  </p>
                  <button
                    onClick={() => generateReport('weekly')}
                    style={{
                      background: 'linear-gradient(135deg, #9C27B0, #7B1FA2)',
                      color: 'white',
                      border: 'none',
                      padding: '1rem 2rem',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      margin: '0 auto',
                      transition: 'all 0.3s'
                    }}
                  >
                    <Download size={16} />
                    הורד דוח שבועי
                  </button>
                </div>

                {/* דוח מותאם אישית */}
                <div style={{
                  background: 'linear-gradient(135deg, #ffffff, #f8f9fa)',
                  padding: '2rem',
                  borderRadius: '16px',
                  boxShadow: '0 4px 16px rgba(0, 0, 0, 0.05)',
                  textAlign: 'center',
                  border: '1px solid #e9ecef',
                  transition: 'all 0.3s'
                }}>
                  <Settings size={40} style={{ color: '#607D8B', marginBottom: '1rem' }} />
                  <h3 style={{ margin: '0 0 1rem 0', color: '#333' }}>דוח מותאם אישית</h3>
                  <p style={{ color: '#666', marginBottom: '2rem', lineHeight: '1.5' }}>
                    בחר תאריכים ונתונים ספציפיים
                  </p>
                  <button
                    onClick={() => {
  const reportType = prompt('בחר סוג דוח:\n1 - תלמידים\n2 - חובות\n3 - תשלומים\nהכנס מספר:');
  
  if (reportType === '1') {
    generateReport('students');
  } else if (reportType === '2') {
    generateReport('debts');
  } else if (reportType === '3') {
    generateReport('daily');
  } else {
    alert('בחירה לא תקינה');
  }
}}

                    style={{
                      background: 'linear-gradient(135deg, #607D8B, #455A64)',
                      color: 'white',
                      border: 'none',
                      padding: '1rem 2rem',
                      borderRadius: '25px',
                      cursor: 'pointer',
                      fontWeight: '600',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      margin: '0 auto',
                      transition: 'all 0.3s'
                    }}
                  >
                    <Settings size={16} />
                    צור דוח מותאם
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* מודל הוספת תשלום */}
      {showAddPayment && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '2.5rem',
            maxWidth: '600px', width: '100%', maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{
              fontSize: '1.8rem', fontWeight: 'bold', color: '#333',
              marginBottom: '2rem', textAlign: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
            }}>
              <DollarSign size={28} />
              הוספת תשלום ידני
            </h3>
            
            <div style={{ marginBottom: '2rem' }}>
  <label style={{
    display: 'block', fontSize: '1rem', fontWeight: '600',
    color: '#333', marginBottom: '0.5rem', textAlign: 'right'
  }}>תלמיד</label>
  
  {paymentForm.studentId ? (
  // אם יש תלמיד נבחר מראש - הצג עם אפשרות שינוי
  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
    <div style={{
      flex: 1, padding: '0.75rem', border: '2px solid #e0e0e0',
      borderRadius: '12px', fontSize: '1rem', background: '#f8f9fa',
      textAlign: 'right', color: '#333'
    }}>
      {(() => {
  const student = students.find(s => String(s.id) === String(paymentForm.studentId));
  return student ? `${student.first_name} ${student.last_name} - כיתה ${student.grade}` : 'תלמיד לא נמצא';
})()}
    </div>
    <button
      type="button"
      onClick={() => setPaymentForm(prev => ({...prev, studentId: ''}))}
      style={{
        padding: '0.75rem', border: '2px solid #f44336', borderRadius: '8px',
        background: 'white', color: '#f44336', cursor: 'pointer',
        fontSize: '0.8rem', fontWeight: '600'
      }}
    >
      שנה
    </button>
  </div>
) : ( 

    // אם אין תלמיד נבחר - הצג dropdown
    <select
      value={paymentForm.studentId}
      onChange={(e) => setPaymentForm(prev => ({...prev, studentId: e.target.value}))}
      style={{
        width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
        borderRadius: '12px', fontSize: '1rem', transition: 'all 0.3s',
        boxSizing: 'border-box', textAlign: 'right', background: 'white'
      }}
    >
      <option value="">בחר תלמיד...</option>
      {students.map(student => (
  <option key={student.id} value={student.id}>
    {student?.first_name} {student?.last_name || ''} - כיתה {student.grade} (יתרה: ₪{(student.balance || 0).toFixed(2)})
  </option>
))}
    </select>
  )}
</div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block', fontSize: '1rem', fontWeight: '600',
                color: '#333', marginBottom: '0.5rem', textAlign: 'right'
              }}>סכום (ש״ח)</label>
              <input
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm(prev => ({...prev, amount: e.target.value}))}
                placeholder="הכנס סכום..."
                style={{
                  width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                  borderRadius: '12px', fontSize: '1rem', transition: 'all 0.3s',
                  boxSizing: 'border-box', textAlign: 'right'
                }}
                step="0.50"
              />
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block', fontSize: '1rem', fontWeight: '600',
                color: '#333', marginBottom: '0.5rem', textAlign: 'right'
              }}>אמצעי תשלום</label>
              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem'
              }}>
                <div
                  onClick={() => setPaymentForm(prev => ({...prev, paymentMethod: 'cash'}))}
                  style={{
                    padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '12px',
                    cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center',
                    fontSize: '0.9rem', fontWeight: '600',
                    borderColor: paymentForm.paymentMethod === 'cash' ? '#667eea' : '#e0e0e0',
                    background: paymentForm.paymentMethod === 'cash' ? '#f3f4ff' : 'white',
                    color: paymentForm.paymentMethod === 'cash' ? '#667eea' : '#666'
                  }}
                >
                  מזומן
                </div>
                <div
                  onClick={() => setPaymentForm(prev => ({...prev, paymentMethod: 'check'}))}
                  style={{
                    padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '12px',
                    cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center',
                    fontSize: '0.9rem', fontWeight: '600',
                    borderColor: paymentForm.paymentMethod === 'check' ? '#667eea' : '#e0e0e0',
                    background: paymentForm.paymentMethod === 'check' ? '#f3f4ff' : 'white',
                    color: paymentForm.paymentMethod === 'check' ? '#667eea' : '#666'
                  }}
                >
                  שיק
                </div>
                <div
                  onClick={() => setPaymentForm(prev => ({...prev, paymentMethod: 'bit'}))}
                  style={{
                    padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '12px',
                    cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center',
                    fontSize: '0.9rem', fontWeight: '600',
                    borderColor: paymentForm.paymentMethod === 'bit' ? '#667eea' : '#e0e0e0',
                    background: paymentForm.paymentMethod === 'bit' ? '#f3f4ff' : 'white',
                    color: paymentForm.paymentMethod === 'bit' ? '#667eea' : '#666'
                  }}
                >
                  ביט
                </div>
                <div
                  onClick={() => setPaymentForm(prev => ({...prev, paymentMethod: 'adjustment'}))}
                  style={{
                    padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '12px',
                    cursor: 'pointer', transition: 'all 0.3s', textAlign: 'center',
                    fontSize: '0.9rem', fontWeight: '600',
                    borderColor: paymentForm.paymentMethod === 'adjustment' ? '#667eea' : '#e0e0e0',
                    background: paymentForm.paymentMethod === 'adjustment' ? '#f3f4ff' : 'white',
                    color: paymentForm.paymentMethod === 'adjustment' ? '#667eea' : '#666'
                  }}
                >
                  התאמה
                </div>
              </div>
            </div>

            {paymentForm.paymentMethod === 'check' && (
              <>
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    display: 'block', fontSize: '1rem', fontWeight: '600',
                    color: '#333', marginBottom: '0.5rem', textAlign: 'right'
                  }}>מספר שיק</label>
                  <input
                    type="text"
                    value={paymentForm.checkNumber}
                    onChange={(e) => setPaymentForm(prev => ({...prev, checkNumber: e.target.value}))}
                    placeholder="הכנס מספר שיק..."
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                      borderRadius: '12px', fontSize: '1rem', transition: 'all 0.3s',
                      boxSizing: 'border-box', textAlign: 'right'
                    }}
                  />
                </div>
                
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{
                    display: 'block', fontSize: '1rem', fontWeight: '600',
                    color: '#333', marginBottom: '0.5rem', textAlign: 'right'
                  }}>בנק</label>
                  <input
                    type="text"
                    value={paymentForm.bankName}
                    onChange={(e) => setPaymentForm(prev => ({...prev, bankName: e.target.value}))}
                    placeholder="שם הבנק..."
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                      borderRadius: '12px', fontSize: '1rem', transition: 'all 0.3s',
                      boxSizing: 'border-box', textAlign: 'right'
                    }}
                  />
                </div>
              </>
            )}

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block', fontSize: '1rem', fontWeight: '600',
                color: '#333', marginBottom: '0.5rem', textAlign: 'right'
              }}>הערות (אופציונלי)</label>
              <textarea
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm(prev => ({...prev, notes: e.target.value}))}
                placeholder="הערות נוספות..."
                style={{
                  width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                  borderRadius: '12px', fontSize: '1rem', transition: 'all 0.3s',
                  boxSizing: 'border-box', textAlign: 'right', minHeight: '80px',
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => setShowAddPayment(false)}
                style={{
                  padding: '0.75rem 2rem', borderRadius: '25px', border: 'none',
                  cursor: 'pointer', fontSize: '1rem', fontWeight: '600',
                  transition: 'all 0.3s', background: '#f5f5f5', color: '#666'
                }}
              >
                ביטול
              </button>
              
              <button
                onClick={handleAddPayment}
                style={{
                  padding: '0.75rem 2rem', borderRadius: '25px', border: 'none',
                  cursor: 'pointer', fontSize: '1rem', fontWeight: '600',
                  transition: 'all 0.3s', 
                  background: 'linear-gradient(135deg, #667eea, #764ba2)',
                  color: 'white', boxShadow: '0 4px 12px rgba(102, 126, 234, 0.3)',
                  opacity: (!paymentForm.studentId || !paymentForm.amount) ? 0.5 : 1
                }}
                disabled={!paymentForm.studentId || !paymentForm.amount}
              >
                שמור תשלום
              </button>
            </div>
          </div>
        </div>
      )}

      {/* מודל פרטי תלמיד */}
      {showStudentDetails && selectedStudent && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.7)', display: 'flex',
          alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '2.5rem',
            maxWidth: '700px', width: '100%', maxHeight: '90vh',
            overflowY: 'auto', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <h3 style={{
              fontSize: '1.8rem', fontWeight: 'bold', color: '#333',
              marginBottom: '2rem', textAlign: 'center',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem'
            }}>
              <User size={28} />
              פרטי תלמיד - {selectedStudent?.first_name} {selectedStudent?.last_name || ''}
            </h3>

            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem',
              marginBottom: '2rem'
            }}>
              <div style={{
                background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px'
              }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#555' }}>מידע כספי</h4>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>יתרה נוכחית:</strong>
                  <span style={{
                    fontWeight: 'bold', fontSize: '1.2rem', marginLeft: '0.5rem',
                    color: selectedStudent.balance >= 0 ? '#4CAF50' : '#f44336'
                  }}>
                    ₪{(selectedStudent.balance || 0).toFixed(2)}
                  </span>
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>הוצאות חודשיות:</strong> ₪{(selectedStudent.monthlySpent || 0).toFixed(2)}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>סה״כ הפקדות:</strong> ₪{(selectedStudent.totalDeposits || 0).toFixed(2)}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>סטטוס:</strong>
                  <span style={{
                    marginLeft: '0.5rem', padding: '0.25rem 0.75rem', borderRadius: '12px',
                    fontSize: '0.8rem', fontWeight: '600',
                    background: selectedStudent.status === 'active' ? '#e8f5e8' :
                               selectedStudent.status === 'debt' ? '#ffebee' : '#fff3e0',
                    color: selectedStudent.status === 'active' ? '#2e7d32' :
                          selectedStudent.status === 'debt' ? '#c62828' : '#f57c00'
                  }}>
                    {selectedStudent.status === 'active' ? 'פעיל' :
                     selectedStudent.status === 'debt' ? 'חוב' : 'יתרה נמוכה'}
                  </span>
                </div>
              </div>

              <div style={{
                background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px'
              }}>
                <h4 style={{ margin: '0 0 1rem 0', color: '#555' }}>פרטי קשר</h4>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>טלפון הורה:</strong> {selectedStudent.users?.phone}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>טלפון תלמיד:</strong> {selectedStudent.student_phone || 'לא מוגדר'}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>מייל הורה:</strong> {selectedStudent.users?.email}
                </div>
                <div style={{ marginBottom: '0.5rem' }}>
                  <strong>קשר חירום:</strong> {selectedStudent.emergencyContact}
                </div>
              </div>
            </div>

            <div style={{
              background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px',
              marginBottom: '2rem'
            }}>
              <h4 style={{ margin: '0 0 1rem 0', color: '#555' }}>פעילות אחרונה</h4>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>כניסה אחרונה:</strong> {selectedStudent.lastActivity}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>ארוחה אחרונה:</strong> {selectedStudent.lastMeal}
              </div>
              <div style={{ marginBottom: '0.5rem' }}>
                <strong>תאריך הרשמה:</strong> {selectedStudent.joinDate}
              </div>
              {selectedStudent.notes && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#fff3e0', borderRadius: '8px' }}>
                  <strong>הערות:</strong> {selectedStudent.notes}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button
                onClick={() => {
                  setShowStudentDetails(false);
                  setShowAddPayment(true);
                  setPaymentForm(prev => ({...prev, studentId: selectedStudent.id.toString()}));
                }}
                style={{
                  padding: '0.75rem 2rem', borderRadius: '25px', border: 'none',
                  cursor: 'pointer', fontSize: '1rem', fontWeight: '600',
                  transition: 'all 0.3s', 
                  background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                  color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                <Wallet size={16} />
                הוסף תשלום
              </button>
              
              <button
                onClick={() => alert('יופק כרטיס QR חדש לתלמיד')}
                style={{
                  padding: '0.75rem 2rem', borderRadius: '25px', border: 'none',
                  cursor: 'pointer', fontSize: '1rem', fontWeight: '600',
                  transition: 'all 0.3s', 
                  background: 'linear-gradient(135deg, #FF9800, #f57c00)',
                  color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem'
                }}
              >
                <QrCode size={16} />
                QR חדש
              </button>

              
<button
  onClick={() => loadParentDetails(selectedStudent.id)}
  style={{
    background: 'linear-gradient(135deg, #FF9800, #f57c00)',
    color: 'white',
    border: 'none',
    padding: '0.75rem 1.5rem',
    borderRadius: '25px',
    cursor: 'pointer',
    fontWeight: '600',
    fontSize: '0.9rem',
    marginLeft: '1rem'
  }}
>
  פרטי הורה
</button>

              
              <button
                onClick={() => setShowStudentDetails(false)}
                style={{
                  padding: '0.75rem 2rem', borderRadius: '25px', border: 'none',
                  cursor: 'pointer', fontSize: '1rem', fontWeight: '600',
                  transition: 'all 0.3s', background: '#f5f5f5', color: '#666'
                }}
              >
                סגור
              </button>
            </div>
          </div>
        </div>
      )}


{showParentDetails && parentDetails && (
  <div style={{
    position: 'fixed',
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
    background: 'rgba(0, 0, 0, 0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  }}>
    <div style={{
      background: 'white',
      borderRadius: '20px',
      padding: '2rem',
      width: '500px',
      maxHeight: '80vh',
      overflowY: 'auto',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
    }}>
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '2rem',
        borderBottom: '2px solid #f0f0f0',
        paddingBottom: '1rem'
      }}>
        <h2 style={{
          margin: 0,
          color: '#333',
          fontSize: '1.5rem'
        }}>
          פרטי הורה
        </h2>
        <button
          onClick={() => setShowParentDetails(false)}
          style={{
            background: 'none',
            border: 'none',
            fontSize: '1.5rem',
            cursor: 'pointer',
            color: '#999'
          }}
        >
          ×
        </button>
      </div>

      <div style={{
        background: '#f8f9fa',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '1.5rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#555' }}>
          פרטי קשר
        </h3>
        <div style={{ marginBottom: '1rem' }}>
          <strong>שם:</strong> {parentDetails.name}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>אימייל:</strong> {parentDetails.email}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>טלפון:</strong> {parentDetails.phone}
        </div>
      </div>

      <div style={{
        background: '#fff3cd',
        padding: '1.5rem',
        borderRadius: '12px',
        marginBottom: '1.5rem',
        border: '1px solid #ffeaa7'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#856404' }}>
          פרטי גישה למערכת
        </h3>
        <div style={{ marginBottom: '1rem' }}>
          <strong>אימייל כניסה:</strong> {parentDetails.email}
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <strong>סיסמה נוכחית:</strong> 
          <span style={{
            fontFamily: 'monospace',
            fontSize: '1.1rem',
            color: '#2196F3',
            marginRight: '0.5rem'
          }}>
            {parentDetails.password}
          </span>
        </div>
      </div>

      <div style={{
        display: 'flex',
        gap: '1rem',
        justifyContent: 'center'
      }}>
        <button
          onClick={() => alert('יצירת סיסמה חדשה - בפיתוח')}
          style={{
            background: 'linear-gradient(135deg, #4CAF50, #45a049)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          צור סיסמה חדשה
        </button>
        <button
          onClick={() => alert('שליחת פרטי גישה מחדש - בפיתוח')}
          style={{
            background: 'linear-gradient(135deg, #2196F3, #1976D2)',
            color: 'white',
            border: 'none',
            padding: '0.75rem 1.5rem',
            borderRadius: '25px',
            cursor: 'pointer',
            fontWeight: '600'
          }}
        >
          שלח פרטי גישה מחדש
        </button>
      </div>
    </div>
  </div>
)}

      {/* מודל Super Admin Panel */}
{showAdminPanel && (
  <div style={{
    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
    background: 'rgba(0, 0, 0, 0.8)', display: 'flex',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 1000, padding: '1rem'
  }}>
    <div style={{
      background: 'white', borderRadius: '20px', padding: '2.5rem',
      maxWidth: '600px', width: '100%', maxHeight: '90vh',
      overflowY: 'auto', boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
    }}>
      {!isAdminAuthenticated ? (
        // טופס סיסמה
        <>
          <h3 style={{
            fontSize: '1.8rem', fontWeight: 'bold', color: '#333',
            marginBottom: '2rem', textAlign: 'center'
          }}>
            הגדרות מתקדמות
          </h3>
          
          <div style={{ marginBottom: '2rem' }}>
            <label style={{
              display: 'block', fontSize: '1rem', fontWeight: '600',
              color: '#333', marginBottom: '0.5rem', textAlign: 'right'
            }}>סיסמת Super Admin</label>
            <input
              type="password"
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              style={{
                width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                borderRadius: '12px', fontSize: '1rem', transition: 'all 0.3s',
                boxSizing: 'border-box', textAlign: 'right'
              }}
              placeholder="הכנס סיסמה..."
            />
          </div>
          
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
            <button
              onClick={() => {
                setShowAdminPanel(false);
                setAdminPassword('');
              }}
              style={{
                padding: '0.75rem 2rem', borderRadius: '25px', border: 'none',
                cursor: 'pointer', fontSize: '1rem', fontWeight: '600',
                transition: 'all 0.3s', background: '#f5f5f5', color: '#666'
              }}
            >
              ביטול
            </button>
            
            <button
              onClick={async () => {
                try {
                  const response = await fetch('https://api.bonapp.dev/api/admin/auth', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ password: adminPassword })
                  });
                  const result = await response.json();
                  
                  if (result.success) {
                    setIsAdminAuthenticated(true);
                    setAdminPassword('');
                  } else {
                    alert('סיסמה שגויה');
                  }
                } catch (error) {
                  alert('שגיאה בחיבור לשרת');
                }
              }}
              style={{
                padding: '0.75rem 2rem', borderRadius: '25px', border: 'none',
                cursor: 'pointer', fontSize: '1rem', fontWeight: '600',
                transition: 'all 0.3s', 
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white'
              }}
            >
              כניסה
            </button>
          </div>
        </>
      ) : (
        // פאנל יצירת בית ספר
        <div>
  <h3 style={{
    fontSize: '1.8rem', fontWeight: 'bold', color: '#333',
    marginBottom: '2rem', textAlign: 'center'
  }}>
    Super Admin Panel
  </h3>
  
  {/* טופס יצירת בית ספר */}
  <div style={{ marginBottom: '2rem' }}>
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', textAlign: 'right' }}>שם בית הספר *</label>
      <input type="text" placeholder="בית ספר אורט כפר סבא" style={{
        width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px',
        fontSize: '1rem', textAlign: 'right', boxSizing: 'border-box'
      }} />
    </div>
    
    <div style={{ marginBottom: '1rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', textAlign: 'right' }}>כתובת</label>
      <input type="text" placeholder="רחוב הרצל 123, כפר סבא" style={{
        width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px',
        fontSize: '1rem', textAlign: 'right', boxSizing: 'border-box'
      }} />
    </div>
    
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', textAlign: 'right' }}>איש קשר</label>
        <input type="text" placeholder="מנהל ראשי" style={{
          width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px',
          fontSize: '1rem', textAlign: 'right', boxSizing: 'border-box'
        }} />
      </div>
      <div>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', textAlign: 'right' }}>טלפון</label>
        <input type="tel" placeholder="09-1234567" style={{
          width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px',
          fontSize: '1rem', textAlign: 'right', boxSizing: 'border-box'
        }} />
      </div>
    </div>
    
    <div style={{ marginBottom: '2rem' }}>
      <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', textAlign: 'right' }}>מייל</label>
      <input type="email" placeholder="office@school.co.il" style={{
        width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0', borderRadius: '8px',
        fontSize: '1rem', textAlign: 'left', boxSizing: 'border-box'
      }} />
    </div>
  </div>
  
  <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
    <button style={{
      padding: '0.75rem 2rem', borderRadius: '25px', border: 'none', cursor: 'pointer',
      fontSize: '1rem', fontWeight: '600', background: '#f5f5f5', color: '#666'
    }}
    onClick={() => {
      setShowAdminPanel(false);
      setIsAdminAuthenticated(false);
    }}>
      סגור
    </button>
    
    <button style={{
      padding: '0.75rem 2rem', borderRadius: '25px', border: 'none', cursor: 'pointer',
      fontSize: '1rem', fontWeight: '600', background: '#4CAF50', color: 'white'
    }}>
      צור בית ספר
    </button>
  </div>
</div>

      )}
    </div>
  </div>
)}

      {/* מודל הצגת דוח */}
      {showReportModal && currentReport && (
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
          zIndex: 9999,
          padding: '2rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2.5rem',
            maxWidth: '1200px',
            width: '100%',
            maxHeight: '90vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            {/* כותרת */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #e0e0e0'
            }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 'bold',
                color: '#333',
                margin: 0,
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem'
              }}>
                <FileText size={32} />
                {reportType}
              </h2>
              
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setCurrentReport(null);
                  setReportType('');
                }}
                style={{
                  background: '#f8f9fa',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* סיכום */}
            <div style={{
              background: '#f8f9fa',
              padding: '1rem',
              borderRadius: '12px',
              marginBottom: '1.5rem',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <div>
                <span style={{ fontWeight: '600', color: '#666' }}>סה"כ רשומות: </span>
                <span style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#667eea' }}>
                  {currentReport.length}
                </span>
              </div>
              <div style={{ fontSize: '0.9rem', color: '#666' }}>
                {new Date().toLocaleDateString('he-IL')}
              </div>
            </div>

            {/* טבלה */}
            <div style={{
              flex: 1,
              overflow: 'auto',
              marginBottom: '1.5rem'
            }}>
              <table style={{
                width: '100%',
                borderCollapse: 'collapse',
                fontSize: '0.95rem'
              }}>
                <thead style={{
                  position: 'sticky',
                  top: 0,
                  background: '#667eea',
                  color: 'white',
                  zIndex: 10
                }}>
                  <tr>
                    {currentReport.length > 0 && Object.keys(currentReport[0]).map(key => (
                      <th key={key} style={{
                        padding: '1rem',
                        textAlign: 'right',
                        fontWeight: '600',
                        borderBottom: '2px solid #764ba2'
                      }}>
                        {key}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentReport.map((row, index) => (
                    <tr key={index} style={{
                      background: index % 2 === 0 ? 'white' : '#f8f9fa',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = '#e3f2fd'}
                    onMouseLeave={(e) => e.currentTarget.style.background = index % 2 === 0 ? 'white' : '#f8f9fa'}
                    >
                      {Object.values(row).map((value, i) => (
                        <td key={i} style={{
                          padding: '1rem',
                          borderBottom: '1px solid #e0e0e0',
                          color: '#333'
                        }}>
                          {value}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* כפתורים */}
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => {
                  setShowReportModal(false);
                  setCurrentReport(null);
                  setReportType('');
                }}
                style={{
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  border: '2px solid #e0e0e0',
                  background: 'white',
                  color: '#666',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                סגור
              </button>
              
              <button
                onClick={downloadReport}
                style={{
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
                }}
              >
                <Download size={20} />
                הורד Excel
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default SecretaryPanel;