import React from 'react';

// רכיב תצוגה בלבד - לא מחליט מתי להציג את עצמו (הקוד הקורא שולט בתנאי).
const EmptyState = ({ icon, title, description }) => (
  <div className="bap-sec-empty">
    {icon && <div className="bap-sec-empty-icon">{icon}</div>}
    {title && <h3>{title}</h3>}
    {description && <p>{description}</p>}
  </div>
);

export default EmptyState;
