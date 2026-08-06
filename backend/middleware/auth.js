const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET;
const STAFF_ROLES = ['secretary', 'admin', 'super_admin'];

const generateToken = (payload) => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (!token) {
    return res.status(401).json({ success: false, message: 'נדרשת התחברות' });
  }

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ success: false, message: 'ההתחברות פגה, יש להתחבר מחדש' });
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

// getUserId(req) resolves the target user id, sync or async, from params/body/DB lookup
const requireSelfOrStaff = (getUserId) => async (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ success: false, message: 'נדרשת התחברות' });
  }
  if (STAFF_ROLES.includes(req.user.role) || req.user.role === 'kitchen') {
    return next();
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
