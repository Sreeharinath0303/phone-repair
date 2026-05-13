import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Package, Search, RefreshCw, Smartphone, MapPin,
  User, ArrowUpRight, ChevronDown, IndianRupee, Filter
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

const ALL_STATUSES = ['Received', 'Confirmed', 'Picked Up', 'In Repair', 'Completed', 'Delivered', 'Cancelled'];

export const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [newStatus, setNewStatus] = useState({});

  useEffect(() => { fetchOrders(); }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/export/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setOrders(data.data || []);
    } catch {
      setOrders([
        {
          _id: 'o1',
          orderNumber: 'ORD-2025-001',
          status: 'In Repair',
          deviceInfo: { brand: 'Apple', model: 'iPhone 15 Pro', category: 'Smartphone' },
          repairDetails: [{ service: 'Screen Replacement', price: 3999 }],
          payment: { amount: 3999, status: 'Pending' },
          customerName: 'Rohan Verma',
          customerPhone: '9876543210',
          city: 'New Delhi',
          createdAt: new Date().toISOString()
        },
        {
          _id: 'o2',
          orderNumber: 'ORD-2025-002',
          status: 'Confirmed',
          deviceInfo: { brand: 'Samsung', model: 'Galaxy S24', category: 'Smartphone' },
          repairDetails: [{ service: 'Battery Replacement', price: 1299 }],
          payment: { amount: 1299, status: 'Paid' },
          customerName: 'Priya Sharma',
          customerPhone: '9123456789',
          city: 'Mumbai',
          createdAt: new Date(Date.now() - 86400000).toISOString()
        },
        {
          _id: 'o3',
          orderNumber: 'ORD-2025-003',
          status: 'Delivered',
          deviceInfo: { brand: 'OnePlus', model: '12', category: 'Smartphone' },
          repairDetails: [{ service: 'Back Glass', price: 999 }],
          payment: { amount: 999, status: 'Paid' },
          customerName: 'Amit Patel',
          customerPhone: '9988776655',
          city: 'Bangalore',
          createdAt: new Date(Date.now() - 172800000).toISOString()
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId) => {
    const status = newStatus[orderId];
    if (!status) return;
    setUpdating(orderId);
    try {
      const token = localStorage.getItem('rv_token');
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/update-status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ bookingId: orderId, status })
      });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
      setNewStatus(prev => { const n = { ...prev }; delete n[orderId]; return n; });
    } catch {
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status } : o));
    } finally {
      setUpdating(null);
    }
  };

  const filtered = orders
    .filter(o => statusFilter === 'all' || o.status === statusFilter)
    .filter(o => !search || `${o.orderNumber} ${o.customerName} ${o.customerPhone} ${o.city}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-['Outfit']">Order Management</h2>
          <p className="text-gray-500 text-sm mt-1">All repair orders — track, update, and manage</p>
        </div>
        <button onClick={fetchOrders} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total', value: orders.length, color: 'text-white' },
          { label: 'In Repair', value: orders.filter(o => o.status === 'In Repair').length, color: 'text-amber-400' },
          { label: 'Completed', value: orders.filter(o => ['Completed', 'Delivered'].includes(o.status)).length, color: 'text-emerald-400' },
          { label: 'Revenue', value: `₹${orders.reduce((s, o) => s + (o.payment?.amount || 0), 0).toLocaleString()}`, color: 'text-purple-400' }
        ].map(s => (
          <div key={s.label} className="bg-[#111111] border border-white/5 rounded-2xl p-4">
            <div className={`text-xl font-black font-['Outfit'] ${s.color}`}>{s.value}</div>
            <div className="text-xs text-gray-500 mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#111111] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-[#111111] border border-white/5 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500 transition-colors"
        >
          <option value="all">All Statuses</option>
          {ALL_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      {/* Order Cards */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={24} className="animate-spin text-blue-500" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 bg-[#111111] border border-white/5 rounded-3xl">
          <Package size={40} className="text-gray-700 mx-auto mb-4" />
          <p className="text-gray-500">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((order, i) => (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="bg-[#111111] border border-white/5 rounded-2xl overflow-hidden"
            >
              <button
                onClick={() => setExpandedId(expandedId === order._id ? null : order._id)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-white/[0.02] transition-colors"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white/5 rounded-xl flex items-center justify-center text-gray-400 flex-shrink-0">
                    <Smartphone size={18} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <span className="font-bold text-white text-sm">{order.orderNumber}</span>
                      <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${STATUS_COLOR[order.status] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-xs text-gray-500">{order.deviceInfo?.brand} {order.deviceInfo?.model}</span>
                      {order.city && <span className="text-xs text-gray-600 flex items-center gap-1"><MapPin size={10} />{order.city}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  {order.payment?.amount && (
                    <span className="font-bold text-white text-sm hidden sm:block">₹{order.payment.amount.toLocaleString()}</span>
                  )}
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform ${expandedId === order._id ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {expandedId === order._id && (
                <div className="px-5 pb-5 border-t border-white/5 pt-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Customer</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <User size={14} className="text-gray-500" />
                        {order.customerName || '—'}
                      </div>
                      <div className="text-xs text-gray-500">{order.customerPhone}</div>

                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mt-4">Repair Details</h4>
                      {order.repairDetails?.map((r, ri) => (
                        <div key={ri} className="flex justify-between text-sm">
                          <span className="text-gray-300">{r.service}</span>
                          {r.price && <span className="font-bold text-white">₹{r.price}</span>}
                        </div>
                      ))}

                      <div className="flex items-center justify-between pt-2 border-t border-white/5">
                        <span className="text-xs text-gray-500">Payment</span>
                        <span className={`text-xs font-bold ${order.payment?.status === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {order.payment?.status || 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3">Update Status</h4>
                      <div className="flex gap-2">
                        <select
                          value={newStatus[order._id] || order.status}
                          onChange={e => setNewStatus(prev => ({ ...prev, [order._id]: e.target.value }))}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-blue-500"
                        >
                          {ALL_STATUSES.map(s => <option key={s} value={s} className="bg-[#111111]">{s}</option>)}
                        </select>
                        <button
                          onClick={() => handleStatusUpdate(order._id)}
                          disabled={updating === order._id || !newStatus[order._id] || newStatus[order._id] === order.status}
                          className="bg-blue-600 text-white font-bold px-4 py-2.5 rounded-xl text-sm hover:bg-blue-700 disabled:opacity-40 transition-colors flex items-center gap-1.5"
                        >
                          {updating === order._id ? <RefreshCw size={14} className="animate-spin" /> : <ArrowUpRight size={14} />}
                          Update
                        </button>
                      </div>
                      <div className="mt-3 text-xs text-gray-600">
                        Created: {new Date(order.createdAt).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};
