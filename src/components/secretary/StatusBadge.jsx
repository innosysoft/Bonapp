import React from 'react';

// רכיב תצוגה בלבד. ה-tone (success/warning/danger/info/neutral) נקבע ע"י הקוד הקורא
// לפי הערך/הלוגיקה הקיימים - הרכיב עצמו לא מפרש סטטוסים ולא משנה נתונים.
const StatusBadge = ({ tone = 'neutral', children }) => (
  <span className={`bap-sec-badge bap-sec-badge--${tone}`}>
    <i className="bap-sec-badge-dot" aria-hidden="true" />
    {children}
  </span>
);

export default StatusBadge;
