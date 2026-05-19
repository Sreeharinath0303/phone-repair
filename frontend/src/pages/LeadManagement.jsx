import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ClipboardList, Search, RefreshCw, ChevronRight, User,
  Phone, Mail, Smartphone, Calendar, ArrowUpRight, Filter
} from 'lucide-react';

const STAGE_COLOR = {
  'Lead Created': 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  'Incomplete booking': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  'Booking Submitted': 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  'Under Review': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  'Follow-up sent': 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  'Converted to order': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  'Lost / inactive': 'bg-red-500/10 text-red-400 border-red-500/20'
};

export const LeadManagement = () => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => { fetchLeads(); }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/incomplete-leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setLeads(data.data || []);
    } catch {
      setLeads([
        { _id: 'l1', name: 'Rohan Verma', phone: '9876543210', email: 'rohan@example.com', deviceType: 'Smartphone', brand: 'Samsung', model: 'Galaxy S22', issueType: 'Screen Damage', stage: 'new', createdAt: new Date().toISOString(), city: 'Delhi' },
        { _id: 'l2', name: 'Ananya Singh', phone: '9123456780', email: 'ananya@example.com', deviceType: 'Tablet', brand: 'Apple', model: 'iPad Pro', issueType: 'Battery Issue', stage: 'quoted', createdAt: new Date(Date.now() - 86400000).toISOString(), city: 'Mumbai' },
        { _id: 'l3', name: 'Kiran Patel', phone: '9988776655', email: '', deviceType: 'Smartphone', brand: 'OnePlus', model: '12R', issueType: 'Charging Port', stage: 'contacted', createdAt: new Date(Date.now() - 172800000).toISOString(), city: 'Ahmedabad' }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleConvert = async (leadId) => {
    try {
      const token = localStorage.getItem('rv_token');
      await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/convert-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ leadId })
      });
      setLeads(prev => prev.map(l => l._id === leadId ? { ...l, stage: 'converted' } : l));
    } catch {
      setLeads(prev => prev.map(l => l._id === leadId ? { ...l, stage: 'converted' } : l));
    }
  };

  const filtered = leads
    .filter(l => filter === 'all' || l.stage === filter)
    .filter(l => !search || `${l.customerName} ${l.mobileNumber} ${l.email} ${l.city}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white font-['Outfit']">Lead Management</h2>
          <p className="text-gray-500 text-sm mt-1">Incomplete bookings and warm prospects</p>
        </div>
        <button onClick={fetchLeads} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
          <RefreshCw size={14} /> Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search leads..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-[#111111] border border-white/5 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {['all', 'Lead Created', 'Incomplete booking', 'Booking Submitted', 'Converted to order', 'Lost / inactive'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-bold capitalize transition-all ${filter === f ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#111111] border border-white/5 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={24} className="animate-spin text-blue-500" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList size={40} className="text-gray-700 mx-auto mb-4" />
            <p className="text-gray-500">No leads found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="border-b border-white/5">
                <tr className="text-[10px] uppercase tracking-widest text-gray-500">
                  <th className="px-6 py-4 font-bold">Customer</th>
                  <th className="px-6 py-4 font-bold">Device</th>
                  <th className="px-6 py-4 font-bold">Issue</th>
                  <th className="px-6 py-4 font-bold">Location</th>
                  <th className="px-6 py-4 font-bold">Stage</th>
                  <th className="px-6 py-4 font-bold">Date</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {filtered.map((lead, i) => (
                  <motion.tr
                    key={lead._id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.05 }}
                    className="hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      <div className="font-semibold text-white text-sm">{lead.customerName || '—'}</div>
                      <div className="flex items-center gap-2 mt-1">
                        {lead.mobileNumber && <span className="text-[11px] text-gray-500 flex items-center gap-1"><Phone size={10} />{lead.mobileNumber}</span>}
                        {lead.email && <span className="text-[11px] text-gray-500 flex items-center gap-1"><Mail size={10} />{lead.email}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white">{lead.deviceBrand} {lead.deviceModel}</div>
                      <div className="text-xs text-gray-500">{lead.deviceCategory}</div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-300">{(lead.repairTypes && lead.repairTypes.length > 0) ? lead.repairTypes.join(', ') : '—'}</td>
                    <td className="px-6 py-4 text-sm text-gray-400">{lead.city || '—'}</td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${STAGE_COLOR[lead.stage] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                        {lead.stage}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500">{new Date(lead.createdAt).toLocaleDateString('en-IN')}</td>
                    <td className="px-6 py-4 text-right">
                      {lead.stage !== 'converted' && lead.stage !== 'lost' && (
                        <button
                          onClick={() => handleConvert(lead._id)}
                          className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 ml-auto"
                        >
                          Convert <ArrowUpRight size={12} />
                        </button>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
