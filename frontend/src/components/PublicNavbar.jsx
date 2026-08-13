import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { getApiBaseUrl } from '../utils/apiBase';

const NAV_ITEMS = [
  { to: '/', label: 'Home' },
  { to: '/services', label: 'Services' },
  { to: '/about', label: 'About Us' },
  { to: '/contact', label: 'Contact' },
  { to: '/faq', label: 'FAQ' },
  { to: '/become-partner', label: 'Become Partner' }
];

export const PublicNavbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [offers, setOffers] = useState([]);
  const [customerSession, setCustomerSession] = useState({ isAuthenticated: false, role: '' });
  const [isDesktop, setIsDesktop] = useState(() => {
    if (typeof window === 'undefined') return true;
    return window.innerWidth >= 768;
  });
  const location = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    const onResize = () => setIsDesktop(window.innerWidth >= 768);
    window.addEventListener('scroll', onScroll);
    window.addEventListener('resize', onResize);
    onResize();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname, isDesktop]);

  useEffect(() => {
    const syncSessionState = () => {
      const token = localStorage.getItem('rv_token') || sessionStorage.getItem('rv_token');
      const role = localStorage.getItem('rv_role') || sessionStorage.getItem('rv_role') || '';
      setCustomerSession({
        isAuthenticated: Boolean(token) && role === 'customer',
        role
      });
    };

    syncSessionState();
    window.addEventListener('storage', syncSessionState);
    window.addEventListener('focus', syncSessionState);

    return () => {
      window.removeEventListener('storage', syncSessionState);
      window.removeEventListener('focus', syncSessionState);
    };
  }, []);

  useEffect(() => {
    let ignore = false;

    const loadOffers = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/settings/public`);
        const data = await res.json();
        if (!ignore && data.success) {
          setOffers(Array.isArray(data.data?.offers) ? data.data.offers : []);
        }
      } catch {
        if (!ignore) {
          setOffers([]);
        }
      }
    };

    loadOffers();
    return () => {
      ignore = true;
    };
  }, []);

  const isActive = (path) => location.pathname === path;
  const customerPortalTarget = customerSession.isAuthenticated ? '/dashboard' : '/customer-login';
  const customerPortalLabel = customerSession.isAuthenticated ? 'Dashboard' : 'Login';
  const offerRibbonText = useMemo(() => {
    if (offers.length === 0) {
      return 'Sign in before booking to unlock live offers, order tracking, and quote approvals.';
    }

    return offers
      .map((offer) => {
        const savings = offer.discountType === 'fixed'
          ? `Save Rs ${Number(offer.discountValue || 0).toLocaleString('en-IN')}`
          : `Save ${offer.discountValue}%`;
        return `${offer.code}: ${savings} • ${offer.description}`;
      })
      .join('   •   ');
  }, [offers]);
  const marqueeCopies = useMemo(() => Array.from({ length: 4 }), []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-[#080c14]/92 backdrop-blur-xl border-b border-white/5 shadow-lg'
          : 'bg-[#080c14]/70 backdrop-blur-sm border-b border-transparent'
      }`}
    >
      <div className="h-8 overflow-hidden border-b border-white/5 bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-500">
        <div className="whitespace-nowrap text-[11px] font-bold uppercase tracking-[0.12em] text-white/95 marquee-track">
          {marqueeCopies.map((_, index) => (
            <span key={index} className="marquee-content" aria-hidden={index > 0 ? 'true' : undefined}>
              {offerRibbonText}
            </span>
          ))}
        </div>
      </div>

      <div className="mx-auto flex h-16 max-w-6xl items-center px-6">
        <Link to="/" className="flex shrink-0 items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 text-sm font-bold shadow-[0_0_20px_rgba(59,130,246,0.4)]">
            e
          </div>
          <span className="text-lg font-bold font-['Outfit'] text-white">
            e<span className="text-blue-400">repaircafe</span>
          </span>
        </Link>

        {isDesktop && (
          <ul className="flex flex-1 items-center justify-center gap-6 px-8">
            {NAV_ITEMS.map((item) => (
              <li key={item.to} className="shrink-0">
                <Link
                  to={item.to}
                  className={`inline-flex whitespace-nowrap text-sm font-medium transition-colors ${
                    isActive(item.to) ? 'text-white font-semibold' : 'text-gray-300 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <div className="ml-auto flex shrink-0 items-center gap-3">
          <Link
            to={customerPortalTarget}
            className={`${isDesktop ? 'block' : 'hidden'} text-sm font-semibold text-gray-300 transition-colors hover:text-white`}
          >
            {customerPortalLabel}
          </Link>
          <Link
            to="/book"
            className="rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 px-5 py-2.5 text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
          >
            Book Now
          </Link>
          <button
            className={`${isDesktop ? 'hidden' : 'flex'} ml-2 items-center justify-center p-2 text-gray-400 hover:text-white`}
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            type="button"
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {!isDesktop && mobileMenuOpen && (
        <div className="flex flex-col gap-4 border-b border-white/5 bg-[#080c14] px-6 py-4">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`transition-colors ${isActive(item.to) ? 'text-white font-semibold' : 'text-gray-400'}`}
            >
              {item.label}
            </Link>
          ))}
          <Link to={customerPortalTarget} className="border-t border-white/5 pt-2 font-semibold text-gray-400 sm:hidden">
            {customerPortalLabel}
          </Link>
        </div>
      )}

      <style>{`
        .marquee-track {
          display: flex;
          width: max-content;
          min-width: 100%;
          align-items: center;
          height: 100%;
          animation: offer-marquee 65s linear infinite;
        }
        .marquee-track:hover {
          animation-play-state: paused;
        }
        .marquee-content {
          display: inline-flex;
          align-items: center;
          padding-right: 5rem;
        }
        @keyframes offer-marquee {
          from { transform: translateX(0); }
          to { transform: translateX(-25%); }
        }
      `}</style>
    </nav>
  );
};
