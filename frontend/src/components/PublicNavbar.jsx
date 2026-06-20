import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export const PublicNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const isActive = (path) => location.pathname === path;

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-[#080c14]/90 backdrop-blur-xl border-b border-white/5 shadow-lg' : 'bg-[#080c14]/50 backdrop-blur-sm border-b border-transparent'}`}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-sm font-bold shadow-[0_0_20px_rgba(59,130,246,0.4)]">⚡</div>
          <span className="text-lg font-bold font-['Outfit']">Repair<span className="text-blue-400">Vafe</span></span>
        </Link>
        <div className="hidden lg:flex items-center gap-6 mx-auto text-sm font-medium text-gray-400">
          <Link to="/" className={`transition-colors ${isActive('/') ? 'text-white font-semibold' : 'hover:text-white'}`}>Home</Link>
          <Link to="/services" className={`transition-colors ${isActive('/services') ? 'text-white font-semibold' : 'hover:text-white'}`}>Services</Link>
          <Link to="/about" className={`transition-colors ${isActive('/about') ? 'text-white font-semibold' : 'hover:text-white'}`}>About Us</Link>
          <Link to="/contact" className={`transition-colors ${isActive('/contact') ? 'text-white font-semibold' : 'hover:text-white'}`}>Contact</Link>
          <Link to="/faq" className={`transition-colors ${isActive('/faq') ? 'text-white font-semibold' : 'hover:text-white'}`}>FAQ</Link>
          <Link to="/become-partner" className={`transition-colors ${isActive('/become-partner') ? 'text-white font-semibold' : 'hover:text-white'}`}>Become Partner</Link>
        </div>
        <div className="flex items-center gap-3">
          <Link to="/customer-login" className="text-sm font-semibold text-gray-300 hover:text-white transition-colors hidden sm:block">Login</Link>
          <Link
            to="/book"
            className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white text-sm font-bold px-5 py-2.5 rounded-full hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] hover:-translate-y-0.5 transition-all duration-200"
          >
            Book Now
          </Link>
          <button 
            className="lg:hidden text-gray-400 hover:text-white ml-2 flex items-center justify-center p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-[#080c14] border-b border-white/5 px-6 py-4 flex flex-col gap-4">
          <Link to="/" className={`transition-colors ${isActive('/') ? 'text-white font-semibold' : 'text-gray-400'}`}>Home</Link>
          <Link to="/services" className={`transition-colors ${isActive('/services') ? 'text-white font-semibold' : 'text-gray-400'}`}>Services</Link>
          <Link to="/about" className={`transition-colors ${isActive('/about') ? 'text-white font-semibold' : 'text-gray-400'}`}>About Us</Link>
          <Link to="/contact" className={`transition-colors ${isActive('/contact') ? 'text-white font-semibold' : 'text-gray-400'}`}>Contact</Link>
          <Link to="/faq" className={`transition-colors ${isActive('/faq') ? 'text-white font-semibold' : 'text-gray-400'}`}>FAQ</Link>
          <Link to="/become-partner" className={`transition-colors ${isActive('/become-partner') ? 'text-white font-semibold' : 'text-gray-400'}`}>Become Partner</Link>
          <Link to="/customer-login" className="text-gray-400 font-semibold sm:hidden pt-2 border-t border-white/5">Login</Link>
        </div>
      )}
    </nav>
  );
};
