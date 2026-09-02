import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getKitchenOrders, completeKitchenOrder, getSchools } from '../api';
import { ChefHat, CheckCircle, Printer, LogOut, Clock } from 'lucide-react';

// מסך ייצור/מטבח - רשימת הזמנות ממתינות בגדול וברור, מתעדכן אוטומטית כל כמה שניות
// (אין תשתית real-time בפרויקט, אז רענון שקט ברקע הוא הפתרון הפשוט והאמין ביותר).
// הדפסה מתבצעת דרך דיאלוג ההדפסה של הדפדפן לכרטיס בגודל קבלה - עובד באותה צורה בין אם
// המדפסת מחוברת USB לעמדה או מוגדרת ברשת, כי בשני המקרים היא מוגדרת ברמת המחשב/העמדה.
const POLL_INTERVAL_MS = 4000;

const ProductionDisplay = () => {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [schoolName, setSchoolName] = useState('');
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completingId, setCompletingId] = useState(null);
  const [printOrder, setPrintOrder] = useState(null);
  const pollRef = useRef(null);

  const loadOrders = useCallback(async (schoolId) => {
    try {
      const result = await getKitchenOrders(schoolId, 'pending');
      if (result.success) setOrders(result.orders);
    } catch (error) {
      console.error('Error loading kitchen orders:', error);
    }
  }, []);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user || !['production', 'kitchen', 'secretary', 'admin', 'super_admin'].includes(user.type)) {
      navigate('/login');
      return;
    }
    setCurrentUser(user);

    (async () => {
      try {
        const schoolsData = await getSchools();
        if (schoolsData.success) {
          const school = schoolsData.schools.find(s => s.id === user.school_id);
          if (school) setSchoolName(school.name);
        }
      } catch (error) {
        console.error('Error loading school:', error);
      }
      await loadOrders(user.school_id);
      setLoading(false);
    })();

    pollRef.current = setInterval(() => loadOrders(user.school_id), POLL_INTERVAL_MS);
    return () => clearInterval(pollRef.current);
  }, [navigate, loadOrders]);

  const handleComplete = async (orderId) => {
    setCompletingId(orderId);
    try {
      const result = await completeKitchenOrder(orderId);
      if (result.success) {
        setOrders(prev => prev.filter(o => o.id !== orderId));
      } else {
        alert(result.message || 'שגיאה בסגירת הזמנה');
      }
    } catch (error) {
      alert('שגיאה בסגירת הזמנה');
    } finally {
      setCompletingId(null);
    }
  };

  const handlePrint = (order) => {
    setPrintOrder(order);
    setTimeout(() => {
      window.print();
      setPrintOrder(null);
    }, 50);
  };

  const handleLogout = () => {
    localStorage.removeItem('currentUser');
    localStorage.removeItem('authToken');
    navigate('/login');
  };

  if (loading) {
    return (
      <div className="bap-prod">
        <style>{`.bap-prod{--navy:#17324a;--blue:#356b8c;--green:#75a843;--paper:#f4f7f7;font-family:'Heebo',Arial,sans-serif;color:var(--navy);background:var(--paper);min-height:100vh;display:flex;align-items:center;justify-content:center;font-size:20px}`}</style>
        טוען הזמנות...
      </div>
    );
  }

  return (
    <div className="bap-prod">
      <style>{`
        .bap-prod{
          --navy:#17324a;--blue:#356b8c;--green:#75a843;--green2:#eef6e9;--paper:#f4f7f7;
          --white:#fff;--muted:#607482;--line:#dce6e9;--warn:#b9812e;
          font-family:'Heebo',Arial,sans-serif;color:var(--navy);background:var(--paper);
          min-height:100vh;
        }
        .bap-prod *{box-sizing:border-box}
        .bap-prod button{font:inherit}
        .bap-prod .top{
          min-height:84px;background:#fff;border-bottom:1px solid var(--line);
          display:flex;align-items:center;justify-content:space-between;padding:16px 32px;flex-wrap:wrap;gap:12px;
        }
        .bap-prod .brand{display:flex;align-items:center;gap:14px}
        .bap-prod .brand-icon{width:52px;height:52px;border-radius:14px;background:var(--blue);color:#fff;display:grid;place-items:center;flex-shrink:0}
        .bap-prod .brand h1{font-size:22px;margin:0;color:var(--navy)}
        .bap-prod .brand .sub{color:var(--muted);font-size:14px}
        .bap-prod .count-pill{background:var(--green2);color:var(--green);border-radius:20px;padding:8px 18px;font-weight:700;font-size:18px}
        .bap-prod .logout-btn{border:1px solid var(--line);background:#fff;color:var(--navy);border-radius:10px;padding:10px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;font-weight:600}
        .bap-prod .logout-btn:hover{background:var(--paper)}

        .bap-prod .grid{
          padding:24px 32px;display:grid;grid-template-columns:repeat(auto-fill,minmax(320px,1fr));gap:20px;
        }
        .bap-prod .empty{padding:80px 20px;text-align:center;color:var(--muted);font-size:20px}
        .bap-prod .order-card{
          background:#fff;border:2px solid var(--line);border-radius:20px;padding:22px;
          box-shadow:0 6px 20px rgba(23,50,74,.07);display:flex;flex-direction:column;gap:14px;
        }
        .bap-prod .order-head{display:flex;justify-content:space-between;align-items:flex-start}
        .bap-prod .order-number{font-size:38px;font-weight:800;color:var(--blue);line-height:1}
        .bap-prod .order-time{display:flex;align-items:center;gap:6px;color:var(--muted);font-size:13px}
        .bap-prod .order-student{font-size:18px;font-weight:700;color:var(--navy)}
        .bap-prod .order-items{display:flex;flex-direction:column;gap:8px}
        .bap-prod .order-item{background:var(--paper);border-radius:10px;padding:10px 14px}
        .bap-prod .order-item-name{font-size:17px;font-weight:700}
        .bap-prod .order-item-addons{font-size:14px;color:var(--muted);margin-top:2px}
        .bap-prod .order-actions{display:flex;gap:10px;margin-top:auto}
        .bap-prod .btn{border:none;border-radius:12px;padding:14px;font-weight:700;font-size:16px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:8px}
        .bap-prod .btn-complete{background:var(--green);color:#fff;flex:1}
        .bap-prod .btn-complete:hover{filter:brightness(.95)}
        .bap-prod .btn-complete:disabled{opacity:.6;cursor:not-allowed}
        .bap-prod .btn-print{background:#fff;border:1px solid var(--line);color:var(--navy)}
        .bap-prod .btn-print:hover{background:var(--paper)}

        .bap-prod .print-ticket{display:none}
        @media print {
          .bap-prod .top, .bap-prod .grid{display:none !important}
          .bap-prod .print-ticket{display:block !important;width:280px;padding:12px;font-family:monospace}
          .bap-prod .print-ticket h2{text-align:center;font-size:20px;margin:0 0 8px}
          .bap-prod .print-ticket .pt-num{text-align:center;font-size:32px;font-weight:800;margin:8px 0}
          .bap-prod .print-ticket .pt-line{border-top:1px dashed #000;margin:8px 0}
          .bap-prod .print-ticket .pt-item{font-size:15px;margin:4px 0}
          .bap-prod .print-ticket .pt-addon{font-size:13px;padding-right:12px;color:#333}
        }
      `}</style>

      <header className="top">
        <div className="brand">
          <div className="brand-icon"><ChefHat size={26} /></div>
          <div>
            <h1>מסך ייצור</h1>
            <div className="sub">{schoolName || 'בית ספר'} · {currentUser?.name}</div>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <div className="count-pill">{orders.length} הזמנות ממתינות</div>
          <button className="logout-btn" onClick={handleLogout}>
            <LogOut size={18} />
            יציאה
          </button>
        </div>
      </header>

      {orders.length === 0 ? (
        <div className="empty">אין הזמנות ממתינות כרגע</div>
      ) : (
        <div className="grid">
          {orders.map(order => (
            <div key={order.id} className="order-card">
              <div className="order-head">
                <div>
                  <div className="order-number">#{order.order_number}</div>
                  <div className="order-student">{order.student_name || 'תלמיד'}</div>
                </div>
                <div className="order-time">
                  <Clock size={14} />
                  {new Date(order.created_at).toLocaleTimeString('he-IL', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>

              <div className="order-items">
                {(order.items || []).map((item, idx) => (
                  <div key={idx} className="order-item">
                    <div className="order-item-name">{item.quantity}x {item.name}</div>
                    {item.addons && item.addons.length > 0 && (
                      <div className="order-item-addons">+ {item.addons.join(', ')}</div>
                    )}
                  </div>
                ))}
              </div>

              <div className="order-actions">
                <button
                  className="btn btn-complete"
                  disabled={completingId === order.id}
                  onClick={() => handleComplete(order.id)}
                >
                  <CheckCircle size={20} />
                  הושלם
                </button>
                <button className="btn btn-print" onClick={() => handlePrint(order)} title="הדפס כרטיס">
                  <Printer size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {printOrder && (
        <div className="print-ticket">
          <h2>BonApp</h2>
          <div className="pt-num">#{printOrder.order_number}</div>
          <div className="pt-line" />
          <div className="pt-item">{printOrder.student_name}</div>
          <div className="pt-line" />
          {(printOrder.items || []).map((item, idx) => (
            <div key={idx}>
              <div className="pt-item">{item.quantity}x {item.name}</div>
              {item.addons && item.addons.length > 0 && (
                <div className="pt-addon">+ {item.addons.join(', ')}</div>
              )}
            </div>
          ))}
          <div className="pt-line" />
          <div className="pt-item">{new Date(printOrder.created_at).toLocaleString('he-IL')}</div>
        </div>
      )}
    </div>
  );
};

export default ProductionDisplay;
