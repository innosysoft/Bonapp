import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

// הדפדפן יורה את beforeinstallprompt פעם אחת בלבד, לפעמים לפני שהכפתור נטען -
// לכן ההאזנה ברמת המודול (נטען יחד עם האפליקציה), והכפתור רק נרשם לעדכונים.
let deferredPrompt = null;
const listeners = new Set();
const notify = () => listeners.forEach(fn => fn());

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    notify();
  });
  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    notify();
  });
}

const isStandalone = () =>
  typeof window !== 'undefined' &&
  (window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true);

const isIOS = () => /iphone|ipad|ipod/i.test(window.navigator.userAgent);

// onClick אופציונלי: אם נשלח, הכפתור רק מעוצב כמו שאר הכפתורים ופועל לפי ה-onClick (למשל
// "שלח לטלפון" אצל ההורה). בלי onClick - מתקין את האפליקציה במכשיר הנוכחי.
const InstallAppButton = ({ onClick, label = 'הורדת האפליקציה', className = '', compactBelow = 700 }) => {
  const [, force] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  useEffect(() => {
    const fn = () => force(n => n + 1);
    listeners.add(fn);
    return () => listeners.delete(fn);
  }, []);

  if (!onClick && isStandalone()) return null;

  const handleClick = async () => {
    if (onClick) return onClick();
    if (deferredPrompt) {
      deferredPrompt.prompt();
      try { await deferredPrompt.userChoice; } catch (e) { /* המשתמש סגר את החלון */ }
      deferredPrompt = null;
      notify();
      return;
    }
    setShowHelp(true);
  };

  return (
    <>
      <style>{`
        .bap-install-btn{display:inline-flex;align-items:center;justify-content:center;gap:8px;height:42px;padding:0 18px;border:0;border-radius:999px;background:linear-gradient(135deg,#3f7fcb,#2d62a3);color:#fff;font:600 15px 'Heebo',Arial,sans-serif;cursor:pointer;white-space:nowrap;flex-shrink:0;box-shadow:0 6px 16px rgba(51,112,185,.32);transition:transform .15s,box-shadow .15s,filter .15s}
        .bap-install-btn:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(51,112,185,.42);filter:brightness(1.05)}
        .bap-install-btn:focus-visible{outline:3px solid #75a843;outline-offset:2px}
        .bap-install-btn svg{flex-shrink:0}
        @media(max-width:${compactBelow}px){.bap-install-btn.compact-mobile{width:42px;padding:0}.bap-install-btn.compact-mobile span{display:none}}
        .bap-install-overlay{position:fixed;inset:0;background:rgba(15,37,71,.55);display:flex;align-items:center;justify-content:center;z-index:10000;padding:20px}
        .bap-install-modal{background:#fff;border-radius:18px;max-width:420px;width:100%;padding:26px;box-shadow:0 20px 60px rgba(0,0,0,.25);font-family:'Heebo',Arial,sans-serif;color:#0f2547;direction:rtl;text-align:right}
        .bap-install-modal h3{margin:0 0 12px;font-size:20px;display:flex;align-items:center;justify-content:space-between}
        .bap-install-modal p{margin:0 0 10px;line-height:1.6;color:#425f70}
        .bap-install-modal ol{margin:0 0 16px;padding-right:20px;line-height:1.8;color:#0f2547}
        .bap-install-close{border:0;background:transparent;cursor:pointer;color:#607482;display:grid;place-items:center;width:34px;height:34px;border-radius:8px}
        .bap-install-close:hover{background:#f4f7f7}
        .bap-install-ok{width:100%;height:46px;border:0;border-radius:12px;background:#3370b9;color:#fff;font:700 16px 'Heebo',Arial,sans-serif;cursor:pointer}
      `}</style>

      <button type="button" className={`bap-install-btn compact-mobile ${className}`} onClick={handleClick} title={label} aria-label={label}>
        <Download size={18} />
        <span>{label}</span>
      </button>

      {showHelp && (
        <div className="bap-install-overlay" onClick={() => setShowHelp(false)}>
          <div className="bap-install-modal" role="dialog" aria-modal="true" aria-label="הוספת האפליקציה למכשיר" onClick={(e) => e.stopPropagation()}>
            <h3>
              הוספת האפליקציה למכשיר
              <button type="button" className="bap-install-close" aria-label="סגור" onClick={() => setShowHelp(false)}><X size={20} /></button>
            </h3>
            <p>האפליקציה נפתחת מהמסך הראשי של המכשיר, כמו כל אפליקציה, בלי חנות אפליקציות.</p>
            {isIOS() ? (
              <ol>
                <li>פתחו את האתר בדפדפן Safari.</li>
                <li>לחצו על כפתור השיתוף (הריבוע עם החץ למעלה).</li>
                <li>בחרו "הוסף למסך הבית".</li>
              </ol>
            ) : (
              <ol>
                <li>פתחו את תפריט הדפדפן (שלוש הנקודות בפינה).</li>
                <li>בחרו "התקן אפליקציה" או "הוסף למסך הבית".</li>
                <li>אשרו את ההתקנה.</li>
              </ol>
            )}
            <button type="button" className="bap-install-ok" onClick={() => setShowHelp(false)}>הבנתי</button>
          </div>
        </div>
      )}
    </>
  );
};

export default InstallAppButton;
