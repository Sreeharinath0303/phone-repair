import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  IndianRupee,
  Activity,
  Shield,
  MapPin,
  ArrowRight
} from 'lucide-react';
import { motion } from 'framer-motion';

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalBookings: 0,
    activeOrders: 0,
    totalRevenue: 0,
    pendingQuotations: 0,
    conversionRate: 0,
    partnerResponse: 0
  });
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem('rv_token');
      const [statsRes, logsRes] = await Promise.all([
        fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/analytics`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/audit-logs?limit=5`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const statsData = await statsRes.json();
      const logsData = await logsRes.json();

      if (statsData.success) setStats(statsData.data);
      if (logsData.success) setAuditLogs(logsData.data);
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString()}`, icon: IndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Active Orders', value: stats.activeOrders, icon: Activity, color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { label: 'Pending Quotes', value: stats.pendingQuotations, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Total Users', value: stats.totalBookings, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white">Command Center</h1>
          <p className="text-gray-500 mt-1">Real-time overview of RepairVafe operations</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex -space-x-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-[#0a0a0a] bg-gray-800" />
            ))}
          </div>
          <span className="text-xs text-gray-400 font-medium">8 Admins Online</span>
        </div>
      </div>

      {/* Stats Grid */}
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
        {/* Audit Trail - Step 15 & 19 */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#111111] border border-white/5 rounded-3xl overflow-hidden">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield size={20} className="text-blue-500" />
                <h3 className="font-bold text-white">System Audit Trail</h3>
              </div>
              <button className="text-xs text-blue-500 font-bold hover:underline">View All Logs</button>
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
                  {auditLogs.length > 0 ? auditLogs.map((log, i) => (
                    <tr key={log._id} className="group hover:bg-white/[0.02] transition-colors">
                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-blue-400 bg-blue-400/10 px-2 py-1 rounded-md">{log.action}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-white">{log.performedBy?.name || 'System'}</div>
                        <div className="text-[10px] text-gray-500">{log.performerRole}</div>
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-400">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="text-xs font-medium text-white">{log.entityType}</div>
                        <div className="text-[10px] text-gray-500 font-mono">{log.entityId}</div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="4" className="px-6 py-12 text-center text-gray-500 text-sm">
                        No recent activity logs found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-8 rounded-3xl group cursor-pointer relative overflow-hidden">
               <div className="relative z-10">
                 <h4 className="text-xl font-bold text-white mb-2">New Partner Invite</h4>
                 <p className="text-blue-100 text-sm mb-6">Expand the service network in new cities.</p>
                 <button className="bg-white text-blue-600 font-bold px-6 py-2 rounded-xl text-sm flex items-center gap-2 group-hover:gap-4 transition-all">
                   Generate Link <ArrowRight size={16} />
                 </button>
               </div>
               <Users size={120} className="absolute -bottom-4 -right-4 text-white/10 rotate-12" />
            </div>
            <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl flex flex-col justify-center">
              <h4 className="text-xl font-bold text-white mb-2">System Health</h4>
              <div className="flex items-center gap-4 mt-2">
                <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                  <div className="w-[98%] h-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                </div>
                <span className="text-emerald-500 font-bold text-sm">99.8%</span>
              </div>
              <p className="text-gray-500 text-xs mt-4">All notification triggers and API nodes functional.</p>
            </div>
          </div>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-8">
          {/* Location Intelligence - Step 6-14 */}
          <div className="bg-[#111111] border border-white/5 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-6">
              <MapPin size={20} className="text-red-500" />
              <h3 className="font-bold text-white">Regional Demand</h3>
            </div>
            <div className="space-y-4">
              {[
                { city: 'New Delhi', demand: 85, trend: 'up' },
                { city: 'Mumbai', demand: 62, trend: 'down' },
                { city: 'Bangalore', demand: 78, trend: 'up' },
                { city: 'Pune', demand: 45, trend: 'up' }
              ].map(city => (
                <div key={city.city}>
                   <div className="flex justify-between text-xs font-bold mb-2">
                     <span className="text-gray-400">{city.city}</span>
                     <span className="text-white">{city.demand}%</span>
                   </div>
                   <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                     <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${city.demand}%` }}
                        className={`h-full ${city.trend === 'up' ? 'bg-blue-500' : 'bg-red-500'}`}
                     />
                   </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 bg-white/5 hover:bg-white/10 text-xs font-bold py-3 rounded-xl transition-colors">
              Full Geographic Report
            </button>
          </div>

          {/* Pending Reviews */}
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 rounded-3xl p-6">
            <div className="flex items-center gap-2 mb-4 text-amber-500">
              <AlertCircle size={20} />
              <h3 className="font-bold">Pending Actions</h3>
            </div>
            <div className="space-y-4">
               <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                 <div className="text-xs font-bold text-white">4 Quotations Expiring</div>
                 <div className="text-[10px] text-gray-500 mt-1">Requires manual follow-up</div>
               </div>
               <div className="p-3 bg-white/5 rounded-2xl border border-white/5">
                 <div className="text-xs font-bold text-white">2 Partner Disputes</div>
                 <div className="text-[10px] text-gray-500 mt-1">Resolution pending &gt; 48h</div>

               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
