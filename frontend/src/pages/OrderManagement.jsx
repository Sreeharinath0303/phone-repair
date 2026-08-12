import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Search,
  RefreshCw,
  Smartphone,
  MapPin,
  User,
  ArrowUpRight,
  ChevronDown,
  Trash2
} from 'lucide-react';
import { getApiBaseUrl } from '../utils/apiBase';

const STATUS_COLOR = {
  'Quote Approved': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Partner Locked': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Pickup Scheduled': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Store Visit Scheduled': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Picked Up': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Device Received': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  'Diagnosis In Progress': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Repair Ongoing': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Settlement Pending': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Completed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Delivered / Returned': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Settlement Completed': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Delivered: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  Cancelled: 'bg-red-500/10 text-red-400 border-red-500/20'
};

const ALL_STATUSES = [
  'Quote Approved',
  'Partner Locked',
  'Pickup Scheduled',
  'Store Visit Scheduled',
  'Picked Up',
  'Device Received',
  'Diagnosis In Progress',
  'Repair Ongoing',
  'Settlement Pending',
  'Delivered / Returned',
  'Settlement Completed',
  'Completed',
  'Delivered',
  'Cancelled'
];

const formatAmount = (amount) => `Rs ${Number(amount || 0).toLocaleString('en-IN')}`;
const ORDER_READ_STATE_KEY = 'rv_admin_read_orders';

const parseStoredIds = (storageKey) => {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

export const OrderManagement = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [expandedId, setExpandedId] = useState(null);
  const [updating, setUpdating] = useState(null);
  const [deleting, setDeleting] = useState(null);
  const [newStatus, setNewStatus] = useState({});
  const [readOrderIds, setReadOrderIds] = useState(() => parseStoredIds(ORDER_READ_STATE_KEY));

  useEffect(() => {
    fetchOrders();
  }, []);

  useEffect(() => {
    localStorage.setItem(ORDER_READ_STATE_KEY, JSON.stringify(readOrderIds));
  }, [readOrderIds]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${getApiBaseUrl()}/orders`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to load orders.');
      }

      setOrders(data.data || []);
    } catch (error) {
      console.error('Failed to load orders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (orderId) => {
    const status = newStatus[orderId];
    if (!status) return;

    const targetOrder = orders.find((order) => order._id === orderId);
    const linkedBookingId = typeof targetOrder?.bookingId === 'object'
      ? targetOrder?.bookingId?._id
      : targetOrder?.bookingId;

    if (!linkedBookingId) {
      window.alert('This order is not linked to a booking record.');
      return;
    }

    setUpdating(orderId);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${getApiBaseUrl()}/admin/update-status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ bookingId: linkedBookingId, status })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to update order status.');
      }

      setOrders((prev) => prev.map((order) => (
        order._id === orderId ? { ...order, status } : order
      )));
      setNewStatus((prev) => {
        const next = { ...prev };
        delete next[orderId];
        return next;
      });
    } catch (error) {
      console.error('Failed to update order status:', error);
      window.alert(error.message || 'Failed to update order status.');
    } finally {
      setUpdating(null);
    }
  };

  const handleDeleteOrder = async (orderId, orderNumber) => {
    if (!window.confirm(`Delete order ${orderNumber || 'this order'}? This action cannot be undone.`)) {
      return;
    }

    setDeleting(orderId);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${getApiBaseUrl()}/orders/${orderId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || 'Failed to delete order.');
      }

      setOrders((prev) => prev.filter((order) => order._id !== orderId));
      setExpandedId((current) => (current === orderId ? null : current));
    } catch (error) {
      console.error('Failed to delete order:', error);
      window.alert(error.message || 'Failed to delete order.');
    } finally {
      setDeleting(null);
    }
  };

  const markOrderAsRead = (orderId) => {
    if (!orderId) return;
    setReadOrderIds((current) => (current.includes(orderId) ? current : [...current, orderId]));
  };

  const filteredOrders = orders
    .filter((order) => statusFilter === 'all' || order.status === statusFilter)
    .filter((order) => {
      if (!search) return true;
      const haystack = [
        order.orderNumber,
        order.referenceNumber,
        order.customerName,
        order.customerPhone,
        order.customerEmail,
        order.city,
        order.deviceInfo?.brand,
        order.deviceInfo?.model
      ].join(' ').toLowerCase();
      return haystack.includes(search.toLowerCase());
    })
    .sort((a, b) => {
      const aIsUnread = !readOrderIds.includes(a._id);
      const bIsUnread = !readOrderIds.includes(b._id);
      if (aIsUnread !== bIsUnread) {
        return aIsUnread ? -1 : 1;
      }
      return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
    });

  const unreadOrdersCount = orders.filter((order) => !readOrderIds.includes(order._id)).length;

  const stats = [
    { label: 'Total', value: orders.length, color: 'text-white' },
    {
      label: 'In Repair',
      value: orders.filter((order) => (
        ['Diagnosis In Progress', 'Repair Ongoing', 'Settlement Pending'].includes(order.status)
      )).length,
      color: 'text-amber-400'
    },
    {
      label: 'Completed',
      value: orders.filter((order) => (
        ['Completed', 'Delivered', 'Delivered / Returned', 'Settlement Completed'].includes(order.status)
      )).length,
      color: 'text-emerald-400'
    },
    {
      label: 'Revenue',
      value: formatAmount(orders.reduce((sum, order) => sum + Number(order.payment?.amount || 0), 0)),
      color: 'text-purple-400'
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <h2 className="font-['Outfit'] text-2xl font-black text-white">Order Management</h2>
          <p className="mt-1 text-sm text-gray-500">All repair orders - track, update, and manage</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-200">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-400" />
            {unreadOrdersCount} unread order{unreadOrdersCount === 1 ? '' : 's'}
          </div>
          <button
            onClick={fetchOrders}
            className="flex items-center gap-2 text-sm text-gray-400 transition-colors hover:text-white"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-2xl border border-white/5 bg-[#111111] p-4">
            <div className={`font-['Outfit'] text-xl font-black ${stat.color}`}>{stat.value}</div>
            <div className="mt-1 text-xs text-gray-500">{stat.label}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search orders..."
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="w-full rounded-xl border border-white/5 bg-[#111111] py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 transition-colors focus:border-blue-500 focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value)}
          className="rounded-xl border border-white/5 bg-[#111111] px-4 py-2.5 text-sm text-white transition-colors focus:border-blue-500 focus:outline-none"
        >
          <option value="all">All Statuses</option>
          {ALL_STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw size={24} className="animate-spin text-blue-500" />
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="rounded-3xl border border-white/5 bg-[#111111] py-16 text-center">
          <Package size={40} className="mx-auto mb-4 text-gray-700" />
          <p className="text-gray-500">No orders found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredOrders.map((order, index) => (
            (() => {
              const isUnread = !readOrderIds.includes(order._id);
              return (
            <motion.div
              key={order._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`overflow-hidden rounded-2xl border bg-[#111111] ${isUnread ? 'border-blue-500/25 shadow-[0_0_0_1px_rgba(59,130,246,0.08)]' : 'border-white/5'}`}
            >
              <button
                onClick={() => {
                  setExpandedId(expandedId === order._id ? null : order._id);
                  markOrderAsRead(order._id);
                }}
                className={`flex w-full items-start justify-between gap-3 p-4 sm:p-5 text-left transition-colors ${isUnread ? 'bg-blue-500/[0.05] hover:bg-blue-500/[0.08]' : 'hover:bg-white/[0.02]'}`}
              >
                <div className="flex min-w-0 items-start gap-4">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl bg-white/5 text-gray-400">
                    <Smartphone size={18} />
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2.5">
                      <span className="text-sm font-bold text-white">{order.orderNumber}</span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${isUnread ? 'border-blue-400/30 bg-blue-500/15 text-blue-200' : 'border-white/10 bg-white/5 text-gray-500'}`}>
                        {isUnread ? 'Unread' : 'Read'}
                      </span>
                      <span className={`rounded-full border px-2.5 py-0.5 text-xs font-bold ${STATUS_COLOR[order.status] || 'border-gray-500/20 bg-gray-500/10 text-gray-400'}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-2 sm:gap-3">
                      <span className="text-xs text-gray-500 break-words">
                        {order.deviceInfo?.brand} {order.deviceInfo?.model}
                      </span>
                      {order.city && (
                        <span className="flex items-center gap-1 text-xs text-gray-600">
                          <MapPin size={10} />
                          {order.city}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3 sm:gap-4">
                  {Number(order.payment?.amount || 0) > 0 && (
                    <span className="hidden text-sm font-bold text-white sm:block">
                      {formatAmount(order.payment.amount)}
                    </span>
                  )}
                  <ChevronDown
                    size={16}
                    className={`text-gray-500 transition-transform ${expandedId === order._id ? 'rotate-180' : ''}`}
                  />
                </div>
              </button>

              {expandedId === order._id && (
                <div className="border-t border-white/5 px-5 pb-5 pt-4">
                  <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500">Customer</h4>
                      <div className="flex items-center gap-2 text-sm text-gray-300">
                        <User size={14} className="text-gray-500" />
                        {order.customerName || '-'}
                      </div>
                      <div className="text-xs text-gray-500">{order.customerPhone || 'No phone provided'}</div>

                      <h4 className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-500">Customer Complaint</h4>
                      <div className="rounded-xl border border-white/5 bg-white/5 p-3 text-sm leading-relaxed text-gray-300">
                        {order.issueDescription || 'No complaint or issue description provided.'}
                      </div>

                      <h4 className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-500">Assigned Partner</h4>
                      <div className="rounded-xl border border-purple-500/10 bg-purple-500/5 p-3 text-sm font-bold text-purple-400">
                        {order.assignedTechnician ? (
                          typeof order.assignedTechnician === 'object' ? (
                            <span>
                              {order.assignedTechnician.name} ({order.assignedTechnician.specialization || 'Technician'})
                            </span>
                          ) : (
                            <span>{order.assignedTechnician}</span>
                          )
                        ) : (
                          <span className="font-medium italic text-gray-500">No service partner assigned yet.</span>
                        )}
                      </div>

                      <h4 className="mt-4 text-xs font-bold uppercase tracking-widest text-gray-500">Repair Details</h4>
                      {(order.repairDetails || []).length > 0 ? (
                        order.repairDetails.map((repair, repairIndex) => (
                          <div key={repairIndex} className="flex justify-between text-sm">
                            <span className="text-gray-300">{repair.service}</span>
                            {Number(repair.price || 0) > 0 && (
                              <span className="font-bold text-white">{formatAmount(repair.price)}</span>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-sm text-gray-500">No repair details available.</div>
                      )}

                      <div className="flex items-center justify-between border-t border-white/5 pt-2">
                        <span className="text-xs text-gray-500">Payment</span>
                        <span className={`text-xs font-bold ${order.payment?.status === 'Paid' ? 'text-emerald-400' : 'text-amber-400'}`}>
                          {order.payment?.status || 'Pending'}
                        </span>
                      </div>
                    </div>

                    <div className="min-w-0">
                      <h4 className="mb-3 text-xs font-bold uppercase tracking-widest text-gray-500">Update Status</h4>
                      <div className="flex flex-col sm:flex-row gap-2">
                        <select
                          value={newStatus[order._id] || order.status}
                          onChange={(event) => setNewStatus((prev) => ({ ...prev, [order._id]: event.target.value }))}
                          className="flex-1 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white focus:border-blue-500 focus:outline-none"
                        >
                          {ALL_STATUSES.map((status) => (
                            <option key={status} value={status} className="bg-[#111111]">
                              {status}
                            </option>
                          ))}
                        </select>
                        <button
                          onClick={() => handleStatusUpdate(order._id)}
                          disabled={updating === order._id || !newStatus[order._id] || newStatus[order._id] === order.status}
                          className="flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-40"
                        >
                          {updating === order._id ? <RefreshCw size={14} className="animate-spin" /> : <ArrowUpRight size={14} />}
                          Update
                        </button>
                      </div>

                      <button
                        onClick={() => handleDeleteOrder(order._id, order.orderNumber)}
                        disabled={deleting === order._id}
                        className="mt-3 inline-flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm font-bold text-red-400 transition-colors hover:bg-red-500/15 disabled:opacity-40"
                      >
                        {deleting === order._id ? <RefreshCw size={14} className="animate-spin" /> : <Trash2 size={14} />}
                        Delete Order
                      </button>

                      <div className="mt-3 text-xs text-gray-600">
                        Created: {new Date(order.createdAt).toLocaleString('en-IN')}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
              );
            })()
          ))}
        </div>
      )}
    </div>
  );
};
