import React, { useState, useRef } from 'react';
import { Menu, X } from 'lucide-react';

// רכיב תצוגה בלבד: כותרת עליונה + ניווט + עטיפת תוכן לפאנל המזכירה.
// לא מחזיק activeTab, לא קורא ל-API, לא מנווט בעצמו - הכל מגיע כ-props.
// המצב היחיד שהרכיב מנהל בעצמו הוא פתיחה/סגירה של תפריט ההמבורגר במובייל - מצב תצוגה גרידא.
const SecretaryShell = ({
  schoolName,
  lastUpdateLabel,
  userName,
  userRole,
  navItems,
  activeTab,
  onTabChange,
  onSettingsClick,
  onLogout,
  headerStats,
  children
}) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const menuButtonRef = useRef(null);

  const closeMobileMenu = () => setMobileMenuOpen(false);

  const handleTabClick = (key) => {
    onTabChange(key);
    closeMobileMenu();
  };

  const handleMenuKeyDown = (e) => {
    if (e.key === 'Escape') {
      closeMobileMenu();
      menuButtonRef.current?.focus();
    }
  };

  return (
    <div className="bap-sec">
      <header className="bap-sec-top">
        <button
          ref={menuButtonRef}
          className="bap-sec-hamburger"
          aria-label={mobileMenuOpen ? 'סגור ניווט' : 'פתח ניווט'}
          aria-expanded={mobileMenuOpen}
          aria-controls="secretary-mobile-nav"
          onClick={() => setMobileMenuOpen(o => !o)}
          onKeyDown={handleMenuKeyDown}
        >
          {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <img className="bap-sec-brand-logo" src="/images/Bonapp-logo.png" alt="BonApp" />

        <div className="bap-sec-school">
          <strong>{schoolName}</strong>
          <small>פאנל מזכירה{lastUpdateLabel ? ` · עדכון אחרון: ${lastUpdateLabel}` : ''}</small>
        </div>

        <nav className="bap-sec-nav" aria-label="ניווט פאנל מזכירות">
          {navItems.map(item => (
            <button
              key={item.key}
              className={`bap-sec-nav-btn ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => handleTabClick(item.key)}
            >
              {item.icon}
              {item.label}
              {!!item.badge && <span className="bap-sec-badge-count">{item.badge}</span>}
            </button>
          ))}
        </nav>

        <div className="bap-sec-user">
          <div className="bap-sec-avatar">{(userName || '?').slice(0, 2)}</div>
          <div className="bap-sec-user-text">
            <strong>{userName}</strong>
            <small>{userRole}</small>
          </div>
        </div>

        {onSettingsClick && (
          <button className="bap-sec-icon-btn bap-sec-icon-btn--default" onClick={onSettingsClick} title="הגדרות מתקדמות" aria-label="הגדרות מתקדמות">
            ⚙️
          </button>
        )}
        <button className="bap-sec-icon-btn bap-sec-icon-btn--default" onClick={onLogout} title="יציאה" aria-label="יציאה">
          ↪
        </button>
      </header>

      {headerStats && headerStats.length > 0 && (
        <div className="bap-sec-stats bap-sec-header-stats">
          {headerStats.map((s, i) => (
            <div key={i} className={`bap-sec-stat ${s.tone === 'alert' ? 'alert' : ''} ${s.tone === 'danger' ? 'danger' : ''}`}>
              <span>{s.label}</span>
              <strong>{s.value}</strong>
            </div>
          ))}
        </div>
      )}

      {mobileMenuOpen && (
        <nav
          id="secretary-mobile-nav"
          className="bap-sec-mobile-nav"
          aria-label="ניווט פאנל מזכירות - מובייל"
          onKeyDown={handleMenuKeyDown}
        >
          {navItems.map(item => (
            <button
              key={item.key}
              className={`bap-sec-mobile-nav-btn ${activeTab === item.key ? 'active' : ''}`}
              onClick={() => handleTabClick(item.key)}
            >
              {item.icon}
              {item.label}
              {!!item.badge && <span className="bap-sec-badge-count">{item.badge}</span>}
            </button>
          ))}
        </nav>
      )}

      <main className="bap-sec-shell">{children}</main>
    </div>
  );
};

export default SecretaryShell;
