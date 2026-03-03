// Backend Routes עבור Mobile Apps
const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');

const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: parseInt(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    type: 'LOGIN',
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

const EMAIL_FROM = `"BonApp - מערכת ארוחות" <${process.env.EMAIL_USER || 'bon-app@innosys.co.il'}>`;


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
          body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; }
          .container { background: white; padding: 30px; border-radius: 10px; max-width: 600px; margin: 0 auto; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 10px; text-align: center; margin-bottom: 20px; }
          .button { display: inline-block; background: linear-gradient(135deg, #4CAF50, #45a049); color: white !important; padding: 15px 30px; text-decoration: none; border-radius: 10px; font-weight: bold; font-size: 16px; margin: 20px 0; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 12px; }
          .instructions { background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 20px 0; }
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
            <a href="${url}" class="button">📱 פתח את האפליקציה</a>
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
          <p style="background: #f0f0f0; padding: 10px; border-radius: 5px; word-break: break-all; font-family: monospace;">${url}</p>
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

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

// **יצירת Token ייחודי להורה**
router.post('/generate-parent-token', async (req, res) => {
  try {
    const { parentId } = req.body;
    
    // צור token ייחודי
    const token = crypto.randomBytes(32).toString('hex');
    
    // שמור ב-DB
    const { data, error } = await supabase
      .from('parent_mobile_tokens')
      .insert({
        parent_id: parentId,
        token: token,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // שנה
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      token: token,
      url: `${req.protocol}://${req.get('host')}/mobile/parent/${token}`
    });
  } catch (error) {
    console.error('Generate token error:', error);
    res.json({ success: false, message: 'שגיאה ביצירת token' });
  }
});

// **יצירת Token ייחודי לתלמיד**
router.post('/generate-student-token', async (req, res) => {
  try {
    const { studentId } = req.body;
    
    const token = crypto.randomBytes(32).toString('hex');
    
    const { data, error } = await supabase
      .from('student_mobile_tokens')
      .insert({
        student_id: studentId,
        token: token,
        created_at: new Date().toISOString(),
        expires_at: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();
    
    if (error) throw error;
    
    res.json({
      success: true,
      token: token,
      url: `${req.protocol}://${req.get('host')}/mobile/student/${token}`
    });
  } catch (error) {
    console.error('Generate student token error:', error);
    res.json({ success: false, message: 'שגיאה ביצירת token' });
  }
});

// **טעינת נתוני הורה לפי Token**
router.get('/parent/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // מצא הורה לפי token
    const { data: tokenData, error: tokenError } = await supabase
      .from('parent_mobile_tokens')
      .select('parent_id')
      .eq('token', token)
      .gte('expires_at', new Date().toISOString())
      .single();
    
    if (tokenError || !tokenData) {
      return res.json({ success: false, message: 'token לא תקין' });
    }
    
    // טען פרטי הורה
    const { data: parent, error: parentError } = await supabase
      .from('users')
      .select('*')
      .eq('id', tokenData.parent_id)
      .eq('role', 'parent')
      .single();
    
    if (parentError) throw parentError;
    
    // טען ילדים
    const { data: children, error: childrenError } = await supabase
      .from('students')
      .select('*')
      .eq('parent_id', tokenData.parent_id);
    
    if (childrenError) throw childrenError;
    
    // טען שם בית ספר
    let schoolName = '';
    let weeklyMenu = [];
    
    if (children.length > 0) {
      const { data: school } = await supabase
        .from('schools')
        .select('name, menu_type')
        .eq('id', children[0].school_id)
        .single();
      
      if (school) {
        schoolName = school.name;
        
        // טען תפריט
        if (school.menu_type === 'daily') {
          const { data: dailyMenu } = await supabase
            .from('daily_menu')
            .select('*')
            .eq('school_id', children[0].school_id)
            .order('day_of_week');
          
          if (dailyMenu) {
            const daysNames = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי'];
            weeklyMenu = daysNames.map((day, index) => {
              const dayMenu = dailyMenu.find(d => d.day_of_week === index);
              return {
                day,
                menu: dayMenu?.menu_description || 'לא הוגדר',
                price: dayMenu?.price || 0
              };
            });
          }
        }
      }
    }
    
    res.json({
      success: true,
      parent: {
        name: `${parent.first_name} ${parent.last_name}`,
        email: parent.email
      },
      children,
      schoolName,
      weeklyMenu
    });
  } catch (error) {
    console.error('Get parent mobile data error:', error);
    res.json({ success: false, message: 'שגיאה בטעינת נתונים' });
  }
});

// **טעינת נתוני תלמיד לפי Token**
router.get('/student/:token', async (req, res) => {
  try {
    const { token } = req.params;
    
    // מצא תלמיד לפי token
    const { data: tokenData, error: tokenError } = await supabase
      .from('student_mobile_tokens')
      .select('student_id')
      .eq('token', token)
      .gte('expires_at', new Date().toISOString())
      .single();
    
    if (tokenError || !tokenData) {
      return res.json({ success: false, message: 'token לא תקין' });
    }
    
    // טען פרטי תלמיד
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', tokenData.student_id)
      .single();
    
    if (studentError) throw studentError;
    
    // טען שם בית ספר
    const { data: school } = await supabase
      .from('schools')
      .select('name, menu_type')
      .eq('id', student.school_id)
      .single();
    
    let schoolName = school?.name || '';
    let todayMenu = null;
    
    // טען תפריט היום
    if (school && school.menu_type === 'daily') {
      const today = new Date().getDay();
      const { data: dailyMenu } = await supabase
        .from('daily_menu')
        .select('*')
        .eq('school_id', student.school_id)
        .eq('day_of_week', today)
        .single();
      
      if (dailyMenu) {
        todayMenu = {
          menu: dailyMenu.menu_description,
          price: dailyMenu.price
        };
      }
    }
    
    res.json({
      success: true,
      student,
      schoolName,
      todayMenu
    });
  } catch (error) {
    console.error('Get student mobile data error:', error);
    res.json({ success: false, message: 'שגיאה בטעינת נתונים' });
  }
});

// **שליחת לינק מובייל ב-SMS**
router.post('/send-link-sms', async (req, res) => {
  try {
    const { phone, url, type } = req.body; // type: 'parent' או 'student'
    
    // כאן תוסיף אינטגרציה עם שירות SMS (Twilio, Infobip וכו')
    // לדוגמה:
    // await twilioClient.messages.create({
    //   body: `קישור לאפליקציה: ${url}`,
    //   from: process.env.TWILIO_PHONE,
    //   to: phone
    // });
    
    console.log(`SMS to ${phone}: ${url}`);
    
    res.json({
      success: true,
      message: 'SMS נשלח בהצלחה (סימולציה)'
    });
  } catch (error) {
    console.error('Send SMS error:', error);
    res.json({ success: false, message: 'שגיאה בשליחת SMS' });
  }
});

// **שליחת לינק מובייל במייל**
router.post('/send-link-email', async (req, res) => {
  try {
    const { email, url, name, type } = req.body;
    
    // שלח מייל אמיתי!
    const result = await sendMobileLink(email, name, url);
    
    if (result.success) {
      res.json({ 
        success: true, 
        message: 'מייל נשלח בהצלחה!',
        messageId: result.messageId 
      });
    } else {
      res.json({ 
        success: false, 
        message: `שגיאה בשליחת מייל: ${result.error}` 
      });
    }
  } catch (error) {
    console.error('Send email error:', error);
    res.json({ success: false, message: 'שגיאה בשליחת מייל' });
  }
});

module.exports = router;
