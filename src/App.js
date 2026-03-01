import React from 'react';
import LandingPage from './components/LandingPage';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainHomepage from './components/MainHomepage';
import UniversalLogin from './components/UniversalLogin';
import ParentRegistrationForm from './components/ParentRegistrationForm';
import ParentLogin from './components/ParentLogin';
import ParentDashboard from './components/ParentDashboard';
import KitchenQRScanner from './components/KitchenQRScanner';
import KitchenPOS from './components/KitchenPOS';
import SecretaryPanel from './components/SecretaryPanel';
import SuperAdminPanel from './components/SuperAdminPanel';
import MenuManagement from './components/MenuManagement';

import MobileParentApp from './components/MobileParentApp';
import MobileStudentApp from './components/MobileStudentApp';
import SchoolContactForm from './components/SchoolContactForm';

import './App.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          {/* דף הבית הראשי */}
          <Route path="/" element={<LandingPage />} />
          
          {/* כניסה משותפת - המערכת תזהה את סוג המשתמש */}
          <Route path="/login" element={<UniversalLogin />} />
          
          {/* הרשמת הורים חדשים */}
          <Route path="/register" element={<ParentRegistrationForm />} />
          
          {/* דשבורדים לכל סוג משתמש */}
          <Route path="/parent-dashboard" element={<ParentDashboard />} />
          <Route path="/kitchen-scanner" element={<KitchenQRScanner />} />
          <Route path="/kitchen-pos" element={<KitchenPOS />} />
          <Route path="/secretary-panel" element={<SecretaryPanel />} />
          <Route path="/admin" element={<SuperAdminPanel />} />
          <Route path="/menu-management" element={<MenuManagement />} />
          <Route path="/mobile/parent/:token" element={<MobileParentApp />} />
<Route path="/mobile/student/:token" element={<MobileStudentApp />} />
<Route path="/school-contact" element={<SchoolContactForm />} />
          
          
          {/* נתיבים ישנים (למקרה שיש קישורים קיימים) */}
          <Route path="/parent-login" element={<ParentLogin />} />
          
          {/* 404 - דף לא נמצא */}
          <Route path="*" element={<MainHomepage />} />
        </Routes>
      </div>
    </Router>
  );
}


export default App;