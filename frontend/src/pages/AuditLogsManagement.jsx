import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, Search, RefreshCw, Clock, Filter, Eye, 
  Terminal, ShieldAlert, Calendar, User, ChevronRight, X
} from 'lucide-react';

export const AuditLogsManagement = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');
  const [selectedLog, setSelectedLog] = useState(null);
  const [selectedLogDetails, setSelectedLogDetails] = useState(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/audit-logs`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setLogs(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchLogDetails = async (logId) => {
    setLoadingDetails(true);
    setSelectedLogDetails(null);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/audit-logs/${logId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedLogDetails(data.data);
      }
    } catch (err) {
      console.error('Error fetching log details:', err);
    } finally {
      setLoadingDetails(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    const matchesSearch = 
      log.action?.toLowerCase().includes(search.toLowerCase()) ||
      log.performedBy?.name?.toLowerCase().includes(search.toLowerCase()) ||
      log.entityType?.toLowerCase().includes(search.toLowerCase()) ||
      log.entityId?.toLowerCase().includes(search.toLowerCase());

    const matchesAction = actionFilter === 'all' || log.action === actionFilter;

    return matchesSearch && matchesAction;
  });

  const getActionColor = (action) => {
    if (action?.includes('CREATE')) return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (action?.includes('DELETE') || action?.includes('REMOVE') || action?.includes('REJECT')) return 'bg-red-500/10 text-red-400 border-red-500/20';
    if (action?.includes('UPDATE') || action?.includes('EDIT')) return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  };

  // Get unique actions for filter dropdown
  const uniqueActions = ['all', ...new Set(logs.map(l => l.action).filter(Boolean))];

  return (
    <div className="space-y-8 font-['Outfit']">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Terminal className="text-blue-500" />
            Governance Audit Trail
          </h1>
          <p className="text-gray-500 mt-1">Review secure system action logs and administrative oversight operations</p>
        </div>
        <button 
          onClick={fetchLogs} 
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 text-xs font-bold"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Stream
        </button>
      </div>

      {/* Grid containing filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Filter logs by performer, entity, or query..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111111] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="relative w-full sm:w-64">
          <Filter className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="w-full bg-[#111111] border border-white/5 rounded-xl pl-10 pr-4 py-3 text-xs text-white focus:outline-none focus:border-blue-500 capitalize"
          >
            {uniqueActions.map(act => (
              <option key={act} value={act} className="bg-[#111111]">{act === 'all' ? 'All Actions' : act.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Audit Log list */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/5 rounded-3xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <RefreshCw size={32} className="animate-spin text-blue-500" />
              <p className="text-gray-500 text-sm">Streaming audit trail...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-24">
              <ShieldAlert size={48} className="text-gray-700 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg mb-1">No system logs logged</h3>
              <p className="text-gray-500 text-sm">System is either fresh or filters are too restrictive.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 font-bold">Action Event</th>
                    <th className="px-6 py-4 font-bold">Performer</th>
                    <th className="px-6 py-4 font-bold">Target Context</th>
                    <th className="px-6 py-4 font-bold">Timestamp</th>
                    <th className="px-6 py-4 font-bold text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredLogs.map(log => (
                    <tr 
                      key={log._id}
                      onClick={() => {
                        setSelectedLog(log);
                        fetchLogDetails(log._id);
                      }}
                      className={`group hover:bg-white/[0.01] transition-colors cursor-pointer ${
                        selectedLog?._id === log._id ? 'bg-white/[0.02] border-l-2 border-blue-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wider ${getActionColor(log.action)}`}>
                          {log.action?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-sm flex items-center gap-1.5">
                          <User size={12} className="text-gray-500" />
                          {log.performedBy?.name || 'System Auto'}
                        </div>
                        <div className="text-[9px] text-gray-500 mt-0.5 tracking-wider uppercase">{log.performerRole || 'System Node'}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-300 capitalize">{log.entityType || 'N/A'}</div>
                        <div className="text-[9px] text-gray-500 font-mono mt-0.5">{log.entityId || 'Global Context'}</div>
                      </td>
                      <td className="px-6 py-4 text-gray-400">
                        <div className="flex items-center gap-1.5">
                          <Clock size={12} className="text-gray-500" />
                          {new Date(log.createdAt).toLocaleString('en-IN', { timeStyle: 'medium', dateStyle: 'short' })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button className="p-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-gray-400 hover:text-white transition-colors">
                          <ChevronRight size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Security Terminal Side Panel */}
        <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-6 space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck size={16} className="text-emerald-500" />
              Event Inspector
            </h3>
            <p className="text-gray-500 text-xs mt-1 font-mono">&gt;_ secure payload analyzer</p>
          </div>

          {selectedLog ? (
            <div className="space-y-6">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 font-mono text-[11px] space-y-2">
                <div className="text-gray-500">EVENT_ID:</div>
                <div className="text-white font-bold">{selectedLog._id}</div>
                <div className="text-gray-500 mt-2">DETAILS:</div>
                <div className="text-gray-300 leading-relaxed bg-black/40 p-3 rounded-lg border border-white/5">
                  {selectedLog.details || 'No extended transaction notes recorded.'}
                </div>
              </div>

              <div className="space-y-3 font-mono text-[10px]">
                <h4 className="font-bold text-gray-500 uppercase tracking-widest">Metadata Dump</h4>
                
                {loadingDetails ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw size={20} className="animate-spin text-blue-500" />
                  </div>
                ) : selectedLogDetails ? (
                  <div className="bg-[#111111] p-4 rounded-2xl border border-white/5 overflow-x-auto max-h-60 custom-scrollbar text-blue-400">
                    <pre className="text-left leading-normal">{JSON.stringify(selectedLogDetails, null, 2)}</pre>
                  </div>
                ) : (
                  <div className="bg-[#111111] p-4 rounded-2xl border border-white/5 text-gray-500">
                    Select details to print raw BSON payload.
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500 text-xs font-mono">
              &gt; awaiting event stream selection...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
