import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout.jsx';
import { AdminDashboard } from './pages/AdminDashboard.jsx';
import { Login } from './pages/Login.jsx';
import { CustomerLogin } from './pages/CustomerLogin.jsx';
import { LeadManagement } from './pages/LeadManagement.jsx';
import { OrderManagement } from './pages/OrderManagement.jsx';
import { CustomerDashboard } from './pages/CustomerMainDashboard.jsx';
import { PartnerDashboard } from './pages/PartnerMainDashboard.jsx';
import { BookingFlow } from './pages/BookingFlow.jsx';
import { Home } from './pages/Home.jsx';
import { AboutUs } from './pages/AboutUs.jsx';
import { ContactUs } from './pages/ContactUs.jsx';
import { Services } from './pages/Services.jsx';
import { FAQ } from './pages/FAQ.jsx';
import { BecomePartner } from './pages/BecomePartner.jsx';
import { PublicLayout } from './components/PublicLayout.jsx';

// Import New Custom Admin Module Components
import { BookingsManagement } from './pages/BookingsManagement.jsx';
import { CustomersManagement } from './pages/CustomersManagement.jsx';
import { PartnersManagement } from './pages/PartnersManagement.jsx';
import { PartnerApplicationsManagement } from './pages/PartnerApplicationsManagement.jsx';
import { AuditLogsManagement } from './pages/AuditLogsManagement.jsx';
import { TemplatesManagement } from './pages/TemplatesManagement.jsx';
import { EnquiriesManagement } from './pages/EnquiriesManagement.jsx';
import { AnalyticsDashboard } from './pages/AnalyticsDashboard.jsx';
import { LocationIntelligence } from './pages/LocationIntelligence.jsx';
import { SettingsManagement } from './pages/SettingsManagement.jsx';

// Auth Check Helper
const isAuthenticated = () => !!(localStorage.getItem('rv_token') || sessionStorage.getItem('rv_token'));
const getUserRole = () => localStorage.getItem('rv_role');

const ProtectedRoute = ({ children, allowedRoles = [] }) => {
  if (!isAuthenticated()) return <Navigate to="/login" />;
  const role = getUserRole();
  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to="/" />;
  }
  return children;
};

function App() {
  return (
    <Router>
      <div className="app-container">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<PublicLayout><Home /></PublicLayout>} />
          <Route path="/about" element={<PublicLayout><AboutUs /></PublicLayout>} />
          <Route path="/contact" element={<PublicLayout><ContactUs /></PublicLayout>} />
          <Route path="/services" element={<PublicLayout><Services /></PublicLayout>} />
          <Route path="/faq" element={<PublicLayout><FAQ /></PublicLayout>} />
          <Route path="/become-partner" element={<PublicLayout><BecomePartner /></PublicLayout>} />
          
          <Route path="/login" element={<Login />} />
          <Route path="/customer-login" element={<CustomerLogin />} />
          <Route path="/book" element={<BookingFlow />} />
          
          {/* Customer Dashboard */}
          <Route path="/dashboard" element={
            <ProtectedRoute allowedRoles={['customer']}>
              <CustomerDashboard />
            </ProtectedRoute>
          } />
          
          {/* Partner Dashboard */}
          <Route path="/partner" element={<PartnerDashboard />} />
          
          {/* Admin Panel (Scoped) */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <Layout>
                <Routes>
                  <Route index element={<AdminDashboard />} />
                  <Route path="leads" element={<LeadManagement />} />
                  <Route path="orders" element={<OrderManagement />} />
                  <Route path="bookings" element={<BookingsManagement />} />
                  <Route path="customers" element={<CustomersManagement />} />
                  <Route path="partners" element={<PartnersManagement />} />
                  <Route path="partner-applications" element={<PartnerApplicationsManagement />} />
                  <Route path="audit-logs" element={<AuditLogsManagement />} />
                  <Route path="templates" element={<TemplatesManagement />} />
                  <Route path="enquiries" element={<EnquiriesManagement />} />
                  <Route path="analytics" element={<AnalyticsDashboard />} />
                  <Route path="location" element={<LocationIntelligence />} />
                  <Route path="settings" element={<SettingsManagement />} />
                  <Route path="*" element={<AdminDashboard />} />
                </Routes>
              </Layout>
            </ProtectedRoute>
          } />
          
          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
