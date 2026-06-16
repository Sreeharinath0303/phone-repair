import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Briefcase, MapPin, Wrench, Send, CheckCircle2, Phone, Mail, User, ShieldCheck } from 'lucide-react';
import { getApiBaseUrl } from '../utils/apiBase';

export const BecomePartner = () => {
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    specialization: 'Smartphone',
    serviceAreas: '',
    experienceYears: ''
  });

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${getApiBaseUrl()}/partners/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.success) {
        setSubmitted(true);
      } else {
        setError(data.message || 'Something went wrong. Please try again.');
      }
    } catch (err) {
      setError('Failed to submit application. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          
          {/* Left Column - Info */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-8"
          >
            <div>
              <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 rounded-full text-xs font-bold text-purple-400 uppercase tracking-widest mb-6">
                Join Our Network
              </div>
              <h1 className="text-4xl md:text-5xl font-black font-['Outfit'] mb-4 leading-tight">
                Become a <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Service Partner</span>
              </h1>
              <p className="text-gray-400 text-lg leading-relaxed">
                Grow your device repair business by joining India's fastest-growing on-demand repair network. Get steady leads, manage jobs easily, and earn higher payouts.
              </p>
            </div>

            <div className="space-y-6">
              {[
                { icon: ShieldCheck, title: 'Steady Income', desc: 'Get guaranteed repair jobs in your selected service areas.' },
                { icon: Briefcase, title: 'Flexible Work', desc: 'Accept jobs that fit your schedule and expertise.' },
                { icon: Wrench, title: 'We Handle Marketing', desc: 'Focus on what you do best (repairing), we handle the customers.' }
              ].map((benefit, i) => (
                <div key={i} className="flex gap-4 p-5 bg-[#111927] border border-white/5 rounded-2xl">
                  <div className="w-12 h-12 bg-purple-500/10 rounded-xl flex items-center justify-center text-purple-400 shrink-0">
                    <benefit.icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg mb-1">{benefit.title}</h3>
                    <p className="text-gray-400 text-sm">{benefit.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Right Column - Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#111927] border border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-2xl shadow-blue-900/10"
          >
            {/* Background glow */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />
            
            {submitted ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6 text-emerald-400">
                  <CheckCircle2 size={40} />
                </div>
                <h3 className="text-2xl font-black text-white mb-2 font-['Outfit']">Application Received!</h3>
                <p className="text-gray-400 max-w-sm mx-auto">
                  Thank you for applying. Our partner onboarding team will review your details and contact you within 24-48 hours.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5 relative z-10">
                <h3 className="text-xl font-bold text-white mb-6">Partner Registration Form</h3>
                
                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-semibold">
                    {error}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Full Name *</label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input required name="name" value={formData.name} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="John Doe" />
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Business Name</label>
                    <div className="relative">
                      <Briefcase size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input name="businessName" value={formData.businessName} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="(Optional)" />
                    </div>
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Email *</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input required type="email" name="email" value={formData.email} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="john@example.com" />
                    </div>
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Phone *</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input required type="tel" name="phone" value={formData.phone} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="+91 9876543210" />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Device Specialization *</label>
                    <select required name="specialization" value={formData.specialization} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors">
                      <option className="bg-[#111927]" value="Smartphone">Smartphones</option>
                      <option className="bg-[#111927]" value="Laptop">Laptops & PCs</option>
                      <option className="bg-[#111927]" value="Tablet">Tablets</option>
                      <option className="bg-[#111927]" value="Smartwatch">Smartwatches</option>
                      <option className="bg-[#111927]" value="Multi-Specialist">Multi-device Specialist</option>
                    </select>
                  </div>

                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Experience (Years) *</label>
                    <input required type="number" name="experienceYears" value={formData.experienceYears} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="e.g. 5" min="0" />
                  </div>
                  <div className="col-span-2 md:col-span-1">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">City *</label>
                    <div className="relative">
                      <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input required name="city" value={formData.city} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="e.g. New Delhi" />
                    </div>
                  </div>

                  <div className="col-span-2">
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Service Areas (Comma separated) *</label>
                    <input required name="serviceAreas" value={formData.serviceAreas} onChange={handleChange} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition-colors" placeholder="e.g. Connaught Place, Karol Bagh" />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:-translate-y-1 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                >
                  {loading ? 'Submitting...' : 'Submit Application'}
                  {!loading && <Send size={18} />}
                </button>
              </form>
            )}
          </motion.div>

        </div>
      </div>
    </div>
  );
};
