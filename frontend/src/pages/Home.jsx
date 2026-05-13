import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Smartphone, Shield, Clock, Star, ChevronRight, Zap,
  CheckCircle2, Phone, Mail, MapPin, ArrowRight, Wrench, Battery, Cpu, Monitor
} from 'lucide-react';

const FEATURES = [
  {
    icon: Zap,
    title: 'Express Repair',
    desc: 'Most repairs completed within 60–90 minutes at your doorstep.',
    color: 'text-amber-400',
    bg: 'bg-amber-400/10'
  },
  {
    icon: Shield,
    title: 'Warranty Backed',
    desc: '6-month warranty on all parts and labour. No hidden charges.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10'
  },
  {
    icon: Star,
    title: 'Certified Experts',
    desc: 'ISO-trained technicians with 5+ years of experience.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10'
  },
  {
    icon: Clock,
    title: 'Real-Time Tracking',
    desc: 'Track your repair status live with instant SMS & email alerts.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10'
  }
];

const SERVICES = [
  { icon: Smartphone, label: 'Screen Repair' },
  { icon: Battery, label: 'Battery Replacement' },
  { icon: Cpu, label: 'Motherboard Fix' },
  { icon: Monitor, label: 'Back Glass' },
  { icon: Wrench, label: 'Water Damage' },
  { icon: Phone, label: 'Camera Repair' }
];

const STATS = [
  { value: '50K+', label: 'Devices Fixed' },
  { value: '4.9★', label: 'Avg Rating' },
  { value: '200+', label: 'Service Cities' },
  { value: '99%', label: 'Success Rate' }
];

const TESTIMONIALS = [
  { name: 'Ananya Sharma', role: 'Customer, Delhi', rating: 5, text: 'Screen replaced in under an hour! The technician was professional and the pricing was transparent. Highly recommend.' },
  { name: 'Ravi Mehta', role: 'Customer, Mumbai', rating: 5, text: 'Amazing experience. Got battery replaced at home, zero hassle. Will use again.' },
  { name: 'Priya Nair', role: 'Customer, Bangalore', rating: 5, text: 'Real-time tracking is a game changer. I knew exactly when my phone was ready. 5 stars!' }
];

export const Home = () => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div className="min-h-screen bg-[#080c14] text-white font-['Inter']">
      {/* ── NAVBAR ── */}
      <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#080c14]/90 backdrop-blur-xl border-b border-white/5 shadow-lg' : ''}`}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-sm font-bold shadow-[0_0_20px_rgba(59,130,246,0.4)]">⚡</div>
            <span className="text-lg font-bold font-['Outfit']">Repair<span className="text-blue-400">Vafe</span></span>
          </Link>
          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-400">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <a href="#testimonials" className="hover:text-white transition-colors">Reviews</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/customer-login" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors hidden sm:block">Login</Link>
            <Link
              to="/book"
              className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold px-5 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:-translate-y-0.5 transition-all duration-200"
            >
              Book Now
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
        {/* Background glow orbs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-4xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-semibold text-blue-400 uppercase tracking-widest mb-8"
          >
            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
            India's #1 On-Demand Device Repair
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-black font-['Outfit'] leading-tight mb-6"
          >
            Your Device,{' '}
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Repaired Right.
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Premium device repair at your doorstep. Transparent pricing, certified technicians, real-time tracking — no surprises.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Link
              to="/book"
              className="group bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-8 py-4 rounded-full text-base hover:shadow-[0_0_40px_rgba(59,130,246,0.5)] hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2"
            >
              Book a Repair <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link
              to="/customer-login"
              className="bg-white/5 border border-white/10 text-white font-bold px-8 py-4 rounded-full text-base hover:bg-white/10 hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2"
            >
              Track My Order
            </Link>
          </motion.div>

          {/* Stats Row */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-2xl mx-auto"
          >
            {STATS.map((s, i) => (
              <div key={s.label} className="text-center">
                <div className="text-2xl md:text-3xl font-black font-['Outfit'] text-white">{s.value}</div>
                <div className="text-xs text-gray-500 mt-1 font-medium">{s.label}</div>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Why RepairVafe</div>
            <h2 className="text-4xl md:text-5xl font-black font-['Outfit'] mb-4">Built for Your <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Convenience</span></h2>
            <p className="text-gray-400 max-w-xl mx-auto">Every feature designed to make device repair as seamless as possible.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#0d1422] border border-white/5 rounded-2xl p-6 hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className={`w-12 h-12 ${f.bg} rounded-xl flex items-center justify-center ${f.color} mb-4 group-hover:scale-110 transition-transform`}>
                  <f.icon size={24} />
                </div>
                <h3 className="font-bold text-white text-lg mb-2 font-['Outfit']">{f.title}</h3>
                <p className="text-gray-400 text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES ── */}
      <section id="services" className="py-24 px-6 bg-[#0d1422]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 rounded-full text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">Our Services</div>
            <h2 className="text-4xl md:text-5xl font-black font-['Outfit'] mb-4">Everything Your Device <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Needs</span></h2>
            <p className="text-gray-400 max-w-xl mx-auto">From cracked screens to water damage, we handle it all.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {SERVICES.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="flex flex-col items-center gap-3 bg-[#111927] border border-white/5 rounded-2xl p-6 hover:bg-[#141d2e] hover:border-blue-500/30 hover:-translate-y-1 transition-all duration-300 cursor-pointer group"
              >
                <div className="w-12 h-12 bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-400 group-hover:bg-blue-500/20 transition-colors">
                  <s.icon size={24} />
                </div>
                <span className="text-sm font-semibold text-center text-gray-300">{s.label}</span>
              </motion.div>
            ))}
          </div>
          <div className="text-center mt-10">
            <Link
              to="/book"
              className="inline-flex items-center gap-2 text-blue-400 font-semibold hover:gap-4 transition-all text-sm"
            >
              Book any service <ChevronRight size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-emerald-500/10 border border-emerald-500/20 px-4 py-1.5 rounded-full text-xs font-bold text-emerald-400 uppercase tracking-widest mb-4">How It Works</div>
            <h2 className="text-4xl md:text-5xl font-black font-['Outfit'] mb-4">Repair in <span className="bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">3 Simple Steps</span></h2>
          </div>
          <div className="relative">
            <div className="hidden md:block absolute top-8 left-[16.66%] right-[16.66%] h-0.5 bg-gradient-to-r from-blue-500/20 via-blue-500/40 to-blue-500/20" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
              {[
                { step: '01', title: 'Book Online', desc: 'Select your device, issue, and convenient time slot.' },
                { step: '02', title: 'Expert Visits', desc: 'A certified technician arrives at your location on time.' },
                { step: '03', title: 'Device Fixed', desc: 'Repair done on-site with warranty. Pay after satisfaction.' }
              ].map((s, i) => (
                <motion.div
                  key={s.step}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className="relative text-center"
                >
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center font-black text-xl font-['Outfit'] mx-auto mb-4 shadow-[0_0_30px_rgba(59,130,246,0.3)]">
                    {s.step}
                  </div>
                  <h3 className="font-bold text-white text-xl font-['Outfit'] mb-2">{s.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="testimonials" className="py-24 px-6 bg-[#0d1422]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block bg-amber-500/10 border border-amber-500/20 px-4 py-1.5 rounded-full text-xs font-bold text-amber-400 uppercase tracking-widest mb-4">Reviews</div>
            <h2 className="text-4xl md:text-5xl font-black font-['Outfit'] mb-4">Loved by <span className="bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent">Thousands</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#111927] border border-white/5 rounded-2xl p-6 hover:border-amber-500/20 transition-colors"
              >
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-gray-300 text-sm leading-relaxed mb-6">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-600 to-purple-600 flex items-center justify-center font-bold text-sm">
                    {t.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">{t.name}</div>
                    <div className="text-xs text-gray-500">{t.role}</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative bg-gradient-to-br from-blue-600/20 to-cyan-500/10 border border-blue-500/20 rounded-3xl p-12 text-center overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-blue-600/5 to-transparent" />
            <div className="relative z-10">
              <h2 className="text-3xl md:text-4xl font-black font-['Outfit'] mb-4">
                Ready to Fix Your Device?
              </h2>
              <p className="text-gray-400 mb-8 max-w-lg mx-auto">Book in under 2 minutes. Expert at your door in 60 minutes.</p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/book"
                  className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-8 py-4 rounded-full hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:-translate-y-1 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Book Now <ArrowRight size={18} />
                </Link>
                <Link
                  to="/customer-login"
                  className="bg-white/5 border border-white/10 text-white font-bold px-8 py-4 rounded-full hover:bg-white/10 transition-all duration-200 flex items-center justify-center gap-2"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="border-t border-white/5 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-xs font-bold">⚡</div>
            <span className="font-bold font-['Outfit']">Repair<span className="text-blue-400">Vafe</span></span>
          </div>
          <div className="flex gap-6 text-sm text-gray-500">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#services" className="hover:text-white transition-colors">Services</a>
            <Link to="/customer-login" className="hover:text-white transition-colors">Login</Link>
          </div>
          <p className="text-xs text-gray-600">© 2026 RepairVafe Systems. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
