import React from 'react';
import { Link } from 'react-router-dom';

export const PublicFooter = () => {
  return (
    <footer className="border-t border-white/5 py-10 px-6 bg-[#080c14] text-white">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-xs font-bold shadow-[0_0_10px_rgba(59,130,246,0.3)]">⚡</div>
          <span className="font-bold font-['Outfit'] text-lg">Repair<span className="text-blue-400">Vafe</span></span>
        </div>
        <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-500">
          <Link to="/" className="hover:text-white transition-colors">Home</Link>
          <Link to="/services" className="hover:text-white transition-colors">Services</Link>
          <Link to="/about" className="hover:text-white transition-colors">About Us</Link>
          <Link to="/contact" className="hover:text-white transition-colors">Contact</Link>
          <Link to="/faq" className="hover:text-white transition-colors">FAQ</Link>
          <Link to="/customer-login" className="hover:text-white transition-colors">Login</Link>
        </div>
        <p className="text-xs text-gray-600">© {new Date().getFullYear()} RepairVafe Systems. All rights reserved.</p>
      </div>
    </footer>
  );
};
