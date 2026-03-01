import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMenuItems, addMenuItem, updateMenuItem, deleteMenuItem, getSchools } from '../api';
import { Plus, Edit2, Trash2, Check, X, ChefHat, ArrowRight, LogOut, QrCode } from 'lucide-react';

const API_URL = 'https://api.bonapp.dev/api';

const MenuManagement = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [dailyMenu, setDailyMenu] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);
  const [schoolName, setSchoolName] = useState('');
  const [menuType, setMenuType] = useState('items'); 
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: '',
    price: '',
    description: '',
    available: true
  });

  const categories = ['ארוחה עיקרית', 'תוספות', 'משקאות', 'קינוחים', 'חטיפים'];

  useEffect(() => {
    const loadData = async () => {
      try {
        const user = JSON.parse(localStorage.getItem('currentUser'));
        if (!user) {
          navigate('/login');
          return;
        }
        setCurrentUser(user);

        // טען שם בית ספר וסוג תפריט
const schoolsData = await getSchools();
if (schoolsData.success) {
  const school = schoolsData.schools.find(s => s.id === user.school_id);
  if (school) {
    setSchoolName(school.name);
    setMenuType(school.menu_type || 'items');
  }
}

        // טען תפריט
        const result = await getMenuItems(user.school_id);
        if (result.success) {
          setMenuItems(result.menuItems);
        }

        // טען תפריט יומי - הוסף את זה! 👇
const dailyResult = await fetch(`${API_URL}/daily-menu/${user.school_id}`);
const dailyData = await dailyResult.json();
if (dailyData.success) {
  setDailyMenu(dailyData.dailyMenu || []);
}

      } catch (error) {
        console.error('Error loading data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [navigate]);

const handleMenuTypeChange = async (newType) => {
  try {
    // עדכן ב-backend (נוסיף route בהמשך)
    const response = await fetch(`${API_URL}/schools/${currentUser.school_id}/menu-type`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ menu_type: newType })
    });
    
    const result = await response.json();
    if (result.success) {
      setMenuType(newType);
      alert(`סוג התפריט שונה ל${newType === 'items' ? 'פריטים בודדים' : 'תפריט יומי'}`);
    }
  } catch (error) {
    alert('שגיאה בעדכון סוג תפריט');
  }
};

  const handleAddItem = async () => {
    if (!formData.name || !formData.category || !formData.price) {
      alert('אנא מלא את כל השדות החובה');
      return;
    }

    try {
      const result = await addMenuItem(currentUser.school_id, {
        ...formData,
        price: parseFloat(formData.price)
      });

      if (result.success) {
        setMenuItems([...menuItems, result.menuItem]);
        setShowAddModal(false);
        resetForm();
        alert('הפריט נוסף בהצלחה!');
      }
    } catch (error) {
      alert('שגיאה בהוספת פריט');
    }
  };

  const handleUpdateItem = async () => {
    if (!formData.name || !formData.category || !formData.price) {
      alert('אנא מלא את כל השדות החובה');
      return;
    }

    try {
      const result = await updateMenuItem(editingItem.id, {
        ...formData,
        price: parseFloat(formData.price)
      });

      if (result.success) {
        setMenuItems(menuItems.map(item => 
          item.id === editingItem.id ? result.menuItem : item
        ));
        setEditingItem(null);
        resetForm();
        alert('הפריט עודכן בהצלחה!');
      }
    } catch (error) {
      alert('שגיאה בעדכון פריט');
    }
  };

  const handleSaveDailyMenu = async () => {
  if (!formData.menu_description || !formData.price) {
    alert('אנא מלא את כל השדות');
    return;
  }

  try {
    const response = await fetch(`${API_URL}/daily-menu`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        school_id: currentUser.school_id,
        day_of_week: editingItem.day_of_week,
        menu_description: formData.menu_description,
        price: parseFloat(formData.price),
        active: formData.active
      })
    });

    const result = await response.json();
    if (result.success) {
      // עדכן את המערך המקומי
      const updatedDailyMenu = dailyMenu.filter(d => d.day_of_week !== editingItem.day_of_week);
      setDailyMenu([...updatedDailyMenu, result.dailyMenu].sort((a, b) => a.day_of_week - b.day_of_week));
      
      setEditingItem(null);
      resetForm();
      alert('התפריט היומי נשמר בהצלחה!');
    }
  } catch (error) {
    alert('שגיאה בשמירת תפריט יומי');
  }
};

  const handleDeleteItem = async (itemId) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק פריט זה?')) {
      return;
    }

    try {
      const result = await deleteMenuItem(itemId);
      if (result.success) {
        setMenuItems(menuItems.filter(item => item.id !== itemId));
        alert('הפריט נמחק בהצלחה!');
      }
    } catch (error) {
      alert('שגיאה במחיקת פריט');
    }
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      category: item.category,
      price: item.price.toString(),
      description: item.description || '',
      available: item.available
    });
  };

  const resetForm = () => {
  setFormData({
    name: '',
    category: '',
    price: '',
    description: '',
    available: true,
    menu_description: '',
    active: true
  });
};

  const toggleAvailability = async (item) => {
    try {
      const result = await updateMenuItem(item.id, {
        ...item,
        available: !item.available
      });

      if (result.success) {
        setMenuItems(menuItems.map(i => 
          i.id === item.id ? result.menuItem : i
        ));
      }
    } catch (error) {
      alert('שגיאה בעדכון זמינות');
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
      padding: '1.5rem 2rem',
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(20px)'
    },
    headerContent: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      maxWidth: '1400px',
      margin: '0 auto'
    },
    logoSection: {
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
    mainContent: {
      padding: '2rem',
      maxWidth: '1400px',
      margin: '0 auto'
    },
    card: {
      background: 'rgba(255, 255, 255, 0.95)',
      borderRadius: '20px',
      padding: '2rem',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
      backdropFilter: 'blur(20px)'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: '2rem'
    },
    cardTitle: {
      fontSize: '1.5rem',
      fontWeight: 'bold',
      color: '#333',
      margin: 0,
      display: 'flex',
      alignItems: 'center',
      gap: '0.75rem'
    },
    addButton: {
      background: 'linear-gradient(135deg, #4CAF50, #45a049)',
      color: 'white',
      border: 'none',
      padding: '0.75rem 1.5rem',
      borderRadius: '25px',
      cursor: 'pointer',
      fontWeight: '600',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem',
      fontSize: '1rem'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    th: {
      textAlign: 'right',
      padding: '1rem',
      borderBottom: '2px solid #e0e0e0',
      fontWeight: '600',
      color: '#333'
    },
    td: {
      padding: '1rem',
      borderBottom: '1px solid #f0f0f0'
    },
    modal: {
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
    },
    modalContent: {
      background: 'white',
      borderRadius: '16px',
      padding: '2rem',
      maxWidth: '500px',
      width: '100%',
      boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)'
    },
    modalTitle: {
      fontSize: '1.4rem',
      fontWeight: 'bold',
      marginBottom: '2rem',
      color: '#333'
    },
    formGroup: {
      marginBottom: '1.5rem'
    },
    label: {
      display: 'block',
      fontSize: '0.9rem',
      fontWeight: '600',
      marginBottom: '0.5rem',
      color: '#333'
    },
    input: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e0e0e0',
      borderRadius: '8px',
      fontSize: '1rem',
      boxSizing: 'border-box'
    },
    select: {
      width: '100%',
      padding: '0.75rem',
      border: '2px solid #e0e0e0',
      borderRadius: '8px',
      fontSize: '1rem',
      boxSizing: 'border-box'
    },
    buttonGroup: {
      display: 'flex',
      gap: '1rem',
      justifyContent: 'flex-end',
      marginTop: '2rem'
    },
    cancelButton: {
      padding: '0.75rem 1.5rem',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      background: '#f8f9fa',
      color: '#666'
    },
    saveButton: {
      padding: '0.75rem 1.5rem',
      borderRadius: '8px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      background: 'linear-gradient(135deg, #4CAF50, #45a049)',
      color: 'white'
    },
    iconButton: {
      background: 'none',
      border: 'none',
      cursor: 'pointer',
      padding: '0.5rem',
      borderRadius: '8px',
      transition: 'all 0.3s'
    },
    toggleButton: {
      padding: '0.5rem 1rem',
      borderRadius: '20px',
      border: 'none',
      cursor: 'pointer',
      fontWeight: '600',
      fontSize: '0.8rem'
    }
  };

  if (loading) {
    return (
      <div style={styles.container}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'white' }}>
          טוען...
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <div style={styles.logoSection}>
            <div style={styles.logoIcon}>
              <ChefHat size={28} color="white" />
            </div>
            <div>
              <div style={styles.title}>ניהול תפריט</div>
              <div style={styles.subtitle}>{schoolName || 'בית ספר'}</div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontWeight: '600', fontSize: '1.1rem', color: '#333' }}>
                {currentUser?.name || 'מנהל מטבח'}
              </div>
            </div>
            
            <div style={{ display: 'flex', gap: '1rem' }}>
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
    onClick={() => navigate('/kitchen-scanner')}
  >
    <QrCode size={20} />
    חזור לסריקה
  </button>
  
  <button 
    style={styles.iconButton}
    onClick={() => navigate('/')}
    title="יציאה"
  >
    <LogOut size={20} />
  </button>
</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div style={styles.mainContent}>

{/* Toggle סוג תפריט */}
<div style={{
  background: 'rgba(255, 255, 255, 0.95)',
  borderRadius: '16px',
  padding: '1.5rem',
  marginBottom: '2rem',
  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between'
}}>
  <div>
    <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.2rem', color: '#333' }}>
      סוג התפריט
    </h3>
    <p style={{ margin: 0, fontSize: '0.9rem', color: '#666' }}>
      בחר איך תנהל את התפריט של בית הספר
    </p>
  </div>
  
  <div style={{
    display: 'flex',
    gap: '1rem',
    background: '#f8f9fa',
    padding: '0.5rem',
    borderRadius: '12px'
  }}>
    <button
      onClick={() => handleMenuTypeChange('items')}
      style={{
        padding: '0.75rem 2rem',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '1rem',
        background: menuType === 'items' ? 
          'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
        color: menuType === 'items' ? 'white' : '#666',
        transition: 'all 0.3s'
      }}
    >
      📋 פריטים בודדים
    </button>
    
    <button
      onClick={() => handleMenuTypeChange('daily')}
      style={{
        padding: '0.75rem 2rem',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontWeight: '600',
        fontSize: '1rem',
        background: menuType === 'daily' ? 
          'linear-gradient(135deg, #667eea, #764ba2)' : 'transparent',
        color: menuType === 'daily' ? 'white' : '#666',
        transition: 'all 0.3s'
      }}
    >
      📅 תפריט יומי
    </button>
  </div>
</div>

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                <div style={styles.card}>
  {menuType === 'items' ? (
    // תפריט פריטים (הקוד הקיים)
    <>
      <div style={styles.cardHeader}>
        <h2 style={styles.cardTitle}>
          <ChefHat size={24} />
          פריטי התפריט
        </h2>
        <button 
          style={styles.addButton}
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={20} />
          הוסף פריט חדש
        </button>
      </div>

      <table style={styles.table}>
        {/* כל הטבלה הקיימת של פריטים */}
        <thead>
          <tr>
            <th style={styles.th}>שם הפריט</th>
            <th style={styles.th}>קטגוריה</th>
            <th style={styles.th}>מחיר</th>
            <th style={styles.th}>תיאור</th>
            <th style={styles.th}>זמינות</th>
            <th style={styles.th}>פעולות</th>
          </tr>
        </thead>
        <tbody>
          {menuItems.length === 0 ? (
            <tr>
              <td colSpan="6" style={{ ...styles.td, textAlign: 'center', color: '#999', padding: '3rem' }}>
                אין פריטים בתפריט. לחץ על "הוסף פריט חדש" להתחלה.
              </td>
            </tr>
          ) : (
            menuItems.map(item => (
              <tr key={item.id}>
                <td style={styles.td}><strong>{item.name}</strong></td>
                <td style={styles.td}>{item.category}</td>
                <td style={styles.td}>₪{item.price.toFixed(2)}</td>
                <td style={styles.td}>{item.description || '-'}</td>
                <td style={styles.td}>
                  <button
                    onClick={() => toggleAvailability(item)}
                    style={{
                      ...styles.toggleButton,
                      background: item.available ? '#4CAF50' : '#f44336',
                      color: 'white'
                    }}
                  >
                    {item.available ? 'זמין' : 'לא זמין'}
                  </button>
                </td>
                <td style={styles.td}>
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleEdit(item)}
                      style={{ ...styles.iconButton, color: '#2196F3' }}
                      title="ערוך"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button
                      onClick={() => handleDeleteItem(item.id)}
                      style={{ ...styles.iconButton, color: '#f44336' }}
                      title="מחק"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </>
  ) : (
    // תפריט יומי - חדש! 👇
    <>
      <div style={styles.cardHeader}>
        <h2 style={styles.cardTitle}>
          <ChefHat size={24} />
          תפריט שבועי
        </h2>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'].map((day, index) => {
          const dayMenu = dailyMenu.find(d => d.day_of_week === index);
          
          return (
            <div key={index} style={{
              background: '#f8f9fa',
              borderRadius: '12px',
              padding: '1.5rem',
              border: '2px solid #e0e0e0'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '1rem'
              }}>
                <div style={{ flex: 1 }}>
                  <h3 style={{
                    margin: '0 0 0.5rem 0',
                    fontSize: '1.2rem',
                    color: '#333'
                  }}>
                    {day}
                  </h3>
                  {dayMenu ? (
                    <>
                      <p style={{
                        margin: '0 0 0.5rem 0',
                        color: '#666',
                        lineHeight: 1.5
                      }}>
                        {dayMenu.menu_description}
                      </p>
                      <p style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: 'bold',
                        color: '#667eea'
                      }}>
                        ₪{dayMenu.price.toFixed(2)}
                      </p>
                    </>
                  ) : (
                    <p style={{ margin: 0, color: '#999', fontStyle: 'italic' }}>
                      לא הוגדר תפריט ליום זה
                    </p>
                  )}
                </div>
                
                <button
                  onClick={() => {
                    setEditingItem({ ...dayMenu, day_of_week: index, day_name: day });
                    setFormData({
                      menu_description: dayMenu?.menu_description || '',
                      price: dayMenu?.price?.toString() || '',
                      active: dayMenu?.active !== false
                    });
                  }}
                  style={{
                    ...styles.iconButton,
                    color: '#2196F3',
                    background: 'white',
                    border: '1px solid #e0e0e0'
                  }}
                  title="ערוך"
                >
                  <Edit2 size={18} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </>
  )}
</div>
   </div>

   {/* Add/Edit Modal */}
      {(showAddModal || editingItem) && (
        <div style={styles.modal}>
          <div style={styles.modalContent}>
            <h3 style={styles.modalTitle}>
  {editingItem?.day_of_week !== undefined ? 
    `ערוך תפריט - ${editingItem.day_name}` : 
    editingItem ? 'ערוך פריט' : 'הוסף פריט חדש'}
</h3>

{menuType === 'items' ? (
  // טופס לפריטים
  <>
    <div style={styles.formGroup}>
      <label style={styles.label}>שם הפריט *</label>
      <input
        type="text"
        value={formData.name}
        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
        style={styles.input}
        placeholder="לדוגמה: פיצה אישית"
      />
    </div>

    <div style={styles.formGroup}>
      <label style={styles.label}>קטגוריה *</label>
      <select
        value={formData.category}
        onChange={(e) => setFormData({ ...formData, category: e.target.value })}
        style={styles.select}
      >
        <option value="">בחר קטגוריה</option>
        {categories.map(cat => (
          <option key={cat} value={cat}>{cat}</option>
        ))}
      </select>
    </div>

    <div style={styles.formGroup}>
      <label style={styles.label}>מחיר (₪) *</label>
      <input
        type="number"
        step="0.1"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
        style={styles.input}
        placeholder="0.00"
      />
    </div>

    <div style={styles.formGroup}>
      <label style={styles.label}>תיאור</label>
      <input
        type="text"
        value={formData.description}
        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
        style={styles.input}
        placeholder="תיאור קצר (אופציונלי)"
      />
    </div>

    <div style={styles.formGroup}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={formData.available}
          onChange={(e) => setFormData({ ...formData, available: e.target.checked })}
        />
        <span>פריט זמין למכירה</span>
      </label>
    </div>
  </>
) : (
  // טופס לתפריט יומי
  <>
    <div style={styles.formGroup}>
      <label style={styles.label}>תפריט *</label>
      <textarea
        value={formData.menu_description}
        onChange={(e) => setFormData({ ...formData, menu_description: e.target.value })}
        style={{
          ...styles.input,
          minHeight: '100px',
          resize: 'vertical',
          fontFamily: 'inherit'
        }}
        placeholder="לדוגמה: שניצל + אורז + סלט ירוק + מיץ תפוזים"
      />
    </div>

    <div style={styles.formGroup}>
      <label style={styles.label}>מחיר (₪) *</label>
      <input
        type="number"
        step="0.1"
        value={formData.price}
        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
        style={styles.input}
        placeholder="0.00"
      />
    </div>

    <div style={styles.formGroup}>
      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer' }}>
        <input
          type="checkbox"
          checked={formData.active}
          onChange={(e) => setFormData({ ...formData, active: e.target.checked })}
        />
        <span>ארוחה זמינה</span>
      </label>
    </div>
  </>
)}

<div style={styles.buttonGroup}>
  <button
    onClick={() => {
      setShowAddModal(false);
      setEditingItem(null);
      resetForm();
    }}
    style={styles.cancelButton}
  >
    ביטול
  </button>
  <button
    onClick={() => {
      if (menuType === 'daily') {
        handleSaveDailyMenu();
      } else {
        editingItem ? handleUpdateItem() : handleAddItem();
      }
    }}
    style={styles.saveButton}
  >
    {editingItem ? 'עדכן' : 'הוסף'}
  </button>
</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuManagement;