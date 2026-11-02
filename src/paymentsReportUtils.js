// עוזרים משותפים לדוח פירוט התשלומים (מסך מטבח + דוחות יומי/שבועי/חודשי של המזכירה).
// התאריכים והשעות תמיד מוצגים בשעון ישראל, בלי קשר לשעון המכשיר.

const IL = 'Asia/Jerusalem';

export const METHOD_LABELS = {
  cash: 'מזומן',
  check: 'שיק',
  bit: 'ביט',
  credit_card: 'כרטיס אשראי',
  grow: 'אשראי (Grow)',
  tranzila: 'אשראי (Tranzila)',
  paybox: 'פייבוקס'
};

export const methodLabel = (m) => METHOD_LABELS[m] || (m ? m : 'לא ידוע');
export const typeLabel = (t) => (t === 'monthly' ? 'חודשי' : 'ארוחה בודדת / הפקדה');

export const formatDate = (iso) => new Date(iso).toLocaleDateString('he-IL', { timeZone: IL });
export const formatTime = (iso) => new Date(iso).toLocaleTimeString('he-IL', { timeZone: IL, hour: '2-digit', minute: '2-digit' });

// YYYY-MM-DD לפי שעון ישראל, מוזז במספר ימים
export const israelDateString = (offsetDays = 0) => {
  const d = new Date(Date.now() + offsetDays * 24 * 3600 * 1000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: IL, year: 'numeric', month: '2-digit', day: '2-digit' }).format(d);
};

export const israelMonthStartString = () => `${israelDateString().slice(0, 7)}-01`;

// טווחים מוכנים: היום / 7 ימים אחרונים (כולל היום) / החודש עד היום
export const rangeFor = (preset) => {
  const today = israelDateString();
  if (preset === 'week') return { from: israelDateString(-6), to: today };
  if (preset === 'month') return { from: israelMonthStartString(), to: today };
  return { from: today, to: today };
};

export const rangeTitle = (preset) =>
  preset === 'week' ? '7 ימים אחרונים' : preset === 'month' ? 'החודש' : 'היום';

// שורות לטבלה/אקסל: מופרדות לפי סוג תשלום (חודשי קודם, אחר כך בודד), בתוך כל קבוצה מהחדש לישן,
// עם תאריך ושעה בעמודות נפרדות. בסוף - שורות סיכום לפי סוג ולפי אמצעי תשלום.
export const buildPaymentReportRows = (report) => {
  const rows = report?.rows || [];
  const toRow = (r) => ({
    'תאריך': formatDate(r.transaction_date),
    'שעה': formatTime(r.transaction_date),
    'שם תלמיד': r.student_name,
    'כיתה': r.grade,
    'סוג תשלום': typeLabel(r.payment_type),
    'אמצעי תשלום': methodLabel(r.payment_method),
    'סכום': `₪${r.amount.toFixed(2)}`
  });
  const monthly = rows.filter(r => r.payment_type === 'monthly').map(toRow);
  const daily = rows.filter(r => r.payment_type !== 'monthly').map(toRow);
  const blank = { 'תאריך': '', 'שעה': '', 'שם תלמיד': '', 'כיתה': '', 'סוג תשלום': '', 'אמצעי תשלום': '', 'סכום': '' };
  const summaryLine = (label, text, amount) => ({ ...blank, 'שם תלמיד': label, 'סוג תשלום': text, 'סכום': `₪${amount.toFixed(2)}` });

  const t = report?.totals || { count: 0, amount: 0, monthlyCount: 0, monthlyAmount: 0, dailyCount: 0, dailyAmount: 0, byMethod: {} };
  const out = [...monthly, ...daily];
  if (out.length === 0) return [];
  out.push(blank);
  out.push(summaryLine('סיכום', `חודשי (${t.monthlyCount})`, t.monthlyAmount));
  out.push(summaryLine('סיכום', `ארוחה בודדת / הפקדה (${t.dailyCount})`, t.dailyAmount));
  Object.entries(t.byMethod || {}).forEach(([method, v]) => {
    out.push(summaryLine('לפי אמצעי תשלום', `${methodLabel(method)} (${v.count})`, v.amount));
  });
  out.push(summaryLine('סה"כ', `${t.count} תשלומים`, t.amount));
  return out;
};

// ===== בחירת טווח בדוחות המטבח =====
export const RANGE_PRESETS = [
  { key: 'today', label: 'היום' },
  { key: '7d', label: '7 ימים אחרונים' },
  { key: '30d', label: '30 ימים אחרונים' },
  { key: 'month', label: 'החודש' },
  { key: 'prevMonth', label: 'חודש שעבר' },
  { key: '12m', label: '12 חודשים' },
  { key: 'custom', label: 'טווח מותאם' }
];

const addDays = (dateStr, days) => {
  const [y, m, d] = dateStr.split('-').map(n => parseInt(n, 10));
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
};

// { from, to } בפורמט YYYY-MM-DD לפי שעון ישראל
export const reportRange = (preset, customFrom, customTo) => {
  const today = israelDateString();
  const [y, m] = today.split('-').map(n => parseInt(n, 10));
  const pad = (n) => String(n).padStart(2, '0');
  switch (preset) {
    case 'today': return { from: today, to: today };
    case '7d': return { from: addDays(today, -6), to: today };
    case 'month': return { from: `${y}-${pad(m)}-01`, to: today };
    case 'prevMonth': {
      const first = new Date(Date.UTC(y, m - 2, 1)).toISOString().slice(0, 10);
      return { from: first, to: addDays(`${y}-${pad(m)}-01`, -1) };
    }
    case '12m': return { from: new Date(Date.UTC(y, m - 1 - 11, 1)).toISOString().slice(0, 10), to: today };
    case 'custom': return { from: customFrom || today, to: customTo || today };
    case '30d':
    default: return { from: addDays(today, -29), to: today };
  }
};

const fmtDay = (dateStr) => { const [y, m, d] = dateStr.split('-'); return `${d}/${m}/${y}`; };

export const rangeLabel = (range) =>
  range.from === range.to ? fmtDay(range.from) : `${fmtDay(range.from)} – ${fmtDay(range.to)}`;

export const rangeDays = (range) =>
  Math.round((Date.parse(range.to) - Date.parse(range.from)) / 86400000) + 1;
