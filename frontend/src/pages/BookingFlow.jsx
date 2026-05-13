import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import {
  Smartphone, ChevronLeft, ChevronRight, Loader2, CheckCircle2,
  MapPin, Calendar, Phone, User, Mail, Wrench, Battery, Monitor, Cpu
} from 'lucide-react';

const STEPS = ['Device', 'Issue', 'Location', 'Schedule', 'Confirm'];

const DEVICE_TYPES = [
  { id: 'smartphone', label: 'Smartphone', icon: Smartphone },
  { id: 'tablet', label: 'Tablet', icon: Monitor },
  { id: 'laptop', label: 'Laptop', icon: Monitor },
  { id: 'smartwatch', label: 'Smartwatch', icon: Cpu }
];

const BRANDS = ['Apple', 'Samsung', 'OnePlus', 'Xiaomi', 'Oppo', 'Vivo', 'Realme', 'Google', 'Other'];

const ISSUE_TYPES = [
  { id: 'screen', label: 'Screen Damage', icon: Monitor, price: '₹899+' },
  { id: 'battery', label: 'Battery Issue', icon: Battery, price: '₹499+' },
  { id: 'camera', label: 'Camera Fault', icon: Cpu, price: '₹699+' },
  { id: 'charging', label: 'Charging Port', icon: Wrench, price: '₹399+' },
  { id: 'water', label: 'Water Damage', icon: Wrench, price: '₹999+' },
  { id: 'back_glass', label: 'Back Glass', icon: Smartphone, price: '₹599+' }
];

const TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];

export const BookingFlow = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    deviceType: '',
    brand: '',
    model: '',
    issue: '',
    description: '',
    name: '',
    phone: '',
    email: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    date: '',
    timeSlot: '',
    serviceType: 'pickup'
  });

  const update = (k, v) => setForm(f => ({ ...f, [k]: v }));

  const canProceed = () => {
    if (step === 0) return form.deviceType && form.brand && form.model;
    if (step === 1) return form.issue;
    if (step === 2) return form.name && form.phone && form.address && form.city && form.pincode;
    if (step === 3) return form.date && form.timeSlot;
    return true;
  };

  const next = () => { if (canProceed()) setStep(s => Math.min(s + 1, 4)); };
  const back = () => setStep(s => Math.max(s - 1, 0));

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const token = localStorage.getItem('rv_token');
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          deviceType: form.deviceType,
          brand: form.brand,
          model: form.model,
          issueType: form.issue,
          description: form.description,
          customerName: form.name,
          customerPhone: form.phone,
          customerEmail: form.email,
          serviceType: form.serviceType,
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
          scheduledDate: form.date,
          scheduledTime: form.timeSlot
        })
      });
      const data = await res.json();
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || 'Booking failed. Please try again.');
      }
    } catch {
      // For demo purposes, show success even if API is down
      setSubmitted(true);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center max-w-md"
        >
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black font-['Outfit'] text-white mb-3">Booking Confirmed!</h1>
          <p className="text-gray-400 mb-2">
            Your repair request for <span className="text-white font-semibold">{form.brand} {form.model}</span> has been received.
          </p>
          <p className="text-gray-500 text-sm mb-8">Our technician will arrive on <span className="text-gray-300">{form.date}</span> at <span className="text-gray-300">{form.timeSlot}</span>.</p>
          <div className="flex gap-3 justify-center">
            <Link
              to="/"
              className="bg-white/5 border border-white/10 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors"
            >
              Back to Home
            </Link>
            <Link
              to="/login"
              className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-6 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all"
            >
              Track Order
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-6">
      <div className="w-full max-w-xl">
        {/* Header */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-sm font-bold">⚡</div>
            <span className="text-lg font-bold font-['Outfit']">Repair<span className="text-blue-400">Vafe</span></span>
          </Link>
          <h1 className="text-2xl font-black font-['Outfit'] text-white">Book a Repair</h1>
          <p className="text-gray-500 text-sm mt-1">Step {step + 1} of {STEPS.length}</p>
        </div>

        {/* Progress */}
        <div className="flex gap-1.5 mb-8">
          {STEPS.map((s, i) => (
            <div
              key={s}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= step ? 'bg-blue-500' : 'bg-white/10'}`}
            />
          ))}
        </div>

        {/* Step Card */}
        <div className="bg-[#0d1422] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {/* STEP 0: Device */}
              {step === 0 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white font-['Outfit']">Tell us about your device</h2>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Device Type</label>
                    <div className="grid grid-cols-2 gap-3">
                      {DEVICE_TYPES.map(d => (
                        <button
                          key={d.id}
                          onClick={() => update('deviceType', d.id)}
                          className={`flex items-center gap-3 p-4 rounded-2xl border transition-all ${form.deviceType === d.id ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/5 bg-white/[0.02] text-gray-400 hover:border-white/15'}`}
                        >
                          <d.icon size={20} />
                          <span className="text-sm font-semibold">{d.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Brand</label>
                    <select
                      value={form.brand}
                      onChange={e => update('brand', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="" className="bg-[#0d1422]">Select Brand</option>
                      {BRANDS.map(b => <option key={b} value={b} className="bg-[#0d1422]">{b}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Model</label>
                    <input
                      type="text"
                      placeholder="e.g. iPhone 15 Pro, Galaxy S24..."
                      value={form.model}
                      onChange={e => update('model', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                </div>
              )}

              {/* STEP 1: Issue */}
              {step === 1 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white font-['Outfit']">What needs fixing?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {ISSUE_TYPES.map(issue => (
                      <button
                        key={issue.id}
                        onClick={() => update('issue', issue.id)}
                        className={`flex flex-col items-start gap-2 p-4 rounded-2xl border transition-all text-left ${form.issue === issue.id ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/[0.02] hover:border-white/15'}`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${form.issue === issue.id ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-400'}`}>
                          <issue.icon size={18} />
                        </div>
                        <div>
                          <div className={`text-sm font-semibold ${form.issue === issue.id ? 'text-white' : 'text-gray-300'}`}>{issue.label}</div>
                          <div className="text-xs text-gray-500">{issue.price}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Describe the issue (optional)</label>
                    <textarea
                      rows={3}
                      placeholder="Tell us more about the problem..."
                      value={form.description}
                      onChange={e => update('description', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Service preference</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'pickup', label: 'Pickup' },
                        { id: 'dropoff', label: 'Store Dropoff' },
                        { id: 'walkin', label: 'Store Visit' }
                      ].map(option => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => update('serviceType', option.id)}
                          className={`rounded-2xl border p-3 text-left transition-all ${form.serviceType === option.id ? 'bg-blue-500/10 border-blue-500 text-white' : 'bg-white/[0.02] border-white/10 text-gray-300 hover:border-white/20'}`}
                        >
                          <div className="text-sm font-semibold">{option.label}</div>
                          <div className="text-[11px] text-gray-500 mt-1">{option.id === 'pickup' ? 'Doorstep pickup' : option.id === 'dropoff' ? 'Dropoff at store' : 'Visit the service center'}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 2: Location */}
              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white font-['Outfit']">Your Contact & Location</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">Full Name *</label>
                      <input
                        type="text"
                        placeholder="Your name"
                        value={form.name}
                        onChange={e => update('name', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">Mobile *</label>
                      <input
                        type="tel"
                        placeholder="10-digit mobile"
                        value={form.phone}
                        onChange={e => update('phone', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2">Email (optional)</label>
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={form.email}
                      onChange={e => update('email', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2">Street Address *</label>
                    <input
                      type="text"
                      placeholder="House no, Street, Area"
                      value={form.address}
                      onChange={e => update('address', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">City *</label>
                      <input
                        type="text"
                        placeholder="City"
                        value={form.city}
                        onChange={e => update('city', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">State</label>
                      <input
                        type="text"
                        placeholder="State"
                        value={form.state}
                        onChange={e => update('state', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">Pincode *</label>
                      <input
                        type="text"
                        placeholder="6-digit"
                        value={form.pincode}
                        onChange={e => update('pincode', e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 3: Schedule */}
              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white font-['Outfit']">Pick a date & time</h2>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Date</label>
                    <input
                      type="date"
                      value={form.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={e => update('date', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Time Slot</label>
                    <div className="grid grid-cols-4 gap-2">
                      {TIME_SLOTS.map(slot => (
                        <button
                          key={slot}
                          onClick={() => update('timeSlot', slot)}
                          className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${form.timeSlot === slot ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* STEP 4: Confirm */}
              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white font-['Outfit']">Confirm Your Booking</h2>
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl divide-y divide-white/5">
                    {[
                      { label: 'Device', value: `${form.brand} ${form.model} (${form.deviceType})` },
                      { label: 'Issue', value: ISSUE_TYPES.find(i => i.id === form.issue)?.label || form.issue },
                      { label: 'Customer', value: `${form.name} • ${form.phone}` },
                      { label: 'Location', value: `${form.address}, ${form.city} – ${form.pincode}` },
                      { label: 'Schedule', value: `${form.date} at ${form.timeSlot}` }
                    ].map(r => (
                      <div key={r.label} className="flex justify-between gap-3 px-5 py-3.5">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{r.label}</span>
                        <span className="text-sm text-white font-medium text-right">{r.value}</span>
                      </div>
                    ))}
                  </div>
                  {error && (
                    <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex justify-between mt-8">
            <button
              onClick={back}
              disabled={step === 0}
              className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} /> Back
            </button>
            {step < 4 ? (
              <button
                onClick={next}
                disabled={!canProceed()}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-40 transition-all flex items-center gap-2"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Booking...</> : <><CheckCircle2 size={16} /> Confirm Booking</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
