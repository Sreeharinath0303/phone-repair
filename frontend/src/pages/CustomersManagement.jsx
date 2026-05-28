import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Users, Search, PlusCircle, RefreshCw, Phone, Mail, 
  MapPin, KeyRound, Edit, Trash2, X, ClipboardList, 
  CheckCircle, ShieldAlert, AlertCircle, ShoppingBag
} from 'lucide-react';

export const CustomersManagement = () => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerHistory, setCustomerHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  
  // Forms state
  const [customerForm, setCustomerForm] = useState({
    name: '', email: '', phone: '', password: '',
    address: '', city: '', state: '', pincode: ''
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/customers`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCustomers(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching customers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomerHistory = async (email) => {
    setLoadingHistory(true);
    setCustomerHistory([]);
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/customers/${email}/history`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setCustomerHistory(data.data || []);
      }
    } catch (err) {
      console.error('Error fetching customer history:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleAddCustomer = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/customers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify(customerForm)
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setCustomerForm({ name: '', email: '', phone: '', password: '', address: '', city: '', state: '', pincode: '' });
        fetchCustomers();
      } else {
        alert(data.message || 'Failed to create customer');
      }
    } catch (err) {
      console.error('Error creating customer:', err);
    }
  };

  const handleEditCustomer = async (e) => {
    e.preventDefault();
    if (!selectedCustomer) return;
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/customers/${selectedCustomer._id}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          name: customerForm.name,
          email: customerForm.email,
          phone: customerForm.phone,
          address: customerForm.address,
          city: customerForm.city,
          state: customerForm.state,
          pincode: customerForm.pincode
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowEditModal(false);
        setSelectedCustomer(null);
        setCustomerForm({ name: '', email: '', phone: '', password: '', address: '', city: '', state: '', pincode: '' });
        fetchCustomers();
      } else {
        alert(data.message || 'Failed to update customer');
      }
    } catch (err) {
      console.error('Error updating customer:', err);
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    if (!window.confirm('Are you sure you want to deactivate or delete this customer account?')) return;
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/customers/${customerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchCustomers();
        setSelectedCustomer(null);
      }
    } catch (err) {
      console.error('Error deleting customer:', err);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (!selectedCustomer || !newPassword) return;
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/customers/${selectedCustomer._id}/reset-password`, {
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
        alert('Password reset successfully!');
      } else {
        alert(data.message || 'Failed to reset password');
      }
    } catch (err) {
      console.error('Error resetting password:', err);
    }
  };

  const filteredCustomers = customers.filter(c => 
    c.name?.toLowerCase().includes(search.toLowerCase()) ||
    c.email?.toLowerCase().includes(search.toLowerCase()) ||
    c.phone?.toLowerCase().includes(search.toLowerCase()) ||
    c.city?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Outfit']">Customer Directory</h1>
          <p className="text-gray-500 mt-1">Manage platform clients, credentials, and repair histories</p>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={fetchCustomers} 
            className="flex items-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 text-xs font-bold"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
          <button 
            onClick={() => {
              setCustomerForm({ name: '', email: '', phone: '', password: '', address: '', city: '', state: '', pincode: '' });
              setShowAddModal(true);
            }} 
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-all text-xs font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)]"
          >
            <PlusCircle size={14} />
            Register Customer
          </button>
        </div>
      </div>

      {/* Stats Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Registered Customers', value: customers.length, icon: Users, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Active This Month', value: customers.filter(c => c.isActive !== false).length, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Incomplete Accounts', value: customers.filter(c => !c.city || !c.pincode).length, icon: AlertCircle, color: 'text-amber-500', bg: 'bg-amber-500/10' },
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
          placeholder="Search customers by name, email or phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#111111] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Customer list table */}
        <div className="lg:col-span-2 bg-[#111111] border border-white/5 rounded-3xl overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <RefreshCw size={32} className="animate-spin text-blue-500" />
              <p className="text-gray-500 text-sm">Loading customers...</p>
            </div>
          ) : filteredCustomers.length === 0 ? (
            <div className="text-center py-24">
              <Users size={48} className="text-gray-700 mx-auto mb-4" />
              <h3 className="text-white font-bold text-lg mb-1">No customers found</h3>
              <p className="text-gray-500 text-sm">Register a new customer or clear the search filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5 bg-white/[0.02]">
                    <th className="px-6 py-4 font-bold">Name</th>
                    <th className="px-6 py-4 font-bold">Contact Info</th>
                    <th className="px-6 py-4 font-bold">Location</th>
                    <th className="px-6 py-4 font-bold">Status</th>
                    <th className="px-6 py-4 font-bold text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredCustomers.map(c => (
                    <tr 
                      key={c._id} 
                      onClick={() => {
                        setSelectedCustomer(c);
                        fetchCustomerHistory(c.email);
                      }}
                      className={`group hover:bg-white/[0.01] transition-colors cursor-pointer ${
                        selectedCustomer?._id === c._id ? 'bg-white/[0.02] border-l-2 border-blue-500' : ''
                      }`}
                    >
                      <td className="px-6 py-4">
                        <div className="font-bold text-white text-sm">{c.name}</div>
                        <div className="text-[10px] text-gray-500 mt-0.5">Joined {new Date(c.createdAt).toLocaleDateString()}</div>
                      </td>
                      <td className="px-6 py-4 space-y-1">
                        <div className="text-gray-300 flex items-center gap-1.5"><Mail size={12} className="text-gray-500" />{c.email}</div>
                        <div className="text-gray-400 flex items-center gap-1.5"><Phone size={12} className="text-gray-500" />{c.phone}</div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-gray-300 flex items-center gap-1.5"><MapPin size={12} className="text-gray-500" />{c.city || '—'}</div>
                        <div className="text-gray-500 text-[10px] mt-0.5">{c.state} {c.pincode}</div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider ${
                          c.isActive !== false 
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
                            : 'bg-red-500/10 text-red-400 border-red-500/20'
                        }`}>
                          {c.isActive !== false ? 'Active' : 'Disabled'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setSelectedCustomer(c);
                              setCustomerForm({
                                name: c.name, email: c.email, phone: c.phone, password: '',
                                address: c.address || '', city: c.city || '', state: c.state || '', pincode: c.pincode || ''
                              });
                              setShowEditModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            title="Edit Info"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCustomer(c);
                              setShowPasswordModal(true);
                            }}
                            className="p-1.5 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                            title="Reset Password"
                          >
                            <KeyRound size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteCustomer(c._id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 rounded-lg transition-colors"
                            title="Deactivate / Delete"
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

        {/* Customer History Sidebar */}
        <div className="bg-[#111111] border border-white/5 rounded-3xl p-6 space-y-6">
          <div className="border-b border-white/5 pb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ClipboardList size={16} className="text-blue-500" />
              Customer Activity Log
            </h3>
            <p className="text-gray-500 text-xs mt-1">Select a customer to view their complete service history</p>
          </div>

          {selectedCustomer ? (
            <div className="space-y-6">
              <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
                <div className="text-xs text-gray-400">Viewing Details For</div>
                <div className="text-base font-black text-white mt-1">{selectedCustomer.name}</div>
                <div className="text-xs text-gray-500 mt-1 truncate">{selectedCustomer.email}</div>
              </div>

              <div className="space-y-4">
                <h4 className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Service Repairs</h4>

                {loadingHistory ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw size={20} className="animate-spin text-blue-500" />
                  </div>
                ) : customerHistory.length === 0 ? (
                  <div className="text-center py-8 bg-white/[0.01] rounded-2xl border border-white/5">
                    <ShoppingBag size={24} className="text-gray-700 mx-auto mb-2" />
                    <p className="text-gray-500 text-xs">No service bookings found</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {customerHistory.map(b => (
                      <div key={b._id} className="p-3 bg-white/5 border border-white/5 rounded-xl text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-white">{b.referenceNumber}</span>
                          <span className="text-[9px] px-2 py-0.5 bg-blue-500/10 border border-blue-500/10 text-blue-400 rounded-md font-semibold">
                            {b.status}
                          </span>
                        </div>
                        <div className="text-gray-300 font-medium">{b.deviceBrand} {b.deviceModel}</div>
                        <div className="flex justify-between text-[10px] text-gray-500 pt-1 border-t border-white/5">
                          <span>{new Date(b.createdAt).toLocaleDateString()}</span>
                          <span className="font-bold text-white">₹{(b.quotationAmount || b.approxAmount || 0).toLocaleString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-gray-500 text-xs">
              No customer selected
            </div>
          )}
        </div>
      </div>

      {/* Add Customer Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white rounded-lg"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Register Customer Account</h3>
            <p className="text-gray-500 text-xs mb-6">Create a pre-verified user credentials account.</p>

            <form onSubmit={handleAddCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-400 font-bold mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-medium"
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-400 font-bold mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-400 font-bold mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-400 font-bold mb-1.5">Default Password</label>
                  <input
                    type="password"
                    value={customerForm.password}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, password: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-400 font-bold mb-1.5">Street Address</label>
                  <input
                    type="text"
                    value={customerForm.address}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1.5">City</label>
                  <input
                    type="text"
                    value={customerForm.city}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1.5">Pincode</label>
                  <input
                    type="text"
                    value={customerForm.pincode}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, pincode: e.target.value }))}
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
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Create Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {showEditModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button 
              onClick={() => setShowEditModal(false)}
              className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white rounded-lg"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Edit Customer Details</h3>
            <p className="text-gray-500 text-xs mb-6">Modify customer contact and logistics details.</p>

            <form onSubmit={handleEditCustomer} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-400 font-bold mb-1.5">Full Name</label>
                  <input
                    type="text"
                    value={customerForm.name}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-medium"
                    required
                  />
                </div>
                <div className="col-span-2 sm:col-span-1">
                  <label className="block text-gray-400 font-bold mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={customerForm.phone}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-400 font-bold mb-1.5">Email Address</label>
                  <input
                    type="email"
                    value={customerForm.email}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-gray-400 font-bold mb-1.5">Street Address</label>
                  <input
                    type="text"
                    value={customerForm.address}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, address: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1.5">City</label>
                  <input
                    type="text"
                    value={customerForm.city}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, city: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1.5">Pincode</label>
                  <input
                    type="text"
                    value={customerForm.pincode}
                    onChange={(e) => setCustomerForm(prev => ({ ...prev, pincode: e.target.value }))}
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

      {/* Reset Password Modal */}
      {showPasswordModal && selectedCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl w-full max-w-md relative">
            <button 
              onClick={() => setShowPasswordModal(false)}
              className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white rounded-lg"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Reset Account Password</h3>
            <p className="text-gray-500 text-xs mb-6">Enter a new secure password for {selectedCustomer.name}.</p>

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
