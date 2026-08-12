import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Users, Shield, Target, Award, Clock, Heart, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Seo } from '../components/Seo';
import { buildBreadcrumbSchema, buildLocalBusinessSchema } from '../utils/seo';

const VALUES = [
  {
    icon: Shield,
    title: 'Absolute Privacy',
    desc: 'All repairs are conducted in front of you. Your data privacy is our top priority.',
    color: 'text-blue-400',
    bg: 'bg-blue-400/10'
  },
  {
    icon: Award,
    title: 'Genuine Components',
    desc: 'We use 100% certified, premium quality parts backed by a comprehensive warranty.',
    color: 'text-purple-400',
    bg: 'bg-purple-400/10'
  },
  {
    icon: Clock,
    title: 'Express Delivery',
    desc: 'Most screen and battery replacements are completed in under 90 minutes.',
    color: 'text-emerald-400',
    bg: 'bg-emerald-400/10'
  },
  {
    icon: Heart,
    title: 'Customer First',
    desc: 'No diagnostic fee, no hidden costs. Pay only after you are completely satisfied.',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10'
  }
];

export const AboutUs = () => {
  return (
    <div className="py-20 px-6 max-w-6xl mx-auto font-['Outfit']">
      <Seo
        title="About erepaircafe"
        description="Learn how erepaircafe delivers doorstep device repair in Bengaluru with certified technicians, transparent pricing, genuine parts and a warranty-backed process."
        path="/about"
        keywords="about erepaircafe, device repair company Bengaluru, doorstep mobile repair company"
        structuredData={[
          buildLocalBusinessSchema('/about'),
          buildBreadcrumbSchema([
            { name: 'Home', path: '/' },
            { name: 'About', path: '/about' }
          ])
        ]}
      />
      
      {/* Hero Header Section */}
      <div className="text-center mb-20 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />
        
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="inline-block bg-blue-500/10 border border-blue-500/20 px-4 py-1.5 rounded-full text-xs font-bold text-blue-400 uppercase tracking-widest mb-4"
        >
          Company Information
        </motion.div>
        
        <motion.h1 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-4xl md:text-5xl font-black mb-6 leading-tight"
        >
          Redefining the Device <br />
          <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Repair Experience</span>
        </motion.h1>
        
        <motion.p 
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-gray-400 max-w-2xl mx-auto text-lg leading-relaxed font-['Inter']"
        >
          At erepaircafe, we believe that a damaged device shouldn't disrupt your daily routine. We bring certified tech expertise and genuine parts straight to your doorstep.
        </motion.p>
      </div>

      {/* Main Info Section (Split Grid) */}
      <div className="grid md:grid-cols-2 gap-12 items-center mb-28">
        {/* Left Side Content */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-6"
        >
          <h2 className="text-3xl font-bold text-white leading-tight">Our Mission & Vision</h2>
          <p className="text-gray-400 leading-relaxed font-['Inter']">
            Founded with a commitment to transparency and premium quality, erepaircafe connects you with highly-trained, certified technicians who resolve issues for smartphones, tablets, and laptops right in front of your eyes.
          </p>
          <p className="text-gray-400 leading-relaxed font-['Inter']">
            No more waiting in lines for days, no more concerns about private data, and absolutely no hidden diagnostic costs. We stand for speed, safety, and reliability.
          </p>
          
          <ul className="space-y-3.5 pt-2">
            {[
              'ISO Certified Service Protocols',
              'Doorstep Repairs in Under 90 Minutes',
              '6-Month Hassle-free Replacement Warranty',
              '100% Secure & Screened Field Engineers'
            ].map((item, i) => (
              <li key={i} className="flex items-center gap-3 text-gray-300 font-semibold text-sm">
                <CheckCircle2 size={18} className="text-emerald-400 shrink-0" />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        {/* Right Side Stats Panel */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/5 rounded-3xl p-8 relative overflow-hidden shadow-2xl h-full flex flex-col justify-center"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />
          
          <div className="grid grid-cols-2 gap-6 relative z-10">
            <div className="bg-[#111927] p-6 rounded-2xl border border-white/5 text-center hover:border-blue-500/20 transition-all duration-300 group">
              <Users size={32} className="text-blue-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-3xl font-black text-white">50K+</div>
              <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">Happy Users</div>
            </div>
            
            <div className="bg-[#111927] p-6 rounded-2xl border border-white/5 text-center hover:border-emerald-500/20 transition-all duration-300 group">
              <Shield size={32} className="text-emerald-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-3xl font-black text-white">99%</div>
              <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">Success Rate</div>
            </div>
            
            <div className="bg-[#111927] p-6 rounded-2xl border border-white/5 text-center col-span-2 hover:border-purple-500/20 transition-all duration-300 group">
              <Target size={32} className="text-purple-400 mx-auto mb-3 group-hover:scale-110 transition-transform" />
              <div className="text-3xl font-black text-white">200+</div>
              <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider font-bold">Cities Covered Across India</div>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Core Values Section */}
      <div className="mb-24">
        <div className="text-center mb-16">
          <div className="inline-block bg-purple-500/10 border border-purple-500/20 px-4 py-1.5 rounded-full text-xs font-bold text-purple-400 uppercase tracking-widest mb-4">
            Our Core Values
          </div>
          <h2 className="text-3xl md:text-4xl font-black mb-4">What Sets Us Apart</h2>
          <p className="text-gray-400 max-w-xl mx-auto font-['Inter']">
            Our commitment to quality, trust, and transparency guides everything we do.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {VALUES.map((v, i) => {
            const Icon = v.icon;
            return (
              <motion.div
                key={v.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#111927] border border-white/5 rounded-2xl p-6 hover:border-blue-500/20 hover:-translate-y-1.5 transition-all duration-300 group flex flex-col justify-between"
              >
                <div>
                  <div className={`w-12 h-12 ${v.bg} rounded-xl flex items-center justify-center ${v.color} mb-5 group-hover:scale-110 transition-transform`}>
                    <Icon size={22} />
                  </div>
                  <h3 className="font-bold text-white text-lg mb-2">{v.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed font-['Inter']">{v.desc}</p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Call to Action Banner */}
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        className="bg-gradient-to-br from-blue-600/35 to-cyan-500/15 border border-blue-500/20 rounded-3xl p-10 md:p-14 text-center relative overflow-hidden shadow-xl"
      >
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-tr from-blue-600/10 to-transparent pointer-events-none" />
        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl md:text-4xl font-black text-white">Need a Device Repaired?</h2>
          <p className="text-gray-300 max-w-xl mx-auto leading-relaxed font-['Inter']">
            Book an appointment online in under 2 minutes and have a technician arrive at your doorstep in less than 60 minutes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
            <Link
              to="/book"
              className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-8 py-3.5 rounded-full hover:shadow-[0_0_30px_rgba(59,130,246,0.5)] hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              Book Now
            </Link>
            <Link
              to="/contact"
              className="bg-white/5 border border-white/10 text-white font-bold px-8 py-3.5 rounded-full hover:bg-white/10 hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 text-sm cursor-pointer"
            >
              Get in Touch <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </motion.div>

    </div>
  );
};

