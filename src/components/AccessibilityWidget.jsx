import React, { useState, useEffect } from 'react';

const STORAGE_KEY = 'bonapp_a11y_prefs';

const defaultPrefs = {
  fontScale: 0,
  highContrast: false,
  underlineLinks: false,
  stopAnimations: false,
  readableFont: false
};

const loadPrefs = () => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return saved ? { ...defaultPrefs, ...saved } : defaultPrefs;
  } catch {
    return defaultPrefs;
  }
};

const ToggleRow = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    aria-pressed={active}
    style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      width: '100%', padding: '0.6rem 0.75rem', borderRadius: '8px',
      border: active ? '2px solid #1a237e' : '2px solid #e0e0e0',
      background: active ? '#e8eaf6' : 'white', cursor: 'pointer',
      fontSize: '0.9rem', color: '#333', textAlign: 'right'
    }}
  >
    <span>{label}</span>
    <span>{active ? '✅' : ''}</span>
  </button>
);

const iconButtonStyle = {
  width: '36px', height: '36px', borderRadius: '8px', border: '2px solid #e0e0e0',
  background: 'white', cursor: 'pointer', fontWeight: '700', fontSize: '0.95rem'
};

const AccessibilityWidget = () => {
  const [open, setOpen] = useState(false);
  const [prefs, setPrefs] = useState(loadPrefs);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('a11y-contrast', prefs.highContrast);
    root.classList.toggle('a11y-underline', prefs.underlineLinks);
    root.classList.toggle('a11y-no-motion', prefs.stopAnimations);
    root.classList.toggle('a11y-readable-font', prefs.readableFont);
    root.classList.remove('a11y-font-1', 'a11y-font-2', 'a11y-font-3');
    if (prefs.fontScale > 0) root.classList.add(`a11y-font-${prefs.fontScale}`);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  }, [prefs]);

  const toggle = (key) => setPrefs(p => ({ ...p, [key]: !p[key] }));
  const changeFont = (delta) => setPrefs(p => ({ ...p, fontScale: Math.min(3, Math.max(0, p.fontScale + delta)) }));
  const reset = () => setPrefs(defaultPrefs);

  return (
    <>
      <button
        onClick={() => setOpen(o => !o)}
        aria-label="תפריט נגישות"
        aria-expanded={open}
        title="נגישות"
        style={{
          position: 'fixed', bottom: '20px', right: '20px', width: '56px', height: '56px',
          borderRadius: '50%', background: '#1a237e', color: 'white', border: 'none',
          cursor: 'pointer', fontSize: '1.6rem', boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
          zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}
      >
        <span aria-hidden="true">♿</span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="הגדרות נגישות"
          style={{
            position: 'fixed', bottom: '90px', right: '20px', width: '300px',
            maxWidth: 'calc(100vw - 40px)', background: 'white', borderRadius: '16px',
            boxShadow: '0 10px 40px rgba(0,0,0,0.25)', zIndex: 10000, direction: 'rtl',
            fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", overflow: 'hidden'
          }}
        >
          <div style={{ background: '#1a237e', color: 'white', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <strong>♿ נגישות</strong>
            <button onClick={() => setOpen(false)} aria-label="סגור" style={{ background: 'none', border: 'none', color: 'white', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1, padding: 0 }}>×</button>
          </div>

          <div style={{ padding: '1rem', display: 'grid', gap: '0.6rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '0.9rem', color: '#333' }}>גודל טקסט</span>
              <div style={{ display: 'flex', gap: '0.4rem' }}>
                <button onClick={() => changeFont(-1)} aria-label="הקטן טקסט" style={iconButtonStyle}>A-</button>
                <button onClick={() => changeFont(1)} aria-label="הגדל טקסט" style={iconButtonStyle}>A+</button>
              </div>
            </div>

            <ToggleRow label="ניגודיות גבוהה" active={prefs.highContrast} onClick={() => toggle('highContrast')} />
            <ToggleRow label="הדגשת קישורים" active={prefs.underlineLinks} onClick={() => toggle('underlineLinks')} />
            <ToggleRow label="עצירת אנימציות" active={prefs.stopAnimations} onClick={() => toggle('stopAnimations')} />
            <ToggleRow label="גופן קריא" active={prefs.readableFont} onClick={() => toggle('readableFont')} />

            <button
              onClick={reset}
              style={{ marginTop: '0.5rem', padding: '0.6rem', borderRadius: '8px', border: '1px solid #ddd', background: '#f8f9fa', cursor: 'pointer', fontSize: '0.9rem' }}
            >
              איפוס הגדרות
            </button>

            <a href="/accessibility" style={{ textAlign: 'center', fontSize: '0.85rem', color: '#1a237e', marginTop: '0.3rem' }}>
              הצהרת נגישות
            </a>
          </div>
        </div>
      )}
    </>
  );
};

export default AccessibilityWidget;
