import React, { useState, useEffect } from 'react';
import { Eye, EyeOff, User, Mail, Phone, School, UserPlus, ArrowRight, Upload, Camera, Settings, Shield, AlertCircle, Bell, Check, X, FileText } from 'lucide-react';
import { getSchools } from '../api';

const ParentRegistrationForm = () => {
  const [formData, setFormData] = useState({
  // שלב 1: פרטי הורה + פרטי קשר נוספים
  familyName: '',
  parentFirstName: '',
  phone: '',
  email: '',
  password: '',
  confirmPassword: '',
  schoolId: '',
  emergencyContact: '',
  emergencyPhone: '',
  address: '',
  
  // שלב 2: פרטי ילדים מפורטים
  children: [{
    firstName: '',
    lastName: '',
    grade: '',
    phone: '',
    photo: null,
    photoPreview: null,
    studentId: '',
    // הגדרות עצמאות לכל ילד
    autonomySettings: {
      systemAccess: false,
      canEditProfile: false,
      spendingLimit: 50,
      parentNotifications: true,
      canOrderForFriends: false,
      maxDailyMeals: 2
    }
  }],
  
  // שלב 3: הגדרות התראות + הסכמות
  notificationSettings: {
    dailyMenu: true,
    paymentConfirmation: true,
    lowBalance: true,
    balanceThreshold: 20,
    weeklyReport: false,
    specialEvents: true,
    systemUpdates: false,
    smsNotifications: true,
    emailNotifications: true
  },
  agreements: {
    terms: false,
    privacy: false,
    schoolPolicy: false
  },
  comments: ''
});
  
  
  const [currentStep, setCurrentStep] = useState(1);
  const [errors, setErrors] = useState({});

  const [schools, setSchools] = useState([]);

useEffect(() => {
  const loadSchools = async () => {
    try {
      const result = await getSchools();
      if (result.success) {
        setSchools(result.schools);
      }
    } catch (error) {
      console.error('Error loading schools:', error);
    }
  };

  loadSchools();
}, []);


  const grades = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב'];

  const validatePhone = (phone) => {
    const phoneRegex = /^05[0-9]-?[0-9]{7}$/;
    return phoneRegex.test(phone.replace(/-/g, ''));
  };

  const updateChild = (index, field, value) => {
    const updatedChildren = [...formData.children];
    updatedChildren[index] = { ...updatedChildren[index], [field]: value };
    setFormData(prev => ({ ...prev, children: updatedChildren }));
  };

  const updateChildAutonomy = (index, setting, value) => {
    const updatedChildren = [...formData.children];
    updatedChildren[index].autonomySettings = {
      ...updatedChildren[index].autonomySettings,
      [setting]: value
    };
    setFormData(prev => ({ ...prev, children: updatedChildren }));
  };

  const updateNotificationSetting = (setting, value) => {
    setFormData(prev => ({
      ...prev,
      notificationSettings: {
        ...prev.notificationSettings,
        [setting]: value
      }
    }));
  };

  const updateAgreement = (agreement, value) => {
    setFormData(prev => ({
      ...prev,
      agreements: {
        ...prev.agreements,
        [agreement]: value
      }
    }));
  };

  const handlePhotoUpload = (index, file) => {
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        updateChild(index, 'photoPreview', e.target.result);
      };
      reader.readAsDataURL(file);
      updateChild(index, 'photo', file);
    }
  };

  const addChild = () => {
    const newChild = {
      firstName: '',
      lastName: '',
      grade: '',
      phone: '',
      photo: null,
      photoPreview: null,
      studentId: '',
      autonomySettings: {
        systemAccess: false,
        canEditProfile: false,
        spendingLimit: 50,
        parentNotifications: true,
        canOrderForFriends: false,
        maxDailyMeals: 2
      }
    };
    setFormData(prev => ({
      ...prev,
      children: [...prev.children, newChild]
    }));
  };

  const removeChild = (index) => {
    const updatedChildren = formData.children.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, children: updatedChildren }));
  };

  const isStep2Valid = () => {
    return formData.children.every(child => 
      child.firstName && 
      child.lastName && 
      child.grade && 
      child.phone && validatePhone(child.phone)
    );
  };

  const isStep3Valid = () => {
    return formData.agreements.terms && 
           formData.agreements.privacy && 
           formData.agreements.schoolPolicy;
  };

  const getStepColor = (step) => {
    if (currentStep > step) return '#4caf50'; // ירוק - הושלם
    if (currentStep === step) return '#2196f3'; // כחול - פעיל
    return '#e0e0e0'; // אפור - לא פעיל
  };

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSubmit = () => {
    // יצירת קוד זיהוי משפחה ייחודי
    const familyCode = `F${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;
    
    // הכנת נתוני QR לילדים
    const childrenWithQR = formData.children.map((child, index) => ({
      ...child,
      qrCode: `${familyCode}-C${index + 1}`,
      studentCode: `${formData.schoolId}-${familyCode}-${index + 1}`
    }));

    const registrationData = {
      ...formData,
      children: childrenWithQR,
      familyCode,
      registrationDate: new Date().toISOString(),
      status: 'pending_verification'
    };

    console.log('נתוני הרשמה מלאים:', registrationData);

    fetch('https://api.bonapp.dev/api/pending-registrations', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    school_id: formData.schoolId,
    parent_name: formData.familyName + ' ' + formData.parentFirstName, // שלב שם משפחה ושם פרטי
    parent_phone: formData.phone,
    parent_email: formData.email,
    children_data: JSON.stringify(childrenWithQR),
    status: 'pending'
  })
})


.then(response => response.json())
.then(data => {
  if (data.success) {
    alert('ההרשמה נשלחה בהצלחה! תקבלו אישור בקרוב.');

    
    
  } else {
    alert('שגיאה בשליחת ההרשמה. נסו שוב.');
  }
})
.catch((error) => {
  console.error('שגיאה בשליחה:', error);
  alert('שגיאה בשליחת ההרשמה. נסו שוב.');
});



    setCurrentStep(4); // מסך הצלחה
  };

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f5f7fa',
      padding: '20px',
      fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif"
    }}>
      <div style={{
        maxWidth: '900px',
        margin: '0 auto',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        overflow: 'hidden'
      }}>
        {/* כותרת */}
        <div style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          padding: '30px',
          textAlign: 'center'
        }}>
          <School size={40} style={{ marginBottom: '10px' }} />
          <h1 style={{ margin: '0 0 10px 0', fontSize: '28px', fontWeight: 'bold' }}>
            הרשמה למערכת ארוחות בית הספר
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: '16px' }}>
            {currentStep === 1 && 'שלב 1: פרטי הורה ובחירת בית ספר'}
            {currentStep === 2 && 'שלב 2: פרטי ילדים והגדרות עצמאות'}
            {currentStep === 3 && 'שלב 3: הגדרות התראות והסכמות'}
            {currentStep === 4 && 'הרשמה הושלמה בהצלחה!'}
          </p>
        </div>

        {/* מדד התקדמות */}
        <div style={{ padding: '30px 30px 20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            {[1, 2, 3].map(step => (
              <React.Fragment key={step}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '50%',
                  backgroundColor: getStepColor(step),
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                  fontSize: '16px',
                  border: currentStep === step ? '3px solid #fff' : 'none',
                  boxShadow: currentStep === step ? `0 0 0 3px ${getStepColor(step)}` : 'none',
                  transition: 'all 0.3s ease'
                }}>
                  {step < currentStep ? <Check size={20} /> : step}
                </div>
                {step < 3 && (
                  <div style={{
                    flex: 1,
                    height: '4px',
                    backgroundColor: getStepColor(step + 0.5),
                    margin: '0 15px',
                    borderRadius: '2px',
                    transition: 'all 0.3s ease'
                  }} />
                )}
              </React.Fragment>
            ))}
          </div>
        </div>

        <div style={{ padding: '0 30px 30px' }}>

{currentStep === 1 && (
  <div style={{ padding: '30px' }}>
    <h3 style={{ color: '#333', marginBottom: '25px', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
      <User size={24} />
      פרטי הורה ובחירת בית ספר
    </h3>

    {/* בחירת בית ספר */}
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
        בית ספר *
      </label>
      <select 
        value={formData.schoolId}
        onChange={(e) => setFormData({...formData, schoolId: e.target.value})}
        style={{ 
          width: '100%', 
          padding: '12px', 
          border: '2px solid #e1e5e9', 
          borderRadius: '8px', 
          fontSize: '16px', 
          textAlign: 'right',
          outline: 'none',
          backgroundColor: 'white'
        }}
      >
        <option value="">בחר בית ספר</option>
        {schools.map(school => (
          <option key={school.id} value={school.id}>{school.name}</option>
        ))}
      </select>
    </div>

    {/* שם פרטי */}
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
        שם פרטי ההורה *
      </label>
      <input
        type="text"
        required
        value={formData.parentFirstName}
        onChange={(e) => setFormData({...formData, parentFirstName: e.target.value})}
        autoComplete="off"
        style={{
          width: '100%',
          padding: '12px',
          border: '2px solid #e1e5e9',
          borderRadius: '8px',
          fontSize: '16px',
          textAlign: 'right',
          outline: 'none'
        }}
        placeholder="שם פרטי"
      />
    </div>

    {/* שם משפחה */}
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
        שם משפחה *
      </label>
      <input
        type="text"
        required
        value={formData.familyName}
        onChange={(e) => setFormData({...formData, familyName: e.target.value})}
        autoComplete="off"
        style={{
          width: '100%',
          padding: '12px',
          border: '2px solid #e1e5e9',
          borderRadius: '8px',
          fontSize: '16px',
          textAlign: 'right',
          outline: 'none'
        }}
        placeholder="שם משפחה"
      />
    </div>

    {/* טלפון */}
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
        טלפון *
      </label>
      <input
        type="tel"
        required
        value={formData.phone}
        onChange={(e) => setFormData({...formData, phone: e.target.value})}
        autoComplete="off"
        style={{
          width: '100%',
          padding: '12px',
          border: '2px solid #e1e5e9',
          borderRadius: '8px',
          fontSize: '16px',
          textAlign: 'right',
          outline: 'none'
        }}
        placeholder="050-1234567"
      />
    </div>

    {/* מייל */}
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
        כתובת מייל *
      </label>
      <input
        type="email"
        required
        value={formData.email}
        onChange={(e) => setFormData({...formData, email: e.target.value})}
        autoComplete="off"
        style={{
          width: '100%',
          padding: '12px',
          border: '2px solid #e1e5e9',
          borderRadius: '8px',
          fontSize: '16px',
          textAlign: 'left',
          outline: 'none'
        }}
        placeholder="parent@example.com"
      />
    </div>

    {/* סיסמה */}
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
        סיסמה *
      </label>
      <input
        type="password"
        required
        value={formData.password}
        onChange={(e) => setFormData({...formData, password: e.target.value})}
        autoComplete="new-password"
        style={{
          width: '100%',
          padding: '12px',
          border: '2px solid #e1e5e9',
          borderRadius: '8px',
          fontSize: '16px',
          textAlign: 'left',
          outline: 'none'
        }}
        placeholder="בחר סיסמה"
      />
    </div>

    {/* אימות סיסמה */}
    <div style={{ marginBottom: '20px' }}>
      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
        אימות סיסמה *
      </label>
      <input
        type="password"
        required
        value={formData.confirmPassword}
        onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
        autoComplete="new-password"
        style={{
          width: '100%',
          padding: '12px',
          border: '2px solid #e1e5e9',
          borderRadius: '8px',
          fontSize: '16px',
          textAlign: 'left',
          outline: 'none'
        }}
        placeholder="הזן את הסיסמה שוב"
      />
      {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
        <p style={{ color: 'red', fontSize: '14px', marginTop: '5px' }}>הסיסמאות אינן תואמות</p>
      )}
    </div>
  </div>
)}

          {/* שלב 2: פרטי ילדים מפורטים + הגדרות עצמאות */}
          {currentStep === 2 && (
            <div>
              <h3 style={{ color: '#333', marginBottom: '25px', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <User size={24} />
                פרטי ילדים והגדרות עצמאות
              </h3>
              
              

              <h4 style={{
                color: '#2e7d32',
                margin: '0 0 25px 0',
                fontSize: '18px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <User size={20} />
                פרטי הילדים
              </h4>
                  {formData.children.map((child, index) => (
  <div key={index} style={{
    border: '2px solid #e1e5e9',
    borderRadius: '12px',
    padding: '25px',
    marginBottom: '25px',
    backgroundColor: '#fafbfc',
    position: 'relative'
  }}>

    {formData.children.length > 1 && (
  <button
    type="button"
    onClick={() => {
      console.log('לוחץ על מחיקת ילד', index);
      removeChild(index);
    }}
    style={{
      position: 'absolute',
      top: '15px',
      left: '15px',
      background: '#f44336',
      color: 'white',
      border: 'none',
      borderRadius: '50%',
      width: '30px',
      height: '30px',
      cursor: 'pointer'
    }}
  >
    ×
  </button>
)}

                  {/* פרטי ילד בסיסיים */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '25px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                        שם פרטי *
                      </label>
                      <input
                        type="text"
                        required
                        value={child.firstName}
                        onChange={(e) => updateChild(index, 'firstName', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e1e5e9',
                          borderRadius: '8px',
                          fontSize: '16px',
                          textAlign: 'right',
                          outline: 'none'
                        }}
                        placeholder="שם פרטי"
                        onFocus={(e) => e.target.style.borderColor = '#2196f3'}
                        onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                        שם משפחה *
                      </label>
                      <input
                        type="text"
                        required
                        value={child.lastName}
                        onChange={(e) => updateChild(index, 'lastName', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e1e5e9',
                          borderRadius: '8px',
                          fontSize: '16px',
                          textAlign: 'right',
                          outline: 'none'
                        }}
                        placeholder="שם משפחה"
                        onFocus={(e) => e.target.style.borderColor = '#2196f3'}
                        onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                      />
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                        כיתה *
                      </label>
                      <select
                        required
                        value={child.grade}
                        onChange={(e) => updateChild(index, 'grade', e.target.value)}

                        autoComplete="off"

                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e1e5e9',
                          borderRadius: '8px',
                          fontSize: '16px',
                          textAlign: 'right',
                          outline: 'none',
                          backgroundColor: 'white'
                        }}
                        onFocus={(e) => e.target.style.borderColor = '#2196f3'}
                        onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                      >
                        <option value="">בחר כיתה</option>
                        {grades.map(grade => (
                          <option key={grade} value={grade}>כיתה {grade}</option>
                        ))}
                      </select>
                    </div>
                    
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                        טלפון התלמיד *
                      </label>
                      <input
                        type="tel"
                        required
                        value={child.phone}
                        onChange={(e) => updateChild(index, 'phone', e.target.value)}

                        autoComplete="off"
                        
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e1e5e9',
                          borderRadius: '8px',
                          fontSize: '16px',
                          textAlign: 'right',
                          outline: 'none'
                        }}
                        placeholder="050-1234567"
                        onFocus={(e) => e.target.style.borderColor = '#2196f3'}
                        onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                      />
                    </div>
                  </div>

                  {/* תעודת זהות ותמונה */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '25px' }}>
                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                        מספר תעודת זהות (אופציונלי)
                      </label>
                      <input
                        type="text"
                        value={child.studentId}
                        onChange={(e) => updateChild(index, 'studentId', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '12px',
                          border: '2px solid #e1e5e9',
                          borderRadius: '8px',
                          fontSize: '16px',
                          textAlign: 'right',
                          outline: 'none'
                        }}
                        placeholder="123456789"
                        onFocus={(e) => e.target.style.borderColor = '#2196f3'}
                        onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333' }}>
                        תמונה (אופציונלי - לזיהוי במטבח)
                      </label>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <label style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '12px 20px',
                          backgroundColor: '#f5f5f5',
                          border: '2px dashed #ccc',
                          borderRadius: '8px',
                          cursor: 'pointer',
                          transition: 'all 0.3s ease',
                          fontSize: '14px'
                        }}
                        onMouseOver={(e) => {
                          e.target.style.backgroundColor = '#e8f4f8';
                          e.target.style.borderColor = '#2196f3';
                        }}
                        onMouseOut={(e) => {
                          e.target.style.backgroundColor = '#f5f5f5';
                          e.target.style.borderColor = '#ccc';
                        }}>
                          <Camera size={20} />
                          העלה תמונה
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => handlePhotoUpload(index, e.target.files[0])}
                            style={{ display: 'none' }}
                          />
                        </label>
                        {child.photoPreview && (
                          <img 
                            src={child.photoPreview} 
                            alt="תצוגה מקדימה"
                            style={{
                              width: '50px',
                              height: '50px',
                              borderRadius: '50%',
                              objectFit: 'cover',
                              border: '2px solid #ddd'
                            }}
                          />
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* הגדרות עצמאות */}
                  <div style={{
                    backgroundColor: '#f0f8ff',
                    border: '2px solid #e3f2fd',
                    borderRadius: '10px',
                    padding: '20px'
                  }}>
                    <h5 style={{
                      margin: '0 0 15px 0',
                      color: '#1565c0',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px'
                    }}>
                      <Settings size={18} />
                      הגדרות עצמאות - {child.firstName || `ילד ${index + 1}`}
                    </h5>
                    
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                      {/* גישה למערכת */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          id={`systemAccess-${index}`}
                          checked={child.autonomySettings.systemAccess}
                          onChange={(e) => updateChildAutonomy(index, 'systemAccess', e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor={`systemAccess-${index}`} style={{ cursor: 'pointer', fontSize: '14px', lineHeight: '1.4' }}>
                          <strong>גישה למערכת:</strong> התלמיד יכול להיכנס למערכת עם פרטי ההורה
                        </label>
                      </div>

                      {/* עריכת פרופיל */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          id={`canEditProfile-${index}`}
                          checked={child.autonomySettings.canEditProfile}
                          onChange={(e) => updateChildAutonomy(index, 'canEditProfile', e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor={`canEditProfile-${index}`} style={{ cursor: 'pointer', fontSize: '14px', lineHeight: '1.4' }}>
                          <strong>עריכת פרטים:</strong> התלמיד יכול לערוך פרטים אישיים
                        </label>
                      </div>

                      {/* הזמנה לחברים */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          id={`canOrderForFriends-${index}`}
                          checked={child.autonomySettings.canOrderForFriends}
                          onChange={(e) => updateChildAutonomy(index, 'canOrderForFriends', e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor={`canOrderForFriends-${index}`} style={{ cursor: 'pointer', fontSize: '14px', lineHeight: '1.4' }}>
                          <strong>הזמנה לחברים:</strong> התלמיד יכול להזמין ארוחות עבור חברים
                        </label>
                      </div>

                      {/* התראות להורה */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <input
                          type="checkbox"
                          id={`parentNotifications-${index}`}
                          checked={child.autonomySettings.parentNotifications}
                          onChange={(e) => updateChildAutonomy(index, 'parentNotifications', e.target.checked)}
                          style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                        />
                        <label htmlFor={`parentNotifications-${index}`} style={{ cursor: 'pointer', fontSize: '14px', lineHeight: '1.4' }}>
                          <strong>התראות להורה:</strong> הורה מקבל התראות על פעילות התלמיד
                        </label>
                      </div>
                    </div>

                    {/* מגבלות כמותיות */}
                    <div style={{ marginTop: '20px', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
                          מגבלת הוצאה יומית (₪)
                        </label>
                        <input
                          type="number"
                          min="0"
                          max="200"
                          value={child.autonomySettings.spendingLimit}
                          onChange={(e) => updateChildAutonomy(index, 'spendingLimit', parseInt(e.target.value) || 0)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '2px solid #e1e5e9',
                            borderRadius: '6px',
                            fontSize: '14px',
                            textAlign: 'center',
                            outline: 'none'
                          }}
                        />
                      </div>

                      <div>
                        <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
                          מקסימום ארוחות ביום
                        </label>
                        <input
                          type="number"
                          min="1"
                          max="5"
                          value={child.autonomySettings.maxDailyMeals}
                          onChange={(e) => updateChildAutonomy(index, 'maxDailyMeals', parseInt(e.target.value) || 1)}
                          style={{
                            width: '100%',
                            padding: '10px',
                            border: '2px solid #e1e5e9',
                            borderRadius: '6px',
                            fontSize: '14px',
                            textAlign: 'center',
                            outline: 'none'
                          }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {/* כפתור הוספת ילד */}
              <button
                onClick={addChild}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '15px 25px',
                  backgroundColor: '#4caf50',
                  color: 'white',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  margin: '0 auto'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
                onMouseOut={(e) => e.target.style.backgroundColor = '#4caf50'}
              >
                <UserPlus size={20} />
                הוסף ילד נוסף
              </button>
            </div>
          )}

          {/* שלב 3: הגדרות התראות + הסכמות + הערות */}
          {currentStep === 3 && (


            <div>
              <h3 style={{ color: '#333', marginBottom: '25px', fontSize: '20px', display: 'flex', alignItems: 'center', gap: '10px' }}>
                <Bell size={24} />
                הגדרות התראות והסכמות
              </h3>
              
              {/* הגדרות התראות */}
              <div style={{
                backgroundColor: '#f8f9fa',
                border: '2px solid #e9ecef',
                borderRadius: '12px',
                padding: '25px',
                marginBottom: '25px'
              }}>
                <h4 style={{ margin: '0 0 20px 0', color: '#495057', fontSize: '18px', fontWeight: 'bold' }}>
                  הגדרות התראות
                </h4>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '15px' }}>
                  {/* תפריט יומי */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="dailyMenu"
                      checked={formData.notificationSettings.dailyMenu}
                      onChange={(e) => updateNotificationSetting('dailyMenu', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="dailyMenu" style={{ cursor: 'pointer', fontSize: '15px' }}>
                      <strong>תפריט יומי:</strong> קבלת תפריט יומי בכל בוקר
                    </label>
                  </div>

                  {/* אישור תשלום */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="paymentConfirmation"
                      checked={formData.notificationSettings.paymentConfirmation}
                      onChange={(e) => updateNotificationSetting('paymentConfirmation', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="paymentConfirmation" style={{ cursor: 'pointer', fontSize: '15px' }}>
                      <strong>אישור תשלום:</strong> התראה על כל תשלום שמתקבל
                    </label>
                  </div>

                  {/* יתרה נמוכה */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="lowBalance"
                      checked={formData.notificationSettings.lowBalance}
                      onChange={(e) => updateNotificationSetting('lowBalance', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="lowBalance" style={{ cursor: 'pointer', fontSize: '15px' }}>
                      <strong>יתרה נמוכה:</strong> התראה כאשר היתרה מתחת לסף שנקבע
                    </label>
                  </div>

                  {/* דוח שבועי */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="weeklyReport"
                      checked={formData.notificationSettings.weeklyReport}
                      onChange={(e) => updateNotificationSetting('weeklyReport', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="weeklyReport" style={{ cursor: 'pointer', fontSize: '15px' }}>
                      <strong>דוח שבועי:</strong> סיכום הוצאות ופעילות שבועי
                    </label>
                  </div>

                  {/* אירועים מיוחדים */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="specialEvents"
                      checked={formData.notificationSettings.specialEvents}
                      onChange={(e) => updateNotificationSetting('specialEvents', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="specialEvents" style={{ cursor: 'pointer', fontSize: '15px' }}>
                      <strong>אירועים מיוחדים:</strong> הודעות על אירועים ופעילויות בבית הספר
                    </label>
                  </div>

                  {/* עדכוני מערכת */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="systemUpdates"
                      checked={formData.notificationSettings.systemUpdates}
                      onChange={(e) => updateNotificationSetting('systemUpdates', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer' }}
                    />
                    <label htmlFor="systemUpdates" style={{ cursor: 'pointer', fontSize: '15px' }}>
                      <strong>עדכוני מערכת:</strong> הודעות על שדרוגים ותכונות חדשות
                    </label>
                  </div>
                </div>

                {/* הגדרות ערוץ התראות */}
                <div style={{ marginTop: '25px', paddingTop: '20px', borderTop: '1px solid #dee2e6' }}>
                  <h5 style={{ margin: '0 0 15px 0', color: '#6c757d', fontSize: '16px' }}>
                    ערוצי התראות
                  </h5>
                  <div style={{ display: 'flex', gap: '25px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        id="smsNotifications"
                        checked={formData.notificationSettings.smsNotifications}
                        onChange={(e) => updateNotificationSetting('smsNotifications', e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor="smsNotifications" style={{ cursor: 'pointer', fontSize: '14px' }}>
                        SMS / WhatsApp
                      </label>
                    </div>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <input
                        type="checkbox"
                        id="emailNotifications"
                        checked={formData.notificationSettings.emailNotifications}
                        onChange={(e) => updateNotificationSetting('emailNotifications', e.target.checked)}
                        style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                      />
                      <label htmlFor="emailNotifications" style={{ cursor: 'pointer', fontSize: '14px' }}>
                        מייל
                      </label>
                    </div>
                  </div>
                </div>

                {/* סף יתרה נמוכה */}
                {formData.notificationSettings.lowBalance && (
                  <div style={{ marginTop: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
                      סף התראה יתרה נמוכה (₪)
                    </label>
                    <input
                      type="number"
                      min="5"
                      max="100"
                      value={formData.notificationSettings.balanceThreshold}
                      onChange={(e) => updateNotificationSetting('balanceThreshold', parseInt(e.target.value) || 20)}
                      style={{
                        width: '150px',
                        padding: '10px',
                        border: '2px solid #e1e5e9',
                        borderRadius: '6px',
                        fontSize: '14px',
                        textAlign: 'center',
                        outline: 'none'



                        
                      }}
                    />
                  </div>
                )}
              </div>

              {/* הסכמות */}
              <div style={{
                backgroundColor: '#fff3e0',
                border: '2px solid #ffcc02',
                borderRadius: '12px',
                padding: '25px',
                marginBottom: '25px'
              }}>
                <h4 style={{ margin: '0 0 20px 0', color: '#ef6c00', fontSize: '18px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <Shield size={20} />
                  הסכמות חובה
                </h4>
                
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="terms"
                      checked={formData.agreements.terms}
                      onChange={(e) => updateAgreement('terms', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px' }}
                    />
                    <label htmlFor="terms" style={{ cursor: 'pointer', fontSize: '15px', lineHeight: '1.4' }}>
                      אני מסכים/ה ל
                      <a href="#" style={{ color: '#1976d2', textDecoration: 'underline', margin: '0 4px' }}>
                        תנאי השימוש
                      </a>
                      של המערכת *
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="privacy"
                      checked={formData.agreements.privacy}
                      onChange={(e) => updateAgreement('privacy', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px' }}
                    />
                    <label htmlFor="privacy" style={{ cursor: 'pointer', fontSize: '15px', lineHeight: '1.4' }}>
                      אני מסכים/ה ל
                      <a href="#" style={{ color: '#1976d2', textDecoration: 'underline', margin: '0 4px' }}>
                        מדיניות הפרטיות
                      </a>
                      ולשימוש בנתונים האישיים *
                    </label>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
                    <input
                      type="checkbox"
                      id="schoolPolicy"
                      checked={formData.agreements.schoolPolicy}
                      onChange={(e) => updateAgreement('schoolPolicy', e.target.checked)}
                      style={{ width: '18px', height: '18px', cursor: 'pointer', marginTop: '2px' }}
                    />
                    <label htmlFor="schoolPolicy" style={{ cursor: 'pointer', fontSize: '15px', lineHeight: '1.4' }}>
                      אני מסכים/ה למדיניות בית הספר בנוגע לארוחות ותשלומים *
                    </label>
                  </div>
                </div>
              </div>

              {/* הערות */}
              <div>
                <label style={{ display: 'block', marginBottom: '10px', fontWeight: '600', color: '#333', fontSize: '16px' }}>
                  הערות נוספות (אופציונלי)
                </label>
                <textarea
                  value={formData.comments}
                  onChange={(e) => setFormData(prev => ({ ...prev, comments: e.target.value }))}
                  style={{
                    width: '100%',
                    minHeight: '100px',
                    padding: '15px',
                    border: '2px solid #e1e5e9',
                    borderRadius: '10px',
                    fontSize: '15px',
                    textAlign: 'right',
                    outline: 'none',
                    resize: 'vertical',
                    fontFamily: 'inherit'
                  }}
                  placeholder="אלרגיות מזון, העדפות תזונתיות, בקשות מיוחדות או כל מידע נוסף שחשוב לבית הספר לדעת..."
                  onFocus={(e) => e.target.style.borderColor = '#2196f3'}
                  onBlur={(e) => e.target.style.borderColor = '#e1e5e9'}
                />
              </div>
            </div>
          )}


      {/* שלב 4: מסך הצלחה */}
      {currentStep === 4 && (
            <div style={{ textAlign: 'center' }}>
              {/* אנימציית הצלחה */}
              <div style={{
                width: '120px',
                height: '120px',
                backgroundColor: '#4caf50',
                borderRadius: '50%',
                margin: '0 auto 30px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                animation: 'successPulse 2s infinite',
                boxShadow: '0 0 30px rgba(76, 175, 80, 0.3)'
              }}>
                <Check size={60} color="white" style={{ fontWeight: 'bold' }} />
              </div>

              <style>
                {`
                  @keyframes successPulse {
                    0% { transform: scale(1); box-shadow: 0 0 30px rgba(76, 175, 80, 0.3); }
                    50% { transform: scale(1.05); box-shadow: 0 0 40px rgba(76, 175, 80, 0.5); }
                    100% { transform: scale(1); box-shadow: 0 0 30px rgba(76, 175, 80, 0.3); }
                  }
                `}
              </style>

              <h2 style={{
                color: '#4caf50',
                fontSize: '32px',
                fontWeight: 'bold',
                margin: '0 0 15px 0'
              }}>
                הרשמה הושלמה בהצלחה!
              </h2>

              <p style={{
                fontSize: '18px',
                color: '#666',
                margin: '0 0 30px 0',
                lineHeight: '1.6'
              }}>
                תודה על ההרשמה למערכת ארוחות בית הספר.<br />
                פרטי החשבון שלכם נשמרו במערכת.
              </p>

              {/* קוד זיהוי משפחה */}
              <div style={{
                backgroundColor: '#e8f5e8',
                border: '2px solid #4caf50',
                borderRadius: '15px',
                padding: '25px',
                margin: '30px 0',
                maxWidth: '500px',
                marginLeft: 'auto',
                marginRight: 'auto'
              }}>
                <h3 style={{
                  color: '#2e7d32',
                  margin: '0 0 15px 0',
                  fontSize: '20px',
                  fontWeight: 'bold'
                }}>
                  קוד זיהוי המשפחה שלכם:
                </h3>
                <div style={{
                  backgroundColor: 'white',
                  padding: '15px 25px',
                  borderRadius: '10px',
                  border: '2px dashed #4caf50',
                  fontSize: '28px',
                  fontWeight: 'bold',
                  color: '#2e7d32',
                  fontFamily: 'monospace',
                  letterSpacing: '2px'
                }}>
                  {`F${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`}
                </div>
                <p style={{
                  margin: '15px 0 0 0',
                  fontSize: '14px',
                  color: '#666',
                  lineHeight: '1.4'
                }}>
                  <strong>חשוב:</strong> שמרו את הקוד הזה! תצטרכו אותו לתשלומים בביט ולפניות לתמיכה.
                </p>
              </div>

              {/* סיכום ההרשמה */}
              <div style={{
                backgroundColor: '#f8f9fa',
                border: '2px solid #e9ecef',
                borderRadius: '15px',
                padding: '25px',
                margin: '30px 0',
                textAlign: 'right'
              }}>
                <h3 style={{
                  color: '#495057',
                  margin: '0 0 20px 0',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  סיכום פרטי ההרשמה
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', fontSize: '15px' }}>
                  <div>
                    <strong>שם משפחה:</strong> {formData.familyName}
                  </div>
                  <div>
                    <strong>טלפון:</strong> {formData.phone}
                  </div>
                  <div>
                    <strong>מייל:</strong> {formData.email}
                  </div>
                  <div>
                    <strong>בית ספר:</strong> {schools.find(s => s.id === formData.schoolId)?.name}
                  </div>
                </div>

                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px solid #dee2e6' }}>
                  <strong>ילדים רשומים:</strong>
                  {formData.children.map((child, index) => (
                    <div key={index} style={{
                      margin: '10px 0',
                      padding: '10px',
                      backgroundColor: 'white',
                      borderRadius: '8px',
                      border: '1px solid #e9ecef'
                    }}>
                      {child.firstName} {child.lastName} - כיתה {child.grade} - {child.phone}
                    </div>
                  ))}
                </div>
              </div>

              {/* הוראות לצעדים הבאים */}
              <div style={{
                backgroundColor: '#fff3cd',
                border: '2px solid #ffc107',
                borderRadius: '15px',
                padding: '25px',
                margin: '30px 0',
                textAlign: 'right'
              }}>
                <h3 style={{
                  color: '#856404',
                  margin: '0 0 20px 0',
                  fontSize: '18px',
                  fontWeight: 'bold',
                  textAlign: 'center'
                }}>
                  מה קורה עכשיו?
                </h3>
                
                <div style={{ fontSize: '15px', lineHeight: '1.6', color: '#856404' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '15px' }}>
                    <div style={{
                      backgroundColor: '#ffc107',
                      color: 'white',
                      width: '25px',
                      height: '25px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      minWidth: '25px'
                    }}>1</div>
                    <div>
                      <strong>SMS עם קוד אימות:</strong> בתוך כמה דקות תקבלו הודעת SMS עם קוד אימות לטלפון {formData.phone}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '15px' }}>
                    <div style={{
                      backgroundColor: '#ffc107',
                      color: 'white',
                      width: '25px',
                      height: '25px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      minWidth: '25px'
                    }}>2</div>
                    <div>
                      <strong>אישור בית הספר:</strong> לאחר האימות, החשבון יעבור לאישור מזכירת בית הספר (עד 24 שעות)
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px', marginBottom: '15px' }}>
                    <div style={{
                      backgroundColor: '#ffc107',
                      color: 'white',
                      width: '25px',
                      height: '25px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      minWidth: '25px'
                    }}>3</div>
                    <div>
                      <strong>כניסה למערכת:</strong> לאחר האישור תוכלו להיכנס למערכת ולהתחיל להשתמש בכל התכונות
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '15px' }}>
                    <div style={{
                      backgroundColor: '#ffc107',
                      color: 'white',
                      width: '25px',
                      height: '25px',
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 'bold',
                      fontSize: '14px',
                      minWidth: '25px'
                    }}>4</div>
                    <div>
                      <strong>כרטיסי QR:</strong> בית הספר ידפיס עבורכם כרטיסי QR לילדים או שתוכלו להדפיס אותם בעצמכם
                    </div>
                  </div>
                </div>
              </div>

              {/* כפתורי פעולה */}
              <div style={{
                display: 'flex',
                justifyContent: 'center',
                gap: '20px',
                margin: '40px 0 20px'
              }}>
                <button
                  onClick={() => window.location.reload()}
                  style={{
                    padding: '15px 30px',
                    backgroundColor: '#2196f3',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#1976d2'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#2196f3'}
                >
                  רישום משפחה נוספת
                </button>

                <button
                  onClick={() => window.location.href = '/login'}
                  style={{
                    padding: '15px 30px',
                    backgroundColor: '#4caf50',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseOver={(e) => e.target.style.backgroundColor = '#45a049'}
                  onMouseOut={(e) => e.target.style.backgroundColor = '#4caf50'}
                >
                  כניסה למערכת
                </button>
              </div>

              {/* פרטי צור קשר */}
              <div style={{
                backgroundColor: '#e3f2fd',
                border: '2px solid #2196f3',
                borderRadius: '10px',
                padding: '20px',
                margin: '30px 0',
                fontSize: '14px',
                color: '#1565c0'
              }}>
                <strong>צריכים עזרה?</strong>
                <div style={{ marginTop: '10px' }}>
                  📧 מייל: <a href="mailto:support@schoollunch.co.il" style={{ color: '#1976d2' }}>support@schoollunch.co.il</a><br />
                  📞 טלפון: 1-800-LUNCH (בשעות העבודה)<br />
                  💬 WhatsApp: <a href="https://wa.me/972501234567" style={{ color: '#1976d2' }}>050-123-4567</a>
                </div>
              </div>
            </div>
          )}
   



          {/* כפתורי ניווט */}
          <div style={{
            marginTop: '40px',
            display: 'flex',
            justifyContent: 'space-between',
            gap: '15px'
          }}>
            {currentStep > 1 && (
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                style={{
                  padding: '12px 30px',
                  backgroundColor: '#f5f5f5',
                  color: '#666',
                  border: '2px solid #e0e0e0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease'
                }}
                onMouseOver={(e) => {
                  e.target.style.backgroundColor = '#e0e0e0';
                  e.target.style.borderColor = '#bdbdbd';
                }}
                onMouseOut={(e) => {
                  e.target.style.backgroundColor = '#f5f5f5';
                  e.target.style.borderColor = '#e0e0e0';
                }}
              >
                חזור לשלב הקודם
              </button>
            )}
            
            <button
              onClick={currentStep === 3 ? handleSubmit : handleNext}
              
              disabled={currentStep === 2 ? !isStep2Valid() : currentStep === 3 ? !isStep3Valid() : false}



              style={{
                padding: '12px 30px',
                backgroundColor: (currentStep === 2 ? isStep2Valid() : currentStep === 3 ? isStep3Valid() : true) ? '#2196f3' : '#ccc',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '600',
                cursor: (currentStep === 2 ? isStep2Valid() : currentStep === 3 ? isStep3Valid() : true) ? 'pointer' : 'not-allowed',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginLeft: 'auto',
                transition: 'all 0.3s ease'
              }}
              onMouseOver={(e) => {
                if ((currentStep === 2 ? isStep2Valid() : currentStep === 3 ? isStep3Valid() : true)) {
                  e.target.style.backgroundColor = '#1976d2';
                }
              }}
              onMouseOut={(e) => {
                if ((currentStep === 2 ? isStep2Valid() : currentStep === 3 ? isStep3Valid() : true)) {
                  e.target.style.backgroundColor = '#2196f3';
                }
              }}
            >
              <span>{currentStep === 3 ? 'שלח הרשמה' : 'המשך לשלב הבא'}</span>
              <ArrowRight size={20} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ParentRegistrationForm;