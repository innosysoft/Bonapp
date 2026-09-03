import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { getTransactionsReport, getMealsReport, getKitchenSummary, getSchools } from '../api';
import { BarChart3, LogOut, TrendingUp, Receipt, CalendarDays, Wallet, Users, UtensilsCrossed, CreditCard, ClipboardList, Sun } from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell
} from 'recharts';

// דוחות למנהל מטבח - שלושה דוחות נפרדים ובבירור מסומנים, כדי שלא יתבלבלו ביניהם:
// 1) "תשלומים שהתקבלו" - כסף שהופקד לחשבונות (type='payment'). לא אומר כמה ילדים אכלו
//    בפועל - הורה ששילם חודשי מופיע פעם אחת בחודש, לא פעם ליום.
// 2) "ארוחות שסופקו בקופה" - כל פעם שילד עבר בקופה/בקיוסק ומימש ארוחה (type='meal'),
//    כולל כרטיס "היום" בולט (אותו מספר בדיוק כמו בראש מסך הקופה) וטבלה/גרף היסטוריים.
//    זה "כמה באמת באו לאכול" - נבדק אחרי הארוחה.
// 3) "היערכות להיום" - כמה תלמידים על מנוי חודשי (יגיעו בוודאות) וכמה על תשלום בודד
//    עם יתרה (עשויים להגיע) - כדי להיערך *לפני* הארוחה. מבוסס על אותו אנדפוינט
//    kitchen-summary שכבר קיים ומוצג גם בעמוד הקופה הראשי - לא נוגע/כפול בנתונים, רק
//    מציג אותם גם כאן במסגרת "דוחות" לנוחות.
// עמוד נפרד (כמו מסך הייצור) כדי שאפשר יהיה להוסיף אליו דוחות נוספים בעתיד בלי לגעת
// בקופה/בקיוסק/בשום דבר קיים - כל הדוחות קוראים בלבד מהשרת ולא נוגעים בשום נתון.
const COLOR_DAILY = '#356b8c';
const COLOR_MONTHLY = '#75a843';
const COLOR_MEALS = '#c9702f';
const COLOR_OTHER = '#b7c2c9';

const formatPeriodLabel = (period, groupBy) => {
  if (groupBy === 'month') {
    const [y, m] = period.split('-');
    const names = ['ינו', 'פבר', 'מרץ', 'אפר', 'מאי', 'יוני', 'יולי', 'אוג', 'ספט', 'אוק', 'נוב', 'דצמ'];
    return `${names[parseInt(m, 10) - 1] || m} ${y}`;
  }
  const [, m, d] = period.split('-');
  return `${d}/${m}`;
};

const KitchenReports = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [schoolName, setSchoolName] = useState('');
  const [reportType, setReportType] = useState('payments'); // 'payments' | 'meals' | 'prep'
  const [groupBy, setGroupBy] = useState('day');
  const [metric, setMetric] = useState('amount'); // 'amount' | 'count' | 'students'
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState(null); // kitchen-summary: מצב "היום" בזמן אמת
  const [summaryLoading, setSummaryLoading] = useState(true);

  const loadReport = useCallback(async (schoolId, type, mode) => {
    setLoading(true);
    try {
      const result = type === 'meals'
        ? await getMealsReport(schoolId, mode)
        : await getTransactionsReport(schoolId, mode);
      if (result.success) setReport(result);
    } catch (error) {
      console.error('Error loading report:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSummary = useCallback(async (schoolId) => {
    setSummaryLoading(true);
    try {
      const result = await getKitchenSummary(schoolId);
      if (result.success) setSummary(result);
    } catch (error) {
      console.error('Error loading kitchen summary:', error);
    } finally {
      setSummaryLoading(false);
    }
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user || !['kitchen', 'production', 'secretary', 'admin', 'super_admin'].includes(user.type)) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);

    (async () => {
      try {
        const schoolsData = await getSchools();
        if (schoolsData.success) {
          const school = schoolsData.schools.find(s => s.id === user.school_id);
          if (school) setSchoolName(school.name);
        }
      } catch (error) {
        console.error('Error loading school:', error);
      }
      await Promise.all([
        loadReport(user.school_id, reportType, groupBy),
        loadSummary(user.school_id)
      ]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate]);

  useEffect(() => {
    if (currentUser && reportType !== 'prep') loadReport(currentUser.school_id, reportType, groupBy);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [groupBy, reportType]);

  const handleSelectReportType = (type) => {
    setReportType(type);
    setMetric('amount');
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  const rows = report?.rows || [];
  const paymentsTotals = { count: 0, amount: 0, dailyCount: 0, dailyAmount: 0, monthlyCount: 0, monthlyAmount: 0, ...(reportType === 'payments' ? report?.totals : {}) };
  const mealsTotals = { count: 0, amount: 0, uniqueStudents: 0, ...(reportType === 'meals' ? report?.totals : {}) };
  const chartData = rows.map(r => ({
    ...r,
    label: formatPeriodLabel(r.period, groupBy)
  }));

  const prepData = summary || { todaySales: 0, todayTransactionCount: 0, monthlyCount: 0, dailyWithBalanceCount: 0, totalStudents: 0 };
  const prepOther = Math.max(0, prepData.totalStudents - prepData.monthlyCount - prepData.dailyWithBalanceCount);
  const prepChartData = [
    { name: 'מנוי חודשי - יגיעו בוודאות', value: prepData.monthlyCount, fill: COLOR_MONTHLY },
    { name: 'תשלום בודד עם יתרה - עשויים להגיע', value: prepData.dailyWithBalanceCount, fill: COLOR_DAILY },
    { name: 'ללא יתרה / לא רשומים לתשלום', value: prepOther, fill: COLOR_OTHER }
  ].filter(d => d.value > 0);

  return (
    <div className="bap-reports">
      <style>{`
        .bap-reports{
          --navy:#17324a;--blue:#356b8c;--green:#75a843;--green2:#eef6e9;--orange:#c9702f;--paper:#f4f7f7;
          --white:#fff;--muted:#607482;--line:#dce6e9;--shadow:0 6px 20px rgba(23,50,74,.07);
          font-family:'Heebo',Arial,sans-serif;color:var(--navy);background:var(--paper);
          min-height:100vh;
        }
        .bap-reports *{box-sizing:border-box}
        .bap-reports button{font:inherit;cursor:pointer}
        .bap-reports .top{
          min-height:84px;background:#fff;border-bottom:1px solid var(--line);
          display:flex;align-items:center;justify-content:space-between;padding:16px 32px;flex-wrap:wrap;gap:12px;
        }
        .bap-reports .brand{display:flex;align-items:center;gap:14px}
        .bap-reports .brand-icon{width:52px;height:52px;border-radius:14px;background:var(--blue);color:#fff;display:grid;place-items:center;flex-shrink:0}
        .bap-reports .brand h1{font-size:22px;margin:0;color:var(--navy)}
        .bap-reports .brand .sub{color:var(--muted);font-size:14px}
        .bap-reports .logout-btn{border:1px solid var(--line);background:#fff;color:var(--navy);border-radius:10px;padding:10px 16px;display:inline-flex;align-items:center;gap:8px;font-weight:600}
        .bap-reports .logout-btn:hover{background:var(--paper)}

        .bap-reports .body{padding:24px 32px;display:flex;flex-direction:column;gap:20px}

        .bap-reports .report-tabs{display:flex;gap:12px;flex-wrap:wrap}
        .bap-reports .report-tab{flex:1;min-width:220px;background:#fff;border:2px solid var(--line);border-radius:14px;padding:14px 18px;text-align:right;display:flex;flex-direction:column;gap:4px}
        .bap-reports .report-tab .rt-title{font-weight:800;font-size:15px;display:flex;align-items:center;gap:8px}
        .bap-reports .report-tab .rt-sub{font-size:12.5px;color:var(--muted)}
        .bap-reports .report-tab.active{border-color:var(--blue);box-shadow:0 0 0 3px rgba(53,107,140,.12)}
        .bap-reports .report-tab.meals.active{border-color:var(--orange);box-shadow:0 0 0 3px rgba(201,112,47,.12)}
        .bap-reports .report-tab.prep.active{border-color:var(--green);box-shadow:0 0 0 3px rgba(117,168,67,.12)}

        .bap-reports .controls{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:14px}
        .bap-reports .seg{display:inline-flex;background:#fff;border:1px solid var(--line);border-radius:12px;padding:4px;gap:4px}
        .bap-reports .seg button{border:none;background:transparent;border-radius:9px;padding:9px 16px;font-weight:700;color:var(--muted);display:inline-flex;align-items:center;gap:6px}
        .bap-reports .seg button.active{background:var(--blue);color:#fff}

        .bap-reports .today-banner{background:linear-gradient(90deg,#fff7f0,#fff);border:1px solid #f0d9c2;border-radius:16px;padding:16px 20px;display:flex;align-items:center;gap:16px;flex-wrap:wrap}
        .bap-reports .today-banner .tb-icon{width:44px;height:44px;border-radius:12px;background:var(--orange);color:#fff;display:grid;place-items:center;flex-shrink:0}
        .bap-reports .today-banner .tb-label{font-size:13px;color:var(--muted);font-weight:600}
        .bap-reports .today-banner .tb-value{font-size:28px;font-weight:800;color:var(--orange)}
        .bap-reports .today-banner .tb-group{display:flex;flex-direction:column;gap:2px}

        .bap-reports .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:16px}
        .bap-reports .card{background:#fff;border:1px solid var(--line);border-radius:16px;padding:18px 20px;box-shadow:var(--shadow);display:flex;flex-direction:column;gap:6px}
        .bap-reports .card .card-head{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:13px;font-weight:600}
        .bap-reports .card .card-value{font-size:26px;font-weight:800;color:var(--navy)}
        .bap-reports .card.daily .card-value{color:var(--blue)}
        .bap-reports .card.monthly .card-value{color:var(--green)}
        .bap-reports .card.meals .card-value{color:var(--orange)}
        .bap-reports .card .card-sub{font-size:13px;color:var(--muted)}

        .bap-reports .panel{background:#fff;border:1px solid var(--line);border-radius:16px;box-shadow:var(--shadow);padding:20px 22px}
        .bap-reports .panel-title{display:flex;align-items:center;justify-content:space-between;margin-bottom:16px;flex-wrap:wrap;gap:12px}
        .bap-reports .panel-title h2{font-size:17px;margin:0;display:flex;align-items:center;gap:8px}
        .bap-reports .legend-dot{display:inline-block;width:10px;height:10px;border-radius:50%}

        .bap-reports table{width:100%;border-collapse:collapse;font-size:14px}
        .bap-reports th{text-align:right;color:var(--muted);font-weight:600;padding:10px 8px;border-bottom:1px solid var(--line)}
        .bap-reports td{padding:10px 8px;border-bottom:1px solid var(--line)}
        .bap-reports tbody tr:hover{background:var(--paper)}
        .bap-reports .table-wrap{overflow-x:auto}
        .bap-reports .empty{padding:60px 20px;text-align:center;color:var(--muted);font-size:16px}

        @media (max-width:640px){
          .bap-reports .top{padding:14px 16px}
          .bap-reports .body{padding:16px}
        }
      `}</style>

      <header className="top">
        <div className="brand">
          <div className="brand-icon"><BarChart3 size={26} /></div>
          <div>
            <h1>דוחות</h1>
            <div className="sub">{schoolName || 'בית ספר'} · {currentUser?.name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <button className="logout-btn" onClick={() => navigate('/kitchen-scanner')}>
            חזרה לקופה
          </button>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            יציאה
          </button>
        </div>
      </header>

      <div className="body">
        <div className="report-tabs">
          <button className={`report-tab prep ${reportType === 'prep' ? 'active' : ''}`} onClick={() => handleSelectReportType('prep')}>
            <span className="rt-title"><ClipboardList size={17} color="var(--green)" /> היערכות להיום</span>
            <span className="rt-sub">כמה מנויים חודשיים וכמה עם יתרה עשויים להגיע - כדי להיערך מראש</span>
          </button>
          <button className={`report-tab meals ${reportType === 'meals' ? 'active' : ''}`} onClick={() => handleSelectReportType('meals')}>
            <span className="rt-title"><UtensilsCrossed size={17} color="var(--orange)" /> ארוחות שסופקו בקופה</span>
            <span className="rt-sub">כמה ילדים בפועל עברו בקופה/בקיוסק וקיבלו ארוחה - כמה באמת באו</span>
          </button>
          <button className={`report-tab ${reportType === 'payments' ? 'active' : ''}`} onClick={() => handleSelectReportType('payments')}>
            <span className="rt-title"><CreditCard size={17} color="var(--blue)" /> תשלומים שהתקבלו</span>
            <span className="rt-sub">כסף שהופקד לחשבונות - כמה אנשים שילמו ובאיזה אופן</span>
          </button>
        </div>

        {reportType !== 'prep' && (
          <div className="controls">
            <div className="seg">
              <button className={groupBy === 'day' ? 'active' : ''} onClick={() => setGroupBy('day')}>
                <CalendarDays size={16} /> לפי ימים
              </button>
              <button className={groupBy === 'month' ? 'active' : ''} onClick={() => setGroupBy('month')}>
                <CalendarDays size={16} /> לפי חודשים
              </button>
            </div>
            <div className="seg">
              <button className={metric === 'amount' ? 'active' : ''} onClick={() => setMetric('amount')}>
                <Wallet size={16} /> סכום
              </button>
              <button className={metric === 'count' ? 'active' : ''} onClick={() => setMetric('count')}>
                <Receipt size={16} /> {reportType === 'meals' ? 'מספר ארוחות' : 'מספר עסקאות'}
              </button>
              {reportType === 'meals' && (
                <button className={metric === 'students' ? 'active' : ''} onClick={() => setMetric('students')}>
                  <Users size={16} /> תלמידים ייחודיים
                </button>
              )}
            </div>
          </div>
        )}

        {reportType === 'meals' && (
          <div className="today-banner">
            <div className="tb-icon"><Sun size={22} /></div>
            <div className="tb-group">
              <span className="tb-label">ארוחות שסופקו היום (בזמן אמת)</span>
              <span className="tb-value">{summaryLoading ? '...' : prepData.todayTransactionCount}</span>
            </div>
            <div className="tb-group">
              <span className="tb-label">הכנסה מארוחות היום</span>
              <span className="tb-value">₪{summaryLoading ? '...' : prepData.todaySales.toFixed(0)}</span>
            </div>
          </div>
        )}

        {reportType === 'payments' && (
          <div className="cards">
            <div className="card">
              <div className="card-head"><TrendingUp size={15} /> סה"כ עסקאות</div>
              <div className="card-value">{paymentsTotals.count}</div>
              <div className="card-sub">₪{paymentsTotals.amount.toFixed(0)} סה"כ</div>
            </div>
            <div className="card daily">
              <div className="card-head"><span className="legend-dot" style={{ background: COLOR_DAILY }} /> תשלום לארוחה בודדת</div>
              <div className="card-value">{paymentsTotals.dailyCount}</div>
              <div className="card-sub">₪{paymentsTotals.dailyAmount.toFixed(0)}</div>
            </div>
            <div className="card monthly">
              <div className="card-head"><span className="legend-dot" style={{ background: COLOR_MONTHLY }} /> תשלום לארוחה חודשית</div>
              <div className="card-value">{paymentsTotals.monthlyCount}</div>
              <div className="card-sub">₪{paymentsTotals.monthlyAmount.toFixed(0)}</div>
            </div>
          </div>
        )}

        {reportType === 'meals' && (
          <div className="cards">
            <div className="card meals">
              <div className="card-head"><UtensilsCrossed size={15} /> סה"כ ארוחות שסופקו (בטווח שנבחר)</div>
              <div className="card-value">{mealsTotals.count}</div>
              <div className="card-sub">₪{mealsTotals.amount.toFixed(0)} הכנסה מארוחות</div>
            </div>
            <div className="card meals">
              <div className="card-head"><Users size={15} /> תלמידים שאכלו לפחות פעם אחת</div>
              <div className="card-value">{mealsTotals.uniqueStudents}</div>
              <div className="card-sub">ללא כפילויות, בטווח שנבחר</div>
            </div>
          </div>
        )}

        {reportType === 'prep' && (
          <div className="cards">
            <div className="card monthly">
              <div className="card-head"><span className="legend-dot" style={{ background: COLOR_MONTHLY }} /> מנוי חודשי - יגיעו בוודאות</div>
              <div className="card-value">{summaryLoading ? '...' : prepData.monthlyCount}</div>
              <div className="card-sub">אוכלים בלי קשר ליתרה</div>
            </div>
            <div className="card daily">
              <div className="card-head"><span className="legend-dot" style={{ background: COLOR_DAILY }} /> תשלום בודד עם יתרה - עשויים להגיע</div>
              <div className="card-value">{summaryLoading ? '...' : prepData.dailyWithBalanceCount}</div>
              <div className="card-sub">יש להם כסף בחשבון לארוחה</div>
            </div>
            <div className="card">
              <div className="card-head"><Users size={15} /> סה"כ תלמידים רשומים</div>
              <div className="card-value">{summaryLoading ? '...' : prepData.totalStudents}</div>
              <div className="card-sub">בבית הספר</div>
            </div>
          </div>
        )}

        {reportType === 'prep' ? (
          <div className="panel">
            <div className="panel-title">
              <h2><BarChart3 size={18} /> פילוח תלמידים להיום</h2>
            </div>
            {summaryLoading ? (
              <div className="empty">טוען נתונים...</div>
            ) : prepChartData.length === 0 ? (
              <div className="empty">אין תלמידים רשומים</div>
            ) : (
              <ResponsiveContainer width="100%" height={320}>
                <PieChart>
                  <Pie data={prepChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label={(d) => d.value}>
                    {prepChartData.map((entry, idx) => <Cell key={idx} fill={entry.fill} />)}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        ) : (
          <div className="panel">
            <div className="panel-title">
              <h2>
                <BarChart3 size={18} />
                {reportType === 'meals' ? 'ארוחות שסופקו' : 'עסקאות'} {groupBy === 'day' ? 'לפי יום' : 'לפי חודש'} -{' '}
                {metric === 'amount' ? 'סכום (₪)' : metric === 'students' ? 'תלמידים ייחודיים' : (reportType === 'meals' ? 'מספר ארוחות' : 'מספר עסקאות')}
              </h2>
            </div>
            {loading ? (
              <div className="empty">טוען נתונים...</div>
            ) : chartData.length === 0 ? (
              <div className="empty">אין נתונים בטווח הזה</div>
            ) : reportType === 'payments' ? (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dce6e9" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#607482' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#607482' }} />
                  <Tooltip
                    formatter={(value, name) => [
                      metric === 'amount' ? `₪${value}` : value,
                      name === 'dailyAmount' || name === 'dailyCount' ? 'תשלום בודד' : 'תשלום חודשי'
                    ]}
                  />
                  <Legend
                    formatter={(value) => (value === 'dailyAmount' || value === 'dailyCount' ? 'תשלום לארוחה בודדת' : 'תשלום לארוחה חודשית')}
                  />
                  <Bar
                    dataKey={metric === 'amount' ? 'dailyAmount' : 'dailyCount'}
                    stackId="a"
                    fill={COLOR_DAILY}
                    radius={[0, 0, 0, 0]}
                  />
                  <Bar
                    dataKey={metric === 'amount' ? 'monthlyAmount' : 'monthlyCount'}
                    stackId="a"
                    fill={COLOR_MONTHLY}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height={340}>
                <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 8 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#dce6e9" />
                  <XAxis dataKey="label" tick={{ fontSize: 12, fill: '#607482' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#607482' }} />
                  <Tooltip formatter={(value) => [metric === 'amount' ? `₪${value}` : value, 'ארוחות שסופקו']} />
                  <Bar
                    dataKey={metric === 'amount' ? 'amount' : metric === 'students' ? 'uniqueStudents' : 'count'}
                    fill={COLOR_MEALS}
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        )}

        {reportType !== 'prep' && (
          <div className="panel">
            <div className="panel-title">
              <h2>טבלת פירוט</h2>
            </div>
            <div className="table-wrap">
              {rows.length === 0 ? (
                <div className="empty">אין נתונים להצגה</div>
              ) : reportType === 'payments' ? (
                <table>
                  <thead>
                    <tr>
                      <th>תקופה</th>
                      <th>סה"כ עסקאות</th>
                      <th>סה"כ סכום</th>
                      <th>בודד (מס')</th>
                      <th>בודד (₪)</th>
                      <th>חודשי (מס')</th>
                      <th>חודשי (₪)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...rows].reverse().map(r => (
                      <tr key={r.period}>
                        <td>{formatPeriodLabel(r.period, groupBy)}</td>
                        <td>{r.count}</td>
                        <td>₪{r.amount.toFixed(0)}</td>
                        <td>{r.dailyCount}</td>
                        <td>₪{r.dailyAmount.toFixed(0)}</td>
                        <td>{r.monthlyCount}</td>
                        <td>₪{r.monthlyAmount.toFixed(0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table>
                  <thead>
                    <tr>
                      <th>תקופה</th>
                      <th>מספר ארוחות</th>
                      <th>הכנסה</th>
                      <th>תלמידים ייחודיים</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[...rows].reverse().map(r => (
                      <tr key={r.period}>
                        <td>{formatPeriodLabel(r.period, groupBy)}</td>
                        <td>{r.count}</td>
                        <td>₪{r.amount.toFixed(0)}</td>
                        <td>{r.uniqueStudents}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default KitchenReports;
