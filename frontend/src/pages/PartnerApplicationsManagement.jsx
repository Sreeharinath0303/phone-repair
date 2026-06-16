import React, { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle, XCircle, Clock, Eye, X, Send } from 'lucide-react';
import { getApiBaseUrl } from '../utils/apiBase';

export const PartnerApplicationsManagement = () => {
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState(null);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [adminNotes, setAdminNotes] = useState('');
  const [processing, setProcessing] = useState(false);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${getApiBaseUrl()}/admin/partner-applications`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setApplications(data.data);
      }
    } catch (err) {
      console.error('Error fetching applications:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const handleAction = async (action) => {
    if (!selectedApp) return;
    setProcessing(true);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${getApiBaseUrl()}/admin/partner-applications/${selectedApp._id}/${action}`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ adminNotes })
      });
      const data = await res.json();
      if (data.success) {
        setShowReviewModal(false);
        fetchApplications();
      } else {
        alert(data.message || 'Action failed');
      }
    } catch (err) {
      console.error(`Error processing ${action}:`, err);
    } finally {
      setProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    switch(status) {
      case 'approved': return <span className="px-2 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-md text-[10px] font-bold uppercase tracking-widest">Approved</span>;
      case 'rejected': return <span className="px-2 py-1 bg-red-500/10 text-red-400 border border-red-500/20 rounded-md text-[10px] font-bold uppercase tracking-widest">Rejected</span>;
      default: return <span className="px-2 py-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 rounded-md text-[10px] font-bold uppercase tracking-widest">Pending</span>;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Outfit']">Partner Applications</h1>
          <p className="text-gray-500 mt-1">Review and onboard new service technicians</p>
        </div>
        <button 
          onClick={fetchApplications} 
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 text-xs font-bold"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Pending Reviews', value: applications.filter(a => a.status === 'pending').length, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Approved Partners', value: applications.filter(a => a.status === 'approved').length, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Total Applications', value: applications.length, color: 'text-blue-500', bg: 'bg-blue-500/10' },
        ].map((card) => (
          <div key={card.label} className="bg-[#111111] border border-white/5 p-6 rounded-3xl">
            <div className={`p-3 rounded-2xl ${card.bg} ${card.color} w-max mb-4`}>
              <Clock size={20} />
            </div>
            <div className="text-3xl font-black text-white mb-1">{card.value}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Applications List */}
      <div className="bg-[#111111] border border-white/5 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="flex justify-center py-20">
            <RefreshCw size={32} className="animate-spin text-blue-500" />
          </div>
        ) : applications.length === 0 ? (
          <div className="text-center py-20 text-gray-500">
            No applications found
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-4 font-bold">Applicant Details</th>
                  <th className="px-6 py-4 font-bold">Specialization & Area</th>
                  <th className="px-6 py-4 font-bold">Experience</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {applications.map(app => (
                  <tr key={app._id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white">{app.name}</div>
                      <div className="text-[10px] text-gray-500 mt-1">{app.email} • {app.phone}</div>
                      {app.businessName && <div className="text-[10px] text-gray-400 mt-0.5">{app.businessName}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-blue-400">{app.specialization}</div>
                      <div className="text-[10px] text-gray-500 mt-1 max-w-[200px] truncate">{app.serviceAreas.join(', ')}</div>
                      <div className="text-[10px] text-gray-500">{app.city}</div>
                    </td>
                    <td className="px-6 py-4 text-white font-medium">
                      {app.experienceYears} Years
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setAdminNotes(app.adminNotes || '');
                          setShowReviewModal(true);
                        }}
                        className="px-3 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg transition-colors font-bold flex items-center gap-2 ml-auto"
                      >
                        <Eye size={12} /> Review
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showReviewModal && selectedApp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl w-full max-w-2xl relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowReviewModal(false)}
              className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white rounded-lg"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <h3 className="text-xl font-bold text-white">Review Application</h3>
              {getStatusBadge(selectedApp.status)}
            </div>

            <div className="grid grid-cols-2 gap-6 text-sm mb-8">
              <div className="bg-white/5 p-4 rounded-xl">
                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3">Applicant</div>
                <div className="font-bold text-white text-lg">{selectedApp.name}</div>
                <div className="text-gray-400 mt-1">{selectedApp.businessName || 'Independent'}</div>
                <div className="text-gray-400 mt-2">{selectedApp.email}</div>
                <div className="text-gray-400">{selectedApp.phone}</div>
              </div>

              <div className="bg-white/5 p-4 rounded-xl">
                <div className="text-xs text-gray-500 uppercase tracking-widest font-bold mb-3">Expertise & Location</div>
                <div className="font-bold text-blue-400 text-lg">{selectedApp.specialization}</div>
                <div className="text-gray-400 mt-1">{selectedApp.experienceYears} Years Experience</div>
                <div className="text-gray-400 mt-2 font-medium">Areas:</div>
                <div className="text-gray-400 leading-relaxed">{selectedApp.serviceAreas.join(', ')}</div>
                <div className="text-gray-400">{selectedApp.city}</div>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-widest mb-2">Admin Notes (Internal)</label>
              <textarea
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl p-4 text-white focus:outline-none focus:border-blue-500 text-sm h-32 resize-none"
                placeholder="Add notes about this applicant..."
                disabled={selectedApp.status !== 'pending'}
              />
            </div>

            {selectedApp.status === 'pending' && (
              <div className="flex gap-4">
                <button
                  onClick={() => handleAction('reject')}
                  disabled={processing}
                  className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <XCircle size={16} /> Reject
                </button>
                <button
                  onClick={() => handleAction('approve')}
                  disabled={processing}
                  className="flex-1 py-3 bg-emerald-500 hover:bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] rounded-xl font-bold flex items-center justify-center gap-2 transition-all"
                >
                  <CheckCircle size={16} /> Approve & Create Account
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
