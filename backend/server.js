const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const QRCode = require('qrcode');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();
const {
  generateToken,
  authenticateToken,
  requireRole,
  requireSchoolAccess,
  requireSelfOrStaff
} = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

// Trust the nginx reverse proxy in front of this app so req.ip / express-rate-limit
// see the real client IP (from X-Forwarded-For) instead of nginx's own address.
app.set('trust proxy', 1);

// Middleware
const ALLOWED_ORIGINS = ['https://bonapp.dev', 'https://api.bonapp.dev'];
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no Origin header (server-to-server, curl, mobile apps, webhooks)
    if (!origin || ALLOWED_ORIGINS.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Rate limiting for authentication endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'יותר מדי ניסיונות התחברות, נסה שוב מאוחר יותר' }
});



// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 2525,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

const EMAIL_FROM = `"BonApp - מערכת ארוחות" <${process.env.EMAIL_FROM || 'bon-app@innosys.co.il'}>`;
const APP_URL = process.env.APP_URL || 'https://bonapp.dev';

// פונקציה לשליחת קישור מובייל
const sendMobileLink = async (toEmail, userName, url) => {
  const mailOptions = {
    from: EMAIL_FROM,
    to: toEmail,
    subject: '📱 קישור לאפליקציית ארוחות בית הספר',
    html: `
      <!DOCTYPE html>
      <html dir="rtl" lang="he">
      <head>
        <meta charset="UTF-8">
        <style>
          body {
            font-family: Arial, sans-serif;
            background-color: #f4f4f4;
            padding: 20px;
          }
          .container {
            background: white;
            padding: 30px;
            border-radius: 10px;
            max-width: 600px;
            margin: 0 auto;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 10px;
            text-align: center;
            margin-bottom: 20px;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white !important;
            padding: 15px 30px;
            text-decoration: none;
            border-radius: 10px;
            font-weight: bold;
            font-size: 16px;
            margin: 20px 0;
          }
          .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #eee;
            color: #666;
            font-size: 12px;
          }
          .instructions {
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🎓 מערכת ארוחות בית הספר</h1>
          </div>
          
          <h2>שלום ${userName}! 👋</h2>
          
          <p>קיבלת גישה לאפליקציית ניהול הארוחות שלנו!</p>
          
          <div style="text-align: center;">
            <a href="${url}" class="button">
              📱 פתח את האפליקציה
            </a>
          </div>
          
          <div class="instructions">
            <h3>📋 איך להשתמש?</h3>
            <ol>
              <li>לחץ על הכפתור למעלה או על הקישור למטה</li>
              <li>האפליקציה תיפתח בטלפון שלך</li>
              <li>אפשר להוסיף אותה למסך הבית לגישה מהירה</li>
            </ol>
          </div>
          
          <p>או העתק את הקישור:</p>
          <p style="background: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace;">
            ${url}
          </p>
          
          <div class="footer">
            <p>הודעה זו נשלחה אוטומטית ממערכת ניהול הארוחות.</p>
            <p>אם לא ביקשת את ההודעה הזו, אנא התעלם ממנה.</p>
          </div>
        </div>
      </body>
      </html>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Mobile link email error:', error);
    return { success: false, error: error.message };
  }
};

// Supabase client
// Prefers the service_role key (bypasses RLS) once it's configured; falls back
// to the anon key so the app keeps working before that migration runs.
// See backend/sql/enable_rls.sql for the RLS rollout this pairs with.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY
);

// Safely embed a value inside a PostgREST .or()/.filter() string (prevents filter injection).
// PostgREST treats , . ( ) as syntax; wrapping in double quotes and escaping \ and " neutralizes them.
const escapePostgrestValue = (val) => `"${String(val).replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`;

// רב מסר (Responder) - סנכרון הורים שאושרו לרשימת תפוצה. אותו חשבון Innosys שכבר
// משמש את In-Desk (ראו supabase/functions/ravmesser-sync בפרויקט In-Desk) - רק list_id שונה.
// כשל כאן לא אמור לחסום אישור הרשמה בפועל - זה רק סנכרון לרשימת דיוור, לא חלק מהזרימה הקריטית.
const RAVMESSER_BASE_URL = 'https://graph.responder.live/v2';
const RAVMESSER_LIST_ID_PARENTS = 115047; // "רשימת Bonapp מתעניינים באתר" - לא סוד, רק מזהה רשימה

async function getRavMesserToken() {
  const res = await fetch(`${RAVMESSER_BASE_URL}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      scope: '*',
      client_id: process.env.RAVMESSER_CLIENT_ID,
      client_secret: process.env.RAVMESSER_CLIENT_SECRET,
      user_token: process.env.RAVMESSER_USER_TOKEN
    })
  });
  const data = await res.json();
  // ה-API מחזיר את הטוקן תחת "token" (לא "access_token"), ולא בהכרח עם קוד 2xx
  // גם כשההתחברות הצליחה בפועל - לכן בודקים לפי נוכחות הטוקן, לא לפי res.ok.
  const token = data?.token ?? data?.access_token;
  if (!token) {
    throw new Error(`ravmesser_auth_failed (status ${res.status}): ${JSON.stringify(data)}`);
  }
  return token;
}

async function ravMesserAddSubscriber(email, name, phone, listId) {
  const token = await getRavMesserToken();
  const res = await fetch(`${RAVMESSER_BASE_URL}/subscribers`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
    body: JSON.stringify({ email, name, phone, list_ids: [listId], override: true, rejoin: true })
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(`ravmesser_subscribe_failed: ${JSON.stringify(data)}`);
  }
  return data;
}

// Resolves the parent_id of a student, from either :studentId (params) or studentId (body).
const getStudentParentId = async (req) => {
  const studentId = req.params.studentId || (req.body && req.body.studentId);
  const { data } = await supabase
    .from('students')
    .select('parent_id')
    .eq('id', studentId)
    .single();
  return data?.parent_id;
};

// Resolves the school_id a student belongs to, from either :studentId (params) or studentId (body).
const getStudentSchoolId = async (req) => {
  const studentId = req.params.studentId || (req.body && req.body.studentId);
  const { data } = await supabase
    .from('students')
    .select('school_id')
    .eq('id', studentId)
    .single();
  return data?.school_id;
};

// Resolves the school_id of a users-table row, from :userId (params).
const getUserSchoolId = async (req) => {
  const { data } = await supabase
    .from('users')
    .select('school_id')
    .eq('id', req.params.userId)
    .single();
  return data?.school_id;
};

// Resolves the school_id of a grade_groups row, from :groupId (params).
const getGroupSchoolId = async (req) => {
  const { data } = await supabase
    .from('grade_groups')
    .select('school_id')
    .eq('id', req.params.groupId)
    .single();
  return data?.school_id;
};

// Resolves the school_id of a menu_items row, from :itemId (params).
const getMenuItemSchoolId = async (req) => {
  const { data } = await supabase
    .from('menu_items')
    .select('school_id')
    .eq('id', req.params.itemId)
    .single();
  return data?.school_id;
};

// A 4-digit PIN, unique among students of the same school, for self-service kiosk identification.
const generateUniqueStudentPin = async (schoolId) => {
  for (let attempt = 0; attempt < 20; attempt++) {
    const pin = String(Math.floor(1000 + Math.random() * 9000));
    const { data: existing } = await supabase
      .from('students')
      .select('id')
      .eq('school_id', schoolId)
      .eq('pin', pin)
      .maybeSingle();
    if (!existing) return pin;
  }
  return null;
};

// ===== HEALTH & AUTH =====

app.get('/api/health', async (req, res) => {
  try {
    const { data, error } = await supabase.from('schools').select('id').limit(1);
    res.json({ 
      message: 'Server and database connected!', 
      timestamp: new Date(),
      database: error ? 'error' : 'connected'
    });
  } catch (err) {
    res.json({ message: 'Server running, database error', error: err.message });
  }
});



app.post('/api/admin/auth', authLimiter, async (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin123';

  if (password === adminPassword) {
    const token = generateToken({ id: 'super_admin', role: 'super_admin', school_id: null });
    res.json({ success: true, message: 'Admin authenticated', token });
  } else {
    res.status(401).json({ success: false, message: 'Wrong password' });
  }
});

app.post('/api/login', authLimiter, async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'חסרים שם משתמש או סיסמה' });
    }

    const escapedUsername = escapePostgrestValue(username);

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.ilike.${escapedUsername},phone.eq.${escapedUsername}`)
      .maybeSingle();

    if (error || !user) {
      return res.status(401).json({ success: false, message: 'שם משתמש או סיסמה שגויים' });
    }


    const validPassword = await bcrypt.compare(password, user.password_hash);

    if (!validPassword) {
      return res.status(401).json({ success: false, message: 'שם משתמש או סיסמה שגויים' });
    }

    if (user.status === 'blocked') {
      return res.status(401).json({ success: false, message: 'החשבון חסום. יש לפנות למזכירות בית הספר.' });
    }

    const token = generateToken({ id: user.id, role: user.role, school_id: user.school_id });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        name: `${user.first_name} ${user.last_name}`,
        type: user.role,
        email: user.email,
        phone: user.phone,
        school_id: user.school_id
      }
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בהתחברות' });
  }
});

// שולח מייל עם קישור לאיפוס סיסמה, אם קיים משתמש עם האימייל שסופק.
// תמיד מחזיר תשובת הצלחה גנרית (בלי לחשוף אם האימייל קיים במערכת או לא).
app.post('/api/forgot-password', authLimiter, async (req, res) => {
  const genericResponse = {
    success: true,
    message: 'אם קיים חשבון עם כתובת האימייל שסופקה, נשלח אליו מייל עם קישור לאיפוס סיסמה'
  };
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ success: false, message: 'חסרה כתובת אימייל' });
    }

    const { data: user } = await supabase
      .from('users')
      .select('id, email, first_name, last_name')
      .ilike('email', email)
      .maybeSingle();

    if (!user) {
      return res.json(genericResponse);
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 60 * 60 * 1000); // שעה אחת

    const { error: updateError } = await supabase
      .from('users')
      .update({ reset_token: resetToken, reset_token_expires: resetTokenExpires.toISOString() })
      .eq('id', user.id);

    if (updateError) throw updateError;

    const resetLink = `${APP_URL}/reset-password?token=${resetToken}`;
    try {
      await transporter.sendMail({
        from: EMAIL_FROM,
        to: user.email,
        subject: 'איפוס סיסמה - מערכת ארוחות בית הספר',
        html: `
          <div dir="rtl" style="font-family: Arial; text-align: right;">
            <h2>שלום ${user.first_name || ''} ${user.last_name || ''},</h2>
            <p>התקבלה בקשה לאיפוס הסיסמה שלך במערכת ארוחות בית הספר.</p>
            <p><a href="${resetLink}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">קבע/י סיסמה חדשה</a></p>
            <p style="color: #666; font-size: 0.9rem;">הקישור תקף לשעה אחת. אם לא ביקשת איפוס סיסמה, אפשר להתעלם מהודעה זו.</p>
            <p>בברכה,<br>צוות בית הספר</p>
          </div>
        `
      });
    } catch (mailError) {
      console.error('Forgot-password email sending error:', mailError);
    }

    res.json(genericResponse);
  } catch (error) {
    console.error('Forgot password error:', error);
    // גם בשגיאת שרת לא חושפים אם האימייל קיים - מחזירים את אותה תשובה גנרית.
    res.json(genericResponse);
  }
});

// קובע סיסמה חדשה לפי טוקן איפוס תקין ולא פג-תוקף.
app.post('/api/reset-password', authLimiter, async (req, res) => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res.status(400).json({ success: false, message: 'חסרים נתונים' });
    }
    if (password.length < 6) {
      return res.status(400).json({ success: false, message: 'הסיסמה חייבת להכיל לפחות 6 תווים' });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('id, reset_token_expires')
      .eq('reset_token', token)
      .maybeSingle();

    if (error || !user || !user.reset_token_expires || new Date(user.reset_token_expires) < new Date()) {
      return res.status(400).json({ success: false, message: 'קישור לא תקין או שפג תוקפו, יש לבקש קישור חדש' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword, reset_token: null, reset_token_expires: null })
      .eq('id', user.id);

    if (updateError) throw updateError;

    res.json({ success: true, message: 'הסיסמה עודכנה בהצלחה' });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'שגיאה באיפוס הסיסמה' });
  }
});

// ===== SCHOOLS =====

app.get('/api/schools', async (req, res) => {
  try {
    const { data: schools, error } = await supabase
      .from('schools')
      .select('id, name, menu_type, enable_monthly_package, enable_daily_payment, daily_meal_price, monthly_meal_price, charge_absent_students, enable_free_payment, enable_paybox, enable_bit, enable_cash')
      .order('name');

    if (error) throw error;

    res.json({ success: true, schools });
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בטעינת בתי ספר' });
  }
});

app.get('/api/schools/:schoolId', authenticateToken, requireSchoolAccess(req => req.params.schoolId), async (req, res) => {
  try {
    const { schoolId } = req.params;
    
    const { data: school, error } = await supabase
      .from('schools')
      .select('*')
      .eq('id', schoolId)
      .single();

    if (error) throw error;

    res.json({ success: true, school });
  } catch (error) {
    console.error('Get school error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בטעינת בית ספר' 
    });
  }
});

app.get('/api/admin/schools', authenticateToken, requireRole('super_admin'), async (req, res) => {
  try {
    const { data: schools, error } = await supabase
      .from('schools')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(schools || []);
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בטעינת בתי ספר' });
  }
});

app.post('/api/admin/schools', authenticateToken, requireRole('super_admin'), async (req, res) => {
  try {
    const { name, address, contact_person, contact_phone, contact_email } = req.body;

    const { data, error } = await supabase
      .from('schools')
      .insert([
        {
          name,
          address, 
          contact_person,
          contact_phone,
          contact_email,
          status: 'active'
        }
      ])
      .select()
      .single();

    if (error) throw error;

    res.json({ 
      success: true, 
      message: 'School created successfully',
      school: data 
    });

  } catch (error) {
    console.error('Create school error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/schools/:schoolId/menu-type', authenticateToken, requireRole('secretary', 'admin', 'kitchen'), requireSchoolAccess(req => req.params.schoolId), async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { menu_type } = req.body;

    if (!['items', 'daily'].includes(menu_type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'סוג תפריט לא תקין' 
      });
    }

    const { data: school, error } = await supabase
      .from('schools')
      .update({ menu_type })
      .eq('id', schoolId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, school });
  } catch (error) {
    console.error('Update menu type error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בעדכון סוג תפריט' 
    });
  }
});

app.put('/api/schools/:schoolId/settings', authenticateToken, requireRole('secretary', 'admin'), requireSchoolAccess(req => req.params.schoolId), async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { 
      name,
      address,
      contact_person,
      contact_phone,
      contact_email,
      school_phone,
      email_user,
      email_pass,
      menu_type,
      allow_negative_balance, 
      max_negative_balance,
      kitchen_open_time,
      kitchen_close_time
    } = req.body;

    const updateData = {};
    if (name !== undefined) updateData.name = name;
    if (address !== undefined) updateData.address = address;
    if (contact_person !== undefined) updateData.contact_person = contact_person;
    if (contact_phone !== undefined) updateData.contact_phone = contact_phone;
    if (contact_email !== undefined) updateData.contact_email = contact_email;
    if (school_phone !== undefined) updateData.school_phone = school_phone;
    if (email_user !== undefined) updateData.email_user = email_user;
    if (email_pass !== undefined) updateData.email_pass = email_pass;
    if (menu_type !== undefined) updateData.menu_type = menu_type;
    if (allow_negative_balance !== undefined) updateData.allow_negative_balance = allow_negative_balance;
    if (max_negative_balance !== undefined) updateData.max_negative_balance = max_negative_balance;
    if (kitchen_open_time !== undefined) updateData.kitchen_open_time = kitchen_open_time;
    if (kitchen_close_time !== undefined) updateData.kitchen_close_time = kitchen_close_time;
    // הגדרות תשלום - הוסף כאן:
const { 
  paybox_merchant_id,
  paybox_secret_key,
  bit_payment_link,
  cardcom_terminal,
  cardcom_username,
  enable_paybox,
  enable_bit,
  enable_cardcom,
  enable_cash,
  enable_monthly_package,
  enable_daily_payment,
  daily_meal_price,
  charge_absent_students,
  enable_free_payment
} = req.body;

if (paybox_merchant_id !== undefined) updateData.paybox_merchant_id = paybox_merchant_id;
if (paybox_secret_key !== undefined) updateData.paybox_secret_key = paybox_secret_key;
if (bit_payment_link !== undefined) updateData.bit_payment_link = bit_payment_link;
if (cardcom_terminal !== undefined) updateData.cardcom_terminal = cardcom_terminal;
if (cardcom_username !== undefined) updateData.cardcom_username = cardcom_username;
if (enable_paybox !== undefined) updateData.enable_paybox = enable_paybox;
if (enable_bit !== undefined) updateData.enable_bit = enable_bit;
if (enable_cardcom !== undefined) updateData.enable_cardcom = enable_cardcom;
if (enable_cash !== undefined) updateData.enable_cash = enable_cash;
if (enable_monthly_package !== undefined) updateData.enable_monthly_package = enable_monthly_package;
if (enable_daily_payment !== undefined) updateData.enable_daily_payment = enable_daily_payment;
if (daily_meal_price !== undefined) updateData.daily_meal_price = daily_meal_price;
if (charge_absent_students !== undefined) updateData.charge_absent_students = charge_absent_students;
if (enable_free_payment !== undefined) updateData.enable_free_payment = enable_free_payment;
if (req.body.payment_gateway !== undefined) updateData.payment_gateway = req.body.payment_gateway;
if (req.body.gateway_webhook_url !== undefined) updateData.gateway_webhook_url = req.body.gateway_webhook_url;


    const { data: school, error } = await supabase
      .from('schools')
      .update(updateData)
      .eq('id', schoolId)
      .select()
      .single();


    if (error) throw error;


    res.json({ success: true, school });
  } catch (error) {
    console.error('Update school settings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בעדכון הגדרות' 
    });
  }
});

app.get('/api/school-students/:schoolId', authenticateToken, requireRole('kitchen', 'secretary', 'admin'), requireSchoolAccess(req => req.params.schoolId), async (req, res) => {
  try {
    const { schoolId } = req.params;

    const { data: students, error } = await supabase
      .from('students')
      .select(`
        *,
        users (first_name, last_name, phone, email, status)
      `)
      .eq('school_id', schoolId)
      .order('first_name');

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      students: students || []
    });

  } catch (error) {
    console.error('School students error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בטעינת תלמידים' });
  }
});

// ===== USERS =====

app.get('/api/schools/:schoolId/users', authenticateToken, requireRole('secretary', 'admin'), requireSchoolAccess(req => req.params.schoolId), async (req, res) => {
  try {
    const { schoolId } = req.params;

    const { data: users, error } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role, phone, created_at')
      .eq('school_id', schoolId)
      .neq('role', 'parent')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json({ success: true, users });
  } catch (error) {
    console.error('Get school users error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בטעינת משתמשים' });
  }
});

const STAFF_ASSIGNABLE_ROLES = ['secretary', 'admin', 'kitchen'];

app.post('/api/schools/:schoolId/users', authenticateToken, requireRole('secretary', 'admin'), requireSchoolAccess(req => req.params.schoolId), async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { email, password, firstName, lastName, role, phone } = req.body;

    if (req.user.role !== 'super_admin' && !STAFF_ASSIGNABLE_ROLES.includes(role)) {
      return res.status(403).json({ success: false, message: 'אין הרשאה להעניק תפקיד זה' });
    }

    const { data: existing } = await supabase
      .from('users')
      .select('id')
      .eq('email', email)
      .maybeSingle();

    if (existing) {
      return res.status(400).json({ success: false, message: 'משתמש עם אימייל זה כבר קיים' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: newUser, error } = await supabase
      .from('users')
      .insert({
        email,
        password_hash: hashedPassword,
        first_name: firstName,
        last_name: lastName,
        role,
        phone,
        school_id: schoolId
      })
      .select('id, email, first_name, last_name, role, phone')
      .single();

    if (error) throw error;

    res.json({ success: true, user: newUser });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ success: false, message: 'שגיאה ביצירת משתמש' });
  }
});

app.put('/api/users/:userId', authenticateToken, requireRole('secretary', 'admin'), requireSchoolAccess(getUserSchoolId), async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, phone, role, password } = req.body;

    if (role !== undefined && req.user.role !== 'super_admin' && !STAFF_ASSIGNABLE_ROLES.includes(role)) {
      return res.status(403).json({ success: false, message: 'אין הרשאה להעניק תפקיד זה' });
    }

    const updateData = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone,
      role
    };

    if (password) {
      updateData.password_hash = await bcrypt.hash(password, 10);
    }

    const { data: user, error } = await supabase
      .from('users')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, user });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בעדכון משתמש'
    });
  }
});

// מזכירה/מנהל מייצרים סיסמה חדשה אקראית עבור משתמש (הורה או איש צוות) ושולחים אותה במייל.
// אין דרך לשחזר סיסמה קיימת (נשמרת רק כ-hash) - זו תמיד יצירת סיסמה חדשה, לא שחזור.
app.post('/api/users/:userId/reset-password', authenticateToken, requireRole('secretary', 'admin'), requireSchoolAccess(getUserSchoolId), async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: user, error: userError } = await supabase
      .from('users')
      .select('id, email, first_name, last_name, role')
      .eq('id', userId)
      .single();

    if (userError || !user) {
      return res.status(404).json({ success: false, message: 'משתמש לא נמצא' });
    }

    const newPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from('users')
      .update({ password_hash: hashedPassword })
      .eq('id', userId);

    if (updateError) throw updateError;

    let emailSent = false;
    if (user.email) {
      try {
        await transporter.sendMail({
          from: EMAIL_FROM,
          to: user.email,
          subject: 'סיסמה חדשה למערכת ארוחות בית הספר',
          html: `
            <div dir="rtl" style="font-family: Arial; text-align: right;">
              <h2>שלום ${user.first_name || ''} ${user.last_name || ''},</h2>
              <p>סיסמה חדשה הונפקה עבור חשבונך במערכת ארוחות בית הספר.</p>
              <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <h3>פרטי הגישה שלך:</h3>
                <p><strong>אימייל:</strong> ${user.email}</p>
                <p><strong>סיסמה חדשה:</strong> ${newPassword}</p>
              </div>
              <p><a href="${APP_URL}/login" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">היכנסו למערכת</a></p>
              <p style="color: #666; font-size: 0.9rem;">אם לא ביקשת איפוס סיסמה, פנה/י למזכירות בית הספר.</p>
              <p>בברכה,<br>צוות בית הספר</p>
            </div>
          `
        });
        emailSent = true;
      } catch (mailError) {
        console.error('Reset-password email sending error:', mailError);
      }
    }

    res.json({ success: true, newPassword, emailSent });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ success: false, message: 'שגיאה באיפוס סיסמה' });
  }
});

app.delete('/api/users/:userId', authenticateToken, requireRole('secretary', 'admin'), async (req, res) => {
  try {
    const { userId } = req.params;

    const { error } = await supabase
      .from('users')
      .delete()
      .eq('id', userId);

    if (error) throw error;

    res.json({ success: true, message: 'משתמש נמחק בהצלחה' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, message: 'שגיאה במחיקת משתמש' });
  }
});

// ===== STUDENTS =====

app.post('/api/students', authenticateToken, requireRole('secretary', 'admin'), requireSchoolAccess(req => req.body.school_id), async (req, res) => {
  try {
    const { parent_id, school_id, first_name, last_name, grade, student_phone, student_id_number, system_access, can_edit_profile, spending_limit, parent_notifications, can_order_for_friends, max_daily_meals, group_id } = req.body;

    if (!parent_id || !school_id || !first_name || !grade) {
      return res.status(400).json({
        success: false,
        message: 'חסרים נתונים חובה'
      });
    }

    let resolvedGrade = grade;
    if (group_id) {
      const { data: group } = await supabase.from('grade_groups').select('name').eq('id', group_id).single();
      if (group) resolvedGrade = group.name;
    }

    const { data: student, error } = await supabase
      .from('students')
      .insert({
        parent_id,
        school_id,
        first_name,
        last_name: last_name || '',
        grade: resolvedGrade,
        student_phone: student_phone || '',
        student_id_number: student_id_number || null,
        system_access: system_access || false,
        can_edit_profile: can_edit_profile || false,
        spending_limit: spending_limit || 50,
        parent_notifications: parent_notifications !== undefined ? parent_notifications : true,
        can_order_for_friends: can_order_for_friends || false,
        max_daily_meals: max_daily_meals || 2,
        group_id: group_id || null,
        balance: 0.0,
        status: 'active'
      })
      .select()
      .single();

    if (error) throw error;

    // יצירת QR Code אוטומטית!
    const qrCode = `STU_${student.id.substring(0, 8)}_${Date.now().toString().slice(-6)}`;

    await supabase
      .from('student_qr_codes')
      .insert({
        student_id: student.id,
        qr_code: qrCode,
        status: 'active'
      });

    // PIN לזיהוי עצמי בקיוסק
    const studentPin = await generateUniqueStudentPin(student.school_id);
    if (studentPin) {
      await supabase.from('students').update({ pin: studentPin }).eq('id', student.id);
    }

    res.json({
      success: true,
      student: student,
      message: 'התלמיד נוסף בהצלחה'
    });

  } catch (error) {
    console.error('Add student error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בהוספת תלמיד' 
    });
  }
});

app.put('/api/students/:studentId', authenticateToken, requireSelfOrStaff(getStudentParentId, getStudentSchoolId), async (req, res) => {
  try {
    const { studentId } = req.params;
    const {
      first_name,
      last_name, 
      grade, 
      student_phone,
      student_id_number,
      system_access,
      can_edit_profile,
      spending_limit,
      parent_notifications,
      can_order_for_friends,
      max_daily_meals,
      group_id
    } = req.body;

    const updateData = {};
    if (first_name !== undefined) updateData.first_name = first_name;
    if (last_name !== undefined) updateData.last_name = last_name;
    if (grade !== undefined) updateData.grade = grade;
    if (student_phone !== undefined) updateData.student_phone = student_phone;
    if (student_id_number !== undefined) updateData.student_id_number = student_id_number;
    if (system_access !== undefined) updateData.system_access = system_access;
    if (can_edit_profile !== undefined) updateData.can_edit_profile = can_edit_profile;
    if (spending_limit !== undefined) updateData.spending_limit = spending_limit;
    if (parent_notifications !== undefined) updateData.parent_notifications = parent_notifications;
    if (can_order_for_friends !== undefined) updateData.can_order_for_friends = can_order_for_friends;
    if (max_daily_meals !== undefined) updateData.max_daily_meals = max_daily_meals;
    if (group_id !== undefined) updateData.group_id = group_id;
    
// עדכן grade לפי שם הקבוצה
    if (group_id) {
      const { data: group } = await supabase
        .from('grade_groups')
        .select('name')
        .eq('id', group_id)
        .single();
      if (group) updateData.grade = group.name;
    }

    const { data: student, error } = await supabase
      .from('students')
      .update(updateData)
      .eq('id', studentId)
      .select()
      .single();

    if (error) throw error;

    res.json({
      success: true,
      student: student,
      message: 'פרטי התלמיד עודכנו בהצלחה'
    });

  } catch (error) {
    console.error('Update student error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בעדכון פרטי תלמיד' 
    });
  }
});

app.delete('/api/students/:studentId', authenticateToken, requireSelfOrStaff(getStudentParentId, getStudentSchoolId), async (req, res) => {
  try {
    const { studentId } = req.params;

    const { data: transactions } = await supabase
      .from('transactions')
      .select('id')
      .eq('student_id', studentId)
      .limit(1);

    if (transactions && transactions.length > 0) {
      const { error } = await supabase
        .from('students')
        .update({ status: 'inactive' })
        .eq('id', studentId);

      if (error) throw error;

      res.json({
        success: true,
        message: 'התלמיד הועבר לסטטוס לא פעיל (יש היסטוריית עסקאות)'
      });
    } else {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', studentId);

      if (error) throw error;

      res.json({
        success: true,
        message: 'התלמיד נמחק בהצלחה'
      });
    }

  } catch (error) {
    console.error('Delete student error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה במחיקת תלמיד' 
    });
  }
});

app.post('/api/students/search', authenticateToken, requireRole('kitchen', 'secretary', 'admin'), requireSchoolAccess(req => req.body.school_id), async (req, res) => {
  try {
    const { school_id, search_term } = req.body;

    if (!search_term || search_term.length < 2) {
      return res.json({ success: true, students: [] });
    }

    const escapedTerm = escapePostgrestValue(`%${search_term}%`);

    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', school_id)
      .or(`first_name.ilike.${escapedTerm},last_name.ilike.${escapedTerm},id_number.ilike.${escapedTerm},student_phone.ilike.${escapedTerm}`)
      .limit(10);

    if (error) throw error;

    res.json({
      success: true,
      students: students || []
    });

  } catch (error) {
    console.error('Search students error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בחיפוש תלמידים' });
  }
});

app.post('/api/students/:studentId/photo', authenticateToken, requireSelfOrStaff(getStudentParentId, getStudentSchoolId), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { photoData } = req.body;
    
    const base64Data = photoData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');
    
    const fileName = `${studentId}_${Date.now()}.jpg`;
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('student-photos')
      .upload(fileName, buffer, {
        contentType: 'image/jpeg',
        upsert: true
      });
    
    if (uploadError) throw uploadError;
    
    const { data: urlData } = supabase.storage
      .from('student-photos')
      .getPublicUrl(fileName);
    
    const { error: updateError } = await supabase
      .from('students')
      .update({ photo_url: urlData.publicUrl })
      .eq('id', studentId);
    
    if (updateError) throw updateError;
    
    res.json({ success: true, photoUrl: urlData.publicUrl });
    
  } catch (error) {
    console.error('Upload photo error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בהעלאת תמונה' });
  }
});

// ===== QR CODES =====

// A student's QR code is a standing credential for charging their account, so it can't be
// handed out with no proof of identity. Two legitimate callers have no JWT session: the
// mobile parent/student apps (accessed via a long-lived link token, not a login). So this
// accepts EITHER a JWT (staff of the student's school, the student's own parent, or
// super_admin) OR a valid parent/student mobile token that resolves to this student.
const authorizeStudentQrAccess = async (req, res, next) => {
  const { studentId } = req.params;
  const authHeader = req.headers['authorization'];
  const bearer = authHeader && authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (bearer) {
    try {
      const decoded = jwt.verify(bearer, process.env.JWT_SECRET);
      if (decoded.role === 'super_admin') {
        req.user = decoded;
        return next();
      }
      const { data: student } = await supabase
        .from('students')
        .select('school_id, parent_id')
        .eq('id', studentId)
        .single();
      if (student) {
        const isStaffOfSchool = ['secretary', 'admin', 'kitchen'].includes(decoded.role) &&
          String(student.school_id) === String(decoded.school_id);
        const isOwnParent = decoded.role === 'parent' && String(student.parent_id) === String(decoded.id);
        if (isStaffOfSchool || isOwnParent) {
          req.user = decoded;
          return next();
        }
      }
    } catch (err) {
      // invalid/expired JWT — fall through to mobile-token check
    }
  }

  const mobileToken = req.query.mobileToken || (req.body && req.body.mobileToken);
  if (mobileToken) {
    const { data: studentToken } = await supabase
      .from('student_mobile_tokens')
      .select('student_id')
      .eq('token', mobileToken)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();
    if (studentToken && String(studentToken.student_id) === String(studentId)) {
      return next();
    }

    const { data: parentToken } = await supabase
      .from('parent_mobile_tokens')
      .select('parent_id')
      .eq('token', mobileToken)
      .gte('expires_at', new Date().toISOString())
      .maybeSingle();
    if (parentToken) {
      const { data: student } = await supabase
        .from('students')
        .select('parent_id')
        .eq('id', studentId)
        .single();
      if (student && String(student.parent_id) === String(parentToken.parent_id)) {
        return next();
      }
    }
  }

  return res.status(401).json({ success: false, message: 'נדרשת הרשאה לצפייה ב-QR' });
};

app.post('/api/students/:studentId/create-qr', authorizeStudentQrAccess, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    
    const { data: existing, error: checkError } = await supabase
      .from('student_qr_codes')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();
    
    if (existing) {
      return res.json({ success: true, qrCode: existing.qr_code });
    }
    
    const qrCode = `STU_${studentId.substring(0, 8)}_${Date.now().toString().slice(-6)}`;
    
    const { data: newQR, error } = await supabase
      .from('student_qr_codes')
      .insert({
        student_id: studentId,
        qr_code: qrCode,
        status: 'active'
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({ success: true, qrCode: newQR.qr_code });
  } catch (error) {
    console.error('Create QR error:', error);
    res.status(500).json({ success: false, message: 'שגיאה ביצירת QR' });
  }
});

app.post('/api/students/:studentId/generate-qr', authorizeStudentQrAccess, async (req, res) => {
  try {
    const { studentId } = req.params;

    const { data: qrRecord, error: qrError } = await supabase
      .from('student_qr_codes')
      .select('*')
      .eq('student_id', studentId)
      .single();
    
    if (qrError || !qrRecord) {
      return res.status(404).json({ 
        success: false, 
        message: 'לא נמצא QR code לתלמיד' 
      });
    }
    
    const qrImageData = await QRCode.toDataURL(qrRecord.qr_code, {
      width: 300,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#FFFFFF'
      }
    });
    
    res.json({ 
      success: true, 
      qrCode: qrRecord.qr_code,
      qrImage: qrImageData 
    });
    
  } catch (error) {
    console.error('Generate QR error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה ביצירת QR' 
    });
  }
});

app.post('/api/students/:studentId/send-qr-email', authenticateToken, requireSelfOrStaff(getStudentParentId, getStudentSchoolId), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { parentEmail, parentName, studentName, schoolName } = req.body;
    
    
    const { data: qrRecord, error: qrError } = await supabase
      .from('student_qr_codes')
      .select('*')
      .eq('student_id', studentId)
      .single();
    
    if (qrError || !qrRecord) {
      return res.status(404).json({ 
        success: false, 
        message: 'לא נמצא QR code' 
      });
    }
    
    const qrImageData = await QRCode.toDataURL(qrRecord.qr_code, {
      width: 400,
      margin: 2
    });
    
    
    
    await transporter.sendMail({
  from: EMAIL_FROM,
  to: parentEmail,
  subject: `QR Code - ${studentName} - ${schoolName}`,
  html: `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;" dir="rtl">
      <h1 style="color: #2c3e50; text-align: center;">QR Code - ${studentName}</h1>
      <p style="font-size: 16px; color: #555;">שלום ${parentName},</p>
      <p style="font-size: 16px; color: #555;">
        מצורף ה-QR Code של ${studentName} לשימוש במזנון בית הספר ${schoolName}.
      </p>
      
      <div style="text-align: center; margin: 30px 0;">
        <img src="cid:qrcode" alt="QR Code" style="max-width: 400px; border: 2px solid #ddd; padding: 20px;" />
      </div>
      
      <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 0; color: #666;">קוד תלמיד:</p>
        <p style="font-size: 20px; font-weight: bold; font-family: monospace; margin: 10px 0;">${qrRecord.qr_code}</p>
      </div>
      
      <p style="font-size: 14px; color: #777; text-align: center;">
        סרוק את הקוד במזנון בית הספר לביצוע רכישות
      </p>
    </div>
  `,
  attachments: [
    {
      filename: `QR-${studentName}.png`,
      content: qrImageData.split('base64,')[1],
      encoding: 'base64',
      cid: 'qrcode'
    }
  ]
});
    
    res.json({ success: true, message: 'המייל נשלח בהצלחה' });

  } catch (error) {
    console.error('Send email error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בשליחת מייל: ' + error.message
    });
  }
});

// מייצר קוד PIN חדש לתלמיד (זיהוי בקיוסק העצמאי) - מחליף את הקיים, אם היה כזה.
app.post('/api/students/:studentId/regenerate-pin', authenticateToken, requireRole('secretary', 'admin'), requireSchoolAccess(getStudentSchoolId), async (req, res) => {
  try {
    const { studentId } = req.params;

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, school_id')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ success: false, message: 'תלמיד לא נמצא' });
    }

    const pin = await generateUniqueStudentPin(student.school_id);
    if (!pin) {
      return res.status(500).json({ success: false, message: 'לא ניתן היה ליצור קוד PIN פנוי, נסה שוב' });
    }

    const { error: updateError } = await supabase
      .from('students')
      .update({ pin })
      .eq('id', studentId);

    if (updateError) throw updateError;

    res.json({ success: true, pin });
  } catch (error) {
    console.error('Regenerate PIN error:', error);
    res.status(500).json({ success: false, message: 'שגיאה ביצירת קוד PIN' });
  }
});

app.post('/api/scan-student', authenticateToken, requireRole('kitchen', 'secretary', 'admin'), async (req, res) => {
  try {
    const { qrCode } = req.body;

    const { data: qrRecord, error: qrError } = await supabase
      .from('student_qr_codes')
      .select('student_id')
      .eq('qr_code', qrCode)
      .eq('status', 'active')
      .single();

    if (qrError || !qrRecord) {
      return res.status(404).json({ success: false, message: 'QR לא תקין או לא פעיל' });
    }

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*, users(*)')
      .eq('id', qrRecord.student_id)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ success: false, message: 'תלמיד לא נמצא' });
    }

    if (req.user.role !== 'super_admin' && String(student.school_id) !== String(req.user.school_id)) {
      return res.status(403).json({ success: false, message: 'תלמיד זה אינו שייך לבית הספר שלך' });
    }

    res.json({
      success: true,
      student: student
    });

  } catch (error) {
    console.error('Student scan error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בזיהוי תלמיד' });
  }
});

app.post('/api/generate-qr/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;

    const { data: existingQR, error: checkError } = await supabase
      .from('student_qr_codes')
      .select('qr_code')
      .eq('student_id', studentId)
      .eq('status', 'active')
      .single();

    if (!checkError && existingQR) {
      return res.json({
        success: true,
        qrCode: existingQR.qr_code,
        message: 'QR כבר קיים'
      });
    }

    const qrCode = `STU_${studentId.slice(0, 8)}_${Date.now().toString().slice(-6)}`;

    const { error: insertError } = await supabase
      .from('student_qr_codes')
      .insert({
        student_id: studentId,
        qr_code: qrCode,
        status: 'active'
      });

    if (insertError) throw insertError;

    res.json({
      success: true,
      qrCode: qrCode,
      message: 'QR נוצר בהצלחה'
    });

  } catch (error) {
    console.error('QR generation error:', error);
    res.status(500).json({ success: false, message: 'שגיאה ביצירת QR' });
  }
});

// ===== PARENT =====

app.post('/api/register', async (req, res) => {
  
  try {
    const { 
      familyName, 
      parentFirstName, 
      phone, 
      email, 
      password,
      schoolId, 
      children,
      emergencyContact,
      emergencyPhone,
      address,
      notificationSettings,
      comments 
    } = req.body;

    const familyCode = `F${Date.now().toString().slice(-6)}${Math.random().toString(36).substr(2, 3).toUpperCase()}`;

    const hashedPassword = await bcrypt.hash(password, 10);

    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          school_id: schoolId,
          email: email,
          phone: phone,
          password_hash: hashedPassword,
          first_name: parentFirstName,
          last_name: familyName,
          role: 'parent',
          status: 'pending'
        }
      ])
      .select()
      .single();

    if (userError) {
      throw userError;
    }

    const { data: regData, error: regError } = await supabase
      .from('pending_registrations')
      .insert([
        {
          school_id: schoolId,
          parent_name: `${parentFirstName || ''} ${familyName}`.trim(),
          parent_phone: phone,
          parent_email: email,
          address: address,
          emergency_contact: emergencyContact,
          emergency_phone: emergencyPhone,
          children_data: children,
          notification_settings: notificationSettings,
          comments: comments,
          family_code: familyCode,
          status: 'pending'
        }
      ])
      .select();

    if (regError) {
      throw regError;
    }

    res.json({
      success: true,
      message: 'Registration completed successfully',
      familyCode: familyCode,
      userId: userData.id
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/parent/:userId', authenticateToken, requireSelfOrStaff(req => req.params.userId, getUserSchoolId), async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: parent, error: parentError } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .eq('role', 'parent')
      .single();

    if (parentError || !parent) {
      return res.status(404).json({ success: false, message: 'הורה לא נמצא' });
    }

    const { data: children, error: childrenError } = await supabase
      .from('students')
      .select('*')
      .eq('parent_id', parent.id);


    if (childrenError) {
      console.error('Error fetching children:', childrenError);
    }

    // טען קבוצות לבית הספר
    const { data: groups } = await supabase
      .from('grade_groups')
      .select('id, name')
      .eq('school_id', parent.school_id);


    const now = new Date();
    const enrichedChildren = await Promise.all((children || []).map(async child => {
      const { data: lastPayment } = await supabase
        .from('transactions')
        .select('payment_type')
        .eq('student_id', child.id)
        .eq('type', 'payment')
        .not('transaction_date', 'is', null)
        .order('transaction_date', { ascending: false })
        .limit(1)
        .maybeSingle();

      const paymentType = lastPayment?.payment_type || null;
      let monthlyPaid = null;

      if (paymentType === 'monthly') {
        const { data: paidMonth } = await supabase
          .from('monthly_payments')
          .select('id')
          .eq('student_id', child.id)
          .eq('year', now.getFullYear())
          .eq('month', now.getMonth() + 1)
          .maybeSingle();
        monthlyPaid = !!paidMonth;
      }

      return {
        ...child,
        canBuyToday: child.status === 'active',
        lastMeal: child.last_meal_date || 'אין מידע',
        photo: null,
        group_name: groups?.find(g => g.id === child.group_id)?.name || child.grade || '',
        payment_type: paymentType,
        monthlyPaid
      };
    }));

    res.json({
      success: true,
      parent: {
        id: parent.id,
        name: `${parent.first_name || ''} ${parent.last_name || ''}`,
        email: parent.email,
        phone: parent.phone
      },
      children: enrichedChildren
    });

  } catch (error) {
    console.error('Get parent data error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בטעינת נתונים' });
  }
});

app.get('/api/student/:studentId/parent', authenticateToken, requireRole('secretary', 'admin'), async (req, res) => {
  try {
    const { studentId } = req.params;

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ success: false, message: 'תלמיד לא נמצא' });
    }

    const { data: registrations, error: regError } = await supabase
      .from('pending_registrations')
      .select('*')
      .eq('school_id', student.school_id)
      .eq('status', 'approved');

    if (regError || !registrations) {
      return res.status(404).json({ success: false, message: 'לא נמצאו הרשמות' });
    }

    let parentEmail = null;
    for (const reg of registrations) {
      const children = JSON.parse(reg.children_data || '[]');
      const foundChild = children.find(child => 
        child.firstName === student.first_name && 
        child.lastName === student.last_name &&
        child.grade === student.grade
      );
      if (foundChild) {
        parentEmail = reg.parent_email;
        break;
      }
    }

    if (!parentEmail) {
      return res.status(404).json({ success: false, message: 'לא נמצא קשר להורה' });
    }

    const { data: parent, error: parentError } = await supabase
      .from('users')
      .select('*')
      .eq('email', parentEmail)
      .eq('role', 'parent')
      .single();

    if (parentError || !parent) {
      return res.status(404).json({ success: false, message: 'פרטי הורה לא נמצאו' });
    }

    res.json({
      success: true,
      parent: {
        id: parent.id,
        name: `${parent.first_name || ''} ${parent.last_name || ''}`.trim(),
        email: parent.email,
        phone: parent.phone
      }
    });

  } catch (error) {
    console.error('Get parent error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בטעינת פרטי הורה' });
  }
});

// ===== TRANSACTIONS =====

// Staff-only: parents must never self-credit a balance directly. Real payments update
// balance through their own gateway-confirmation code (grow-webhook-v2, paybox-callback);
// this endpoint is for staff recording a cash payment (or other manual adjustment).
app.post('/api/add-money', authenticateToken, requireRole('secretary', 'admin', 'kitchen'), requireSchoolAccess(getStudentSchoolId), async (req, res) => {
  try {
    const { studentId, amount, paymentMethod } = req.body;
    
    if (!studentId || !amount || amount <= 0) {
      return res.status(400).json({ success: false, message: 'נתונים לא תקינים' });
    }

    const { data: student, error: getError } = await supabase
      .from('students')
      .select('balance, school_id, first_name, last_name')
      .eq('id', studentId)
      .single();

    if (getError) {
      throw getError;
    }

    const newBalance = student.balance + parseFloat(amount);
    const { data, error } = await supabase
      .from('students')
      .update({ balance: newBalance })
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      throw error;
    }

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        student_id: studentId,
        school_id: student.school_id,
        type: 'payment',
        amount: parseFloat(amount),
        description: `הוספת כסף - ${paymentMethod}`,
        payment_method: paymentMethod,
        transaction_date: new Date().toISOString()
      });

    if (transactionError) {
      console.error('Transaction insert error:', transactionError);
    }

    res.json({
      success: true,
      message: 'כסף נוסף בהצלחה',
      newBalance: data.balance
    });

  } catch (error) {
    console.error('Add money error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בהוספת כסף' });
  }
});

app.get('/api/transactions/:userId', authenticateToken, requireSelfOrStaff(req => req.params.userId, getUserSchoolId), async (req, res) => {
  try {
    const { userId } = req.params;

    const { data: children, error: childrenError } = await supabase
      .from('students')
      .select('id')
      .eq('parent_id', userId);

    if (childrenError) {
      console.error('Children error:', childrenError);
      throw childrenError;
    }

    if (!children || children.length === 0) {
      return res.json({ success: true, transactions: [] });
    }

    const childrenIds = children.map(child => child.id);
    const { data: transactions, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .in('student_id', childrenIds)
      .order('transaction_date', { ascending: false })
      .limit(20);

    if (transactionsError) {
      console.error('Transactions query error:', transactionsError);
      throw transactionsError;
    }

    res.json({
      success: true,
      transactions: transactions || []
    });

  } catch (error) {
    console.error('Transactions error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בטעינת עסקאות' });
  }
});

app.get('/api/school-transactions/:schoolId', authenticateToken, requireRole('secretary', 'admin'), requireSchoolAccess(req => req.params.schoolId), async (req, res) => {
  try {
    const { schoolId } = req.params;

    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('*')
      .eq('school_id', schoolId)
      .order('transaction_date', { ascending: false });

    if (transError) throw transError;

    const { data: students, error: studError } = await supabase
      .from('students')
      .select('id, first_name, last_name, grade')
      .eq('school_id', schoolId);

    if (studError) throw studError;

    const transactionsWithStudents = transactions.map(transaction => {
      const student = students.find(s => s.id === transaction.student_id);
      return {
        ...transaction,
        students: student || null
      };
    });

    res.json({
      success: true,
      transactions: transactionsWithStudents
    });

  } catch (error) {
    console.error('School transactions error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בטעינת עסקאות' });
  }
});

app.get('/api/transactions/:schoolId/recent', authenticateToken, requireRole('kitchen', 'secretary', 'admin'), requireSchoolAccess(req => req.params.schoolId), async (req, res) => {
  try {
    const { schoolId } = req.params;
    const limit = req.query.limit || 10;

    const { data: transactions, error } = await supabase
      .from('transactions')
      .select(`
        *,
        students (
          id,
          first_name,
          last_name,
          grade,
          photo_url
        )
      `)
      .eq('school_id', schoolId)
      .order('transaction_date', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (error) throw error;

    res.json({
      success: true,
      transactions: transactions || []
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בטעינת עסקאות' });
  }
});
app.post('/api/process-meal-purchase', authenticateToken, requireRole('kitchen', 'secretary', 'admin'), async (req, res) => {
  try {
    const { studentId, items, total, forceOverride } = req.body;

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*, schools(allow_negative_balance, max_negative_balance, daily_meal_price, monthly_meal_price, enable_monthly_package, enable_daily_payment, menu_type)')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ success: false, message: 'תלמיד לא נמצא' });
    }

    if (req.user.role !== 'super_admin' && String(student.school_id) !== String(req.user.school_id)) {
      return res.status(403).json({ success: false, message: 'תלמיד זה אינו שייך לבית הספר שלך' });
    }

    const school = student.schools;

   // בדוק מגבלות יומיות
    const today = new Date().toISOString().split('T')[0];
    const { data: todayMeals } = await supabase
      .from('transactions')
      .select('id')
      .eq('student_id', studentId)
      .eq('type', 'meal')
      .gte('transaction_date', `${today}T00:00:00`)
      .lte('transaction_date', `${today}T23:59:59`);
    
    const mealsToday = todayMeals?.length || 0;
    
    if (student.max_daily_meals && mealsToday >= student.max_daily_meals) {
      return res.status(400).json({
        success: false,
        message: `הגעת למגבלת הארוחות היומית (${student.max_daily_meals} ארוחות)`
      });
    }

    

    // קבע סכום לחיוב לפי סוג התשלום האחרון
    const { data: lastPayment } = await supabase
      .from('transactions')
      .select('payment_type')
      .eq('student_id', studentId)
      .eq('type', 'payment')
      .not('transaction_date', 'is', null)
      .order('transaction_date', { ascending: false })
      .limit(1)
      .single();

    const paymentType = lastPayment?.payment_type || 'daily';

    let chargeAmount;
    if (school.menu_type === 'items' && Array.isArray(items) && items.length > 0) {
      // תפריט פריטים בודדים - החיוב מחושב מהעגלה בפועל, לא ממחיר קבוע. מחושב מחדש
      // בשרת לפי המחירים האמיתיים של הפריטים (לא סומכים על total שנשלח מהלקוח).
      const itemIds = [...new Set(items.map(i => i.id).filter(Boolean))];
      const { data: realItems } = await supabase
        .from('menu_items')
        .select('id, price')
        .in('id', itemIds)
        .eq('school_id', student.school_id);
      const priceById = new Map((realItems || []).map(mi => [mi.id, parseFloat(mi.price) || 0]));
      chargeAmount = items.reduce((sum, cartItem) => {
        const unitPrice = priceById.get(cartItem.id);
        const qty = parseInt(cartItem.quantity, 10) || 1;
        return sum + (unitPrice !== undefined ? unitPrice * qty : 0);
      }, 0);
    } else {
      // תפריט יומי / מנוי - נשאר בדיוק כמו היום: מחיר קבוע לפי בית הספר, לא לפי יום או פריט.
      if (paymentType === 'monthly') {
        chargeAmount = parseFloat(school.monthly_meal_price) || 0;
      } else {
        chargeAmount = parseFloat(school.daily_meal_price) || 0;
      }
    }


    // בדוק מגבלת הוצאה יומית
    if (student.spending_limit) {
      const { data: monthlyTransactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('student_id', studentId)
        .eq('type', 'meal')
        .gte('transaction_date', `${today}T00:00:00`);
      
      const spentToday = monthlyTransactions?.reduce((sum, t) => sum + parseFloat(t.amount), 0) || 0;
      
      if (spentToday + chargeAmount > student.spending_limit) {
        return res.status(400).json({
          success: false,
          message: `חריגה ממגבלת ההוצאה היומית (₪${student.spending_limit})`
        });
      }
    }

    const newBalance = student.balance - chargeAmount;

    if (student.balance < chargeAmount && !forceOverride) {
      if (school.allow_negative_balance) {
        if (newBalance < school.max_negative_balance) {
          return res.status(400).json({ 
            success: false, 
            message: `יתרה לא מספיקה! מינוס מקסימלי מותר: ₪${Math.abs(school.max_negative_balance).toFixed(2)}`,
            currentBalance: student.balance,
            newBalance: newBalance,
            maxNegative: school.max_negative_balance
          });
        }
        return res.json({
          success: false,
          requireConfirmation: true,
          message: `אזהרה: יתרה תרד למינוס!\nיתרה נוכחית: ₪${student.balance.toFixed(2)}\nיתרה לאחר רכישה: ₪${newBalance.toFixed(2)}`,
          currentBalance: student.balance,
          newBalance: newBalance
        });
      } else {
        return res.status(400).json({ 
          success: false, 
          message: 'יתרה לא מספיקה',
          currentBalance: student.balance 
        });
      }
    }

    const { error: updateError } = await supabase
      .from('students')
      .update({ balance: newBalance })
      .eq('id', studentId);

    if (updateError) throw updateError;

    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        student_id: studentId,
        school_id: student.school_id,
        items: items,
        amount: chargeAmount,
        type: 'meal',
        transaction_type: 'purchase',
        status: 'completed',
        transaction_date: new Date().toISOString()
      });

    if (transactionError) throw transactionError;

    res.json({
      success: true,
      newBalance: newBalance,
      chargeAmount: chargeAmount,
      message: 'רכישה בוצעה בהצלחה'
    });

  } catch (error) {
    console.error('Meal purchase error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בעיבוד רכישה' });
  }
});

// ===== REGISTRATIONS =====

app.get('/api/pending-registrations/:schoolId', authenticateToken, requireRole('secretary', 'admin'), requireSchoolAccess(req => req.params.schoolId), async (req, res) => {
  try {
    const { schoolId } = req.params;

    const { data: registrations, error } = await supabase
      .from('pending_registrations')
      .select('*')
      .eq('school_id', schoolId)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      registrations: registrations || []
    });

  } catch (error) {
    console.error('Pending registrations error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בטעינת הרשמות' });
  }
});

app.post('/api/pending-registrations', async (req, res) => {
  try {
    const {
      school_id,
      parent_name,
      parent_phone,
      parent_email,
      children_data,
      password,
      status = 'pending'
    } = req.body;

    if (!school_id || !parent_name || !parent_phone || !children_data) {
      return res.status(400).json({
        success: false,
        message: 'חסרים נתונים חובה'
      });
    }

    // כשההורה בחר סיסמה (זרימת ההרשמה הנוכחית) - האימות מתבצע ישירות במייל,
    // בלי לעבור דרך תור האישור של המזכירה. קריאות ישנות שלא שולחות סיסמה
    // ממשיכות להתנהג בדיוק כמו קודם (status='pending', ממתין לאישור ידני).
    let insertPayload = {
      school_id,
      parent_name,
      parent_phone,
      parent_email,
      children_data,
      status,
      created_at: new Date().toISOString()
    };

    let verificationToken = null;
    if (password) {
      if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'הסיסמה חייבת להכיל לפחות 6 תווים' });
      }
      const passwordHash = await bcrypt.hash(password, 10);
      verificationToken = crypto.randomBytes(32).toString('hex');
      const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 שעות

      insertPayload = {
        ...insertPayload,
        status: 'pending_verification',
        password_hash: passwordHash,
        verification_token: verificationToken,
        verification_token_expires: verificationTokenExpires.toISOString()
      };
    }

    const { data: registration, error } = await supabase
      .from('pending_registrations')
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      throw error;
    }

    res.json({
      success: true,
      message: 'ההרשמה נשלחה בהצלחה',
      registration: registration
    });

    // מייל התראה אמיתי על הרשמת הורה בפועל - נפרד ומדויק, לא כמו מייל "צור קשר" הכללי.
    (async () => {
      try {
        let schoolName = '';
        const { data: school } = await supabase.from('schools').select('name').eq('id', school_id).single();
        if (school) schoolName = school.name;

        let childrenList = [];
        try { childrenList = JSON.parse(children_data); } catch (e) { /* ignore */ }
        const childrenHtml = childrenList.map(c =>
          `<li>${c.firstName || ''} ${c.lastName || ''}${c.grade ? ' - כיתה ' + c.grade : ''}</li>`
        ).join('');

        await transporter.sendMail({
          from: EMAIL_FROM,
          to: process.env.ADMIN_EMAIL || 'netproil@gmail.com',
          subject: `👨‍👩‍👧 הרשמת הורה חדשה - ${schoolName || 'BonApp'}`,
          html: `
            <div dir="rtl" style="font-family: Arial; text-align: right;">
              <h2>👨‍👩‍👧 בקשת הרשמת תלמיד חדשה</h2>
              <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <p><strong>בית ספר:</strong> ${schoolName || '-'}</p>
                <p><strong>שם הורה:</strong> ${parent_name}</p>
                <p><strong>טלפון:</strong> ${parent_phone}</p>
                <p><strong>אימייל:</strong> ${parent_email || '-'}</p>
              </div>
              ${childrenHtml ? `<p><strong>ילדים:</strong></p><ul>${childrenHtml}</ul>` : ''}
              <p>${verificationToken ? 'ההורה קיבל קישור לאימות אוטומטי במייל. החשבון ייווצר ברגע שיאמת.' : 'יש לאשר או לדחות את ההרשמה בפאנל המזכירה.'}</p>
            </div>
          `
        });
      } catch (emailError) {
        console.error('Registration notification email error:', emailError.message);
      }
    })();

    // מייל אימות להורה - נשלח רק בזרימה החדשה (כשנשלחה סיסמה). לא נחסם על תשובת ה-API.
    if (verificationToken) {
      (async () => {
        try {
          const verifyLink = `${APP_URL}/verify-registration?token=${verificationToken}`;
          await transporter.sendMail({
            from: EMAIL_FROM,
            to: parent_email,
            subject: 'אימות הרשמה - BonApp',
            html: `
              <div dir="rtl" style="font-family: Arial; text-align: right;">
                <h2>שלום ${parent_name},</h2>
                <p>תודה שנרשמת למערכת BonApp. כדי להשלים את ההרשמה ולהפעיל את החשבון, יש ללחוץ על הקישור הבא:</p>
                <p><a href="${verifyLink}" style="background: #75a843; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">אימות ההרשמה</a></p>
                <p style="color: #666; font-size: 0.9rem;">הקישור תקף ל-24 שעות. אם לא נרשמת למערכת, אפשר להתעלם מהודעה זו.</p>
                <p>בברכה,<br>צוות BonApp</p>
              </div>
            `
          });
        } catch (emailError) {
          console.error('Registration verification email error:', emailError.message);
        }
      })();
    }

  } catch (error) {
    console.error('Registration creation error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בשמירת ההרשמה'
    });
  }
});

// מאמת הרשמת הורה לפי טוקן שנשלח במייל, ויוצר בפועל את חשבון ההורה + התלמידים
// (בדיוק אותה לוגיקת יצירה כמו באישור הידני של המזכירה למטה - QR, PIN, שיוך לשכבה, סנכרון רב-מסר).
app.get('/api/verify-registration/:token', async (req, res) => {
  try {
    const { token } = req.params;

    const { data: registration, error: getError } = await supabase
      .from('pending_registrations')
      .select('*')
      .eq('verification_token', token)
      .eq('status', 'pending_verification')
      .maybeSingle();

    if (getError || !registration) {
      return res.status(400).json({ success: false, message: 'קישור האימות אינו תקין' });
    }

    if (new Date(registration.verification_token_expires) < new Date()) {
      return res.status(400).json({ success: false, message: 'קישור האימות פג תוקף. יש להירשם מחדש.' });
    }

    const children = JSON.parse(registration.children_data);

    const { data: existingParent } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', registration.parent_email)
      .eq('role', 'parent')
      .maybeSingle();

    let parentId;

    if (existingParent) {
      parentId = existingParent.id;
    } else {
      const nameParts = registration.parent_name.split(' ');
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';

      const { data: newParent, error: userError } = await supabase
        .from('users')
        .insert({
          email: registration.parent_email,
          phone: registration.parent_phone,
          first_name: firstName,
          last_name: lastName,
          password_hash: registration.password_hash,
          role: 'parent',
          school_id: registration.school_id
        })
        .select()
        .single();

      if (userError) {
        console.error('Error creating parent user (verify):', userError);
        throw userError;
      }

      parentId = newParent.id;
    }

    const { data: registrationGroups } = await supabase
      .from('grade_groups')
      .select('id, name')
      .eq('school_id', registration.school_id);
    const groupNameById = new Map((registrationGroups || []).map(g => [g.id, g.name]));

    const studentsToCreate = children.map(child => ({
      school_id: registration.school_id,
      parent_id: parentId,
      first_name: child.firstName,
      last_name: child.lastName,
      grade: (child.group_id && groupNameById.get(child.group_id)) || child.grade || '',
      group_id: child.group_id || null,
      balance: 0.0,
      student_phone: child.phone,
      status: 'active'
    }));

    const { data: createdStudents, error: studentsError } = await supabase
      .from('students')
      .insert(studentsToCreate)
      .select();

    if (studentsError) {
      throw studentsError;
    }

    for (const student of createdStudents) {
      const qrCode = `STU_${student.id.substring(0, 8)}_${Date.now().toString().slice(-6)}`;
      await supabase
        .from('student_qr_codes')
        .insert({
          student_id: student.id,
          qr_code: qrCode,
          status: 'active'
        });

      const studentPin = await generateUniqueStudentPin(student.school_id);
      if (studentPin) {
        await supabase.from('students').update({ pin: studentPin }).eq('id', student.id);
      }
    }

    await supabase
      .from('pending_registrations')
      .update({
        status: 'verified',
        password_hash: null,
        verification_token: null,
        verification_token_expires: null
      })
      .eq('id', registration.id);

    ravMesserAddSubscriber(
      registration.parent_email,
      registration.parent_name,
      registration.parent_phone,
      RAVMESSER_LIST_ID_PARENTS
    ).catch(err => console.error('RavMesser sync error:', err.message));

    res.json({ success: true, message: 'ההרשמה אומתה בהצלחה! אפשר להתחבר עכשיו.' });

  } catch (error) {
    console.error('Registration verification error:', error);
    res.status(500).json({ success: false, message: 'שגיאה באימות ההרשמה' });
  }
});

app.post('/api/pending-registrations/:registrationId/action', authenticateToken, requireRole('secretary', 'admin'), async (req, res) => {
  try {
    const { registrationId } = req.params;
    const { action, reason } = req.body;

    const { data: registration, error: getError } = await supabase
      .from('pending_registrations')
      .select('*')
      .eq('id', registrationId)
      .single();

    if (getError || !registration) {
      return res.status(404).json({ success: false, message: 'הרשמה לא נמצאה' });
    }

    if (req.user.role !== 'super_admin' && String(registration.school_id) !== String(req.user.school_id)) {
      return res.status(403).json({ success: false, message: 'אין הרשאה להרשמה זו' });
    }

    if (action === 'approve') {
      const children = JSON.parse(registration.children_data);
      
      const { data: existingParent } = await supabase
        .from('users')
        .select('id, email')
        .eq('email', registration.parent_email)
        .eq('role', 'parent')
        .maybeSingle();

      let parentId;
      let generatedPassword;

      if (existingParent) {
        parentId = existingParent.id;
        generatedPassword = null;
      } else {
        generatedPassword = Math.random().toString(36).slice(-8);
        const hashedPassword = await bcrypt.hash(generatedPassword, 10);

        const nameParts = registration.parent_name.split(' ');
        const firstName = nameParts[0] || '';
        const lastName = nameParts.slice(1).join(' ') || '';

        const { data: newParent, error: userError } = await supabase
          .from('users')
          .insert({
            email: registration.parent_email,
            phone: registration.parent_phone,
            first_name: firstName,
            last_name: lastName,
            password_hash: hashedPassword,
            role: 'parent',
            school_id: registration.school_id
          })
          .select()
          .single();

        if (userError) {
          console.error('Error creating parent user:', userError);
          throw userError;
        }

        parentId = newParent.id;
      }

      // ה"כיתה" חייבת לשקף את השם של השכבה (group_id) שנבחרה בפועל - היא הבסיס
      // לחישוב ימי הארוחות והחיוב, לא שדה חופשי שההורה מילא בנפרד.
      const { data: registrationGroups } = await supabase
        .from('grade_groups')
        .select('id, name')
        .eq('school_id', registration.school_id);
      const groupNameById = new Map((registrationGroups || []).map(g => [g.id, g.name]));

      const studentsToCreate = children.map(child => ({
        school_id: registration.school_id,
        parent_id: parentId,
        first_name: child.firstName,
        last_name: child.lastName,
        grade: (child.group_id && groupNameById.get(child.group_id)) || child.grade || '',
        group_id: child.group_id || null,
        balance: 0.0,
        student_phone: child.phone,
        status: 'active'
      }));

      const { data: createdStudents, error: studentsError } = await supabase
        .from('students')
        .insert(studentsToCreate)
        .select();

      if (studentsError) {
        throw studentsError;
      }

      // יצירת QR codes ו-PIN לכל התלמידים
      for (const student of createdStudents) {
        const qrCode = `STU_${student.id.substring(0, 8)}_${Date.now().toString().slice(-6)}`;
        await supabase
          .from('student_qr_codes')
          .insert({
            student_id: student.id,
            qr_code: qrCode,
            status: 'active'
          });

        const studentPin = await generateUniqueStudentPin(student.school_id);
        if (studentPin) {
          await supabase.from('students').update({ pin: studentPin }).eq('id', student.id);
        }
      }

      await supabase
        .from('pending_registrations')
        .update({ status: 'approved' })
        .eq('id', registrationId);

      // סנכרון לרשימת התפוצה ברב מסר - לא חוסם את האישור, כשל כאן רק נרשם ללוג.
      ravMesserAddSubscriber(
        registration.parent_email,
        registration.parent_name,
        registration.parent_phone,
        RAVMESSER_LIST_ID_PARENTS
      ).catch(err => console.error('RavMesser sync error:', err.message));

      if (generatedPassword) {
        res.json({
          success: true,
          message: 'ההרשמה אושרה בהצלחה',
          parentPassword: generatedPassword
        });
      } else {
        res.json({
          success: true,
          message: 'ההרשמה אושרה והתלמידים נוספו להורה קיים'
        });
      }
      
    } else if (action === 'reject') {
      
      const { data, error } = await supabase
        .from('pending_registrations')
        .update({ 
          status: 'rejected',
          rejection_reason: reason 
        })
        .eq('id', registrationId)
        .select();

      
      if (error) {
        throw error;
      }

      res.json({
        success: true,
        message: 'ההרשמה נדחתה'
      });
    }

  } catch (error) {
    console.error('Registration action error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בעיבוד הרשמה' });
  }
});

// כל ההרשמות (כל הסטטוסים) - לתצוגת המזכירה, בנוסף לתור האישור הידני הישן
// שממשיך להציג רק status='pending' דרך /api/pending-registrations/:schoolId.
app.get('/api/all-registrations/:schoolId', authenticateToken, requireRole('secretary', 'admin'), requireSchoolAccess(req => req.params.schoolId), async (req, res) => {
  try {
    const { schoolId } = req.params;

    const { data: registrations, error } = await supabase
      .from('pending_registrations')
      .select('*')
      .eq('school_id', schoolId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    res.json({ success: true, registrations: registrations || [] });

  } catch (error) {
    console.error('All registrations error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בטעינת הרשמות' });
  }
});

// חוסם/מבטל חסימה של משפחה שלמה (הורה + כל התלמידים שלו) - לא מוחק נתונים,
// רק מונע כניסה למערכת (users.status) וסריקה בקופה/קיוסק (students.status).
app.post('/api/parents/:parentId/block', authenticateToken, requireRole('secretary', 'admin'), async (req, res) => {
  try {
    const { parentId } = req.params;

    const { data: parent, error: getError } = await supabase
      .from('users')
      .select('id, school_id, role')
      .eq('id', parentId)
      .eq('role', 'parent')
      .maybeSingle();

    if (getError || !parent) {
      return res.status(404).json({ success: false, message: 'הורה לא נמצא' });
    }

    if (req.user.role !== 'super_admin' && String(parent.school_id) !== String(req.user.school_id)) {
      return res.status(403).json({ success: false, message: 'אין הרשאה להורה זה' });
    }

    const { error: userError } = await supabase
      .from('users')
      .update({ status: 'blocked' })
      .eq('id', parentId);

    if (userError) throw userError;

    const { error: studentsError } = await supabase
      .from('students')
      .update({ status: 'inactive' })
      .eq('parent_id', parentId);

    if (studentsError) throw studentsError;

    res.json({ success: true, message: 'המשפחה נחסמה' });

  } catch (error) {
    console.error('Block family error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בחסימת המשפחה' });
  }
});

app.post('/api/parents/:parentId/unblock', authenticateToken, requireRole('secretary', 'admin'), async (req, res) => {
  try {
    const { parentId } = req.params;

    const { data: parent, error: getError } = await supabase
      .from('users')
      .select('id, school_id, role')
      .eq('id', parentId)
      .eq('role', 'parent')
      .maybeSingle();

    if (getError || !parent) {
      return res.status(404).json({ success: false, message: 'הורה לא נמצא' });
    }

    if (req.user.role !== 'super_admin' && String(parent.school_id) !== String(req.user.school_id)) {
      return res.status(403).json({ success: false, message: 'אין הרשאה להורה זה' });
    }

    const { error: userError } = await supabase
      .from('users')
      .update({ status: 'active' })
      .eq('id', parentId);

    if (userError) throw userError;

    const { error: studentsError } = await supabase
      .from('students')
      .update({ status: 'active' })
      .eq('parent_id', parentId);

    if (studentsError) throw studentsError;

    res.json({ success: true, message: 'החסימה בוטלה' });

  } catch (error) {
    console.error('Unblock family error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בביטול חסימה' });
  }
});

// ===== MENU =====

app.get('/api/menu-items/:schoolId', authenticateToken, requireSchoolAccess(req => req.params.schoolId), async (req, res) => {
  try {
    const { schoolId } = req.params;

    const { data: menuItems, error } = await supabase
      .from('menu_items')
      .select('*')
      .eq('school_id', schoolId)
      .eq('available', true)
      .order('category, name');

    if (error) throw error;

    res.json({
      success: true,
      menuItems: menuItems || []
    });

  } catch (error) {
    console.error('Menu items error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בטעינת תפריט' });
  }
});

app.post('/api/menu-items', authenticateToken, requireRole('secretary', 'admin', 'kitchen'), requireSchoolAccess(req => req.body.school_id), async (req, res) => {
  try {
    const { school_id, name, category, price, description, available, image_url } = req.body;

    const { data: menuItem, error } = await supabase
      .from('menu_items')
      .insert([{
        school_id,
        name,
        category,
        price,
        description,
        available: available !== false,
        image_url: image_url || null
      }])
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, menuItem });
  } catch (error) {
    console.error('Add menu item error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בהוספת פריט' });
  }
});

app.put('/api/menu-items/:itemId', authenticateToken, requireRole('secretary', 'admin', 'kitchen'), requireSchoolAccess(getMenuItemSchoolId), async (req, res) => {
  try {
    const { itemId } = req.params;
    const { name, category, price, description, available, image_url } = req.body;

    const updateData = { name, category, price, description, available };
    if (image_url !== undefined) updateData.image_url = image_url;

    const { data: menuItem, error } = await supabase
      .from('menu_items')
      .update(updateData)
      .eq('id', itemId)
      .select()
      .single();

    if (error) throw error;

    res.json({ success: true, menuItem });
  } catch (error) {
    console.error('Update menu item error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בעדכון פריט' });
  }
});

app.delete('/api/menu-items/:itemId', authenticateToken, requireRole('secretary', 'admin', 'kitchen'), requireSchoolAccess(getMenuItemSchoolId), async (req, res) => {
  try {
    const { itemId } = req.params;

    const { error } = await supabase
      .from('menu_items')
      .delete()
      .eq('id', itemId);

    if (error) throw error;

    res.json({ success: true });
  } catch (error) {
    console.error('Delete menu item error:', error);
    res.status(500).json({ success: false, message: 'שגיאה במחיקת פריט' });
  }
});

app.post('/api/menu-items/:itemId/image', authenticateToken, requireRole('secretary', 'admin', 'kitchen'), requireSchoolAccess(getMenuItemSchoolId), async (req, res) => {
  try {
    const { itemId } = req.params;
    const { imageData } = req.body;

    const base64Data = imageData.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const fileName = `${itemId}_${Date.now()}.jpg`;
    const { error: uploadError } = await supabase.storage
      .from('menu-item-images')
      .upload(fileName, buffer, { contentType: 'image/jpeg', upsert: true });

    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from('menu-item-images')
      .getPublicUrl(fileName);

    const { error: updateError } = await supabase
      .from('menu_items')
      .update({ image_url: urlData.publicUrl })
      .eq('id', itemId);

    if (updateError) throw updateError;

    res.json({ success: true, imageUrl: urlData.publicUrl });
  } catch (error) {
    console.error('Upload menu item image error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בהעלאת תמונה' });
  }
});

app.get('/api/daily-menu/:schoolId', authenticateToken, requireSchoolAccess(req => req.params.schoolId), async (req, res) => {
  try {
    const { schoolId } = req.params;

    const { data: dailyMenu, error } = await supabase
      .from('daily_menu')
      .select('*')
      .eq('school_id', schoolId)
      .order('day_of_week');

    if (error) throw error;

    res.json({
      success: true,
      dailyMenu: dailyMenu || []
    });

  } catch (error) {
    console.error('Daily menu error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בטעינת תפריט יומי' });
  }
});

app.post('/api/daily-menu', authenticateToken, requireRole('secretary', 'admin', 'kitchen'), requireSchoolAccess(req => req.body.school_id), async (req, res) => {
  try {
    const { school_id, day_of_week, menu_description, price, active } = req.body;

    const { data: existing } = await supabase
      .from('daily_menu')
      .select('id')
      .eq('school_id', school_id)
      .eq('day_of_week', day_of_week)
      .single();

    let result;
    if (existing) {
      const { data, error } = await supabase
        .from('daily_menu')
        .update({ menu_description, price, active })
        .eq('id', existing.id)
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    } else {
      const { data, error } = await supabase
        .from('daily_menu')
        .insert([{ school_id, day_of_week, menu_description, price, active }])
        .select()
        .single();
      
      if (error) throw error;
      result = data;
    }

    res.json({ success: true, dailyMenu: result });

  } catch (error) {
    console.error('Save daily menu error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בשמירת תפריט יומי' });
  }
});

// ===== GRADE GROUPS (שכבות) =====

// קבל כל השכבות של בית ספר
app.get('/api/schools/:schoolId/groups', async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { data, error } = await supabase
      .from('grade_groups')
      .select('*')
      .eq('school_id', schoolId)
      .order('name');
    if (error) throw error;
    res.json({ success: true, groups: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// צור שכבה חדשה
app.post('/api/schools/:schoolId/groups', authenticateToken, requireRole('secretary', 'admin'), requireSchoolAccess(req => req.params.schoolId), async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { name, description } = req.body;
    const { data, error } = await supabase
      .from('grade_groups')
      .insert([{ school_id: schoolId, name, description }])
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, group: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// מחק שכבה
app.delete('/api/groups/:groupId', authenticateToken, requireRole('secretary', 'admin'), requireSchoolAccess(getGroupSchoolId), async (req, res) => {
  try {
    const { groupId } = req.params;
    const { error } = await supabase
      .from('grade_groups')
      .delete()
      .eq('id', groupId);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// קבל/עדכן לוח ארוחות לשכבה לחודש
app.post('/api/groups/:groupId/schedule', authenticateToken, requireRole('secretary', 'admin'), requireSchoolAccess(req => req.body.school_id), async (req, res) => {
  try {
    const { groupId } = req.params;
    const { school_id, month, year, days_count, meal_price } = req.body;
    const { data, error } = await supabase
      .from('meal_schedules')
      .upsert([{ group_id: groupId, school_id, month, year, days_count, meal_price }], 
        { onConflict: 'group_id,month,year' })
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, schedule: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// קבל לוח ארוחות לשכבה לחודש
app.get('/api/groups/:groupId/schedule', authenticateToken, requireSchoolAccess(getGroupSchoolId), async (req, res) => {
  try {
    const { groupId } = req.params;
    const { month, year } = req.query;
    const { data, error } = await supabase
      .from('meal_schedules')
      .select('*')
      .eq('group_id', groupId)
      .eq('month', month)
      .eq('year', year)
      .single();
    if (error && error.code !== 'PGRST116') throw error;
    res.json({ success: true, schedule: data || null });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// חודשי תשלום זמינים לשכבה - כל חודש (נוכחי ואילך) שהמזכירה מילאה לו לוח ימי לימוד וטרם שולם עבורו
app.get('/api/groups/:groupId/payable-schedules', authenticateToken, requireSchoolAccess(getGroupSchoolId), async (req, res) => {
  try {
    const { groupId } = req.params;
    const { studentId } = req.query;
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    const { data: schedules, error } = await supabase
      .from('meal_schedules')
      .select('year, month, days_count, meal_price')
      .eq('group_id', groupId);
    if (error) throw error;

    const upcoming = (schedules || []).filter(s =>
      s.year > currentYear || (s.year === currentYear && s.month >= currentMonth)
    );

    let paidSet = new Set();
    if (studentId) {
      const { data: paid, error: paidError } = await supabase
        .from('monthly_payments')
        .select('year, month')
        .eq('student_id', studentId);
      if (paidError) throw paidError;
      paidSet = new Set((paid || []).map(p => `${p.year}-${p.month}`));
    }

    const result = upcoming
      .filter(s => !paidSet.has(`${s.year}-${s.month}`))
      .sort((a, b) => a.year - b.year || a.month - b.month);

    res.json({ success: true, schedules: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// עדכן הגדרות תשלום לבית ספר
app.put('/api/schools/:schoolId/payment-method', authenticateToken, requireRole('secretary', 'admin', 'kitchen'), requireSchoolAccess(req => req.params.schoolId), async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { payment_method, daily_meal_price, monthly_meal_price } = req.body;
    
    const updateData = {};
    if (payment_method !== undefined) updateData.payment_method = payment_method;
    if (daily_meal_price !== undefined) updateData.daily_meal_price = daily_meal_price;
    if (monthly_meal_price !== undefined) updateData.monthly_meal_price = monthly_meal_price;
    
    const { error } = await supabase
      .from('schools')
      .update(updateData)
      .eq('id', schoolId);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// קבל סוג תשלום אחרון של תלמיד
app.get('/api/students/:studentId/last-payment-type', authenticateToken, requireRole('kitchen', 'secretary', 'admin'), requireSchoolAccess(getStudentSchoolId), async (req, res) => {
  try {
    const { studentId } = req.params;
    const { data: lastPayment } = await supabase
      .from('transactions')
      .select('payment_type')
      .eq('student_id', studentId)
      .eq('type', 'payment')
      .not('transaction_date', 'is', null)
      .in('payment_type', ['monthly', 'daily'])
      .order('transaction_date', { ascending: false })
      .limit(1)
      .single();
    
    res.json({ 
      success: true, 
      payment_type: lastPayment?.payment_type || 'daily'
    });
  } catch (error) {
    res.json({ success: true, payment_type: 'daily' });
  }
});

// ===== GROW PAYMENT =====

// מקבל payment URL מ-Make ושומר זמנית
const growPaymentLinks = {}; // זיכרון זמני

// Webhook חדש מ-Grow דרך Make
app.post('/api/grow-webhook-v2', async (req, res) => {
  try {
    
    const { payment_sum, payment_desc } = req.body;
    
    // חלץ student_id וסוג תשלום מה-description
    // פורמטים נתמכים: "BonApp-{student_id}-monthly" / "BonApp-{student_id}-daily"
    // או, לתשלום חודשי מתויג לחודש ספציפי: "BonApp-{student_id}-monthly-{year}-{month}"
    let studentId = null;
    let paymentType = 'balance';
    let targetYear = null;
    let targetMonth = null;

    if (payment_desc && payment_desc.startsWith('BonApp-')) {
      const parts = payment_desc.split('-');
      const lastPart = parts[parts.length - 1];
      const secondLastPart = parts[parts.length - 2];
      const thirdLastPart = parts[parts.length - 3];

      if (lastPart === 'monthly' || lastPart === 'daily') {
        paymentType = lastPart;
        // הסר את הסוג מה-UUID
        studentId = parts.slice(1, -1).join('-');
      } else if (
        (thirdLastPart === 'monthly' || thirdLastPart === 'daily') &&
        /^\d+$/.test(secondLastPart) && /^\d+$/.test(lastPart)
      ) {
        paymentType = thirdLastPart;
        targetYear = parseInt(secondLastPart, 10);
        targetMonth = parseInt(lastPart, 10);
        studentId = parts.slice(1, -3).join('-');
      } else {
        studentId = payment_desc.replace('BonApp-', '');
      }
    }
    
    if (!studentId) {
      return res.json({ success: true });
    }
    
    const amount = parseFloat(payment_sum) || 0;
    
    
    // קבל יתרה נוכחית
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('balance, school_id')
      .eq('id', studentId)
      .single();
    
    if (studentError || !student) {
      console.error('Student not found:', studentId);
      return res.json({ success: true });
    }
    
    const newBalance = (student.balance || 0) + amount;
    
    // עדכן יתרה
    await supabase
      .from('students')
      .update({ balance: newBalance })
      .eq('id', studentId);
    
    // שמור עסקה
    await supabase
      .from('transactions')
      .insert({
        student_id: studentId,
        school_id: student.school_id,
        amount: amount,
        type: 'payment',
        payment_method: 'grow',
        payment_type: paymentType,
        description: `תשלום Grow - ₪${amount}`,
        transaction_date: new Date().toISOString()
      });

    // מנוי חודשי - סמן את החודש ששולם בפועל כשולם (ולא כ"יתרה" רגילה)
    // אם התשלום לא תויג לחודש ספציפי (פורמט ישן), נופלים חזרה לחודש הקלנדרי הנוכחי
    if (paymentType === 'monthly') {
      const now = new Date();
      const year = targetYear || now.getFullYear();
      const month = targetMonth || (now.getMonth() + 1);
      await supabase
        .from('monthly_payments')
        .upsert(
          { student_id: studentId, school_id: student.school_id, year, month },
          { onConflict: 'student_id,year,month', ignoreDuplicates: true }
        );
    }

    res.json({ success: true });
    
  } catch (error) {
    console.error('Grow webhook v2 error:', error);
    res.status(500).json({ success: false });
  }
});

// Webhook מ-Grow אחרי תשלום
app.post('/api/grow-webhook', async (req, res) => {
  try {
    
    
    if (!req.body) {
      return res.json({ success: true });
    }
    
    const { data, status } = req.body;
    
    // status 1 = תשלום הצליח
    if (status === '1' && data) {
      const studentId = data.customFields?.cField1;
      const amount = parseFloat(data.sum) || 0;
      const transactionId = data.transactionId;
      
      // בדוק אם כבר עיבדנו את העסקה הזאת
      if (transactionId) {
        const { data: existing } = await supabase
          .from('transactions')
          .select('id')
          .eq('description', `תשלום Grow - עסקה ${transactionId}`)
          .single();
        
        if (existing) {
          return res.json({ success: true });
        }
      }
      
      
      if (studentId) {
        // קבל יתרה נוכחית
        const { data: student, error: studentError } = await supabase
          .from('students')
          .select('balance')
          .eq('id', studentId)
          .single();
        
        if (!studentError && student) {
          const newBalance = (student.balance || 0) + amount;
          
          // עדכן יתרה
          await supabase
            .from('students')
            .update({ balance: newBalance })
            .eq('id', studentId);
          
          // קבל school_id של התלמיד
const { data: studentData } = await supabase
  .from('students')
  .select('school_id')
  .eq('id', studentId)
  .single();

await supabase
  .from('transactions')
  .insert({
    student_id: studentId,
    school_id: studentData?.school_id,
    amount: amount,
    type: 'payment',
    payment_method: 'grow',
    description: `תשלום Grow - עסקה ${transactionId || Date.now()}`,
    transaction_date: new Date().toISOString()
  });
          
        }
      }
    }
    
    // Grow מצפה ל-OK
    res.json({ success: true });
    
  } catch (error) {
    console.error('Grow webhook error:', error);
    res.status(500).json({ success: false });
  }
});

app.post('/api/grow-payment-link', async (req, res) => {
  try {
    const { payment_url, parent_name, amount } = req.body;
    
    // שמור את הקישור עם מזהה ייחודי
    const linkId = Date.now().toString();
    growPaymentLinks[linkId] = {
      url: payment_url,
      parent_name,
      amount,
      created_at: new Date()
    };
    
    res.json({ success: true, linkId });
  } catch (error) {
    console.error('Grow payment link error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// יצירת קישור תשלום דרך Make
app.post('/api/create-grow-payment', authenticateToken, async (req, res) => {
  try {
    const { parent_name, parent_phone, amount, student_name, description, student_id } = req.body;
    
    // קבל את ה-webhook URL של בית הספר של התלמיד
    const { data: student } = await supabase
      .from('students')
      .select('school_id, parent_id, schools(gateway_webhook_url, payment_gateway)')
      .eq('id', student_id)
      .single();

    if (!student) {
      return res.status(404).json({ success: false, message: 'תלמיד לא נמצא' });
    }

    const isOwnParent = req.user.role === 'parent' && String(req.user.id) === String(student.parent_id);
    const isStaffOfSchool = ['secretary', 'admin', 'kitchen'].includes(req.user.role) &&
      String(req.user.school_id) === String(student.school_id);
    if (req.user.role !== 'super_admin' && !isOwnParent && !isStaffOfSchool) {
      return res.status(403).json({ success: false, message: 'אין הרשאה ליצור תשלום עבור תלמיד זה' });
    }

    const makeWebhookUrl = student?.schools?.gateway_webhook_url
      || process.env.MAKE_WEBHOOK_URL 
      || 'https://hook.eu1.make.com/rxndk9i4dt1lqmry41ljb8lkssn9ck7l';
    
    
    
    const response = await fetch(makeWebhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        parent_name,
        parent_phone,
        amount,
        student_name,
        description,
        student_id
      })
    });
    
    const text = await response.text();
    
    let paymentUrl;
    try {
      const data = JSON.parse(text);
      paymentUrl = data.url || data;
    } catch (e) {
      // נסה לחלץ URL מהטקסט
      const urlMatch = text.match(/https:\/\/pay\.grow\.link\/[^\s"'}]+/);
      paymentUrl = urlMatch ? urlMatch[0] : text;
    }
    
    res.json({ success: true, paymentUrl });

  } catch (error) {
    console.error('Create Grow payment error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== SELF-SERVICE KIOSK =====
// Runs logged in as the kitchen device's own session (kitchen/secretary/admin role) - the
// screen itself is locked, not the API. Students never get their own auth token.

app.post('/api/kiosk/identify', authenticateToken, requireRole('kitchen', 'secretary', 'admin'), async (req, res) => {
  try {
    const { qrCode, pin } = req.body;
    if (!qrCode && !pin) {
      return res.status(400).json({ success: false, message: 'נדרש קוד QR או PIN' });
    }

    let studentId = null;

    if (qrCode) {
      const { data: qrRecord } = await supabase
        .from('student_qr_codes')
        .select('student_id')
        .eq('qr_code', qrCode)
        .eq('status', 'active')
        .maybeSingle();
      studentId = qrRecord?.student_id || null;
    } else {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('school_id', req.user.school_id)
        .eq('pin', pin)
        .maybeSingle();
      studentId = student?.id || null;
    }

    if (!studentId) {
      return res.status(404).json({ success: false, message: 'תלמיד לא נמצא' });
    }

    const { data: student, error } = await supabase
      .from('students')
      .select('id, first_name, last_name, school_id, balance, spending_limit, status, photo_url')
      .eq('id', studentId)
      .single();

    if (error || !student) {
      return res.status(404).json({ success: false, message: 'תלמיד לא נמצא' });
    }

    if (req.user.role !== 'super_admin' && String(student.school_id) !== String(req.user.school_id)) {
      return res.status(403).json({ success: false, message: 'תלמיד זה אינו שייך לבית הספר שלך' });
    }

    if (student.status !== 'active') {
      return res.status(400).json({ success: false, message: 'תלמיד זה אינו פעיל' });
    }

    // כמה הוציא היום כבר, כדי לאפשר בדיקת מגבלת הוצאה יומית גם בצד הלקוח לפני התשלום
    const today = new Date().toISOString().split('T')[0];
    const { data: todayMeals } = await supabase
      .from('transactions')
      .select('amount')
      .eq('student_id', studentId)
      .eq('type', 'meal')
      .gte('transaction_date', `${today}T00:00:00`);
    const spentToday = (todayMeals || []).reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0);

    res.json({
      success: true,
      student: {
        id: student.id,
        first_name: student.first_name,
        last_name: student.last_name,
        balance: student.balance,
        spending_limit: student.spending_limit,
        spent_today: spentToday,
        photo_url: student.photo_url
      }
    });
  } catch (error) {
    console.error('Kiosk identify error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בזיהוי תלמיד' });
  }
});

// מאמת את הסיסמה של המשתמש המחובר כרגע - משמש לנעילת יציאה ממסך הקיוסק
app.post('/api/verify-password', authenticateToken, async (req, res) => {
  try {
    const { password } = req.body;
    const { data: user, error } = await supabase
      .from('users')
      .select('password_hash')
      .eq('id', req.user.id)
      .single();

    if (error || !user) {
      return res.status(404).json({ success: false, message: 'משתמש לא נמצא' });
    }

    const validPassword = await bcrypt.compare(password || '', user.password_hash);
    res.json({ success: validPassword });
  } catch (error) {
    console.error('Verify password error:', error);
    res.status(500).json({ success: false, message: 'שגיאת שרת' });
  }
});

// ===== STUDY DAYS =====

// קבל ימי לימוד לשכבה לפי חודש
app.get('/api/groups/:groupId/study-days', authenticateToken, requireSchoolAccess(getGroupSchoolId), async (req, res) => {
  try {
    const { groupId } = req.params;
    const { month, year } = req.query;
    
    const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(Number(year), Number(month), 0).getDate();
    const endDate = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data, error } = await supabase
      .from('study_days')
      .select('*')
      .eq('group_id', groupId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date');
    
    if (error) throw error;
    res.json({ success: true, studyDays: data });
  } catch (error) {
    console.error('Get study days error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// הוסף/הסר יום לימוד
app.post('/api/groups/:groupId/study-days/toggle', authenticateToken, requireRole('secretary', 'admin'), requireSchoolAccess(getGroupSchoolId), async (req, res) => {
  try {
    const { groupId } = req.params;
    const { date, school_id } = req.body;
    
    // בדוק אם קיים
    const { data: existing, error } = await supabase
      .from('study_days')
      .select('id')
      .eq('group_id', groupId)
      .eq('date', date);
    
    
    if (existing && existing.length > 0) {
      // מחק
      await supabase.from('study_days').delete().eq('id', existing[0].id);
      res.json({ success: true, action: 'removed' });
    } else {
      // הוסף
      const { data: inserted, error: insertError } = await supabase
        .from('study_days')
        .insert({ group_id: groupId, school_id, date });
      res.json({ success: true, action: 'added' });
    }
  } catch (error) {
    console.error('Toggle study day error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// העלאת שנה: מזיז תלמידים משכבה לשכבה בכמות גדולה, לפי מיפוי שנבחר ידנית
// (fromGroupId -> toGroupId), או מסמן כלא-פעילים (בוגרים) כש-toGroupId הוא null.
app.post('/api/schools/:schoolId/promote-groups', authenticateToken, requireRole('secretary', 'admin'), requireSchoolAccess(req => req.params.schoolId), async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { mappings } = req.body;

    if (!Array.isArray(mappings) || mappings.length === 0) {
      return res.status(400).json({ success: false, message: 'לא נבחרו מעברים' });
    }

    const results = [];

    for (const { fromGroupId, toGroupId } of mappings) {
      if (!fromGroupId) continue;

      // ודא ששתי השכבות (אם נבחרה יעד) שייכות לבית הספר הזה
      const { data: fromGroup } = await supabase
        .from('grade_groups')
        .select('id, name, school_id')
        .eq('id', fromGroupId)
        .single();

      if (!fromGroup || String(fromGroup.school_id) !== String(schoolId)) {
        results.push({ fromGroupId, success: false, message: 'שכבת מקור לא נמצאה' });
        continue;
      }

      if (toGroupId) {
        const { data: toGroup } = await supabase
          .from('grade_groups')
          .select('id, name, school_id')
          .eq('id', toGroupId)
          .single();

        if (!toGroup || String(toGroup.school_id) !== String(schoolId)) {
          results.push({ fromGroupId, success: false, message: 'שכבת יעד לא נמצאה' });
          continue;
        }

        const { data: updated, error } = await supabase
          .from('students')
          .update({ group_id: toGroupId, grade: toGroup.name })
          .eq('group_id', fromGroupId)
          .eq('school_id', schoolId)
          .select('id');

        if (error) {
          results.push({ fromGroupId, success: false, message: error.message });
        } else {
          results.push({ fromGroupId, toGroupId, success: true, count: updated?.length || 0 });
        }
      } else {
        // בוגרים / אין שכבת יעד - הוצא מהרשימה הפעילה
        const { data: updated, error } = await supabase
          .from('students')
          .update({ status: 'inactive' })
          .eq('group_id', fromGroupId)
          .eq('school_id', schoolId)
          .select('id');

        if (error) {
          results.push({ fromGroupId, success: false, message: error.message });
        } else {
          results.push({ fromGroupId, graduated: true, success: true, count: updated?.length || 0 });
        }
      }
    }

    res.json({ success: true, results });
  } catch (error) {
    console.error('Promote groups error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בהעלאת שנה' });
  }
});

// ===== TUTORIAL VIDEOS =====

app.get('/api/tutorial-videos', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tutorial_videos')
      .select('*')
      .order('order_num', { ascending: true });
    if (error) throw error;
    res.json({ success: true, videos: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.post('/api/tutorial-videos', authenticateToken, requireRole('super_admin'), async (req, res) => {
  try {
    const { title, youtube_url, category, order_num, description } = req.body;
    const { data, error } = await supabase
      .from('tutorial_videos')
      .insert({ title, youtube_url, category: category || 'general', order_num: order_num || 0, description: description || null })
      .select()
      .single();
    if (error) throw error;
    res.json({ success: true, video: data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

app.delete('/api/tutorial-videos/:id', authenticateToken, requireRole('super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase
      .from('tutorial_videos')
      .delete()
      .eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ===== SCHOOL CONTACT FORM =====
app.post('/api/school-contact', async (req, res) => {
  try {
    const { organizationName, fullName, phone, email, message, type } = req.body;

const subject = type === 'suggestion' 
  ? `💡 הצעה לשיפור - BonApp`
  : `📞 פנייה חדשה - BonApp`;

    if (!organizationName || !fullName || !phone || !email) {
      return res.status(400).json({ success: false, message: 'נא למלא את כל השדות' });
    }

    // שלח מייל למנהל המערכת
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: process.env.ADMIN_EMAIL || 'netproil@gmail.com',
      subject: type === 'suggestion' ? `💡 הצעה לשיפור - BonApp` : type === 'support' ? `🔧 קריאת שירות - ${fullName}` : `📞 פנייה חדשה - ${fullName}`,
      html: `
        <div dir="rtl" style="font-family: Arial; text-align: right;">
          <h2>${type === 'suggestion' ? '💡 הצעה לשיפור' : type === 'support' ? '🔧 קריאת שירות' : '📞 פנייה חדשה מהאתר'}</h2>
          <p style="color: #888; font-size: 0.85rem;">זו פנייה כללית מטופס "צור קשר" - לא הרשמת תלמיד. הרשמות תלמידים מגיעות במייל נפרד "הרשמת הורה חדשה".</p>
          <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>שם הארגון:</strong> ${organizationName}</p>
            <p><strong>שם איש קשר:</strong> ${fullName}</p>
            <p><strong>טלפון:</strong> ${phone}</p>
            <p><strong>אימייל:</strong> ${email}</p>
          </div>

${message ? `<div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p><strong>הודעה:</strong></p>
            <p>${message}</p>
          </div>` : ''}

          <p>יש ליצור קשר עם הפונה בהתאם.</p>
        </div>
      `
    });

    // שלח מייל אישור לפונה
    await transporter.sendMail({
      from: EMAIL_FROM,
      to: email,
      subject: '✅ קיבלנו את פנייתך - BonApp',
      html: `
        <div dir="rtl" style="font-family: Arial; text-align: right;">
          <h2>שלום ${fullName}! 👋</h2>
          <p>תודה על פנייתך למערכת BonApp.</p>
          <p>קיבלנו את פרטי <strong>${organizationName}</strong> ונחזור אליך בהקדם.</p>
          <br>
          <p>בברכה,<br>צוות BonApp</p>
        </div>
      `
    });

    res.json({ success: true, message: 'הטופס נשלח בהצלחה!' });

  } catch (error) {
    console.error('School contact error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בשליחת הטופס: ' + error.message });
  }
});


// ===== EMAIL =====



app.post('/api/send-login-email', authenticateToken, requireRole('secretary', 'admin'), async (req, res) => {
  try {
    const { parentEmail, parentName, password } = req.body;
    
    
    const mailOptions = {
      from: EMAIL_FROM,
      to: parentEmail,
      subject: 'פרטי גישה למערכת ארוחות בית הספר',
      html: `
        <div dir="rtl" style="font-family: Arial; text-align: right;">
          <h2>שלום ${parentName},</h2>
          <p>ההרשמה שלכם למערכת ארוחות בית הספר אושרה בהצלחה!</p>
          
          <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>פרטי הגישה שלכם:</h3>
            <p><strong>אימייל:</strong> ${parentEmail}</p>
            <p><strong>סיסמה:</strong> ${password}</p>
          </div>
          
          <p><a href="${APP_URL}" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">היכנסו למערכת</a></p>
          
          <p>בברכה,<br>צוות בית הספר</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'אימייל נשלח בהצלחה'
    });
    
  } catch (error) {
    console.error('=== Email sending error ===');
    console.error('Error details:', error);
    res.status(500).json({ success: false, message: 'שגיאה בשליחת אימייל' });
  }
});

app.post('/api/send-user-email', authenticateToken, requireRole('secretary', 'admin'), async (req, res) => {
  try {
    const { userEmail, userName, password, role, schoolName } = req.body;
    
    const roleNames = {
      'secretary': 'מזכירות',
      'kitchen': 'עובד מטבח',
      'admin': 'מנהל'
    };

    const mailOptions = {
      from: EMAIL_FROM,
      to: userEmail,
      subject: `פרטי גישה למערכת ${schoolName}`,
      html: `
        <div dir="rtl" style="font-family: Arial; text-align: right;">
          <h2>שלום ${userName},</h2>
          <p>נוצר עבורך חשבון במערכת ארוחות בית הספר ${schoolName}</p>
          <p>תפקידך במערכת: <strong>${roleNames[role] || role}</strong></p>
          
          <div style="background: #f0f8ff; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <h3>פרטי הגישה שלך:</h3>
            <p><strong>אימייל:</strong> ${userEmail}</p>
            <p><strong>סיסמה:</strong> ${password}</p>
          </div>
          
          <p><a href="${APP_URL}/login" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">היכנס למערכת</a></p>
          
          <p style="color: #666; font-size: 0.9rem;">מומלץ לשנות את הסיסמה לאחר הכניסה הראשונה</p>
          
          <p>בברכה,<br>צוות המערכת</p>
        </div>
      `
    };

    await transporter.sendMail(mailOptions);
    
    res.json({
      success: true,
      message: 'אימייל נשלח בהצלחה'
    });
    
  } catch (error) {
    console.error('Email sending error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בשליחת אימייל' });
  }
});

app.use('/api/mobile', require('./mobileRoutes'));

// Catch CORS rejections (and other errors) without leaking stack traces to clients
app.use((err, req, res, next) => {
  if (err && err.message === 'Not allowed by CORS') {
    return res.status(403).json({ success: false, message: 'Origin not allowed' });
  }
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'שגיאת שרת' });
});

// ===== START SERVER =====

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});


// ===== PAYBOX PAYMENT =====

// יצירת תשלום Paybox
app.post('/api/create-paybox-payment', authenticateToken, async (req, res) => {
  try {
    const { studentId, amount, parentId } = req.body;
    
    
    // קבל פרטי תלמיד ובית ספר
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('school_id, parent_id, first_name, last_name')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return res.status(404).json({
        success: false,
        message: 'תלמיד לא נמצא'
      });
    }

    const isOwnParent = req.user.role === 'parent' && String(req.user.id) === String(student.parent_id);
    const isStaffOfSchool = ['secretary', 'admin', 'kitchen'].includes(req.user.role) &&
      String(req.user.school_id) === String(student.school_id);
    if (req.user.role !== 'super_admin' && !isOwnParent && !isStaffOfSchool) {
      return res.status(403).json({ success: false, message: 'אין הרשאה ליצור תשלום עבור תלמיד זה' });
    }

    // קבל פרטי Paybox של בית הספר
    const { data: school, error: schoolError } = await supabase
      .from('schools')
      .select('paybox_merchant_id, paybox_secret_key, enable_paybox, name')
      .eq('id', student.school_id)
      .single();
    
    if (schoolError || !school) {
      return res.status(404).json({ 
        success: false, 
        message: 'בית ספר לא נמצא' 
      });
    }
    
    // בדוק אם Paybox מופעל
    if (!school.enable_paybox) {
      return res.status(400).json({ 
        success: false, 
        message: 'Paybox לא מופעל לבית הספר' 
      });
    }
    
    // בדוק אם יש פרטי Paybox
    if (!school.paybox_merchant_id || !school.paybox_secret_key) {
      return res.status(400).json({ 
        success: false, 
        message: 'Paybox לא מוגדר לבית הספר' 
      });
    }
    
    // יצירת transaction ID ייחודי
    const transactionId = `BonApp_${Date.now()}_${studentId.substring(0, 8)}`;
    
    
    // שמירה בטבלה
    const { data: payment, error: paymentError } = await supabase
      .from('online_payments')
      .insert({
        student_id: studentId,
        parent_id: parentId,
        school_id: student.school_id,
        amount: parseFloat(amount),
        payment_method: 'paybox',
        status: 'pending',
        transaction_id: transactionId
      })
      .select()
      .single();
    
    if (paymentError) {
      console.error('Payment insert error:', paymentError);
      throw paymentError;
    }
    
    
    // TODO: כאן תהיה קריאה אמיתית ל-Paybox API
    // לעת עתה נחזיר URL דמה
    
    /*
    // קריאה אמיתית ל-Paybox (כשיהיה API Key):
    const payboxResponse = await fetch('https://api.payboxapp.page/v1/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${school.paybox_secret_key}`
      },
      body: JSON.stringify({
        merchant_id: school.paybox_merchant_id,
        amount: parseFloat(amount),
        currency: 'ILS',
        description: `טעינת יתרה - ${student.first_name} ${student.last_name}`,
        transaction_id: transactionId,
        callback_url: `https://api.bonapp.dev/api/paybox-callback`,
        success_url: `http://localhost:3000/payment-success`,
        cancel_url: `http://localhost:3000/parent-dashboard`
      })
    });
    
    const payboxData = await payboxResponse.json();
    
    if (payboxData.success) {
      res.json({
        success: true,
        paymentUrl: payboxData.payment_url,
        transactionId: transactionId
      });
    }
    */
    
    // זמני - עד שיהיה API אמיתי
    res.json({
      success: true,
      paymentUrl: `#paybox-demo?txn=${transactionId}&amount=${amount}`,
      transactionId: transactionId,
      message: 'בסביבת פיתוח - Paybox יחובר בעתיד'
    });
    
  } catch (error) {
    console.error('Paybox payment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה ביצירת תשלום' 
    });
  }
});

// Callback מPaybox (יקרא כשהתשלום יושלם)
app.post('/api/paybox-callback', async (req, res) => {
  try {
    const { transaction_id, status, amount } = req.body;
    
    
    // מצא את התשלום
    const { data: payment } = await supabase
      .from('online_payments')
      .select('*')
      .eq('transaction_id', transaction_id)
      .single();
    
    if (!payment) {
      return res.status(404).json({ success: false });
    }
    
    if (status === 'completed') {
      // עדכן סטטוס תשלום
      await supabase
        .from('online_payments')
        .update({ 
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', payment.id);
      
      // עדכן יתרת תלמיד
      const { data: student } = await supabase
        .from('students')
        .select('balance')
        .eq('id', payment.student_id)
        .single();
      
      const newBalance = student.balance + parseFloat(amount);
      
      await supabase
        .from('students')
        .update({ balance: newBalance })
        .eq('id', payment.student_id);
      
      // צור עסקה
      await supabase
        .from('transactions')
        .insert({
          student_id: payment.student_id,
          school_id: student.school_id,
          amount: amount,
          type: 'payment',
          payment_method: 'paybox',
          payment_type: payment.payment_type || 'balance',
          description: `תשלום Paybox - עסקה ${transaction_id || Date.now()}`,
          transaction_date: new Date().toISOString()
        });
      
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ success: false });
  }
});


