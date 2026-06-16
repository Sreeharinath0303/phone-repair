import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Smartphone, Package, Clock, LogOut,
  Plus, ChevronRight, RefreshCw, Bell, Star, Download, Check, X, LifeBuoy,
  LayoutDashboard, UserCircle, MapPin, Edit3, Save, Trash2
} from 'lucide-react';
import { getApiBaseUrl } from '../utils/apiBase';

const STATUS_COLOR = {
  'Received':    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Confirmed':   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Picked Up':   'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'In Repair':   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Completed':   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Delivered':   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Cancelled':   'bg-red-500/10 text-red-400 border-red-500/20'
};

const getAuthToken = () => localStorage.getItem('rv_token') || sessionStorage.getItem('rv_token');

const normalizeTimeline = (order) => {
  if (Array.isArray(order?.timeline) && order.timeline.length > 0) {
    return order.timeline.map((t) => ({
      stage: t.stage || t.status || 'Update',
      note: t.note || '',
      date: t.date || t.timestamp || order.updatedAt || order.createdAt
    }));
  }
  return [];
};

const extractNotifications = (orders) => {
  const list = [];
  orders.forEach((o) => {
    const timeline = normalizeTimeline(o);
    timeline.forEach((t, idx) => {
      list.push({
        id: `${o._id}-${idx}`,
        bookingId: o.referenceNumber || o._id,
        device: `${o.deviceBrand || ''} ${o.deviceModel || ''}`.trim(),
        stage: t.stage,
        note: t.note,
        date: new Date(t.date || o.createdAt || Date.now()).toISOString()
      });
    });
  });
  list.sort((a, b) => new Date(b.date) - new Date(a.date));
  return list.slice(0, 30);
};

const ModalShell = ({ open, title, onClose, children }) => {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onMouseDown={onClose}>
      <div className="w-full max-w-2xl bg-[#0d1422] border border-white/10 rounded-2xl overflow-hidden" onMouseDown={(e) => e.stopPropagation()}>
        <div className="px-5 h-14 border-b border-white/10 flex items-center justify-between">
          <div className="font-black font-['Outfit']">{title}</div>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors p-2 rounded-lg bg-white/5 hover:bg-white/10" aria-label="Close modal">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto custom-scrollbar">{children}</div>
      </div>
    </div>
  );
};

export const CustomerDashboard = () => {
  const navigate = useNavigate();
  const apiBaseUrl = getApiBaseUrl();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orderTab, setOrderTab] = useState('all');
  const [notifOpen, setNotifOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [activeOrder, setActiveOrder] = useState(null);
  const [toast, setToast] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, pendingQuotes: 0 });

  // Feedback State
  const [feedbackForm, setFeedbackForm] = useState({
    rating: 5,
    review: '',
    serviceQuality: 5,
    pickupExperience: 5,
    technicianBehavior: 5,
    timeliness: 5,
    overallSatisfaction: 5
  });
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  // Profile Edit State
  const [profileData, setProfileData] = useState({ name: '', email: '', phone: '' });
  const [savingProfile, setSavingProfile] = useState(false);
  const [myFeedbacks, setMyFeedbacks] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem('rv_user');
    if (stored) {
      const parsed = JSON.parse(stored);
      setUser(parsed);
      setProfileData({ name: parsed.name || '', email: parsed.email || '', phone: parsed.phone || '' });
    }
    fetchDashboard();
  }, []);

  const apiFetch = async (path, options = {}) => {
    const token = getAuthToken();
    const res = await fetch(`${apiBaseUrl}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: `Bearer ${token}`
      }
    });
    return res.json();
  };

  const showToast = (message, type = 'info') => {
    setToast({ message, type });
    window.clearTimeout(window.__rvToastTimer);
    window.__rvToastTimer = window.setTimeout(() => setToast(null), 3000);
  };

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const [ordersRes, statsRes, feedbackRes] = await Promise.all([
        apiFetch('/customer/orders'),
        apiFetch('/customer/stats'),
        apiFetch('/customer/my-feedback')
      ]);
      if (ordersRes?.success) setOrders(ordersRes.data || []);
      if (feedbackRes?.success) setMyFeedbacks(feedbackRes.data || []);
      if (statsRes?.success) {
        setStats({
          total: statsRes.data?.total || 0,
          active: statsRes.data?.active || 0,
          pendingQuotes: statsRes.data?.pendingQuotes || 0
        });
        if (statsRes.data?.user) {
          setUser(statsRes.data.user);
          localStorage.setItem('rv_user', JSON.stringify(statsRes.data.user));
          setProfileData({ 
            name: statsRes.data.user.name || '', 
            email: statsRes.data.user.email || '', 
            phone: statsRes.data.user.phone || '' 
          });
        }
      }
    } catch {
      showToast('Could not fetch latest data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      const res = await apiFetch('/customer/profile', {
        method: 'PUT',
        body: JSON.stringify(profileData)
      });
      if (res.success) {
        showToast('Profile updated successfully', 'success');
        setUser(res.data);
        localStorage.setItem('rv_user', JSON.stringify(res.data));
      } else {
        showToast(res.message || 'Profile update failed', 'error');
      }
    } catch (err) {
      showToast('Server error', 'error');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleQuote = async (orderId, action) => {
    try {
      const sure = action === 'approve'
        ? window.confirm('Approve this quotation and start repair?')
        : window.confirm('Reject this quotation?');
      if (!sure) return;

      const payload = action === 'reject'
        ? { reason: window.prompt('Reason (optional):') || '' }
        : undefined;

      const res = await apiFetch(`/customer/${action}-quote/${orderId}`, {
        method: 'PUT',
        body: payload ? JSON.stringify(payload) : undefined
      });

      if (res?.success) {
        showToast(`Quotation ${action}d`, 'success');
        fetchDashboard();
        setDetailsOpen(false);
      } else {
        showToast(res?.message || 'Action failed', 'error');
      }
    } catch {
      showToast('Server error', 'error');
    }
  };

  const downloadInvoice = async (orderId, filenameHint) => {
    try {
      const token = getAuthToken();
      const res = await fetch(`${apiBaseUrl}/customer/invoice/${orderId}/html`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed');
      const html = await res.text();
      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const w = window.open(url, '_blank', 'noopener,noreferrer');
      if (!w) {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${filenameHint || 'invoice'}.html`;
        document.body.appendChild(a);
        a.click();
        a.remove();
      }
      setTimeout(() => URL.revokeObjectURL(url), 10000);
    } catch {
      showToast('Unable to generate invoice', 'error');
    }
  };

  const handleFeedbackSubmit = async (e) => {
    e.preventDefault();
    setSubmittingFeedback(true);
    try {
      const res = await apiFetch('/feedback/customer', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: activeOrder._id,
          ...feedbackForm
        })
      });
      if (res?.success) {
        showToast('Feedback submitted successfully! Thank you.', 'success');
        activeOrder.customerFeedbackStatus = 'Feedback Submitted';
        setOrders(orders.map(o => o._id === activeOrder._id ? { ...o, customerFeedbackStatus: 'Feedback Submitted' } : o));
        fetchDashboard();
      } else {
        showToast(res?.message || 'Failed to submit feedback', 'error');
      }
    } catch {
      showToast('Server error while submitting feedback', 'error');
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const handleVerifyReturnOtp = async (orderId) => {
    const otp = window.prompt('Enter the return / delivery OTP shared during device handoff');
    if (!otp) return;

    try {
      const res = await apiFetch(`/customer/bookings/${orderId}/verify-return-otp`, {
        method: 'POST',
        body: JSON.stringify({ otp })
      });
      if (res?.success) {
        showToast('Return verified successfully', 'success');
        fetchDashboard();
        setDetailsOpen(false);
      } else {
        showToast(res?.message || 'Return OTP verification failed', 'error');
      }
    } catch {
      showToast('Return OTP verification failed', 'error');
    }
  };

  const activeOrders = orders.filter(o => !['Completed', 'Delivered', 'Cancelled', 'Rejected', 'Closed', 'Job Closed'].includes(o.status));
  const historyOrders = orders.filter(o => ['Completed', 'Delivered', 'Cancelled', 'Rejected', 'Closed', 'Job Closed'].includes(o.status));
  const filteredOrders = orderTab === 'all' ? orders : orderTab === 'active' ? activeOrders : historyOrders;
  const notifications = extractNotifications(orders);
  const pendingQuoteCount = orders.filter((o) => (o.quotationStatus === 'Awaiting Customer Approval' && (o.quotationAmount || 0) > 0)).length;
  const pendingFeedbackOrders = orders.filter(o => 
    ['Completed', 'Delivered', 'Repair Completed', 'Closed', 'Job Closed', 'Ready for Delivery'].includes(o.status) && 
    o.customerFeedbackStatus !== 'Feedback Submitted'
  );

  const openDetails = (order) => {
    setActiveOrder(order);
    setDetailsOpen(true);
  };

  const NAV_ITEMS = [
    { id: 'dashboard', label: 'Overview', icon: LayoutDashboard },
    { id: 'orders', label: 'My Bookings', icon: Package },
    { id: 'feedback', label: 'Service Feedback', icon: Star },
    { id: 'profile', label: 'My Profile', icon: UserCircle },
    { id: 'support', label: 'Help & Support', icon: LifeBuoy }
  ];

  return (
    <div className="min-h-screen bg-[#080c14] text-white font-['Inter']">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-[#080c14]/90 backdrop-blur-md border-b border-white/5 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-xs font-bold">⚡</div>
          <span className="font-bold font-['Outfit'] text-xl">Repair<span className="text-blue-400">Vafe</span></span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setNotifOpen(true)}
            className="relative text-gray-500 hover:text-white transition-colors p-2 rounded-lg hover:bg-white/5"
          >
            <Bell size={18} />
            {(notifications.length > 0 || pendingQuoteCount > 0) && (
              <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full bg-red-500 border border-[#080c14]" />
            )}
          </button>
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold">{user?.name || 'Customer'}</div>
            <div className="text-xs text-gray-500">{user?.email || user?.phone || ''}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-sm shadow-lg">
            {user?.name?.[0]?.toUpperCase() || 'C'}
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors p-2 ml-2">
            <LogOut size={18} />
          </button>
        </div>
      </header>

      <div className="flex max-w-7xl mx-auto">
        {/* Sidebar */}
        <aside className="w-64 flex-shrink-0 p-6 hidden md:block border-r border-white/5 min-h-[calc(100vh-64px)]">
          <nav className="space-y-2">
            {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${
                  activeTab === item.id 
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-500/20 shadow-lg shadow-blue-500/5' 
                    : 'text-gray-400 hover:text-white hover:bg-white/5 border border-transparent'
                }`}
              >
                <item.icon size={18} />
                <span className="font-semibold text-sm">{item.label}</span>
              </button>
            ))}
          </nav>
          
          <div className="mt-8 pt-8 border-t border-white/5">
            <Link
              to="/book"
              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-bold py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
            >
              <Plus size={18} /> Book Repair
            </Link>
          </div>
        </aside>

        {/* Mobile Nav */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[#0d1422] border-t border-white/10 p-3 flex justify-around z-40">
           {NAV_ITEMS.map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex flex-col items-center gap-1 p-2 rounded-xl transition-all ${
                  activeTab === item.id ? 'text-blue-400' : 'text-gray-500'
                }`}
              >
                <item.icon size={20} />
                <span className="text-[10px] font-bold">{item.label}</span>
              </button>
            ))}
        </div>

        {/* Main Content Area */}
        <main className="flex-1 p-6 pb-24 md:pb-6 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <RefreshCw size={28} className="animate-spin text-blue-500" />
            </div>
          ) : (
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
            >
              {/* --- DASHBOARD OVERVIEW --- */}
              {activeTab === 'dashboard' && (
                <>
                  <div className="mb-8">
                    <h1 className="text-3xl font-black font-['Outfit']">Dashboard Overview</h1>
                    <p className="text-gray-500 mt-1">Welcome back, {user?.name?.split(' ')[0] || 'Customer'}!</p>
                  </div>

                  {pendingFeedbackOrders.length > 0 && (
                    <div className="mb-8 bg-gradient-to-r from-blue-600/20 via-indigo-600/10 to-transparent border border-blue-500/30 rounded-3xl p-6 relative overflow-hidden shadow-2xl">
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
                        <div className="space-y-1">
                          <div className="text-xs font-bold uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                            <Star size={14} className="fill-blue-400" /> Service Completed
                          </div>
                          <h3 className="text-lg font-bold text-white font-['Outfit']">Share Your Feedback</h3>
                          <p className="text-sm text-gray-400">
                            Your repair for <span className="text-white font-semibold">{pendingFeedbackOrders[0].deviceBrand} {pendingFeedbackOrders[0].deviceModel}</span> has been finished. Please share your experience to help us improve!
                          </p>
                        </div>
                        <button
                          onClick={() => openDetails(pendingFeedbackOrders[0])}
                          className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all shadow-lg shadow-blue-600/20 text-sm whitespace-nowrap self-start md:self-center flex items-center gap-2"
                        >
                          <Star size={16} /> Rate Service
                        </button>
                      </div>
                      <div className="absolute right-0 bottom-0 w-32 h-32 bg-blue-500/[0.03] rounded-tl-full pointer-events-none" />
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                    {[
                      { label: 'Total Repairs', value: stats.total || orders.length, icon: Package, color: 'text-blue-400', bg: 'bg-blue-400/10' },
                      { label: 'Active Repairs', value: stats.active || activeOrders.length, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
                      { label: 'Pending Quotes', value: stats.pendingQuotes || pendingQuoteCount, icon: Star, color: 'text-indigo-300', bg: 'bg-indigo-400/10' }
                    ].map(s => (
                      <div key={s.label} className="bg-[#0d1422] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                        <div className={`w-12 h-12 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-4`}>
                          <s.icon size={24} />
                        </div>
                        <div className="text-3xl font-black font-['Outfit']">{s.value}</div>
                        <div className="text-sm font-semibold text-gray-500 mt-1">{s.label}</div>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between mb-4 mt-8">
                    <h2 className="text-xl font-bold font-['Outfit']">Recent Active Repairs</h2>
                    <button onClick={() => setActiveTab('orders')} className="text-sm text-blue-400 font-semibold hover:underline">View All</button>
                  </div>
                  
                  {activeOrders.length === 0 ? (
                    <div className="bg-[#0d1422] border border-white/5 rounded-2xl p-10 text-center">
                      <Smartphone size={40} className="text-gray-600 mx-auto mb-4" />
                      <div className="text-lg font-bold">No active repairs</div>
                      <p className="text-sm text-gray-500 mt-1 mb-4">Your devices are all good! Need a repair?</p>
                      <Link to="/book" className="inline-block bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded-lg transition-colors">Book Now</Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {activeOrders.slice(0, 3).map(order => (
                         <div key={order._id} className="bg-[#0d1422] border border-white/5 rounded-2xl p-5 flex items-center justify-between group hover:border-white/10 transition-colors cursor-pointer" onClick={() => openDetails(order)}>
                            <div className="flex items-center gap-4">
                               <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-gray-400">
                                  <Smartphone size={24} />
                               </div>
                               <div>
                                  <div className="font-bold">{order.deviceBrand} {order.deviceModel}</div>
                                  <div className="text-xs text-gray-500 font-mono mt-1">Ref: {order.referenceNumber}</div>
                               </div>
                            </div>
                            <div className="text-right">
                                <span className={`inline-block text-xs font-bold px-3 py-1 rounded-full border mb-1 ${STATUS_COLOR[order.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                  {order.status}
                                </span>
                                <div className="text-xs text-gray-500 flex items-center justify-end gap-1">
                                  {order.quotationStatus === 'Awaiting Customer Approval' ? <span className="text-blue-400 font-bold">Current Quote Amount</span> : 'View Status'} <ChevronRight size={14}/>
                                </div>
                            </div>
                         </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* --- MY ORDERS --- */}
              {activeTab === 'orders' && (
                <>
                  <div className="mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                      <h1 className="text-3xl font-black font-['Outfit']">My Bookings</h1>
                      <p className="text-gray-500 mt-1">Track and manage all your device repairs.</p>
                    </div>
                    <Link to="/book" className="hidden md:flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-xl text-sm font-bold transition-colors">
                      <Plus size={16} /> New Booking
                    </Link>
                  </div>

                  {/* Internal Order Tabs */}
                  <div className="flex gap-2 mb-6 border-b border-white/10 pb-4">
                     <button onClick={() => setOrderTab('all')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${orderTab === 'all' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>All Orders ({orders.length})</button>
                     <button onClick={() => setOrderTab('active')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${orderTab === 'active' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>Active ({activeOrders.length})</button>
                     <button onClick={() => setOrderTab('history')} className={`px-4 py-2 rounded-lg text-sm font-bold transition-colors ${orderTab === 'history' ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>History ({historyOrders.length})</button>
                  </div>

                  {filteredOrders.length === 0 ? (
                    <div className="text-center py-20 bg-[#0d1422] border border-white/5 rounded-2xl">
                      <Package size={48} className="text-gray-700 mx-auto mb-4" />
                      <div className="text-xl font-bold mb-2">No repairs found</div>
                      <p className="text-gray-500 text-sm mb-6">Looks like you don't have any {orderTab === 'all' ? '' : orderTab} repairs.</p>
                      <Link to="/book" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-xl transition-colors">Book Your First Repair</Link>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredOrders.map((order, i) => (
                        <div key={order._id} className="bg-[#0d1422] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors">
                          <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-4">
                            <div className="flex items-center gap-4">
                              <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-gray-400">
                                <Smartphone size={24} />
                              </div>
                              <div>
                                <div className="font-bold text-lg">{order.deviceBrand} {order.deviceModel}</div>
                                <div className="text-sm text-gray-400 font-mono mt-0.5">Ref: {order.referenceNumber || order._id}</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${STATUS_COLOR[order.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                                {order.status}
                              </span>
                            </div>
                          </div>

                          {/* Order Actions & Info Grid */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-4 border-t border-white/5 mt-4 text-sm">
                            <div>
                               <div className="text-gray-500 text-xs mb-1">Service Type</div>
                               <div className="font-semibold">{order.serviceType || 'Pickup'}</div>
                            </div>
                            <div>
                               <div className="text-gray-500 text-xs mb-1">Date</div>
                               <div className="font-semibold">{order.preferredDate ? new Date(order.preferredDate).toLocaleDateString('en-IN') : '-'}</div>
                            </div>
                            <div>
                               <div className="text-gray-500 text-xs mb-1">Quotation</div>
                               <div className="font-semibold text-blue-400">
                                 {order.quotationStatus === 'Approved by Customer' && order.quotationAmount
                                   ? `₹${order.quotationAmount.toLocaleString('en-IN')}`
                                   : order.quotationStatus === 'Awaiting Customer Approval'
                                   ? 'Quote Ready - Action Required'
                                   : 'Pending Admin Quote'}
                               </div>
                            </div>
                            <div className="flex justify-end items-center">
                               {order.quotationStatus === 'Awaiting Customer Approval' && (order.quotationAmount || 0) > 0 ? (
                                 <button onClick={() => openDetails(order)} className="text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors w-full md:w-auto text-center flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20">
                                   <Star size={16} /> Current Quote Amount
                                 </button>
                               ) : (
                                 <button onClick={() => openDetails(order)} className="text-sm font-bold bg-white/5 hover:bg-white/10 border border-white/10 px-4 py-2 rounded-lg transition-colors w-full md:w-auto text-center">
                                   View Details
                                 </button>
                               )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {/* --- PROFILE --- */}
              {activeTab === 'profile' && (
                <div className="max-w-2xl">
                  <div className="mb-8">
                    <h1 className="text-3xl font-black font-['Outfit']">My Profile</h1>
                    <p className="text-gray-500 mt-1">Manage your personal information and preferences.</p>
                  </div>

                  <form onSubmit={handleProfileUpdate} className="bg-[#0d1422] border border-white/5 rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/5">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-2xl shadow-lg">
                        {user?.name?.[0]?.toUpperCase() || 'C'}
                      </div>
                      <div>
                        <h3 className="text-lg font-bold">{user?.name}</h3>
                        <p className="text-sm text-gray-400">{user?.role?.toUpperCase()}</p>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                        <input 
                          type="text" 
                          value={profileData.name}
                          onChange={e => setProfileData({...profileData, name: e.target.value})}
                          className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                          <input 
                            type="email" 
                            value={profileData.email}
                            onChange={e => setProfileData({...profileData, email: e.target.value})}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
                          />
                        </div>
                        <div>
                          <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Mobile Number</label>
                          <input 
                            type="text" 
                            value={profileData.phone}
                            onChange={e => setProfileData({...profileData, phone: e.target.value})}
                            className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 outline-none transition-colors"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-white/5 flex justify-end">
                      <button 
                        type="submit" 
                        disabled={savingProfile}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 px-6 rounded-xl transition-colors flex items-center gap-2"
                      >
                        {savingProfile ? <RefreshCw size={18} className="animate-spin" /> : <Save size={18} />}
                        Save Changes
                      </button>
                    </div>
                  </form>
                  
                  <div className="bg-[#0d1422] border border-white/5 rounded-2xl p-6">
                     <h3 className="text-lg font-bold mb-4">Saved Addresses</h3>
                     <p className="text-sm text-gray-500 mb-4">Your addresses will be visible here when added during booking.</p>
                     {/* Add specific address management here if needed later */}
                  </div>
                </div>
              )}

              {/* --- FEEDBACK --- */}
              {activeTab === 'feedback' && (
                <div>
                  <div className="mb-8">
                    <h1 className="text-3xl font-black font-['Outfit']">Service Feedback</h1>
                    <p className="text-gray-500 mt-1">Review your completed repairs and submit your feedback.</p>
                  </div>

                  {/* Pending Feedback Sub-section */}
                  <div className="mb-10">
                    <h2 className="text-xl font-bold font-['Outfit'] mb-4 text-amber-400 flex items-center gap-2">
                      <Clock size={20} /> Awaiting Feedback
                    </h2>
                    {pendingFeedbackOrders.length === 0 ? (
                      <div className="bg-[#0d1422] border border-white/5 rounded-2xl p-8 text-center text-gray-500 text-sm">
                        No pending feedback. All your completed repairs have been reviewed. Thank you!
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingFeedbackOrders.map(order => (
                          <div key={order._id} className="bg-[#0d1422] border border-blue-500/20 rounded-2xl p-5 hover:border-blue-500/40 transition-colors flex items-center justify-between">
                            <div>
                              <div className="font-bold text-white text-base">{order.deviceBrand} {order.deviceModel}</div>
                              <div className="text-xs text-gray-400 mt-1 font-mono">Ref: {order.referenceNumber}</div>
                              <div className="text-xs text-gray-500 mt-0.5">Finished: {new Date(order.updatedAt).toLocaleDateString()}</div>
                            </div>
                            <button
                              onClick={() => openDetails(order)}
                              className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 px-4 rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                            >
                              <Star size={14} className="fill-white" /> Rate Service
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Feedback History Sub-section */}
                  <div>
                    <h2 className="text-xl font-bold font-['Outfit'] mb-4 text-emerald-400 flex items-center gap-2">
                      <Check size={20} /> Submitted Feedback History
                    </h2>
                    {myFeedbacks.length === 0 ? (
                      <div className="bg-[#0d1422] border border-white/5 rounded-2xl p-8 text-center text-gray-500 text-sm">
                        You have not submitted any feedback yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {myFeedbacks.map(fb => (
                          <div key={fb._id} className="bg-[#0d1422] border border-white/5 rounded-2xl p-5 space-y-3">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/5 pb-2">
                              <div>
                                <div className="font-semibold text-white">
                                  {fb.booking ? `${fb.booking.deviceBrand} ${fb.booking.deviceModel}` : `Order #${fb.orderId}`}
                                </div>
                                <div className="text-[10px] text-gray-500 mt-0.5 font-mono">Ref: {fb.orderId}</div>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <div className="flex gap-0.5">
                                  {[1, 2, 3, 4, 5].map(star => (
                                    <Star 
                                      key={star} 
                                      size={12} 
                                      className={fb.rating >= star ? 'text-amber-400 fill-amber-400' : 'text-gray-700'} 
                                    />
                                  ))}
                                </div>
                                <span className="text-xs font-bold text-amber-400">{fb.rating}/5</span>
                              </div>
                            </div>

                            {fb.review && (
                              <p className="text-xs text-gray-300 italic bg-white/[0.01] p-3 rounded-lg border border-white/5">
                                "{fb.review}"
                              </p>
                            )}

                            {/* Detailed metrics */}
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-[10px]">
                              {[
                                { label: 'Service Quality', value: fb.serviceQuality },
                                { label: 'Pickup Exp.', value: fb.pickupExperience },
                                { label: 'Tech Behavior', value: fb.technicianBehavior },
                                { label: 'Timeliness', value: fb.timeliness },
                                { label: 'Overall Sat.', value: fb.overallSatisfaction }
                              ].map(metric => (
                                <div key={metric.label} className="bg-black/20 p-2 rounded-xl text-center">
                                  <div className="text-gray-500 font-semibold mb-0.5">{metric.label}</div>
                                  <div className="text-amber-400 font-bold">{metric.value || fb.rating}/5</div>
                                </div>
                              ))}
                            </div>
                            
                            <div className="text-[10px] text-gray-500 text-right">
                              Submitted: {new Date(fb.createdAt).toLocaleDateString()}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* --- SUPPORT --- */}
              {activeTab === 'support' && (
                <div className="max-w-2xl">
                  <div className="mb-8">
                    <h1 className="text-3xl font-black font-['Outfit']">Help & Support</h1>
                    <p className="text-gray-500 mt-1">We're here to help with your device repairs.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div className="bg-[#0d1422] border border-white/5 rounded-2xl p-6 text-center">
                      <div className="w-12 h-12 bg-blue-500/10 text-blue-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Smartphone size={24} />
                      </div>
                      <h3 className="font-bold mb-1">Call Us</h3>
                      <p className="text-sm text-gray-400 mb-3">+91 8070900800</p>
                      <a href="tel:+918070900800" className="text-xs font-bold bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors inline-block">Call Now</a>
                    </div>
                    <div className="bg-[#0d1422] border border-white/5 rounded-2xl p-6 text-center">
                      <div className="w-12 h-12 bg-emerald-500/10 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star size={24} />
                      </div>
                      <h3 className="font-bold mb-1">Email Support</h3>
                      <p className="text-sm text-gray-400 mb-3">support@repairvafe.com</p>
                      <a href="mailto:support@repairvafe.com" className="text-xs font-bold bg-white/5 hover:bg-white/10 px-4 py-2 rounded-lg transition-colors inline-block">Send Email</a>
                    </div>
                  </div>

                  <div className="bg-[#0d1422] border border-white/5 rounded-2xl p-6">
                    <h3 className="font-bold text-lg mb-4">Frequently Asked Questions</h3>
                    <div className="space-y-3">
                       {['How long does repair take?', 'Do you provide warranty?', 'What happens to my data?'].map((q, i) => (
                         <div key={i} className="p-4 rounded-xl border border-white/5 bg-white/5 text-sm font-semibold hover:bg-white/10 transition-colors cursor-pointer flex justify-between items-center">
                           <span>{q}</span>
                           <ChevronRight size={16} className="text-gray-500" />
                         </div>
                       ))}
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </main>
      </div>

      <ModalShell
        open={notifOpen}
        title="Notification Center"
        onClose={() => setNotifOpen(false)}
      >
        {notifications.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-8">No notifications yet.</div>
        ) : (
          <div className="space-y-3">
            {notifications.map((n) => (
              <div key={n.id} className="p-4 rounded-xl border border-white/10 bg-[#080c14]">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="text-sm font-bold text-white">{n.stage}</div>
                    <div className="text-xs text-gray-500 mt-0.5 font-mono">{n.bookingId} {n.device ? `· ${n.device}` : ''}</div>
                  </div>
                  <div className="text-[10px] font-bold text-blue-400 whitespace-nowrap bg-blue-500/10 px-2 py-1 rounded-md">
                    {new Date(n.date).toLocaleDateString()}
                  </div>
                </div>
                {n.note && <div className="text-xs text-gray-400 mt-2 leading-relaxed">{n.note}</div>}
              </div>
            ))}
          </div>
        )}
      </ModalShell>

      <ModalShell
        open={detailsOpen}
        title={activeOrder ? `Order Details: ${activeOrder.referenceNumber || activeOrder._id}` : 'Order Details'}
        onClose={() => setDetailsOpen(false)}
      >
        {!activeOrder ? (
          <div className="text-sm text-gray-500">No order selected.</div>
        ) : (
          <div>
            <div className="grid grid-cols-2 gap-3 text-xs text-gray-400">
              <div className="p-3 rounded-xl bg-[#080c14] border border-white/10">
                <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Device</div>
                <div className="text-sm font-bold text-white">{activeOrder.deviceBrand} {activeOrder.deviceModel}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#080c14] border border-white/10">
                <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Status</div>
                <div className="text-sm font-bold text-white">{activeOrder.status}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#080c14] border border-white/10">
                <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Est. Amount</div>
                <div className="text-sm font-bold text-white">{activeOrder.approxAmount ? `₹${Number(activeOrder.approxAmount).toLocaleString('en-IN')}` : 'Pending review'}</div>
              </div>
              <div className="p-3 rounded-xl bg-[#080c14] border border-white/10">
                <div className="text-[11px] text-gray-500 uppercase tracking-wider mb-1">Quote Status</div>
                <div className="text-sm font-bold text-blue-400">{activeOrder.quotationStatus || 'Not issued'}</div>
              </div>
              <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 col-span-2">
                <div className="text-[11px] text-blue-300 uppercase tracking-wider mb-1">Official Quotation</div>
                <div className="text-xl font-black text-white">
                  {(activeOrder.quotationAmount || 0) > 0
                    ? `₹${activeOrder.quotationAmount.toLocaleString('en-IN')}`
                    : 'Awaiting Assessment from Admin'}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="text-sm font-black font-['Outfit'] mb-4 uppercase tracking-widest text-gray-500">Tracking Timeline</div>
              {normalizeTimeline(activeOrder).length === 0 ? (
                <div className="text-sm text-gray-500">No updates yet.</div>
              ) : (
                <div className="space-y-4 border-l-2 border-white/10 ml-2 pl-4 relative">
                  {normalizeTimeline(activeOrder).slice().reverse().map((t, idx) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[23px] top-1 w-3 h-3 rounded-full bg-blue-500 border-2 border-[#0d1422]"></div>
                      <div className="text-sm font-bold text-white">{t.stage}</div>
                      <div className="text-[11px] text-gray-500 mb-1">
                        {new Date(t.date).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                      {t.note && <div className="text-xs text-gray-400">{t.note}</div>}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-white/10 flex flex-wrap gap-3">
              {(activeOrder.quotationStatus === 'Awaiting Customer Approval' && (activeOrder.quotationAmount || 0) > 0) && (
                <>
                  <button
                    onClick={() => handleQuote(activeOrder._id, 'approve')}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-bold bg-emerald-500 hover:bg-emerald-600 text-white transition-colors inline-flex justify-center items-center gap-2"
                  >
                    <Check size={16} /> Approve Quotation
                  </button>
                  <button
                    onClick={() => handleQuote(activeOrder._id, 'reject')}
                    className="flex-1 px-4 py-3 rounded-xl text-sm font-bold bg-white/5 hover:bg-red-500/20 hover:text-red-400 border border-white/10 hover:border-red-500/50 transition-colors inline-flex justify-center items-center gap-2"
                  >
                    <X size={16} /> Reject
                  </button>
                </>
              )}
              {(['Delivered', 'Completed', 'Closed'].includes(activeOrder.status) && (activeOrder.finalAmount || activeOrder.invoiceNumber)) && (
                <button
                  onClick={() => downloadInvoice(activeOrder._id, activeOrder.invoiceNumber || `INV-${activeOrder.referenceNumber || activeOrder._id}`)}
                  className="w-full px-4 py-3 rounded-xl text-sm font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors inline-flex justify-center items-center gap-2"
                >
                  <Download size={16} /> Download Invoice
                </button>
              )}
              {(['Ready For Return', 'Out for Delivery / Ready for Pickup', 'Delivered / Returned', 'Settlement Pending'].includes(activeOrder.status)) && (
                <button
                  onClick={() => handleVerifyReturnOtp(activeOrder._id)}
                  className="w-full px-4 py-3 rounded-xl text-sm font-bold bg-emerald-600 hover:bg-emerald-500 text-white transition-colors inline-flex justify-center items-center gap-2"
                >
                  <Check size={16} /> Verify Return OTP
                </button>
              )}
            </div>

            {['Completed', 'Delivered', 'Repair Completed', 'Closed', 'Job Closed', 'Ready for Delivery'].includes(activeOrder.status) && (
              <div className="mt-8 border-t border-white/10 pt-6">
                <div className="text-sm font-black font-['Outfit'] mb-4 uppercase tracking-widest text-blue-400 flex items-center gap-2">
                  <Star size={16} /> Service Feedback
                </div>
                {activeOrder.customerFeedbackStatus === 'Feedback Submitted' ? (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm font-bold flex items-center gap-2">
                    <Check size={18} /> Thank you! You have already submitted feedback for this order.
                  </div>
                ) : (
                  <form onSubmit={handleFeedbackSubmit} className="space-y-4 bg-white/[0.02] border border-white/5 p-5 rounded-2xl">
                    <div className="text-xs text-gray-400 mb-2">We value your opinion. Please rate your experience:</div>
                    
                    {[
                      { key: 'rating', label: 'Overall Rating' },
                      { key: 'serviceQuality', label: 'Service Quality' },
                      { key: 'pickupExperience', label: 'Pickup Experience' },
                      { key: 'technicianBehavior', label: 'Technician Behavior' },
                      { key: 'timeliness', label: 'Timeliness / Speed' },
                      { key: 'overallSatisfaction', label: 'Overall Satisfaction' }
                    ].map(ratingItem => (
                      <div key={ratingItem.key} className="flex items-center justify-between gap-4">
                        <span className="text-xs font-semibold text-gray-300">{ratingItem.label}</span>
                        <div className="flex gap-1.5">
                          {[1, 2, 3, 4, 5].map(starNum => (
                            <button
                              key={starNum}
                              type="button"
                              onClick={() => setFeedbackForm(prev => ({ ...prev, [ratingItem.key]: starNum }))}
                              className={`p-1 transition-all ${feedbackForm[ratingItem.key] >= starNum ? 'text-amber-400 scale-110' : 'text-gray-600 hover:text-amber-200'}`}
                            >
                              <Star size={16} fill={feedbackForm[ratingItem.key] >= starNum ? 'currentColor' : 'none'} />
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}

                    <div className="mt-3">
                      <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wider">Review / Comments</label>
                      <textarea
                        rows={3}
                        value={feedbackForm.review}
                        onChange={e => setFeedbackForm(prev => ({ ...prev, review: e.target.value }))}
                        placeholder="Share your experience working with RepairVafe..."
                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:border-blue-500 outline-none transition-colors"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submittingFeedback}
                      className="w-full mt-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors inline-flex justify-center items-center gap-2 shadow-lg shadow-blue-500/20 disabled:opacity-50"
                    >
                      {submittingFeedback ? <RefreshCw size={14} className="animate-spin" /> : <Check size={14} />}
                      Submit Feedback
                    </button>
                  </form>
                )}
              </div>
            )}
          </div>
        )}
      </ModalShell>

      {toast && (
        <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50">
          <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} className={`px-6 py-3 rounded-full border text-sm font-bold shadow-xl ${
            toast.type === 'success'
              ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
              : toast.type === 'error'
                ? 'bg-red-500/10 border-red-500/30 text-red-400'
                : 'bg-[#111111] border-white/10 text-white'
          }`}>
            {toast.message}
          </motion.div>
        </div>
      )}
    </div>
  );
};
