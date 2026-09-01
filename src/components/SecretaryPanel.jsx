import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getParentData, getTransactions, generateQRCode, deleteStudent } from '../api';
import { getSchoolStudents, addMoney, getSchoolTransactions, getPendingRegistrations, handleRegistrationAction, getParentDetails, getSchools, resetUserPassword, regenerateStudentPin, getAllRegistrations, blockParentFamily, unblockParentFamily } from '../api';
import { setToken, authFetch } from '../auth';
import * as XLSX from 'xlsx';
import GradeGroupsTab from './GradeGroupsTab';
import {
  Search, Plus, DollarSign, Edit, Eye, CreditCard, Banknote, Clock,
  CheckCircle, User, Phone, Mail, FileText, Download, Filter, Settings,
  AlertCircle, XCircle, Calendar, TrendingUp, Users, Home, Bell, RefreshCw,
  Printer, Check, X, UserCheck, UserX, Wallet, PiggyBank, QrCode, Trash2
} from 'lucide-react';
import SecretaryShell from './secretary/SecretaryShell';
import PageHeader from './secretary/PageHeader';
import StatusBadge from './secretary/StatusBadge';
import IconButton from './secretary/IconButton';
import EmptyState from './secretary/EmptyState';
import './secretary/secretary.css';

const SecretaryPanel = () => {
  const navigate = useNavigate();
  const [showReportModal, setShowReportModal] = useState(false);
const [currentReport, setCurrentReport] = useState(null);
const [reportType, setReportType] = useState('');
  const [activeTab, setActiveTab] = useState('payments');
  const [currentUser, setCurrentUser] = useState(null);
  const [schoolName, setSchoolName] = useState('');
  const [schoolData, setSchoolData] = useState(null);
  const [selectedStudentSchedule, setSelectedStudentSchedule] = useState(null);
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
const [passwordResetInfo, setPasswordResetInfo] = useState(null); // { newPassword, emailSent } - מוצג אחרי איפוס סיסמה
const [resettingPassword, setResettingPassword] = useState(false);
const [regeneratingPin, setRegeneratingPin] = useState(false);
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
    totalPayments: 0,
    transactionCount: 0,
    averageTransaction: 0,
    pendingApprovals: 0,
    lowBalanceStudents: 0,
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
    setSchoolData(school);
    loadStaffUsers(school.id);
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

// טען את כל ההרשמות (כולל ממתינות לאימות מייל / מאומתות) לתצוגת המזכירה
const allRegistrationsData = await getAllRegistrations(currentUser.school_id);
if (allRegistrationsData.success) {
  setAllRegistrations(allRegistrationsData.registrations);
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

  // כל ההרשמות (כולל אימות מייל אוטומטי) - לתצוגה + חסימת משפחה
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [blockingParentId, setBlockingParentId] = useState(null);

  // ניהול צוות
  const [staffUsers, setStaffUsers] = useState([]);
  const [showAddStaffForm, setShowAddStaffForm] = useState(false);
  const [newStaff, setNewStaff] = useState({ email: '', password: '', firstName: '', lastName: '', role: 'secretary', phone: '' });

const loadStudentSchedule = async (studentId) => {
  const student = students.find(s => String(s.id) === String(studentId));
  if (!student?.group_id) {
    setSelectedStudentSchedule(null);
    return;
  }
  try {
    const currentMonth = new Date().getMonth() + 1;
    const currentYear = new Date().getFullYear();
    const response = await authFetch(
      `https://api.bonapp.dev/api/groups/${student.group_id}/schedule?month=${currentMonth}&year=${currentYear}`
    );
    const data = await response.json();
    if (data.success && data.schedule) {
      setSelectedStudentSchedule(data.schedule);
    } else {
      setSelectedStudentSchedule(null);
    }
  } catch (error) {
    console.error('Error loading schedule:', error);
    setSelectedStudentSchedule(null);
  }
};

  const loadStaffUsers = async (schoolId) => {
    try {
      const response = await authFetch(`https://api.bonapp.dev/api/schools/${schoolId}/users`);
      const data = await response.json();
      if (data.success) setStaffUsers(data.users);
    } catch (error) {
      console.error('Error loading staff users:', error);
    }
  };

  const addStaffUser = async () => {
    if (!newStaff.email || !newStaff.password || !newStaff.firstName || !newStaff.lastName) {
      alert('נא למלא את כל השדות החובה');
      return;
    }
    if (newStaff.password.length < 6) {
      alert('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
    try {
      const response = await authFetch(`https://api.bonapp.dev/api/schools/${schoolData.id}/users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newStaff)
      });
      const result = await response.json();
      if (result.success) {
        alert('איש הצוות נוסף בהצלחה!');
        loadStaffUsers(schoolData.id);
        setShowAddStaffForm(false);
        setNewStaff({ email: '', password: '', firstName: '', lastName: '', role: 'secretary', phone: '' });
      } else {
        alert(result.message || 'שגיאה בהוספת איש צוות');
      }
    } catch (error) {
      alert('שגיאה בהוספת איש צוות');
    }
  };

  const deleteStaffUser = async (userId) => {
    if (!window.confirm('האם למחוק את איש הצוות הזה?')) return;
    try {
      const response = await authFetch(`https://api.bonapp.dev/api/users/${userId}`, { method: 'DELETE' });
      const result = await response.json();
      if (result.success) {
        setStaffUsers(prev => prev.filter(u => u.id !== userId));
      } else {
        alert(result.message || 'שגיאה במחיקת איש צוות');
      }
    } catch (error) {
      alert('שגיאה במחיקת איש צוות');
    }
  };

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

      // רענן את "כל ההרשמות" כדי שהסטטוס המעודכן (אושר/נדחה) יוצג שם מיד, ולא יישאר תקוע
      // על "ממתין לאישור מזכירה" עד לריענון הדף.
      getAllRegistrations(currentUser.school_id).then(allRegistrationsData => {
        if (allRegistrationsData.success) setAllRegistrations(allRegistrationsData.registrations);
      }).catch(() => {});

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
      await authFetch(`https://api.bonapp.dev/api/send-login-email`, {
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

  // מוצא את פרטי ההורה (users.id + users.status) של הרשמה מאומתת לפי מייל, מתוך רשימת התלמידים שכבר נטענה
  const getParentInfoForRegistration = (registration) => {
    const match = students.find(s => s.users?.email && s.users.email === registration.parent_email);
    if (!match) return null;
    return { parentId: match.parent_id, isBlocked: match.users?.status === 'blocked' };
  };

  const handleToggleBlockFamily = async (registration, isCurrentlyBlocked, parentId) => {
    const confirmMsg = isCurrentlyBlocked
      ? `לבטל את החסימה של משפחת ${registration.parent_name}?`
      : `לחסום את משפחת ${registration.parent_name}? ההורה והתלמידים לא יוכלו להיכנס למערכת עד ביטול החסימה.`;
    if (!window.confirm(confirmMsg)) return;

    setBlockingParentId(parentId);
    try {
      const result = isCurrentlyBlocked
        ? await unblockParentFamily(parentId)
        : await blockParentFamily(parentId);

      if (result.success) {
        const schoolData = await getSchoolStudents(currentUser.school_id);
        if (schoolData.success) setStudents(schoolData.students);
      } else {
        alert(result.message || 'שגיאה בעדכון סטטוס המשפחה');
      }
    } catch (error) {
      alert('שגיאה בעדכון סטטוס המשפחה. נסה שוב.');
    } finally {
      setBlockingParentId(null);
    }
  };

// הוסף פונקציה לטעינת פרטי הורה:
const loadParentDetails = async (studentId) => {
  try {
    const result = await getParentDetails(studentId);
    if (result.success) {
      setParentDetails(result.parent);
      setPasswordResetInfo(null);
      setShowParentDetails(true);
    } else {
      alert('לא נמצאו פרטי הורה לתלמיד זה');
    }
  } catch (error) {
    alert('שגיאה בטעינת פרטי הורה');
  }
};

const handleResetParentPassword = async () => {
  if (!parentDetails?.id) return;
  setResettingPassword(true);
  setPasswordResetInfo(null);
  try {
    const result = await resetUserPassword(parentDetails.id);
    if (result.success) {
      setPasswordResetInfo({ newPassword: result.newPassword, emailSent: result.emailSent });
    } else {
      alert(result.message || 'שגיאה באיפוס סיסמה');
    }
  } catch (error) {
    alert('שגיאה באיפוס סיסמה');
  } finally {
    setResettingPassword(false);
  }
};

const handleRegeneratePin = async () => {
  if (!selectedStudent?.id) return;
  if (!window.confirm('ליצור קוד PIN חדש לתלמיד? הקוד הקודם יפסיק לעבוד.')) return;
  setRegeneratingPin(true);
  try {
    const result = await regenerateStudentPin(selectedStudent.id);
    if (result.success) {
      setSelectedStudent(prev => ({ ...prev, pin: result.pin }));
    } else {
      alert(result.message || 'שגיאה ביצירת קוד PIN');
    }
  } catch (error) {
    alert('שגיאה ביצירת קוד PIN');
  } finally {
    setRegeneratingPin(false);
  }
};


const generateReport = (type) => {
  const reports = {
    daily: 'דוח יומי',
    weekly: 'דוח שבועי',
    monthly: 'דוח חודשי',
    students: 'דוח תלמידים',
    debts: 'דוח חובות',
    paymentStatus: 'דוח סטטוס תשלומים'
  };

  let reportData = [];

  switch(type) {
    case 'paymentStatus': {
      // סוג התשלום האחרון של כל תלמיד - transactions כבר ממוינות מהחדש לישן,
      // אז הערך הראשון שנתקלים בו לכל student_id הוא גם האחרון כרונולוגית.
      const lastPaymentTypeByStudent = {};
      transactions.forEach(t => {
        if (t.type === 'payment' && t.student_id && !(t.student_id in lastPaymentTypeByStudent)) {
          lastPaymentTypeByStudent[t.student_id] = t.payment_type;
        }
      });

      let monthlyCount = 0, dailyUsedCount = 0, dailyRemainingCount = 0, noPaymentCount = 0;
      students.forEach(student => {
        const paymentType = lastPaymentTypeByStudent[student.id];
        if (paymentType === 'monthly') {
          monthlyCount++;
        } else if (paymentType === 'daily' || paymentType === 'balance') {
          if ((student.balance || 0) > 0) dailyRemainingCount++;
          else dailyUsedCount++;
        } else {
          noPaymentCount++;
        }
      });

      reportData = [
        { 'קטגוריה': 'שילמו חודשי', 'כמות תלמידים': monthlyCount },
        { 'קטגוריה': 'שילמו בודדת וניצלו את היתרה', 'כמות תלמידים': dailyUsedCount },
        { 'קטגוריה': 'שילמו בודדת ועוד לא ניצלו', 'כמות תלמידים': dailyRemainingCount },
        { 'קטגוריה': 'לא שילמו כלל', 'כמות תלמידים': noPaymentCount },
        { 'קטגוריה': 'סה"כ תלמידים', 'כמות תלמידים': students.length }
      ];
      break;
    }
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



  const handleDeleteStudent = async (e, student) => {
    e.stopPropagation();
    if (!window.confirm(`למחוק את ${student.first_name} ${student.last_name || ''}? פעולה זו לא ניתנת לביטול.`)) return;
    try {
      const result = await deleteStudent(student.id);
      if (result.success) {
        setStudents(prev => prev.filter(s => s.id !== student.id));
      } else {
        alert(result.message || 'שגיאה במחיקת תלמיד');
      }
    } catch (error) {
      alert('שגיאה במחיקת תלמיד');
    }
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

  // עוזרי תצוגה בלבד - לא משנים נתונים, רק ממפים ערך קיים לצבע/תווית
  const paymentMethodTone = (method) =>
    method === 'cash' ? 'success' :
    method === 'check' ? 'info' :
    method === 'bit' ? 'neutral' :
    method === 'credit_card' ? 'warning' : 'neutral';

  const paymentMethodLabel = (method) =>
    method === 'cash' ? 'מזומן' :
    method === 'check' ? 'שיק' :
    method === 'bit' ? 'ביט' :
    method === 'credit_card' ? 'כרטיס אשראי' : 'התאמה';

  const studentStatusTone = (status) =>
    status === 'active' ? 'success' : status === 'debt' ? 'danger' : 'warning';

  const studentStatusLabel = (status) =>
    status === 'active' ? 'פעיל' : status === 'debt' ? 'חוב' : 'יתרה נמוכה';

  const balanceTone = (balance) =>
    balance >= 0 ? (balance > 20 ? 'positive' : 'zero') : 'negative';

  return (
    <>
      <SecretaryShell
        schoolName={schoolName || 'בית ספר'}
        lastUpdateLabel={dailyStats.lastUpdate.toLocaleTimeString('he-IL')}
        userName={currentUser?.name || 'מזכירה'}
        userRole="מזכירה ראשית"
        navItems={[
          { key: 'payments', label: 'תשלומים', icon: <DollarSign size={18} /> },
          { key: 'students', label: 'תלמידים', icon: <Users size={18} /> },
          { key: 'registrations', label: 'הרשמות חדשות', icon: <UserCheck size={18} />, badge: pendingRegistrations.length },
          { key: 'reports', label: 'דוחות', icon: <FileText size={18} /> },
          { key: 'groups', label: 'שכבות', icon: <Users size={18} /> },
          { key: 'settings', label: '⚙️ הגדרות', icon: null }
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onSettingsClick={() => setShowAdminPanel(true)}
        onLogout={() => navigate('/')}
        headerStats={[
          { label: 'תשלומים היום', value: `₪${(dailyStats.totalPayments || 0).toFixed(0)}` },
          { label: 'עסקאות', value: dailyStats.transactionCount },
          { label: 'ממתינים לאישור', value: dailyStats.pendingApprovals, tone: dailyStats.pendingApprovals > 0 ? 'alert' : undefined }
        ]}
      >
        {/* טאב תשלומים */}
        {activeTab === 'payments' && (
          <>
            <PageHeader
              icon={<DollarSign size={28} />}
              title="ניהול תשלומים"
              actions={
                <div className="bap-sec-stats">
                  <div className="bap-sec-stat">
                    <span>סה״כ תשלומים היום</span>
                    <strong>₪{(dailyStats.totalPayments || 0).toFixed(2)}</strong>
                  </div>
                  <div className="bap-sec-stat">
                    <span>עסקאות היום</span>
                    <strong>{dailyStats.transactionCount}</strong>
                  </div>
                  <div className="bap-sec-stat alert">
                    <span>ממוצע עסקה</span>
                    <strong>₪{(dailyStats.averageTransaction || 0).toFixed(0)}</strong>
                  </div>
                  <div className="bap-sec-stat danger">
                    <span>יתרות נמוכות</span>
                    <strong>{dailyStats.lowBalanceStudents}</strong>
                  </div>
                </div>
              }
            />

            <div className="bap-sec-panel">
              <div className="bap-sec-panel-tools">
                <div className="bap-sec-search-wrap">
                  <Search size={20} />
                  <input
                    type="text"
                    className="bap-sec-search"
                    placeholder="חפש תלמיד, הורה או מספר קבלה..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>

                <select
                  className="bap-sec-select"
                  value={dateFilter}
                  onChange={(e) => setDateFilter(e.target.value)}
                >
                  <option value="today">היום</option>
                  <option value="week">השבוע</option>
                  <option value="month">החודש</option>
                  <option value="all">הכל</option>
                </select>

                <div className="bap-sec-spacer" />

                <button
                  className="bap-sec-btn bap-sec-btn--success"
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
                >
                  <Plus size={18} />
                  הוסף תשלום
                </button>
              </div>

              <div className="bap-sec-table-wrap">
                <table className="bap-sec-table-mobile">
                  <thead>
                    <tr>
                      <th>פעולות</th>
                      <th>הערות</th>
                      <th>מספר קבלה</th>
                      <th>זמן</th>
                      <th>אמצעי תשלום</th>
                      <th>סכום</th>
                      <th>תלמיד</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map(payment => (
                      <tr key={payment.id}>
                        <td className="bap-sec-td-actions" data-label="פעולות">
                          <div className="bap-sec-row-actions">
                            <IconButton title="צפה בפרטים" ariaLabel="צפה בפרטים">
                              <Eye size={16} />
                            </IconButton>
                            <IconButton title="הדפס קבלה" ariaLabel="הדפס קבלה">
                              <Printer size={16} />
                            </IconButton>
                          </div>
                        </td>
                        <td data-label="הערות">{payment.description || '-'}</td>
                        <td data-label="מספר קבלה">{payment.id || '-'}</td>
                        <td data-label="זמן">{new Date(payment.transaction_date).toLocaleString('he-IL')}</td>
                        <td data-label="אמצעי תשלום">
                          <StatusBadge tone={paymentMethodTone(payment.payment_method)}>
                            {paymentMethodLabel(payment.payment_method)}
                          </StatusBadge>
                        </td>
                        <td data-label="סכום">
                          <span className="bap-sec-money bap-sec-money--positive">
                            +₪{(payment.amount || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="bap-sec-td-name" data-label="תלמיד">
                          <span className="bap-sec-student">
                            {payment.students?.first_name} {payment.students?.last_name || ''}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* טאב תלמידים */}
        {activeTab === 'students' && (
          <>
            <PageHeader
              icon={<Users size={28} />}
              title="ניהול תלמידים"
              badge={<span className="bap-sec-title-badge">{students.length} תלמידים רשומים</span>}
            />

            <div className="bap-sec-panel">
              <div className="bap-sec-panel-tools">
                <div className="bap-sec-search-wrap">
                  <Search size={20} />
                  <input
                    type="text"
                    className="bap-sec-search"
                    placeholder="חפש תלמיד, הורה או טלפון..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </div>

              <div className="bap-sec-table-wrap">
                <table className="bap-sec-table-mobile">
                  <thead>
                    <tr>
                      <th>פעולות</th>
                      <th>סטטוס</th>
                      <th>פעילות אחרונה</th>
                      <th>טלפון הורה</th>
                      <th>יתרה</th>
                      <th>כיתה</th>
                      <th>שם</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStudents.map(student => (
                      <tr
                        key={student.id}
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowStudentDetails(true);
                        }}
                        style={{ cursor: 'pointer' }}
                      >
                        <td className="bap-sec-td-actions" data-label="פעולות">
                          <div className="bap-sec-row-actions">
                            <IconButton
                              variant="default"
                              title="עריכת פרטים"
                              ariaLabel="עריכת פרטים"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudent(student);
                                setShowStudentDetails(true);
                              }}
                            >
                              <Edit size={16} />
                            </IconButton>
                            <IconButton
                              variant="default"
                              title="הוסף תשלום"
                              ariaLabel="הוסף תשלום"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedStudent(student);
                                setShowAddPayment(true);
                                setPaymentForm(prev => ({ ...prev, studentId: student.id.toString() }));
                              }}
                            >
                              <Wallet size={16} />
                            </IconButton>
                            <IconButton
                              variant="danger"
                              title="מחק תלמיד"
                              ariaLabel="מחק תלמיד"
                              onClick={(e) => handleDeleteStudent(e, student)}
                            >
                              <Trash2 size={16} />
                            </IconButton>
                          </div>
                        </td>
                        <td data-label="סטטוס">
                          <StatusBadge tone={studentStatusTone(student.status)}>
                            {studentStatusLabel(student.status)}
                          </StatusBadge>
                        </td>
                        <td data-label="פעילות אחרונה">{student.lastActivity}</td>
                        <td data-label="טלפון הורה">{student.users?.phone}</td>
                        <td data-label="יתרה">
                          <span className={`bap-sec-money bap-sec-money--${balanceTone(student.balance)}`}>
                            ₪{(student.balance || 0).toFixed(2)}
                          </span>
                        </td>
                        <td data-label="כיתה">{student.grade}</td>
                        <td className="bap-sec-td-name" data-label="שם">
                          <span className="bap-sec-student">
                            {student?.first_name} {student?.last_name || ''}
                          </span>
                          {student.className && <span className="bap-sec-sub">{student.className}</span>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {/* טאב הרשמות */}
        {activeTab === 'registrations' && (
          <>
            <PageHeader
              icon={<UserCheck size={28} />}
              title="הרשמות ממתינות לאישור"
              badge={
                pendingRegistrations && pendingRegistrations.length > 0 ? (
                  <span className="bap-sec-title-badge bap-sec-title-badge--danger">
                    {pendingRegistrations.length}
                  </span>
                ) : null
              }
            />

            {!pendingRegistrations || pendingRegistrations.length === 0 ? (
              <EmptyState
                icon={<CheckCircle size={48} />}
                title="אין הרשמות ממתינות"
                description="כל ההרשמות אושרו או נדחו"
              />
            ) : (
              <div className="bap-sec-reg-grid">
                {pendingRegistrations.map(registration => {
                  const children = JSON.parse(registration.children_data || '[]');
                  return (
                    <div key={registration.id} className="bap-sec-reg-card">
                      <div className="bap-sec-reg-head">
                        <div>
                          <h3>{registration.parent_name}</h3>
                          <p>{registration.parent_phone} • {registration.parent_email}</p>
                          <p>הוגש: {new Date(registration.created_at).toLocaleString('he-IL')}</p>
                        </div>

                        <div className="bap-sec-reg-actions">
                          <button
                            className="bap-sec-btn bap-sec-btn--danger"
                            onClick={() => handleApproveRegistration(registration.id, false)}
                          >
                            <X size={16} />
                            דחה
                          </button>

                          <button
                            className="bap-sec-btn bap-sec-btn--success"
                            onClick={() => handleApproveRegistration(registration.id, true)}
                          >
                            <Check size={16} />
                            אשר
                          </button>
                        </div>
                      </div>

                      <div className="bap-sec-reg-children">
                        <h4>ילדים להרשמה:</h4>
                        {children.map((child, index) => (
                          <div key={index} className="bap-sec-reg-child-row">
                            <span style={{ fontWeight: 600 }}>{child.firstName} {child.lastName}</span>
                            <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
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

            <div style={{ marginTop: '40px' }}>
              <PageHeader
                icon={<UserCheck size={28} />}
                title="כל ההרשמות"
                description="כולל הרשמות שאומתו אוטומטית במייל, בלי לעבור דרך תור האישור"
              />

              {!allRegistrations || allRegistrations.length === 0 ? (
                <EmptyState
                  icon={<CheckCircle size={48} />}
                  title="אין הרשמות"
                  description="עדיין לא התקבלו הרשמות"
                />
              ) : (
                <div className="bap-sec-reg-grid">
                  {allRegistrations.map(registration => {
                    const statusInfo = {
                      pending: { label: 'ממתין לאישור מזכירה', tone: 'warning' },
                      pending_verification: { label: 'ממתין לאימות מייל', tone: 'warning' },
                      verified: { label: 'אומת - חשבון פעיל', tone: 'success' },
                      approved: { label: 'אושר', tone: 'success' },
                      rejected: { label: 'נדחה', tone: 'danger' }
                    }[registration.status] || { label: registration.status, tone: 'neutral' };

                    const parentInfo = getParentInfoForRegistration(registration);
                    const canBlock = (registration.status === 'verified' || registration.status === 'approved') && parentInfo;

                    return (
                      <div key={registration.id} className="bap-sec-reg-card">
                        <div className="bap-sec-reg-head">
                          <div>
                            <h3>{registration.parent_name}</h3>
                            <p>{registration.parent_phone} • {registration.parent_email}</p>
                            <p>הוגש: {new Date(registration.created_at).toLocaleString('he-IL')}</p>
                          </div>

                          <div className="bap-sec-reg-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                            <StatusBadge tone={statusInfo.tone}>{statusInfo.label}</StatusBadge>
                            {parentInfo?.isBlocked && <StatusBadge tone="danger">משפחה חסומה</StatusBadge>}
                            {canBlock && (
                              <button
                                className={`bap-sec-btn ${parentInfo.isBlocked ? 'bap-sec-btn--success' : 'bap-sec-btn--danger'}`}
                                disabled={blockingParentId === parentInfo.parentId}
                                onClick={() => handleToggleBlockFamily(registration, parentInfo.isBlocked, parentInfo.parentId)}
                              >
                                {parentInfo.isBlocked ? 'בטל חסימה' : 'חסום משפחה'}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* טאב דוחות */}
        {activeTab === 'reports' && (
          <>
            <PageHeader icon={<FileText size={28} />} title="דוחות ונתונים" />

            <div className="bap-sec-report-grid">
              <div className="bap-sec-report-card">
                <div className="bap-sec-report-icon"><AlertCircle size={36} style={{ color: 'var(--blue)' }} /></div>
                <h3>דוח חובות</h3>
                <p>תלמידים עם יתרה שלילית וחובות פתוחים</p>
                <button className="bap-sec-btn bap-sec-btn--primary" onClick={() => generateReport('debts')}>
                  <Download size={16} />
                  הורד דוח חובות
                </button>
              </div>

              <div className="bap-sec-report-card">
                <div className="bap-sec-report-icon"><Users size={36} style={{ color: 'var(--green)' }} /></div>
                <h3>דוח תלמידים</h3>
                <p>יתרות, פעילות וסטטיסטיקות כל התלמידים</p>
                <button className="bap-sec-btn bap-sec-btn--success" onClick={() => generateReport('students')}>
                  <Download size={16} />
                  הורד דוח תלמידים
                </button>
              </div>

              <div className="bap-sec-report-card">
                <div className="bap-sec-report-icon"><CreditCard size={36} style={{ color: 'var(--green)' }} /></div>
                <h3>דוח סטטוס תשלומים</h3>
                <p>כמה תלמידים משלמים חודשי, כמה משלמים בודד וניצלו את היתרה, וכמה עוד לא</p>
                <button className="bap-sec-btn bap-sec-btn--success" onClick={() => generateReport('paymentStatus')}>
                  <Download size={16} />
                  הצג דוח סטטוס תשלומים
                </button>
              </div>

              <div className="bap-sec-report-card">
                <div className="bap-sec-report-icon"><Calendar size={36} style={{ color: 'var(--navy)' }} /></div>
                <h3>דוח שבועי</h3>
                <p>סיכום פעילות שבועית והשוואות</p>
                <button className="bap-sec-btn bap-sec-btn--primary" onClick={() => generateReport('weekly')}>
                  <Download size={16} />
                  הורד דוח שבועי
                </button>
              </div>

              <div className="bap-sec-report-card">
                <div className="bap-sec-report-icon"><Settings size={36} style={{ color: 'var(--muted)' }} /></div>
                <h3>דוח מותאם אישית</h3>
                <p>בחר תאריכים ונתונים ספציפיים</p>
                <button
                  className="bap-sec-btn bap-sec-btn--secondary"
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
                >
                  <Settings size={16} />
                  צור דוח מותאם
                </button>
              </div>
            </div>
          </>
        )}

        {/* טאב שכבות */}
        {activeTab === 'groups' && (
          <GradeGroupsTab schoolId={schoolData?.id || currentUser?.school_id} />
        )}

        {/* טאב הגדרות */}
        {activeTab === 'settings' && (
          <div className="bap-sec-settings-wrap">
            <PageHeader title="⚙️ הגדרות בית ספר" />

            <div className="bap-sec-settings-card">
              <h3>💰 תמחור</h3>

              {schoolData?.enable_daily_payment && (
                <div className="bap-sec-field">
                  <label>מחיר ארוחה יומית (₪)</label>
                  <div className="bap-sec-readonly">{schoolData?.daily_meal_price || 0} ₪</div>
                  <p style={{ color: '#999', fontSize: '0.85rem', marginTop: '0.5rem' }}>
                    מחיר הארוחה נקבע בפאנל ניהול המטבח, כדי למנוע התנגשות בין שני מקומות עריכה.
                  </p>
                </div>
              )}

              <p style={{ color: '#999', fontSize: '0.9rem' }}>
                הגדרות נוספות מנוהלות ע"י מנהל המערכת
              </p>
            </div>

            {/* ניהול צוות */}
            <div className="bap-sec-settings-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h3 style={{ margin: 0 }}>👥 צוות בית הספר</h3>
                <button className="bap-sec-btn bap-sec-btn--primary" onClick={() => setShowAddStaffForm(!showAddStaffForm)}>
                  <Plus size={16} />
                  הוסף איש צוות
                </button>
              </div>

              {showAddStaffForm && (
                <div style={{ background: 'var(--paper)', padding: '1.25rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'grid', gap: '0.75rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                    <input type="text" className="bap-sec-input" placeholder="שם פרטי *" value={newStaff.firstName}
                      onChange={e => setNewStaff({ ...newStaff, firstName: e.target.value })} />
                    <input type="text" className="bap-sec-input" placeholder="שם משפחה *" value={newStaff.lastName}
                      onChange={e => setNewStaff({ ...newStaff, lastName: e.target.value })} />
                  </div>
                  <input type="email" className="bap-sec-input" placeholder="אימייל *" value={newStaff.email}
                    onChange={e => setNewStaff({ ...newStaff, email: e.target.value })} />
                  <input type="tel" className="bap-sec-input" placeholder="טלפון" value={newStaff.phone}
                    onChange={e => setNewStaff({ ...newStaff, phone: e.target.value })} />
                  <input type="password" className="bap-sec-input" placeholder="סיסמה זמנית *" value={newStaff.password}
                    onChange={e => setNewStaff({ ...newStaff, password: e.target.value })} />
                  <select className="bap-sec-select" style={{ width: '100%' }} value={newStaff.role} onChange={e => setNewStaff({ ...newStaff, role: e.target.value })}>
                    <option value="secretary">מזכירה</option>
                    <option value="kitchen">מנהל מטבח</option>
                    <option value="admin">מנהל בית ספר</option>
                  </select>
                  <button className="bap-sec-btn bap-sec-btn--success" onClick={addStaffUser}>
                    שמור
                  </button>
                </div>
              )}

              {staffUsers.length === 0 ? (
                <EmptyState description="אין אנשי צוות נוספים" />
              ) : (
                staffUsers.map(user => (
                  <div key={user.id} className="bap-sec-staff-row">
                    <div>
                      <p style={{ fontWeight: 600, color: 'var(--navy)' }}>{user.first_name} {user.last_name}</p>
                      <p style={{ fontSize: '0.85rem', color: 'var(--muted)' }}>
                        {user.email} · {user.role === 'secretary' ? 'מזכירה' : user.role === 'kitchen' ? 'מנהל מטבח' : user.role === 'admin' ? 'מנהל בית ספר' : user.role}
                      </p>
                    </div>
                    <IconButton variant="danger" title="מחק איש צוות" ariaLabel="מחק איש צוות" onClick={() => deleteStaffUser(user.id)}>
                      <Trash2 size={18} />
                    </IconButton>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </SecretaryShell>

      {/* מודל הוספת תשלום */}
      {showAddPayment && (
        <div className="bap-sec-modal-overlay">
          <div className="bap-sec-modal">
            <div className="bap-sec-modal-head">
              <h3 className="bap-sec-modal-title bap-sec-modal-title--center">
                <DollarSign size={26} />
                הוספת תשלום ידני
              </h3>
              <button type="button" className="bap-sec-modal-close" onClick={() => setShowAddPayment(false)} aria-label="סגירת חלון הוספת תשלום">
                <X size={20} />
              </button>
            </div>
            <div className="bap-sec-modal-scroll">
            <div className="bap-sec-field">
              <label>תלמיד</label>

              {paymentForm.studentId ? (
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <div className="bap-sec-readonly" style={{ flex: 1 }}>
                    {(() => {
                      const student = students.find(s => String(s.id) === String(paymentForm.studentId));
                      return student ? `${student.first_name} ${student.last_name} - כיתה ${student.grade}` : 'תלמיד לא נמצא';
                    })()}
                  </div>
                  <button
                    type="button"
                    className="bap-sec-btn bap-sec-btn--danger"
                    onClick={() => setPaymentForm(prev => ({ ...prev, studentId: '' }))}
                  >
                    שנה
                  </button>
                </div>
              ) : (
                <select
                  className="bap-sec-select"
                  style={{ width: '100%' }}
                  value={paymentForm.studentId}
                  onChange={(e) => {
                    setPaymentForm(prev => ({ ...prev, studentId: e.target.value }));
                    loadStudentSchedule(e.target.value);
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

            {schoolData?.enable_monthly_package && paymentForm.studentId && (
              <div style={{ background: 'var(--soft)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', textAlign: 'center' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: 'var(--blue)' }}>
                  📅 חבילה חודשית - {new Date().toLocaleString('he-IL', { month: 'long' })}
                </p>
                {selectedStudentSchedule ? (
                  <>
                    <p style={{ margin: '0 0 0.5rem 0', color: 'var(--muted)', fontSize: '0.9rem' }}>
                      {selectedStudentSchedule.days_count} ימים × ₪{selectedStudentSchedule.meal_price} = ₪{(selectedStudentSchedule.days_count * selectedStudentSchedule.meal_price).toFixed(2)}
                    </p>
                    <button
                      type="button"
                      className="bap-sec-btn bap-sec-btn--primary"
                      onClick={() => setPaymentForm(prev => ({
                        ...prev,
                        amount: (selectedStudentSchedule.days_count * selectedStudentSchedule.meal_price).toFixed(2)
                      }))}
                    >
                      שלם ₪{(selectedStudentSchedule.days_count * selectedStudentSchedule.meal_price).toFixed(2)}
                    </button>
                  </>
                ) : (
                  <p style={{ fontSize: '0.85rem', color: 'var(--muted)', margin: 0 }}>
                    לא הוגדר לוח ארוחות לשכבה זו החודש
                  </p>
                )}
              </div>
            )}

            {schoolData?.enable_daily_payment && (
              <div style={{ background: 'var(--green2)', padding: '1rem', borderRadius: '12px', marginBottom: '1rem', textAlign: 'center' }}>
                <p style={{ margin: '0 0 0.5rem 0', fontWeight: '600', color: 'var(--green)' }}>
                  📆 תשלום יומי - ₪{schoolData.daily_meal_price} לארוחה
                </p>
                <button
                  type="button"
                  className="bap-sec-btn bap-sec-btn--success"
                  onClick={() => setPaymentForm(prev => ({ ...prev, amount: schoolData.daily_meal_price?.toFixed(2) }))}
                >
                  שלם ₪{schoolData.daily_meal_price} לארוחה אחת
                </button>
              </div>
            )}

            <div className="bap-sec-field">
              <label>סכום (ש״ח)</label>
              <input
                type="number"
                className="bap-sec-input"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, amount: e.target.value }))}
                placeholder="הכנס סכום..."
                step="0.50"
              />
            </div>

            <div className="bap-sec-field">
              <label>אמצעי תשלום</label>
              <div className="bap-sec-method-grid">
                <button
                  type="button"
                  className={`bap-sec-method-option ${paymentForm.paymentMethod === 'cash' ? 'active' : ''}`}
                  onClick={() => setPaymentForm(prev => ({ ...prev, paymentMethod: 'cash' }))}
                >
                  מזומן
                </button>
                <button
                  type="button"
                  className={`bap-sec-method-option ${paymentForm.paymentMethod === 'check' ? 'active' : ''}`}
                  onClick={() => setPaymentForm(prev => ({ ...prev, paymentMethod: 'check' }))}
                >
                  שיק
                </button>
                <button
                  type="button"
                  className={`bap-sec-method-option ${paymentForm.paymentMethod === 'bit' ? 'active' : ''}`}
                  onClick={() => setPaymentForm(prev => ({ ...prev, paymentMethod: 'bit' }))}
                >
                  ביט
                </button>
                <button
                  type="button"
                  className={`bap-sec-method-option ${paymentForm.paymentMethod === 'adjustment' ? 'active' : ''}`}
                  onClick={() => setPaymentForm(prev => ({ ...prev, paymentMethod: 'adjustment' }))}
                >
                  התאמה
                </button>
              </div>
            </div>

            {paymentForm.paymentMethod === 'check' && (
              <>
                <div className="bap-sec-field">
                  <label>מספר שיק</label>
                  <input
                    type="text"
                    className="bap-sec-input"
                    value={paymentForm.checkNumber}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, checkNumber: e.target.value }))}
                    placeholder="הכנס מספר שיק..."
                  />
                </div>

                <div className="bap-sec-field">
                  <label>בנק</label>
                  <input
                    type="text"
                    className="bap-sec-input"
                    value={paymentForm.bankName}
                    onChange={(e) => setPaymentForm(prev => ({ ...prev, bankName: e.target.value }))}
                    placeholder="שם הבנק..."
                  />
                </div>
              </>
            )}

            <div className="bap-sec-field">
              <label>הערות (אופציונלי)</label>
              <textarea
                className="bap-sec-textarea"
                value={paymentForm.notes}
                onChange={(e) => setPaymentForm(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="הערות נוספות..."
              />
            </div>

            <div className="bap-sec-modal-actions">
              <button className="bap-sec-btn bap-sec-btn--secondary" onClick={() => setShowAddPayment(false)}>
                ביטול
              </button>

              <button
                className="bap-sec-btn bap-sec-btn--primary"
                onClick={handleAddPayment}
                disabled={!paymentForm.studentId || !paymentForm.amount}
              >
                שמור תשלום
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* מודל פרטי תלמיד */}
      {showStudentDetails && selectedStudent && (
        <div className="bap-sec-modal-overlay">
          <div className="bap-sec-modal">
            <div className="bap-sec-modal-head">
              <h3 className="bap-sec-modal-title bap-sec-modal-title--center">
                <User size={26} />
                פרטי תלמיד - {selectedStudent?.first_name} {selectedStudent?.last_name || ''}
              </h3>
              <button type="button" className="bap-sec-modal-close" onClick={() => setShowStudentDetails(false)} aria-label="סגירת חלון פרטי תלמיד">
                <X size={20} />
              </button>
            </div>
            <div className="bap-sec-modal-scroll">
            <div className="bap-sec-detail-grid">
              <div className="bap-sec-detail-box">
                <h4>מידע כספי</h4>
                <div>
                  <strong>יתרה נוכחית:</strong>{' '}
                  <span className={`bap-sec-money bap-sec-money--${selectedStudent.balance >= 0 ? 'positive' : 'negative'}`}>
                    ₪{(selectedStudent.balance || 0).toFixed(2)}
                  </span>
                </div>
                <div><strong>הוצאות חודשיות:</strong> ₪{(selectedStudent.monthlySpent || 0).toFixed(2)}</div>
                <div><strong>סה״כ הפקדות:</strong> ₪{(selectedStudent.totalDeposits || 0).toFixed(2)}</div>
                <div>
                  <strong>סטטוס:</strong>{' '}
                  <StatusBadge tone={studentStatusTone(selectedStudent.status)}>
                    {studentStatusLabel(selectedStudent.status)}
                  </StatusBadge>
                </div>
              </div>

              <div className="bap-sec-detail-box">
                <h4>פרטי קשר</h4>
                <div><strong>טלפון הורה:</strong> {selectedStudent.users?.phone}</div>
                <div><strong>טלפון תלמיד:</strong> {selectedStudent.student_phone || 'לא מוגדר'}</div>
                <div><strong>מייל הורה:</strong> {selectedStudent.users?.email}</div>
                <div><strong>קשר חירום:</strong> {selectedStudent.emergencyContact}</div>
              </div>
            </div>

            <div className="bap-sec-detail-box" style={{ marginBottom: '2rem' }}>
              <h4>פעילות אחרונה</h4>
              <div><strong>כניסה אחרונה:</strong> {selectedStudent.lastActivity}</div>
              <div><strong>ארוחה אחרונה:</strong> {selectedStudent.lastMeal}</div>
              <div><strong>תאריך הרשמה:</strong> {selectedStudent.joinDate}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '.75rem', flexWrap: 'wrap' }}>
                <span><strong>קוד PIN לקיוסק:</strong> {selectedStudent.pin || 'לא הוגדר'}</span>
                <button
                  type="button"
                  className="bap-sec-btn bap-sec-btn--secondary"
                  style={{ height: 32, padding: '0 .75rem', fontSize: '.85rem' }}
                  onClick={handleRegeneratePin}
                  disabled={regeneratingPin}
                >
                  {regeneratingPin ? 'יוצר...' : selectedStudent.pin ? 'צור PIN חדש' : 'צור PIN'}
                </button>
              </div>
              {selectedStudent.notes && (
                <div style={{ marginTop: '1rem', padding: '1rem', background: '#fdf1e2', borderRadius: '8px' }}>
                  <strong>הערות:</strong> {selectedStudent.notes}
                </div>
              )}
            </div>

            <div className="bap-sec-modal-actions">
              <button
                className="bap-sec-btn bap-sec-btn--success"
                onClick={() => {
                  setShowStudentDetails(false);
                  setShowAddPayment(true);
                  setPaymentForm(prev => ({ ...prev, studentId: selectedStudent.id.toString() }));
                }}
              >
                <Wallet size={16} />
                הוסף תשלום
              </button>

              <button
                className="bap-sec-btn bap-sec-btn--warn"
                onClick={() => alert('יופק כרטיס QR חדש לתלמיד')}
              >
                <QrCode size={16} />
                QR חדש
              </button>

              <button
                className="bap-sec-btn bap-sec-btn--warn"
                onClick={() => loadParentDetails(selectedStudent.id)}
              >
                פרטי הורה
              </button>

              <button className="bap-sec-btn bap-sec-btn--secondary" onClick={() => setShowStudentDetails(false)}>
                סגור
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {showParentDetails && parentDetails && (
        <div className="bap-sec-modal-overlay">
          <div className="bap-sec-modal" style={{ maxWidth: 500 }}>
            <div className="bap-sec-modal-head" style={{ borderBottom: '2px solid var(--line)', paddingBottom: '1rem', marginBottom: 0 }}>
              <h2 style={{ margin: 0, fontSize: '1.5rem' }}>פרטי הורה</h2>
              <button type="button" className="bap-sec-modal-close" onClick={() => { setShowParentDetails(false); setPasswordResetInfo(null); }} aria-label="סגירת חלון פרטי הורה">
                <X size={20} />
              </button>
            </div>
            <div className="bap-sec-modal-scroll">

            <div className="bap-sec-detail-box" style={{ marginBottom: '1.5rem', marginTop: '1.5rem' }}>
              <h4>פרטי קשר</h4>
              <div><strong>שם:</strong> {parentDetails.name}</div>
              <div><strong>אימייל:</strong> {parentDetails.email}</div>
              <div><strong>טלפון:</strong> {parentDetails.phone}</div>
            </div>

            <div className="bap-sec-detail-box" style={{ marginBottom: '1.5rem', background: '#fdf1e2' }}>
              <h4 style={{ color: 'var(--orange)' }}>פרטי גישה למערכת</h4>
              <div><strong>אימייל כניסה:</strong> {parentDetails.email}</div>
              <p style={{ margin: '.5rem 0 0', fontSize: '.85rem', color: 'var(--muted)' }}>
                הסיסמה שמורה במערכת באופן מוצפן ולא ניתן להציג אותה. אפשר ליצור סיסמה חדשה ולשלוח אותה להורה במייל.
              </p>
            </div>

            {passwordResetInfo && (
              <div className="bap-sec-detail-box" style={{ marginBottom: '1.5rem', background: 'var(--green2)' }} role="status">
                <h4 style={{ color: '#2e7d32' }}>סיסמה חדשה נוצרה</h4>
                <div>
                  <strong>סיסמה זמנית:</strong>{' '}
                  <span style={{ fontFamily: 'monospace', fontSize: '1.1rem', color: 'var(--blue)' }}>
                    {passwordResetInfo.newPassword}
                  </span>
                </div>
                <p style={{ margin: '.5rem 0 0', fontSize: '.85rem', color: 'var(--muted)' }}>
                  {passwordResetInfo.emailSent
                    ? 'הסיסמה נשלחה גם במייל להורה.'
                    : 'לא הצלחנו לשלוח מייל - מומלץ למסור את הסיסמה להורה ישירות.'}
                </p>
              </div>
            )}

            <div className="bap-sec-modal-actions">
              <button className="bap-sec-btn bap-sec-btn--success" onClick={handleResetParentPassword} disabled={resettingPassword}>
                {resettingPassword ? 'יוצר...' : 'צור סיסמה חדשה'}
              </button>
              <button className="bap-sec-btn bap-sec-btn--primary" onClick={handleResetParentPassword} disabled={resettingPassword}>
                {resettingPassword ? 'שולח...' : 'שלח פרטי גישה מחדש'}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}

      {/* מודל Super Admin Panel - ללא שינוי לוגיקה, עיצוב בלבד */}
      {showAdminPanel && (
        <div className="bap-sec-modal-overlay">
          <div className="bap-sec-modal">
            {!isAdminAuthenticated ? (
              <>
                <div className="bap-sec-modal-head">
                  <h3 className="bap-sec-modal-title bap-sec-modal-title--center">הגדרות מתקדמות</h3>
                  <button
                    type="button"
                    className="bap-sec-modal-close"
                    aria-label="סגירת חלון הגדרות מתקדמות"
                    onClick={() => { setShowAdminPanel(false); setAdminPassword(''); }}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="bap-sec-modal-scroll">

                <div className="bap-sec-field">
                  <label>סיסמת Super Admin</label>
                  <input
                    type="password"
                    className="bap-sec-input"
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    placeholder="הכנס סיסמה..."
                  />
                </div>

                <div className="bap-sec-modal-actions">
                  <button
                    className="bap-sec-btn bap-sec-btn--secondary"
                    onClick={() => {
                      setShowAdminPanel(false);
                      setAdminPassword('');
                    }}
                  >
                    ביטול
                  </button>

                  <button
                    className="bap-sec-btn bap-sec-btn--primary"
                    onClick={async () => {
                      try {
                        const response = await fetch('https://api.bonapp.dev/api/admin/auth', {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ password: adminPassword })
                        });
                        const result = await response.json();

                        if (result.success) {
                          setToken(result.token);
                          setIsAdminAuthenticated(true);
                          setAdminPassword('');
                        } else {
                          alert('סיסמה שגויה');
                        }
                      } catch (error) {
                        alert('שגיאה בחיבור לשרת');
                      }
                    }}
                  >
                    כניסה
                  </button>
                </div>
                </div>
              </>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', height: '100%' }}>
                <div className="bap-sec-modal-head">
                  <h3 className="bap-sec-modal-title bap-sec-modal-title--center">Super Admin Panel</h3>
                  <button
                    type="button"
                    className="bap-sec-modal-close"
                    aria-label="סגירת חלון Super Admin"
                    onClick={() => { setShowAdminPanel(false); setIsAdminAuthenticated(false); }}
                  >
                    <X size={20} />
                  </button>
                </div>
                <div className="bap-sec-modal-scroll">

                <div style={{ marginBottom: '2rem' }}>
                  <div className="bap-sec-field">
                    <label>שם בית הספר *</label>
                    <input type="text" className="bap-sec-input" placeholder="בית ספר אורט כפר סבא" />
                  </div>

                  <div className="bap-sec-field">
                    <label>כתובת</label>
                    <input type="text" className="bap-sec-input" placeholder="רחוב הרצל 123, כפר סבא" />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div className="bap-sec-field">
                      <label>איש קשר</label>
                      <input type="text" className="bap-sec-input" placeholder="מנהל ראשי" />
                    </div>
                    <div className="bap-sec-field">
                      <label>טלפון</label>
                      <input type="tel" className="bap-sec-input" placeholder="09-1234567" />
                    </div>
                  </div>

                  <div className="bap-sec-field">
                    <label>מייל</label>
                    <input type="email" className="bap-sec-input" placeholder="office@school.co.il" style={{ textAlign: 'left' }} />
                  </div>
                </div>

                <div className="bap-sec-modal-actions">
                  <button
                    className="bap-sec-btn bap-sec-btn--secondary"
                    onClick={() => {
                      setShowAdminPanel(false);
                      setIsAdminAuthenticated(false);
                    }}
                  >
                    סגור
                  </button>

                  <button className="bap-sec-btn bap-sec-btn--success">
                    צור בית ספר
                  </button>
                </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* מודל הצגת דוח */}
      {showReportModal && currentReport && (
        <div className="bap-sec-modal-overlay">
          <div className="bap-sec-modal bap-sec-modal--wide">
            <div className="bap-sec-modal-head" style={{ paddingBottom: '1rem', marginBottom: 0, borderBottom: '2px solid var(--line)', flexShrink: 0 }}>
              <h2 className="bap-sec-modal-title" style={{ margin: 0 }}>
                <FileText size={28} />
                {reportType}
              </h2>

              <button
                type="button"
                className="bap-sec-modal-close"
                onClick={() => {
                  setShowReportModal(false);
                  setCurrentReport(null);
                  setReportType('');
                }}
                aria-label="סגירת חלון דוח"
              >
                <X size={22} />
              </button>
            </div>

            <div style={{ padding: '1.5rem 2.25rem 2.25rem', display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
            <div style={{ background: 'var(--paper)', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
              <div>
                <span style={{ fontWeight: 600, color: 'var(--muted)' }}>סה"כ רשומות: </span>
                <span style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--blue)' }}>{currentReport.length}</span>
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>{new Date().toLocaleDateString('he-IL')}</div>
            </div>

            <div style={{ flex: 1, overflow: 'auto', marginBottom: '1.5rem' }}>
              <table>
                <thead style={{ position: 'sticky', top: 0, background: 'var(--blue)', color: '#fff', zIndex: 10 }}>
                  <tr>
                    {currentReport.length > 0 && Object.keys(currentReport[0]).map(key => (
                      <th key={key} style={{ color: '#fff', borderBottom: '2px solid var(--navy)' }}>{key}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {currentReport.map((row, index) => (
                    <tr key={index}>
                      {Object.values(row).map((value, i) => (
                        <td key={i}>{value}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="bap-sec-modal-actions bap-sec-modal-actions--end" style={{ flexShrink: 0 }}>
              <button
                className="bap-sec-btn bap-sec-btn--secondary"
                onClick={() => {
                  setShowReportModal(false);
                  setCurrentReport(null);
                  setReportType('');
                }}
              >
                סגור
              </button>

              <button className="bap-sec-btn bap-sec-btn--success" onClick={downloadReport}>
                <Download size={18} />
                הורד Excel
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SecretaryPanel;
