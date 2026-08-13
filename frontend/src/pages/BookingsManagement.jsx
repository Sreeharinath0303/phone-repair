import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Calendar, Search, RefreshCw, Smartphone, MapPin,
  User, CheckCircle, Clock, X, Eye, FileText, UserPlus,
  ShieldAlert, Check, AlertTriangle, DollarSign
} from 'lucide-react';
import { getApiBaseUrl } from '../utils/apiBase';

const STATUS_FILTERS = [
  'all',
  'Pending',
  'Lead Received',
  'Sent For Partner Quote',
  'Partner Quote Received',
  'Quote Sent To Customer',
  'Partner Locked',
  'Pickup Scheduled',
  'Store Visit Scheduled',
  'Repair Ongoing',
  'Settlement Pending',
  'Completed',
  'Cancelled'
];

const WORKFLOW_STATUSES = [
  'Pending',
  'Lead Received',
  'Under Review',
  'Sent For Partner Quote',
  'Partner Quote Received',
  'Quote Sent To Customer',
  'Quote Approved',
  'Partner Locked',
  'Pickup Scheduled',
  'Store Visit Scheduled',
  'Handoff Started',
  'Picked Up',
  'Device Received',
  'Diagnosis In Progress',
  'Repair Ongoing',
  'Ready For Return',
  'Delivered / Returned',
  'Settlement Pending',
  'Settlement Completed',
  'Cancelled',
  'Disputed'
];

const emptyCommercialForm = {
  quotationAmount: 0,
  partnerQuotedAmount: 0,
  markupType: 'direct_admin_quote',
  markupValue: 0,
  estimatedTime: '',
  warrantyPeriod: '3 Months',
  repairSummary: '',
  termsAndConditions: ''
};

const BOOKING_READ_STATE_KEY = 'rv_admin_read_bookings';

const parseStoredIds = (storageKey) => {
  try {
    const raw = localStorage.getItem(storageKey);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

const formatRepairTypes = (repairTypes) => {
  if (!Array.isArray(repairTypes)) {
    return [];
  }

  return repairTypes
    .map((item) => String(item || '').trim())
    .filter(Boolean);
};

const FEEDBACK_ELIGIBLE_STATUSES = ['Completed', 'Delivered', 'Delivered / Returned', 'Repair Completed', 'Closed', 'Job Closed', 'Ready for Delivery', 'Settlement Completed'];

export const BookingsManagement = () => {
  const apiBaseUrl = getApiBaseUrl();
  const [bookings, setBookings] = useState([]);
  const [partners, setPartners] = useState([]);
  const [partnerQuotes, setPartnerQuotes] = useState([]);
  const [bookingIncidents, setBookingIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drawerLoading, setDrawerLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [selectedPartnerIds, setSelectedPartnerIds] = useState([]);
  const [selectedQuoteId, setSelectedQuoteId] = useState('');
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [showQuoteRequestModal, setShowQuoteRequestModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [showFinalPriceModal, setShowFinalPriceModal] = useState(false);
  const [scheduleDetails, setScheduleDetails] = useState({
    pickupScheduleDate: '',
    pickupScheduleTimeSlot: '',
    deliveryScheduleDate: '',
    deliveryScheduleTimeSlot: ''
  });
  const [finalPriceAmount, setFinalPriceAmount] = useState('');
  const [selectedPartnerId, setSelectedPartnerId] = useState('');
  const [payoutAmount, setPayoutAmount] = useState(0);
  const [overrideReason, setOverrideReason] = useState('');
  const [incidentReview, setIncidentReview] = useState({});
  const [uiMessage, setUiMessage] = useState(null);
  const [quoteDetails, setQuoteDetails] = useState(emptyCommercialForm);
  const [readBookingIds, setReadBookingIds] = useState(() => parseStoredIds(BOOKING_READ_STATE_KEY));

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedBooking?._id) return;
    loadBookingWorkflowData(selectedBooking._id);
  }, [selectedBooking?._id]);

  useEffect(() => {
    localStorage.setItem(BOOKING_READ_STATE_KEY, JSON.stringify(readBookingIds));
  }, [readBookingIds]);

  const authHeaders = () => {
    const token = localStorage.getItem('rv_token');
    return {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`
    };
  };

  const flashMessage = (message, type = 'info') => {
    setUiMessage({ message, type });
    window.clearTimeout(window.__rvAdminBookingToast);
    window.__rvAdminBookingToast = window.setTimeout(() => setUiMessage(null), 3500);
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const [bookingsRes, partnersRes] = await Promise.all([
        fetch(`${apiBaseUrl}/admin/export/bookings`, { headers: authHeaders() }),
        fetch(`${apiBaseUrl}/admin/partners`, { headers: authHeaders() })
      ]);

      const bookingsData = await bookingsRes.json();
      const partnersData = await partnersRes.json();

      const visibleBookings = bookingsData.success
        ? (bookingsData.data || []).filter((booking) => !booking.orderId)
        : [];

      if (bookingsData.success) setBookings(visibleBookings);
      if (partnersData.success) setPartners(partnersData.data || []);
      return {
        bookings: visibleBookings,
        partners: partnersData.success ? (partnersData.data || []) : []
      };
    } catch (err) {
      console.error('Error fetching booking management data:', err);
      flashMessage('Failed to refresh bookings data', 'error');
      return { bookings: [], partners: [] };
    } finally {
      setLoading(false);
    }
  };

  const loadBookingWorkflowData = async (bookingId) => {
    setDrawerLoading(true);
    try {
      const [quotesRes, incidentsRes] = await Promise.all([
        fetch(`${apiBaseUrl}/admin/partner-quotes/${bookingId}`, { headers: authHeaders() }),
        fetch(`${apiBaseUrl}/admin/booking-incidents/${bookingId}`, { headers: authHeaders() })
      ]);

      const quotesData = await quotesRes.json();
      const incidentsData = await incidentsRes.json();

      setPartnerQuotes(quotesData.success ? (quotesData.data || []) : []);
      setBookingIncidents(incidentsData.success ? (incidentsData.data || []) : []);
    } catch (err) {
      console.error('Error loading booking workflow data:', err);
      setPartnerQuotes([]);
      setBookingIncidents([]);
    } finally {
      setDrawerLoading(false);
    }
  };

  const refreshSelectedBooking = async (bookingId) => {
    const refreshed = await fetchData();
    const current = refreshed.bookings.find((booking) => booking._id === bookingId);
    if (current) {
      setSelectedBooking(current);
    }
    await loadBookingWorkflowData(bookingId);
  };

  const markBookingAsRead = (bookingId) => {
    if (!bookingId) return;
    setReadBookingIds((current) => (current.includes(bookingId) ? current : [...current, bookingId]));
  };

  const openBookingDetails = (booking) => {
    setSelectedBooking(booking);
    markBookingAsRead(booking?._id);
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    try {
      const res = await fetch(`${apiBaseUrl}/admin/update-status`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ bookingId, status: newStatus })
      });
      const data = await res.json();
      if (!data.success) {
        flashMessage(data.message || 'Status update failed', 'error');
        return;
      }
      flashMessage('Booking status updated', 'success');
      await refreshSelectedBooking(bookingId);
    } catch (err) {
      console.error('Error updating status:', err);
      flashMessage('Status update failed', 'error');
    }
  };

  const handleIssueQuote = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setSubmitting(true);
    try {
      const payload = {
        bookingId: selectedBooking._id,
        quotationAmount: Number(quoteDetails.quotationAmount),
        partnerQuotedAmount: Number(quoteDetails.partnerQuotedAmount),
        markupType: quoteDetails.markupType,
        markupValue: Number(quoteDetails.markupValue),
        estimatedTime: quoteDetails.estimatedTime,
        warrantyPeriod: quoteDetails.warrantyPeriod,
        repairSummary: quoteDetails.repairSummary,
        termsAndConditions: quoteDetails.termsAndConditions,
        description: quoteDetails.repairSummary
      };

      const res = await fetch(`${apiBaseUrl}/admin/set-quote`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) {
        flashMessage(data.message || 'Quote send failed', 'error');
        return;
      }

      flashMessage('Customer quote sent successfully', 'success');
      setShowQuoteModal(false);
      await refreshSelectedBooking(selectedBooking._id);
    } catch (err) {
      console.error('Error setting quote:', err);
      flashMessage('Quote send failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAssignPartner = async (e) => {
    e.preventDefault();
    if (!selectedBooking || !selectedPartnerId) return;
    setSubmitting(true);
    try {
      const endpoint = overrideReason.trim()
        ? `${apiBaseUrl}/admin/bookings/${selectedBooking._id}/override-assignment`
        : `${apiBaseUrl}/admin/assign-order`;
      const payload = overrideReason.trim()
        ? { technicianId: selectedPartnerId, reason: overrideReason.trim() }
        : {
            bookingId: selectedBooking._id,
            technicianId: selectedPartnerId,
            payoutAmount: Number(payoutAmount)
          };

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (!data.success) {
        flashMessage(data.message || 'Partner assignment failed', 'error');
        return;
      }

      flashMessage(overrideReason.trim() ? 'Assignment overridden successfully' : 'Partner assigned successfully', 'success');
      setShowAssignModal(false);
      setOverrideReason('');
      await refreshSelectedBooking(selectedBooking._id);
    } catch (err) {
      console.error('Error assigning partner:', err);
      flashMessage('Partner assignment failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRequestPartnerQuotes = async (e) => {
    e.preventDefault();
    if (!selectedBooking || selectedPartnerIds.length === 0) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/admin/partner-quotes/request`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ bookingId: selectedBooking._id, partnerIds: selectedPartnerIds })
      });
      const data = await res.json();
      if (!data.success) {
        flashMessage(data.message || 'Failed to request partner quotes', 'error');
        return;
      }
      flashMessage('Partner quote requests sent', 'success');
      setShowQuoteRequestModal(false);
      setSelectedPartnerIds([]);
      await refreshSelectedBooking(selectedBooking._id);
    } catch (err) {
      console.error('Error requesting partner quotes:', err);
      flashMessage('Failed to request partner quotes', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSelectPartnerQuote = async (quoteId) => {
    if (!selectedBooking) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/admin/partner-quotes/${quoteId}/select`, {
        method: 'POST',
        headers: authHeaders()
      });
      const data = await res.json();
      if (!data.success) {
        flashMessage(data.message || 'Failed to select quote', 'error');
        return;
      }

      const updatedBooking = data.data?.booking;
      if (updatedBooking) {
        setSelectedQuoteId(quoteId);
        setQuoteDetails((prev) => ({
          ...prev,
          partnerQuotedAmount: updatedBooking.partnerQuotedAmount || 0,
          markupType: 'fixed',
          markupValue: 0,
          quotationAmount: updatedBooking.partnerQuotedAmount || 0,
          estimatedTime: updatedBooking.estimatedTime || prev.estimatedTime,
          warrantyPeriod: updatedBooking.warrantyPeriod || prev.warrantyPeriod
        }));
      }
      flashMessage('Partner quote selected. Final customer quote can now be prepared.', 'success');
      await refreshSelectedBooking(selectedBooking._id);
    } catch (err) {
      console.error('Error selecting partner quote:', err);
      flashMessage('Failed to select quote', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReviewIncident = async (incidentId, reviewStatus) => {
    if (!selectedBooking) return;
    setSubmitting(true);
    try {
      const review = incidentReview[incidentId] || {};
      const res = await fetch(`${apiBaseUrl}/admin/bookings/${selectedBooking._id}/incident-review`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({
          incidentId,
          reviewStatus,
          adminNote: review.adminNote || ''
        })
      });
      const data = await res.json();
      if (!data.success) {
        flashMessage(data.message || 'Incident review failed', 'error');
        return;
      }
      flashMessage(`Incident ${reviewStatus}`, 'success');
      await refreshSelectedBooking(selectedBooking._id);
    } catch (err) {
      console.error('Error reviewing incident:', err);
      flashMessage('Incident review failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFeedbackVisibilityToggle = async (booking, visible) => {
    if (!booking?._id) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/admin/bookings/${booking._id}/feedback-visibility`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ visible })
      });
      const data = await res.json();
      if (!data.success) {
        flashMessage(data.message || 'Feedback visibility update failed', 'error');
        return;
      }

      flashMessage(data.message || 'Feedback visibility updated', 'success');
      await refreshSelectedBooking(booking._id);
    } catch (err) {
      console.error('Error updating feedback visibility:', err);
      flashMessage('Feedback visibility update failed', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleScheduleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/admin/bookings/${selectedBooking._id}/schedule`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(scheduleDetails)
      });
      const data = await res.json();
      if (!data.success) {
        flashMessage(data.message || 'Failed to update schedule', 'error');
        return;
      }
      flashMessage('Schedule updated successfully', 'success');
      setShowScheduleModal(false);
      await refreshSelectedBooking(selectedBooking._id);
    } catch (err) {
      console.error('Error updating schedule:', err);
      flashMessage('Failed to update schedule', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalPriceSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBooking) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${apiBaseUrl}/admin/bookings/${selectedBooking._id}/final-price`, {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify({ finalAmount: finalPriceAmount })
      });
      const data = await res.json();
      if (!data.success) {
        flashMessage(data.message || 'Failed to update final price', 'error');
        return;
      }
      flashMessage('Final price updated successfully', 'success');
      setShowFinalPriceModal(false);
      await refreshSelectedBooking(selectedBooking._id);
    } catch (err) {
      console.error('Error updating final price:', err);
      flashMessage('Failed to update final price', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredBookings = useMemo(() => (
    bookings
      .filter((booking) => {
      const query = search.toLowerCase();
      const repairTypesLabel = formatRepairTypes(booking.repairTypes).join(' ').toLowerCase();
      const issueLabel = String(booking.issueDescription || '').toLowerCase();
      const matchesSearch =
        booking.referenceNumber?.toLowerCase().includes(query) ||
        booking.customerName?.toLowerCase().includes(query) ||
        booking.customerPhone?.toLowerCase().includes(query) ||
        `${booking.deviceBrand} ${booking.deviceModel}`.toLowerCase().includes(query) ||
        repairTypesLabel.includes(query) ||
        issueLabel.includes(query);

      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      return matchesSearch && matchesStatus;
    })
      .sort((a, b) => {
        const aIsUnread = !readBookingIds.includes(a._id);
        const bIsUnread = !readBookingIds.includes(b._id);
        if (aIsUnread !== bIsUnread) {
          return aIsUnread ? -1 : 1;
        }
        return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
      })
  ), [bookings, search, statusFilter, readBookingIds]);

  const unreadBookingsCount = useMemo(
    () => bookings.filter((booking) => !readBookingIds.includes(booking._id)).length,
    [bookings, readBookingIds]
  );

  const stats = {
    total: bookings.length,
    pending: bookings.filter((booking) => ['Pending', 'Lead Received', 'Under Review', 'Sent For Partner Quote'].includes(booking.status)).length,
    completed: bookings.filter((booking) => ['Completed', 'Delivered / Returned', 'Settlement Completed'].includes(booking.status)).length,
    inProgress: bookings.filter((booking) => ['Partner Locked', 'Pickup Scheduled', 'Store Visit Scheduled', 'Repair Ongoing', 'Diagnosis In Progress', 'Settlement Pending'].includes(booking.status)).length
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Pending':
      case 'Lead Received':
      case 'Sent For Partner Quote':
      case 'Quote Sent To Customer':
        return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
      case 'Completed':
      case 'Delivered / Returned':
      case 'Settlement Completed':
        return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
      case 'Cancelled':
      case 'Disputed':
        return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'Partner Locked':
      case 'Pickup Scheduled':
      case 'Store Visit Scheduled':
        return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default:
        return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    }
  };

  const openQuoteModal = () => {
    if (!selectedBooking) return;
    setQuoteDetails({
      quotationAmount: selectedBooking.quotationAmount || selectedBooking.partnerQuotedAmount || selectedBooking.approxAmount || 0,
      partnerQuotedAmount: selectedBooking.partnerQuotedAmount || 0,
      markupType: selectedBooking.markupType || (selectedBooking.quotedByPartnerId ? 'fixed' : 'direct_admin_quote'),
      markupValue: selectedBooking.markupValue || 0,
      estimatedTime: selectedBooking.estimatedTime || '1-2 Days',
      warrantyPeriod: selectedBooking.warrantyPeriod || '3 Months',
      repairSummary: selectedBooking.repairSummary || '',
      termsAndConditions: selectedBooking.termsAndConditions || ''
    });
    setShowQuoteModal(true);
  };

  const getRepairSummary = (booking) => {
    const repairTypes = formatRepairTypes(booking?.repairTypes);
    if (repairTypes.length > 0) {
      return repairTypes;
    }

    return ['General Diagnostics'];
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white font-['Outfit']">Bookings Engine</h1>
          <p className="text-gray-500 mt-1">Manage quote sourcing, assignment locks, handoff risk, and settlement readiness.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 rounded-xl border border-blue-500/20 bg-blue-500/10 px-3 py-2 text-xs font-bold text-blue-200">
            <span className="inline-flex h-2.5 w-2.5 rounded-full bg-blue-400" />
            {unreadBookingsCount} unread booking{unreadBookingsCount === 1 ? '' : 's'}
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl transition-all border border-white/5 text-sm"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>
      </div>

      {uiMessage && (
        <div className={`rounded-2xl border px-4 py-3 text-sm ${
          uiMessage.type === 'error'
            ? 'border-red-500/20 bg-red-500/10 text-red-300'
            : uiMessage.type === 'success'
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-300'
              : 'border-blue-500/20 bg-blue-500/10 text-blue-300'
        }`}>
          {uiMessage.message}
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Repair Bookings', value: stats.total, icon: Calendar, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Pending Action', value: stats.pending, icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10' },
          { label: 'Repairs In Progress', value: stats.inProgress, icon: Smartphone, color: 'text-purple-500', bg: 'bg-purple-500/10' },
          { label: 'Fully Completed', value: stats.completed, icon: CheckCircle, color: 'text-emerald-500', bg: 'bg-emerald-500/10' }
        ].map((card) => (
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
          {STATUS_FILTERS.map((filter) => (
            <button
              key={filter}
              onClick={() => setStatusFilter(filter)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all capitalize border ${
                statusFilter === filter
                  ? 'bg-blue-600 border-blue-600 text-white'
                  : 'bg-[#111111] text-gray-400 border-white/5 hover:bg-white/5'
              }`}
            >
              {filter === 'all' ? 'All Bookings' : filter}
            </button>
          ))}
        </div>
      </div>

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
          <>
          <div className="md:hidden space-y-3 p-3">
            {filteredBookings.map((booking) => {
              const isUnread = !readBookingIds.includes(booking._id);
              const repairSummary = getRepairSummary(booking);

              return (
                <button
                  key={booking._id}
                  type="button"
                  onClick={() => openBookingDetails(booking)}
                  className={`w-full rounded-2xl border p-4 text-left transition-all ${
                    isUnread
                      ? 'border-blue-500/30 bg-blue-500/[0.08] shadow-[0_0_0_1px_rgba(59,130,246,0.12)]'
                      : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="text-sm font-bold text-white">{booking.referenceNumber}</div>
                        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${isUnread ? 'border-blue-400/30 bg-blue-500/15 text-blue-200' : 'border-white/10 bg-white/5 text-gray-400'}`}>
                          {isUnread ? 'Unread' : 'Read'}
                        </span>
                      </div>
                      <div className="mt-1 text-[11px] text-gray-500">
                        {new Date(booking.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                      </div>
                    </div>
                    <span className={`shrink-0 text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full border ${getStatusBadgeClass(booking.status)}`}>
                      {booking.status}
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-3 rounded-xl border border-white/5 bg-black/20 p-3 text-xs">
                    <div>
                      <div className="text-gray-500">Customer</div>
                      <div className="mt-1 font-semibold text-white">{booking.customerName}</div>
                      <div className="mt-0.5 text-gray-400">{booking.customerPhone}</div>
                    </div>
                    <div>
                      <div className="text-gray-500">Device</div>
                      <div className="mt-1 font-semibold text-white">{booking.deviceBrand} {booking.deviceModel}</div>
                      <div className="mt-1 flex flex-wrap gap-1.5">
                        {repairSummary.map((repairType) => (
                          <span
                            key={`${booking._id}-mobile-${repairType}`}
                            className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2 py-1 text-[10px] font-semibold text-blue-200"
                          >
                            {repairType}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <div className="text-gray-500">Commercials</div>
                        <div className="mt-1 font-bold text-white">Rs {(booking.quotationAmount || booking.approxAmount || 0).toLocaleString()}</div>
                        <div className="text-[10px] text-gray-500">Quote: {booking.quotationStatus || 'Not Issued'}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Service</div>
                        <div className="mt-1 text-white">
                          {booking.serviceType === 'dropoff' ? 'Drop Off' : booking.serviceType === 'pickup' ? 'Home Pickup' : 'Walk-in'}
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-500">Issue</div>
                      <div className="mt-1 line-clamp-2 text-gray-300">{booking.issueDescription || 'No issue description provided.'}</div>
                    </div>
                  </div>

                  <div className="mt-3 inline-flex items-center gap-1.5 text-xs font-bold text-white">
                    <Eye size={12} />
                    View booking
                  </div>
                </button>
              );
            })}
          </div>

          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="text-[10px] uppercase tracking-widest text-gray-500 border-b border-white/5 bg-white/[0.02]">
                  <th className="px-6 py-4 font-bold">Ref / Date</th>
                  <th className="px-6 py-4 font-bold">Customer Info</th>
                  <th className="px-6 py-4 font-bold">Device Details</th>
                  <th className="px-6 py-4 font-bold">Commercials</th>
                  <th className="px-6 py-4 font-bold">Service Type</th>
                  <th className="px-6 py-4 font-bold">Status</th>
                  <th className="px-6 py-4 font-bold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredBookings.map((booking) => {
                  const isUnread = !readBookingIds.includes(booking._id);
                  return (
                  <tr
                    key={booking._id}
                    className={`group transition-colors ${isUnread ? 'bg-blue-500/[0.04] hover:bg-blue-500/[0.08]' : 'hover:bg-white/[0.01]'}`}
                  >
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-bold text-white text-sm">{booking.referenceNumber}</div>
                        <span className={`rounded-full border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide ${isUnread ? 'border-blue-400/30 bg-blue-500/15 text-blue-200' : 'border-white/10 bg-white/5 text-gray-500'}`}>
                          {isUnread ? 'Unread' : 'Read'}
                        </span>
                      </div>
                      <div className="text-[10px] text-gray-500 mt-1">
                        {new Date(booking.createdAt).toLocaleDateString('en-IN', { dateStyle: 'medium' })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-semibold text-white">{booking.customerName}</div>
                      <div className="text-xs text-gray-500 mt-0.5">{booking.customerPhone}</div>
                    </td>
                    <td className="px-6 py-4">
                      {(() => {
                        const repairSummary = getRepairSummary(booking);
                        return (
                          <>
                      <div className="text-sm font-medium text-white flex items-center gap-2">
                        <Smartphone size={14} className="text-gray-400" />
                        {booking.deviceBrand} {booking.deviceModel}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 capitalize">{booking.deviceCategory}</div>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {repairSummary.map((repairType) => (
                          <span
                            key={`${booking._id}-${repairType}`}
                            className="rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-[10px] font-semibold text-blue-200"
                          >
                            {repairType}
                          </span>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-gray-400 line-clamp-2">
                        {booking.issueDescription || 'No issue description provided.'}
                      </div>
                      {booking.quotedByPartnerId && (
                        <div className="text-[10px] text-blue-300 mt-1.5">Quoted partner locked</div>
                      )}
                          </>
                        );
                      })()}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-white">Rs {(booking.quotationAmount || booking.approxAmount || 0).toLocaleString()}</div>
                      <div className="text-[10px] text-gray-500 mt-0.5">Quote: {booking.quotationStatus || 'Not Issued'}</div>
                      {(booking.platformMargin || 0) > 0 && (
                        <div className="text-[10px] text-emerald-300 mt-0.5">Margin: Rs {(booking.platformMargin || 0).toLocaleString()}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-semibold px-2 py-0.5 bg-white/5 border border-white/5 rounded-md capitalize">
                        {booking.serviceType === 'dropoff' ? 'Drop Off' : booking.serviceType === 'pickup' ? 'Home Pickup' : 'Walk-in'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full border ${getStatusBadgeClass(booking.status)}`}>
                        {booking.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => openBookingDetails(booking)}
                        className="p-2 text-gray-400 hover:text-white bg-white/5 hover:bg-white/10 rounded-lg transition-colors inline-flex items-center gap-1.5 text-xs font-bold"
                      >
                        <Eye size={12} />
                        View
                      </button>
                    </td>
                  </tr>
                )})}
              </tbody>
            </table>
          </div>
          </>
        )}
      </div>

      <AnimatePresence>
        {selectedBooking && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-end md:items-center justify-end bg-black/60 backdrop-blur-sm p-0 md:p-4"
            >
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl h-[92vh] md:h-full bg-[#0e0e0e] border-t md:border-t-0 md:border-l border-white/5 p-4 md:p-8 overflow-y-auto flex flex-col justify-between rounded-t-3xl md:rounded-none"
            >
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-white/5 pb-4">
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

                {drawerLoading && (
                  <div className="rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-3 text-sm text-gray-400">
                    Loading quote workflow and incident details...
                  </div>
                )}

                <div className="grid gap-4">
                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="text-xs text-gray-500">Customer</div>
                    <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-gray-500">Name</div>
                        <div className="font-semibold text-white mt-0.5">{selectedBooking.customerName}</div>
                      </div>
                      <div>
                        <div className="text-gray-500">Phone</div>
                        <div className="font-semibold text-white mt-0.5">{selectedBooking.customerPhone}</div>
                      </div>
                      <div className="col-span-2">
                        <div className="text-gray-500">Email</div>
                        <div className="font-semibold text-white mt-0.5">{selectedBooking.customerEmail}</div>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="text-xs text-gray-500">Device & Logistics</div>
                    <div className="mt-2 space-y-3 text-sm">
                      <div className="text-white font-semibold">{selectedBooking.deviceBrand} {selectedBooking.deviceModel}</div>
                      <div>
                        <div className="text-gray-500 mb-2">Selected Repair</div>
                        <div className="flex flex-wrap gap-2">
                          {getRepairSummary(selectedBooking).map((repairType) => (
                            <span
                              key={`${selectedBooking._id}-${repairType}`}
                              className="rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-xs font-semibold text-blue-200"
                            >
                              {repairType}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div className="text-gray-500 mb-1">Reported Issue</div>
                      <div className="text-gray-400">{selectedBooking.issueDescription || 'No issue description provided.'}</div>
                      </div>
                      <div className="text-gray-400">
                        {selectedBooking.address}, {selectedBooking.city}, {selectedBooking.state} - {selectedBooking.pincode}
                      </div>
                      <div className="flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 capitalize">{selectedBooking.serviceType}</span>
                        <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{selectedBooking.workflowPhase || 'intake'}</span>
                      </div>
                    </div>
                  </div>

                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-gray-500">Commercial Overview</div>
                      <span className={`text-[10px] font-bold tracking-wide uppercase px-2.5 py-1 rounded-full border ${getStatusBadgeClass(selectedBooking.status)}`}>
                        {selectedBooking.status}
                      </span>
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between"><span className="text-gray-400">Approximate Estimate</span><span className="font-bold text-white">Rs {(selectedBooking.approxAmount || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Partner Base</span><span className="font-bold text-purple-300">Rs {(selectedBooking.partnerQuotedAmount || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Customer Quote</span><span className="font-bold text-white">{selectedBooking.quotationAmount ? `Rs ${selectedBooking.quotationAmount.toLocaleString()}` : 'Not sent'}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Locked Partner Payout</span><span className="font-bold text-purple-400">Rs {(selectedBooking.partnerPayoutLocked || selectedBooking.partnerPayout || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Platform Margin</span><span className="font-bold text-emerald-400">Rs {(selectedBooking.platformMargin || 0).toLocaleString()}</span></div>
                      <div className="flex justify-between"><span className="text-gray-400">Quote Status</span><span className="font-bold text-blue-400">{selectedBooking.quotationStatus || 'Not Issued'}</span></div>
                      {selectedBooking.assignedTechnician && (
                        <div className="flex justify-between">
                          <span className="text-gray-400">Assigned Partner</span>
                          <span className="font-bold text-purple-400">
                            {typeof selectedBooking.assignedTechnician === 'object' ? selectedBooking.assignedTechnician.name : selectedBooking.assignedTechnician}
                          </span>
                        </div>
                      )}
                      {selectedBooking.assignmentLockReason && (
                        <div className="rounded-xl border border-yellow-400/20 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-200">
                          Assignment locked: {selectedBooking.assignmentLockReason}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500">Partner Quote Sourcing</div>
                        <div className="text-sm text-white font-semibold mt-1">Blind quotes without customer PII</div>
                      </div>
                      <button
                        onClick={() => setShowQuoteRequestModal(true)}
                        className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold"
                      >
                        Request Quotes
                      </button>
                    </div>

                    {partnerQuotes.length === 0 ? (
                      <div className="text-xs text-gray-500">No partner quotes requested for this booking yet.</div>
                    ) : (
                      <div className="space-y-3">
                        {partnerQuotes.map((quote) => (
                          <div key={quote._id} className={`rounded-2xl border p-4 ${quote.status === 'selected' ? 'border-emerald-400/30 bg-emerald-500/10' : 'border-white/5 bg-white/[0.02]'}`}>
                            <div className="flex items-start justify-between gap-4">
                              <div className="space-y-1 text-xs">
                                <div className="text-white font-bold">{quote.partnerId?.name || 'Partner'}</div>
                                <div className="text-gray-400">{quote.partnerId?.specialization || 'General Repair'} • {quote.partnerId?.city || 'Coverage area active'}</div>
                                <div className="text-gray-500 uppercase">{quote.status}</div>
                              </div>
                              <div className="text-right text-xs">
                                <div className="text-white font-bold">Rs {(quote.quoteAmount || 0).toLocaleString()}</div>
                                <div className="text-gray-400">{quote.eta || 'ETA pending'}</div>
                              </div>
                            </div>
                            {quote.notes && <div className="text-xs text-gray-300 mt-3">{quote.notes}</div>}
                            {quote.status === 'submitted' && (
                              <button
                                onClick={() => handleSelectPartnerQuote(quote._id)}
                                disabled={submitting}
                                className="mt-3 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                              >
                                Select Quote
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-xs text-gray-500">Handoff Incident Review</div>
                        <div className="text-sm text-white font-semibold mt-1">Admin confirmation required before risk scoring</div>
                      </div>
                    </div>

                    {bookingIncidents.length === 0 ? (
                      <div className="text-xs text-gray-500">No handoff incidents have been reported on this booking.</div>
                    ) : (
                      <div className="space-y-3">
                        {bookingIncidents.map((incident) => (
                          <div key={incident._id} className="rounded-2xl border border-yellow-400/20 bg-yellow-500/10 p-4 space-y-3">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="text-sm font-bold text-white">
                                  {incident.incidentType === 'customer_no_show' ? 'Customer No-Show' : 'Customer Cancelled at Handoff'}
                                </div>
                                <div className="text-xs text-gray-400 mt-1">
                                  {incident.partnerId?.name || 'Partner'} • Attempt {incident.attemptNumber || 1} • {incident.serviceMode}
                                </div>
                              </div>
                              <div className={`text-[10px] font-bold uppercase ${incident.reviewStatus === 'confirmed' ? 'text-emerald-300' : incident.reviewStatus === 'rejected' ? 'text-red-300' : 'text-yellow-200'}`}>
                                {incident.reviewStatus}
                              </div>
                            </div>
                            {incident.partnerNote && <div className="text-xs text-gray-200">{incident.partnerNote}</div>}
                            <textarea
                              placeholder="Admin review note"
                              value={incidentReview[incident._id]?.adminNote || ''}
                              onChange={(e) => setIncidentReview((prev) => ({ ...prev, [incident._id]: { adminNote: e.target.value } }))}
                              className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-yellow-400 h-20"
                            />
                            {incident.reviewStatus === 'pending' && (
                              <div className="flex gap-3">
                                <button
                                  onClick={() => handleReviewIncident(incident._id, 'confirmed')}
                                  disabled={submitting}
                                  className="flex-1 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold"
                                >
                                  Confirm Incident
                                </button>
                                <button
                                  onClick={() => handleReviewIncident(incident._id, 'rejected')}
                                  disabled={submitting}
                                  className="flex-1 px-3 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold"
                                >
                                  Reject Incident
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="p-5 bg-white/[0.02] border border-white/5 rounded-2xl space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <div className="text-xs text-gray-500">Website Feedback Visibility</div>
                        <div className="text-sm text-white font-semibold mt-1">Control this repair individually in the customer feedback section</div>
                      </div>
                      <div className={`text-[10px] font-bold uppercase ${selectedBooking.showInCustomerFeedbackSection !== false ? 'text-emerald-300' : 'text-red-300'}`}>
                        {selectedBooking.showInCustomerFeedbackSection !== false ? 'Visible' : 'Hidden'}
                      </div>
                    </div>

                    {FEEDBACK_ELIGIBLE_STATUSES.includes(selectedBooking.status) ? (
                      <div className="flex flex-wrap gap-3">
                        <button
                          onClick={() => handleFeedbackVisibilityToggle(selectedBooking, true)}
                          disabled={submitting || selectedBooking.showInCustomerFeedbackSection !== false}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold"
                        >
                          Show In Feedback
                        </button>
                        <button
                          onClick={() => handleFeedbackVisibilityToggle(selectedBooking, false)}
                          disabled={submitting || selectedBooking.showInCustomerFeedbackSection === false}
                          className="px-4 py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl text-xs font-bold"
                        >
                          Hide From Feedback
                        </button>
                      </div>
                    ) : (
                      <div className="text-xs text-gray-500">
                        This control becomes active after the repair reaches a completed status.
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-8 border-t border-white/5 pt-6 flex flex-wrap gap-3">
                <div className="flex-1 min-w-[220px]">
                  <select
                    value={selectedBooking.status}
                    onChange={(e) => handleStatusChange(selectedBooking._id, e.target.value)}
                    className="w-full bg-[#111111] border border-white/10 rounded-xl px-3 py-3 text-xs text-white focus:outline-none focus:border-blue-500"
                  >
                    {WORKFLOW_STATUSES.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </div>

                <button
                  onClick={openQuoteModal}
                  className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <FileText size={14} />
                  Final Customer Quote
                </button>

                <button
                  onClick={() => {
                    setSelectedPartnerId(selectedBooking.assignedTechnician?._id || selectedBooking.assignedTechnician || selectedBooking.quotedByPartnerId || '');
                    setPayoutAmount(selectedBooking.partnerPayoutLocked || selectedBooking.partnerPayout || 0);
                    setOverrideReason('');
                    setShowAssignModal(true);
                  }}
                  className="px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <UserPlus size={14} />
                  Assign / Override
                </button>

                <button
                  onClick={() => {
                    setScheduleDetails({
                      pickupScheduleDate: selectedBooking.pickupScheduleDate ? new Date(selectedBooking.pickupScheduleDate).toISOString().split('T')[0] : '',
                      pickupScheduleTimeSlot: selectedBooking.pickupScheduleTimeSlot || '',
                      deliveryScheduleDate: selectedBooking.deliveryScheduleDate ? new Date(selectedBooking.deliveryScheduleDate).toISOString().split('T')[0] : '',
                      deliveryScheduleTimeSlot: selectedBooking.deliveryScheduleTimeSlot || ''
                    });
                    setShowScheduleModal(true);
                  }}
                  className="px-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                >
                  <Calendar size={14} />
                  Update Schedule
                </button>

                {selectedBooking.status === 'Delivered' && (
                  <button
                    onClick={() => {
                      setFinalPriceAmount(selectedBooking.finalAmount || selectedBooking.quotationAmount || 0);
                      setShowFinalPriceModal(true);
                    }}
                    className="px-4 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1"
                  >
                    <DollarSign size={14} />
                    Set Final Price
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showQuoteModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowQuoteModal(false)} className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white rounded-lg">
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Prepare Final Customer Quote</h3>
            <p className="text-gray-500 text-xs mb-6">Use direct admin quote or add fixed / percentage markup on a selected partner quote.</p>

            <form onSubmit={handleIssueQuote} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Commercial Mode</label>
                <select
                  value={quoteDetails.markupType}
                  onChange={(e) => setQuoteDetails((prev) => ({ ...prev, markupType: e.target.value }))}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="direct_admin_quote">Direct Admin Quote</option>
                  <option value="fixed">Fixed Markup on Partner Quote</option>
                  <option value="percentage">Percentage Markup on Partner Quote</option>
                </select>
              </div>

              {quoteDetails.markupType !== 'direct_admin_quote' && (
                <>
                  <div>
                    <label className="block text-gray-400 font-bold mb-1.5">Partner Base Quote</label>
                    <input
                      type="number"
                      value={quoteDetails.partnerQuotedAmount}
                      onChange={(e) => setQuoteDetails((prev) => ({ ...prev, partnerQuotedAmount: Number(e.target.value) }))}
                      className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 font-bold mb-1.5">{quoteDetails.markupType === 'percentage' ? 'Markup Percentage' : 'Markup Amount'}</label>
                    <input
                      type="number"
                      value={quoteDetails.markupValue}
                      onChange={(e) => setQuoteDetails((prev) => ({ ...prev, markupValue: Number(e.target.value) }))}
                      className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                      required
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Customer Quotation Amount</label>
                <input
                  type="number"
                  value={quoteDetails.quotationAmount}
                  onChange={(e) => setQuoteDetails((prev) => ({ ...prev, quotationAmount: Number(e.target.value) }))}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-bold mb-1.5">Estimated Duration</label>
                  <input
                    type="text"
                    value={quoteDetails.estimatedTime}
                    onChange={(e) => setQuoteDetails((prev) => ({ ...prev, estimatedTime: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1.5">Warranty</label>
                  <input
                    type="text"
                    value={quoteDetails.warrantyPeriod}
                    onChange={(e) => setQuoteDetails((prev) => ({ ...prev, warrantyPeriod: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Repair Summary</label>
                <textarea
                  value={quoteDetails.repairSummary}
                  onChange={(e) => setQuoteDetails((prev) => ({ ...prev, repairSummary: e.target.value }))}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 h-24"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Terms & Conditions</label>
                <textarea
                  value={quoteDetails.termsAndConditions}
                  onChange={(e) => setQuoteDetails((prev) => ({ ...prev, termsAndConditions: e.target.value }))}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 h-20"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="button" onClick={() => setShowQuoteModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all">
                  {submitting ? 'Sending...' : 'Send Quote'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAssignModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl w-full max-w-md relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowAssignModal(false)} className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white rounded-lg">
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Assign or Override Partner</h3>
            <p className="text-gray-500 text-xs mb-6">Direct assignment is allowed before lock. Add an override reason if the quote-approved booking must move to another partner.</p>

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
                  {partners.map((partner) => (
                    <option key={partner._id} value={partner._id}>
                      {partner.name} ({partner.specialization} - {partner.serviceAreas?.join(', ') || 'No Area Specified'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Partner Payout</label>
                <input
                  type="number"
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(Number(e.target.value))}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Override Reason</label>
                <textarea
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  placeholder="Required only if you must break the selected quote lock."
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 h-24"
                />
              </div>

              <div className="rounded-xl border border-yellow-400/20 bg-yellow-500/10 px-3 py-3 text-[11px] text-yellow-200">
                Leave override reason blank for normal assignment. Add a reason to use the locked-assignment override endpoint.
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowAssignModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white font-bold py-3 rounded-xl transition-all">
                  {submitting ? 'Saving...' : 'Save Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showQuoteRequestModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowQuoteRequestModal(false)} className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white rounded-lg">
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Request Blind Partner Quotes</h3>
            <p className="text-gray-500 text-xs mb-6">Partners will receive device, issue, zone, and service mode only. Customer PII stays hidden.</p>

            <form onSubmit={handleRequestPartnerQuotes} className="space-y-4 text-xs">
              <div className="grid gap-2 max-h-80 overflow-y-auto rounded-2xl border border-white/5 bg-[#1a1a1a] p-3">
                {partners.map((partner) => {
                  const checked = selectedPartnerIds.includes(partner._id);
                  return (
                    <label key={partner._id} className={`flex items-start gap-3 rounded-xl border px-3 py-3 cursor-pointer ${checked ? 'border-blue-500/30 bg-blue-500/10' : 'border-white/5 bg-white/[0.02]'}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setSelectedPartnerIds((prev) => e.target.checked ? [...prev, partner._id] : prev.filter((id) => id !== partner._id));
                        }}
                        className="mt-0.5"
                      />
                      <div className="min-w-0">
                        <div className="text-white font-bold">{partner.name}</div>
                        <div className="text-gray-400 mt-1">{partner.specialization}</div>
                        <div className="text-gray-500 mt-1">{partner.serviceAreas?.join(', ') || 'No service areas listed'}</div>
                        {partner.warningStatus === 'yellow' && (
                          <div className="mt-2 inline-flex items-center gap-1 rounded-full border border-yellow-400/20 bg-yellow-500/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-yellow-300">
                            <ShieldAlert size={10} />
                            Warning Zone
                          </div>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowQuoteRequestModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting || selectedPartnerIds.length === 0} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
                  {submitting ? 'Sending...' : 'Send Quote Requests'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showScheduleModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowScheduleModal(false)} className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white rounded-lg">
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Update Schedule</h3>
            <p className="text-gray-500 text-xs mb-6">Set pickup or delivery schedules for the partner/customer to view.</p>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-bold mb-1.5">Pickup Date</label>
                  <input
                    type="date"
                    value={scheduleDetails.pickupScheduleDate}
                    onChange={(e) => setScheduleDetails((prev) => ({ ...prev, pickupScheduleDate: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1.5">Pickup Time Slot</label>
                  <input
                    type="text"
                    placeholder="e.g. 10:00 AM - 12:00 PM"
                    value={scheduleDetails.pickupScheduleTimeSlot}
                    onChange={(e) => setScheduleDetails((prev) => ({ ...prev, pickupScheduleTimeSlot: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 font-bold mb-1.5">Delivery Date</label>
                  <input
                    type="date"
                    value={scheduleDetails.deliveryScheduleDate}
                    onChange={(e) => setScheduleDetails((prev) => ({ ...prev, deliveryScheduleDate: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 font-bold mb-1.5">Delivery Time Slot</label>
                  <input
                    type="text"
                    placeholder="e.g. 2:00 PM - 4:00 PM"
                    value={scheduleDetails.deliveryScheduleTimeSlot}
                    onChange={(e) => setScheduleDetails((prev) => ({ ...prev, deliveryScheduleTimeSlot: e.target.value }))}
                    className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowScheduleModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Schedule'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showFinalPriceModal && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-[#111111] border border-white/5 p-8 rounded-3xl w-full max-w-lg relative max-h-[90vh] overflow-y-auto">
            <button onClick={() => setShowFinalPriceModal(false)} className="absolute right-4 top-4 p-2 text-gray-500 hover:text-white rounded-lg">
              <X size={18} />
            </button>
            <h3 className="text-xl font-bold text-white mb-2">Set Final Price</h3>
            <p className="text-gray-500 text-xs mb-6">Enter the final paid amount (post-delivery). Initial Quotation: Rs. {selectedBooking.quotationAmount || 0}</p>

            <form onSubmit={handleFinalPriceSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 font-bold mb-1.5">Final Amount (Rs)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  required
                  value={finalPriceAmount}
                  onChange={(e) => setFinalPriceAmount(e.target.value)}
                  className="w-full bg-[#1e1e1e] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowFinalPriceModal(false)} className="flex-1 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white font-bold py-3 rounded-xl transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl transition-all disabled:opacity-50">
                  {submitting ? 'Saving...' : 'Save Final Price'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
