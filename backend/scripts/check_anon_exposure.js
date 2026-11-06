// בדיקה בקריאה בלבד: אילו טבלאות/פונקציות המפתח הציבורי (anon) של Supabase יכול לקרוא/להפעיל.
// מדפיס שמות בלבד, בלי נתונים. הרצה מתוך backend:  node scripts/check_anon_exposure.js
// אחרי backend/sql/harden_anon_access.sql הפלט אמור להיות "(none)" בשני המקומות.
require('dotenv').config();
const url = process.env.SUPABASE_URL;
const anon = process.env.SUPABASE_ANON_KEY;
const svc = process.env.SUPABASE_SERVICE_ROLE_KEY;
const h = (k) => ({ apikey: k, Authorization: 'Bearer ' + k });

(async () => {
  const spec = await (await fetch(url + '/rest/v1/', { headers: h(svc) })).json();
  const paths = Object.keys(spec.paths || {});
  const tables = paths.filter(p => p !== '/' && !p.startsWith('/rpc/')).map(p => p.slice(1));
  const rpcs = paths.filter(p => p.startsWith('/rpc/')).map(p => p.slice(5));
  const readable = [];
  const empty = [];
  for (const t of tables) {
    const s = await fetch(`${url}/rest/v1/${t}?select=*&limit=1`, { headers: h(svc) });
    const sRows = s.ok ? await s.json() : [];
    if (!sRows.length) { empty.push(t); continue; }
    const a = await fetch(`${url}/rest/v1/${t}?select=*&limit=1`, { headers: h(anon) });
    const aRows = a.ok ? await a.json() : [];
    if (aRows.length) readable.push(t);
  }
  // ניסיון הפעלה בטוח של פונקציה עם מזהה שלא קיים: אם ההרשאה סגורה מתקבל 401/403/404, אחרת ביצוע (בלי השפעה על נתונים)
  const rpcOpen = [];
  for (const f of rpcs) {
    const body = f === 'credit_student_balance' ? { p_student_id: '00000000-0000-0000-0000-000000000000', p_amount: 0 } : null;
    if (!body) continue;
    const r = await fetch(`${url}/rest/v1/rpc/${f}`, { method: 'POST', headers: { ...h(anon), 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (r.ok) rpcOpen.push(f);
  }
  console.log(`tables checked: ${tables.length} (${empty.length} empty, cannot judge)`);
  console.log('ANON CAN READ:', readable.join(', ') || '(none)');
  console.log('ANON CAN CALL balance function (probe with zero amount, fake id):', rpcOpen.join(', ') || '(none)');
})();
