import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, Package, CheckCircle2, Clock, LogOut, RefreshCw,
  Smartphone, ArrowRight, MapPin, Star, TrendingUp, IndianRupee,
  Shield, Key, Mail, Eye, EyeOff, AlertCircle, Lock, User,
  Settings, ChevronRight, X, MessageSquare, AlertTriangle, FileText,
  Phone, UserCheck
} from 'lucide-react';
import { getApiBaseUrl } from '../utils/apiBase';

const STATUS_COLOR = {
  'Assigned to Partner': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Pickup Scheduled': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Picked Up': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Device Received': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Repair Ongoing': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Completed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Delivered': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Closed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Cancelled': 'bg-red-500/10 text-red-400 border-red-500/20'
};

const QUOTE_STATUS_META = {
  'Approved by Customer': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Awaiting Customer Approval': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Rejected by Customer': 'bg-red-500/10 text-red-400 border-red-500/20',
  'Not Issued': 'bg-slate-500/10 text-slate-300 border-slate-500/20'
};

const getPartnerQuoteStatusLabel = (order) => {
  if (order.quotationStatus === 'Approved by Customer' || order.status === 'Partner Locked') {
    return 'Customer Accepted';
  }
  if (order.quotationStatus === 'Rejected by Customer') {
    return 'Customer Rejected';
  }
  if (order.quotationStatus === 'Awaiting Customer Approval') {
    return 'Awaiting Customer Approval';
  }
  return 'No Customer Decision';
};

const getPartnerQuoteStatusClass = (order) =>
  QUOTE_STATUS_META[
    order.quotationStatus === 'Approved by Customer' || order.status === 'Partner Locked'
      ? 'Approved by Customer'
      : (order.quotationStatus || 'Not Issued')
  ] || QUOTE_STATUS_META['Not Issued'];

export const PartnerDashboard = () => {
  const navigate = useNavigate();
  const apiBaseUrl = getApiBaseUrl();
  const isPartnerRole = (role) => role === 'partner' || role === 'Technician';
  
  // Auth State
  const [isAuth, setIsAuth] = useState(!!localStorage.getItem('rv_token') && isPartnerRole(localStorage.getItem('rv_role')));
  const [authView, setAuthView] = useState('login'); // 'login', 'forgot', 'reset'
  const [loginId, setLoginId] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPass, setResetNewPass] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Layout Tab State
  const [activeTab, setActiveTab] = useState('dashboard'); // 'dashboard', 'assigned', 'ongoing', 'completed', 'feedback', 'profile'
  
  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modeFilter, setModeFilter] = useState('');

  // Dashboard Data State
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ assigned: 0, active: 0, pending: 0, completed: 0, payouts: 0, notifications: 0 });
  const [orders, setOrders] = useState([]);
  const [quoteRequests, setQuoteRequests] = useState([]);
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [toast, setToast] = useState(null);

  // Quote Modal State
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteTargetId, setQuoteTargetId] = useState(null);
  const [quoteNotes, setQuoteNotes] = useState('');
  const [quoteForm, setQuoteForm] = useState({ amount: '', eta: '24-48 hours', warranty: '3 Months' });

  // Modal / Interaction State
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [customNote, setCustomNote] = useState('');
  const [modalStatusSelect, setModalStatusSelect] = useState('');

  // Profile forms
  const [profName, setProfName] = useState('');
  const [profEmail, setProfEmail] = useState('');
  const [profPhone, setProfPhone] = useState('');
  const [profSpec, setProfSpec] = useState('');
  const [profAreas, setProfAreas] = useState('');

  // Password update
  const [profOldPass, setProfOldPass] = useState('');
  const [profNewPass, setProfNewPass] = useState('');
  const [profConfirmPass, setProfConfirmPass] = useState('');

  // Partner Feedback Form
  const [pfOrderQuality, setPfOrderQuality] = useState(5);
  const [pfCustCoop, setPfCustCoop] = useState(5);
  const [pfAdminCoord, setPfAdminCoord] = useState(5);
  const [pfDeviceCond, setPfDeviceCond] = useState('Good');
  const [pfPartsNotes, setPfPartsNotes] = useState('');
  const [feedbackSubmittedForJob, setFeedbackSubmittedForJob] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('rv_user');
    const token = localStorage.getItem('rv_token');
    const role = localStorage.getItem('rv_role');
    if (stored && token && isPartnerRole(role)) {
      const parsedUser = JSON.parse(stored);
      setUser(parsedUser);
      setIsAuth(true);
      fetchData(token);
    } else {
      setIsAuth(false);
      setLoading(false);
    }
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchData = async (overrideToken) => {
    const token = overrideToken || localStorage.getItem('rv_token');
    if (!token) return;
    setLoading(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [meRes, statsRes, ordersRes, fbRes, quoteReqRes] = await Promise.all([
        fetch(`${apiBaseUrl}/technician-auth/me`, { headers }),
        fetch(`${apiBaseUrl}/technicians/dashboard-stats`, { headers }),
        fetch(`${apiBaseUrl}/technicians/my-orders`, { headers }),
        fetch(`${apiBaseUrl}/feedback/my`, { headers }),
        fetch(`${apiBaseUrl}/technicians/quote-requests`, { headers })
      ]);

      const meData = await meRes.json();
      const statsData = await statsRes.json();
      const ordersData = await ordersRes.json();
      const fbData = await fbRes.json();
      const quoteReqData = await quoteReqRes.json();

      if (meData.success) {
        const u = meData.data;
        setUser(u);
        setProfName(u.name || '');
        setProfEmail(u.email || '');
        setProfPhone(u.phone || '');
        setProfSpec(u.specialization || '');
        setProfAreas(u.serviceAreas || '');
      }

      if (statsData.success) {
        setStats(statsData.data || { assigned: 0, active: 0, pending: 0, completed: 0, payouts: 0, notifications: 0 });
      }

      if (ordersData.success) {
        setOrders(ordersData.data || []);
      }

      if (fbData.success) {
        setFeedbacks(fbData.data || []);
      }
      if (quoteReqData.success) {
        setQuoteRequests(quoteReqData.data || []);
      }

    } catch (err) {
      showToast('Offline Mode: Loaded Sandbox Mock Environment Data', 'info');
      // demo fallbacks
      setStats({ assigned: 5, active: 2, pending: 1, completed: 42, payouts: 18500, notifications: 3 });
      setFeedbacks([
        {
          _id: 'fb-1',
          createdAt: new Date(),
          orderId: 'REF-82194',
          orderQuality: 5,
          customerCooperation: 5,
          deviceCondition: 'Excellent',
          partsNotes: 'Replaced OEM screen, customer was friendly'
        }
      ]);
      setOrders([
        {
          _id: 'p-demo-1',
          referenceNumber: 'REF-82194',
          deviceBrand: 'Apple',
          deviceModel: 'iPhone 14 Pro',
          status: 'Repair Ongoing',
          repairTypes: ['Screen Replacement'],
          serviceType: 'pickup',
          partnerRemarks: [{ note: 'Started disassembly. Screen frame cleaned.', date: new Date() }],
          customerName: 'Aarav Mehta',
          customerPhone: '9810293847',
          address: 'Block 4C, Dwarka Sector 12',
          city: 'New Delhi',
          state: 'Delhi',
          pincode: '110075',
          partnerPayout: 4500,
          timeline: [
            { stage: 'Assigned to Partner', note: 'Order routed to Sharma Tech Services.', date: new Date(Date.now() - 43200000) },
            { stage: 'Confirmed', note: 'Partner accepted the assignment.', date: new Date(Date.now() - 36000000) },
            { stage: 'Picked Up', note: 'Device safely collected by dispatch.', date: new Date(Date.now() - 18000000) }
          ]
        },
        {
          _id: 'p-demo-2',
          referenceNumber: 'REF-72013',
          deviceBrand: 'Samsung',
          deviceModel: 'Galaxy S23',
          status: 'Assigned to Partner',
          repairTypes: ['Battery Replacement'],
          serviceType: 'dropoff',
          customerName: 'Rohan Verma',
          customerPhone: '9876543210',
          address: 'Main Market, Kothrud',
          city: 'Pune',
          state: 'Maharashtra',
          pincode: '411038',
          partnerPayout: 1800,
          timeline: [
            { stage: 'Assigned to Partner', note: 'Order assigned.', date: new Date() }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handlePartnerLogin = async (e) => {
    e.preventDefault();
    if (!loginId || !loginPassword) {
      setAuthError('Please enter email/phone and password');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch(`${apiBaseUrl}/technician-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: loginId, password: loginPassword })
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setAuthError(data.message || 'Invalid credentials');
        setAuthLoading(false);
        return;
      }
      
      localStorage.setItem('rv_partner_token', data.token);
      localStorage.setItem('rv_token', data.token);
      localStorage.setItem('rv_role', 'partner');
      localStorage.setItem('rv_user', JSON.stringify(data.data));
      localStorage.setItem('rv_partner', JSON.stringify(data.data));
      setUser(data.data);

      if (data.mustResetPassword) {
        setForgotEmail(data.data?.email || loginId);
        setAuthView('reset');
        setAuthError('Security Required: Admin-assigned password reset required');
        setAuthLoading(false);
        return;
      }

      setIsAuth(true);
      fetchData(data.token);
    } catch (err) {
      setAuthError('Connection failed. Please check if backend is running.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail) {
      setAuthError('Email address is required');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch(`${apiBaseUrl}/technician-auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail })
      });
      const data = await res.json();
      if (data.success) {
        setAuthView('reset');
        setAuthError('OTP has been dispatched. Enter OTP and new password.');
      } else {
        setAuthError(data.message || 'Verification email could not be sent');
      }
    } catch (err) {
      setAuthError('Server communication error.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!forgotEmail || !resetOtp || !resetNewPass) {
      setAuthError('All fields are required');
      return;
    }
    if (resetNewPass.length < 8) {
      setAuthError('New password must be at least 8 characters long');
      return;
    }
    setAuthLoading(true);
    setAuthError('');
    try {
      const res = await fetch(`${apiBaseUrl}/technician-auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail, otp: resetOtp, newPassword: resetNewPass })
      });
      const data = await res.json();
      if (data.success) {
        setAuthView('login');
        setAuthError('Password successfully updated! Please log in now.');
        setResetOtp('');
        setResetNewPass('');
      } else {
        setAuthError(data.message || 'OTP verification failed');
      }
    } catch (err) {
      setAuthError('Network error. Failed to update password.');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${apiBaseUrl}/technician-auth/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: profName,
          phone: profPhone,
          specialization: profSpec,
          serviceAreas: profAreas
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Profile credentials successfully saved!', 'success');
        fetchData();
      } else {
        showToast(data.message || 'Error updating profile', 'error');
      }
    } catch {
      showToast('Profile updated locally.', 'success');
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (profNewPass !== profConfirmPass) {
      showToast('Passwords do not match', 'error');
      return;
    }
    if (profNewPass.length < 8) {
      showToast('Min 8 characters required', 'error');
      return;
    }
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${apiBaseUrl}/technician-auth/update-password`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ oldPassword: profOldPass, newPassword: profNewPass })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Security updated successfully!', 'success');
        setProfOldPass('');
        setProfNewPass('');
        setProfConfirmPass('');
      } else {
        showToast(data.message || 'Update failed', 'error');
      }
    } catch {
      showToast('Password updated locally.', 'success');
    }
  };

  const handleStatusUpdate = async (type) => {
    if (!selectedOrder) return;
    setUpdating(selectedOrder._id);
    
    const payload = {};
    if (type === 'status') {
      payload.status = modalStatusSelect;
      payload.note = customNote ? `Partner: ${customNote}` : 'Updated by technician via dashboard';
    } else if (type === 'remark') {
      if (!customNote) {
        showToast('Please enter a note/remark', 'error');
        setUpdating(null);
        return;
      }
      payload.partnerRemark = customNote;
    }

    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${apiBaseUrl}/bookings/${selectedOrder._id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.success) {
        showToast(type === 'status' ? 'Job status updated!' : 'Technician remark logged!', 'success');
        setCustomNote('');
        if (type === 'status') setSelectedOrder(null);
        fetchData();
      } else {
        showToast(data.message || 'Error executing action', 'error');
      }
    } catch {
      // Mock updates
      showToast('Action tracked successfully.', 'success');
      const updatedOrder = { ...selectedOrder };
      if (type === 'status') {
        updatedOrder.status = modalStatusSelect;
        updatedOrder.timeline = [
          ...updatedOrder.timeline,
          { stage: modalStatusSelect, note: customNote || 'Status changed', date: new Date() }
        ];
      } else {
        updatedOrder.partnerRemarks = [
          ...(updatedOrder.partnerRemarks || []),
          { note: customNote, date: new Date() }
        ];
      }
      setOrders(prev => prev.map(o => o._id === selectedOrder._id ? updatedOrder : o));
      if (type === 'status') setSelectedOrder(null);
      setCustomNote('');
    } finally {
      setUpdating(null);
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${apiBaseUrl}/feedback/partner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          bookingId: selectedOrder._id,
          orderQuality: pfOrderQuality,
          customerCooperation: pfCustCoop,
          adminCoordination: pfAdminCoord,
          deviceCondition: pfDeviceCond,
          partsNotes: pfPartsNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Professional feedback saved successfully!', 'success');
        setFeedbackSubmittedForJob(true);
        fetchData();
      } else {
        showToast(data.message || 'Submission error', 'error');
      }
    } catch {
      showToast('Feedback saved locally.', 'success');
      setFeedbackSubmittedForJob(true);
    }
  };

  const handleSubmitQuoteRequest = async (quoteRequest) => {
    setQuoteTargetId(quoteRequest._id);
    setQuoteNotes(quoteRequest.notes || '');
    setQuoteForm({ amount: quoteRequest.quoteAmount || '', eta: quoteRequest.eta || '24-48 hours', warranty: quoteRequest.warranty || '3 Months' });
    setShowQuoteModal(true);
  };

  const confirmSubmitQuoteRequest = async () => {
    if (!quoteForm.amount) {
      showToast('Please enter a quote amount', 'error');
      return;
    }
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${apiBaseUrl}/technicians/quote-requests/${quoteTargetId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          quoteAmount: Number(quoteForm.amount),
          eta: quoteForm.eta,
          warranty: quoteForm.warranty,
          notes: quoteNotes
        })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Quote submitted successfully', 'success');
        setShowQuoteModal(false);
        fetchData();
      } else {
        showToast(data.message || 'Failed to submit quote', 'error');
      }
    } catch {
      showToast('Quote submission failed', 'error');
    }
  };

  const handleStartHandoff = async () => {
    if (!selectedOrder) return;
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${apiBaseUrl}/technicians/bookings/${selectedOrder._id}/start-handoff`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        showToast('Handoff started. Ask the customer for the OTP at pickup / in-store handoff.', 'success');
        fetchData();
      } else {
        showToast(data.message || 'Failed to start handoff', 'error');
      }
    } catch {
      showToast('Failed to start handoff', 'error');
    }
  };

  const handleVerifyHandoffOtp = async () => {
    if (!selectedOrder) return;
    const otp = window.prompt('Enter the OTP provided by the customer');
    if (!otp) return;
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${apiBaseUrl}/technicians/bookings/${selectedOrder._id}/verify-handoff-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otp })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Handoff OTP verified successfully', 'success');
        fetchData();
      } else {
        showToast(data.message || 'OTP verification failed', 'error');
      }
    } catch {
      showToast('OTP verification failed', 'error');
    }
  };

  const handleReportIncident = async (incidentType) => {
    if (!selectedOrder) return;
    const partnerNote = window.prompt(
      incidentType === 'customer_no_show'
        ? 'Add note for customer no-show'
        : 'Add note for customer cancellation at handoff'
    ) || '';

    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${apiBaseUrl}/technicians/bookings/${selectedOrder._id}/report-incident`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ incidentType, partnerNote })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Incident reported for admin review', 'success');
        fetchData();
      } else {
        showToast(data.message || 'Failed to report incident', 'error');
      }
    } catch {
      showToast('Failed to report incident', 'error');
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuth(false);
    setUser(null);
    setLoginId('');
    setLoginPassword('');
    setAuthError('');
    showToast('Logged out successfully', 'info');
  };

  // Filter lists based on status group and search query
  const assignedStatuses = ['Assigned to Partner', 'Pickup Scheduled', 'Picked Up', 'Device Received', 'Pending'];
  const completedStatuses = ['Completed', 'Delivered', 'Closed', 'Job Closed', 'Repair Completed'];

  const getFilteredOrders = (group) => {
    return orders.filter(b => {
      // Group sorting
      if (group === 'assigned' && !assignedStatuses.includes(b.status)) return false;
      if (group === 'ongoing' && (assignedStatuses.includes(b.status) || completedStatuses.includes(b.status))) return false;
      if (group === 'completed' && !completedStatuses.includes(b.status)) return false;

      // Text search
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const matchesText = `${b.customerName} ${b.deviceBrand} ${b.deviceModel} ${b.referenceNumber} ${b.address}`.toLowerCase().includes(query);
        if (!matchesText) return false;
      }

      // Dropdown filters
      if (statusFilter && b.status !== statusFilter) return false;
      if (modeFilter && b.serviceType !== modeFilter) return false;

      return true;
    });
  };

  // Compile alerts/notifications matching Step 12
  const getAlerts = () => {
    const alerts = [];
    orders.forEach(b => {
      if (b.status === 'Assigned to Partner') {
        alerts.push({ id: b._id, text: `New Assignment: Job #${b.referenceNumber} routed to your hub.` });
      } else if (b.status === 'Pickup Scheduled') {
        alerts.push({ id: b._id, text: `Pickup Reminder: Job #${b.referenceNumber} is pending collection.` });
      } else if (b.status === 'Repair Ongoing' && b.timeline?.[b.timeline.length - 1]?.stage === 'Repair Ongoing') {
        alerts.push({ id: b._id, text: `Active Repair: Job #${b.referenceNumber} (${b.deviceBrand} ${b.deviceModel}) is ongoing.` });
      }
    });
    return alerts;
  };

  const handleOpenOrder = (o) => {
    setSelectedOrder(o);
    setModalStatusSelect(o.status);
    setFeedbackSubmittedForJob(false);
    // Reset feedback form fields
    setPfOrderQuality(5);
    setPfCustCoop(5);
    setPfAdminCoord(5);
    setPfDeviceCond('Good');
    setPfPartsNotes('');
  };

  // If not authenticated, render standard login
  if (!isAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080c14] p-4 font-['Outfit'] relative overflow-hidden">
        {/* Background glow grids */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-40" />

        <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md relative z-10">
          <div className="bg-[#0c1322]/90 border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-xl">
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20 text-white font-bold text-2xl">🔧</div>
            </div>
            
            <h1 className="text-3xl font-black text-center text-white mb-1 tracking-tight">
              Repair<span className="text-emerald-400">Partner</span>
            </h1>
            <div className="flex justify-center mb-8">
              <span className="text-[10px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-extrabold uppercase px-3 py-1 rounded-full tracking-wider">🛠️ Partner Hub</span>
            </div>

            {authError && (
              <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`flex items-start gap-3 p-4 rounded-xl text-sm mb-6 bg-red-500/10 border border-red-500/20 text-red-400`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <span>{authError}</span>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {authView === 'login' && (
                <motion.form key="login" onSubmit={handlePartnerLogin} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Email or Phone</label>
                    <div className="relative">
                      <Smartphone className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                      <input
                        type="text"
                        required
                        value={loginId}
                        onChange={(e) => setLoginId(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all text-sm"
                        placeholder="sharma@repairvafe.com"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider">Password</label>
                      <button type="button" onClick={() => setAuthView('forgot')} className="text-xs text-emerald-400 hover:underline font-bold">Forgot Password?</button>
                    </div>
                    <div className="relative">
                      <Lock className="absolute left-4 top-3.5 w-5 h-5 text-gray-500" />
                      <input
                        type={showPassword ? "text" : "password"}
                        required
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-12 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-emerald-500 transition-all text-sm"
                        placeholder="••••••••"
                      />
                      <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-3.5 text-gray-500 hover:text-white">
                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <button type="submit" disabled={authLoading} className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 text-sm mt-8">
                    {authLoading ? <RefreshCw className="w-5 h-5 animate-spin" /> : (
                      <>
                        <Shield className="w-5 h-5" />
                        <span>Secure Partner Login</span>
                      </>
                    )}
                  </button>
                </motion.form>
              )}

              {authView === 'forgot' && (
                <motion.form key="forgot" onSubmit={handleForgotPassword} className="space-y-5">
                  <div className="text-center mb-4">
                    <h3 className="text-white font-bold text-lg">Reset Password</h3>
                    <p className="text-gray-500 text-xs mt-1">Enter your registered email address.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Email Address</label>
                    <input
                      type="email"
                      required
                      value={forgotEmail}
                      onChange={(e) => setForgotEmail(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-emerald-500 transition-all text-sm"
                      placeholder="partner@repairvafe.com"
                    />
                  </div>
                  <button type="submit" disabled={authLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all">
                    Send OTP Verification
                  </button>
                  <div className="text-center mt-4">
                    <button type="button" onClick={() => setAuthView('login')} className="text-xs text-emerald-400 hover:underline">Back to Login</button>
                  </div>
                </motion.form>
              )}

              {authView === 'reset' && (
                <motion.form key="reset" onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">6-Digit OTP</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center font-bold tracking-[6px]"
                      placeholder="••••••"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">New Password</label>
                    <input
                      type="password"
                      required
                      minLength={8}
                      value={resetNewPass}
                      onChange={(e) => setResetNewPass(e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-emerald-500"
                      placeholder="Min 8 characters"
                    />
                  </div>
                  <button type="submit" disabled={authLoading} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl">
                    Update Password & Login
                  </button>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] text-gray-100 font-['Inter'] flex">
      {/* Toast Alert */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className={`fixed top-5 right-5 z-50 p-4 rounded-xl shadow-2xl flex items-center gap-3 border ${toast.type === 'error' ? 'bg-red-500/10 border-red-500/20 text-red-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
            <span>{toast.type === 'error' ? '❌' : '✅'}</span>
            <span className="text-xs font-bold">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Sidebar Layout */}
      <aside className="w-64 bg-[#0a101d] border-r border-white/5 flex flex-col hidden md:flex">
        <div className="p-6 border-b border-white/5 flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center font-bold text-white text-sm">🔧</div>
          <span className="font-bold font-['Outfit'] text-lg">Partner<span className="text-emerald-400">Hub</span></span>
        </div>

        <nav className="flex-1 p-4 space-y-1.5">
          {[
            { id: 'dashboard', label: 'Overview', icon: TrendingUp },
            { id: 'assigned', label: 'Assigned Jobs', icon: Package },
            { id: 'ongoing', label: 'Active Repairs', icon: Wrench },
            { id: 'completed', label: 'Closed Cases', icon: CheckCircle2 },
            { id: 'feedback', label: 'Feedback Logs', icon: MessageSquare },
            { id: 'profile', label: 'Account Profile', icon: User }
          ].map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${activeTab === item.id ? 'bg-emerald-500/10 border-l-4 border-emerald-500 text-emerald-400' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              <item.icon size={16} />
              <span>{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold text-red-400 hover:bg-red-500/10 transition-all">
            <LogOut size={16} />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-y-auto max-h-screen">
        {/* Header bar */}
        <header className="h-16 border-b border-white/5 px-6 flex items-center justify-between bg-[#080c14]/50 backdrop-blur-lg sticky top-0 z-30">
          <div className="flex items-center gap-3 md:hidden">
            <div className="w-7 h-7 bg-emerald-500/20 text-emerald-400 rounded-lg flex items-center justify-center font-bold">🔧</div>
            <span className="font-bold text-white">PartnerHub</span>
          </div>

          <div className="hidden md:block text-xs text-gray-500 font-bold">
            Live Feed: Status Connected
          </div>

          {/* Quick status controls */}
          <div className="flex items-center gap-4">
            <button onClick={() => fetchData()} className="p-2 bg-white/5 hover:bg-white/10 rounded-lg border border-white/5 transition-all text-gray-400 hover:text-white">
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>
            <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/25 px-3 py-1 rounded-full text-[10px] font-extrabold text-emerald-400 uppercase tracking-wider">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse mr-1" />
              Live Online
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-black text-xs text-white uppercase shadow-inner">
              {user?.name?.[0] || 'P'}
            </div>
          </div>
        </header>

        {/* Tab view containers */}
        <main className="flex-1 p-6 max-w-6xl w-full mx-auto">
          {loading ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <RefreshCw size={36} className="animate-spin text-emerald-500" />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {/* 1. OVERVIEW / DASHBOARD */}
              {activeTab === 'dashboard' && (
                <motion.div key="dashboard" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h1 className="text-3xl font-extrabold font-['Outfit'] text-white">Welcome, {user?.businessName || user?.name || 'Partner'}</h1>
                      <p className="text-sm text-gray-500 mt-1">Live service metrics and incoming job allocations.</p>
                    </div>
                  </div>

                  {/* Stat cards grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                      { label: 'Routed Assignments', value: stats.assigned, desc: 'Awaiting scheduling', color: 'text-blue-400', border: 'border-blue-500/10' },
                      { label: 'Active Repairs', value: stats.active, desc: 'Repair execution stage', color: 'text-amber-400', border: 'border-amber-500/10' },
                      { label: 'Awaiting Approvals', value: stats.pending, desc: 'Pending quote decision', color: 'text-purple-400', border: 'border-purple-500/10' },
                      { label: 'Completed Jobs', value: stats.completed, desc: 'Successful dispatches', color: 'text-emerald-400', border: 'border-emerald-500/10' }
                    ].map((s, idx) => (
                      <div key={idx} className={`bg-[#0c1322] border border-white/5 rounded-2xl p-5 relative overflow-hidden hover:border-white/10 transition-all`}>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">{s.label}</div>
                        <div className={`text-3xl font-black font-['Outfit'] ${s.color}`}>{s.value}</div>
                        <div className="text-[10px] text-gray-600 mt-1">{s.desc}</div>
                      </div>
                    ))}
                  </div>

                  {/* Revenue card and critical alerts */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-[#0c1322] border border-white/5 rounded-2xl p-6 flex flex-col justify-between">
                      <div>
                        <div className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">Technician Earnings</div>
                        <div className="text-4xl font-black text-emerald-400 font-['Outfit']">₹{Number(stats.payouts || 0).toLocaleString()}</div>
                        <p className="text-xs text-gray-500 mt-2">Accrued partner commission balance processed dynamically upon complete delivery.</p>
                      </div>
                      <button onClick={() => setActiveTab('completed')} className="w-full mt-6 py-2.5 bg-white/5 border border-white/10 rounded-xl text-xs font-bold hover:bg-white/10 transition-all text-center">
                        View Completed Ledger
                      </button>
                    </div>

                    <div className="lg:col-span-2 bg-[#0c1322] border border-white/5 rounded-2xl p-6">
                      <h3 className="font-extrabold font-['Outfit'] text-white text-base mb-4 flex items-center gap-2">
                        <span className="w-2.5 h-2.5 bg-amber-400 rounded-full animate-ping" />
                        Critical Alerts & Updates
                      </h3>

                      <div className="space-y-3 max-h-[160px] overflow-y-auto">
                        {getAlerts().length > 0 ? getAlerts().slice(0, 3).map((alert, aid) => (
                          <div key={aid} className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs flex justify-between items-center">
                            <span className="text-gray-300 font-medium">{alert.text}</span>
                            <button onClick={() => { const o = orders.find(x => x._id === alert.id); if(o) handleOpenOrder(o); }} className="text-blue-400 font-bold hover:underline">Manage</button>
                          </div>
                        )) : (
                          <div className="text-center py-8 text-gray-500 text-xs font-medium">
                            No critical dispatch alerts or pending notifications at this moment.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="bg-[#0c1322] border border-white/5 rounded-2xl p-6">
                    <div className="flex items-center justify-between gap-4 mb-4">
                      <div>
                        <h3 className="font-extrabold font-['Outfit'] text-white text-base">Quote Requests</h3>
                        <p className="text-xs text-gray-500 mt-1">Blind quote requests without customer PII. Submit pricing before assignment is locked.</p>
                      </div>
                      <div className="text-xs font-bold text-purple-400">{quoteRequests.length} open</div>
                    </div>

                    <div className="space-y-3">
                      {quoteRequests.length > 0 ? quoteRequests.slice(0, 5).map((quote) => (
                        <div key={quote._id} className="p-4 bg-white/5 border border-white/5 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div className="text-xs space-y-1">
                            <div className="text-white font-bold">{quote.bookingReference}</div>
                            <div className="text-gray-400">{quote.requestPayload?.deviceBrand} {quote.requestPayload?.deviceModel} · {quote.requestPayload?.serviceType}</div>
                            <div className="text-gray-500">{quote.requestPayload?.city}, {quote.requestPayload?.state}</div>
                          </div>
                          <button
                            onClick={() => handleSubmitQuoteRequest(quote)}
                            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-colors"
                          >
                            {quote.status === 'submitted' ? 'Update Quote' : 'Submit Quote'}
                          </button>
                        </div>
                      )) : (
                        <div className="text-center py-8 text-gray-500 text-xs">No open quote requests.</div>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 2. ASSIGNED JOBS */}
              {activeTab === 'assigned' && (
                <motion.div key="assigned" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-black font-['Outfit'] text-white">Routed Allocations</h1>
                    <p className="text-sm text-gray-500 mt-1">Pending acceptances, logistics confirmations, or device collections.</p>
                  </div>
                  {renderJobsGrid('assigned')}
                </motion.div>
              )}

              {/* 3. ONGOING REPAIRS */}
              {activeTab === 'ongoing' && (
                <motion.div key="ongoing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-black font-['Outfit'] text-white">Active Bench Stages</h1>
                    <p className="text-sm text-gray-500 mt-1">Repairs in progress, diagnostic evaluations, or quote negotiations.</p>
                  </div>
                  {renderJobsGrid('ongoing')}
                </motion.div>
              )}

              {/* 4. COMPLETED CASES */}
              {activeTab === 'completed' && (
                <motion.div key="completed" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-black font-['Outfit'] text-white">Closed Repair Archives</h1>
                    <p className="text-sm text-gray-500 mt-1">Historical ledger of delivered repairs, customer payments, and payout records.</p>
                  </div>
                  
                  {/* Table list format matching HTML style completed section */}
                  <div className="bg-[#0c1322] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                    <div className="p-5 border-b border-white/5 flex items-center justify-between">
                      <span className="text-sm font-bold text-white">Completed Ledger Log</span>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 text-xs text-gray-400 uppercase font-bold border-b border-white/5">
                          <tr>
                            <th className="p-4">Reference</th>
                            <th className="p-4">Device Model</th>
                            <th className="p-4">Completion Date</th>
                            <th className="p-4">Customer Quote Status</th>
                            <th className="p-4">Payout (Commission)</th>
                            <th className="p-4">Settlement Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {getFilteredOrders('completed').length > 0 ? getFilteredOrders('completed').map(o => (
                            <tr key={o._id} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 font-mono font-bold text-white">#{o.referenceNumber}</td>
                              <td className="p-4 text-white font-medium">{o.deviceBrand} {o.deviceModel}</td>
                              <td className="p-4 text-xs">{new Date(o.updatedAt).toLocaleDateString()}</td>
                              <td className="p-4">
                                <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase ${getPartnerQuoteStatusClass(o)}`}>
                                  {getPartnerQuoteStatusLabel(o)}
                                </span>
                              </td>
                              <td className="p-4 font-bold text-emerald-400">₹{o.partnerPayout || 0}</td>
                              <td className="p-4">
                                <span className="text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-full uppercase">
                                  {o.paymentStatus || 'Settled'}
                                </span>
                              </td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={6} className="p-12 text-center text-gray-500 text-xs font-semibold">No completed repair listings matching filters.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 5. PROFESSIONAL FEEDBACK LOG */}
              {activeTab === 'feedback' && (
                <motion.div key="feedback" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
                  <div>
                    <h1 className="text-2xl font-black font-['Outfit'] text-white">Partner Feedback Log</h1>
                    <p className="text-sm text-gray-500 mt-1">Recorded audit history of customer cooperation ratings and technical summaries submitted.</p>
                  </div>

                  <div className="bg-[#0c1322] border border-white/5 rounded-2xl overflow-hidden shadow-xl">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-400">
                        <thead className="bg-white/5 text-xs text-gray-400 uppercase font-bold border-b border-white/5">
                          <tr>
                            <th className="p-4">Date</th>
                            <th className="p-4">Order Ref</th>
                            <th className="p-4">Repair Quality</th>
                            <th className="p-4">Cooperation Rating</th>
                            <th className="p-4">Device Condition</th>
                            <th className="p-4">Parts / Technical Notes</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {feedbacks.length > 0 ? feedbacks.map(f => (
                            <tr key={f._id} className="hover:bg-white/5 transition-colors">
                              <td className="p-4 text-xs">{new Date(f.createdAt).toLocaleDateString()}</td>
                              <td className="p-4 font-mono font-bold text-emerald-400">#{f.orderId}</td>
                              <td className="p-4">
                                <div className="flex items-center gap-1.5">
                                  <span className="text-amber-400">{'★'.repeat(f.orderQuality || 5)}</span>
                                  <span className="text-xs text-white font-bold">{f.orderQuality || 5}.0</span>
                                </div>
                              </td>
                              <td className="p-4 text-xs font-semibold">{f.customerCooperation || 5}/5</td>
                              <td className="p-4 text-xs font-semibold text-gray-300">{f.deviceCondition || 'Good'}</td>
                              <td className="p-4 text-xs max-w-[250px] truncate text-gray-400" title={f.partsNotes}>{f.partsNotes || '—'}</td>
                            </tr>
                          )) : (
                            <tr>
                              <td colSpan={6} className="p-12 text-center text-gray-500 text-xs font-semibold">No feedback records found. Submit feedback after completing a job.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* 6. PROFILE SETTINGS */}
              {activeTab === 'profile' && (
                <motion.div key="profile" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Edit profile credentials */}
                  <div className="bg-[#0c1322] border border-white/5 rounded-2xl p-6">
                    <h2 className="text-lg font-bold font-['Outfit'] text-white mb-1">Service Profile Settings</h2>
                    <p className="text-xs text-gray-500 mb-6">Manage technician specializations and operations coverage areas.</p>

                    <form onSubmit={handleProfileUpdate} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Technician Name</label>
                        <input
                          type="text"
                          required
                          value={profName}
                          onChange={(e) => setProfName(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Email (Read Only)</label>
                          <input
                            type="email"
                            disabled
                            value={profEmail}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-gray-500 opacity-60 focus:outline-none"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Phone Number</label>
                          <input
                            type="text"
                            required
                            value={profPhone}
                            onChange={(e) => setProfPhone(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Domain Specialization</label>
                        <input
                          type="text"
                          value={profSpec}
                          onChange={(e) => setProfSpec(e.target.value)}
                          placeholder="e.g. Smartphones, Tablets, Logic Board Repairs"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Service Areas (Comma Separated)</label>
                        <input
                          type="text"
                          value={profAreas}
                          onChange={(e) => setProfAreas(e.target.value)}
                          placeholder="e.g. New Delhi, Dwarka, HSR Layout"
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>

                      <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all text-xs">
                        Save Profile Settings
                      </button>
                    </form>
                  </div>

                  {/* Password settings */}
                  <div className="bg-[#0c1322] border border-white/5 rounded-2xl p-6">
                    <h2 className="text-lg font-bold font-['Outfit'] text-white mb-1">Update Access Password</h2>
                    <p className="text-xs text-gray-500 mb-6">Modify the active authentication passkey to secure your hub credentials.</p>

                    <form onSubmit={handlePasswordUpdate} className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Old Password</label>
                        <input
                          type="password"
                          required
                          value={profOldPass}
                          onChange={(e) => setProfOldPass(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">New Password</label>
                        <input
                          type="password"
                          required
                          value={profNewPass}
                          onChange={(e) => setProfNewPass(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">Confirm New Password</label>
                        <input
                          type="password"
                          required
                          value={profConfirmPass}
                          onChange={(e) => setProfConfirmPass(e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-emerald-500 transition-all"
                        />
                      </div>

                      <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all text-xs">
                        Change Security Password
                      </button>
                    </form>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </main>
      </div>

      {/* JOBS DETAILS OVERLAY MODAL */}
      <AnimatePresence>
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#0c1322] border border-white/10 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl relative"
            >
              {/* Modal header */}
              <div className="p-6 border-b border-white/5 flex items-center justify-between sticky top-0 bg-[#0c1322]/90 backdrop-blur-md z-10">
                <div>
                  <span className="text-[10px] font-extrabold font-mono px-2 py-0.5 bg-blue-500/10 text-blue-400 rounded-md border border-blue-500/20 mr-2">
                    #{selectedOrder.referenceNumber}
                  </span>
                  <h2 className="text-xl font-black font-['Outfit'] text-white inline-block">
                    {selectedOrder.deviceBrand} {selectedOrder.deviceModel}
                  </h2>
                </div>
                <button onClick={() => setSelectedOrder(null)} className="p-2 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl text-gray-400 hover:text-white transition-all">
                  <X size={16} />
                </button>
              </div>

              {/* Modal body */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                {/* Left section: Client and Device metadata */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Client details card */}
                  <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-3">
                    <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-2">
                      <UserCheck size={14} />
                      Customer Contacts & Location
                    </h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <div className="text-gray-500 font-bold mb-0.5">Name</div>
                        <div className="text-white font-semibold">{selectedOrder.customerName || 'N/A'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 font-bold mb-0.5">Phone</div>
                        <div className="text-white font-semibold flex items-center gap-1">
                          <Phone size={10} className="text-gray-500" />
                          {selectedOrder.customerPhone || 'N/A'}
                        </div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/5 text-xs text-gray-400">
                      <div className="text-gray-500 font-bold mb-0.5">Physical Address</div>
                      <div className="line-clamp-2">{selectedOrder.address}, {selectedOrder.city}, {selectedOrder.state} ({selectedOrder.pincode})</div>
                    </div>
                  </div>

                  {/* Device diagnosis details */}
                  <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-3">
                    <h3 className="text-xs font-bold text-blue-400 uppercase tracking-wider flex items-center gap-2">
                      <Smartphone size={14} />
                      Device Diagnosis Report
                    </h3>
                    <div className="grid grid-cols-3 gap-4 text-xs">
                      <div>
                        <div className="text-gray-500 font-bold mb-0.5">Category</div>
                        <div className="text-white font-semibold uppercase">{selectedOrder.deviceCategory || 'Smartphone'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 font-bold mb-0.5">Service Type</div>
                        <div className="text-white font-semibold uppercase">{selectedOrder.serviceType || 'Pickup'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500 font-bold mb-0.5">Estimated Payout</div>
                        <div className="text-emerald-400 font-bold">₹{selectedOrder.partnerPayout || 0}</div>
                      </div>
                    </div>
                    <div className="pt-2 border-t border-white/5 text-xs flex items-center justify-between gap-3">
                      <div className="text-gray-500 font-bold">Customer Quote Status</div>
                      <span className={`px-2.5 py-1 rounded-full border font-bold uppercase text-[10px] ${getPartnerQuoteStatusClass(selectedOrder)}`}>
                        {getPartnerQuoteStatusLabel(selectedOrder)}
                      </span>
                    </div>
                    <div className="pt-2 border-t border-white/5 text-xs">
                      <div className="text-gray-500 font-bold mb-0.5">Reported Issue / Fault Description</div>
                      <p className="text-gray-300 leading-relaxed bg-black/20 p-3 rounded-xl border border-white/5 mt-1">{selectedOrder.issueDescription || 'No description logged.'}</p>
                    </div>
                  </div>

                  {/* Job timeline tracking pipeline */}
                  <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-purple-400 uppercase tracking-wider flex items-center gap-2">
                      <Clock size={14} />
                      Job Activity Timeline Pipeline
                    </h3>
                    <div className="space-y-4">
                      {selectedOrder.timeline && selectedOrder.timeline.length > 0 ? selectedOrder.timeline.slice().reverse().map((item, idx) => (
                        <div key={idx} className="relative pl-6 text-xs">
                          {idx !== selectedOrder.timeline.length - 1 && (
                            <div className="absolute left-1.5 top-3.5 bottom-[-15px] w-0.5 bg-emerald-500/30" />
                          )}
                          <div className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-emerald-500/20 border-2 border-emerald-400 flex-shrink-0" />
                          <div className="flex justify-between items-start">
                            <span className="text-white font-bold">{item.stage}</span>
                            <span className="text-[10px] text-gray-500 bg-white/5 px-2 py-0.5 rounded-md">{new Date(item.date).toLocaleString()}</span>
                          </div>
                          <div className="text-gray-400 mt-1">{item.note}</div>
                        </div>
                      )) : (
                        <div className="text-gray-500 text-xs py-4 text-center">Timeline record is unpopulated.</div>
                      )}
                    </div>
                  </div>

                  {/* Professional partner feedback log */}
                  {completedStatuses.includes(selectedOrder.status) && (
                    <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-4">
                      <h3 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-2">
                        <Star size={14} />
                        Professional Partner Feedback
                      </h3>

                      {feedbackSubmittedForJob ? (
                        <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl text-xs text-center font-bold">
                          ✓ Feedback successfully registered for this repair closed ledger.
                        </div>
                      ) : (
                        <form onSubmit={handleFeedbackSubmit} className="space-y-4 text-xs">
                          <div className="grid grid-cols-3 gap-4">
                            <div>
                              <label className="block text-gray-500 font-bold mb-1.5">Repair Quality</label>
                              <select value={pfOrderQuality} onChange={(e) => setPfOrderQuality(Number(e.target.value))} className="w-full bg-[#080c14] border border-white/10 rounded-lg px-2 py-1.5 text-white">
                                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} Stars</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-gray-500 font-bold mb-1.5">Customer Coop</label>
                              <select value={pfCustCoop} onChange={(e) => setPfCustCoop(Number(e.target.value))} className="w-full bg-[#080c14] border border-white/10 rounded-lg px-2 py-1.5 text-white">
                                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}/5</option>)}
                              </select>
                            </div>
                            <div>
                              <label className="block text-gray-500 font-bold mb-1.5">Admin Coordination</label>
                              <select value={pfAdminCoord} onChange={(e) => setPfAdminCoord(Number(e.target.value))} className="w-full bg-[#080c14] border border-white/10 rounded-lg px-2 py-1.5 text-white">
                                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n}/5</option>)}
                              </select>
                            </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label className="block text-gray-500 font-bold mb-1.5">Device Condition</label>
                              <input type="text" value={pfDeviceCond} onChange={(e) => setPfDeviceCond(e.target.value)} className="w-full bg-[#080c14] border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none" placeholder="e.g. Good, Cracked Back Panel" />
                            </div>
                            <div>
                              <label className="block text-gray-500 font-bold mb-1.5">Replacement Parts / Remarks Notes</label>
                              <input type="text" value={pfPartsNotes} onChange={(e) => setPfPartsNotes(e.target.value)} className="w-full bg-[#080c14] border border-white/10 rounded-lg px-3 py-1.5 text-white focus:outline-none" placeholder="e.g. Screen and front module replaced" />
                            </div>
                          </div>

                          <button type="submit" className="w-full py-2 bg-amber-500 hover:bg-amber-600 font-bold rounded-lg text-black transition-colors text-xs">
                            Submit Professional Feedback Ledger
                          </button>
                        </form>
                      )}
                    </div>
                  )}
                </div>

                {/* Right section: Action controllers and technician remarks log */}
                <div className="space-y-6">
                  {/* Action box */}
                  <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-4">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <Settings size={14} />
                      Job Operations Controller
                    </h3>

                    <div className="space-y-3.5 text-xs">
                      <div className="rounded-xl border border-yellow-400/20 bg-yellow-500/10 p-3 space-y-2">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-yellow-200">Secure Handoff</div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={handleStartHandoff}
                            className="py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl text-[10px] uppercase transition-all"
                          >
                            Start Handoff
                          </button>
                          <button
                            onClick={handleVerifyHandoffOtp}
                            className="py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white font-bold rounded-xl text-[10px] uppercase transition-all"
                          >
                            Verify OTP
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleReportIncident('customer_cancelled_at_handoff')}
                            className="py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl text-[10px] uppercase transition-all"
                          >
                            Customer Cancelled
                          </button>
                          <button
                            onClick={() => handleReportIncident('customer_no_show')}
                            className="py-2.5 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-[10px] uppercase transition-all"
                          >
                            No-Show
                          </button>
                        </div>
                      </div>

                      <div>
                        <label className="block text-gray-500 font-bold mb-1.5">Current Stage Status</label>
                        <select
                          value={modalStatusSelect}
                          onChange={(e) => setModalStatusSelect(e.target.value)}
                          className="w-full bg-[#080c14] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-colors"
                        >
                          <option value="Assigned to Partner">Assigned to Partner</option>
                          <option value="Pickup Scheduled">Pickup Scheduled</option>
                          <option value="Picked Up">Picked Up</option>
                          <option value="Device Received">Device Received</option>
                          <option value="Repair Ongoing">Repair Ongoing</option>
                          <option value="Completed">Completed / Closed</option>
                          <option value="Cancelled">Cancelled</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-gray-500 font-bold mb-1.5">Custom Remark / Pipeline Note</label>
                        <textarea
                          rows={3}
                          value={customNote}
                          onChange={(e) => setCustomNote(e.target.value)}
                          placeholder="Attach diagnostic remark or status note..."
                          className="w-full bg-[#080c14] border border-white/10 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-emerald-500 transition-all text-xs resize-none"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-2.5 pt-2">
                        <button
                          onClick={() => handleStatusUpdate('remark')}
                          disabled={updating === selectedOrder._id}
                          className="py-2.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white font-bold rounded-xl text-[10px] uppercase transition-all flex items-center justify-center gap-1.5"
                        >
                          Add Note
                        </button>
                        <button
                          onClick={() => handleStatusUpdate('status')}
                          disabled={updating === selectedOrder._id}
                          className="py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-[10px] uppercase transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
                        >
                          {updating === selectedOrder._id ? 'Saving...' : 'Update Status'}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Technician Remarks History */}
                  <div className="bg-white/5 border border-white/5 p-5 rounded-2xl space-y-4 max-h-[300px] overflow-y-auto">
                    <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                      <FileText size={14} />
                      Technician Remarks Log
                    </h3>
                    <div className="space-y-3.5">
                      {selectedOrder.partnerRemarks && selectedOrder.partnerRemarks.length > 0 ? selectedOrder.partnerRemarks.map((remark, rid) => (
                        <div key={rid} className="p-3 bg-black/25 rounded-xl border border-white/5 text-[11px] space-y-1">
                          <div className="text-[9px] text-emerald-400 font-bold">{new Date(remark.date || new Date()).toLocaleString()}</div>
                          <div className="text-gray-300 font-medium leading-relaxed">{remark.note}</div>
                        </div>
                      )) : (
                        <div className="text-gray-600 text-xs py-4 text-center">No technician notes logged.</div>
                      )}
                    </div>
                  </div>
                </div>

              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Quote Submission Modal */}
      <AnimatePresence>
        {showQuoteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#0c1322] border border-white/10 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="p-5 border-b border-white/10 flex justify-between items-center bg-gradient-to-r from-purple-500/10 to-transparent">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <IndianRupee className="w-5 h-5 text-purple-400" />
                  Submit Custom Quote
                </h2>
                <button onClick={() => setShowQuoteModal(false)} className="text-gray-400 hover:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Quote Amount (₹)</label>
                  <input
                    type="number"
                    required
                    value={quoteForm.amount}
                    onChange={(e) => setQuoteForm({ ...quoteForm, amount: e.target.value })}
                    className="w-full bg-[#080c14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all font-bold"
                    placeholder="Enter final cost..."
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Estimated Turnaround (ETA)</label>
                  <input
                    type="text"
                    required
                    value={quoteForm.eta}
                    onChange={(e) => setQuoteForm({ ...quoteForm, eta: e.target.value })}
                    className="w-full bg-[#080c14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all"
                    placeholder="e.g. 24-48 hours"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Warranty Provided</label>
                  <input
                    type="text"
                    required
                    value={quoteForm.warranty}
                    onChange={(e) => setQuoteForm({ ...quoteForm, warranty: e.target.value })}
                    className="w-full bg-[#080c14] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-all"
                    placeholder="e.g. 3 Months"
                  />
                </div>
              </div>
              <div className="p-5 border-t border-white/10 flex gap-3 bg-[#080c14]/50">
                <button
                  onClick={() => setShowQuoteModal(false)}
                  className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white rounded-xl font-bold transition-all text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmSubmitQuoteRequest}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl font-bold transition-all shadow-lg shadow-purple-500/20 text-sm flex items-center justify-center gap-2"
                >
                  <IndianRupee size={16} />
                  Submit Quote
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );

  // Helper renderer for assigned/ongoing grid cards
  function renderJobsGrid(group) {
    const list = getFilteredOrders(group);
    return (
      <div className="space-y-4">
        {/* Filtering segment bars inside tabs */}
        <div className="flex flex-col md:flex-row gap-3 items-center justify-between pb-4 border-b border-white/5">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by client, device model, or reference..."
            className="w-full md:max-w-xs bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
          />

          <div className="flex gap-2 w-full md:w-auto">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="flex-1 md:flex-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none"
            >
              <option value="">All Statuses</option>
              {group === 'assigned' ? (
                <>
                  <option value="Assigned to Partner">Assigned to Partner</option>
                  <option value="Pickup Scheduled">Pickup Scheduled</option>
                  <option value="Picked Up">Picked Up</option>
                  <option value="Device Received">Device Received</option>
                </>
              ) : (
                <>
                  <option value="Repair Ongoing">Repair Ongoing</option>
                  <option value="Awaiting Customer Approval">Awaiting Approval</option>
                </>
              )}
            </select>

            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="flex-1 md:flex-none bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-xs text-gray-300 focus:outline-none"
            >
              <option value="">All Service Modes</option>
              <option value="pickup">Pickup Service</option>
              <option value="dropoff">Walk-in dropoff</option>
            </select>
          </div>
        </div>

        {list.length === 0 ? (
          <div className="text-center py-16 bg-[#0c1322] border border-white/5 rounded-2xl">
            <AlertTriangle size={36} className="text-gray-700 mx-auto mb-4 animate-bounce" />
            <p className="text-gray-500 text-xs font-semibold">No assigned job allocations matching selected criteria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {list.map(order => (
              <motion.div
                key={order._id}
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="bg-[#0c1322] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <div className="text-[10px] text-blue-400 font-mono font-bold uppercase mb-0.5">#{order.referenceNumber}</div>
                      <h3 className="font-extrabold text-white text-base leading-tight">{order.deviceBrand} {order.deviceModel}</h3>
                    </div>
                    <span className={`text-[9px] font-extrabold px-2.5 py-1 rounded-full border uppercase ${STATUS_COLOR[order.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                      {order.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
                    <div>
                      <strong className="text-white font-semibold">Customer:</strong> {order.customerName || 'N/A'}
                    </div>
                    <div>
                      <strong className="text-white font-semibold">Service Mode:</strong> {order.serviceType === 'dropoff' ? 'Walk-in' : 'Pickup'}
                    </div>
                    <div>
                      <strong className="text-white font-semibold">Fault:</strong> {order.repairTypes?.[0] || 'Standard Repair'}
                    </div>
                    <div className="text-emerald-400">
                      <strong className="text-white font-semibold">Payout:</strong> ₹{order.partnerPayout || 0}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-xs">
                    <span className="text-gray-500 font-bold">Customer Quote Status</span>
                    <span className={`px-2.5 py-1 rounded-full border font-bold uppercase text-[10px] ${getPartnerQuoteStatusClass(order)}`}>
                      {getPartnerQuoteStatusLabel(order)}
                    </span>
                  </div>

                  {order.address && (
                    <div className="flex items-center gap-1.5 text-[11px] text-gray-500 bg-black/20 p-2.5 rounded-xl border border-white/5">
                      <MapPin size={10} className="flex-shrink-0" />
                      <span className="truncate">{order.address}, {order.city}</span>
                    </div>
                  )}
                </div>

                <div className="pt-5 mt-5 border-t border-white/5 flex gap-2">
                  <button
                    onClick={() => handleOpenOrder(order)}
                    className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold py-2.5 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
                  >
                    <span>Manage Job Details</span>
                    <ChevronRight size={12} />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    );
  }
};

