import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Smartphone, Package, Clock, CheckCircle2, LogOut,
  Plus, ChevronRight, RefreshCw, User, Bell, Star
} from 'lucide-react';

const STATUS_COLOR = {
  'Received':    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Confirmed':   'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Picked Up':   'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'In Repair':   'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Completed':   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Delivered':   'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Cancelled':   'bg-red-500/10 text-red-400 border-red-500/20'
};

export const CustomerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('active');

  useEffect(() => {
    const stored = localStorage.getItem('rv_user');
    if (stored) setUser(JSON.parse(stored));
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/customer/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setOrders(data.data || []);
    } catch {
      // demo fallback
      setOrders([
        {
          _id: 'demo-1',
          orderNumber: 'ORD-2025-001',
          deviceInfo: { brand: 'Samsung', model: 'Galaxy S24' },
          status: 'In Repair',
          payment: { amount: 1299, status: 'Pending' },
          createdAt: new Date().toISOString(),
          timeline: [
            { status: 'Received', timestamp: new Date(Date.now() - 3600000 * 5).toISOString() },
            { status: 'In Repair', timestamp: new Date(Date.now() - 3600000 * 1).toISOString() }
          ]
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  const active = orders.filter(o => !['Completed', 'Delivered', 'Cancelled'].includes(o.status));
  const history = orders.filter(o => ['Completed', 'Delivered', 'Cancelled'].includes(o.status));
  const shown = tab === 'active' ? active : history;

  return (
    <div className="min-h-screen bg-[#080c14] text-white font-['Inter']">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-[#080c14]/90 backdrop-blur-md border-b border-white/5 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-xs font-bold">⚡</div>
          <span className="font-bold font-['Outfit']">Repair<span className="text-blue-400">Vafe</span></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold">{user?.name || 'Customer'}</div>
            <div className="text-xs text-gray-500">{user?.email || ''}</div>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-sm">
            {user?.name?.[0]?.toUpperCase() || 'C'}
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors p-2">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-black font-['Outfit']">Hi, {user?.name?.split(' ')[0] || 'there'} 👋</h1>
          <p className="text-gray-500 text-sm mt-1">Here's the status of your repairs.</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Total Repairs', value: orders.length, icon: Package, color: 'text-blue-400', bg: 'bg-blue-400/10' },
            { label: 'Active', value: active.length, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-400/10' },
            { label: 'Completed', value: history.filter(o => o.status !== 'Cancelled').length, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' }
          ].map(s => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-[#0d1422] border border-white/5 rounded-2xl p-5"
            >
              <div className={`w-10 h-10 ${s.bg} ${s.color} rounded-xl flex items-center justify-center mb-3`}>
                <s.icon size={20} />
              </div>
              <div className="text-2xl font-black font-['Outfit']">{s.value}</div>
              <div className="text-xs text-gray-500 mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>

        {/* New Booking CTA */}
        <Link
          to="/book"
          className="flex items-center justify-between bg-gradient-to-r from-blue-600/20 to-cyan-500/10 border border-blue-500/20 rounded-2xl p-5 mb-8 hover:border-blue-500/40 transition-colors group"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
              <Plus size={24} />
            </div>
            <div>
              <div className="font-bold text-white">Book a New Repair</div>
              <div className="text-xs text-gray-400 mt-0.5">Expert at your door in 60 minutes</div>
            </div>
          </div>
          <ChevronRight size={18} className="text-gray-500 group-hover:text-blue-400 group-hover:translate-x-1 transition-all" />
        </Link>

        {/* Orders */}
        <div>
          {/* Tabs */}
          <div className="flex gap-1 bg-white/5 p-1 rounded-xl mb-6 w-fit">
            {['active', 'history'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold capitalize transition-all ${tab === t ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
              >
                {t === 'active' ? `Active (${active.length})` : `History (${history.length})`}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <RefreshCw size={24} className="animate-spin text-blue-500" />
            </div>
          ) : shown.length === 0 ? (
            <div className="text-center py-16 bg-[#0d1422] border border-white/5 rounded-2xl">
              <Smartphone size={40} className="text-gray-700 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">No {tab} repairs found.</p>
              {tab === 'active' && (
                <Link to="/book" className="inline-block mt-4 text-sm text-blue-400 hover:underline">Book your first repair →</Link>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {shown.map((order, i) => (
                <motion.div
                  key={order._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="bg-[#0d1422] border border-white/5 rounded-2xl p-5 hover:border-white/10 transition-colors"
                >
                  <div className="flex items-start justify-between gap-4 mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <div className="font-bold text-white text-sm">{order.deviceBrand} {order.deviceModel}</div>
                        <div className="text-xs text-gray-500 font-mono mt-0.5">{order.referenceNumber || order._id}</div>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS_COLOR[order.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                      {order.status}
                    </span>
                  </div>

                  {/* Timeline */}
                  {order.timeline?.length > 0 && (
                    <div className="flex gap-2 overflow-x-auto pb-1 mb-4">
                      {order.timeline.map((t, ti) => (
                        <div key={ti} className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex flex-col items-center">
                            <div className="w-2 h-2 rounded-full bg-blue-500" />
                            <div className="text-[10px] text-gray-500 mt-1 whitespace-nowrap">{t.stage}</div>
                          </div>
                          {ti < order.timeline.length - 1 && <div className="w-8 h-px bg-white/10 mb-4" />}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4 text-xs text-gray-400">
                    <div>Quote: {order.quotationAmount ? `₹${order.quotationAmount.toLocaleString()}` : 'Not issued'}</div>
                    <div>Quote Status: {order.quotationStatus || 'Not Issued'}</div>
                    <div>Service: {order.serviceType || 'Pickup'}</div>
                    <div>Date: {new Date(order.preferredDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
