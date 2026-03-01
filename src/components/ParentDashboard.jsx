import React, { useState, useEffect } from 'react';
import { getParentData, addMoney, getTransactions, getSchools, uploadStudentPhoto } from '../api';
import { getParentStudents, addPayment, addStudent, updateStudent, deleteStudent } from '../api';
import { useNavigate } from 'react-router-dom';
import { 
  User, 
  CreditCard, 
  History, 
  Settings, 
  LogOut,
  Plus,
  Wallet,
  Clock,
  Calendar,
  Phone,
  Mail,
  School,
  Receipt,
  TrendingUp,
  AlertCircle,
  ChefHat,
  DollarSign,
  ArrowRight,
  Check,
  Bell,
  Download,
  RefreshCw,
  X,     
  QrCode,
  UserPlus
} from 'lucide-react';

import SendToPhoneModal from './SendToPhoneModal';
import { Smartphone } from 'lucide-react';  // אם אין כבר

const ParentDashboard = () => {
  const navigate = useNavigate();
  const [selectedChild, setSelectedChild] = useState(0);
  const [showAddMoney, setShowAddMoney] = useState(false);
  
  const [amount, setAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('bit');
  const [isLoading, setIsLoading] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [parentData, setParentData] = useState(null);
const [children, setChildren] = useState([]);
const [loading, setLoading] = useState(true);  
const [transactions, setTransactions] = useState([]);
const [schoolName, setSchoolName] = useState('');
const [menuType, setMenuType] = useState('items');
const [weeklyMenuData, setWeeklyMenuData] = useState([]);
const [uploadingPhoto, setUploadingPhoto] = useState(false);
const [showEditStudent, setShowEditStudent] = useState(false);
const [editingStudent, setEditingStudent] = useState(null);
const [showAddStudent, setShowAddStudent] = useState(false);
const [showSettingsModal, setShowSettingsModal] = useState(false);

const [addMoneyAmount, setAddMoneyAmount] = useState('');
const [selectedStudent, setSelectedStudent] = useState(null);

const [showQRModal, setShowQRModal] = useState(false);
const [currentQR, setCurrentQR] = useState(null);
const [loadingQR, setLoadingQR] = useState(false);
const [showSendToPhone, setShowSendToPhone] = useState(false);
const [newStudent, setNewStudent] = useState({
  first_name: '',
  last_name: '',
  grade: '',
  student_phone: '',
  student_id_number: '',
  system_access: false,
  can_edit_profile: false,
  spending_limit: 50,
  parent_notifications: true,
  can_order_for_friends: false,
  max_daily_meals: 2
});


  
  
  

  // הודעות והתראות - דינמיות מנתוני הילדים
const systemNotifications = [
  // התראות יתרה נמוכה
  ...children
    .filter(child => (child.balance || 0) < 50)
    .map((child, index) => ({
      id: `balance-${index}`,
      type: 'balance',
      message: `יתרה נמוכה עבור ${child.first_name} - נותרו ₪${(child.balance || 0).toFixed(2)}`,
      time: 'עכשיו',
      urgent: (child.balance || 0) < 20
    })),
  // התראה כללית
  {
    id: 'menu',
    type: 'menu',
    message: 'תפריט שבועי זמין לצפייה',
    time: 'היום',
    urgent: false
  }
];


  useEffect(() => {
  const loadParentData = async () => {
    try {
      const currentUser = JSON.parse(localStorage.getItem('currentUser'));
      if (!currentUser) {
        navigate('/login');
        return;
      }

      const data = await getParentData(currentUser.id);
      if (data.success) {
        setParentData(data.parent);
        setChildren(data.children);
      }

      // טען שם בית ספר, סוג תפריט ותפריט
if (data.children && data.children.length > 0) {
  const schoolsData = await getSchools();
  if (schoolsData.success) {
    const school = schoolsData.schools.find(s => s.id === data.children[0].school_id);
    if (school) {

      console.log('=== SCHOOL DATA ===');
  console.log('School name:', school.name);
  console.log('School menu_type:', school.menu_type);
  console.log('School ID:', school.id);

      setSchoolName(school.name);
      setMenuType(school.menu_type || 'items');
      
      // טען תפריט לפי סוג
      if (school.menu_type === 'daily') {
        const dailyResponse = await fetch(`https://api.bonapp.dev/api/daily-menu/${school.id}`);
        const dailyData = await dailyResponse.json();

        console.log('=== DAILY MENU DATA ===');
  console.log('Daily data:', dailyData);
  console.log('Daily menu array:', dailyData.dailyMenu);


        if (dailyData.success) {
          // המר לפורמט של weeklyMenuData
          const daysNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
          const formattedMenu = daysNames.map((day, index) => {
            const dayMenu = dailyData.dailyMenu.find(d => d.day_of_week === index);
            return {
              day,
              menu: dayMenu?.menu_description || 'לא הוגדר תפריט',
              price: dayMenu?.price || 0
            };
          });
          setWeeklyMenuData(formattedMenu);

          console.log('=== FORMATTED MENU ===');
console.log('Formatted menu:', formattedMenu);
console.log('weeklyMenuData state:', weeklyMenuData);

        }
      }
    }
  }
}



      // טען עסקאות
      const transactionsData = await getTransactions(currentUser.id);
      if (transactionsData.success) {
        setTransactions(transactionsData.transactions);
      }

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  loadParentData();
  
}, [navigate]);


  const handleAddMoney = async () => {
  if (!amount || parseFloat(amount) <= 0) return;
  
  setIsLoading(true);
  const selectedChildData = children[selectedChild];
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  try {
    // אם זה Paybox - נתהליך אחרת
    if (paymentMethod === 'paybox') {
      const response = await fetch('https://api.bonapp.dev/api/create-paybox-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: selectedChildData.id,
          amount: parseFloat(amount),
          parentId: currentUser.id
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // פתח חלון חדש לתשלום Paybox
        if (result.paymentUrl.includes('#paybox-demo')) {
          // סביבת פיתוח
          alert(`🔧 סביבת פיתוח\n\nכשיהיה Paybox אמיתי:\n- יפתח חלון תשלום\n- הורה ישלם\n- יתרה תתעדכן אוטומטית\n\nסכום: ₪${amount}\nעסקה: ${result.transactionId}`);
          setShowAddMoney(false);
          setAmount('');
        } else {
          // Paybox אמיתי
          window.open(result.paymentUrl, '_blank', 'width=600,height=700');
          alert('חלון התשלום נפתח!\nלאחר התשלום היתרה תתעדכן אוטומטית.');
          setShowAddMoney(false);
          setAmount('');
        }
      } else {
        alert(result.message || 'שגיאה ביצירת תשלום Paybox');
      }
    } else {
      // שיטות תשלום אחרות (ביט, אשראי, מזומן)
      const result = await addMoney(selectedChildData.id, parseFloat(amount), paymentMethod);
      
      if (result.success) {
        // עדכן את יתרת הילד במקומי
        const updatedChildren = [...children];
        updatedChildren[selectedChild] = {
          ...updatedChildren[selectedChild],
          balance: result.newBalance
        };
        setChildren(updatedChildren);
        
        alert(`תשלום ${paymentMethod} בוצע בהצלחה!\nיתרה חדשה: ₪${result.newBalance.toFixed(2)}\n\n(בסביבה אמיתית - זה יעבור דרך שירות תשלומים חיצוני)`);
        setShowAddMoney(false);
        setAmount('');
      } else {
        alert(result.message || 'שגיאה בהוספת כסף');
      }
    }
  } catch (error) {
    console.error('Add money error:', error);
    alert('שגיאה בהוספת כסף. נסה שוב.');
  }
  
  setIsLoading(false);
};


const handlePhotoUpload = async (childIndex, file) => {
  if (!file) return;
  
  setUploadingPhoto(true);
  
  try {
    const reader = new FileReader();
    reader.onload = async (e) => {
      const photoData = e.target.result;
      
      // העלה ל-Supabase
      const childId = children[childIndex].id;
      const result = await uploadStudentPhoto(childId, photoData);
      
      if (result.success) {
        // עדכן את ה-state עם ה-URL החדש
        const updatedChildren = [...children];
        updatedChildren[childIndex] = {
          ...updatedChildren[childIndex],
          photo_url: result.photoUrl
        };
        setChildren(updatedChildren);
        
        alert('התמונה הועלתה בהצלחה!');
      } else {
        alert('שגיאה בהעלאת תמונה');
      }
      
      setUploadingPhoto(false);
    };
    
    reader.readAsDataURL(file);
  } catch (error) {
    alert('שגיאה בהעלאת תמונה');
    setUploadingPhoto(false);
  }
};

const handleEditStudent = (student) => {
  setEditingStudent(student);
  setShowEditStudent(true);
};

const handleSaveStudent = async () => {
  console.log('=== SAVING STUDENT ===');
  console.log('Editing student:', editingStudent);

  try {
    const result = await updateStudent(editingStudent.id, {
      first_name: editingStudent.first_name,
      last_name: editingStudent.last_name,
      grade: editingStudent.grade,
      student_phone: editingStudent.student_phone,
      student_id_number: editingStudent.student_id_number,
      system_access: editingStudent.system_access,
      can_edit_profile: editingStudent.can_edit_profile,
      spending_limit: editingStudent.spending_limit,
      parent_notifications: editingStudent.parent_notifications,
      can_order_for_friends: editingStudent.can_order_for_friends,
      max_daily_meals: editingStudent.max_daily_meals
    });

    console.log('Update result:', result);

    if (result.success) {
      setChildren(prev => prev.map(s => 
        s.id === editingStudent.id ? result.student : s
      ));
      setShowEditStudent(false);
      setEditingStudent(null);
      alert('הפרטים עודכנו בהצלחה!');
    } else {
      alert(result.message || 'שגיאה בעדכון פרטים');
    }
  } catch (error) {
    console.error('Save error:', error);

    alert('שגיאה בעדכון פרטים');
  }
};

const handleAddStudent = async () => {
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));
  
  if (!newStudent.first_name || !newStudent.grade) {
    alert('נא למלא שם פרטי וכיתה');
    return;
  }

  try {
    const result = await addStudent({
      parent_id: currentUser.id,
      school_id: currentUser.school_id,
      ...newStudent
    });

    if (result.success) {
      setChildren(prev => [...prev, result.student]);
      setShowAddStudent(false);
      setNewStudent({
        first_name: '',
        last_name: '',
        grade: '',
        student_phone: ''
      });
      alert('התלמיד נוסף בהצלחה!');
    } else {
      alert(result.message || 'שגיאה בהוספת תלמיד');
    }
  } catch (error) {
    alert('שגיאה בהוספת תלמיד');
  }
};

const handleDeleteStudent = async (studentId, studentName) => {
  if (!window.confirm(`האם אתה בטוח שברצונך למחוק את ${studentName}?\nפעולה זו לא ניתנת לביטול.`)) {
    return;
  }

  try {
    const result = await deleteStudent(studentId);

    if (result.success) {
      setChildren(prev => prev.filter(s => s.id !== studentId));
      alert(result.message);
    } else {
      alert(result.message || 'שגיאה במחיקת תלמיד');
    }
  } catch (error) {
    alert('שגיאה במחיקת תלמיד');
  }
};


const handleShowQR = async (studentId) => {
  try {
    setLoadingQR(true);
    
    // נסה ליצור/לטעון QR code
    const createResponse = await fetch(`https://api.bonapp.dev/api/students/${studentId}/create-qr`, {
      method: 'POST'
    });
    
    const createResult = await createResponse.json();
    
    if (!createResult.success) {
      alert('שגיאה ביצירת QR code');
      return;
    }
    
    // עכשיו תצור תמונה
    const imageResponse = await fetch(`https://api.bonapp.dev/api/students/${studentId}/generate-qr`, {
      method: 'POST'
    });
    
    const imageResult = await imageResponse.json();
    
    if (imageResult.success) {
      setCurrentQR(imageResult);
      setShowQRModal(true);
    } else {
      alert('שגיאה ביצירת תמונת QR');
    }
  } catch (error) {
    console.error('QR error:', error);
    alert('שגיאה בטעינת QR code');
  } finally {
    setLoadingQR(false);
  }
};

const handlePrintQR = () => {
  const printWindow = window.open('', '_blank');
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>QR Code - ${children[selectedChild]?.first_name}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          text-align: center;
          padding: 2rem;
        }
        h1 {
          color: #2c3e50;
          margin-bottom: 1rem;
        }
        img {
          max-width: 400px;
          border: 2px solid #000;
          padding: 1rem;
          margin: 2rem 0;
        }
        .code {
          font-size: 1.5rem;
          font-weight: bold;
          font-family: monospace;
          margin-top: 1rem;
        }
        @media print {
          button { display: none; }
        }
      </style>
    </head>
    <body>
      <h1>QR Code - ${children[selectedChild]?.first_name} ${children[selectedChild]?.last_name}</h1>
      <p>בית ספר: ${schoolName}</p>
      <img src="${currentQR.qrImage}" alt="QR Code" />
      <div class="code">קוד: ${currentQR.qrCode}</div>
      <p style="margin-top: 2rem; color: #666;">
        סרוק את הקוד במזנון בית הספר לביצוע רכישות
      </p>
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => printWindow.print(), 250);
};

const handleShareWhatsApp = async () => {
  // קודם הורד את התמונה
  const link = document.createElement('a');
  link.href = currentQR.qrImage;
  link.download = `QR_${children[selectedChild]?.first_name}_${currentQR.qrCode}.png`;
  link.click();
  
  // אחר כך פתח WhatsApp
  setTimeout(() => {
    const message = `🎓 QR Code - ${children[selectedChild]?.first_name} ${children[selectedChild]?.last_name}

🏫 בית ספר: ${schoolName}
🔑 קוד תלמיד: ${currentQR.qrCode}

התמונה הורדה למכשיר! שתף אותה יחד עם ההודעה הזו 📱`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
    
    alert('✅ התמונה הורדה!\n\n📱 עכשיו שתף אותה ב-WhatsApp ידנית יחד עם ההודעה');
  }, 500);
};

const handleSendEmail = async () => {
  try {
    const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!user.email) {
      alert('לא נמצא כתובת מייל');
      return;
    }
    
    const confirmed = window.confirm(`האם לשלוח את ה-QR Code ל-${user.email}?`);
    if (!confirmed) return;
    
    const response = await fetch(`https://api.bonapp.dev/api/students/${children[selectedChild]?.id}/send-qr-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parentEmail: user.email,
        parentName: user.name || `${user.first_name} ${user.last_name}`,
        studentName: `${children[selectedChild]?.first_name} ${children[selectedChild]?.last_name}`,
        schoolName: schoolName
      })
    });
    
    const result = await response.json();
    
    if (result.success) {
      alert('✅ המייל נשלח בהצלחה!');
    } else {
      alert('❌ שגיאה בשליחת מייל');
    }
  } catch (error) {
    console.error('Email error:', error);
    alert('❌ שגיאה בשליחת מייל');
  }
};

  // תרשים הוצאות שבועי פשוט
  const WeeklyChart = ({ data }) => {
    const days = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'];
    const maxAmount = Math.max(...data);
    

    
    return (
      <div style={{
        display: 'flex',
        alignItems: 'end',
        justifyContent: 'space-between',
        gap: '0.25rem',
        height: '60px',
        padding: '0.5rem 0'
      }}>
        {data.map((amount, index) => (
          <div key={index} style={{ textAlign: 'center', flex: 1 }}>
            <div style={{
              height: `${amount === 0 ? 2 : (amount / maxAmount) * 50 + 2}px`,
              backgroundColor: amount === 0 ? '#e0e0e0' : '#4CAF50',
              borderRadius: '2px',
              margin: '0 auto 0.25rem',
              width: '16px',
              transition: 'all 0.3s'
            }} />
            <div style={{
              fontSize: '0.7rem',
              color: '#666',
              fontWeight: amount > 0 ? 'bold' : 'normal'
            }}>
              {days[index]}
            </div>
          </div>
        ))}
      </div>
    );
  };

  const child = children[selectedChild];

  const styles = {
    container: {
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    },
    header: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '16px', 
      padding: '2rem',
      marginBottom: '2rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(20px)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: '1rem'
    },
    logoSection: {
      display: 'flex', 
      alignItems: 'center', 
      gap: '1rem'
    },
    logoIcon: {
      width: '60px',
      height: '60px',
      background: 'linear-gradient(135deg, #667eea, #764ba2)',
      borderRadius: '16px',
      display: 'flex',
      alignItems: 'center', 
      justifyContent: 'center'
    },
    welcomeText: {
      fontSize: '1.8rem',
      fontWeight: 'bold',
      color: '#1a1a1a', 
      margin: 0
    },
    schoolText: {
      color: '#666', 
      fontSize: '1rem', 
      margin: '0.25rem 0 0 0'
    },
    summaryCards: {
      display: 'flex',
      gap: '1rem',
      alignItems: 'center'
    },
    summaryCard: {
      textAlign: 'center',
      padding: '0.75rem 1rem',
      background: 'rgba(255, 255, 255, 0.7)',
      borderRadius: '12px',
      border: '1px solid rgba(255, 255, 255, 0.3)'
    },
    summaryValue: {
      fontSize: '1.3rem',
      fontWeight: 'bold',
      color: '#667eea',
      margin: 0
    },
    summaryLabel: {
      fontSize: '0.8rem',
      color: '#666',
      margin: '0.25rem 0 0 0'
    },
    actionButtons: {
      display: 'flex',
      gap: '0.5rem'
    },
    actionButton: {
      background: '#f8f9fa',
      border: 'none',
      borderRadius: '12px',
      padding: '1rem',
      cursor: 'pointer',
      transition: 'all 0.3s',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    mainGrid: {
      display: 'grid',
      gridTemplateColumns: '2fr 1fr',
      gap: '2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    },
    card: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '16px',
      padding: '2rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(20px)'
    },
    childrenSection: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    },
    cardTitle: {
      fontSize: '1.4rem',
      fontWeight: 'bold',
      color: '#1a1a1a',
      margin: '0 0 1.5rem 0',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    childTabs: {
      display: 'flex',
      gap: '0.5rem', 
      marginBottom: '2rem',
      flexWrap: 'wrap'
    },
    childTab: {
      padding: '1rem 2rem',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s',
      fontWeight: '600',
      fontSize: '1rem',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    childCard: {
      border: '2px solid #f0f0f0',
      borderRadius: '16px',
      padding: '2rem', 
      background: 'linear-gradient(135deg, #f8f9fa 0%, #ffffff 100%)',
      position: 'relative',
      overflow: 'hidden'
    },
    childHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '2rem',
      flexWrap: 'wrap',
      gap: '1rem'
    },
    childInfo: {
      display: 'flex',
      alignItems: 'center',
      gap: '1rem'
    },
    childPhoto: {
      width: '80px',
      height: '80px',
      borderRadius: '50%',
      border: '3px solid #4CAF50',
      objectFit: 'cover'
    },
    childDetails: {
      textAlign: 'right'
    },
    childName: {
      fontSize: '1.4rem',
      fontWeight: 'bold',
      color: '#1a1a1a',
      margin: '0 0 0.5rem 0'
    },
    childMeta: {
      color: '#666', 
      fontSize: '0.9rem', 
      margin: '0.25rem 0'
    },
    balanceSection: {
      textAlign: 'center',
      padding: '1rem',
      background: 'rgba(76, 175, 80, 0.1)',
      borderRadius: '12px',
      border: '2px solid rgba(76, 175, 80, 0.2)'
    },
    balanceAmount: {
      fontSize: '2.5rem',
      fontWeight: 'bold', 
      color: '#4CAF50',
      margin: 0
    },
    balanceLabel: {
      color: '#666', 
      fontSize: '0.9rem', 
      margin: '0.25rem 0 0 0'
    },
    statsGrid: {
      display: 'grid',
      gridTemplateColumns: '1fr 1fr 1fr',
      gap: '1rem',
      marginBottom: '2rem'
    },
    statCard: {
      textAlign: 'center',
      padding: '1rem',
      background: 'white',
      borderRadius: '12px',
      border: '1px solid #e0e0e0',
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)'
    },
    statValue: {
      fontSize: '1.2rem',
      fontWeight: 'bold',
      margin: '0 0 0.25rem 0'
    },
    statLabel: {
      fontSize: '0.8rem', 
      color: '#666', 
      margin: 0
    },
    chartSection: {
      background: 'white',
      padding: '1rem',
      borderRadius: '12px',
      border: '1px solid #e0e0e0',
      marginBottom: '2rem'
    },
    chartTitle: {
      fontSize: '1rem',
      fontWeight: 'bold',
      color: '#1a1a1a',
      margin: '0 0 1rem 0',
      textAlign: 'center'
    },
    quickActions: {
      display: 'flex',
      gap: '0.75rem',
      flexWrap: 'wrap'
    },
    quickButton: {
      padding: '1rem 1.5rem',
      borderRadius: '12px',
      border: 'none',
      cursor: 'pointer',
      transition: 'all 0.3s',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontWeight: '600',
      fontSize: '0.9rem',
      flex: 1,
      minWidth: '150px',
      justifyContent: 'center'
    },
    primaryButton: {
      background: 'linear-gradient(135deg, #4CAF50, #45a049)',
      color: 'white',
      boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
    },
    secondaryButton: {
      background: '#f8f9fa',
      color: '#666',
      border: '1px solid #e0e0e0'
    },
    sidebar: {
      display: 'flex',
      flexDirection: 'column',
      gap: '2rem'
    }
  };

  return (
    <div style={styles.container}>

      {loading ? (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: 'white'
      }}>
        טוען נתונים...
      </div>
    ) : !parentData ? (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: 'white'
      }}>
        שגיאה בטעינת נתונים
      </div>
    ) : (
      <>

      {/* כותרת עליונה משופרת */}
      <div style={styles.header}>
        <div style={styles.logoSection}>
          <div style={styles.logoIcon}>
            <School size={28} color="white" />
          </div>
          <div>
            <h1 style={styles.welcomeText}>שלום, {parentData?.name || 'משתמש'}</h1>
            <p style={styles.schoolText}>{schoolName || 'בית ספר'}</p>
          </div>
        </div>
        
        <div style={styles.summaryCards}>
          <div style={styles.summaryCard}>
            <p style={styles.summaryValue}>₪{(children || []).reduce((sum, child) => sum + (children[selectedChild]?.balance || 0), 0).toFixed(2)}</p>
            <p style={styles.summaryLabel}>סה״כ יתרות</p>
          </div>
          <div style={styles.summaryCard}>
            <p style={styles.summaryValue}>
  ₪{transactions
    .filter(t => t.type === 'meal' && new Date(t.transaction_date).getMonth() === new Date().getMonth())
    .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    .toFixed(2)}
</p>

            <p style={styles.summaryLabel}>הוצאות החודש</p>
          </div>
        </div>
        
        <div style={styles.actionButtons}>
          <button 
            style={styles.actionButton}
            onClick={() => setNotifications([])}
            title="התראות"
          >
            <Bell size={20} />
            {systemNotifications.length > 0 && (
              <div style={{
                position: 'absolute',
                top: '0.5rem',
                right: '0.5rem',
                background: '#f44336',
                color: 'white',
                borderRadius: '50%',
                width: '18px',
                height: '18px',
                fontSize: '0.7rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                {systemNotifications.length}
              </div>
            )}
          </button>

{/* 👇 כפתור חדש - שלח לטלפון */}
  <button 
    style={{
      ...styles.actionButton,
      background: 'linear-gradient(135deg, #25D366, #128C7E)',
      color: 'white'
    }}
    onClick={() => setShowSendToPhone(true)}
    title="שלח אפליקציה לטלפון"
  >
    <Smartphone size={20} />
  </button>

  {/* 👇 כפתור חדש - שלח לטלפון */}
  <button 
    style={{
      ...styles.actionButton,
      background: 'linear-gradient(135deg, #25D366, #128C7E)',
      color: 'white'
    }}
    onClick={() => setShowSendToPhone(true)}
    title="שלח אפליקציה לטלפון"
  >
    <Smartphone size={20} />
  </button>


<button
  onClick={() => setShowAddMoney(true)}
  style={{
    padding: '0.75rem 1.5rem',
    background: 'linear-gradient(135deg, #4caf50, #66bb6a)',
    color: 'white',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: '600',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)',
    transition: 'all 0.3s'
  }}
  onMouseEnter={(e) => {
    e.target.style.transform = 'translateY(-2px)';
    e.target.style.boxShadow = '0 6px 20px rgba(76, 175, 80, 0.4)';
  }}
  onMouseLeave={(e) => {
    e.target.style.transform = 'translateY(0)';
    e.target.style.boxShadow = '0 4px 15px rgba(76, 175, 80, 0.3)';
  }}
>
  💰 הוסף כסף
</button>

          <button 
  style={styles.actionButton}
  onClick={() => setShowSettingsModal(true)}
  title="הגדרות"
>
  <Settings size={20} />
</button>

          <button 
            style={styles.actionButton}
            onClick={() => navigate('/')}
            title="יציאה"
          >
            <LogOut size={20} />
          </button>
        </div>
      </div>

      <div style={styles.mainGrid}>
        {/* עמודה ראשית - ילדים */}
        <div style={styles.childrenSection}>
          {/* כרטיס ילדים */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              <User size={24} />
              הילדים שלי
            </h2>

          {/* טאבים של ילדים */}
<div style={{
  display: 'flex',
  gap: '1rem',
  alignItems: 'center',
  marginBottom: '2rem',
  flexWrap: 'wrap'
}}>
  {children.map((child, index) => (
  <button
    key={child.id}
      onClick={() => setSelectedChild(index)}
      style={{
        ...styles.childTab,
        background: selectedChild === index ? 
          'linear-gradient(135deg, #667eea, #764ba2)' : '#f8f9fa',
        color: selectedChild === index ? 'white' : '#666'
      }}
    >
      {child?.first_name}
    </button>
  ))}
  
  
</div>


{/* כרטיס הילד הנבחר */}
<div style={styles.childCard}>
  <div style={styles.childHeader}>
    <div style={styles.childInfo}>
      <div style={{ position: 'relative' }}>
  <img 
    src={children[selectedChild]?.photo_url || `https://via.placeholder.com/120/4CAF50/FFFFFF?text=${children[selectedChild]?.first_name?.[0] || 'X'}`} 
    alt={`${children[selectedChild]?.first_name} ${children[selectedChild]?.last_name}`}
    style={styles.childPhoto}
  />
  <label 
    htmlFor={`photo-upload-${selectedChild}`}
    style={{
      position: 'absolute',
      bottom: 0,
      right: 0,
      background: '#4CAF50',
      color: 'white',
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
      border: '3px solid white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      transition: 'all 0.3s'
    }}
    title="העלה תמונה"
  >
    📷
  </label>
  <input
    id={`photo-upload-${selectedChild}`}
    type="file"
    accept="image/*"
    onChange={(e) => handlePhotoUpload(selectedChild, e.target.files[0])}
    style={{ display: 'none' }}
    disabled={uploadingPhoto}
  />
</div>


      <div style={styles.childDetails}>
        <h3 style={styles.childName}>
          {children[selectedChild]?.first_name} {children[selectedChild]?.last_name}
        </h3>
        <p style={styles.childMeta}>
          כיתה {children[selectedChild]?.grade} • {children[selectedChild]?.student_phone}
        </p>
        <p style={styles.childMeta}>
          ארוחה אחרונה: {children[selectedChild]?.lastMeal || 'אין מידע'}
        </p>
      </div>
    </div>
                
                <div style={styles.balanceSection}>
                  <p style={styles.balanceAmount}>
                    ₪{(children[selectedChild]?.balance || 0).toFixed(2)}
                  </p>
                  <p style={styles.balanceLabel}>יתרה נוכחית</p>
                </div>
              </div>

              {/* סטטיסטיקות */}
              <div style={styles.statsGrid}>
                <div style={styles.statCard}>
                  <p style={{
                    ...styles.statValue,
                    color: children[selectedChild]?.canBuyToday !== false ? '#4caf50' : '#f44336'
                  }}>
                    {'זמין'}
                  </p>
                  <p style={styles.statLabel}>סטטוס</p>
                </div>
                
                <div style={styles.statCard}>
                  <p style={styles.statValue}>{0}</p>
                  <p style={styles.statLabel}>ארוחות החודש</p>
                </div>
                
                <div style={styles.statCard}>
                  <p style={styles.statValue}>₪{0.00}</p>
                  <p style={styles.statLabel}>ממוצע יומי</p>
                </div>
              </div>

              {/* תרשים הוצאות שבועי */}
              <div style={styles.chartSection}>
                <h4 style={styles.chartTitle}>הוצאות השבוע</h4>
                <WeeklyChart data={[0,0,0,0,0,0,0]} />
              </div>

              {/* כפתורי פעולות מהירות */}
              <div style={styles.quickActions}>
                <button
                  onClick={() => setShowAddMoney(true)}
                  style={{...styles.quickButton, ...styles.primaryButton}}
                >
                  <Plus size={16} />
                  הוסף כסף
                </button>
                
                <button
    onClick={() => handleShowQR(children[selectedChild]?.id)}
    disabled={loadingQR}
    style={{
      ...styles.quickButton, 
      background: '#5b9bd5',
      color: 'white'
    }}
  >
    <QrCode size={16} />
    {loadingQR ? 'טוען...' : 'הצג QR'}
  </button>

                <button style={{...styles.quickButton, ...styles.secondaryButton}}>
                  <History size={16} />
                  היסטוריה מלאה
                </button>
                
                <button style={{...styles.quickButton, ...styles.secondaryButton}}>
                  <Download size={16} />
                  הורד דוח
                </button>
              </div>
            </div>
          </div>

          {/* היסטוריית עסקאות מתקדמת */}
          <div style={styles.card}>
            <h2 style={styles.cardTitle}>
              <Receipt size={24} />
              פעילות אחרונה
              <button style={{
                marginLeft: 'auto',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: '0.5rem',
                borderRadius: '8px',
                transition: 'all 0.3s'
              }}>
                <RefreshCw size={16} />
              </button>
            </h2>
            
            <div style={{maxHeight: '400px', overflowY: 'auto'}}>
              {transactions.map(transaction => (
                <div key={transaction.id} style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '1rem',
                  borderBottom: '1px solid #f0f0f0',
                  borderLeft: `4px solid ${
                    transaction.type === 'payment' ? '#4CAF50' :
                    transaction.type === 'emergency' ? '#FF9800' : '#2196F3'
                  }`
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      marginBottom: '0.25rem'
                    }}>
                      <span style={{
                        fontWeight: '600', 
                        color: '#1a1a1a', 
                        fontSize: '0.95rem'
                      }}>
                        {transaction.students?.first_name}
                      </span>
                      {transaction.type === 'emergency' && (
                        <span style={{
                          background: '#FF9800',
                          color: 'white',
                          padding: '0.1rem 0.4rem',
                          borderRadius: '8px',
                          fontSize: '0.7rem',
                          fontWeight: 'bold'
                        }}>
                          חירום
                        </span>
                      )}
                    </div>
                    <p style={{ 
                      color: '#666', 
                      fontSize: '0.8rem', 
                      margin: '0.25rem 0' 
                    }}>
                      {transaction.description}
                    </p>
                    <p style={{ 
                      color: '#999', 
                      fontSize: '0.75rem', 
                      margin: 0 
                    }}>
                      {transaction.method} • {new Date(transaction.transaction_date).toLocaleString('he-IL')}
                      {transaction.transactionId && ` • ${transaction.transactionId}`}
                    </p>
                  </div>
                  
                  <div style={{
                    fontWeight: 'bold',
                    fontSize: '1.1rem',
                    color: transaction.amount > 0 ? '#4caf50' : '#666',
                    textAlign: 'left',
                    minWidth: '80px'
                  }}>
                    {transaction.amount > 0 ? '+' : ''}₪{Math.abs(transaction.amount).toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* עמודה צדדית */}
        <div style={styles.sidebar}>
          {/* התראות */}
          {systemNotifications.length > 0 && (
  <div style={styles.card}>
    <h3 style={styles.cardTitle}>
      <Bell size={20} />
      התראות
    </h3>
              
              {systemNotifications.map(notification => (
                <div key={notification.id} style={{
                  padding: '1rem',
                  marginBottom: '0.5rem',
                  borderRadius: '8px',
                  background: notification.urgent ? '#fff3cd' : '#f8f9fa',
                  border: `1px solid ${notification.urgent ? '#ffeaa7' : '#e9ecef'}`
                }}>
                  <div style={{
                    fontSize: '0.85rem',
                    color: '#333',
                    marginBottom: '0.25rem',
                    lineHeight: 1.4
                  }}>
                    {notification.message}
                  </div>
                  <div style={{
                    fontSize: '0.7rem',
                    color: '#666'
                  }}>
                    {notification.time}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* תפריט השבוע */}
<div style={styles.card}>
  <h3 style={styles.cardTitle}>
    <ChefHat size={20} />
    תפריט השבוע
  </h3>
  
  {weeklyMenuData.length > 0 ? (
    weeklyMenuData.map((day, index) => (
      <div key={index} style={{
        padding: '0.75rem',
        marginBottom: '0.5rem',
        borderRadius: '8px',
        background: '#f8f9fa',
        border: '1px solid #e9ecef'
      }}>
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '0.25rem'
        }}>
          <span style={{
            fontWeight: 'bold',
            color: '#333',
            fontSize: '0.9rem'
          }}>
            {day.day}
          </span>
          <span style={{
            background: '#4CAF50',
            color: 'white',
            padding: '0.2rem 0.5rem',
            borderRadius: '12px',
            fontSize: '0.75rem',
            fontWeight: 'bold'
          }}>
            ₪{day.price}
          </span>
        </div>
        <div style={{
          fontSize: '0.8rem',
          color: '#666',
          lineHeight: 1.3
        }}>
          {day.menu}
        </div>
      </div>
    ))
  ) : (
    <div style={{ textAlign: 'center', color: '#999', padding: '2rem' }}>
      <p>לא הוגדר תפריט שבועי</p>
    </div>
  )}
</div>

          {/* סיכום כספי */}
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>
              <TrendingUp size={20} />
              סיכום כספי
            </h3>
            
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: '#e8f5e8',
                borderRadius: '8px'
              }}>
                <span style={{
                  fontSize: '0.9rem',
                  color: '#2e7d32'
                }}>
                  סה״כ יתרות
                </span>
                <span style={{
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#2e7d32'
                }}>
                  ₪{children.reduce((sum, child) => sum + (child.balance || 0), 0).toFixed(2)}
                </span>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.75rem',
                background: '#fff3e0',
                borderRadius: '8px'
              }}>
                <span style={{
                  fontSize: '0.9rem',
                  color: '#f57c00'
                }}>
                  הוצאות החודש
                </span>
                <span style={{
                  fontSize: '1.1rem',
                  fontWeight: 'bold',
                  color: '#f57c00'
                }}>

                  ₪{transactions
  .filter(t => t.type === 'meal' && new Date(t.transaction_date).getMonth() === new Date().getMonth())
  .reduce((sum, t) => sum + Math.abs(t.amount), 0)
  .toFixed(2)}

                </span>
              </div>
              
              <button style={{
                width: '100%',
                padding: '1rem',
                background: 'linear-gradient(135deg, #667eea, #764ba2)',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}>
                <Download size={16} />
                הורד דוח חודשי
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* מודל הוספת כסף משופר */}
      {showAddMoney && (
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
          zIndex: 1000,
          padding: '1rem'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '16px',
            padding: '2rem',
            maxWidth: '500px',
            width: '100%',
            boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              marginBottom: '2rem'
            }}>
              
              
              <div style={{ position: 'relative' }}>
  <img 
    src={children[selectedChild]?.photo_url || `https://via.placeholder.com/120/4CAF50/FFFFFF?text=${children[selectedChild]?.first_name?.[0] || 'X'}`} 
    alt={`${children[selectedChild]?.first_name} ${children[selectedChild]?.last_name}`}
    style={styles.childPhoto}
  />
  <label 
    htmlFor={`photo-upload-${selectedChild}`}
    style={{
      position: 'absolute',
      bottom: 0,
      right: 0,
      background: '#4CAF50',
      color: 'white',
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      cursor: uploadingPhoto ? 'not-allowed' : 'pointer',
      border: '3px solid white',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      transition: 'all 0.3s'
    }}
    title="העלה תמונה"
  >
    📷
  </label>
  <input
    id={`photo-upload-${selectedChild}`}
    type="file"
    accept="image/*"
    onChange={(e) => handlePhotoUpload(selectedChild, e.target.files[0])}
    style={{ display: 'none' }}
    disabled={uploadingPhoto}
  />
</div>


<div>
  <h3 style={{
    fontSize: '1.4rem',
    fontWeight: 'bold',
    margin: '0 0 0.25rem 0'
  }}>
    הוספת כסף ל{children[selectedChild]?.first_name}
  </h3>
  <p style={{
    fontSize: '0.9rem',
    color: '#666',
    margin: 0
  }}>
                  יתרה נוכחית: ₪{(children[selectedChild]?.balance || 0).toFixed(2)}
                </p>
              </div>
            </div>
            
            <div style={{
              marginBottom: '1.5rem'
            }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                marginBottom: '0.5rem'
              }}>
                סכום להוספה
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="הכנס סכום בש״ח"
                style={{
                  width: '100%',
                  padding: '1rem',
                  border: '2px solid #e0e0e0',
                  borderRadius: '12px',
                  fontSize: '1.2rem',
                  textAlign: 'center',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div style={{
              marginBottom: '1.5rem'
            }}>
              <label style={{
                display: 'block',
                fontSize: '0.9rem',
                fontWeight: '600',
                marginBottom: '1rem'
              }}>
                אמצעי תשלום
              </label>
              
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr 1fr 1fr',
                gap: '0.5rem'
              }}>
                <button
                  type="button"
                  onClick={() => setPaymentMethod('bit')}
                  style={{
                    padding: '1rem',
                    border: '2px solid',
                    borderRadius: '12px',
                    background: paymentMethod === 'bit' ? '#e3f2fd' : 'white',
                    borderColor: paymentMethod === 'bit' ? '#2196f3' : '#e0e0e0',
                    color: paymentMethod === 'bit' ? '#2196f3' : '#666',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}
                >
                  📱<br />ביט
                </button>
                
<button
  type="button"
  onClick={() => setPaymentMethod('paybox')}
  style={{
    padding: '1rem',
    border: '2px solid',
    borderRadius: '12px',
    background: paymentMethod === 'paybox' ? '#e3f2fd' : 'white',
    borderColor: paymentMethod === 'paybox' ? '#2196f3' : '#e0e0e0',
    color: paymentMethod === 'paybox' ? '#2196f3' : '#666',
    cursor: 'pointer',
    transition: 'all 0.3s',
    textAlign: 'center',
    fontSize: '0.9rem',
    fontWeight: '600'
  }}
>
  💳<br />Paybox
</button>


                <button
                  type="button"
                  onClick={() => setPaymentMethod('credit')}
                  style={{
                    padding: '1rem',
                    border: '2px solid',
                    borderRadius: '12px',
                    background: paymentMethod === 'credit' ? '#e3f2fd' : 'white',
                    borderColor: paymentMethod === 'credit' ? '#2196f3' : '#e0e0e0',
                    color: paymentMethod === 'credit' ? '#2196f3' : '#666',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}
                >
                  💳<br />אשראי
                </button>
                
                <button
                  type="button"
                  onClick={() => setPaymentMethod('cash')}
                  style={{
                    padding: '1rem',
                    border: '2px solid',
                    borderRadius: '12px',
                    background: paymentMethod === 'cash' ? '#e3f2fd' : 'white',
                    borderColor: paymentMethod === 'cash' ? '#2196f3' : '#e0e0e0',
                    color: paymentMethod === 'cash' ? '#2196f3' : '#666',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    textAlign: 'center',
                    fontSize: '0.9rem',
                    fontWeight: '600'
                  }}
                >
                  💵<br />מזומן
                </button>
              </div>
            </div>
            
            <div style={{
              fontSize: '0.8rem',
              color: '#666',
              padding: '1rem',
              background: '#f8f9fa',
              borderRadius: '8px',
              marginBottom: '2rem',
              lineHeight: 1.4
            }}>
              <strong>קוד משפחה:</strong> {parentData.uniqueCode}<br />
              {paymentMethod === 'bit' && 'העברה מהירה דרך אפליקציית ביט'}
{paymentMethod === 'paybox' && 'תשלום מאובטח דרך Paybox'}
{paymentMethod === 'credit' && 'תשלום מאובטח בכרטיס אשראי'}
{paymentMethod === 'cash' && 'פנה למזכירה עם המזומן וקוד המשפחה'}
            </div>
            
            <div style={{
              display: 'flex',
              gap: '1rem',
              justifyContent: 'flex-end'
            }}>
              <button
                onClick={() => setShowAddMoney(false)}
                disabled={isLoading}
                style={{
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: isLoading ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  fontWeight: '600',
                  fontSize: '1rem',
                  background: '#f8f9fa',
                  color: '#666'
                }}
              >
                ביטול
              </button>
              
              <button
                onClick={handleAddMoney}
                disabled={!amount || parseFloat(amount) <= 0 || isLoading}
                style={{
                  padding: '1rem 2rem',
                  borderRadius: '12px',
                  border: 'none',
                  cursor: (!amount || parseFloat(amount) <= 0 || isLoading) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontWeight: '600',
                  fontSize: '1rem',
                  background: (!amount || parseFloat(amount) <= 0 || isLoading) ? '#e0e0e0' : 
                             'linear-gradient(135deg, #4CAF50, #45a049)',
                  color: (!amount || parseFloat(amount) <= 0 || isLoading) ? '#999' : 'white',
                  boxShadow: (!amount || parseFloat(amount) <= 0 || isLoading) ? 'none' : 
                            '0 4px 15px rgba(76, 175, 80, 0.3)'
                }}
              >
                {isLoading ? (
                  <>
                    <div style={{
                      width: '16px',
                      height: '16px',
                      border: '2px solid rgba(255,255,255,0.3)',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite'
                    }} />
                    מעבד...
                  </>
                ) : (
                  <>
                    {paymentMethod === 'bit' && '📱 שלם בביט'}
                    {paymentMethod === 'paybox' && '💳 שלם ב-Paybox'}
                    {paymentMethod === 'credit' && '💳 שלם בכרטיס'}
                    {paymentMethod === 'cash' && '💵 הנחיות מזומן'}
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

</>
    )}

      {/* CSS לאנימציה */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

{/* מודל QR Code */}
      {showQRModal && currentQR && (
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
            maxWidth: '400px',
            width: '90%',
            textAlign: 'center',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              color: '#2c3e50',
              marginBottom: '1.5rem'
            }}>
              QR Code - {children[selectedChild]?.first_name}
            </h2>

            {/* תמונת QR */}
            <div style={{
              background: 'white',
              padding: '1rem',
              borderRadius: '12px',
              border: '2px solid #e9ecef',
              marginBottom: '1.5rem'
            }}>
              <img 
                src={currentQR.qrImage} 
                alt="QR Code"
                style={{
                  width: '100%',
                  maxWidth: '300px',
                  height: 'auto'
                }}
              />
            </div>

            {/* קוד טקסט */}
            <div style={{
              background: '#f8f9fa',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem'
            }}>
              <p style={{
                fontSize: '0.85rem',
                color: '#7f8c8d',
                margin: '0 0 0.5rem 0'
              }}>
                קוד תלמיד:
              </p>
              <p style={{
                fontSize: '1.1rem',
                fontWeight: 'bold',
                color: '#2c3e50',
                margin: 0,
                fontFamily: 'monospace'
              }}>
                {currentQR.qrCode}
              </p>
            </div>

            {/* כפתורים */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '0.75rem'
            }}>
              <button
                onClick={() => {
                  const link = document.createElement('a');
                  link.href = currentQR.qrImage;
                  link.download = `QR_${children[selectedChild]?.first_name}_${currentQR.qrCode}.png`;
                  link.click();
                }}
                style={{
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#5cb85c',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📥 הורד
              </button>

              <button
                onClick={handlePrintQR}
                style={{
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#5b9bd5',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                🖨️ הדפס
              </button>

              <button
                onClick={handleSendEmail}
                style={{
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#e74c3c',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                📧 שלח מייל
              </button>

              <button
                onClick={handleShareWhatsApp}
                style={{
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: '#25D366',
                  color: 'white',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                💬 WhatsApp
              </button>

              <button
                onClick={() => {
                  setShowQRModal(false);
                  setCurrentQR(null);
                }}
                style={{
                  padding: '0.75rem',
                  borderRadius: '12px',
                  border: '2px solid #e0e0e0',
                  background: 'white',
                  color: '#666',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  gridColumn: 'span 2'
                }}
              >
                ✖️ סגור
              </button>
            </div>
          </div>
        </div>
      )}

{/* מודל הגדרות מרכזי */}
      {showSettingsModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '2rem',
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2.5rem',
            maxWidth: '900px',
            width: '95%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 10px 40px rgba(0,0,0,0.15)'
          }}>
            {/* כותרת */}
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginBottom: '2rem',
              paddingBottom: '1rem',
              borderBottom: '2px solid #f0f0f0'
            }}>
              <h2 style={{
                fontSize: '1.8rem',
                fontWeight: 'bold',
                color: '#2c3e50',
                margin: 0
              }}>
                ⚙️ ניהול ילדים
              </h2>
              
              <button
                onClick={() => setShowSettingsModal(false)}
                style={{
                  background: '#f8f9fa',
                  border: 'none',
                  borderRadius: '50%',
                  width: '40px',
                  height: '40px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#666'
                }}
              >
                <X size={24} />
              </button>
            </div>

            {/* כפתור הוסף ילד */}
            <button
              onClick={() => {
                setShowSettingsModal(false);
                setShowAddStudent(true);
              }}
              style={{
                width: '100%',
                padding: '1rem',
                background: '#5b9bd5',
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
              }}
            >
              <UserPlus size={20} />
              הוסף ילד חדש
            </button>

            {/* רשימת ילדים */}
            {children.map((child, index) => (
              <div key={child.id} style={{
                background: '#f8f9fa',
                borderRadius: '16px',
                padding: '1.5rem',
                marginBottom: '1.5rem',
                border: '1px solid #e9ecef'
              }}>
                {/* כותרת הילד */}
                <div style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: '1.5rem'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <img 
                      src={child.photo_url || `https://via.placeholder.com/60/5b9bd5/FFFFFF?text=${child.first_name?.[0] || 'X'}`}
                      alt={child.first_name}
                      style={{
                        width: '60px',
                        height: '60px',
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '3px solid white',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                      }}
                    />
                    <div>
                      <h3 style={{
                        fontSize: '1.3rem',
                        fontWeight: 'bold',
                        color: '#2c3e50',
                        margin: '0 0 0.25rem 0'
                      }}>
                        {child.first_name} {child.last_name}
                      </h3>
                      <p style={{
                        fontSize: '0.9rem',
                        color: '#7f8c8d',
                        margin: 0
                      }}>
                        כיתה {child.grade} • {child.student_phone}
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEditStudent(child)}
                      style={{
                        background: '#5b9bd5',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.5rem 1rem',
                        cursor: 'pointer',
                        fontSize: '0.9rem',
                        fontWeight: '600',
                        transition: 'all 0.3s'
                      }}
                    >
                      ✏️ ערוך
                    </button>
                    
                    {children.length > 1 && (
                      <button
                        onClick={() => handleDeleteStudent(child.id, child.first_name)}
                        style={{
                          background: 'white',
                          color: '#e74c3c',
                          border: '1px solid #e74c3c',
                          borderRadius: '8px',
                          padding: '0.5rem 1rem',
                          cursor: 'pointer',
                          fontSize: '0.9rem',
                          fontWeight: '600',
                          transition: 'all 0.3s'
                        }}
                      >
                        🗑️ מחק
                      </button>
                    )}
                  </div>
                </div>

                {/* סיכום הגדרות */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '0.75rem',
                  fontSize: '0.9rem',
                  color: '#555'
                }}>
                  <div style={{
                    padding: '0.5rem',
                    background: 'white',
                    borderRadius: '8px'
                  }}>
                    <strong>גישה למערכת:</strong> <span style={{ color: child.system_access ? '#5cb85c' : '#95a5a6' }}>{child.system_access ? '✓ פעיל' : '○ כבוי'}</span>
                  </div>
                  <div style={{
                    padding: '0.5rem',
                    background: 'white',
                    borderRadius: '8px'
                  }}>
                    <strong>עריכת פרטים:</strong> <span style={{ color: child.can_edit_profile ? '#5cb85c' : '#95a5a6' }}>{child.can_edit_profile ? '✓ פעיל' : '○ כבוי'}</span>
                  </div>
                  <div style={{
                    padding: '0.5rem',
                    background: 'white',
                    borderRadius: '8px'
                  }}>
                    <strong>הזמנה לחברים:</strong> <span style={{ color: child.can_order_for_friends ? '#5cb85c' : '#95a5a6' }}>{child.can_order_for_friends ? '✓ פעיל' : '○ כבוי'}</span>
                  </div>
                  <div style={{
                    padding: '0.5rem',
                    background: 'white',
                    borderRadius: '8px'
                  }}>
                    <strong>מגבלה יומית:</strong> <span style={{ color: '#5b9bd5', fontWeight: '600' }}>₪{child.spending_limit || 50}</span>
                  </div>
                  <div style={{
                    padding: '0.5rem',
                    background: 'white',
                    borderRadius: '8px'
                  }}>
                    <strong>ארוחות מקס:</strong> <span style={{ color: '#5b9bd5', fontWeight: '600' }}>{child.max_daily_meals || 2} ביום</span>
                  </div>
                  <div style={{
                    padding: '0.5rem',
                    background: 'white',
                    borderRadius: '8px'
                  }}>
                    <strong>התראות להורה:</strong> <span style={{ color: child.parent_notifications !== false ? '#5cb85c' : '#95a5a6' }}>{child.parent_notifications !== false ? '✓ פעיל' : '○ כבוי'}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

    {/* מודל עריכת ילד */}
      {showEditStudent && editingStudent && (
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
          padding: '2rem',
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2.5rem',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              ✏️ עריכת פרטי {editingStudent.first_name}
            </h2>

            {/* פרטים בסיסיים */}
            <h3 style={{
              fontSize: '1.2rem',
              color: '#667eea',
              marginBottom: '1rem',
              borderBottom: '2px solid #667eea',
              paddingBottom: '0.5rem'
            }}>
              פרטים אישיים
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#555'
                }}>
                  שם פרטי *
                </label>
                <input
                  type="text"
                  value={editingStudent.first_name}
                  onChange={(e) => setEditingStudent({
                    ...editingStudent,
                    first_name: e.target.value
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
                  שם משפחה
                </label>
                <input
                  type="text"
                  value={editingStudent.last_name || ''}
                  onChange={(e) => setEditingStudent({
                    ...editingStudent,
                    last_name: e.target.value
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#555'
                }}>
                  כיתה *
                </label>
                <input
                  type="text"
                  value={editingStudent.grade}
                  onChange={(e) => setEditingStudent({
                    ...editingStudent,
                    grade: e.target.value
                  })}
                  placeholder="א1, ב3, ג5..."
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
                  טלפון תלמיד
                </label>
                <input
                  type="tel"
                  value={editingStudent.student_phone || ''}
                  onChange={(e) => setEditingStudent({
                    ...editingStudent,
                    student_phone: e.target.value
                  })}
                  placeholder="050-1234567"
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

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
                color: '#555'
              }}>
                מספר תעודת זהות
              </label>
              <input
                type="text"
                value={editingStudent.student_id_number || ''}
                onChange={(e) => setEditingStudent({
                  ...editingStudent,
                  student_id_number: e.target.value
                })}
                placeholder="123456789"
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

            {/* הגדרות עצמאות */}
            <h3 style={{
              fontSize: '1.2rem',
              color: '#667eea',
              marginBottom: '1rem',
              borderBottom: '2px solid #667eea',
              paddingBottom: '0.5rem'
            }}>
              הגדרות עצמאות
            </h3>

            <div style={{
              background: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '12px',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingStudent.system_access || false}
                    onChange={(e) => setEditingStudent({
                      ...editingStudent,
                      system_access: e.target.checked
                    })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.95rem' }}>
                    <strong>גישה למערכת:</strong> התלמיד יכול להיכנס למערכת
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingStudent.can_edit_profile || false}
                    onChange={(e) => setEditingStudent({
                      ...editingStudent,
                      can_edit_profile: e.target.checked
                    })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.95rem' }}>
                    <strong>עריכת פרטים:</strong> התלמיד יכול לערוך פרטים אישיים
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingStudent.can_order_for_friends || false}
                    onChange={(e) => setEditingStudent({
                      ...editingStudent,
                      can_order_for_friends: e.target.checked
                    })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.95rem' }}>
                    <strong>הזמנה לחברים:</strong> התלמיד יכול להזמין עבור חברים
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={editingStudent.parent_notifications !== false}
                    onChange={(e) => setEditingStudent({
                      ...editingStudent,
                      parent_notifications: e.target.checked
                    })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.95rem' }}>
                    <strong>התראות להורה:</strong> הורה מקבל התראות על פעילות
                  </span>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#555',
                    fontSize: '0.9rem'
                  }}>
                    מגבלת הוצאה יומית (₪)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={editingStudent.spending_limit || 50}
                    onChange={(e) => setEditingStudent({
                      ...editingStudent,
                      spending_limit: parseFloat(e.target.value) || 0
                    })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      textAlign: 'center',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#555',
                    fontSize: '0.9rem'
                  }}>
                    מקסימום ארוחות ביום
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={editingStudent.max_daily_meals || 2}
                    onChange={(e) => setEditingStudent({
                      ...editingStudent,
                      max_daily_meals: parseInt(e.target.value) || 1
                    })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      textAlign: 'center',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* כפתורים */}
            <div style={{
              display: 'flex',
              gap: '1rem'
            }}>
              <button
                onClick={() => {
                  setShowEditStudent(false);
                  setEditingStudent(null);
                }}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '2px solid #e0e0e0',
                  background: 'white',
                  color: '#666',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ביטול
              </button>
              
              <button
                onClick={handleSaveStudent}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #2196F3, #1976D2)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(33, 150, 243, 0.3)'
                }}
              >
                💾 שמור שינויים
              </button>
            </div>
          </div>
        </div>
      )}

      {/* מודל הוספת ילד */}
      {showAddStudent && (
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
          padding: '2rem',
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'white',
            borderRadius: '20px',
            padding: '2.5rem',
            maxWidth: '700px',
            width: '90%',
            maxHeight: '90vh',
            overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h2 style={{
              fontSize: '1.8rem',
              fontWeight: 'bold',
              color: '#333',
              marginBottom: '2rem',
              textAlign: 'center'
            }}>
              ➕ הוסף ילד חדש
            </h2>

            {/* פרטים בסיסיים */}
            <h3 style={{
              fontSize: '1.2rem',
              color: '#667eea',
              marginBottom: '1rem',
              borderBottom: '2px solid #667eea',
              paddingBottom: '0.5rem'
            }}>
              פרטים אישיים
            </h3>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#555'
                }}>
                  שם פרטי *
                </label>
                <input
                  type="text"
                  value={newStudent.first_name}
                  onChange={(e) => setNewStudent({
                    ...newStudent,
                    first_name: e.target.value
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
                  שם משפחה
                </label>
                <input
                  type="text"
                  value={newStudent.last_name}
                  onChange={(e) => setNewStudent({
                    ...newStudent,
                    last_name: e.target.value
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

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2rem' }}>
              <div>
                <label style={{
                  display: 'block',
                  marginBottom: '0.5rem',
                  fontWeight: '600',
                  color: '#555'
                }}>
                  כיתה *
                </label>
                <input
                  type="text"
                  value={newStudent.grade}
                  onChange={(e) => setNewStudent({
                    ...newStudent,
                    grade: e.target.value
                  })}
                  placeholder="א1, ב3, ג5..."
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
                  טלפון תלמיד
                </label>
                <input
                  type="tel"
                  value={newStudent.student_phone}
                  onChange={(e) => setNewStudent({
                    ...newStudent,
                    student_phone: e.target.value
                  })}
                  placeholder="050-1234567"
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

            <div style={{ marginBottom: '2rem' }}>
              <label style={{
                display: 'block',
                marginBottom: '0.5rem',
                fontWeight: '600',
                color: '#555'
              }}>
                מספר תעודת זהות
              </label>
              <input
                type="text"
                value={newStudent.student_id_number}
                onChange={(e) => setNewStudent({
                  ...newStudent,
                  student_id_number: e.target.value
                })}
                placeholder="123456789"
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

            {/* הגדרות עצמאות */}
            <h3 style={{
              fontSize: '1.2rem',
              color: '#667eea',
              marginBottom: '1rem',
              borderBottom: '2px solid #667eea',
              paddingBottom: '0.5rem'
            }}>
              הגדרות עצמאות
            </h3>

            <div style={{
              background: '#f8f9fa',
              padding: '1.5rem',
              borderRadius: '12px',
              marginBottom: '2rem'
            }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newStudent.system_access}
                    onChange={(e) => setNewStudent({
                      ...newStudent,
                      system_access: e.target.checked
                    })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.95rem' }}>
                    <strong>גישה למערכת:</strong> התלמיד יכול להיכנס למערכת
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newStudent.can_edit_profile}
                    onChange={(e) => setNewStudent({
                      ...newStudent,
                      can_edit_profile: e.target.checked
                    })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.95rem' }}>
                    <strong>עריכת פרטים:</strong> התלמיד יכול לערוך פרטים אישיים
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newStudent.can_order_for_friends}
                    onChange={(e) => setNewStudent({
                      ...newStudent,
                      can_order_for_friends: e.target.checked
                    })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.95rem' }}>
                    <strong>הזמנה לחברים:</strong> התלמיד יכול להזמין עבור חברים
                  </span>
                </label>

                <label style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={newStudent.parent_notifications}
                    onChange={(e) => setNewStudent({
                      ...newStudent,
                      parent_notifications: e.target.checked
                    })}
                    style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                  />
                  <span style={{ fontSize: '0.95rem' }}>
                    <strong>התראות להורה:</strong> הורה מקבל התראות על פעילות
                  </span>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1.5rem' }}>
                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#555',
                    fontSize: '0.9rem'
                  }}>
                    מגבלת הוצאה יומית (₪)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    value={newStudent.spending_limit}
                    onChange={(e) => setNewStudent({
                      ...newStudent,
                      spending_limit: parseFloat(e.target.value) || 0
                    })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      textAlign: 'center',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>

                <div>
                  <label style={{
                    display: 'block',
                    marginBottom: '0.5rem',
                    fontWeight: '600',
                    color: '#555',
                    fontSize: '0.9rem'
                  }}>
                    מקסימום ארוחות ביום
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    value={newStudent.max_daily_meals}
                    onChange={(e) => setNewStudent({
                      ...newStudent,
                      max_daily_meals: parseInt(e.target.value) || 1
                    })}
                    style={{
                      width: '100%',
                      padding: '0.75rem',
                      border: '2px solid #e0e0e0',
                      borderRadius: '8px',
                      fontSize: '1rem',
                      textAlign: 'center',
                      boxSizing: 'border-box'
                    }}
                  />
                </div>
              </div>
            </div>

            {/* כפתורים */}
            <div style={{
              display: 'flex',
              gap: '1rem'
            }}>
              <button
                onClick={() => {
                  setShowAddStudent(false);
                  setNewStudent({
                    first_name: '',
                    last_name: '',
                    grade: '',
                    student_phone: '',
                    student_id_number: '',
                    system_access: false,
                    can_edit_profile: false,
                    spending_limit: 50,
                    parent_notifications: true,
                    can_order_for_friends: false,
                    max_daily_meals: 2
                  });
                }}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '12px',
                  border: '2px solid #e0e0e0',
                  background: 'white',
                  color: '#666',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer'
                }}
              >
                ביטול
              </button>
              
              <button
                onClick={handleAddStudent}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '12px',
                  border: 'none',
                  background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                  color: 'white',
                  fontSize: '1rem',
                  fontWeight: '600',
                  cursor: 'pointer',
                  boxShadow: '0 4px 15px rgba(76, 175, 80, 0.3)'
                }}
              >
                ➕ הוסף
              </button>
            </div>
          </div>
        </div>
      )}

{/* כפתור צף - שלח לטלפון */}
      <button
        onClick={() => setShowSendToPhone(true)}
        style={{
          position: 'fixed',
          bottom: '30px',
          right: '30px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #25D366, #128C7E)',
          color: 'white',
          border: 'none',
          boxShadow: '0 6px 20px rgba(37, 211, 102, 0.4)',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 999,
          transition: 'all 0.3s'
        }}
        title="שלח אפליקציה לטלפון"
        onMouseEnter={(e) => {
          e.currentTarget.style.transform = 'scale(1.1)';
          e.currentTarget.style.boxShadow = '0 8px 30px rgba(37, 211, 102, 0.6)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.transform = 'scale(1)';
          e.currentTarget.style.boxShadow = '0 6px 20px rgba(37, 211, 102, 0.4)';
        }}
      >
        <Smartphone size={28} />
      </button>

      {/* מודל שליחה לטלפון */}
      <SendToPhoneModal
        show={showSendToPhone}
        onClose={() => setShowSendToPhone(false)}
        userType="parent"
        userId={parentData?.id}
        userName={`${parentData?.first_name || ''} ${parentData?.last_name || ''}`}
        userEmail={parentData?.email}
      />
      
      
    </div>
  );
};

export default ParentDashboard;