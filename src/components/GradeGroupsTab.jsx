import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Save, Calendar, X } from 'lucide-react';
import { authFetch } from '../auth';
import PageHeader from './secretary/PageHeader';
import EmptyState from './secretary/EmptyState';
import IconButton from './secretary/IconButton';
import './secretary/secretary.css';

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
          meal_price: schedule.meal_price || 0
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
  if (!schoolId) return <div className="bap-sec"><EmptyState description="טוען נתוני בית ספר..." /></div>;
  if (loading) return <div className="bap-sec"><EmptyState description="טוען..." /></div>;

  return (
    <div className="bap-sec">
      <PageHeader
        title="ניהול שכבות"
        actions={
          groups.length > 0 && (
            <button className="bap-sec-btn bap-sec-btn--warn" onClick={openPromoteModal}>
              🎓 העלאת שנה
            </button>
          )
        }
      />

      {message && <div className="bap-sec-message">{message}</div>}

      {/* הוספת שכבה */}
      <div className="bap-sec-settings-card" style={{ maxWidth: 'none' }}>
        <h3>הוסף שכבה חדשה</h3>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            className="bap-sec-input"
            placeholder="שם השכבה (לדוגמה: כיתות א'-ב')"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <input
            type="text"
            className="bap-sec-input"
            placeholder="תיאור (אופציונלי)"
            value={newGroupDesc}
            onChange={(e) => setNewGroupDesc(e.target.value)}
            style={{ flex: 1, minWidth: 200 }}
          />
          <button className="bap-sec-btn bap-sec-btn--primary" onClick={addGroup}>
            <Plus size={18} />
            הוסף שכבה
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: selectedGroup ? '1fr 1fr' : '1fr', gap: '2rem' }}>
        {/* רשימת שכבות */}
        <div className="bap-sec-settings-card" style={{ maxWidth: 'none', marginBottom: 0 }}>
          <h3>שכבות קיימות</h3>
          {groups.length === 0 ? (
            <EmptyState description="אין שכבות עדיין" />
          ) : (
            groups.map(group => (
              <div
                key={group.id}
                className={`bap-sec-group-row ${selectedGroup?.id === group.id ? 'active' : ''}`}
                onClick={() => loadSchedule(group)}
              >
                <div>
                  <p>{group.name}</p>
                  {group.description && <span>{group.description}</span>}
                </div>
                <IconButton
                  variant="danger"
                  title="מחק שכבה"
                  ariaLabel="מחק שכבה"
                  onClick={(e) => { e.stopPropagation(); deleteGroup(group.id); }}
                >
                  <Trash2 size={18} />
                </IconButton>
              </div>
            ))
          )}
        </div>

       {/* לוח ארוחות לחודש */}
        {selectedGroup && (
          <div className="bap-sec-settings-card" style={{ maxWidth: 'none', marginBottom: 0 }}>
            <h3>
              <Calendar size={20} style={{ marginLeft: '0.5rem' }} />
              ימי ארוחה - {monthNames[currentMonth]} {currentYear}
            </h3>

            <div>
              <p style={{ color: 'var(--blue)', fontWeight: 600, marginBottom: '1rem' }}>
                שכבה: {selectedGroup.name}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {studyDays.length > 0 && schedule.meal_price && (
                  <div style={{ background: 'var(--green2)', padding: '1rem', borderRadius: '8px', textAlign: 'center' }}>
                    <p style={{ margin: 0, color: '#2e7d32', fontWeight: 600, fontSize: '1.2rem' }}>
                      {studyDays.filter(d => d.startsWith(`${calendarYear}-${String(calendarMonth).padStart(2, '0')}`)).length} ימים × ₪{schedule.meal_price} = ₪{(studyDays.filter(d => d.startsWith(`${calendarYear}-${String(calendarMonth).padStart(2, '0')}`)).length * schedule.meal_price).toFixed(2)}
                    </p>
                  </div>
                )}

                {/* לוח שנה לסימון ימי לימוד */}
                <div>
                  <label style={{ display: 'block', marginBottom: '0.5rem', color: 'var(--muted)', fontWeight: 600 }}>
                    📅 סמן ימי לימוד - {monthNames[calendarMonth]} {calendarYear}
                  </label>
                  <div className="bap-sec-calendar-nav">
                    <button onClick={() => {
                      const d = new Date(calendarYear, calendarMonth - 2, 1);
                      const newMonth = d.getMonth() + 1;
                      const newYear = d.getFullYear();
                      setCalendarMonth(newMonth);
                      setCalendarYear(newYear);
                      loadStudyDays(selectedGroup.id, newMonth, newYear);
                    }}>
                      ◀
                    </button>
                    <span style={{ flex: 1, textAlign: 'center', fontWeight: 600 }}>
                      {monthNames[calendarMonth]} {calendarYear}
                    </span>
                    <button onClick={() => {
                      const d = new Date(calendarYear, calendarMonth, 1);
                      const newMonth = d.getMonth() + 1;
                      const newYear = d.getFullYear();
                      setCalendarMonth(newMonth);
                      setCalendarYear(newYear);
                      loadStudyDays(selectedGroup.id, newMonth, newYear);
                    }}>
                      ▶
                    </button>
                  </div>

                  {/* כותרות ימים */}
                  <div className="bap-sec-calendar-grid" style={{ marginBottom: 2 }}>
                    {['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ש'].map(d => (
                      <div key={d} className="bap-sec-calendar-head">{d}</div>
                    ))}
                  </div>

                  {/* ימי החודש */}
                  <div className="bap-sec-calendar-grid">
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
                            className={`bap-sec-day-cell ${isStudyDay ? 'study' : ''} ${isSaturday ? 'saturday' : ''} ${isFriday ? 'friday' : ''}`}
                          >
                            {day}
                          </div>
                        );
                      }
                      return cells;
                    })()}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                    ירוק = יום לימוד | לחץ להוסיף/להסיר
                  </p>
                </div>

                <button className="bap-sec-btn bap-sec-btn--success" onClick={saveSchedule}>
                  <Save size={18} />
                  שמור לוח ארוחות
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {showPromoteModal && (
        <div className="bap-sec-modal-overlay">
          <div className="bap-sec-modal">
            <div className="bap-sec-modal-head" style={{ paddingBottom: 0 }}>
              <h3 style={{ margin: '0 0 0.5rem 0' }}>🎓 העלאת שנה</h3>
              <button
                type="button"
                className="bap-sec-modal-close"
                aria-label="סגירת חלון העלאת שנה"
                onClick={() => setShowPromoteModal(false)}
                disabled={promoting}
              >
                <X size={20} />
              </button>
            </div>
            <div className="bap-sec-modal-scroll">
            <p style={{ color: 'var(--muted)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
              עבור כל שכבה, בחרו לאן עוברים התלמידים שבה. שכבות שלא נבחר להן יעד יישארו ללא שינוי.
            </p>

            <div style={{ display: 'grid', gap: '1rem', marginBottom: '2rem' }}>
              {groups.map(group => (
                <div key={group.id} style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '0.75rem', background: 'var(--paper)', borderRadius: '10px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 600 }}>{group.name}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>{groupStudentCounts[group.id] || 0} תלמידים</div>
                  </div>
                  <div style={{ fontSize: '1.2rem', color: 'var(--muted)' }}>←</div>
                  <select
                    className="bap-sec-select"
                    style={{ flex: 1 }}
                    value={promoteMapping[group.id] || ''}
                    onChange={(e) => setPromoteMapping(prev => ({ ...prev, [group.id]: e.target.value }))}
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

            <div className="bap-sec-modal-actions">
              <button className="bap-sec-btn bap-sec-btn--secondary" onClick={() => setShowPromoteModal(false)} disabled={promoting}>
                ביטול
              </button>
              <button className="bap-sec-btn bap-sec-btn--warn" onClick={executePromotion} disabled={promoting}>
                {promoting ? 'מבצע...' : 'בצע העלאת שנה'}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GradeGroupsTab;
