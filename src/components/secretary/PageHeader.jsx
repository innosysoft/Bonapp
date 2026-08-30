import React from 'react';

// רכיב תצוגה בלבד - כותרת עמוד אחידה. badge/actions/children מגיעים מוכנים (כולל עיצוב) מהקוד הקורא.
// badge מוצג צמוד לכותרת עצמה (לדוגמה תג ספירה, ה-gap מגיע מ-.bap-sec-page-title);
// actions נשאר בצד הנגדי, מיועד לפעולות אמיתיות (כמו כפתור).
const PageHeader = ({ icon, title, description, badge, actions }) => (
  <div className="bap-sec-page-head">
    <div>
      <h2 className="bap-sec-page-title">
        {icon}
        {title}
        {badge}
      </h2>
      {description && <p className="bap-sec-page-desc">{description}</p>}
    </div>
    {actions && <div className="bap-sec-page-actions">{actions}</div>}
  </div>
);

export default PageHeader;
