import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ClipboardList, Search, RefreshCw, User, Phone, Mail,
  Smartphone, Calendar, ArrowUpRight, Eye, X, UserPlus,
  MapPin, AlertCircle, CheckCircle, IndianRupee, Tag
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
  const navigate = useNavigate();
  const [leads, setLeads] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  // Modal State
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [payoutAmount, setPayoutAmount] = useState('');
  const [assigning, setAssigning] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetchLeads();
    fetchPartners();
  }, []);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/incomplete-leads`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setLeads(data.data || []);
    } catch (err) {
      console.error('Error fetching leads:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPartners = async () => {
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/partners`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setPartners(data.data || []);
    } catch (err) {
      console.error('Error fetching partners:', err);
    }
  };

  const handleConvert = async (leadId) => {
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/convert-lead`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ leadId })
      });
      const data = await res.json();
      if (data.success) {
        setLeads(prev => prev.map(l => l._id === leadId ? { 
          ...l, 
          stage: 'Converted to order', 
          bookingCompleted: true,
          bookingId: data.data?._id || l.bookingId 
        } : l));
        
        setSelectedLead(null);
        // Redirect to booking management page
        navigate('/admin/bookings');
      } else {
        alert(data.message || 'Failed to convert lead to booking.');
      }
    } catch (err) {
      console.error('Error converting lead:', err);
      alert('Connection error. Failed to convert lead.');
    }
  };

  const handleAssignPartner = async () => {
    if (!selectedLead || !selectedPartnerId) return;
    setAssigning(true);
    setMessage('');
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/assign-lead`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ 
          leadId: selectedLead._id, 
          technicianId: selectedPartnerId,
          payoutAmount: Number(payoutAmount) || 0
        })
      });
      const data = await res.json();
      if (data.success) {
        const partner = partners.find(p => p._id === selectedPartnerId);
        setLeads(prev => prev.map(l => l._id === selectedLead._id ? {
          ...l,
          assignedTechnician: partner,
          partnerPayout: Number(payoutAmount) || 0
        } : l));
        setSelectedLead(prev => ({
          ...prev,
          assignedTechnician: partner,
          partnerPayout: Number(payoutAmount) || 0
        }));
        setMessage('Partner successfully assigned!');
      } else {
        setMessage(data.message || 'Partner assignment failed.');
      }
    } catch (err) {
      setMessage('Server error during partner assignment.');
    } finally {
      setAssigning(false);
    }
  };

  const filtered = leads
    .filter(l => filter === 'all' || l.stage === filter)
    .filter(l => !search || `${l.customerName} ${l.mobileNumber} ${l.email} ${l.city}`.toLowerCase().includes(search.toLowerCase()));

  const getComplaintText = (lead) => {
    if (!lead) return '';
    return lead.issueDescription || lead.bookingId?.issueDescription || 'No complaint or issue description provided.';
  };

  const getPartnerDetails = (lead) => {
    if (!lead) return null;
    return lead.assignedTechnician || lead.bookingId?.assignedTechnician || null;
  };

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
            placeholder="Search leads by customer, mobile, email, city..."
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
                {filtered.map((lead, i) => {
                  const partner = getPartnerDetails(lead);
                  return (
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
                      <td className="px-6 py-4 text-sm text-gray-300">
                        {(lead.repairTypes && lead.repairTypes.length > 0) ? lead.repairTypes.join(', ') : '—'}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-400">{lead.city || '—'}</td>
                      <td className="px-6 py-4">
                        <span className={`text-xs font-bold px-2.5 py-1 rounded-full border capitalize ${STAGE_COLOR[lead.stage] || 'bg-gray-500/10 text-gray-400 border-gray-500/20'}`}>
                          {lead.stage}
                        </span>
                        {partner && (
                          <div className="text-[10px] text-purple-400 font-semibold mt-1">
                            Assigned: {partner.name}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-xs text-gray-500">{new Date(lead.createdAt).toLocaleDateString('en-IN')}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedLead(lead);
                              setSelectedPartnerId(partner?._id || '');
                              setPayoutAmount(lead.partnerPayout || lead.bookingId?.partnerPayout || '');
                              setMessage('');
                            }}
                            className="text-xs font-bold text-indigo-400 hover:text-indigo-300 flex items-center gap-1 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/20 transition-all"
                          >
                            <Eye size={12} /> View
                          </button>
                          {lead.stage !== 'Converted to order' && lead.stage !== 'Lost / inactive' && (
                            <button
                              onClick={() => handleConvert(lead._id)}
                              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg border border-emerald-500/20 transition-all"
                            >
                              Convert <ArrowUpRight size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View Lead Details Modal */}
      <AnimatePresence>
        {selectedLead && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-md bg-black/60 overflow-y-auto"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="bg-[#161616] border border-white/10 rounded-3xl w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-5 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center gap-2">
                  <ClipboardList className="text-blue-500" size={20} />
                  <h3 className="text-lg font-bold text-white font-['Outfit']">Lead & Complaint Details</h3>
                </div>
                <button
                  onClick={() => setSelectedLead(null)}
                  className="p-1.5 bg-white/5 rounded-full text-gray-400 hover:text-white transition-all"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Body */}
              <div className="p-6 overflow-y-auto space-y-6 flex-1 text-left">
                {/* Customer Profile card */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <User size={14} className="text-gray-400" /> Customer Information
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Full Name</div>
                      <div className="font-semibold text-white mt-0.5">{selectedLead.customerName}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Mobile Number</div>
                      <div className="font-semibold text-white mt-0.5">{selectedLead.mobileNumber}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-gray-500">Email Address</div>
                      <div className="font-semibold text-white mt-0.5">{selectedLead.email || 'No email provided'}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-gray-500 flex items-center gap-1"><MapPin size={10} /> Location Address</div>
                      <div className="font-semibold text-gray-300 mt-1 leading-relaxed">
                        {selectedLead.address ? `${selectedLead.address}, ${selectedLead.city || ''}, ${selectedLead.state || ''} - ${selectedLead.pincode || ''}` : 'No address provided'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Device & Repair Details */}
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                    <Smartphone size={14} className="text-gray-400" /> Device & Issue Details
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-xs text-gray-500">Device Model</div>
                      <div className="font-semibold text-white mt-0.5">{selectedLead.deviceBrand} {selectedLead.deviceModel}</div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Device Category</div>
                      <div className="font-semibold text-white mt-0.5 capitalize">{selectedLead.deviceCategory || 'Smartphone'}</div>
                    </div>
                    <div className="col-span-2">
                      <div className="text-xs text-gray-500">Requested Services</div>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {selectedLead.repairTypes?.map(r => (
                          <span key={r} className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/10 rounded-md text-xs">
                            {r}
                          </span>
                        )) || '—'}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Customer Complaint description */}
                <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5 space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-amber-400 flex items-center gap-1.5">
                    <AlertCircle size={14} /> Customer Complaint Description
                  </h4>
                  <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap bg-black/20 p-4 rounded-xl border border-white/5">
                    {getComplaintText(selectedLead)}
                  </div>
                </div>

                {/* Partner Assignment Section */}
                <div className="bg-purple-500/5 border border-purple-500/10 rounded-2xl p-5 space-y-4">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-purple-400 flex items-center gap-1.5">
                    <UserPlus size={14} /> Partner Assignment & Payout commission
                  </h4>
                  
                  {getPartnerDetails(selectedLead) ? (
                    <div className="bg-purple-950/20 border border-purple-500/20 rounded-xl p-5 space-y-3 text-purple-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-bold text-base flex items-center gap-1.5">
                            🤝 {getPartnerDetails(selectedLead).name}
                          </div>
                          <div className="text-xs text-purple-300 font-medium mt-0.5">
                            💼 {getPartnerDetails(selectedLead).businessName || 'Independent Technician'}
                          </div>
                        </div>
                        <span className="px-2.5 py-0.5 bg-purple-500/10 text-purple-300 border border-purple-500/20 rounded-md text-[10px] uppercase font-bold tracking-wider">
                          {getPartnerDetails(selectedLead).specialization || 'General Repairs'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-purple-500/10 text-xs text-purple-300/80">
                        <div>
                          <span className="text-[10px] text-gray-500 block uppercase font-bold">Phone Number</span>
                          <span className="font-semibold text-white mt-0.5 block">{getPartnerDetails(selectedLead).phone || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-500 block uppercase font-bold">Email Address</span>
                          <span className="font-semibold text-white mt-0.5 block truncate">{getPartnerDetails(selectedLead).email || '—'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-500 block uppercase font-bold">Service Location</span>
                          <span className="font-semibold text-white mt-0.5 block">
                            {getPartnerDetails(selectedLead).city ? `${getPartnerDetails(selectedLead).city}, ${getPartnerDetails(selectedLead).state || ''}` : '—'}
                          </span>
                        </div>
                        <div>
                          <span className="text-[10px] text-gray-500 block uppercase font-bold">Payout Commission</span>
                          <span className="font-bold text-emerald-400 mt-0.5 block">
                            ₹{(selectedLead.partnerPayout || selectedLead.bookingId?.partnerPayout || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 italic">No partner currently assigned. You can assign a partner below.</div>
                  )}

                  <div className="space-y-3 pt-2">
                    <label className="block text-xs text-gray-400 font-bold">Select Service Partner</label>
                    <select
                      value={selectedPartnerId}
                      onChange={e => setSelectedPartnerId(e.target.value)}
                      className="w-full bg-[#111111] border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                    >
                      <option value="">-- Choose available technician --</option>
                      {partners.map(p => (
                        <option key={p._id} value={p._id}>
                          {p.name} - {p.specialization || 'General'} ({p.city || 'Any City'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs text-gray-400 font-bold">Technician Commission Payout (₹)</label>
                    <div className="relative">
                      <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={14} />
                      <input
                        type="number"
                        placeholder="Commission Amount"
                        value={payoutAmount}
                        onChange={e => setPayoutAmount(e.target.value)}
                        className="w-full bg-[#111111] border border-white/10 rounded-xl pl-9 pr-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <button
                    onClick={handleAssignPartner}
                    disabled={assigning || !selectedPartnerId}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-1.5 disabled:opacity-40"
                  >
                    {assigning ? <RefreshCw size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                    Confirm Partner Assignment
                  </button>

                  {message && (
                    <div className={`p-3 rounded-xl text-xs font-bold text-center ${message.includes('successfully') ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                      {message}
                    </div>
                  )}
                </div>
              </div>

              {/* Footer */}
              <div className="px-6 py-5 border-t border-white/5 bg-white/[0.01] flex justify-between items-center gap-3">
                <button
                  onClick={() => setSelectedLead(null)}
                  className="px-5 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-all"
                >
                  Close
                </button>
                {selectedLead.stage !== 'Converted to order' && selectedLead.stage !== 'Lost / inactive' && (
                  <button
                    onClick={() => {
                      handleConvert(selectedLead._id);
                    }}
                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    Convert to Booking <ArrowUpRight size={14} />
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
