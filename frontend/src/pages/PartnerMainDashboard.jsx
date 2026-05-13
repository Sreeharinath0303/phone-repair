import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  Wrench, Package, CheckCircle2, Clock, LogOut, RefreshCw,
  Smartphone, ArrowRight, MapPin, Star, TrendingUp, IndianRupee
} from 'lucide-react';

const STATUS_COLOR = {
  'Received':  'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Confirmed': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Picked Up': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'In Repair': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Completed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Delivered': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Cancelled': 'bg-red-500/10 text-red-400 border-red-500/20'
};

const NEXT_STATUS = {
  'Received': 'Confirmed',
  'Confirmed': 'Picked Up',
  'Picked Up': 'In Repair',
  'In Repair': 'Completed',
  'Completed': 'Delivered'
};

export const PartnerDashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({ assigned: 0, inProgress: 0, completed: 0, earnings: 0 });
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);

  useEffect(() => {
    const stored = localStorage.getItem('rv_user');
    if (stored) setUser(JSON.parse(stored));
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('rv_token');
      const [statsRes, ordersRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/technicians/dashboard-stats`, { headers: { Authorization: `Bearer ${token}` } }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/technicians/my-orders`, { headers: { Authorization: `Bearer ${token}` } })
      ]);
      const [sd, od] = await Promise.all([statsRes.json(), ordersRes.json()]);
      if (sd.success) setStats(sd.data);
      if (od.success) setOrders(od.data || []);
    } catch {
      // demo fallback
      setStats({ assigned: 5, inProgress: 2, completed: 38, earnings: 28400 });
      setOrders([
        {
          _id: 'p-demo-1',
          orderNumber: 'ORD-2025-007',
          deviceInfo: { brand: 'Apple', model: 'iPhone 15' },
          status: 'In Repair',
          repairDetails: [{ service: 'Screen Replacement', price: 2499 }],
          customerAddress: 'Sector 18, Noida'
        },
        {
          _id: 'p-demo-2',
          orderNumber: 'ORD-2025-008',
          deviceInfo: { brand: 'Samsung', model: 'Galaxy S23' },
          status: 'Confirmed',
          repairDetails: [{ service: 'Battery Replacement', price: 899 }],
          customerAddress: 'Connaught Place, Delhi'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId, newStatus) => {
    setUpdating(orderId);
    try {
      const token = localStorage.getItem('rv_token');
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/update-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingId: orderId, status: newStatus })
      });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    } catch {
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: newStatus } : o));
    } finally {
      setUpdating(null);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-[#080c14] text-white font-['Inter']">
      {/* Topbar */}
      <header className="sticky top-0 z-40 bg-[#080c14]/90 backdrop-blur-md border-b border-white/5 px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-xs font-bold">⚡</div>
          <span className="font-bold font-['Outfit']">Partner<span className="text-blue-400"> Hub</span></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1.5 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs font-semibold text-emerald-400">Online</span>
          </div>
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center font-bold text-sm">
            {user?.name?.[0]?.toUpperCase() || 'P'}
          </div>
          <button onClick={handleLogout} className="text-gray-500 hover:text-red-400 transition-colors p-2">
            <LogOut size={16} />
          </button>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-2xl font-black font-['Outfit']">Welcome back, {user?.name?.split(' ')[0] || 'Partner'} 🔧</h1>
          <p className="text-gray-500 text-sm mt-1">{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            { label: 'Assigned', value: stats.assigned, icon: Package, color: 'text-blue-400', bg: 'bg-blue-400/10' },
            { label: 'In Progress', value: stats.inProgress, icon: Wrench, color: 'text-amber-400', bg: 'bg-amber-400/10' },
            { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
            { label: 'Earnings', value: `₹${Number(stats.earnings || 0).toLocaleString()}`, icon: IndianRupee, color: 'text-purple-400', bg: 'bg-purple-400/10' }
          ].map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.08 }}
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

        {/* Orders */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold font-['Outfit']">My Assigned Jobs</h2>
          <button onClick={fetchData} className="text-gray-500 hover:text-white transition-colors">
            <RefreshCw size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-16 bg-[#0d1422] border border-white/5 rounded-2xl">
            <Wrench size={40} className="text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No jobs assigned yet.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order, i) => (
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
                      <div className="font-bold text-white">{order.deviceInfo?.brand} {order.deviceInfo?.model}</div>
                      <div className="text-xs text-gray-500 font-mono">{order.orderNumber}</div>
                    </div>
                  </div>
                  <span className={`text-xs font-bold px-3 py-1 rounded-full border ${STATUS_COLOR[order.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                    {order.status}
                  </span>
                </div>

                {order.repairDetails?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {order.repairDetails.map((r, ri) => (
                      <span key={ri} className="text-xs bg-white/5 text-gray-300 px-3 py-1 rounded-full border border-white/5">
                        {r.service} {r.price ? `– ₹${r.price}` : ''}
                      </span>
                    ))}
                  </div>
                )}

                {order.customerAddress && (
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-4">
                    <MapPin size={12} />
                    {order.customerAddress}
                  </div>
                )}

                {NEXT_STATUS[order.status] && (
                  <button
                    onClick={() => handleStatusUpdate(order._id, NEXT_STATUS[order.status])}
                    disabled={updating === order._id}
                    className="w-full bg-blue-600/20 border border-blue-500/30 text-blue-400 font-semibold py-2.5 rounded-xl text-sm hover:bg-blue-600/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {updating === order._id ? <RefreshCw size={14} className="animate-spin" /> : <ArrowRight size={14} />}
                    Mark as {NEXT_STATUS[order.status]}
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
