import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Calendar, Search, Filter, RefreshCw, Smartphone, MapPin, 
  User, CheckCircle, Clock, X, Eye, FileText, UserPlus, 
  AlertCircle, ShieldAlert, Award, FileSpreadsheet, PlusCircle, Check
} from 'lucide-react';

export const BookingsManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [partners, setPartners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  // Quote form state
  const [quoteDetails, setQuoteDetails] = useState({
    approxAmount: 0,
    estimatedTime: '',
    warrantyPeriod: '3 Months',
    repairSummary: ''
  });

  // Assign partner state
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [payoutAmount, setPayoutAmount] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('rv_token');
      
      // Fetch Bookings
      const bookingsRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/export/bookings`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const bookingsData = await bookingsRes.json();
      if (bookingsData.success) {
        setBookings(bookingsData.data || []);
      }

      // Fetch Partners
      const partnersRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/partners`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const partnersData = await partnersRes.json();
      if (partnersData.success) {
        setPartners(partnersData.data || []);
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/update-status`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ bookingId, status: newStatus })
      });
      const data = await res.json();
      if (data.success) {
        setBookings(prev => prev.map(b => b._id === bookingId ? { ...b, status: newStatus } : b));
        if (selectedBooking && selectedBooking._id === bookingId) {
          setSelectedBooking(prev => ({ ...prev, status: newStatus }));
        }
      }
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const handleIssueQuote = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/set-quote`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          bookingId: selectedBooking._id,
          quotationAmount: Number(quoteDetails.approxAmount),
          estimatedTime: quoteDetails.estimatedTime,
          warrantyPeriod: quoteDetails.warrantyPeriod,
          repairSummary: quoteDetails.repairSummary,
          description: quoteDetails.repairSummary
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowQuoteModal(false);
        fetchData();
      } else {
        alert(data.message || 'Error setting quote');
      }
    } catch (err) {
      console.error('Error setting quote:', err);
      alert('Network or server error');
    }
  };

  const handleAssignPartner = async (e) => {
    e.preventDefault();
    if (!selectedBooking || !selectedPartnerId) return;
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/admin/assign-order`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({
          bookingId: selectedBooking._id,
          technicianId: selectedPartnerId,
          payoutAmount: payoutAmount
        })
      });
      const data = await res.json();
      if (data.success) {
        setShowAssignModal(false);
        fetchData();
      }
    } catch (err) {
      console.error('Error assigning partner:', err);
    }
  };

  const filteredBookings = bookings.filter(b => {
    const matchesSearch = 
      b.referenceNumber?.toLowerCase().includes(search.toLowerCase()) ||
      b.customerName?.toLowerCase().includes(search.toLowerCase()) ||
      b.customerPhone?.toLowerCase().includes(search.toLowerCase()) ||
      `${b.deviceBrand} ${b.deviceModel}`?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'all' || b.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending': return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Completed':
      case 'Delivered': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Cancelled': return 'bg-red-500/10 text-red-400 border-red-500/20';
      default: return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === 'Pending').length,
    completed: bookings.filter(b => b.status === 'Completed' || b.status === 'Delivered').length,
    inProgress: bookings.filter(b => ['Repair Ongoing', 'In Progress', 'Assigned to Partner'].includes(b.status)).length
  };

  return (
    <div className="space-y-8">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Outfit']">Bookings Engine</h1>
          <p className="text-gray-500 mt-1">Manage, dispatch, and quote physical device repairs</p>
        </div>
        <button 
          onClick={fetchData} 
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 text-sm"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Analytics Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Repair Bookings', value: stats.total, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Pending Action', value: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Repairs In Progress', value: stats.inProgress, icon: Smartphone, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Fully Completed', value: stats.completed, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
        ].map((card, i) => (
          <div key={card.label} className="bg-[#111111] border border-white/5 p-6 rounded-3xl group relative overflow-hidden">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-2xl ${card.bg} ${card.color}`}>
                <card.icon size={20} />
              </div>
            </div>
            <div className="text-3xl font-black text-white mb-1 group-hover:scale-105 transition-transform origin-left">{card.value}</div>
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{card.label}</div>
            <div className="absolute right-0 bottom-0 w-24 h-24 bg-white/[0.01] rounded-tl-full pointer-events-none" />
          </div>
        ))}
      </div>

      {/* Filters & Actions Bar */}
      <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input
            type="text"
            placeholder="Search by ref, name, phone or brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#111111] border border-white/5 rounded-xl pl-11 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          {['all', 'Pending', 'Under Review', 'Quote Prepared', 'Assigned to Partner', 'Completed', 'Cancelled'].map(f => (
            <button
              key={f}
              onClick={() => setStatusFilter(f)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize border ${
                statusFilter === f 
                  ? 'bg-blue-600 border-blue-600 text-white' 
                  : 'bg-[#111111] text-gray-400 border-white/5 hover:bg-white/5'
              }`}
            >
              {f === 'all' ? 'All Bookings' : f}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings Table / Grid */}
      <div className="bg-[#111111] border border-white/5 rounded-3xl overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <RefreshCw size={32} className="animate-spin text-blue-500" />
            <p className="text-gray-500 text-sm">Loading active bookings...</p>
          </div>
        ) : filteredBookings.length === 0 ? (
          <div className="text-center py-24">
            <Calendar size={48} className="text-gray-700 mx-auto mb-4" />
            <h3 className="text-white font-bold text-lg mb-1">No bookings match filters</h3>
            <p className="text-gray-500 text-sm">Try resetting your search query or filter settings.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-4 font-bold">Ref / Date</th>
                  <th className="px-6 py-4 font-bold">Customer Info</th>
                  <th className="px-6 py-4 font-bold">Device Details</th>
                  <th className="px-6 py-4 font-bold">Financials</th>
                  <th className="px-6 py-4 font-bold">Service Type</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBookings.map((b, i) => (
                  <tr key={b._id} className="group hover:bg-white/[0.01] transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-white text-sm">{b.referenceNumber}</div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        {new Date(b.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-white">{b.customerName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{b.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-white flex items-center gap-2">
                        <Smartphone size={14} className="text-gray-400" />
                        {b.deviceBrand} {b.deviceModel}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 capitalize">{b.deviceCategory}</div>
                      {b.assignedTechnician && (
                        <div className="text-[10px] text-purple-400 font-bold mt-1.5 bg-purple-500/10 px-1.5 py-0.5 rounded border border-purple-500/10 inline-flex items-center">
                          Partner: {typeof b.assignedTechnician === 'object' ? b.assignedTechnician.name : b.assignedTechnician}
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">₹{(b.quotationAmount || b.approxAmount || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Quote: {b.quotationStatus || 'Not Issued'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-white/5 border border-white/5 rounded-md capitalize">
                        {b.serviceType === 'dropoff' ? 'Drop Off' : b.serviceType === 'pickup' ? 'Home Pickup' : 'Walk-in'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full border ${getStatusBadgeClass(b.status)}`}>
                        {b.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedBooking(b)}
                        className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-bold"
                      >
                        <Eye size={12} />
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Booking Drawer Detail Modal */}
      <AnimatePresence>
        {selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-end bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-xl h-full bg-[#0e0e0e] border-l border-white/5 p-8 overflow-y-auto flex flex-col justify-between"
            >
              <div>
                {/* Drawer Header */}
                <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-blue-500 font-bold">Booking Details</span>
                    <h2 className="text-2xl font-black text-white mt-1">{selectedBooking.referenceNumber}</h2>
                  </div>
                  <button 
                    onClick={() => setSelectedBooking(null)}
                    className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-xl"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Details Container */}
                <div className="space-y-6 text-sm">
                  {/* Customer Info Box */}
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <User size={14} className="text-gray-400" /> Customer Information
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">Name</div>
                        <div className="font-semibold text-white mt-0.5">{selectedBooking.customerName}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Phone</div>
                        <div className="font-semibold text-white mt-0.5">{selectedBooking.customerPhone}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-gray-500">Email Address</div>
                        <div className="font-semibold text-white mt-0.5 truncate">{selectedBooking.customerEmail}</div>
                      </div>
                    </div>
                  </div>

                  {/* Device & Issue Info Box */}
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <Smartphone size={14} className="text-gray-400" /> Device & Issue Details
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-xs text-gray-500">Brand / Model</div>
                        <div className="font-semibold text-white mt-0.5">{selectedBooking.deviceBrand} {selectedBooking.deviceModel}</div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Device Category</div>
                        <div className="font-semibold text-white mt-0.5 capitalize">{selectedBooking.deviceCategory}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-gray-500">Requested Repairs</div>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {selectedBooking.repairTypes?.map(r => (
                            <span key={r} className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/10 rounded-md text-xs">
                              {r}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-xs text-gray-500">Customer Description</div>
                        <div className="text-white mt-1 leading-relaxed bg-white/[0.01] p-3 rounded-lg border border-white/5">
                          {selectedBooking.issueDescription || "No issue description provided."}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Logistics Info Box */}
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                      <MapPin size={14} className="text-gray-400" /> Address & Time slot
                    </h3>
                    <div>
                      <div className="text-xs text-gray-500">Service Logistics</div>
                      <div className="font-semibold text-white mt-0.5 capitalize">
                        {selectedBooking.serviceType === 'pickup' ? 'Home Pickup Requested' : 'Customer Dropoff / Walk-in'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-500">Address Details</div>
                      <div className="text-gray-300 mt-1 leading-relaxed">
                        {selectedBooking.address}, {selectedBooking.city}, {selectedBooking.state} - {selectedBooking.pincode}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-1">
                      <div>
                        <div className="text-xs text-gray-500">Preferred Date</div>
                        <div className="font-semibold text-white mt-0.5">
                          {new Date(selectedBooking.preferredDate).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-gray-500">Time Slot</div>
                        <div className="font-semibold text-white mt-0.5">{selectedBooking.preferredTimeSlot}</div>
                      </div>
                    </div>
                  </div>

                  {/* Financials & Status Info Box */}
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                    <div className="flex justify-between items-center border-b border-white/5 pb-2">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                        Financial Overview
                      </h3>
                      <span className={`text-[10px] font-bold tracking-wide uppercase px-2.5 py-0.5 rounded-full border ${getStatusBadgeClass(selectedBooking.status)}`}>
                        {selectedBooking.status}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Approximate Estimate (Submission)</span>
                      <span className="font-bold text-white">₹{(selectedBooking.approxAmount || 0).toLocaleString()}</span>
                    </div>

                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-400">Quotation Issued</span>
                      <span className="font-bold text-white">
                        {selectedBooking.quotationAmount ? `₹${selectedBooking.quotationAmount.toLocaleString()}` : '—'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-sm pt-2 border-t border-white/5">
                      <span className="text-gray-400">Quotation Status</span>
                      <span className="font-bold text-blue-400">{selectedBooking.quotationStatus || 'Not Issued'}</span>
                    </div>

                    {selectedBooking.assignedTechnician && (
                      <>
                        <div className="flex justify-between items-center text-sm pt-2 border-t border-white/5">
                          <span className="text-gray-400">Assigned Service Partner</span>
                          <span className="font-bold text-purple-400">
                            {typeof selectedBooking.assignedTechnician === 'object' 
                              ? selectedBooking.assignedTechnician.name 
                              : selectedBooking.assignedTechnician}
                          </span>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-400">Technician Payout Commission</span>
                          <span className="font-bold text-purple-400">₹{(selectedBooking.partnerPayout || 0).toLocaleString()}</span>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons at Footer of Drawer */}
              <div className="mt-8 border-t border-white/5 pt-6 flex flex-wrap gap-3">
                <div className="flex-1 min-w-[200px]">
                  <select
                    value={selectedBooking.status}
                    onChange={(e) => handleStatusChange(selectedBooking._id, e.target.value)}
                    className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Under Review">Under Review</option>
                    <option value="Quote Prepared">Quote Prepared</option>
                    <option value="Assigned to Partner">Assigned to Partner</option>
                    <option value="Repair Ongoing">Repair Ongoing</option>
                    <option value="Repair Completed">Repair Completed</option>
                    <option value="Ready for Delivery">Ready for Delivery</option>
                    <option value="Delivered">Delivered</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>

                <button
                  onClick={() => {
                    setQuoteDetails({
                      approxAmount: selectedBooking.approxAmount || 0,
                      estimatedTime: selectedBooking.estimatedTime || '1-2 Days',
                      warrantyPeriod: selectedBooking.warrantyPeriod || '3 Months',
                      repairSummary: selectedBooking.repairSummary || ''
                    });
                    setShowQuoteModal(true);
                  }}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <FileText size={14} />
                  Quotation
                </button>

                <button
                  onClick={() => {
                    setSelectedPartnerId(selectedBooking.assignedTechnician || '');
                    setPayoutAmount(selectedBooking.partnerPayout || 0);
                    setShowAssignModal(true);
                  }}
                  className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <UserPlus size={14} />
                  Assign Partner
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quote Generation Modal */}
      {showQuoteModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl w-full max-w-md relative">
            <button 
              onClick={() => setShowQuoteModal(false)}
              className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white rounded-lg"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Prepare Service Quotation</h3>
            <p className="text-gray-500 text-xs mb-6">Issue or update the final repair price and details.</p>

            <form onSubmit={handleIssueQuote} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Quotation Amount (₹)</label>
                <input
                  type="number"
                  value={quoteDetails.approxAmount}
                  onChange={(e) => setQuoteDetails(prev => ({ ...prev, approxAmount: Number(e.target.value) }))}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Estimated Duration</label>
                <input
                  type="text"
                  placeholder="e.g. 1-2 Hours, 1 Day"
                  value={quoteDetails.estimatedTime}
                  onChange={(e) => setQuoteDetails(prev => ({ ...prev, estimatedTime: e.target.value }))}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Warranty Period</label>
                <select
                  value={quoteDetails.warrantyPeriod}
                  onChange={(e) => setQuoteDetails(prev => ({ ...prev, warrantyPeriod: e.target.value }))}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-medium"
                >
                  <option value="No Warranty">No Warranty</option>
                  <option value="1 Month">1 Month</option>
                  <option value="3 Months">3 Months</option>
                  <option value="6 Months">6 Months</option>
                  <option value="1 Year">1 Year</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Repair Summary / Spares Used</label>
                <textarea
                  placeholder="Summarize the repair process, components, or spare parts..."
                  value={quoteDetails.repairSummary}
                  onChange={(e) => setQuoteDetails(prev => ({ ...prev, repairSummary: e.target.value }))}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 h-24"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowQuoteModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Issue Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Technician/Partner Modal */}
      {showAssignModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl w-full max-w-md relative">
            <button 
              onClick={() => setShowAssignModal(false)}
              className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white rounded-lg"
            >
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Assign Service Partner</h3>
            <p className="text-gray-500 text-xs mb-6">Dispatch the device repair task to a nearby verified partner.</p>

            <form onSubmit={handleAssignPartner} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Select Partner</label>
                <select
                  value={selectedPartnerId}
                  onChange={(e) => setSelectedPartnerId(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  required
                >
                  <option value="">-- Choose a Technician / Partner --</option>
                  {partners.map(p => (
                    <option key={p._id} value={p._id} className="bg-[#1e1e1e]">
                      {p.name} ({p.specialization} - {p.serviceAreas?.join(', ') || 'No Area Specified'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Partner Payout (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 500"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-semibold"
                  required
                />
                <p className="text-[10px] text-gray-500 mt-1">This amount will be added to the partner's payout balance upon completion.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all"
                >
                  Assign Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
