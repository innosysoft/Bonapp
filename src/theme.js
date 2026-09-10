// פלטת הצבעים המשותפת של BonApp - זהה לזו שכבר בשימוש בפאנל מטבח/מזכירה/קיוסק/דוחות
// (ראו secretary.css). קובץ זה מיועד לרכיבים ישנים שמשתמשים ב-inline style ולא ב-CSS
// custom properties, כדי שגם הם ישתמשו באותה פלטה בלי לשכפל קודי צבע בכל קובץ בנפרד.
const theme = {
  navy: '#17324a',
  blue: '#356b8c',
  green: '#75a843',
  paper: '#f4f7f7',
  white: '#fff',
  muted: '#607482',
  line: '#dce6e9',
  soft: '#eaf3f7',
  green2: '#eef6e9',
  orange: '#b87920',
  red: '#b94b4b',
  shadow: '0 8px 26px rgba(23, 50, 74, .08)',
  fontFamily: "'Heebo', Arial, sans-serif",
};

export default theme;
