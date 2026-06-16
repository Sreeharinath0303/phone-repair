import React from 'react';
import { motion } from 'framer-motion';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export const ContactUs = () => {
  return (
    <div className="py-20 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <div className="inline-block bg-cyan-500/10 border border-cyan-500/20 px-4 py-1.5 rounded-full text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4">Contact Us</div>
        <h1 className="text-4xl md:text-5xl font-black font-['Outfit'] mb-6">
          We're Here to <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">Help</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          Have a question about a repair, or need assistance? Reach out to us and our support team will get back to you shortly.
        </p>
      </div>

      <div className="grid lg:grid-cols-2 gap-12">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="bg-[#111927] p-8 rounded-3xl border border-white/5"
        >
          <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium">First Name</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="John" />
              </div>
              <div className="space-y-2">
                <label className="text-sm text-gray-400 font-medium">Last Name</label>
                <input type="text" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="Doe" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-medium">Email Address</label>
              <input type="email" className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="john@example.com" />
            </div>
            <div className="space-y-2">
              <label className="text-sm text-gray-400 font-medium">Message</label>
              <textarea rows={5} className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500 transition-colors" placeholder="How can we help you?"></textarea>
            </div>
            <button className="w-full bg-gradient-to-r from-cyan-500 to-blue-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all">
              Send Message <Send size={18} />
            </button>
          </form>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="space-y-8"
        >
          <div className="flex gap-6 items-start">
            <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center shrink-0">
              <Phone size={24} className="text-blue-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">Call Us</h3>
              <p className="text-gray-400 mb-1">We're available Mon-Sat, 9AM to 8PM.</p>
              <a href="tel:18001234567" className="text-blue-400 font-semibold text-lg">1800-123-4567</a>
            </div>
          </div>
          
          <div className="flex gap-6 items-start">
            <div className="w-14 h-14 bg-cyan-500/10 rounded-2xl flex items-center justify-center shrink-0">
              <Mail size={24} className="text-cyan-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">Email Us</h3>
              <p className="text-gray-400 mb-1">Drop us a line anytime. We usually reply within 2 hours.</p>
              <a href="mailto:support@repairvafe.com" className="text-cyan-400 font-semibold text-lg">support@repairvafe.com</a>
            </div>
          </div>

          <div className="flex gap-6 items-start">
            <div className="w-14 h-14 bg-purple-500/10 rounded-2xl flex items-center justify-center shrink-0">
              <MapPin size={24} className="text-purple-400" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white mb-2 font-['Outfit']">Headquarters</h3>
              <p className="text-gray-400 leading-relaxed">
                123 Innovation Drive, Tech Park<br />
                Bangalore, Karnataka 560001<br />
                India
              </p>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
