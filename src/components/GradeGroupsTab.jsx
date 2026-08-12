import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Calendar } from 'lucide-react';
import { authFetch } from '../auth';

const GradeGroupsTab = ({ schoolId }) => {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupDesc, setNewGroupDesc] = useState('');
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [schedule, setSchedule] = useState({ days_count: '', meal_price: '' });
const [message, setMessage] = useState('');
const [studyDays, setStudyDays] = useState([]);
const [calendarMonth, setCalendarMonth] = useState(new Date().getMonth() + 1);
const [calendarYear, setCalendarYear] = useState(new Date().getFullYear());

// העלאת שנה
const [showPromoteModal, setShowPromoteModal] = useState(false);
const [promoteMapping, setPromoteMapping] = useState({});
const [groupStudentCounts, setGroupStudentCounts] = useState({});
const [promoting, setPromoting] = useState(false);


  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const monthNames = ['', 'ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני',
    'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

    const loadGroups = async () => {
    try {
      console.log('Loading groups for schoolId:', schoolId);
      const response = await authFetch(`https://api.bonapp.dev/api/schools/${schoolId}/groups`);
      const data = await response.json();
      console.log('Groups data:', data);
      if (data.success) setGroups(data.groups);
    } catch (error) {
      console.error('Error loading groups:', error);
    }
    setLoading(false);
  };

 useEffect(() => {
    console.log('useEffect fired, schoolId:', schoolId);
    if (schoolId) loadGroups();
  }, [schoolId]);

  

  const addGroup = async () => {
    if (!newGroupName.trim()) return;
    try {
      const response = await authFetch(`https://api.bonapp.dev/api/schools/${schoolId}/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newGroupName, description: newGroupDesc })
      });
      const data = await response.json();
      if (data.success) {
        setGroups([...groups, data.group]);
        setNewGroupName('');
        setNewGroupDesc('');
        setMessage('✅ השכבה נוספה בהצלחה');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error adding group:', error);
    }
  };

  const deleteGroup = async (groupId) => {
    if (!window.confirm('האם למחוק את השכבה?')) return;
    try {
      const response = await authFetch(`https://api.bonapp.dev/api/groups/${groupId}`, {
        method: 'DELETE'
      });
      const data = await response.json();
      if (data.success) {
        setGroups(groups.filter(g => g.id !== groupId));
        if (selectedGroup?.id === groupId) setSelectedGroup(null);
        setMessage('✅ השכבה נמחקה');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error deleting group:', error);
    }
  };

  const openPromoteModal = async () => {
    try {
      const response = await authFetch(`https://api.bonapp.dev/api/school-students/${schoolId}`);
      const data = await response.json();
      if (data.success) {
        const counts = {};
        data.students.forEach(s => {
          if (s.status !== 'active') return;
          counts[s.group_id] = (counts[s.group_id] || 0) + 1;
        });
        setGroupStudentCounts(counts);
      }
    } catch (error) {
      console.error('Error loading student counts:', error);
    }
    setPromoteMapping({});
    setShowPromoteModal(true);
  };

  const executePromotion = async () => {
    const mappings = Object.entries(promoteMapping)
      .filter(([, target]) => target !== '' && target !== undefined)
      .map(([fromGroupId, target]) => ({
        fromGroupId,
        toGroupId: target === 'GRADUATE' ? null : target
      }));

    if (mappings.length === 0) {
      alert('לא נבחרו מעברים');
      return;
    }

    const summary = mappings.map(m => {
      const fromName = groups.find(g => g.id === m.fromGroupId)?.name || '?';
      const toName = m.toGroupId ? (groups.find(g => g.id === m.toGroupId)?.name || '?') : 'בוגרים (לא פעיל)';
      const count = groupStudentCounts[m.fromGroupId] || 0;
      return `${fromName} ← ${toName} (${count} תלמידים)`;
    }).join('\n');

    if (!window.confirm(`לבצע את המעברים הבאים?\n\n${summary}\n\nפעולה זו לא ניתנת לביטול.`)) return;

    setPromoting(true);
    try {
      const response = await authFetch(`https://api.bonapp.dev/api/schools/${schoolId}/promote-groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mappings })
      });
      const data = await response.json();
      if (data.success) {
        setMessage('✅ העלאת השנה בוצעה בהצלחה');
        setTimeout(() => setMessage(''), 4000);
        setShowPromoteModal(false);
        if (selectedGroup) loadSchedule(selectedGroup);
      } else {
        alert(data.message || 'שגיאה בביצוע העלאת שנה');
      }
    } catch (error) {
      console.error('Error promoting groups:', error);
      alert('שגיאה בביצוע העלאת שנה');
    } finally {
      setPromoting(false);
    }
  };

  const loadSchedule = async (group) => {
    setSelectedGroup(group);
    loadStudyDays(group.id, calendarMonth, calendarYear);
    try {
      // טען מחיר ממנהל מטבח
      const schoolResponse = await authFetch(`https://api.bonapp.dev/api/schools/${schoolId}`);
      const schoolData = await schoolResponse.json();
      if (schoolData.success) {
        setSchedule({
          days_count: '',
          meal_price: schoolData.school?.monthly_meal_price || ''
        });
      }
    } catch (error) {
      console.error('Error loading schedule:', error);
    }
  };

const loadStudyDays = async (groupId, month = calendarMonth, year = calendarYear) => {
  try {
    const response = await authFetch(
      `https://api.bonapp.dev/api/groups/${groupId}/study-days?month=${month}&year=${year}`
    );
    const data = await response.json();
    if (data.success) {
      setStudyDays(data.studyDays.map(d => d.date));
    }
  } catch (error) {
    console.error('Error loading study days:', error);
  }
};

const toggleStudyDay = async (date) => {
  if (!selectedGroup) return;
  try {
    const response = await authFetch(
      `https://api.bonapp.dev/api/groups/${selectedGroup.id}/study-days/toggle`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date, school_id: schoolId })
      }
    );
    const data = await response.json();
    if (data.success) {
      console.log('date:', date);
console.log('studyDays:', studyDays);
console.log('action:', data.action);

      if (data.action === 'added') {
        setStudyDays([...studyDays, date]);
      } else {
        setStudyDays(studyDays.filter(d => d !== date));
      }
    }
  } catch (error) {
    console.error('Error toggling study day:', error);
  }
};

 const saveSchedule = async () => {
    if (!selectedGroup) return;
    const daysInMonth = studyDays.filter(d => 
      d.startsWith(`${calendarYear}-${String(calendarMonth).padStart(2, '0')}`)
    ).length;
    try {
      const response = await authFetch(`https://api.bonapp.dev/api/groups/${selectedGroup.id}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          school_id: schoolId,
          month: calendarMonth,
          year: calendarYear,
          days_count: daysInMonth,
          meal_price: 0
        })
      });

      const data = await response.json();
      if (data.success) {
        setMessage('✅ לוח הארוחות נשמר בהצלחה');
        setTimeout(() => setMessage(''), 3000);
      }
    } catch (error) {
      console.error('Error saving schedule:', error);
    }
  };

  console.log('GradeGroupsTab schoolId:', schoolId);
  if (!schoolId) return <div style={{ textAlign: 'center', padding: '2rem', color: '#999' }}>טוען נתוני בית ספר...</div>;
  if (loading) return <div style={{ textAlign: 'center', padding: '2rem' }}>טוען...</div>;

  return (
    <div style={{ direction: 'rtl' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem', flexWrap: 'wrap', gap: '1rem' }}>
        <h2 style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#333', margin: 0 }}>
          ניהול שכבות
        </h2>
        {groups.length > 0 && (
          <button
            onClick={openPromoteModal}
            style={{
              background: 'linear-gradient(135deg, #FF9800, #F57C00)', color: 'white', border: 'none',
              padding: '0.75rem 1.5rem', borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            🎓 העלאת שנה
          </button>
        )}
      </div>

      {message && (
        <div style={{
          background: '#e8f5e9', color: '#2e7d32', padding: '1rem',
          borderRadius: '8px', marginBottom: '1rem', fontWeight: '600'
        }}>
          {message}
        </div>
      )}

      {/* הוספת שכבה */}
      <div style={{
        background: 'white', padding: '1.5rem', borderRadius: '16px',
        boxShadow: '0 4px 16px rgba(0,0,0,0.05)', marginBottom: '2rem'
      }}>
        <h3 style={{ margin: '0 0 1rem 0', color: '#555' }}>הוסף שכבה חדשה</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="שם השכבה (לדוגמה: כיתות א'-ב')"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            style={{
              flex: 1, padding: '0.75rem 1rem', borderRadius: '8px',
              border: '2px solid #e0e0e0', fontSize: '1rem', minWidth: '200px'
            }}
          />
          <input
            type="text"
            placeholder="תיאור (אופציונלי)"
            value={newGroupDesc}
            onChange={(e) => setNewGroupDesc(e.target.value)}
            style={{
              flex: 1, padding: '0.75rem 1rem', borderRadius: '8px',
              border: '2px solid #e0e0e0', fontSize: '1rem', minWidth: '200px'
            }}
          />
          <button
            onClick={addGroup}
            style={{
              background: 'linear-gradient(135deg, #667eea, #764ba2)',
              color: 'white', border: 'none', padding: '0.75rem 1.5rem',
              borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
              display: 'flex', alignItems: 'center', gap: '0.5rem'
            }}
          >
            <Plus size={18} />
            הוסף שכבה
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedGroup ? '1fr 1fr' : '1fr', gap: '2rem' }}>
        {/* רשימת שכבות */}
        <div style={{
          background: 'white', padding: '1.5rem', borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#555' }}>שכבות קיימות</h3>
          {groups.length === 0 ? (
            <p style={{ color: '#999', textAlign: 'center', padding: '2rem' }}>
              אין שכבות עדיין
            </p>
          ) : (
            groups.map(group => (
              <div key={group.id} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '1rem', borderRadius: '8px', marginBottom: '0.5rem',
                background: selectedGroup?.id === group.id ? '#f0f0ff' : '#f8f9fa',
                border: selectedGroup?.id === group.id ? '2px solid #667eea' : '2px solid transparent',
                cursor: 'pointer'
              }}
                onClick={() => loadSchedule(group)}
              >
                <div>
                  <p style={{ margin: 0, fontWeight: '600', color: '#333' }}>{group.name}</p>
                  {group.description && (
                    <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>{group.description}</p>
                  )}
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }}
                  style={{
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: '#f44336', padding: '0.25rem'
                  }}
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))
          )}
        </div>

       {/* לוח ארוחות לחודש */}
        {selectedGroup && <div style={{
          background: 'white', padding: '1.5rem', borderRadius: '16px',
          boxShadow: '0 4px 16px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ margin: '0 0 1rem 0', color: '#555' }}>
            <Calendar size={20} style={{ marginLeft: '0.5rem' }} />
            ימי ארוחה - {monthNames[currentMonth]} {currentYear}
          </h3>

          
            <div>
              <p style={{ color: '#667eea', fontWeight: '600', marginBottom: '1rem' }}>
                שכבה: {selectedGroup.name}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {studyDays.length > 0 && schedule.meal_price && (
                  <div style={{
                    background: '#e8f5e9', padding: '1rem', borderRadius: '8px', textAlign: 'center'
                  }}>
                    <p style={{ margin: 0, color: '#2e7d32', fontWeight: '600', fontSize: '1.2rem' }}>
                      {studyDays.filter(d => d.startsWith(`${calendarYear}-${String(calendarMonth).padStart(2, '0')}`)).length} ימים × ₪{schedule.meal_price} = ₪{(studyDays.filter(d => d.startsWith(`${calendarYear}-${String(calendarMonth).padStart(2, '0')}`)).length * schedule.meal_price).toFixed(2)}
                    </p>
                  </div>
                )}

{/* לוח שנה לסימון ימי לימוד */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: '#555', fontWeight: '600' }}>
                    📅 סמן ימי לימוד - {monthNames[calendarMonth]} {calendarYear}
                  </label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <button onClick={() => {
                      const d = new Date(calendarYear, calendarMonth - 2, 1);
                      setCalendarMonth(d.getMonth() + 1);
                      setCalendarYear(d.getFullYear());
                      loadStudyDays(selectedGroup.id);
                    }} style={{ padding: '0.25rem 0.75rem', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer' }}>
                      ◀
                    </button>
                    <span style={{ flex: 1, textAlign: 'center', fontWeight: '600' }}>
                      {monthNames[calendarMonth]} {calendarYear}
                    </span>
                    <button onClick={() => {
                      const d = new Date(calendarYear, calendarMonth, 1);
                      setCalendarMonth(d.getMonth() + 1);
                      setCalendarYear(d.getFullYear());
                      loadStudyDays(selectedGroup.id);
                    }} style={{ padding: '0.25rem 0.75rem', borderRadius: '6px', border: '1px solid #ddd', cursor: 'pointer' }}>
                      ▶
                    </button>
                  </div>
                  
                  {/* כותרות ימים */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px', marginBottom: '2px' }}>
                    {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(d => (
                      <div key={d} style={{ textAlign: 'center', fontSize: '0.75rem', color: '#999', padding: '4px' }}>{d}</div>
                    ))}
                  </div>
                  
                  {/* ימי החודש */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: '2px' }}>
                    {(() => {
                      const firstDay = new Date(calendarYear, calendarMonth - 1, 1).getDay();
                      const daysInMonth = new Date(calendarYear, calendarMonth, 0).getDate();
                      const cells = [];
                      
                      // תאי ריקים בהתחלה
                      for (let i = 0; i < firstDay; i++) {
                        cells.push(<div key={`empty-${i}`} />);
                      }
                      
                      // ימי החודש
                      for (let day = 1; day <= daysInMonth; day++) {
                        const dateStr = `${calendarYear}-${String(calendarMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                        const isStudyDay = studyDays.includes(dateStr);
                        const dayOfWeek = new Date(calendarYear, calendarMonth - 1, day).getDay();
                        const isFriday = dayOfWeek === 5;
                        const isSaturday = dayOfWeek === 6;
                        
                        cells.push(
                          <div
                            key={day}
                            onClick={() => !isSaturday && toggleStudyDay(dateStr)}
                            style={{
                              textAlign: 'center',
                              padding: '6px 2px',
                              borderRadius: '6px',
                              cursor: isSaturday ? 'default' : 'pointer',
                              background: isStudyDay ? '#4CAF50' : isSaturday ? '#f5f5f5' : isFriday ? '#fff3e0' : 'white',
                              color: isStudyDay ? 'white' : isSaturday ? '#ccc' : '#333',
                              border: `1px solid ${isStudyDay ? '#4CAF50' : '#e0e0e0'}`,
                              fontSize: '0.85rem',
                              fontWeight: isStudyDay ? '600' : 'normal'
                            }}
                          >
                            {day}
                          </div>
                        );
                      }
                      return cells;
                    })()}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: '#999', marginTop: '0.5rem' }}>
                    ירוק = יום לימוד | לחץ להוסיף/להסיר
                  </p>
                </div>


                <button
                  onClick={saveSchedule}
                  style={{
                    background: 'linear-gradient(135deg, #4CAF50, #45a049)',
                    color: 'white', border: 'none', padding: '1rem',
                    borderRadius: '8px', cursor: 'pointer', fontWeight: '600',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                  }}
                >
                  <Save size={18} />
                  שמור לוח ארוחות
                </button>
              </div>
            </div>
          
        </div>}
      </div>

      {showPromoteModal && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.7)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 2000, padding: '1rem'
        }}>
          <div style={{
            background: 'white', borderRadius: '20px', padding: '2rem',
            maxWidth: '550px', width: '100%', maxHeight: '85vh', overflowY: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#333' }}>🎓 העלאת שנה</h3>
            <p style={{ color: '#666', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              עבור כל שכבה, בחרו לאן עוברים התלמידים שבה. שכבות שלא נבחר להן יעד יישארו ללא שינוי.
            </p>

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
              {groups.map(group => (
                <div key={group.id} style={{
                  display: 'flex', alignItems: 'center', gap: '1rem',
                  padding: '0.75rem', background: '#f8f9fa', borderRadius: '10px'
                }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: '600', color: '#333' }}>{group.name}</div>
                    <div style={{ fontSize: '0.8rem', color: '#999' }}>{groupStudentCounts[group.id] || 0} תלמידים</div>
                  </div>
                  <div style={{ fontSize: '1.2rem', color: '#999' }}>←</div>
                  <select
                    value={promoteMapping[group.id] || ''}
                    onChange={(e) => setPromoteMapping(prev => ({ ...prev, [group.id]: e.target.value }))}
                    style={{ flex: 1, padding: '0.6rem', borderRadius: '8px', border: '2px solid #e0e0e0', fontSize: '0.9rem' }}
                  >
                    <option value="">-- ללא שינוי --</option>
                    {groups.filter(g => g.id !== group.id).map(g => (
                      <option key={g.id} value={g.id}>{g.name}</option>
                    ))}
                    <option value="GRADUATE">בוגרים (הוצא מרשימה פעילה)</option>
                  </select>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => setShowPromoteModal(false)}
                disabled={promoting}
                style={{
                  flex: 1, padding: '1rem', borderRadius: '12px', border: '2px solid #e0e0e0',
                  background: 'white', color: '#666', fontWeight: '600', cursor: promoting ? 'not-allowed' : 'pointer'
                }}
              >
                ביטול
              </button>
              <button
                onClick={executePromotion}
                disabled={promoting}
                style={{
                  flex: 1, padding: '1rem', borderRadius: '12px', border: 'none',
                  background: promoting ? '#ccc' : 'linear-gradient(135deg, #FF9800, #F57C00)',
                  color: 'white', fontWeight: '600', cursor: promoting ? 'not-allowed' : 'pointer'
                }}
              >
                {promoting ? 'מבצע...' : 'בצע העלאת שנה'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeGroupsTab;