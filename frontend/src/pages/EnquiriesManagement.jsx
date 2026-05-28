import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageSquare, Search, Filter, RefreshCw, Mail, Phone, 
  Calendar, CheckCircle, Clock, X, Eye, Send, Reply,
  AlertCircle, AlertOctagon, HelpCircle, FileText
} from 'lucide-react';

export const EnquiriesManagement = () => {
  const [enquiries, setEnquiries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedEnquiry, setSelectedEnquiry] = useState(null);

  // Form states
  const [replyMessage, setReplyMessage] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [priority, setPriority] = useState('medium');
  const [status, setStatus] = useState('new');
  const [submittingReply, setSubmittingReply] = useState(false);

  useEffect(() => {
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/enquiries/admin`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setEnquiries(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching enquiries:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEnquiry = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry) return;
    setSubmittingReply(true);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/enquiries/admin/${selectedEnquiry._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          status,
          priority,
          adminNotes,
          replyMessage: replyMessage || undefined
        })
      });
      const data = await res.json();
      if (data.success) {
        setReplyMessage('');
        fetchEnquiries();
        setSelectedEnquiry(data.data);
        alert('Enquiry ticket updated and reply email dispatched successfully!');
      } else {
        alert(data.message || 'Failed to update ticket');
      }
    } catch (err) {
      console.error('Error updating enquiry:', err);
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleDeleteEnquiry = async (enquiryId) => {
    if (!window.confirm('Are you sure you want to permanently delete this enquiry?')) return;
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/enquiries/admin/${enquiryId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSelectedEnquiry(null);
        fetchEnquiries();
      }
    } catch (err) {
      console.error('Error deleting enquiry:', err);
    }
  };

  const filteredEnquiries = enquiries.filter(e => {
    const matchesSearch = 
      e.name?.toLowerCase().includes(search.toLowerCase()) ||
      e.email?.toLowerCase().includes(search.toLowerCase()) ||
      e.phone?.toLowerCase().includes(search.toLowerCase()) ||
      e.message?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || e.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getPriorityColor = (p) => {
    switch (p) {
      case 'high': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'medium': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const getStatusBadge = (s) => {
    switch (s) {
      case 'new': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'in_progress': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'resolved': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  return (
    <div className="space-y-8 font-['Outfit']">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="text-blue-500" />
            Enquiry Helpdesk
          </h1>
          <p className="text-gray-500 mt-1">Resolve public contact queries, corporate orders, and customer support tickets</p>
        </div>
        <button 
          onClick={fetchEnquiries} 
          className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 text-xs font-bold"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh Inbox
        </button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search tickets by sender, text or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111111] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {['all', 'new', 'in_progress', 'resolved', 'closed'].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize border ${
                statusFilter === f 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-[#111111] text-gray-400 border-white/5 hover:bg-white/5'
              }`}
            >
              {f === 'all' ? 'All Tickets' : f.replace(/_/g, ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Ticket List Table */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/5 rounded-3xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <RefreshCw size={32} className="animate-spin text-blue-500" />
              <p className="text-gray-500 text-sm">Streaming support inbox...</p>
            </div>
          ) : filteredEnquiries.length === 0 ? (
            <div className="text-center py-24">
              <MessageSquare size={48} className="text-gray-700 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg mb-1">Helpdesk inbox empty</h3>
              <p className="text-gray-500 text-sm">All enquiries are either resolved or match no filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 font-bold">Sender</th>
                    <th className="px-6 py-4 font-bold">Topic Type</th>
                    <th className="px-6 py-4 font-bold">Message Snip</th>
                    <th className="px-6 py-4 font-bold">Priority</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredEnquiries.map(e => (
                    <tr 
                      key={e._id} 
                      onClick={() => {
                        setSelectedEnquiry(e);
                        setStatus(e.status || 'new');
                        setPriority(e.priority || 'medium');
                        setAdminNotes(e.adminNotes || '');
                        setReplyMessage('');
                      }}
                      className={`group hover:bg-white/[0.01] transition-colors cursor-pointer ${
                        selectedEnquiry?._id === e._id ? 'bg-white/[0.02] border-l-2 border-blue-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-sm">{e.name}</div>
                        <div className="text-[9px] text-gray-500 mt-0.5">{e.email}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-0.5 bg-white/5 border border-white/5 text-gray-300 rounded-md font-bold uppercase tracking-wider text-[8px]">
                          {e.type || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-400 max-w-[200px] truncate">{e.message || e.description}</div>
                        <div className="text-[9px] text-gray-500 mt-0.5">{new Date(e.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full border text-[8px] font-bold uppercase tracking-wider ${getPriorityColor(e.priority)}`}>
                          {e.priority || 'Medium'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-1 rounded-full border text-[9px] font-bold uppercase tracking-wide ${getStatusBadge(e.status)}`}>
                          {e.status?.replace(/_/g, ' ') || 'New'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Ticket Reply Workspace */}
        <div className="bg-[#0c0c0c] border border-white/5 rounded-3xl p-6 space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Reply size={16} className="text-blue-500" />
              Ticket Workspace
            </h3>
            <p className="text-gray-500 text-xs mt-1">Review ticket payload and draft transactional email reply</p>
          </div>

          {selectedEnquiry ? (
            <form onSubmit={handleUpdateEnquiry} className="space-y-4 text-xs">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-2">
                <div className="flex justify-between items-center text-[10px]">
                  <span className="text-gray-400">Date Received</span>
                  <span className="text-white">{new Date(selectedEnquiry.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-gray-500 mt-2">Sender Message Body:</div>
                <div className="text-gray-300 leading-relaxed bg-black/40 p-3 rounded-lg border border-white/5 max-h-36 overflow-y-auto">
                  {selectedEnquiry.message || selectedEnquiry.description}
                </div>
              </div>

              {selectedEnquiry.responses?.length > 0 && (
                <div className="space-y-2">
                  <span className="text-gray-500 uppercase tracking-widest text-[9px] font-bold">Responses History</span>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {selectedEnquiry.responses.map((resp, ri) => (
                      <div key={ri} className="p-2 bg-white/[0.02] border border-white/5 rounded-lg">
                        <p className="text-gray-300">{resp.message}</p>
                        <span className="text-[8px] text-gray-500 block mt-1">{new Date(resp.date).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Draft Email Reply</label>
                <textarea
                  placeholder="Draft your reply here. Submitting will trigger an automated HTML email response directly to the customer..."
                  value={replyMessage}
                  onChange={(e) => setReplyMessage(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 h-28 text-xs leading-relaxed"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Internal Admin Notes</label>
                <textarea
                  placeholder="Add private technical resolution steps, follow-ups or context logs..."
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 h-16 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 font-bold mb-1.5">Ticket Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="new">New Ticket</option>
                    <option value="in_progress">In Progress</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-400 font-bold mb-1.5">Priority</label>
                  <select
                    value={priority}
                    onChange={(e) => setPriority(e.target.value)}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-3 py-2.5 text-white focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="low">Low Priority</option>
                    <option value="medium">Medium Priority</option>
                    <option value="high">High Priority</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => handleDeleteEnquiry(selectedEnquiry._id)}
                  className="bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 font-bold px-4 py-3 rounded-xl transition-all"
                >
                  Delete
                </button>
                <button
                  type="submit"
                  disabled={submittingReply}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 shadow-[0_0_15px_rgba(37,99,235,0.3)]"
                >
                  {submittingReply ? <RefreshCw size={12} className="animate-spin" /> : <Send size={12} />}
                  Submit Update & Send
                </button>
              </div>
            </form>
          ) : (
            <div className="text-center py-16 text-gray-500 text-xs font-mono">
              &gt; awaiting enquiry thread selection...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
