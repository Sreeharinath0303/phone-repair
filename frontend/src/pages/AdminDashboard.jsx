import React, { useEffect, useMemo, useState } from 'react';
import {
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
  IndianRupee,
  Activity,
  Shield,
  MapPin,
  ArrowRight,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from '../utils/apiBase';

const DEFAULT_STATS = {
  totalLeads: 0,
  incompleteLeads: 0,
  totalBookings: 0,
  pendingQuotations: 0,
  approvedQuotations: 0,
  assignedOrders: 0,
  ongoingRepairs: 0,
  completedRepairs: 0,
  cancelledOrders: 0,
  activeOrders: 0,
  totalRevenue: 0,
  feedbackPending: 0,
  customers: 0,
  technicians: 0,
  cityWise: [],
  conversions: {
    leadConversionRate: 0,
    quoteConversionRate: 0
  }
};

const formatCurrency = (value) => `Rs ${Number(value || 0).toLocaleString('en-IN')}`;

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const [stats, setStats] = useState(DEFAULT_STATS);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);

    try {
      const token = localStorage.getItem('rv_token');
      const apiBaseUrl = getApiBaseUrl();
      const [statsRes, logsRes] = await Promise.all([
        fetch(`${apiBaseUrl}/admin/analytics`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${apiBaseUrl}/admin/audit-logs?limit=5`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const statsData = await statsRes.json();
      const logsData = await logsRes.json();

      if (statsData.success && statsData.data) {
        setStats({
          ...DEFAULT_STATS,
          ...statsData.data,
          conversions: {
            ...DEFAULT_STATS.conversions,
            ...(statsData.data.conversions || {})
          },
          cityWise: Array.isArray(statsData.data.cityWise) ? statsData.data.cityWise : []
        });
      }

      if (logsData.success && Array.isArray(logsData.data)) {
        setAuditLogs(logsData.data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const totalUsers = Number(stats.customers || 0) + Number(stats.technicians || 0);
  const activeCities = useMemo(() => {
    const topCities = (stats.cityWise || []).filter((item) => item?._id).slice(0, 4);
    const highestCount = topCities[0]?.count || 0;

    return topCities.map((city, index) => ({
      city: city._id,
      count: city.count,
      demand: highestCount > 0 ? Math.max(12, Math.round((city.count / highestCount) * 100)) : 0,
      trend: index === 1 ? 'down' : 'up'
    }));
  }, [stats.cityWise]);

  const pendingActions = useMemo(() => {
    return [
      {
        title: `${stats.pendingQuotations || 0} Quotations Awaiting Response`,
        description: 'Customer approvals are still pending.'
      },
      {
        title: `${stats.feedbackPending || 0} Feedback Requests Pending`,
        description: 'Completed orders still waiting for customer feedback.'
      },
      {
        title: `${stats.incompleteLeads || 0} Leads Not Converted`,
        description: 'Follow-up is still required before booking completion.'
      }
    ].filter((item) => {
      const count = Number(item.title.split(' ')[0]);
      return count > 0;
    });
  }, [stats.feedbackPending, stats.incompleteLeads, stats.pendingQuotations]);

  const statCards = [
    {
      label: 'Total Revenue',
      value: formatCurrency(stats.totalRevenue),
      icon: IndianRupee,
      color: 'text-emerald-500',
      bg: 'bg-emerald-500/10'
    },
    {
      label: 'Active Orders',
      value: Number(stats.activeOrders || 0),
      icon: Activity,
      color: 'text-blue-500',
      bg: 'bg-blue-500/10'
    },
    {
      label: 'Pending Quotes',
      value: Number(stats.pendingQuotations || 0),
      icon: Clock,
      color: 'text-amber-500',
      bg: 'bg-amber-500/10'
    },
    {
      label: 'Total Users',
      value: totalUsers,
      icon: Users,
      color: 'text-purple-500',
      bg: 'bg-purple-500/10'
    }
  ];

  const activityCount = new Set(
    auditLogs
      .map((log) => log.performedBy?._id)
      .filter(Boolean)
  ).size;
  const quoteApprovalRate = Number(stats.conversions?.quoteConversionRate || 0);
  const leadConversionRate = Number(stats.conversions?.leadConversionRate || 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Command Center</h1>
          <p className="text-gray-500 mt-1">Real-time overview of erepaircafe operations</p>
        </div>
        <div className="flex items-center gap-3 shrink-0 lg:ml-auto">
          <div className="flex -space-x-2">
            {Array.from({ length: Math.max(1, Math.min(3, stats.technicians || 1)) }).map((_, index) => (
              <div key={index} className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] bg-gray-800" />
            ))}
          </div>
          <span className="text-xs text-gray-400 font-medium">
            {stats.technicians || 0} Active Partners
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#111111] border border-white/5 p-6 rounded-3xl hover:border-white/10 transition-colors group"
          >
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                <card.icon size={24} />
              </div>
              <TrendingUp size={16} className="text-emerald-500" />
            </div>
            <div className="text-2xl font-bold text-white mb-1 group-hover:scale-105 transition-transform origin-left">{card.value}</div>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wider">{card.label}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#111111] border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-blue-500" />
                <h3 className="font-bold text-white">System Audit Trail</h3>
              </div>
              <button
                type="button"
                onClick={() => navigate('/admin/audit-logs')}
                className="text-xs text-blue-500 font-bold hover:underline"
              >
                View All Logs
              </button>
            </div>
            <div className="p-0">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5">
                    <th className="px-6 py-4 font-bold">Action</th>
                    <th className="px-6 py-4 font-bold">Performer</th>
                    <th className="px-6 py-4 font-bold">Timestamp</th>
                    <th className="px-6 py-4 font-bold text-right">Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {auditLogs.length > 0 ? auditLogs.map((log) => (
                    <tr key={log._id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md">{log.action}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">{log.performedBy?.name || 'System'}</div>
                        <div className="text-[10px] text-gray-500">{log.performerRole || log.performerModel || 'System'}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {new Date(log.createdAt).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-xs font-medium text-white">{log.entityType}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{log.entityId}</div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-500 text-sm">
                        {loading ? 'Loading activity stream...' : 'No recent activity logs found.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-3xl group relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-xl font-bold text-white mb-2">Lead Pipeline</h4>
                <p className="text-blue-100 text-sm mb-3">
                  {stats.incompleteLeads || 0} leads are still open and need conversion follow-up.
                </p>
                <button
                  type="button"
                  onClick={() => navigate('/admin/leads')}
                  className="bg-white text-blue-600 font-bold px-6 py-2 rounded-xl text-sm flex items-center gap-2 group-hover:gap-4 transition-all"
                >
                  Review Leads <ArrowRight size={16} />
                </button>
              </div>
              <Users size={120} className="absolute -bottom-4 -right-4 text-white/10 rotate-12" />
            </div>

            <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl flex flex-col justify-center">
              <h4 className="text-xl font-bold text-white mb-2">Quote Approval Rate</h4>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 shadow-[0_0_10px_#10b981]"
                    style={{ width: `${Math.max(0, Math.min(100, quoteApprovalRate))}%` }}
                  />
                </div>
                <span className="text-emerald-500 font-bold text-sm">{quoteApprovalRate.toFixed(1)}%</span>
              </div>
              <p className="text-gray-500 text-xs mt-4">
                Lead conversion is currently {leadConversionRate.toFixed(1)}% across the live booking pipeline.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-8">
          <div className="bg-[#111111] border border-white/5 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin size={20} className="text-red-500" />
              <h3 className="font-bold text-white">Regional Demand</h3>
            </div>
            <div className="space-y-4">
              {activeCities.length > 0 ? activeCities.map((city) => (
                <div key={city.city}>
                  <div className="flex justify-between text-xs font-bold mb-2">
                    <span className="text-gray-400">{city.city}</span>
                    <span className="text-white">{city.count} orders</span>
                  </div>
                  <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${city.demand}%` }}
                      className={`h-full ${city.trend === 'up' ? 'bg-blue-500' : 'bg-red-500'}`}
                    />
                  </div>
                </div>
              )) : (
                <div className="text-sm text-gray-500">
                  No booking locations are available yet.
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => navigate('/admin/location')}
              className="w-full mt-6 bg-white/5 hover:bg-white/10 text-xs font-bold py-3 rounded-xl transition-colors"
            >
              Full Geographic Report
            </button>
          </div>

          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4 text-amber-500">
              <AlertCircle size={20} />
              <h3 className="font-bold">Pending Actions</h3>
            </div>
            <div className="space-y-4">
              {pendingActions.length > 0 ? pendingActions.map((item) => (
                <div key={item.title} className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  <div className="text-xs font-bold text-white">{item.title}</div>
                  <div className="text-[10px] text-gray-500 mt-1">{item.description}</div>
                </div>
              )) : (
                <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                  <div className="text-xs font-bold text-white">No urgent actions pending</div>
                  <div className="text-[10px] text-gray-500 mt-1">Quotes, feedback, and lead follow-ups are currently clear.</div>
                </div>
              )}
            </div>
          </div>

          <div className="bg-[#111111] border border-white/5 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <UserCheck size={20} className="text-emerald-500" />
              <h3 className="font-bold text-white">Recent Operator Activity</h3>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <div className="text-3xl font-bold text-white">{activityCount}</div>
                <p className="text-xs text-gray-500 mt-1">Unique operators seen in the latest audit stream</p>
              </div>
              <button
                type="button"
                onClick={fetchDashboardData}
                className="inline-flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-xs font-bold text-gray-300 transition-colors hover:bg-white/10 hover:text-white"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
