// חיבור לסליקה של Tranzila - צד שרת בלבד. מבוסס על המימוש שכבר עובד ב-Oreenso
// (tranzila.ts / tranzilaCheckout.ts / verifyTranzilaPayment.ts), בהתאמה ל-Bonapp.
// לעולם לא רושמים ללוג כותרות חתומות, טוקנים או תשובות גולמיות מהספק.
const crypto = require('crypto');

// ברירות המחדל הן שרתי Tranzila האמיתיים. הדריסה ב-env קיימת רק לבדיקות מול שרת מדומה.
const API_BASE = process.env.TRANZILA_API_BASE || 'https://api.tranzila.com';
const REPORT_BASE = process.env.TRANZILA_REPORT_BASE || 'https://report.tranzila.com';
const PAY_HOST = process.env.TRANZILA_PAY_HOST || 'https://direct.tranzila.com';
const ILS_CURRENCY_CODE = '1';
const TERMINAL_PATTERN = /^[a-z][a-z0-9]{2,15}$/;

// accessToken = HMAC-SHA256(message = appKey, key = secret + time + nonce), hex.
const buildHeaders = ({ appKey, secret }, nowMs = Date.now()) => {
  const time = String(Math.floor(nowMs / 1000));
  const nonce = crypto.randomBytes(40).toString('hex');
  const accessToken = crypto.createHmac('sha256', secret + time + nonce).update(appKey).digest('hex');
  return {
    'Content-Type': 'application/json',
    'X-tranzila-api-app-key': appKey,
    'X-tranzila-api-request-time': time,
    'X-tranzila-api-nonce': nonce,
    'X-tranzila-api-access-token': accessToken
  };
};

const signedPost = async (url, config, body, fetcher = fetch) => {
  const response = await fetcher(url, {
    method: 'POST',
    headers: buildHeaders(config),
    redirect: 'error',
    signal: AbortSignal.timeout(15000),
    body: JSON.stringify(body)
  });
  if (!response.ok) throw new Error('tranzila_unavailable');
  try { return await response.json(); } catch (e) { throw new Error('tranzila_invalid_response'); }
};

// סכום בשקלים -> אגורות שלמות. מסרב לשברי אגורות, שלילי או לא מספרי.
const toMinorUnits = (amount) => {
  const match = /^(0|[1-9]\d*)(?:\.(\d{1,2}))?$/.exec(String(amount).trim());
  if (!match) throw new Error('invalid_amount');
  const minor = Number(match[1]) * 100 + Number((match[2] || '').padEnd(2, '0'));
  if (!Number.isSafeInteger(minor) || minor < 1) throw new Error('invalid_amount');
  return minor;
};

// הדוח (Reports v1) מחזיר אגורות שלמות. בכוונה אין זיהוי אוטומטי של יחידות לפי הסכום הצפוי:
// זה היה יכול לקבל תשלום חסר.
const reportAmountMinor = (value) => {
  if (typeof value !== 'number' && typeof value !== 'string') throw new Error('invalid_report_amount');
  if (!/^(0|[1-9]\d*)$/.test(String(value))) throw new Error('invalid_report_amount');
  const minor = Number(value);
  if (!Number.isSafeInteger(minor)) throw new Error('invalid_report_amount');
  return minor;
};

// נועל את הסכום אצל Tranzila לפני שהלקוח מגיע לדף התשלום, ומעביר את מזהה ההזמנה כפרמטר
// שחוזר בדוח העסקה. מחזיר thtk.
const createHandshake = async (config, terminal, amountMinor, requestParams, fetcher = fetch) => {
  const data = await signedPost(`${API_BASE}/v2/handshake/create`, config, {
    terminal_name: terminal,
    sum: amountMinor / 100,
    request_params: requestParams
  }, fetcher);
  if (data?.error_code !== 0 || typeof data.thtk !== 'string' || !/^[a-zA-Z0-9]{16,256}$/.test(data.thtk)) {
    throw new Error('tranzila_handshake_failed');
  }
  return data.thtk;
};

// שליפת עסקה בודדת מהדוח. מכילה מידע רגיש - שימוש בשרת בלבד.
const fetchTransaction = async (config, terminal, index, fetcher = fetch) => {
  if (!Number.isSafeInteger(index) || index < 1) throw new Error('invalid_transaction_index');
  const payload = await signedPost(`${REPORT_BASE}/v1/transaction`, config, {
    terminal_name: terminal,
    transaction_index: index
  }, fetcher);
  if (!Array.isArray(payload?.transactions) || payload.transactions.length !== 1) {
    throw new Error('tranzila_transaction_not_unique');
  }
  const row = payload.transactions[0];
  if (!row || typeof row !== 'object' || String(row.index) !== String(index)) {
    throw new Error('tranzila_transaction_mismatch');
  }
  return row;
};

// בדיקת עסקה מלאה מול ההזמנה שלנו. נכשל סגור: כל שדה חסר/שונה = לא מאומת.
// הקישור להזמנה נבדק בכל אחד משדות user_defined_1..25 - נדרשת התאמה בדיוק בשדה אחד.
const verifyReportRow = (row, { terminal, amountMinor, correlation }) => {
  if (row.processor_response_code !== '000') return { ok: false, reason: 'not_approved' };
  if (row.txn_payment_method !== 'CC') return { ok: false, reason: 'payment_method' };
  if (!['DEBIT', 'FORCE'].includes(String(row.txn_type))) return { ok: false, reason: 'txn_type' };
  if (row.child_terminal !== terminal) return { ok: false, reason: 'terminal' };
  if (String(row.currency) !== ILS_CURRENCY_CODE) return { ok: false, reason: 'currency' };
  if (row.cancelfdid !== null || row.cancelfdnumber !== null) return { ok: false, reason: 'cancelled' };

  const slots = [];
  for (let n = 1; n <= 25; n += 1) {
    if (row[`user_defined_${n}`] === correlation) slots.push(n);
  }
  if (slots.length !== 1) return { ok: false, reason: 'order_binding' };

  let reported;
  try { reported = reportAmountMinor(row.amount); } catch (e) { return { ok: false, reason: 'amount_format' }; }
  if (reported !== amountMinor) return { ok: false, reason: 'amount', reported };

  return { ok: true, slot: slots[0], amountMinor: reported };
};

// הצפנת סודות בבסיס הנתונים (AES-256-GCM). המפתח: SECRETS_ENC_KEY אם מוגדר, אחרת נגזר מ-JWT_SECRET.
const encryptionKey = () => crypto.createHash('sha256')
  .update(process.env.SECRETS_ENC_KEY || `${process.env.JWT_SECRET}:gateway-credentials`)
  .digest();

const encryptSecret = (plain) => {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
  const enc = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  return `${iv.toString('hex')}:${cipher.getAuthTag().toString('hex')}:${enc.toString('hex')}`;
};

const decryptSecret = (stored) => {
  const [iv, tag, data] = String(stored).split(':');
  const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(iv, 'hex'));
  decipher.setAuthTag(Buffer.from(tag, 'hex'));
  return Buffer.concat([decipher.update(Buffer.from(data, 'hex')), decipher.final()]).toString('utf8');
};

const escapeHtml = (v) => String(v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

// דף קצר שמגיש POST אוטומטי לדף התשלום של Tranzila (כך thtk לא נחשף בכתובת/בהיסטוריה).
const launchPageHtml = (terminal, fields) => `<!doctype html><html lang="he" dir="rtl"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>מעבר לתשלום</title></head>
<body style="font-family:Arial,sans-serif;text-align:center;padding:48px;color:#17324a">
<p>מעביר לדף התשלום המאובטח...</p>
<form id="f" method="POST" action="${PAY_HOST}/${encodeURIComponent(terminal)}/iframenew.php">
${Object.entries(fields).map(([k, v]) => `<input type="hidden" name="${escapeHtml(k)}" value="${escapeHtml(v)}">`).join('\n')}
<noscript><button type="submit">המשך לתשלום</button></noscript>
</form><script>document.getElementById('f').submit();</script></body></html>`;

module.exports = {
  TERMINAL_PATTERN, ILS_CURRENCY_CODE, buildHeaders, toMinorUnits, reportAmountMinor,
  createHandshake, fetchTransaction, verifyReportRow, encryptSecret, decryptSecret, launchPageHtml
};
