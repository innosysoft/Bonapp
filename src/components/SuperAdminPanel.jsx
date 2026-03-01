import React, { useState, useEffect } from 'react';
import { School, Plus, Users, TrendingUp, Settings, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const SuperAdminPanel = () => {
  const navigate = useNavigate();
  const [schools, setSchools] = useState([]);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
const [editingSchool, setEditingSchool] = useState(null);
const [currentUser, setCurrentUser] = useState(null);
const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [newSchool, setNewSchool] = useState({
    name: '',
    address: '',
    contact_person: '',
    contact_phone: '',
    contact_email: ''
  });

  const [selectedSchool, setSelectedSchool] = useState(null);
const [schoolUsers, setSchoolUsers] = useState([]);
const [showCreateUserForm, setShowCreateUserForm] = useState(false);
const [showEditUserForm, setShowEditUserForm] = useState(false);
const [editingUser, setEditingUser] = useState(null);
const [newUser, setNewUser] = useState({
  email: '',
  password: '',
  confirmPassword: '',
  firstName: '',
  lastName: '',
  role: 'secretary',
  phone: ''
  
});



  // טען רשימת בתי ספר
useEffect(() => {
  const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
  
  // בדיקה: חייב להיות משתמש מחובר
  if (!user || !user.id) {
    alert('נדרשת התחברות');
    navigate('/login');
    return;
  }
  
  // בדיקה: חייב להיות admin או super_admin
  if (user.type !== 'admin' && user.type !== 'super_admin') {
    alert('אין הרשאות גישה');
    navigate('/login');
    return;
  }
  
  setCurrentUser(user);
  const isSuper = user.type === 'super_admin' || !user.school_id;
  setIsSuperAdmin(isSuper);
  fetchSchools(user);
}, [navigate]);


  const fetchSchools = async (user) => {
  try {
    // אם Super Admin - טען את כל בתי הספר
    if (!user || !user.school_id) {
      const response = await fetch('https://api.bonapp.dev/api/admin/schools');
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setSchools(data);
      } else if (data.schools && Array.isArray(data.schools)) {
        setSchools(data.schools);
      } else {
        setSchools([]);
      }
    } 
    // אם מנהל בית ספר - טען רק את בית הספר שלו
    else {
      const response = await fetch(`https://api.bonapp.dev/api/schools/${user.school_id}`);
      const result = await response.json();
      
      if (result.success) {
        setSchools([result.school]); // מערך עם בית ספר אחד
      } else {
        setSchools([]);
      }
    }
  } catch (error) {
    console.error('Error fetching schools:', error);
    setSchools([]);
  }
};


  const createSchool = async () => {
  try {
    const response = await fetch('https://api.bonapp.dev/api/admin/schools', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newSchool)
    });
    
    const result = await response.json();
    if (result.success) {
      alert('בית ספר נוצר בהצלחה!');
      fetchSchools();
      setShowCreateForm(false);
      setNewSchool({ name: '', address: '', contact_person: '', contact_phone: '', contact_email: '' });
    }
  } catch (error) {
    alert('שגיאה ביצירת בית הספר');
  }
}; // סגור את createSchool כאן!
      
const fetchSchoolUsers = async (schoolId) => {
    try {
      const response = await fetch(`https://api.bonapp.dev/api/schools/${schoolId}/users`);
      const data = await response.json();
      if (data.success) {
        setSchoolUsers(data.users);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };


  
  const createUser = async () => {
  // בדיקות תקינות
  if (!newUser.email || !newUser.password || !newUser.firstName || !newUser.lastName) {
    alert('נא למלא את כל השדות החובה');
    return;
  }

  // בדיקת התאמת סיסמאות
  if (newUser.password !== newUser.confirmPassword) {
    alert('הסיסמאות אינן תואמות');
    return;
  }

  // בדיקת אורך סיסמה
  if (newUser.password.length < 6) {
    alert('הסיסמה חייבת להכיל לפחות 6 תווים');
    return;
  }

  try {
    const response = await fetch(`https://api.bonapp.dev/api/schools/${selectedSchool.id}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newUser)
    });
    
    const result = await response.json();
    if (result.success) {
      // שלח אימייל למשתמש החדש
      try {
        await fetch('https://api.bonapp.dev/api/send-user-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userEmail: newUser.email,
            userName: `${newUser.firstName} ${newUser.lastName}`,
            password: newUser.password,
            role: newUser.role,
            schoolName: selectedSchool.name
          })
        });
      } catch (emailError) {
        console.log('שגיאה בשליחת אימייל:', emailError);
      }

      alert('משתמש נוצר בהצלחה! אימייל נשלח למשתמש עם פרטי הגישה.');
      fetchSchoolUsers(selectedSchool.id);
      setShowCreateUserForm(false);
      setNewUser({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', role: 'secretary', phone: '' });
    } else {
      alert(result.message || 'שגיאה ביצירת משתמש');
    }
  } catch (error) {
    alert('שגיאה ביצירת משתמש');
  }
};


const updateUser = async () => {
  // בדיקה עם השדות הנכונים
  if (!editingUser.first_name || !editingUser.last_name) {
    alert('נא למלא שם פרטי ושם משפחה');
    return;
  }

  // אם יש סיסמה חדשה - בדוק שהיא תקינה
  if (editingUser.newPassword) {
    if (editingUser.newPassword !== editingUser.confirmPassword) {
      alert('הסיסמאות אינן תואמות');
      return;
    }
    if (editingUser.newPassword.length < 6) {
      alert('הסיסמה חייבת להכיל לפחות 6 תווים');
      return;
    }
  }

  try {
    const response = await fetch(`https://api.bonapp.dev/api/users/${editingUser.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        firstName: editingUser.first_name,
        lastName: editingUser.last_name,
        email: editingUser.email,
        phone: editingUser.phone,
        role: editingUser.role,
        password: editingUser.newPassword || undefined
      })
    });
    
    const result = await response.json();
    if (result.success) {
      alert('המשתמש עודכן בהצלחה!');
      fetchSchoolUsers(selectedSchool.id);
      setShowEditUserForm(false);
      setEditingUser(null);
    } else {
      alert(result.message || 'שגיאה בעדכון משתמש');
    }
  } catch (error) {
    console.error('Update error:', error);
    alert('שגיאה בעדכון משתמש');
  }
};

  const deleteUser = async (userId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק משתמש זה?')) return;

    try {
      const response = await fetch(`https://api.bonapp.dev/api/users/${userId}`, {
        method: 'DELETE'
      });
      
      const result = await response.json();
      if (result.success) {
        alert('משתמש נמחק בהצלחה');
        fetchSchoolUsers(selectedSchool.id);
      }
    } catch (error) {
      alert('שגיאה במחיקת משתמש');
    }
  };

const saveSchoolSettings = async () => {
  try {
    const response = await fetch(`https://api.bonapp.dev/api/schools/${editingSchool.id}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editingSchool.name,
        address: editingSchool.address,
        contact_person: editingSchool.contact_person,
        contact_phone: editingSchool.contact_phone,
        contact_email: editingSchool.contact_email,
        school_phone: editingSchool.school_phone,
        email_user: editingSchool.email_user,
        email_pass: editingSchool.email_pass,
        menu_type: editingSchool.menu_type,
        allow_negative_balance: editingSchool.allow_negative_balance,
        max_negative_balance: editingSchool.max_negative_balance,
        kitchen_open_time: editingSchool.kitchen_open_time,
        kitchen_close_time: editingSchool.kitchen_close_time,
        // הגדרות תשלום - הוסף כאן:
  paybox_merchant_id: editingSchool.paybox_merchant_id,
  paybox_secret_key: editingSchool.paybox_secret_key,
  bit_payment_link: editingSchool.bit_payment_link,
  cardcom_terminal: editingSchool.cardcom_terminal,
  cardcom_username: editingSchool.cardcom_username,
  enable_paybox: editingSchool.enable_paybox,
  enable_bit: editingSchool.enable_bit,
  enable_cardcom: editingSchool.enable_cardcom,
  enable_cash: editingSchool.enable_cash
      })
    });

    const result = await response.json();
    
    if (result.success) {
      alert('ההגדרות נשמרו בהצלחה!');
      setShowSettingsModal(false);
      fetchSchools(currentUser);
    } else {
      alert('שגיאה בשמירת הגדרות');
    }
  } catch (error) {
    console.error('Save settings error:', error);
    alert('שגיאה בשמירת הגדרות');
  }
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
        padding: '2rem',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div style={{
              width: '60px', height: '60px',
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              borderRadius: '15px', display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <School size={32} color="white" />
            </div>
            <div>
              <h1 style={{ fontSize: '2rem', fontWeight: 'bold', color: '#333', margin: 0 }}>
  {isSuperAdmin ? 'Super Admin Panel' : 'ניהול בית הספר'}
</h1>
<p style={{ color: '#666', margin: 0 }}>
  {isSuperAdmin ? 'ניהול מערכת ארוחות בתי הספר' : `ניהול ${schools[0]?.name || ''}`}
</p>

            </div>
          </div>
          
          <button style={{
  padding: '1rem 2rem', 
  background: '#f44336', 
  color: 'white', 
  border: 'none',
  borderRadius: '12px', 
  cursor: 'pointer', 
  display: 'flex', 
  alignItems: 'center', 
  gap: '0.5rem'
}}
onClick={() => {
  localStorage.clear();
  navigate('/login');
}}
>
  <LogOut size={20} />
  יציאה
</button>
        </div>
      </div>

      {/* תוכן ראשי */}
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '2rem' }}>
        
        {/* סטטיסטיקות */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem', marginBottom: '3rem'
        }}>
          <div style={{
            background: 'white', padding: '2rem', borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center'
          }}>
            <School size={40} color="#667eea" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '2rem', margin: 0, color: '#333' }}>{schools.length}</h3>
            <p style={{ color: '#666', margin: 0 }}>בתי ספר במערכת</p>
          </div>
          
          <div style={{
            background: 'white', padding: '2rem', borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center'
          }}>
            <Users size={40} color="#4CAF50" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '2rem', margin: 0, color: '#333' }}>0</h3>
            <p style={{ color: '#666', margin: 0 }}>סך תלמידים</p>
          </div>
          
          <div style={{
            background: 'white', padding: '2rem', borderRadius: '16px',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)', textAlign: 'center'
          }}>
            <TrendingUp size={40} color="#FF9800" style={{ marginBottom: '1rem' }} />
            <h3 style={{ fontSize: '2rem', margin: 0, color: '#333' }}>₪0</h3>
            <p style={{ color: '#666', margin: 0 }}>מחזור חודשי</p>
          </div>
        </div>

        {/* כותרת בתי ספר */}
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          marginBottom: '2rem'
        }}>
          <h2 style={{ fontSize: '1.5rem', color: 'white', margin: 0 }}>
            בתי הספר במערכת
          </h2>
          {isSuperAdmin && (
  <button style={{
    padding: '1rem 2rem', background: '#4CAF50', color: 'white',
    border: 'none', borderRadius: '12px', cursor: 'pointer',
    display: 'flex', alignItems: 'center', gap: '0.5rem'
  }}
  onClick={() => setShowCreateForm(true)}>
    <Plus size={20} />
    הוסף בית ספר חדש
  </button>
)}
        </div>

        {/* רשימת בתי ספר */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          {schools.map(school => (
            <div key={school.id} style={{
              background: 'white', padding: '2rem', borderRadius: '16px',
              boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
            }}>
              <h3 style={{ fontSize: '1.2rem', margin: '0 0 1rem 0', color: '#333' }}>
                {school.name}
              </h3>
              <p style={{ color: '#666', margin: '0.5rem 0' }}>📍 {school.address}</p>
              <p style={{ color: '#666', margin: '0.5rem 0' }}>👨‍💼 {school.contact_person}</p>
              <p style={{ color: '#666', margin: '0.5rem 0' }}>📞 {school.contact_phone}</p>
              <p style={{ color: '#666', margin: '0.5rem 0' }}>✉️ {school.contact_email}</p>
              
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #eee' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button style={{
                    padding: '0.5rem 1rem', background: '#667eea', color: 'white',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', flex: 1
                  }}
                  onClick={() => {
                    setSelectedSchool(school);
                    fetchSchoolUsers(school.id);
                  }}>
                    👥 משתמשים
                  </button>
                  
                  <button style={{
                    padding: '0.5rem 1rem', background: '#5cb85c', color: 'white',
                    border: 'none', borderRadius: '8px', cursor: 'pointer', flex: 1
                  }}
                  onClick={async () => {
  try {
    // טען את כל פרטי בית הספר
    const response = await fetch(`https://api.bonapp.dev/api/schools/${school.id}`);
    const result = await response.json();
    
    if (result.success) {
      setEditingSchool(result.school);
      setShowSettingsModal(true);
    } else {
      alert('שגיאה בטעינת נתונים');
    }
  } catch (error) {
    alert('שגיאה בטעינת נתונים');
  }
}}>
  ⚙️ הגדרות
</button>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>



      {/* מודל יצירת בית ספר */}
      {showCreateForm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '2rem',
            maxWidth: '500px', width: '90%'
          }}>
            <h3 style={{ textAlign: 'center', marginBottom: '2rem' }}>צור בית ספר חדש</h3>
            
            <div style={{ marginBottom: '1rem' }}>
              <label>שם בית הספר *</label>
              <input type="text" value={newSchool.name}
                onChange={(e) => setNewSchool({...newSchool, name: e.target.value})}
                style={{
                  width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                  borderRadius: '8px', marginTop: '0.5rem', boxSizing: 'border-box',
                  textAlign: 'right'
                }} />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label>כתובת</label>
              <input type="text" value={newSchool.address}
                onChange={(e) => setNewSchool({...newSchool, address: e.target.value})}
                style={{
                  width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                  borderRadius: '8px', marginTop: '0.5rem', boxSizing: 'border-box',
                  textAlign: 'right'
                }} />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label>איש קשר</label>
              <input type="text" value={newSchool.contact_person}
                onChange={(e) => setNewSchool({...newSchool, contact_person: e.target.value})}
                style={{
                  width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                  borderRadius: '8px', marginTop: '0.5rem', boxSizing: 'border-box',
                  textAlign: 'right'
                }} />
            </div>
            
            <div style={{ marginBottom: '1rem' }}>
              <label>טלפון</label>
              <input type="tel" value={newSchool.contact_phone}
                onChange={(e) => setNewSchool({...newSchool, contact_phone: e.target.value})}
                style={{
                  width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                  borderRadius: '8px', marginTop: '0.5rem', boxSizing: 'border-box',
                  textAlign: 'right'
                }} />
            </div>
            
            <div style={{ marginBottom: '2rem' }}>
              <label>מייל</label>
              <input type="email" value={newSchool.contact_email}
                onChange={(e) => setNewSchool({...newSchool, contact_email: e.target.value})}
                style={{
                  width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                  borderRadius: '8px', marginTop: '0.5rem', boxSizing: 'border-box',
                  textAlign: 'left'
                }} />
            </div>
            
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              <button onClick={() => setShowCreateForm(false)}
                style={{
                  padding: '0.75rem 2rem', background: '#f5f5f5', color: '#666',
                  border: 'none', borderRadius: '8px', cursor: 'pointer'
                }}>
                ביטול
              </button>
              <button onClick={createSchool}
                style={{
                  padding: '0.75rem 2rem', background: '#4CAF50', color: 'white',
                  border: 'none', borderRadius: '8px', cursor: 'pointer'
                }}>
                צור בית ספר
              </button>
            </div>
          </div>
        </div>
      )}

      
    {/* מודל ניהול משתמשי בית ספר */}
      {selectedSchool && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          overflowY: 'auto'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '2rem',
            maxWidth: '900px', width: '90%', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
              <h3>ניהול משתמשים - {selectedSchool.name}</h3>
              <button onClick={() => setSelectedSchool(null)}
                style={{
                  background: '#f5f5f5', border: 'none', padding: '0.5rem 1rem',
                  borderRadius: '8px', cursor: 'pointer'
                }}>
                סגור
              </button>
            </div>

            {/* כפתור הוספת משתמש */}
            <button onClick={() => setShowCreateUserForm(true)}
              style={{
                padding: '0.75rem 1.5rem', background: '#4CAF50', color: 'white',
                border: 'none', borderRadius: '8px', cursor: 'pointer', marginBottom: '1.5rem'
              }}>
              + הוסף משתמש חדש
            </button>

            {/* רשימת משתמשים */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {schoolUsers.length === 0 ? (
                <p style={{ textAlign: 'center', color: '#666' }}>אין עדיין משתמשים לבית ספר זה</p>
              ) : (
                schoolUsers.map(user => (
                  <div key={user.id} style={{
                    padding: '1rem', background: '#f8f9fa', borderRadius: '8px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 0.5rem 0' }}>
                        {user.first_name} {user.last_name}
                      </h4>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                        📧 {user.email}
                      </p>
                      <p style={{ margin: '0.25rem 0', fontSize: '0.9rem', color: '#666' }}>
                        📞 {user.phone}
                      </p>
                      <span style={{
                        display: 'inline-block', padding: '0.25rem 0.75rem',
                        background: '#667eea', color: 'white', borderRadius: '12px',
                        fontSize: '0.8rem', marginTop: '0.5rem'
                      }}>
                        {user.role === 'secretary' ? 'מזכירות' : 
                         user.role === 'kitchen' ? 'מטבח' : 
                         user.role === 'admin' ? 'מנהל' : user.role}
                      </span>
                    </div>
                    
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button onClick={() => {
                        setEditingUser({
                          ...user,
                          newPassword: '',
                          confirmPassword: ''
                        });
                        setShowEditUserForm(true);
                      }}
                        style={{
                          padding: '0.5rem 1rem', background: '#5b9bd5', color: 'white',
                          border: 'none', borderRadius: '8px', cursor: 'pointer'
                        }}>
                        ✏️ ערוך
                      </button>

                      <button onClick={() => deleteUser(user.id)}
                        style={{
                          padding: '0.5rem 1rem', background: '#f44336', color: 'white',
                          border: 'none', borderRadius: '8px', cursor: 'pointer'
                        }}>
                        מחק
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* טופס יצירת משתמש */}
            {showCreateUserForm && (
              <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                background: 'white', borderRadius: '16px', padding: '2rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 1100,
                width: '90%', maxWidth: '500px'
              }}>
                <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>הוסף משתמש חדש</h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>שם פרטי *</label>
                  <input type="text" value={newUser.firstName}
                    onChange={(e) => setNewUser({...newUser, firstName: e.target.value})}
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                      borderRadius: '8px', boxSizing: 'border-box', textAlign: 'right'
                    }} />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>שם משפחה *</label>
                  <input type="text" value={newUser.lastName}
                    onChange={(e) => setNewUser({...newUser, lastName: e.target.value})}
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                      borderRadius: '8px', boxSizing: 'border-box', textAlign: 'right'
                    }} />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>אימייל *</label>
                  <input type="email" value={newUser.email}
  autoComplete="off"
  
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                      borderRadius: '8px', boxSizing: 'border-box', textAlign: 'left'
                    }} />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>סיסמה *</label>
                  <input type="password" value={newUser.password}
  autoComplete="new-password"

                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                      borderRadius: '8px', boxSizing: 'border-box', textAlign: 'left'
                    }} />
                </div>
                
<div style={{ marginBottom: '1rem' }}>
  <label style={{ display: 'block', marginBottom: '0.5rem' }}>אישור סיסמה *</label>
  <input type="password" value={newUser.confirmPassword}
    onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
    style={{
      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
      borderRadius: '8px', boxSizing: 'border-box', textAlign: 'left'
    }} />
</div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>טלפון</label>
                  <input type="tel" value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                      borderRadius: '8px', boxSizing: 'border-box', textAlign: 'right'
                    }} />
                </div>
                
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>תפקיד *</label>
                  <select value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                      borderRadius: '8px', boxSizing: 'border-box'
                    }}>
                    <option value="secretary">מזכירות</option>
                    <option value="kitchen">מטבח</option>
                    <option value="admin">מנהל</option>
                  </select>
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                    
                  <button onClick={() => {
  setShowCreateUserForm(false);
  setNewUser({ email: '', password: '', confirmPassword: '', firstName: '', lastName: '', role: 'secretary', phone: '' });
}}

                    style={{
                      padding: '0.75rem 2rem', background: '#f5f5f5', color: '#666',
                      border: 'none', borderRadius: '8px', cursor: 'pointer'
                    }}>
                    ביטול
                  </button>
                  <button onClick={createUser}
                    style={{
                      padding: '0.75rem 2rem', background: '#4CAF50', color: 'white',
                      border: 'none', borderRadius: '8px', cursor: 'pointer'
                    }}>
                    צור משתמש
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      )}

      {/* טופס עריכת משתמש */}
            {showEditUserForm && editingUser && (
              <div style={{
                position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                background: 'white', borderRadius: '16px', padding: '2rem',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)', zIndex: 1100,
                width: '90%', maxWidth: '500px'
              }}>
                <h3 style={{ marginBottom: '1.5rem', textAlign: 'center' }}>ערוך משתמש</h3>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>שם פרטי *</label>
                  <input type="text" value={editingUser.first_name || ''}
                    onChange={(e) => setEditingUser({...editingUser, first_name: e.target.value, firstName: e.target.value})}
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                      borderRadius: '8px', boxSizing: 'border-box', textAlign: 'right'
                    }} />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>שם משפחה *</label>
                  <input type="text" value={editingUser.last_name || ''}
                    onChange={(e) => setEditingUser({...editingUser, last_name: e.target.value, lastName: e.target.value})}
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                      borderRadius: '8px', boxSizing: 'border-box', textAlign: 'right'
                    }} />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>אימייל *</label>
                  <input type="email" value={editingUser.email || ''}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                      borderRadius: '8px', boxSizing: 'border-box', textAlign: 'left'
                    }} />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>טלפון</label>
                  <input type="tel" value={editingUser.phone || ''}
                    onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                      borderRadius: '8px', boxSizing: 'border-box', textAlign: 'right'
                    }} />
                </div>
                
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>תפקיד *</label>
                  <select value={editingUser.role || 'secretary'}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                      borderRadius: '8px', boxSizing: 'border-box'
                    }}>
                    <option value="secretary">מזכירות</option>
                    <option value="kitchen">מטבח</option>
                    <option value="admin">מנהל</option>
                  </select>
                </div>

                <hr style={{ margin: '1.5rem 0', border: 'none', borderTop: '2px solid #f0f0f0' }} />
                
                <p style={{ fontSize: '0.9rem', color: '#666', marginBottom: '1rem' }}>
                  💡 השאר ריק אם אינך רוצה לשנות את הסיסמה
                </p>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>סיסמה חדשה (אופציונלי)</label>
                  <input type="password" value={editingUser.newPassword || ''}
                    autoComplete="new-password"
                    onChange={(e) => setEditingUser({...editingUser, newPassword: e.target.value})}
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                      borderRadius: '8px', boxSizing: 'border-box', textAlign: 'left'
                    }} />
                </div>
                
                <div style={{ marginBottom: '2rem' }}>
                  <label style={{ display: 'block', marginBottom: '0.5rem' }}>אישור סיסמה</label>
                  <input type="password" value={editingUser.confirmPassword || ''}
                    onChange={(e) => setEditingUser({...editingUser, confirmPassword: e.target.value})}
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                      borderRadius: '8px', boxSizing: 'border-box', textAlign: 'left'
                    }} />
                </div>
                
                <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                  <button onClick={() => {
                    setShowEditUserForm(false);
                    setEditingUser(null);
                  }}
                    style={{
                      padding: '0.75rem 2rem', background: '#f5f5f5', color: '#666',
                      border: 'none', borderRadius: '8px', cursor: 'pointer'
                    }}>
                    ביטול
                  </button>
                  <button onClick={updateUser}
                    style={{
                      padding: '0.75rem 2rem', background: '#5b9bd5', color: 'white',
                      border: 'none', borderRadius: '8px', cursor: 'pointer'
                    }}>
                    💾 עדכן משתמש
                  </button>
                </div>
              </div>
            )}

      {/* מודל הגדרות בית ספר */}
      {showSettingsModal && editingSchool && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)', display: 'flex',
          alignItems: 'center', justifyContent: 'center', zIndex: 1000,
          overflowY: 'auto', padding: '2rem'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '2.5rem',
            maxWidth: '900px', width: '100%', maxHeight: '90vh', overflowY: 'auto'
          }}>
            {/* כותרת */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              marginBottom: '2rem', paddingBottom: '1rem', borderBottom: '2px solid #f0f0f0'
            }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#333', margin: 0 }}>
                ⚙️ הגדרות - {editingSchool.name}
              </h2>
              <button onClick={() => setShowSettingsModal(false)}
                style={{
                  background: '#f5f5f5', border: 'none', borderRadius: '50%',
                  width: '40px', height: '40px', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center'
                }}>
                ✖️
              </button>
            </div>

            {/* פרטי בית הספר */}
            <div style={{
              background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem'
            }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', color: '#333' }}>
                📋 פרטי בית הספר
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#555' }}>
                    שם בית הספר *
                  </label>
                  <input type="text" value={editingSchool.name || ''}
                    onChange={(e) => setEditingSchool({...editingSchool, name: e.target.value})}
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                      borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box'
                    }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#555' }}>
                    טלפון בית ספר
                  </label>
                  <input type="tel" value={editingSchool.school_phone || ''}
                    onChange={(e) => setEditingSchool({...editingSchool, school_phone: e.target.value})}
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                      borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box'
                    }} />
                </div>
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#555' }}>
                  כתובת
                </label>
                <input type="text" value={editingSchool.address || ''}
                  onChange={(e) => setEditingSchool({...editingSchool, address: e.target.value})}
                  style={{
                    width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                    borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box'
                  }} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#555' }}>
                    איש קשר
                  </label>
                  <input type="text" value={editingSchool.contact_person || ''}
                    onChange={(e) => setEditingSchool({...editingSchool, contact_person: e.target.value})}
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                      borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box'
                    }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#555' }}>
                    טלפון איש קשר
                  </label>
                  <input type="tel" value={editingSchool.contact_phone || ''}
                    onChange={(e) => setEditingSchool({...editingSchool, contact_phone: e.target.value})}
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                      borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box'
                    }} />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#555' }}>
                    מייל איש קשר
                  </label>
                  <input type="email" value={editingSchool.contact_email || ''}
                    onChange={(e) => setEditingSchool({...editingSchool, contact_email: e.target.value})}
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                      borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box', textAlign: 'left'
                    }} />
                </div>
              </div>
            </div>

            {/* הגדרות מערכת */}
            <div style={{
              background: '#f8f9fa', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem'
            }}>
              <h3 style={{ margin: '0 0 1.5rem 0', fontSize: '1.2rem', color: '#333' }}>
                ⚙️ הגדרות מערכת
              </h3>

              {/* סוג תפריט */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: '#555' }}>
                  סוג תפריט
                </label>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button
                    onClick={() => setEditingSchool({...editingSchool, menu_type: 'items'})}
                    style={{
                      flex: 1, padding: '1rem', borderRadius: '8px',
                      border: '2px solid',
                      borderColor: editingSchool.menu_type === 'items' ? '#5b9bd5' : '#e0e0e0',
                      background: editingSchool.menu_type === 'items' ? '#5b9bd5' : 'white',
                      color: editingSchool.menu_type === 'items' ? 'white' : '#666',
                      cursor: 'pointer', fontWeight: '600'
                    }}
                  >
                    📋 פריטים בודדים
                  </button>
                  <button
                    onClick={() => setEditingSchool({...editingSchool, menu_type: 'daily'})}
                    style={{
                      flex: 1, padding: '1rem', borderRadius: '8px',
                      border: '2px solid',
                      borderColor: editingSchool.menu_type === 'daily' ? '#5b9bd5' : '#e0e0e0',
                      background: editingSchool.menu_type === 'daily' ? '#5b9bd5' : 'white',
                      color: editingSchool.menu_type === 'daily' ? 'white' : '#666',
                      cursor: 'pointer', fontWeight: '600'
                    }}
                  >
                    📅 תפריט יומי
                  </button>
                </div>
              </div>

              {/* יתרה שלילית */}
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  cursor: 'pointer', marginBottom: '1rem'
                }}>
                  <input type="checkbox"
                    checked={editingSchool.allow_negative_balance || false}
                    onChange={(e) => setEditingSchool({
                      ...editingSchool,
                      allow_negative_balance: e.target.checked
                    })}
                    style={{ width: '20px', height: '20px', cursor: 'pointer' }}
                  />
                  <span style={{ fontWeight: '600', fontSize: '1rem' }}>
                    אפשר יתרה שלילית (מינוס)
                  </span>
                </label>

                {editingSchool.allow_negative_balance && (
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#555' }}>
                      מינוס מקסימלי מותר (₪)
                    </label>
                    <input type="number" step="0.5"
                      value={Math.abs(editingSchool.max_negative_balance || 50)}
                      onChange={(e) => setEditingSchool({
                        ...editingSchool,
                        max_negative_balance: -Math.abs(parseFloat(e.target.value) || 0)
                      })}
                      style={{
                        width: '200px', padding: '0.75rem', border: '2px solid #e0e0e0',
                        borderRadius: '8px', fontSize: '1rem'
                      }}
                    />
                  </div>
                )}
              </div>

              {/* שעות מטבח */}
              <div>
                <label style={{ display: 'block', marginBottom: '0.75rem', fontWeight: '600', color: '#555' }}>
                  ⏰ שעות פעילות המטבח
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                      שעת פתיחה
                    </label>
                    <input type="time"
                      value={editingSchool.kitchen_open_time || '08:00'}
                      onChange={(e) => setEditingSchool({
                        ...editingSchool,
                        kitchen_open_time: e.target.value
                      })}
                      style={{
                        width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                        borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem', color: '#666' }}>
                      שעת סגירה
                    </label>
                    <input type="time"
                      value={editingSchool.kitchen_close_time || '16:00'}
                      onChange={(e) => setEditingSchool({
                        ...editingSchool,
                        kitchen_close_time: e.target.value
                      })}
                      style={{
                        width: '100%', padding: '0.75rem', border: '2px solid #e0e0e0',
                        borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* הגדרות מייל */}
            <div style={{
              background: '#fff3cd', padding: '1.5rem', borderRadius: '12px', marginBottom: '2rem',
              border: '2px solid #ffc107'
            }}>
              <h3 style={{ margin: '0 0 1rem 0', fontSize: '1.2rem', color: '#856404' }}>
                📧 הגדרות מייל (לשליחת QR Code)
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#856404', marginBottom: '1rem' }}>
                ⚠️ השדות הללו מוצפנים. יש להזין Gmail App Password (לא הסיסמה הרגילה!)
              </p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#856404' }}>
                    כתובת Gmail
                  </label>
                  <input type="email"
                    value={editingSchool.email_user || ''}
                    onChange={(e) => setEditingSchool({...editingSchool, email_user: e.target.value})}
                    placeholder="example@gmail.com"
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #ffc107',
                      borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box', textAlign: 'left'
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '600', color: '#856404' }}>
                    Gmail App Password
                  </label>
                  <input type="password"
                    value={editingSchool.email_pass || ''}
                    onChange={(e) => setEditingSchool({...editingSchool, email_pass: e.target.value})}
                    placeholder="xxxx xxxx xxxx xxxx"
                    style={{
                      width: '100%', padding: '0.75rem', border: '2px solid #ffc107',
                      borderRadius: '8px', fontSize: '1rem', boxSizing: 'border-box', textAlign: 'left'
                    }}
                  />
                </div>
              </div>
            </div>

{/* Payment Settings */}
<div style={{
  background: '#f8f9fa',
  padding: '1.5rem',
  borderRadius: '12px',
  marginBottom: '1.5rem'
}}>
  <h3 style={{ marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
    💳 הגדרות תשלום
  </h3>

  {/* Paybox */}
  <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e0e0e0' }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
      <input
        type="checkbox"
        checked={editingSchool.enable_paybox || false}
        onChange={(e) => setEditingSchool({...editingSchool, enable_paybox: e.target.checked})}
      />
      <strong>🟢 Paybox (מומלץ)</strong>
    </label>
    
    {editingSchool.enable_paybox && (
      <>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Merchant ID
          </label>
          <input
            type="text"
            value={editingSchool.paybox_merchant_id || ''}
            onChange={(e) => setEditingSchool({...editingSchool, paybox_merchant_id: e.target.value})}
            placeholder="1234567"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Secret Key
          </label>
          <input
            type="password"
            value={editingSchool.paybox_secret_key || ''}
            onChange={(e) => setEditingSchool({...editingSchool, paybox_secret_key: e.target.value})}
            placeholder="••••••••"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </>
    )}
  </div>

  {/* Bit Link */}
  <div style={{ marginBottom: '1.5rem', paddingBottom: '1.5rem', borderBottom: '1px solid #e0e0e0' }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
      <input
        type="checkbox"
        checked={editingSchool.enable_bit || false}
        onChange={(e) => setEditingSchool({...editingSchool, enable_bit: e.target.checked})}
      />
      <strong>🔵 Bit (קישור תשלום)</strong>
    </label>
    
    {editingSchool.enable_bit && (
      <div style={{ marginBottom: '1rem' }}>
        <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
          קישור Bit
        </label>
        <input
          type="text"
          value={editingSchool.bit_payment_link || ''}
          onChange={(e) => setEditingSchool({...editingSchool, bit_payment_link: e.target.value})}
          placeholder="https://payboxapp.page/..."
          style={{
            width: '100%',
            padding: '0.75rem',
            border: '2px solid #e0e0e0',
            borderRadius: '8px',
            boxSizing: 'border-box',
            textAlign: 'left',
            direction: 'ltr'
          }}
        />
      </div>
    )}
  </div>

  {/* Cardcom */}
  <div style={{ marginBottom: '1rem' }}>
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
      <input
        type="checkbox"
        checked={editingSchool.enable_cardcom || false}
        onChange={(e) => setEditingSchool({...editingSchool, enable_cardcom: e.target.checked})}
      />
      <strong>🟡 Cardcom (בקרוב)</strong>
    </label>
    
    {editingSchool.enable_cardcom && (
      <>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Terminal Number
          </label>
          <input
            type="text"
            value={editingSchool.cardcom_terminal || ''}
            onChange={(e) => setEditingSchool({...editingSchool, cardcom_terminal: e.target.value})}
            placeholder="1000"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              boxSizing: 'border-box'
            }}
          />
        </div>
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
            Username
          </label>
          <input
            type="text"
            value={editingSchool.cardcom_username || ''}
            onChange={(e) => setEditingSchool({...editingSchool, cardcom_username: e.target.value})}
            placeholder="username"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '2px solid #e0e0e0',
              borderRadius: '8px',
              boxSizing: 'border-box'
            }}
          />
        </div>
      </>
    )}
  </div>

  {/* Cash */}
  <div>
    <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
      <input
        type="checkbox"
        checked={editingSchool.enable_cash !== false}
        onChange={(e) => setEditingSchool({...editingSchool, enable_cash: e.target.checked})}
      />
      <strong>💵 מזומן (דרך מזכירה)</strong>
    </label>
  </div>
</div>

            {/* כפתור שמירה */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button onClick={() => setShowSettingsModal(false)}
                style={{
                  flex: 1, padding: '1rem', borderRadius: '12px',
                  border: '2px solid #e0e0e0', background: 'white', color: '#666',
                  fontSize: '1rem', fontWeight: '600', cursor: 'pointer'
                }}>
                ביטול
              </button>

              <button onClick={saveSchoolSettings}
                style={{
                  flex: 2, padding: '1rem', borderRadius: '12px',
                  border: 'none', background: '#5cb85c', color: 'white',
                  fontSize: '1rem', fontWeight: '600', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}>
                💾 שמור הגדרות
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};


export default SuperAdminPanel;