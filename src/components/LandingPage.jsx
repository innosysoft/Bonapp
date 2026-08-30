import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

// עיצוב דף הבית - מבוסס על דגם bonapp-homepage-design.html שאושר.
// כל הכפתורים מחוברים לנתיבים האמיתיים הקיימים במערכת (login/register/school-contact/
// contact/about/support/terms/privacy/school-policy/accessibility) - שום נתיב לא הומצא.
const LandingPage = () => {
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const hamburgerRef = useRef(null);

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    hamburgerRef.current?.focus();
  };

  const goTo = (path) => {
    setMobileMenuOpen(false);
    navigate(path);
  };

  return (
    <div className="bap-lp">
      <style>{`
        .bap-lp{
          --navy:#17324a;--blue:#356b8c;--blue2:#eaf3f7;--green:#75a843;--green2:#eef6e9;
          --paper:#f8faf8;--white:#fff;--muted:#607482;--line:#dce6e9;--dark:#102b3d;
          font-family:'Heebo',Arial,sans-serif;color:var(--navy);background:var(--white);line-height:1.55;
        }
        .bap-lp *{box-sizing:border-box}
        .bap-lp button,.bap-lp a{font:inherit}
        .bap-lp a{text-decoration:none;color:inherit}
        .bap-lp img{max-width:100%}
        .bap-lp .wrap{width:min(1180px,calc(100% - 40px));margin:auto}
        .bap-lp .top{height:76px;display:flex;align-items:center;gap:34px;background:#fff}
        .bap-lp .logo{display:flex;align-items:center;gap:8px;font-size:28px;font-weight:700;color:var(--blue);margin-left:auto;letter-spacing:-1px}
        .bap-lp .logo img{height:32px;width:auto}
        .bap-lp .logo i{font-style:normal;color:var(--green)}
        .bap-lp nav{display:flex;gap:28px;font-size:15px;color:#425f70}
        .bap-lp nav a:hover{color:var(--blue)}
        .bap-lp .actions{display:flex;gap:10px}
        .bap-lp .btn{display:inline-flex;align-items:center;justify-content:center;border:1px solid var(--line);border-radius:11px;padding:11px 20px;font-weight:600;background:#fff;color:var(--navy);cursor:pointer;white-space:nowrap}
        .bap-lp .btn.primary{background:var(--blue);color:#fff;border-color:var(--blue)}
        .bap-lp .btn.light{background:#fff;color:var(--blue)}
        .bap-lp .btn:focus-visible,.bap-lp nav a:focus-visible,.bap-lp footer button:focus-visible,.bap-lp .faq summary:focus-visible{outline:3px solid var(--green);outline-offset:2px}
        .bap-lp .hamburger{display:none;align-items:center;justify-content:center;width:44px;height:44px;border:1px solid var(--line);border-radius:11px;background:#fff;color:var(--navy);cursor:pointer}
        .bap-lp .hamburger:focus-visible{outline:3px solid var(--green);outline-offset:2px}
        .bap-lp .mobile-menu{display:flex;flex-direction:column;gap:2px;background:#fff;border-top:1px solid var(--line);box-shadow:0 12px 24px rgba(23,50,74,.1);padding:8px}
        .bap-lp .mobile-menu a,.bap-lp .mobile-menu button{display:block;width:100%;text-align:right;padding:13px 12px;border-radius:8px;background:none;border:none;color:var(--navy);font-size:16px;cursor:pointer}
        .bap-lp .mobile-menu a:hover,.bap-lp .mobile-menu button:hover{background:var(--paper)}
        .bap-lp .mobile-menu .btn.primary{margin-top:6px;text-align:center;color:#fff}
        .bap-lp .mobile-menu a:focus-visible,.bap-lp .mobile-menu button:focus-visible{outline:3px solid var(--green);outline-offset:-2px}

        .bap-lp .hero{position:relative;overflow:hidden;background:url('/images/hero-banner.png') center/cover no-repeat}
        .bap-lp .hero::after{content:"";position:absolute;inset:0;background:linear-gradient(180deg,rgba(9,28,39,.08),rgba(9,28,39,.18) 55%,rgba(9,28,39,.44))}
        .bap-lp .hero-inner{position:relative;z-index:1;min-height:670px;display:flex;align-items:flex-end;justify-content:center;text-align:center}
        .bap-lp .hero-copy{width:min(820px,100%);padding:70px 0 54px;color:#fff;text-shadow:0 2px 18px rgba(8,26,36,.5)}
        .bap-lp .eyebrow{display:inline-block;color:#fff;font-weight:700;margin-bottom:10px;background:rgba(17,50,70,.66);padding:7px 15px;border-radius:999px;backdrop-filter:blur(7px)}
        .bap-lp .hero h1{font-size:51px;line-height:1.08;letter-spacing:-1.5px;margin:0 auto 14px;max-width:760px}
        .bap-lp .hero p{font-size:19px;color:#fff;max-width:720px;margin:0 auto 25px}
        .bap-lp .hero .actions{margin-bottom:12px;justify-content:center;text-shadow:none}
        .bap-lp .hero .btn.light{background:rgba(255,255,255,.94);border-color:#fff}
        .bap-lp .micro{font-size:13px;color:#fff}

        .bap-lp .audiences{background:#fff;border-bottom:1px solid var(--line)}
        .bap-lp .audience-grid{display:grid;grid-template-columns:repeat(3,1fr);padding:30px 0;gap:0}
        .bap-lp .audience{padding:5px 34px;border-left:1px solid var(--line)}
        .bap-lp .audience:last-child{border:0}
        .bap-lp .audience strong{display:block;font-size:17px;margin-bottom:3px}
        .bap-lp .audience span{font-size:14px;color:var(--muted)}

        .bap-lp section.pad{padding:92px 0}
        .bap-lp .center{text-align:center}
        .bap-lp .section-kicker{font-size:14px;color:var(--green);font-weight:700;margin-bottom:8px}
        .bap-lp .section-title{font-size:40px;line-height:1.2;letter-spacing:-1px;margin:0 0 14px}
        .bap-lp .section-desc{font-size:18px;color:var(--muted);max-width:700px;margin:0 auto 48px}

        .bap-lp .comparison{display:grid;grid-template-columns:1fr 1fr;gap:24px;max-width:950px;margin:auto}
        .bap-lp .compare{padding:34px;border-radius:18px;background:#fff;border:1px solid var(--line)}
        .bap-lp .compare.before{background:#fafafa}
        .bap-lp .compare.after{background:var(--green2);border-color:#d7e8cb}
        .bap-lp .compare h3{font-size:22px;margin:0 0 20px}
        .bap-lp .compare ul{list-style:none;padding:0;margin:0}
        .bap-lp .compare li{padding:9px 30px 9px 0;position:relative;color:#4e6674}
        .bap-lp .compare li::before{position:absolute;right:0;font-weight:700}
        .bap-lp .compare.before li::before{content:"×";color:#a17272}
        .bap-lp .compare.after li::before{content:"✓";color:var(--green)}

        .bap-lp .soft{background:var(--paper)}
        .bap-lp .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:46px;margin-top:48px}
        .bap-lp .step-num{width:48px;height:48px;background:var(--blue);color:#fff;border-radius:14px;display:grid;place-items:center;font-weight:700;margin-bottom:20px}
        .bap-lp .step h3{font-size:21px;margin:0 0 8px}
        .bap-lp .step p{color:var(--muted);margin:0}

        .bap-lp .product{display:grid;grid-template-columns:.85fr 1.15fr;gap:70px;align-items:center}
        .bap-lp .product-copy .section-desc{margin:0 0 28px}
        .bap-lp .browser{background:#fff;border:1px solid var(--line);border-radius:18px;box-shadow:0 24px 60px rgba(23,50,74,.14);overflow:hidden}
        .bap-lp .browser-bar{height:42px;background:#f2f5f6;border-bottom:1px solid var(--line);display:flex;align-items:center;padding:0 15px;gap:6px}
        .bap-lp .dot{width:8px;height:8px;border-radius:50%;background:#b8c7ce;display:inline-block}
        .bap-lp .app{padding:24px;background:#f8fafb}
        .bap-lp .app-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}
        .bap-lp .balance{font-size:32px;font-weight:700;color:var(--blue)}
        .bap-lp .app-row{display:flex;align-items:center;gap:13px;background:#fff;border:1px solid #e6edef;border-radius:12px;padding:14px;margin-top:10px}
        .bap-lp .app-icon{width:44px;height:44px;border-radius:10px;background:var(--green2);display:grid;place-items:center;color:var(--green);font-weight:700}
        .bap-lp .app-row small{display:block;color:var(--muted)}

        .bap-lp .schools{background:var(--dark);color:#fff}
        .bap-lp .schools-grid{display:grid;grid-template-columns:1fr 1fr;gap:70px;align-items:center}
        .bap-lp .schools .section-kicker{color:#a9ce8e}
        .bap-lp .schools .section-desc{color:#c0d0da;margin:0 0 30px}
        .bap-lp .feature-list{display:grid;grid-template-columns:1fr 1fr;gap:12px}
        .bap-lp .feature{background:rgba(255,255,255,.07);padding:16px;border-radius:12px;color:#e8f0f4}
        .bap-lp .feature::before{content:"✓";color:#a9ce8e;margin-left:9px;font-weight:700}

        .bap-lp .trust{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
        .bap-lp .trust-item{text-align:center;padding:22px 10px}
        .bap-lp .trust-icon{width:44px;height:44px;margin:0 auto 14px;border-radius:50%;background:var(--blue2);display:grid;place-items:center;color:var(--blue);font-size:20px}
        .bap-lp .trust-item strong{display:block}
        .bap-lp .trust-item span{font-size:14px;color:var(--muted)}

        .bap-lp .faq{max-width:820px;margin:45px auto 0}
        .bap-lp .faq details{border-bottom:1px solid var(--line);padding:19px 5px}
        .bap-lp .faq summary{font-size:17px;font-weight:600;cursor:pointer}
        .bap-lp .faq p{color:var(--muted)}

        .bap-lp .cta{margin:0 auto 90px;width:min(1180px,calc(100% - 40px));padding:55px;background:var(--blue2);border-radius:24px;text-align:center}
        .bap-lp .cta h2{font-size:36px;margin:0 0 10px}
        .bap-lp .cta p{color:var(--muted);margin:0 0 25px}
        .bap-lp .cta .actions{justify-content:center}

        .bap-lp footer{background:#0e2636;color:#dce7ed;padding:50px 0 28px}
        .bap-lp .footer-grid{display:grid;grid-template-columns:2fr 1fr 1fr;gap:50px}
        .bap-lp .footer-logo{font-size:26px;font-weight:700;color:#fff}
        .bap-lp .footer-logo i{color:#9cc77e;font-style:normal}
        .bap-lp footer p{color:#aebfc9;font-size:14px}
        .bap-lp footer h4{margin:0 0 12px;color:#fff}
        .bap-lp .footer-links{display:grid;gap:8px}
        .bap-lp footer button{background:none;border:none;padding:0;cursor:pointer;color:#aebfc9;font-size:14px;text-align:inherit}
        .bap-lp footer button:hover{color:#fff}
        .bap-lp .copyright{border-top:1px solid rgba(255,255,255,.12);margin-top:35px;padding-top:22px;padding-bottom:90px;font-size:13px;color:#8fa4b0}

        @media(max-width:800px){
          .bap-lp .wrap{width:min(100% - 28px,1180px)}
          .bap-lp nav{display:none}
          .bap-lp .top{height:66px}
          .bap-lp .top>.actions .btn:first-child{display:flex;padding:9px 12px}
          .bap-lp .top>.actions .btn.primary{display:none}
          .bap-lp .hamburger{display:flex}
          .bap-lp header{position:relative}
          .bap-lp .mobile-menu{position:absolute;top:100%;left:0;right:0;z-index:999}
          .bap-lp .hero{background-position:center center}
          .bap-lp .hero::after{background:linear-gradient(180deg,rgba(9,28,39,.04),rgba(9,28,39,.18) 42%,rgba(9,28,39,.68))}
          .bap-lp .hero-inner{min-height:520px;align-items:flex-end}
          .bap-lp .hero-copy{width:100%;padding:48px 0 4px}
          .bap-lp .hero h1{font-size:32px}
          .bap-lp .hero p{font-size:17px}
          .bap-lp .hero .actions{display:flex;flex-direction:row;flex-wrap:wrap;justify-content:center}
          .bap-lp .hero .actions .btn{display:inline-flex;width:auto;min-width:145px;padding:10px 18px}
          .bap-lp .audience-grid,.bap-lp .comparison,.bap-lp .steps,.bap-lp .product,.bap-lp .schools-grid,.bap-lp .trust,.bap-lp .footer-grid{grid-template-columns:1fr}
          .bap-lp .audience{border:0;border-bottom:1px solid var(--line);padding:18px 0}
          .bap-lp .audience-grid{padding:8px 0}
          .bap-lp .steps{gap:18px}
          .bap-lp .step{display:flex;gap:16px;align-items:flex-start;position:relative}
          .bap-lp .step-num{margin-bottom:0;flex-shrink:0}
          .bap-lp .step-content{flex:1}
          .bap-lp .step:not(:last-child)::after{content:"";position:absolute;top:48px;right:23px;bottom:-18px;width:2px;background:var(--line)}
          .bap-lp .product,.bap-lp .schools-grid{gap:40px}
          .bap-lp .feature-list{grid-template-columns:1fr}
          .bap-lp .section-title{font-size:28px}
          .bap-lp section.pad{padding:56px 0}
          .bap-lp .cta{padding:40px 20px}
          .bap-lp .cta h2{font-size:28px}
          .bap-lp .footer-grid{gap:8px}
          .bap-lp .footer-grid>div{padding:20px 0;border-bottom:1px solid rgba(255,255,255,.1)}
          .bap-lp .footer-grid>div:last-child{border-bottom:none}
          .bap-lp footer h4{font-size:16px;margin-bottom:14px}
          .bap-lp footer p{font-size:15px;line-height:1.7}
          .bap-lp .footer-links{gap:14px}
          .bap-lp .footer-links a,.bap-lp .footer-links button{font-size:15px}
          .bap-lp .copyright{font-size:14px;line-height:1.7}
        }
        @media(max-width:420px){
          .bap-lp .hero h1{font-size:26px}
        }
      `}</style>

      <header>
        <div className="wrap top">
          <div className="logo">
            <img src="/images/Bonapp-logo.png" alt="BonApp" />
          </div>
          <nav>
            <a href="#how">איך זה עובד</a>
            <a href="#schools">לבתי ספר</a>
            <a href="#parents">להורים</a>
            <a href="#faq">שאלות נפוצות</a>
            <button onClick={() => navigate('/contact')} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', font: 'inherit' }}>צור קשר</button>
          </nav>
          <div className="actions">
            <button className="btn" onClick={() => navigate('/login')}>כניסת משתמש רשום</button>
            <button className="btn primary" onClick={() => navigate('/register')}>רישום הורה חדש</button>
            <button
              ref={hamburgerRef}
              className="hamburger"
              aria-label={mobileMenuOpen ? 'סגור תפריט' : 'פתח תפריט'}
              aria-expanded={mobileMenuOpen}
              aria-controls="mobile-menu"
              onClick={() => setMobileMenuOpen(o => !o)}
              onKeyDown={(e) => { if (e.key === 'Escape') closeMobileMenu(); }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav id="mobile-menu" className="mobile-menu" onKeyDown={(e) => { if (e.key === 'Escape') closeMobileMenu(); }}>
            <a href="#how" onClick={() => setMobileMenuOpen(false)}>איך זה עובד</a>
            <a href="#schools" onClick={() => setMobileMenuOpen(false)}>לבתי ספר</a>
            <a href="#parents" onClick={() => setMobileMenuOpen(false)}>להורים</a>
            <a href="#faq" onClick={() => setMobileMenuOpen(false)}>שאלות נפוצות</a>
            <button onClick={() => goTo('/about')}>אודות</button>
            <button onClick={() => goTo('/support')}>תמיכה</button>
            <button onClick={() => goTo('/contact')}>צור קשר</button>
            <button className="btn primary" onClick={() => goTo('/register')}>רישום הורה חדש</button>
          </nav>
        )}
      </header>

      <main>
        {/* באנר ראשי */}
        <section className="hero">
          <div className="wrap hero-inner">
            <div className="hero-copy">
              <span className="eyebrow">פחות פתקים. פחות התעסקות. יותר שקט.</span>
              <h1>הדרך החכמה לנהל ארוחות בבית הספר</h1>
              <p>הורים מטעינים יתרה, תלמידים מזדהים באמצעות QR, ובית הספר מקבל שליטה מלאה - בלי מזומן, בלי רשימות ובלי ויכוחים.</p>
              <div className="actions">
                <button className="btn primary" onClick={() => navigate('/register')}>רישום הורה</button>
                <a className="btn light" href="#schools">אני מנהל/ת בית ספר</a>
              </div>
              <div className="micro">הרישום לוקח דקות ספורות</div>
            </div>
          </div>
        </section>

        {/* יתרונות להורים, לתלמידים ולבית הספר */}
        <section className="audiences" id="parents">
          <div className="wrap audience-grid">
            <div className="audience">
              <strong>להורים</strong>
              <span>יתרה, היסטוריית רכישות ושליטה בהוצאות</span>
            </div>
            <div className="audience">
              <strong>לתלמידים</strong>
              <span>סריקה מהירה בלי כסף ובלי פתקים</span>
            </div>
            <div className="audience">
              <strong>לבית הספר</strong>
              <span>ניהול פשוט, בקרה ודוחות בזמן אמת</span>
            </div>
          </div>
        </section>

        {/* השוואה לפני/אחרי */}
        <section className="pad">
          <div className="wrap center">
            <div className="section-kicker">עושים סדר</div>
            <h2 className="section-title">ניהול הארוחות לא צריך להיות מסובך</h2>
            <p className="section-desc">BonApp מרכזת את כל התהליך במקום אחד ומחליפה את הפתקים, המזומן והרשימות הידניות במערכת ברורה ופשוטה.</p>
            <div className="comparison">
              <div className="compare before">
                <h3>לפני BonApp</h3>
                <ul>
                  <li>גביית מזומן</li>
                  <li>פתקים שהולכים לאיבוד</li>
                  <li>רשימות ועדכונים ידניים</li>
                  <li>קושי לדעת מי שילם</li>
                  <li>עומס על המזכירות</li>
                </ul>
              </div>
              <div className="compare after">
                <h3>עם BonApp</h3>
                <ul>
                  <li>טעינת יתרה דיגיטלית</li>
                  <li>זיהוי תלמיד באמצעות QR</li>
                  <li>תיעוד אוטומטי של כל רכישה</li>
                  <li>מידע זמין וברור להורים</li>
                  <li>שליטה ודוחות לבית הספר</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* איך זה עובד - 3 שלבים */}
        <section className="pad soft" id="how">
          <div className="wrap">
            <div className="center">
              <div className="section-kicker">פשוט מההתחלה</div>
              <h2 className="section-title">איך BonApp עובדת?</h2>
              <p className="section-desc">שלושה צעדים קצרים, וכל מערך הארוחות עובד בצורה מסודרת.</p>
            </div>
            <div className="steps">
              <div className="step">
                <div className="step-num">1</div>
                <div className="step-content">
                  <h3>נרשמים ומוסיפים ילדים</h3>
                  <p>ההורה פותח חשבון ומוסיף ילד אחד או כמה ילדים באותו בית ספר.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-num">2</div>
                <div className="step-content">
                  <h3>מקבלים אישור ומטעינים</h3>
                  <p>לאחר אישור בית הספר, ההורה יכול להטעין את היתרה ולעקוב אחריה.</p>
                </div>
              </div>
              <div className="step">
                <div className="step-num">3</div>
                <div className="step-content">
                  <h3>סורקים ומקבלים ארוחה</h3>
                  <p>התלמיד מזדהה באמצעות QR, והעסקה מתועדת מיד במערכת.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* המחשת ממשק המערכת */}
        <section className="pad">
          <div className="wrap product">
            <div className="product-copy">
              <div className="section-kicker">ממשק ברור לכולם</div>
              <h2 className="section-title">פשוט להורה.<br />פשוט לבית הספר.</h2>
              <p className="section-desc">כל אחד רואה בדיוק את המידע שהוא צריך - בלי תפריטים מסובכים ובלי צורך בידע טכני.</p>
              <button className="btn" onClick={() => navigate('/support')}>צפו בסרטוני הדרכה</button>
            </div>
            <div className="browser">
              <div className="browser-bar">
                <i className="dot" /><i className="dot" /><i className="dot" />
              </div>
              <div className="app">
                <div className="app-head">
                  <div>
                    <strong>שלום, משפחת ישראלי</strong>
                    <small style={{ display: 'block', color: 'var(--muted)' }}>החשבון של נועה</small>
                  </div>
                  <div>
                    <small>יתרה זמינה</small>
                    <div className="balance">₪86.50</div>
                  </div>
                </div>
                <div className="app-row">
                  <div className="app-icon">QR</div>
                  <div>
                    <strong>הקוד של נועה מוכן</strong>
                    <small>לסריקה מהירה בחדר האוכל</small>
                  </div>
                </div>
                <div className="app-row">
                  <div className="app-icon">₪</div>
                  <div>
                    <strong>ארוחת צהריים</strong>
                    <small>היום, 12:35 · 18 ₪</small>
                  </div>
                </div>
                <div className="app-row">
                  <div className="app-icon">+</div>
                  <div>
                    <strong>הוספת כסף לחשבון</strong>
                    <small>טעינה פשוטה ומהירה</small>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* אזור לבתי ספר */}
        <section className="pad schools" id="schools">
          <div className="wrap schools-grid">
            <div>
              <div className="section-kicker">לבתי ספר</div>
              <h2 className="section-title">כל מה שצריך לניהול מערך הארוחות</h2>
              <p className="section-desc">פחות עבודה ידנית לצוות, יותר שקיפות להורים ושליטה מלאה בכל מה שקורה.</p>
              <button className="btn light" onClick={() => navigate('/school-contact')}>אני רוצה לשמוע עוד</button>
            </div>
            <div className="feature-list">
              <div className="feature">רישום ואישור תלמידים</div>
              <div className="feature">מעקב אחר יתרות ותשלומים</div>
              <div className="feature">ניהול תפריט ומנות</div>
              <div className="feature">דוחות בזמן אמת</div>
              <div className="feature">הפחתת עומס מהמזכירות</div>
              <div className="feature">מידע ברור ושקוף להורים</div>
            </div>
          </div>
        </section>

        {/* אמון וביטחון */}
        <section className="pad">
          <div className="wrap">
            <div className="center">
              <div className="section-kicker">אפשר לסמוך עלינו</div>
              <h2 className="section-title">מערכת שנבנתה בשביל השטח</h2>
            </div>
            <div className="trust">
              <div className="trust-item">
                <div className="trust-icon">✓</div>
                <strong>מערכת מאובטחת</strong>
                <span>שמירה מסודרת על המידע</span>
              </div>
              <div className="trust-item">
                <div className="trust-icon">◎</div>
                <strong>הרשאות משתמשים</strong>
                <span>כל אחד רואה את מה שרלוונטי לו</span>
              </div>
              <div className="trust-item">
                <div className="trust-icon">?</div>
                <strong>תמיכה אנושית</strong>
                <span>יש למי לפנות כשצריך עזרה</span>
              </div>
              <div className="trust-item">
                <div className="trust-icon">B</div>
                <strong>מבית Innosys</strong>
                <span>ניסיון טכנולוגי עם בתי ספר</span>
              </div>
            </div>
          </div>
        </section>

        {/* שאלות נפוצות */}
        <section className="pad soft" id="faq">
          <div className="wrap center">
            <div className="section-kicker">כל מה שצריך לדעת</div>
            <h2 className="section-title">שאלות נפוצות</h2>
            <div className="faq" style={{ textAlign: 'right' }}>
              <details>
                <summary>איך הורה נרשם למערכת?</summary>
                <p>לוחצים על רישום הורה, ממלאים פרטים ומוסיפים את הילדים הלומדים בבית הספר.</p>
              </details>
              <details>
                <summary>איך מוסיפים יותר מילד אחד?</summary>
                <p>בתוך אותו חשבון הורה ניתן להוסיף כמה ילדים הלומדים באותו בית ספר.</p>
              </details>
              <details>
                <summary>איך מטעינים כסף לחשבון?</summary>
                <p>אפשרויות הטעינה מוצגות להורה לאחר אישור הרישום על ידי בית הספר.</p>
              </details>
              <details>
                <summary>למי פונים במקרה של תקלה?</summary>
                <p>אפשר לפנות לצוות התמיכה דרך עמוד התמיכה או כפתור הוואטסאפ באתר.</p>
              </details>
            </div>
          </div>
        </section>

        {/* קריאה לפעולה */}
        <section className="cta" id="contact">
          <h2>מוכנים לעבור לניהול פשוט יותר?</h2>
          <p>חוסכים זמן, מונעים בלבול ומקבלים שליטה ברורה על מערך הארוחות.</p>
          <div className="actions">
            <button className="btn primary" onClick={() => navigate('/register')}>רישום הורה</button>
            <button className="btn" onClick={() => navigate('/school-contact')}>יצירת קשר לבית ספר</button>
          </div>
        </section>
      </main>

      <footer>
        <div className="wrap">
          <div className="footer-grid">
            <div>
              <div className="footer-logo">Bon<i>App</i></div>
              <p>מערכת חכמה לניהול ארוחות בבתי ספר<br />מבית Innosys</p>
              <p><a href="tel:1-700-502042">1-700-502042</a></p>
            </div>
            <div>
              <h4>BonApp</h4>
              <div className="footer-links">
                <button onClick={() => navigate('/about')}>אודות</button>
                <button onClick={() => navigate('/support')}>תמיכה</button>
                <button onClick={() => navigate('/contact')}>צור קשר</button>
              </div>
            </div>
            <div>
              <h4>מידע משפטי</h4>
              <div className="footer-links">
                <button onClick={() => navigate('/terms')}>תנאי שימוש</button>
                <button onClick={() => navigate('/privacy')}>מדיניות פרטיות</button>
                <button onClick={() => navigate('/school-policy')}>מדיניות בית ספר</button>
                <button onClick={() => navigate('/accessibility')}>הצהרת נגישות</button>
              </div>
            </div>
          </div>
          <div className="copyright">© {new Date().getFullYear()} BonApp by Innosys. כל הזכויות שמורות.</div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
