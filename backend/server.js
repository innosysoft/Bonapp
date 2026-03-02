const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcrypt');
const QRCode = require('qrcode');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));



// Email transporter
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT),
  secure: process.env.EMAIL_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// פונקציה לשליחת קישור מובייל
const sendMobileLink = async (toEmail, userName, url) => {
  const mailOptions = {
    from: '"מערכת ארוחות בית ספר" <bon-app@innosys.co.il>',
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
    console.log('✅ Mobile link email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('❌ Mobile link email error:', error);
    return { success: false, error: error.message };
  }
};

// Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

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



app.post('/api/admin/auth', async (req, res) => {
  const { password } = req.body;
  const adminPassword = process.env.SUPER_ADMIN_PASSWORD || 'admin123';
  
  if (password === adminPassword) {
    res.json({ success: true, message: 'Admin authenticated' });
  } else {
    res.status(401).json({ success: false, message: 'Wrong password' });
  }
});

app.post('/api/login', async (req, res) => {
  console.log('=== LOGIN REQUEST RECEIVED ===');
  console.log('Body:', req.body);

  try {
    const { username, password } = req.body;

    console.log('Username:', username);
    console.log('Password length:', password?.length);
    
    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'חסרים שם משתמש או סיסמה' });
    }
    
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .or(`email.ilike.${username},phone.eq.${username}`)
      .single();
    
    console.log('User found:', user ? 'YES' : 'NO');

    if (error || !user) {
      console.log('USER NOT FOUND - returning 401');
      return res.status(401).json({ success: false, message: 'שם משתמש או סיסמה שגויים' });
    }

    console.log('Password hash from DB:', user.password_hash);
    
    const validPassword = await bcrypt.compare(password, user.password_hash);
    console.log('Password valid?', validPassword);

    if (!validPassword) {
      console.log('INVALID PASSWORD - returning 401');
      return res.status(401).json({ success: false, message: 'שם משתמש או סיסמה שגויים' });
    }

    console.log('LOGIN SUCCESS!');
    
    res.json({
      success: true,
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



// ===== SCHOOLS =====

app.get('/api/schools', async (req, res) => {
  try {
    const { data: schools, error } = await supabase
      .from('schools')
      .select('id, name, menu_type')
      .order('name');

    if (error) throw error;

    res.json({ success: true, schools });
  } catch (error) {
    console.error('Get schools error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בטעינת בתי ספר' });
  }
});

app.get('/api/schools/:schoolId', async (req, res) => {
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

app.get('/api/admin/schools', async (req, res) => {
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

app.post('/api/admin/schools', async (req, res) => {
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

app.put('/api/schools/:schoolId/menu-type', async (req, res) => {
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

app.put('/api/schools/:schoolId/settings', async (req, res) => {
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
  enable_cash
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

    const { data: school, error } = await supabase
      .from('schools')
      .update(updateData)
      .eq('id', schoolId)
      .select()
      .single();

    console.log('Supabase update result:', { school, error });

    if (error) throw error;

    console.log('✅ Settings saved successfully!');

    res.json({ success: true, school });
  } catch (error) {
    console.error('Update school settings error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'שגיאה בעדכון הגדרות' 
    });
  }
});

app.get('/api/school-students/:schoolId', async (req, res) => {
  try {
    const { schoolId } = req.params;

    const { data: students, error } = await supabase
      .from('students')
      .select(`
        *,
        users (first_name, last_name, phone, email)
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

app.get('/api/schools/:schoolId/users', async (req, res) => {
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

app.post('/api/schools/:schoolId/users', async (req, res) => {
  try {
    const { schoolId } = req.params;
    const { email, password, firstName, lastName, role, phone } = req.body;

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

app.put('/api/users/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { firstName, lastName, email, phone, role, password } = req.body;

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

app.delete('/api/users/:userId', async (req, res) => {
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

app.post('/api/students', async (req, res) => {
  try {
    const { parent_id, school_id, first_name, last_name, grade, student_phone, student_id_number, system_access, can_edit_profile, spending_limit, parent_notifications, can_order_for_friends, max_daily_meals } = req.body;

    if (!parent_id || !school_id || !first_name || !grade) {
      return res.status(400).json({
        success: false,
        message: 'חסרים נתונים חובה'
      });
    }

    const { data: student, error } = await supabase
      .from('students')
      .insert({
        parent_id,
        school_id,
        first_name,
        last_name: last_name || '',
        grade,
        student_phone: student_phone || '',
        student_id_number: student_id_number || null,
        system_access: system_access || false,
        can_edit_profile: can_edit_profile || false,
        spending_limit: spending_limit || 50,
        parent_notifications: parent_notifications !== undefined ? parent_notifications : true,
        can_order_for_friends: can_order_for_friends || false,
        max_daily_meals: max_daily_meals || 2,
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

    console.log('✅ Student created with QR:', qrCode);

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

app.put('/api/students/:studentId', async (req, res) => {
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
      max_daily_meals
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

app.delete('/api/students/:studentId', async (req, res) => {
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

app.post('/api/students/search', async (req, res) => {
  try {
    const { school_id, search_term } = req.body;

    if (!search_term || search_term.length < 2) {
      return res.json({ success: true, students: [] });
    }

    const { data: students, error } = await supabase
      .from('students')
      .select('*')
      .eq('school_id', school_id)
      .or(`first_name.ilike.%${search_term}%,last_name.ilike.%${search_term}%,id_number.ilike.%${search_term}%,student_phone.ilike.%${search_term}%`)
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

app.post('/api/students/:studentId/photo', async (req, res) => {
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

app.post('/api/students/:studentId/create-qr', async (req, res) => {
  try {
    const { studentId } = req.params;
    
    console.log('=== CREATE QR REQUEST ===');
    console.log('Student ID:', studentId);
    
    const { data: existing, error: checkError } = await supabase
      .from('student_qr_codes')
      .select('*')
      .eq('student_id', studentId)
      .maybeSingle();
    
    if (existing) {
      console.log('QR already exists:', existing.qr_code);
      return res.json({ success: true, qrCode: existing.qr_code });
    }
    
    const qrCode = `STU_${studentId.substring(0, 8)}_${Date.now().toString().slice(-6)}`;
    console.log('Creating new QR:', qrCode);
    
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
    
    console.log('✅ QR created successfully!');
    res.json({ success: true, qrCode: newQR.qr_code });
  } catch (error) {
    console.error('Create QR error:', error);
    res.status(500).json({ success: false, message: 'שגיאה ביצירת QR' });
  }
});

app.post('/api/students/:studentId/generate-qr', async (req, res) => {
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

app.post('/api/students/:studentId/send-qr-email', async (req, res) => {
  try {
    const { studentId } = req.params;
    const { parentEmail, parentName, studentName, schoolName } = req.body;
    
    console.log('=== SENDING QR EMAIL ===');
    console.log('Student ID:', studentId);
    console.log('Email to:', parentEmail);
    
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
      from: process.env.EMAIL_USER || 'your-email@gmail.com',
      to: parentEmail,
      subject: `QR Code - ${studentName} - ${schoolName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h1 style="color: #2c3e50; text-align: center;">QR Code - ${studentName}</h1>
          <p style="font-size: 16px; color: #555;">שלום ${parentName},</p>
          <p style="font-size: 16px; color: #555;">
            מצורף ה-QR Code של ${studentName} לשימוש במזנון בית הספר ${schoolName}.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <img src="${qrImageData}" alt="QR Code" style="max-width: 400px; border: 2px solid #ddd; padding: 20px;" />
          </div>
          
          <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 0; color: #666;">קוד תלמיד:</p>
            <p style="font-size: 20px; font-weight: bold; font-family: monospace; margin: 10px 0;">${qrRecord.qr_code}</p>
          </div>
          
          <p style="font-size: 14px; color: #777; text-align: center;">
            סרוק את הקוד במזנון בית הספר לביצוע רכישות
          </p>
        </div>
      `
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

app.post('/api/scan-student', async (req, res) => {
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

    res.json({
      success: true,
      student: student
    });

  } catch (error) {
    console.error('Student scan error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בזיהוי תלמיד' });
  }
});

app.post('/api/generate-qr/:studentId', async (req, res) => {
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
  console.log('Received registration data:', req.body);
  
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

app.get('/api/parent/:userId', async (req, res) => {
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

    console.log('=== CHILDREN FROM DB ===');
    console.log('First child:', children?.[0]);
    console.log('Has system_access?', children?.[0]?.system_access);
    console.log('Has spending_limit?', children?.[0]?.spending_limit);

    if (childrenError) {
      console.error('Error fetching children:', childrenError);
    }

    const enrichedChildren = (children || []).map(child => ({
      ...child,
      canBuyToday: child.status === 'active',
      lastMeal: child.last_meal_date || 'אין מידע',
      photo: null
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

app.get('/api/student/:studentId/parent', async (req, res) => {
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
        name: parent.name,
        email: parent.email,
        phone: parent.phone,
        password: parent.password
      }
    });

  } catch (error) {
    console.error('Get parent error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בטעינת פרטי הורה' });
  }
});

// ===== TRANSACTIONS =====

app.post('/api/add-money', async (req, res) => {
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

app.get('/api/transactions/:userId', async (req, res) => {
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

app.get('/api/school-transactions/:schoolId', async (req, res) => {
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

app.get('/api/transactions/:schoolId/recent', async (req, res) => {
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
      .order('created_at', { ascending: false })
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

app.post('/api/process-meal-purchase', async (req, res) => {
  try {
    const { studentId, items, total, forceOverride } = req.body;

    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*, schools(allow_negative_balance, max_negative_balance)')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ success: false, message: 'תלמיד לא נמצא' });
    }

    const newBalance = student.balance - total;
    const school = student.schools;

    if (student.balance < total && !forceOverride) {
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
        amount: total,
        transaction_type: 'purchase',
        status: 'completed'
      });

    if (transactionError) throw transactionError;

    res.json({
      success: true,
      newBalance: newBalance,
      message: 'רכישה בוצעה בהצלחה'
    });

  } catch (error) {
    console.error('Meal purchase error:', error);
    res.status(500).json({ success: false, message: 'שגיאה בעיבוד רכישה' });
  }
});

// ===== REGISTRATIONS =====

app.get('/api/pending-registrations/:schoolId', async (req, res) => {
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
      status = 'pending'
    } = req.body;

    if (!school_id || !parent_name || !parent_phone || !children_data) {
      return res.status(400).json({
        success: false,
        message: 'חסרים נתונים חובה'
      });
    }

    const { data: registration, error } = await supabase
      .from('pending_registrations')
      .insert({
        school_id,
        parent_name,
        parent_phone,
        parent_email,
        children_data,
        status,
        created_at: new Date().toISOString()
      })
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

  } catch (error) {
    console.error('Registration creation error:', error);
    res.status(500).json({
      success: false,
      message: 'שגיאה בשמירת ההרשמה'
    });
  }
});

app.post('/api/pending-registrations/:registrationId/action', async (req, res) => {
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
        console.log('Parent already exists:', existingParent.email);
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

        console.log('New parent created with ID:', newParent.id);
        parentId = newParent.id;
      }

      const studentsToCreate = children.map(child => ({
        school_id: registration.school_id,
        parent_id: parentId,
        first_name: child.firstName,
        last_name: child.lastName,
        grade: child.grade,
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

      // יצירת QR codes לכל התלמידים
      for (const student of createdStudents) {
        const qrCode = `STU_${student.id.substring(0, 8)}_${Date.now().toString().slice(-6)}`;
        await supabase
          .from('student_qr_codes')
          .insert({
            student_id: student.id,
            qr_code: qrCode,
            status: 'active'
          });
      }

      await supabase
        .from('pending_registrations')
        .update({ status: 'approved' })
        .eq('id', registrationId);

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
      console.log('Rejecting registration:', registrationId);
      console.log('Reason:', reason);
      
      const { data, error } = await supabase
        .from('pending_registrations')
        .update({ 
          status: 'rejected',
          rejection_reason: reason 
        })
        .eq('id', registrationId)
        .select();

      console.log('Update result:', data);
      console.log('Update error:', error);
      
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

// ===== MENU =====

app.get('/api/menu-items/:schoolId', async (req, res) => {
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

app.post('/api/menu-items', async (req, res) => {
  try {
    const { school_id, name, category, price, description, available } = req.body;

    const { data: menuItem, error } = await supabase
      .from('menu_items')
      .insert([{
        school_id,
        name,
        category,
        price,
        description,
        available: available !== false
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

app.put('/api/menu-items/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params;
    const { name, category, price, description, available } = req.body;

    const { data: menuItem, error } = await supabase
      .from('menu_items')
      .update({ name, category, price, description, available })
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

app.delete('/api/menu-items/:itemId', async (req, res) => {
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

app.get('/api/daily-menu/:schoolId', async (req, res) => {
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

app.post('/api/daily-menu', async (req, res) => {
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

// ===== EMAIL =====

app.post('/api/send-login-email', async (req, res) => {
  try {
    const { parentEmail, parentName, password } = req.body;
    
    console.log('=== Starting email send ===');
    console.log('To:', parentEmail);
    console.log('From:', 'bon-app@innosys.co.il');
    
    const mailOptions = {
      from: 'bon-app@innosys.co.il',
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
          
          <p><a href="http://localhost:3000" style="background: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">היכנסו למערכת</a></p>
          
          <p>בברכה,<br>צוות בית הספר</p>
        </div>
      `
    };

    console.log('Sending email...');
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully!', info.messageId);
    
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

app.post('/api/send-user-email', async (req, res) => {
  try {
    const { userEmail, userName, password, role, schoolName } = req.body;
    
    const roleNames = {
      'secretary': 'מזכירות',
      'kitchen': 'עובד מטבח',
      'admin': 'מנהל'
    };

    const mailOptions = {
      from: 'bon-app@innosys.co.il',
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
          
          <p><a href="http://localhost:3000/login" style="background: #667eea; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">היכנס למערכת</a></p>
          
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

// ===== START SERVER =====

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
});


// ===== PAYBOX PAYMENT =====

// יצירת תשלום Paybox
app.post('/api/create-paybox-payment', async (req, res) => {
  try {
    const { studentId, amount, parentId } = req.body;
    
    console.log('=== PAYBOX PAYMENT REQUEST ===');
    console.log('Student:', studentId);
    console.log('Amount:', amount);
    
    // קבל פרטי תלמיד ובית ספר
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('school_id, first_name, last_name')
      .eq('id', studentId)
      .single();
    
    if (studentError || !student) {
      return res.status(404).json({ 
        success: false, 
        message: 'תלמיד לא נמצא' 
      });
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
    
    console.log('Transaction ID:', transactionId);
    console.log('School Merchant ID:', school.paybox_merchant_id);
    
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
    
    console.log('Payment record created:', payment.id);
    
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
    
    console.log('=== PAYBOX CALLBACK ===');
    console.log('Transaction:', transaction_id);
    console.log('Status:', status);
    
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
          school_id: payment.school_id,
          type: 'payment',
          amount: parseFloat(amount),
          description: 'תשלום Paybox',
          payment_method: 'paybox',
          transaction_date: new Date().toISOString()
        });
      
      console.log('✅ Payment completed! Balance updated.');
    }
    
    res.json({ success: true });
    
  } catch (error) {
    console.error('Callback error:', error);
    res.status(500).json({ success: false });
  }
});


