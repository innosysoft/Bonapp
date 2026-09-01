import React from 'react';
import LandingPage from './components/LandingPage';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import MainHomepage from './components/MainHomepage';
import UniversalLogin from './components/UniversalLogin';
import ResetPasswordPage from './components/ResetPasswordPage';
import ParentRegistrationForm from './components/ParentRegistrationForm';
import ParentLogin from './components/ParentLogin';
import ParentDashboard from './components/ParentDashboard';
import KitchenQRScanner from './components/KitchenQRScanner';
import KitchenPOS from './components/KitchenPOS';
import SecretaryPanel from './components/SecretaryPanel';
import SuperAdminPanel from './components/SuperAdminPanel';
import MenuManagement from './components/MenuManagement';
import SelfServiceKiosk from './components/SelfServiceKiosk';
import PaymentSuccess from './components/PaymentSuccess';
import MobileParentApp from './components/MobileParentApp';
import MobileStudentApp from './components/MobileStudentApp';
import SchoolContactForm from './components/SchoolContactForm';
import SupportPage from './components/SupportPage';
import ContactPage from './components/ContactPage';
import AboutPage from './components/AboutPage';
import TermsOfUsePage from './components/TermsOfUsePage';
import PrivacyPolicyPage from './components/PrivacyPolicyPage';
import SchoolPolicyPage from './components/SchoolPolicyPage';
import WhatsAppSupportButton from './components/WhatsAppSupportButton';
import AccessibilityWidget from './components/AccessibilityWidget';
import AccessibilityStatementPage from './components/AccessibilityStatementPage';

import './App.css';

// מסך הקיוסק הוא נעול במכוון - הווידג'טים הצפים האלה יוצרים דרך יציאה לא מתוכננת ממנו
const GlobalWidgets = () => {
  const location = useLocation();
  if (location.pathname === '/self-service-kiosk') return null;
  return (
    <>
      <WhatsAppSupportButton />
      <AccessibilityWidget />
    </>
  );
};

function App() {
  return (
    <Router>
      <div className="App">
        <GlobalWidgets />
        <Routes>
          {/* דף הבית הראשי */}
          <Route path="/" element={<LandingPage />} />
          
          {/* כניסה משותפת - המערכת תזהה את סוג המשתמש */}
          <Route path="/login" element={<UniversalLogin />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          
          {/* הרשמת הורים חדשים */}
          <Route path="/register" element={<ParentRegistrationForm />} />
          
          {/* דשבורדים לכל סוג משתמש */}
          <Route path="/parent-dashboard" element={<ParentDashboard />} />
          <Route path="/kitchen-scanner" element={<KitchenQRScanner />} />
          <Route path="/kitchen-pos" element={<KitchenPOS />} />
          <Route path="/secretary-panel" element={<SecretaryPanel />} />
          <Route path="/admin" element={<SuperAdminPanel />} />
          <Route path="/menu-management" element={<MenuManagement />} />
          <Route path="/self-service-kiosk" element={<SelfServiceKiosk />} />
          <Route path="/mobile/parent/:token" element={<MobileParentApp />} />
<Route path="/mobile/student/:token" element={<MobileStudentApp />} />
<Route path="/school-contact" element={<SchoolContactForm />} />
 <Route path="/payment-success" element={<PaymentSuccess />} />  
 <Route path="/support" element={<SupportPage />} />
<Route path="/contact" element={<ContactPage />} />
<Route path="/about" element={<AboutPage />} />
<Route path="/terms" element={<TermsOfUsePage />} />
<Route path="/privacy" element={<PrivacyPolicyPage />} />
<Route path="/school-policy" element={<SchoolPolicyPage />} />
<Route path="/accessibility" element={<AccessibilityStatementPage />} />
          
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