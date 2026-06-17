import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';

const XIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const LinkedInIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg className="w-5 h-5 fill-none stroke-current" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
  </svg>
);

const FacebookIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
  </svg>
);

export const PublicFooter = () => {
  const handleBackToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-[#071317] border-t border-white/5 pt-16 pb-0 text-white font-['Outfit'] overflow-hidden">
      
      {/* ── Apex Geometric Background Lines ── */}
      <div className="absolute right-0 top-0 bottom-0 w-full md:w-1/2 pointer-events-none opacity-[0.07] z-0">
        <svg className="h-full w-full" viewBox="0 0 600 300" preserveAspectRatio="none">
          <path d="M 100 300 L 400 60 L 600 230" fill="none" stroke="white" strokeWidth="1.5" />
          <path d="M 200 300 L 420 130 L 600 260" fill="none" stroke="white" strokeWidth="1.5" />
          <path d="M 300 300 L 440 200 L 600 285" fill="none" stroke="white" strokeWidth="1.5" />
          <line x1="150" y1="300" x2="600" y2="30" stroke="white" strokeWidth="0.75" />
          <line x1="250" y1="300" x2="600" y2="80" stroke="white" strokeWidth="0.75" />
        </svg>
      </div>

      <div className="max-w-6xl mx-auto px-6 grid grid-cols-1 md:grid-cols-12 gap-10 pb-16 relative z-10">
        
        {/* ── LEFT COLUMN: Brand, Desc, Socials, Back to Top ── */}
        <div className="md:col-span-6 space-y-6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-lg flex items-center justify-center text-sm font-bold shadow-[0_0_20px_rgba(6,182,212,0.4)]">
              ⚡
            </div>
            <span className="text-xl font-bold font-['Outfit'] tracking-wide">
              Repair<span className="text-cyan-400">Vafe</span>
            </span>
          </div>

          <p className="text-gray-400 text-sm max-w-sm leading-relaxed font-['Inter']">
            Empowering customers with professional doorstep device repairs. Transparent pricing, certified field experts, and 6-month warranty.
          </p>

          {/* Social Links */}
          <div className="flex items-center gap-5 text-gray-400">
            <a href="https://x.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <XIcon />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <LinkedInIcon />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <InstagramIcon />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
              <FacebookIcon />
            </a>
          </div>

          {/* Back to Top Button */}
          <div className="pt-2">
            <button 
              onClick={handleBackToTop}
              className="group flex items-center gap-2 px-5 py-2.5 border border-white/20 text-white font-bold text-xs uppercase tracking-wider hover:bg-white/5 hover:border-white/40 transition-all rounded cursor-pointer"
            >
              <ArrowUp size={14} className="group-hover:-translate-y-0.5 transition-transform" />
              <span>Back to Top</span>
            </button>
          </div>
        </div>

        {/* ── MIDDLE COLUMN: Site Map ── */}
        <div className="md:col-span-3">
          <h4 className="text-gray-400 font-bold uppercase text-xs tracking-wider mb-6">Site Map</h4>
          <ul className="space-y-3.5 text-sm font-['Inter']">
            <li>
              <Link to="/" className="text-gray-300 hover:text-white hover:underline transition-all">Homepage</Link>
            </li>
            <li>
              <Link to="/services" className="text-gray-300 hover:text-white hover:underline transition-all">Services</Link>
            </li>
            <li>
              <Link to="/about" className="text-gray-300 hover:text-white hover:underline transition-all">About Us</Link>
            </li>
            <li>
              <Link to="/contact" className="text-gray-300 hover:text-white hover:underline transition-all">Contact Us</Link>
            </li>
            <li>
              <Link to="/faq" className="text-gray-300 hover:text-white hover:underline transition-all">FAQ Helpdesk</Link>
            </li>
            <li>
              <Link to="/become-partner" className="text-gray-300 hover:text-white hover:underline transition-all">Partner Program</Link>
            </li>
            <li>
              <Link to="/customer-login" className="text-gray-300 hover:text-white hover:underline transition-all">Customer Portal</Link>
            </li>
          </ul>
        </div>

        {/* ── RIGHT COLUMN: Legal ── */}
        <div className="md:col-span-3">
          <h4 className="text-gray-400 font-bold uppercase text-xs tracking-wider mb-6">Legal</h4>
          <ul className="space-y-3.5 text-sm font-['Inter']">
            <li>
              <Link to="/privacy" className="text-gray-300 hover:text-white hover:underline transition-all">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/terms" className="text-gray-300 hover:text-white hover:underline transition-all">Terms of Services</Link>
            </li>
            <li>
              <Link to="/warranty" className="text-gray-300 hover:text-white hover:underline transition-all">Warranty Terms</Link>
            </li>
          </ul>
        </div>

      </div>

      {/* ── BOTTOM ACCENT BANNER ── */}
      <div className="bg-[#d97706] text-[#071317] py-3 text-center text-[10px] sm:text-xs font-bold tracking-wider relative z-10 border-t border-white/5">
        Copyright © {new Date().getFullYear()}, repairvafe.com, All Rights Reserved.
      </div>

    </footer>
  );
};
