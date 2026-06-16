import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Users, Shield, Target } from 'lucide-react';

export const AboutUs = () => {
  return (
    <div className="py-20 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <div className="inline-block bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">About Us</div>
        <h1 className="text-4xl md:text-5xl font-black font-['Outfit'] mb-6">
          Redefining Device <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Repair</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          At RepairVafe, we believe that a broken device shouldn't mean a broken day. We bring expert repair services directly to your doorstep.
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-12 items-center mb-20">
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-3xl font-bold font-['Outfit'] text-white">Our Mission</h2>
          <p className="text-gray-400 leading-relaxed">
            Founded with the vision to make technology reliable again, RepairVafe connects you with certified technicians who can fix your smartphone, tablet, or laptop right in front of your eyes. No more waiting in lines, no more data privacy concerns, and no more hidden costs.
          </p>
          <ul className="space-y-3">
            {[
              'ISO Certified Technicians',
              '100% Genuine Parts',
              '6-Month Warranty',
              'Transparent Pricing'
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-300">
                <CheckCircle2 size={18} className="text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/5 rounded-3xl p-8 h-full flex flex-col justify-center"
        >
          <div className="grid grid-cols-2 gap-6">
            <div className="bg-[#111927] p-6 rounded-2xl border border-white/5 text-center">
              <Users size={32} className="text-blue-400 mx-auto mb-3" />
              <div className="text-2xl font-black text-white">50K+</div>
              <div className="text-xs text-gray-500 mt-1 uppercase">Customers</div>
            </div>
            <div className="bg-[#111927] p-6 rounded-2xl border border-white/5 text-center">
              <Shield size={32} className="text-emerald-400 mx-auto mb-3" />
              <div className="text-2xl font-black text-white">99%</div>
              <div className="text-xs text-gray-500 mt-1 uppercase">Success Rate</div>
            </div>
            <div className="bg-[#111927] p-6 rounded-2xl border border-white/5 text-center col-span-2">
              <Target size={32} className="text-purple-400 mx-auto mb-3" />
              <div className="text-2xl font-black text-white">200+</div>
              <div className="text-xs text-gray-500 mt-1 uppercase">Cities Covered</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
