import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, PlusCircle, RefreshCw, Phone, Mail, 
  MapPin, KeyRound, Edit, Trash2, X, ClipboardList, 
  CheckCircle, Star, IndianRupee, ShieldAlert, Award, 
  TrendingUp, Wallet, ArrowUpRight
} from 'lucide-react';
import { getApiBaseUrl } from '../utils/apiBase';

export const PartnersManagement = () => {
  const apiBaseUrl = getApiBaseUrl();
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const [performanceData, setPerformanceData] = useState(null);
  const [loadingPerformance, setLoadingPerformance] = useState(false);

  // Forms state
  const [partnerForm, setPartnerForm] = useState({
    name: '', email: '', phone: '', specialization: 'Smartphone',
    serviceAreas: '', password: '', commissionRate: 15
  });
  const [newPassword, setNewPassword] = useState('');
  const [payoutForm, setPayoutForm] = useState({
    amount: 0, action: 'add', note: ''
  });

  useEffect(() => {
    fetchPartners();
  }, []);

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${apiBaseUrl}/admin/partners`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPartners(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching partners:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPerformance = async (partnerId) => {
    setLoadingPerformance(true);
    setPerformanceData(null);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${apiBaseUrl}/admin/partners/${partnerId}/performance`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setPerformanceData(data.data);
      }
    } catch (err) {
      console.error('Error fetching partner performance:', err);
    } finally {
      setLoadingPerformance(false);
    }
  };

  const handleAddPartner = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${apiBaseUrl}/admin/partners`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(partnerForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setPartnerForm({ name: '', email: '', phone: '', specialization: 'Smartphone', serviceAreas: '', password: '', commissionRate: 15 });
        fetchPartners();
      } else {
        alert(data.message || 'Failed to register partner');
      }
    } catch (err) {
      console.error('Error adding partner:', err);
    }
  };

  const handleEditPartner = async (e) => {
    e.preventDefault();
    if (!selectedPartner) return;
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${apiBaseUrl}/admin/partners/${selectedPartner._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: partnerForm.name,
          email: partnerForm.email,
          phone: partnerForm.phone,
          specialization: partnerForm.specialization,
          serviceAreas: partnerForm.serviceAreas,
          commissionRate: partnerForm.commissionRate
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        setSelectedPartner(null);
        setPartnerForm({ name: '', email: '', phone: '', specialization: 'Smartphone', serviceAreas: '', password: '', commissionRate: 15 });
        fetchPartners();
      } else {
        alert(data.message || 'Failed to update partner');
      }
    } catch (err) {
      console.error('Error updating partner:', err);
    }
  };

  const handleDeletePartner = async (partnerId) => {
    if (!window.confirm('Are you sure you want to remove this service partner?')) return;
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${apiBaseUrl}/admin/partners/${partnerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchPartners();
        setSelectedPartner(null);
      } else {
        alert(data.message || 'Failed to delete partner');
      }
    } catch (err) {
      console.error('Error deleting partner:', err);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedPartner || !newPassword) return;
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${apiBaseUrl}/admin/partners/${selectedPartner._id}/reset-password`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ newPassword })
      });
      const data = await res.json();
      if (data.success) {
        setShowPasswordModal(false);
        setNewPassword('');
        alert('Partner password reset successfully!');
      } else {
        alert(data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
    }
  };

  const handleManagePayout = async (e) => {
    e.preventDefault();
    if (!selectedPartner) return;
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${apiBaseUrl}/admin/partners/${selectedPartner._id}/payout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(payoutForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowPayoutModal(false);
        setPayoutForm({ amount: 0, action: 'add', note: '' });
        fetchPartners();
        if (selectedPartner) {
          fetchPerformance(selectedPartner._id);
        }
        alert('Payout ledger successfully updated!');
      } else {
        alert(data.message || 'Failed to post payout');
      }
    } catch (err) {
      console.error('Error managing payout:', err);
    }
  };

  const filteredPartners = partners.filter(p => 
    p.name?.toLowerCase().includes(search.toLowerCase()) ||
    p.email?.toLowerCase().includes(search.toLowerCase()) ||
    p.phone?.toLowerCase().includes(search.toLowerCase()) ||
    p.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Outfit']">Service Partners</h1>
          <p className="text-gray-500 mt-1">Manage field engineers, repair commissions, payouts and satisfaction metrics</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchPartners} 
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 text-xs font-bold"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button 
            onClick={() => {
              setPartnerForm({ name: '', email: '', phone: '', specialization: 'Smartphone', serviceAreas: '', password: '', commissionRate: 15 });
              setShowAddModal(true);
            }} 
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all text-xs font-bold shadow-[0_0_15px_rgba(147,51,234,0.3)]"
          >
            <PlusCircle size={14} />
            Add Partner Account
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Active Service Partners', value: partners.length, icon: Users, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Avg Partner Rating', value: partners.length > 0 ? `${(partners.reduce((acc, curr) => acc + (curr.averageRating || 5), 0) / partners.length).toFixed(1)} ★` : '5.0 ★', icon: Star, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Total Paid Out', value: `₹${partners.reduce((acc, curr) => acc + (curr.totalEarned || 0), 0).toLocaleString()}`, icon: IndianRupee, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map((card, i) => (
          <div key={card.label} className="bg-[#111111] border border-white/5 p-6 rounded-3xl group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                <card.icon size={20} />
              </div>
            </div>
            <div className="text-3xl font-black text-white mb-1 group-hover:scale-105 transition-transform origin-left">{card.value}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Main Panel Search */}
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
        <input
          type="text"
          placeholder="Search partners by name, spec or area..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#111111] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Partner List Table */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/5 rounded-3xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <RefreshCw size={32} className="animate-spin text-blue-500" />
              <p className="text-gray-500 text-sm">Loading partners...</p>
            </div>
          ) : filteredPartners.length === 0 ? (
            <div className="text-center py-24">
              <Users size={48} className="text-gray-700 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg mb-1">No partners registered</h3>
              <p className="text-gray-500 text-sm">Add a new partner account to expand the platform's service reach.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 font-bold">Partner Details</th>
                    <th className="px-6 py-4 font-bold">Specialization & Areas</th>
                    <th className="px-6 py-4 font-bold">Ledger Balance</th>
                    <th className="px-6 py-4 font-bold">Rating</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredPartners.map(p => (
                    <tr 
                      key={p._id} 
                      onClick={() => {
                        setSelectedPartner(p);
                        fetchPerformance(p._id);
                      }}
                      className={`group hover:bg-white/[0.01] transition-colors cursor-pointer ${
                        selectedPartner?._id === p._id ? 'bg-white/[0.02] border-l-2 border-purple-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-sm">{p.name}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{p.email}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">{p.phone}</div>
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 border border-blue-500/10 text-blue-400 rounded-md font-bold uppercase tracking-wider">
                          {p.specialization}
                        </span>
                        <div className="text-gray-400 mt-1 max-w-[200px] truncate" title={p.serviceAreas?.join(', ')}>
                          {p.serviceAreas?.join(', ') || 'No Area Registered'}
                        </div>
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <div className="text-sm font-bold text-white">₹{(p.payoutBalance || 0).toLocaleString()}</div>
                        <div className="text-[9px] text-gray-500">Comm: {p.commissionRate || 15}%</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1 text-sm font-bold text-amber-400">
                          <Star size={12} fill="currentColor" />
                          {(p.averageRating || 5.0).toFixed(1)}
                        </div>
                        <div className="text-[9px] text-gray-500 mt-0.5">{p.totalRepairs || 0} Jobs</div>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedPartner(p);
                              setPartnerForm({
                                name: p.name, email: p.email, phone: p.phone, specialization: p.specialization,
                                serviceAreas: p.serviceAreas?.join(', ') || '', password: '', commissionRate: p.commissionRate || 15
                              });
                              setShowEditModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            title="Edit Partner"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPartner(p);
                              setPayoutForm({ amount: 0, action: 'add', note: '' });
                              setShowPayoutModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-emerald-400 bg-white/5 hover:bg-emerald-500/10 rounded-lg transition-colors"
                            title="Adjust Ledger Payout"
                          >
                            <Wallet size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedPartner(p);
                              setShowPasswordModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            title="Reset Credentials"
                          >
                            <KeyRound size={12} />
                          </button>
                          <button
                            onClick={() => handleDeletePartner(p._id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Delete Partner"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Partner Performance Summary */}
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Award size={16} className="text-purple-500" />
              Partner Performance
            </h3>
            <p className="text-gray-500 text-xs mt-1">Real-time statistics of technician job reviews</p>
          </div>

          {selectedPartner ? (
            <div className="space-y-6">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-xs text-gray-400">Viewing Partner Profile</div>
                <div className="text-base font-black text-white mt-1">{selectedPartner.name}</div>
                <div className="text-xs text-gray-500 mt-1">{selectedPartner.specialization} Engineer</div>
              </div>

              {loadingPerformance ? (
                <div className="flex justify-center py-8">
                  <RefreshCw size={20} className="animate-spin text-blue-500" />
                </div>
              ) : performanceData ? (
                <div className="space-y-6 text-xs">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                      <div className="text-gray-500 text-[10px]">Total Repairs</div>
                      <div className="text-lg font-bold text-white mt-0.5">{performanceData.stats.total || 0}</div>
                    </div>
                    <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl">
                      <div className="text-gray-500 text-[10px]">Completed Repairs</div>
                      <div className="text-lg font-bold text-emerald-400 mt-0.5">{performanceData.stats.completed || 0}</div>
                    </div>
                    <div className="p-3 bg-white/[0.01] border border-white/5 rounded-xl col-span-2">
                      <div className="text-gray-500 text-[10px] mb-1">Success Resolution Rate</div>
                      <div className="h-2 bg-white/5 rounded-full overflow-hidden flex">
                        <div 
                          className="bg-emerald-500 h-full"
                          style={{ 
                            width: `${performanceData.stats.total > 0 
                              ? (performanceData.stats.completed / performanceData.stats.total * 100) 
                              : 100}%` 
                          }}
                        />
                      </div>
                      <div className="text-right text-[10px] text-gray-400 mt-1">
                        {performanceData.stats.total > 0 
                          ? `${(performanceData.stats.completed / performanceData.stats.total * 100).toFixed(0)}%` 
                          : '100%'}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Recent Assignments</h4>
                    {performanceData.repairs?.length === 0 ? (
                      <p className="text-gray-500 text-center py-4 bg-white/[0.01] border border-white/5 rounded-xl">No assigned jobs</p>
                    ) : (
                      <div className="space-y-2">
                        {performanceData.repairs.slice(0, 3).map(r => (
                          <div key={r._id} className="p-2.5 bg-white/5 border border-white/5 rounded-xl flex justify-between items-center">
                            <div>
                              <div className="font-bold text-white">{r.referenceNumber}</div>
                              <div className="text-[10px] text-gray-500">{r.deviceBrand} {r.deviceModel}</div>
                            </div>
                            <span className="text-[9px] font-bold text-gray-400 capitalize">{r.status}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 text-xs">
                  Failed to load performance metrics
                </div>
              )}
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500 text-xs">
              No partner selected
            </div>
          )}
        </div>
      </div>

      {/* Add Partner Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white rounded-lg"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Add Partner Engineer</h3>
            <p className="text-gray-500 text-xs mb-6">Register a new engineer or franchise partner to dispatch repairs.</p>

            <form onSubmit={handleAddPartner} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-400 font-bold mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={partnerForm.name}
                    onChange={(e) => setPartnerForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-semibold"
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-400 font-bold mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={partnerForm.phone}
                    onChange={(e) => setPartnerForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-400 font-bold mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={partnerForm.email}
                    onChange={(e) => setPartnerForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-400 font-bold mb-1.5">Default Password</label>
                  <input
                    type="password"
                    value={partnerForm.password}
                    onChange={(e) => setPartnerForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-400 font-bold mb-1.5">Commission Rate (%)</label>
                  <input
                    type="number"
                    value={partnerForm.commissionRate}
                    onChange={(e) => setPartnerForm(prev => ({ ...prev, commissionRate: Number(e.target.value) }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-semibold"
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-400 font-bold mb-1.5">Device Specialization</label>
                  <select
                    value={partnerForm.specialization}
                    onChange={(e) => setPartnerForm(prev => ({ ...prev, specialization: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="Smartphone">Smartphones</option>
                    <option value="Laptop">Laptops & PCs</option>
                    <option value="Tablet">Tablets & iPads</option>
                    <option value="Smartwatch">Smartwatches</option>
                    <option value="Multi-Specialist">Multi-device Specialist</option>
                  </select>
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-400 font-bold mb-1.5">Service Areas (Comma separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. Connaught Place, Karol Bagh"
                    value={partnerForm.serviceAreas}
                    onChange={(e) => setPartnerForm(prev => ({ ...prev, serviceAreas: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Register Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Partner Modal */}
      {showEditModal && selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white rounded-lg"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Edit Partner Details</h3>
            <p className="text-gray-500 text-xs mb-6">Modify partner contract, contact details, and locations.</p>

            <form onSubmit={handleEditPartner} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-400 font-bold mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={partnerForm.name}
                    onChange={(e) => setPartnerForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-semibold"
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-400 font-bold mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={partnerForm.phone}
                    onChange={(e) => setPartnerForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-400 font-bold mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={partnerForm.email}
                    onChange={(e) => setPartnerForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-400 font-bold mb-1.5">Commission Rate (%)</label>
                  <input
                    type="number"
                    value={partnerForm.commissionRate}
                    onChange={(e) => setPartnerForm(prev => ({ ...prev, commissionRate: Number(e.target.value) }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-semibold"
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-400 font-bold mb-1.5">Device Specialization</label>
                  <select
                    value={partnerForm.specialization}
                    onChange={(e) => setPartnerForm(prev => ({ ...prev, specialization: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-semibold"
                  >
                    <option value="Smartphone">Smartphones</option>
                    <option value="Laptop">Laptops & PCs</option>
                    <option value="Tablet">Tablets & iPads</option>
                    <option value="Smartwatch">Smartwatches</option>
                    <option value="Multi-Specialist">Multi-device Specialist</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-400 font-bold mb-1.5">Service Areas (Comma separated)</label>
                  <input
                    type="text"
                    value={partnerForm.serviceAreas}
                    onChange={(e) => setPartnerForm(prev => ({ ...prev, serviceAreas: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Ledger Payout Modal */}
      {showPayoutModal && selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl w-full max-w-md relative">
            <button 
              onClick={() => setShowPayoutModal(false)}
              className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white rounded-lg"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Adjust Payout Balance</h3>
            <p className="text-gray-500 text-xs mb-6">Record a work credit (add) or pay-out bank transfer (subtract).</p>

            <form onSubmit={handleManagePayout} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Adjustment Action</label>
                <select
                  value={payoutForm.action}
                  onChange={(e) => setPayoutForm(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-semibold"
                >
                  <option value="add">Credit / Add Earned Amount (+)</option>
                  <option value="subtract">Debit / Pay Out to Bank (-)</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 1500"
                  value={payoutForm.amount}
                  onChange={(e) => setPayoutForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Ledger Remarks / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Bank Transfer ID: 2981928"
                  value={payoutForm.note}
                  onChange={(e) => setPayoutForm(prev => ({ ...prev, note: e.target.value }))}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Confirm Ledger Adjust
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {showPasswordModal && selectedPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl w-full max-w-md relative">
            <button 
              onClick={() => setShowPasswordModal(false)}
              className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white rounded-lg"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Reset Partner Password</h3>
            <p className="text-gray-500 text-xs mb-6">Enter a new secure login password for {selectedPartner.name}.</p>

            <form onSubmit={handleResetPassword} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1.5">New Password</label>
                <input
                  type="password"
                  placeholder="Min 8 characters..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Reset Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
