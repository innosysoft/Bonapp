import React from 'react';

// רכיב תצוגה בלבד - לא מחזיק state, לא קורא ל-API, לא מחליט מה הפעולה.
// כל handler מגיע כ-prop מבחוץ ולא משתנה.
const IconButton = ({ onClick, disabled, ariaLabel, title, variant = 'default', type = 'button', children }) => (
  <button
    type={type}
    className={`bap-sec-icon-btn bap-sec-icon-btn--${variant}`}
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel || title}
    title={title}
  >
    {children}
  </button>
);

export default IconButton;
