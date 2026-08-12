import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Mail, Phone, MapPin, Send, Briefcase, Wrench, Zap, CheckCircle2, AlertCircle, RefreshCw,
  MessageCircle, Star, Globe
} from 'lucide-react';
import { getApiBaseUrl } from '../utils/apiBase';
import { Seo } from '../components/Seo';
import { buildBreadcrumbSchema, buildLocalBusinessSchema, OFFICE_ADDRESS_LABEL } from '../utils/seo';

const TABS = [
  { id: 'contact', label: 'General Info', icon: Mail },
  { id: 'sales', label: 'Sales & Corporate', icon: Briefcase },
  { id: 'support', label: 'Support Ticket', icon: Wrench },
  { id: 'promotional', label: 'Offers & Newsletter', icon: Zap }
];

export const ContactUs = () => {
  const officeAddress = OFFICE_ADDRESS_LABEL;

  const [activeTab, setActiveTab] = useState('contact');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState('');

  const [links, setLinks] = useState({
    whatsapp: 'https://wa.me/message/N6IZQBNEIYG7O1',
    trustpilot: 'https://www.trustpilot.com/review/erepaircafe.com',
    google: 'https://www.google.com/search?kgmid=%2Fg%2F11hz37hgnj&hl=en-IN&q=eRepairCafe%20-%20Mobile%20Repair%20%26%20Phone%20Screen%20Repair%20Specialized&shem=epsd1%2Cltac%2Crimspwouoe&shndl=30&source=sh%2Fx%2Floc%2Fosrp%2Fm1%2F2&kgs=0832192f0912660b'
  });

  useEffect(() => {
    const fetchLinks = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/settings/public`);
        const result = await res.json();
        if (result.success && result.data) {
          setLinks({
            whatsapp: result.data.whatsappLink || 'https://wa.me/message/N6IZQBNEIYG7O1',
            trustpilot: result.data.trustpilotLink || 'https://www.trustpilot.com/review/erepaircafe.com',
            google: result.data.googleSearchLink || 'https://www.google.com/search?kgmid=%2Fg%2F11hz37hgnj&hl=en-IN&q=eRepairCafe%20-%20Mobile%20Repair%20%26%20Phone%20Screen%20Repair%20Specialized&shem=epsd1%2Cltac%2Crimspwouoe&shndl=30&source=sh%2Fx%2Floc%2Fosrp%2Fm1%2F2&kgs=0832192f0912660b'
          });
        }
      } catch (err) {
        console.error('Failed to load social links in contact page', err);
      }
    };
    fetchLinks();
  }, []);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: '',
    company: '',
    requirementDetails: '',
    orderReference: '',
    issueType: 'tracking',
    description: '',
    interest: 'seasonal_offers',
    _honey: ''
  });

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Build payload matching backend validation requirements
    const payload = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      type: activeTab,
      _honey: formData._honey
    };

    if (activeTab === 'contact') {
      payload.message = formData.message;
    } else if (activeTab === 'sales') {
      payload.company = formData.company;
      payload.requirementDetails = formData.requirementDetails;
    } else if (activeTab === 'support') {
      payload.orderReference = formData.orderReference;
      payload.issueType = formData.issueType;
      payload.description = formData.description;
    } else if (activeTab === 'promotional') {
      payload.interest = formData.interest;
      payload.campaignSource = 'web_contact_page';
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/enquiries`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setSuccess(true);
        setSuccessMsg(data.message || 'Thank you! Your enquiry has been received.');
        // Reset specific fields
        setFormData(prev => ({
          ...prev,
          name: '',
          email: '',
          phone: '',
          message: '',
          company: '',
          requirementDetails: '',
          orderReference: '',
          description: ''
        }));
      } else {
        setError(data.message || 'Failed to submit enquiry. Please check the inputs.');
      }
    } catch (err) {
      setError('Connection failed. Please check if backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-20 px-6 max-w-6xl mx-auto font-['Outfit']">
      <Seo
        title="Contact erepaircafe"
        description="Contact erepaircafe for repair support, sales enquiries and doorstep device repair assistance in Bengaluru. Find our location, map and WhatsApp support."
        path="/contact"
        keywords="contact erepaircafe, mobile repair Bengaluru contact, device repair support, WhatsApp repair support"
        structuredData={[
          buildLocalBusinessSchema('/contact'),
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'Contact', path: '/contact' }
          ])
        ]}
      />
      {/* Page Header */}
      <div className="text-center mb-16">
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block bg-cyan-500/10 border border-cyan-500/20 px-4 py-1.5 rounded-full text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4"
        >
          Contact & Support
        </motion.div>
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-black mb-6"
        >
          We're Here to <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Help You</span>
        </motion.h1>
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed font-['Inter']"
        >
          Select the enquiry type below, fill in your details, and our certified tech experts will respond shortly.
        </motion.p>
      </div>

      <div className="grid lg:grid-cols-12 gap-12 items-start">
        {/* Left Column - Contact Form Workspace */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="lg:col-span-7 lg:sticky lg:top-24 self-start bg-[#111927] p-8 rounded-3xl border border-white/5 relative overflow-hidden shadow-2xl"
        >
          {/* Glassmorphic Background Blur */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />
          
          {/* Tabs Menu */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/10 mb-8">
            {TABS.map(tab => {
              const Icon = tab.icon;
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id);
                    setError(null);
                    setSuccess(false);
                  }}
                  className={`relative flex flex-col sm:flex-row items-center justify-center gap-1.5 py-2.5 px-2 rounded-xl text-[10px] sm:text-xs font-bold transition-all cursor-pointer ${
                    isSelected ? 'text-white' : 'text-gray-400 hover:text-white'
                  }`}
                >
                  {isSelected && (
                    <motion.div
                      layoutId="activeTabGlow"
                      className="absolute inset-0 bg-gradient-to-r from-cyan-600/30 to-blue-500/30 border border-cyan-500/30 rounded-xl"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <Icon size={14} className={isSelected ? 'text-cyan-400' : ''} />
                  <span className="text-center sm:text-left">{tab.label}</span>
                </button>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {success ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-12"
              >
                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-6">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">Enquiry Submitted!</h3>
                <p className="text-gray-400 max-w-sm mx-auto mb-8 font-['Inter']">
                  {successMsg}
                </p>
                <button 
                  onClick={() => setSuccess(false)}
                  className="bg-white/5 border border-white/10 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-all cursor-pointer"
                >
                  Submit Another Ticket
                </button>
              </motion.div>
            ) : (
              <motion.form 
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                onSubmit={handleSubmit}
                className="space-y-6 relative z-10"
              >
                {/* Honeypot field - visually hidden but accessible to bots */}
                <input 
                  type="text" 
                  name="_honey" 
                  value={formData._honey} 
                  onChange={handleChange} 
                  style={{ display: 'none' }} 
                  tabIndex="-1" 
                  autoComplete="off" 
                />

                {error && (
                  <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm font-semibold flex items-center gap-3">
                    <AlertCircle size={18} className="shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* Common Fields */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Full Name *</label>
                    <input 
                      required 
                      type="text" 
                      name="name" 
                      value={formData.name} 
                      onChange={handleChange} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm" 
                      placeholder="Your Name" 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Email Address *</label>
                    <input 
                      required 
                      type="email" 
                      name="email" 
                      value={formData.email} 
                      onChange={handleChange} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm" 
                      placeholder="name@example.com" 
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Mobile Number *</label>
                  <input 
                    required 
                    type="tel" 
                    name="phone" 
                    value={formData.phone} 
                    onChange={handleChange} 
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm" 
                    placeholder="+91 98765 43210" 
                  />
                </div>

                {/* Tab Specific Fields */}
                {activeTab === 'contact' && (
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Your Message *</label>
                    <textarea 
                      required 
                      rows={5} 
                      name="message" 
                      value={formData.message} 
                      onChange={handleChange} 
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm leading-relaxed" 
                      placeholder="How can we help you today?" 
                    />
                  </div>
                )}

                {activeTab === 'sales' && (
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Company / Business Name</label>
                      <input 
                        type="text" 
                        name="company" 
                        value={formData.company} 
                        onChange={handleChange} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm" 
                        placeholder="Corporate entity name" 
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Requirement Details *</label>
                      <textarea 
                        required 
                        rows={4} 
                        name="requirementDetails" 
                        value={formData.requirementDetails} 
                        onChange={handleChange} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm leading-relaxed" 
                        placeholder="Describe bulk repairs, fleet requirements, or corporate tie-ups..." 
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'support' && (
                  <div className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Order Reference (Optional)</label>
                        <input 
                          type="text" 
                          name="orderReference" 
                          value={formData.orderReference} 
                          onChange={handleChange} 
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm" 
                          placeholder="e.g. RV-12345" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Issue Type *</label>
                        <select 
                          name="issueType" 
                          value={formData.issueType} 
                          onChange={handleChange} 
                          className="w-full bg-[#1c2433] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                        >
                          <option value="tracking">Order Tracking</option>
                          <option value="quotation">Quotation Issue</option>
                          <option value="repair_quality">Repair Quality</option>
                          <option value="payment">Payment Issue</option>
                          <option value="other">Other Technical Issue</option>
                        </select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">Describe Support Query *</label>
                      <textarea 
                        required 
                        rows={4} 
                        name="description" 
                        value={formData.description} 
                        onChange={handleChange} 
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm leading-relaxed" 
                        placeholder="Please describe your support concern in detail..." 
                      />
                    </div>
                  </div>
                )}

                {activeTab === 'promotional' && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-wider">I am interested in... *</label>
                      <select 
                        name="interest" 
                        value={formData.interest} 
                        onChange={handleChange} 
                        className="w-full bg-[#1c2433] border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors text-sm"
                      >
                        <option value="seasonal_offers">Seasonal Offers & Coupons</option>
                        <option value="partner_program">Partner Programs</option>
                        <option value="newsletter">Weekly Tech Newsletter</option>
                      </select>
                    </div>
                    <p className="text-xs text-gray-500 leading-relaxed font-['Inter']">
                      By submitting this, you consent to receive regular promotional alerts, tech updates, and newsletters. You can opt-out at any time.
                    </p>
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={loading}
                  className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_0_25px_rgba(6,182,212,0.4)] transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <span>Submitting...</span>
                      <RefreshCw size={18} className="animate-spin" />
                    </>
                  ) : (
                    <>
                      <span>Send Enquiry</span>
                      <Send size={18} />
                    </>
                  )}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Column - Info Cards */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="lg:col-span-5 space-y-8"
        >
          {/* Card 1 */}
          <div className="flex gap-5 p-6 bg-[#111927] border border-white/5 rounded-2xl hover:border-cyan-500/20 transition-all duration-300">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0 text-blue-400">
              <Phone size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Call Support</h3>
              <p className="text-gray-400 text-xs mb-3 font-['Inter']">Speak with an agent. Mon-Sat, 9AM to 8PM.</p>
              <a href="tel:9148136086" className="text-blue-400 font-bold hover:underline text-sm">9148136086</a>
            </div>
          </div>
          
          {/* Card 2 */}
          <div className="flex gap-5 p-6 bg-[#111927] border border-white/5 rounded-2xl hover:border-cyan-500/20 transition-all duration-300">
            <div className="w-12 h-12 bg-cyan-500/10 border border-cyan-500/20 rounded-xl flex items-center justify-center shrink-0 text-cyan-400">
              <Mail size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Email Helpline</h3>
              <p className="text-gray-400 text-xs mb-3 font-['Inter']">Drop a line anytime. We respond within 2 hours.</p>
              <a href="mailto:support@erepaircafe.com" className="text-cyan-400 font-bold hover:underline text-sm">support@erepaircafe.com</a>
            </div>
          </div>

          {/* Card 3 */}
          <div className="flex gap-5 p-6 bg-[#111927] border border-white/5 rounded-2xl hover:border-cyan-500/20 transition-all duration-300">
            <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center shrink-0 text-purple-400">
              <MapPin size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Headquarters</h3>
              <p className="text-gray-400 text-xs font-['Inter'] leading-relaxed">
                {officeAddress}
              </p>
            </div>
          </div>

          <div className="overflow-hidden bg-[#111927] border border-white/5 rounded-2xl hover:border-cyan-500/20 transition-all duration-300">
            <div className="px-6 pt-6 pb-4">
              <h3 className="text-lg font-bold text-white mb-1">Find Us on the Map</h3>
              <p className="text-gray-400 text-xs font-['Inter'] leading-relaxed">
                {officeAddress}
              </p>
            </div>
            <div className="px-6 pb-6">
              <div className="overflow-hidden rounded-2xl border border-white/10">
                <iframe
                  src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3887.293334650288!2d77.5915957!3d13.0169829!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3bae17cb6cffa2bf%3A0x65465a8953721e26!2seRepairCafe%20-%20Mobile%20Repair%20%26%20Phone%20Screen%20Repair%20Specialized!5e0!3m2!1sen!2sin!4v1781972300240!5m2!1sen!2sin"
                  title="eRepairCafe Bengaluru location"
                  className="h-72 w-full"
                  style={{ border: 0 }}
                  allowFullScreen
                  loading="lazy"
                  referrerPolicy="no-referrer-when-downgrade"
                />
              </div>
            </div>
          </div>

          {/* Card 4 - WhatsApp */}
          <div className="flex gap-5 p-6 bg-[#111927] border border-white/5 rounded-2xl hover:border-emerald-500/20 transition-all duration-300 group">
            <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center shrink-0 text-emerald-400">
              <MessageCircle size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">WhatsApp Chat</h3>
              <p className="text-gray-400 text-xs mb-3 font-['Inter']">Instant response. Chat with our support agents right now.</p>
              <a href={links.whatsapp} target="_blank" rel="noopener noreferrer" className="text-emerald-400 font-bold hover:underline text-sm flex items-center gap-1">
                Chat on WhatsApp →
              </a>
            </div>
          </div>

          {/* Card 5 - Trustpilot */}
          <div className="flex gap-5 p-6 bg-[#111927] border border-white/5 rounded-2xl hover:border-amber-500/20 transition-all duration-300 group">
            <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center shrink-0 text-amber-400">
              <Star size={22} className="fill-amber-400/20" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Trustpilot Reviews</h3>
              <p className="text-gray-400 text-xs mb-3 font-['Inter']">See what our customers say about our quick repair service.</p>
              <a href={links.trustpilot} target="_blank" rel="noopener noreferrer" className="text-amber-400 font-bold hover:underline text-sm flex items-center gap-1">
                Read Trustpilot Reviews →
              </a>
            </div>
          </div>

          {/* Card 6 - Google Profile */}
          <div className="flex gap-5 p-6 bg-[#111927] border border-white/5 rounded-2xl hover:border-blue-500/20 transition-all duration-300 group">
            <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center shrink-0 text-blue-400">
              <Globe size={22} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-1">Google Listing</h3>
              <p className="text-gray-400 text-xs mb-3 font-['Inter']">Find our office location at {officeAddress}, check operating hours, and verify reviews on Google.</p>
              <a href={links.google} target="_blank" rel="noopener noreferrer" className="text-blue-400 font-bold hover:underline text-sm flex items-center gap-1">
                View on Google →
              </a>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

