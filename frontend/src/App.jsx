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
          <Route path="/" element={<Home />} />
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
          <Route path="/partner" element={
            <ProtectedRoute allowedRoles={['partner']}>
              <PartnerDashboard />
            </ProtectedRoute>
          } />
          
          {/* Admin Panel (Scoped) */}
          <Route path="/admin/*" element={
            <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
              <Layout>
                <Routes>
                  <Route index element={<AdminDashboard />} />
                  <Route path="leads" element={<LeadManagement />} />
                  <Route path="orders" element={<OrderManagement />} />
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
