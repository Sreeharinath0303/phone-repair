import React from 'react';
import { motion } from 'framer-motion';
import { Smartphone, Battery, Cpu, Monitor, Wrench, Phone, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const ALL_SERVICES = [
  { icon: Smartphone, title: 'Screen Replacement', desc: 'Got a cracked screen? We provide original OLED/LCD replacements with True Tone retention.', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { icon: Battery, title: 'Battery Replacement', desc: 'Draining too fast? Get a fresh battery with 100% health and optimal performance.', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { icon: Cpu, title: 'Motherboard Repair', desc: 'Complex chip-level repairs handled by our senior technicians with specialized tools.', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { icon: Monitor, title: 'Back Glass Repair', desc: 'Shattered back glass? We use laser machines for precise removal and replacement.', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { icon: Wrench, title: 'Water Damage', desc: 'Dropped your phone in water? Our ultrasonic cleaning revives dead devices.', color: 'text-amber-400', bg: 'bg-amber-400/10' },
  { icon: Phone, title: 'Camera Repair', desc: 'Blurry photos or broken lens? We fix front and rear cameras to factory quality.', color: 'text-rose-400', bg: 'bg-rose-400/10' }
];

export const Services = () => {
  return (
    <div className="py-20 px-6 max-w-6xl mx-auto">
      <div className="text-center mb-16">
        <div className="inline-block bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 rounded-full text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">Our Services</div>
        <h1 className="text-4xl md:text-5xl font-black font-['Outfit'] mb-6">
          Premium Repairs for <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Every Need</span>
        </h1>
        <p className="text-gray-400 max-w-2xl mx-auto text-lg">
          We specialize in comprehensive device repair services. No matter the issue, our certified technicians have the expertise to fix it.
        </p>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
        {ALL_SERVICES.map((s, i) => (
          <motion.div
            key={s.title}
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#111927] border border-white/5 rounded-2xl p-8 hover:border-purple-500/30 hover:-translate-y-1 transition-all duration-300 group"
          >
            <div className={`w-14 h-14 ${s.bg} rounded-2xl flex items-center justify-center ${s.color} mb-6 group-hover:scale-110 transition-transform`}>
              <s.icon size={28} />
            </div>
            <h3 className="text-xl font-bold text-white mb-3 font-['Outfit']">{s.title}</h3>
            <p className="text-gray-400 leading-relaxed mb-6">{s.desc}</p>
            <Link to="/book" className={`inline-flex items-center gap-2 text-sm font-bold ${s.color} hover:gap-3 transition-all`}>
              Book this repair <ArrowRight size={16} />
            </Link>
          </motion.div>
        ))}
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="bg-gradient-to-br from-blue-600 to-purple-600 rounded-3xl p-10 md:p-16 text-center shadow-[0_0_40px_rgba(59,130,246,0.2)]"
      >
        <h2 className="text-3xl md:text-4xl font-black font-['Outfit'] text-white mb-4">Don't see your issue listed?</h2>
        <p className="text-blue-100 max-w-xl mx-auto mb-8 text-lg">
          We handle hundreds of different device models and issues. Contact us for a custom quote or diagnostic service.
        </p>
        <Link to="/contact" className="inline-block bg-white text-blue-600 font-bold px-8 py-4 rounded-full hover:shadow-xl hover:-translate-y-1 transition-all duration-200">
          Get a Custom Quote
        </Link>
      </motion.div>
    </div>
  );
};
