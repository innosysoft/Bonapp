const jwt = require('jsonwebtoken');
const { createClient } = require('@supabase/supabase-js');

const JWT_SECRET = process.env.JWT_SECRET;
const STAFF_ROLES = ['secretary', 'admin', 'super_admin'];

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

// חסימה/מחיקה של משתמש צריכות להשפיע גם על התחברות קיימת (JWT תקף עד 7 ימים). בודקים מול ה-DB, עם
// מטמון קצר כדי לא לפגוע בביצועים. כל כשל בבדיקה (שגיאת DB וכו') = ממשיכים כרגיל, כדי שתקלה זמנית
// לא תנתק את כולם. מנהל-על נכנס עם סיסמת סביבה (מזהה לא-UUID) ולכן לא נבדק כאן.
const USER_STATUS_TTL_MS = 30 * 1000;
const userStatusCache = new Map();
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
let statusClient = null;
const getStatusClient = () => {
  if (!statusClient) {
    statusClient = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY);
  }
  return statusClient;
};

const isAccountRevoked = async (decoded) => {
  if (!decoded || decoded.role === 'super_admin' || !UUID_RE.test(String(decoded.id))) return false;
  const cached = userStatusCache.get(decoded.id);
  if (cached && Date.now() - cached.at < USER_STATUS_TTL_MS) return cached.revoked;
  try {
    const { data, error } = await getStatusClient().from('users').select('status').eq('id', decoded.id).maybeSingle();
    if (error) return false;
    const revoked = !data || data.status === 'blocked';
    userStatusCache.set(decoded.id, { revoked, at: Date.now() });
    if (userStatusCache.size > 5000) userStatusCache.clear();
    return revoked;
  } catch (e) {
    return false;
  }
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'נדרשת התחברות' });
  }

  jwt.verify(token, JWT_SECRET, async (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'ההתחברות פגה, יש להתחבר מחדש' });
    }
    if (await isAccountRevoked(decoded)) {
      return res.status(401).json({ success: false, message: 'החשבון חסום או לא קיים. יש לפנות למזכירות בית הספר.' });
    }
    req.user = decoded;
    next();
  });
};

const requireRole = (...roles) => (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'נדרשת התחברות' });
  }
  if (req.user.role === 'super_admin' || roles.includes(req.user.role)) {
    return next();
  }
  return res.status(403).json({ success: false, message: 'אין הרשאה לפעולה זו' });
};

// getSchoolId(req) resolves the target school_id, sync or async, from params/body/DB lookup
const requireSchoolAccess = (getSchoolId) => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'נדרשת התחברות' });
  }
  if (req.user.role === 'super_admin') {
    return next();
  }
  try {
    const schoolId = await getSchoolId(req);
    if (schoolId && String(schoolId) === String(req.user.school_id)) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'אין הרשאה לבית ספר זה' });
  } catch (error) {
    console.error('requireSchoolAccess error:', error);
    return res.status(500).json({ success: false, message: 'שגיאת שרת בבדיקת הרשאות' });
  }
};

// getUserId(req) resolves the target user id, sync or async, from params/body/DB lookup.
// getSchoolId(req) resolves the target resource's school_id — required so staff are confined
// to their own school instead of being waved through for any school's data.
const requireSelfOrStaff = (getUserId, getSchoolId) => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'נדרשת התחברות' });
  }
  const isStaff = STAFF_ROLES.includes(req.user.role) || req.user.role === 'kitchen';
  if (isStaff) {
    if (req.user.role === 'super_admin') {
      return next();
    }
    if (typeof getSchoolId !== 'function') {
      console.error('requireSelfOrStaff: missing getSchoolId resolver for a staff-accessible route');
      return res.status(500).json({ success: false, message: 'שגיאת הרשאות' });
    }
    try {
      const schoolId = await getSchoolId(req);
      if (schoolId && String(schoolId) === String(req.user.school_id)) {
        return next();
      }
      return res.status(403).json({ success: false, message: 'אין הרשאה לבית ספר זה' });
    } catch (error) {
      console.error('requireSelfOrStaff school check error:', error);
      return res.status(500).json({ success: false, message: 'שגיאת שרת בבדיקת הרשאות' });
    }
  }
  try {
    const userId = await getUserId(req);
    if (userId && String(userId) === String(req.user.id)) {
      return next();
    }
    return res.status(403).json({ success: false, message: 'אין הרשאה למשאב זה' });
  } catch (error) {
    console.error('requireSelfOrStaff error:', error);
    return res.status(500).json({ success: false, message: 'שגיאת שרת בבדיקת הרשאות' });
  }
};

module.exports = {
  generateToken,
  authenticateToken,
  requireRole,
  requireSchoolAccess,
  requireSelfOrStaff,
  STAFF_ROLES
};
