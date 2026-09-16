import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getMenuItems, getSchools } from '../api';
import { ArrowRight, UtensilsCrossed, X } from 'lucide-react';

// תצוגה בלבד של תפריט הקיוסק, נגישה מפאנל ההורה - בלי עגלה, בלי קופה, בלי אפשרות
// לבצע רכישה. מיועדת רק כדי שההורה יראה מה יש בתפריט ואיך זה נראה, בדיוק כמו הקיוסק
// עצמו (אותן תמונות/קטגוריות/תוספות), בלי לגעת בשום דבר בזרימת התשלום/רכישה בפועל -
// רכישה אמיתית ממשיכה לקרות רק בעמדה הפיזית עם זיהוי תלמיד.
const ParentMenuPreview = () => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState([]);
  const [schoolName, setSchoolName] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [loading, setLoading] = useState(true);
  const [addonItem, setAddonItem] = useState(null);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser') || 'null');
    if (!user || user.type !== 'parent') {
      navigate('/login');
      return;
    }

    (async () => {
      try {
        const [menuData, schoolsData] = await Promise.all([
          getMenuItems(user.school_id),
          getSchools()
        ]);
        if (menuData.success) {
          const items = menuData.menuItems || [];
          setMenuItems(items);
          const categories = [...new Set(items.filter(i => i.available).map(i => i.category))];
          setSelectedCategory(categories[0] || '');
        }
        if (schoolsData.success) {
          const school = schoolsData.schools.find(s => s.id === user.school_id);
          if (school) setSchoolName(school.name);
        }
      } catch (error) {
        console.error('Error loading menu preview:', error);
      } finally {
        setLoading(false);
      }
    })();
  }, [navigate]);

  const categories = [...new Set(menuItems.filter(i => i.available).map(i => i.category))];
  const itemsInCategory = menuItems.filter(i => i.available && i.category === selectedCategory);

  return (
    <div className="bap-menu-preview">
      <style>{`
        .bap-menu-preview{
          --navy:#17324a;--blue:#356b8c;--green:#75a843;--green2:#eef6e9;--paper:#f4f7f7;
          --white:#fff;--muted:#607482;--line:#dce6e9;--shadow:0 10px 30px rgba(23,50,74,.1);
          font-family:'Heebo',Arial,sans-serif;color:var(--navy);background:var(--white);
          min-height:100vh;
        }
        .bap-menu-preview *{box-sizing:border-box}
        .bap-menu-preview button{font:inherit}
        .bap-menu-preview .top{
          min-height:84px;background:#fff;border-bottom:1px solid var(--line);
          display:flex;align-items:center;justify-content:space-between;padding:16px 32px;flex-wrap:wrap;gap:12px;
        }
        .bap-menu-preview .brand{display:flex;align-items:center;gap:14px}
        .bap-menu-preview .brand-icon{width:52px;height:52px;border-radius:14px;background:var(--green);color:#fff;display:grid;place-items:center;flex-shrink:0}
        .bap-menu-preview .brand h1{font-size:22px;margin:0;color:var(--navy)}
        .bap-menu-preview .brand .sub{color:var(--muted);font-size:14px}
        .bap-menu-preview .back-btn{border:1px solid var(--line);background:#fff;color:var(--navy);border-radius:10px;padding:10px 16px;cursor:pointer;display:inline-flex;align-items:center;gap:8px;font-weight:600}
        .bap-menu-preview .back-btn:hover{background:var(--paper)}
        .bap-menu-preview .view-note{background:var(--green2);color:var(--green);text-align:center;padding:10px;font-weight:600;font-size:14px}

        .bap-menu-preview .content{width:min(1200px,calc(100% - 48px));margin:26px auto}
        .bap-menu-preview .categories{display:flex;gap:9px;overflow-x:auto;padding-bottom:10px;-webkit-overflow-scrolling:touch}
        .bap-menu-preview .cat{height:44px;padding:0 20px;border:1px solid var(--line);background:#fff;border-radius:999px;color:var(--muted);font-weight:600;white-space:nowrap;cursor:pointer;flex-shrink:0}
        .bap-menu-preview .cat.active{background:var(--blue);border-color:var(--blue);color:#fff}

        .bap-menu-preview .grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:18px;margin-top:16px}
        .bap-menu-preview .meal{background:#fff;border:1px solid var(--line);border-radius:18px;overflow:hidden;box-shadow:var(--shadow);text-align:right}
        .bap-menu-preview .meal-photo{height:150px;background-position:center;background-size:cover;background-color:var(--green2);display:flex;align-items:center;justify-content:center;color:var(--green)}
        .bap-menu-preview .meal-photo img{width:100%;height:100%;object-fit:cover}
        .bap-menu-preview .meal-body{padding:14px 16px}
        .bap-menu-preview .meal-body strong{display:block;font-size:17px}
        .bap-menu-preview .meal-body small{color:var(--muted);font-size:13px;display:block;margin-top:2px}
        .bap-menu-preview .meal-bottom{display:flex;justify-content:space-between;align-items:center;margin-top:10px}
        .bap-menu-preview .meal-price{font-size:19px;color:var(--blue);font-weight:700}
        .bap-menu-preview .addon-link{background:none;border:none;color:var(--green);font-weight:600;font-size:13px;cursor:pointer;padding:0}
        .bap-menu-preview .empty-note{text-align:center;padding:60px 20px;color:var(--muted);font-size:18px}

        .bap-menu-preview .modal-overlay{position:fixed;inset:0;background:rgba(23,50,74,.6);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px}
        .bap-menu-preview .addon-modal{background:#fff;border-radius:20px;padding:28px;width:100%;max-width:560px;max-height:80vh;overflow-y:auto;box-shadow:0 20px 60px rgba(0,0,0,.3)}
        .bap-menu-preview .addon-modal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:4px}
        .bap-menu-preview .addon-modal-head h3{margin:0;font-size:20px;color:var(--navy)}
        .bap-menu-preview .addon-close{background:var(--paper);border:none;border-radius:50%;width:36px;height:36px;display:grid;place-items:center;cursor:pointer;color:var(--navy)}
        .bap-menu-preview .addon-hint{color:var(--muted);margin:0 0 16px;font-size:14px}
        .bap-menu-preview .addon-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));gap:12px}
        .bap-menu-preview .addon-tile{background:var(--paper);border:2px solid var(--line);border-radius:14px;padding:12px;display:flex;flex-direction:column;align-items:center;gap:6px;text-align:center}
        .bap-menu-preview .addon-photo{width:56px;height:56px;border-radius:12px;background:#fff;display:grid;place-items:center;color:var(--muted);overflow:hidden}
        .bap-menu-preview .addon-photo img{width:100%;height:100%;object-fit:cover}
        .bap-menu-preview .addon-name{font-weight:700;color:var(--navy);font-size:14px}
        .bap-menu-preview .addon-price{color:var(--green);font-weight:700;font-size:13px}
      `}</style>

      <header className="top">
        <div className="brand">
          <div className="brand-icon"><UtensilsCrossed size={26} /></div>
          <div>
            <h1>תפריט הקיוסק</h1>
            <div className="sub">{schoolName || 'בית ספר'}</div>
          </div>
        </div>
        <button className="back-btn" onClick={() => navigate('/parent-dashboard')}>
          <ArrowRight size={18} />
          חזרה לפאנל
        </button>
      </header>

      <div className="view-note">תצוגה בלבד - כדי לבצע רכישה יש להזדהות בעמדת הקיוסק בבית הספר</div>

      <div className="content">
        {loading ? (
          <div className="empty-note">טוען תפריט...</div>
        ) : categories.length === 0 ? (
          <div className="empty-note">אין תפריט זמין כרגע</div>
        ) : (
          <>
            <nav className="categories" aria-label="קטגוריות">
              {categories.map(cat => (
                <button
                  key={cat}
                  className={`cat ${selectedCategory === cat ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </nav>

            {itemsInCategory.length === 0 ? (
              <div className="empty-note">אין מנות זמינות בקטגוריה זו</div>
            ) : (
              <section className="grid">
                {itemsInCategory.map(item => (
                  <div key={item.id} className="meal">
                    <div className="meal-photo">
                      {item.image_url ? <img src={item.image_url} alt="" /> : <UtensilsCrossed size={40} />}
                    </div>
                    <div className="meal-body">
                      <strong>{item.name}</strong>
                      {(item.description || item.category) && <small>{item.description || item.category}</small>}
                      <div className="meal-bottom">
                        <span className="meal-price">₪{item.price.toFixed(2)}</span>
                        {item.addons && item.addons.length > 0 && (
                          <button className="addon-link" onClick={() => setAddonItem(item)}>
                            תוספות זמינות
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </section>
            )}
          </>
        )}
      </div>

      {addonItem && (
        <div className="modal-overlay" onClick={() => setAddonItem(null)}>
          <div className="addon-modal" onClick={(e) => e.stopPropagation()}>
            <div className="addon-modal-head">
              <h3>תוספות ל{addonItem.name}</h3>
              <button className="addon-close" onClick={() => setAddonItem(null)} aria-label="סגירה">
                <X size={20} />
              </button>
            </div>
            <p className="addon-hint">תוספות זמינות למנה זו בקיוסק</p>
            <div className="addon-grid">
              {(addonItem.addons || []).map(addon => (
                <div key={addon.id} className="addon-tile">
                  <div className="addon-photo">
                    {addon.image_url ? <img src={addon.image_url} alt="" /> : <UtensilsCrossed size={24} />}
                  </div>
                  <div className="addon-name">{addon.name}</div>
                  {parseFloat(addon.price_delta) > 0 && (
                    <div className="addon-price">+₪{parseFloat(addon.price_delta).toFixed(2)}</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentMenuPreview;
