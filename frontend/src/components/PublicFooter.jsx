import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowUp } from 'lucide-react';
import { getApiBaseUrl } from '../utils/apiBase';

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

const YouTubeIcon = () => (
  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
    <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.518 3.545 12 3.545 12 3.545s-7.518 0-9.388.507a3.003 3.003 0 0 0-2.11-2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.87.507 9.388.507 9.388.507s7.518 0 9.388-.507a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

const TrustpilotIcon = () => (
  <svg className="w-5 h-5 fill-current text-[#00b67a]" viewBox="0 0 24 24">
    <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
  </svg>
);

const GoogleIcon = () => (
  <svg className="w-5 h-5 fill-current text-[#4285F4]" viewBox="0 0 24 24">
    <path d="M12.24 10.285V14.4h6.887c-.648 2.41-2.519 4.113-5.136 4.113-3.48 0-6.3-2.82-6.3-6.3 0-3.48 2.82-6.3 6.3-6.3 1.623 0 3.097.616 4.224 1.62l3.24-3.24C19.182 2.224 15.95 1 12.24 1 5.92 1 1 5.92 1 12.24S5.92 23.48 12.24 23.48c6.12 0 11.23-4.32 11.23-11.23 0-.77-.075-1.52-.2-2.24H12.24z"/>
  </svg>
);

const WhatsAppIcon = () => (
  <svg className="w-5 h-5 fill-current text-[#25D366]" viewBox="0 0 24 24">
    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.73-1.458L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.625 1.449 5.4 0 9.786-4.391 9.79-9.785.002-2.614-1.012-5.074-2.857-6.921C16.36 2.052 14.28 1.01 12.007 1.01c-5.4 0-9.789 4.393-9.793 9.787a9.704 9.704 0 001.498 5.127l-1.02 3.725 3.965-1.037zm11.758-6.852c-.3-.15-1.77-.874-2.046-.975-.276-.102-.476-.15-.676.15-.2.3-.776.975-.95 1.174-.176.2-.351.224-.651.075-1.207-.575-2.072-1.009-2.894-2.414-.213-.365-.013-.562.137-.712.135-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525s-.675-1.625-.925-2.225c-.244-.589-.491-.51-.676-.519-.174-.008-.373-.01-.572-.01-.2 0-.525.075-.8.375-.275.3-1.05 1.025-1.05 2.5s1.075 2.9 1.225 3.1c.15.2 2.11 3.224 5.112 4.521.714.308 1.272.492 1.707.63.716.228 1.368.196 1.883.118.574-.087 1.77-.724 2.02-1.387.25-.662.25-1.23.175-1.35-.075-.12-.275-.22-.575-.37z"/>
  </svg>
);

const DEFAULT_LINKS = {
  twitter: 'https://x.com/ErepairCafe',
  linkedin: 'https://www.linkedin.com/company/erepaircafe/',
  instagram: 'https://www.instagram.com/erepaircafe?igsh=MWV6Z242eDl5MXl0cg==',
  facebook: 'https://www.facebook.com/share/192QskMjUo/',
  youtube: 'https://youtube.com/@erepaircafe?si=XyuvL8OX4-Jjj2Wl',
  trustpilot: 'https://www.trustpilot.com/review/erepaircafe.com',
  google: 'https://www.google.com/search?kgmid=%2Fg%2F11hz37hgnj&hl=en-IN&q=eRepairCafe%20-%20Mobile%20Repair%20%26%20Phone%20Screen%20Repair%20Specialized&shem=epsd1%2Cltac%2Crimspwouoe&shndl=30&source=sh%2Fx%2Floc%2Fosrp%2Fm1%2F2&kgs=0832192f0912660b',
  whatsapp: 'https://wa.me/message/N6IZQBNEIYG7O1'
};

const SOCIAL_ITEMS = [
  {
    key: 'twitter',
    hrefKey: 'twitter',
    title: 'Twitter/X',
    icon: XIcon,
    hoverClass: 'hover:border-white/30 hover:text-white hover:bg-white/5'
  },
  {
    key: 'linkedin',
    hrefKey: 'linkedin',
    title: 'LinkedIn',
    icon: LinkedInIcon,
    hoverClass: 'hover:border-[#0A66C2]/40 hover:text-[#0A66C2] hover:bg-[#0A66C2]/10'
  },
  {
    key: 'instagram',
    hrefKey: 'instagram',
    title: 'Instagram',
    icon: InstagramIcon,
    hoverClass: 'hover:border-[#E1306C]/40 hover:text-[#E1306C] hover:bg-[#E1306C]/10'
  },
  {
    key: 'facebook',
    hrefKey: 'facebook',
    title: 'Facebook',
    icon: FacebookIcon,
    hoverClass: 'hover:border-[#1877F2]/40 hover:text-[#1877F2] hover:bg-[#1877F2]/10'
  },
  {
    key: 'youtube',
    hrefKey: 'youtube',
    title: 'YouTube',
    icon: YouTubeIcon,
    hoverClass: 'hover:border-[#FF0033]/40 hover:text-[#FF0033] hover:bg-[#FF0033]/10'
  },
  {
    key: 'whatsapp',
    hrefKey: 'whatsapp',
    title: 'WhatsApp Chat',
    icon: WhatsAppIcon,
    hoverClass: 'hover:border-[#25D366]/40 hover:bg-[#25D366]/10'
  },
  {
    key: 'trustpilot',
    hrefKey: 'trustpilot',
    title: 'Trustpilot Reviews',
    icon: TrustpilotIcon,
    hoverClass: 'hover:border-[#00b67a]/40 hover:bg-[#00b67a]/10'
  },
  {
    key: 'google',
    hrefKey: 'google',
    title: 'Google Business Profile',
    icon: GoogleIcon,
    hoverClass: 'hover:border-[#4285F4]/40 hover:bg-[#4285F4]/10'
  }
];

export const PublicFooter = () => {
  const [links, setLinks] = useState(DEFAULT_LINKS);
  const [customerPortalTarget, setCustomerPortalTarget] = useState('/customer-login');

  useEffect(() => {
    const syncPortalTarget = () => {
      const token = localStorage.getItem('rv_token') || sessionStorage.getItem('rv_token');
      const role = localStorage.getItem('rv_role') || sessionStorage.getItem('rv_role') || '';
      setCustomerPortalTarget(token && role === 'customer' ? '/dashboard' : '/customer-login');
    };

    syncPortalTarget();
    window.addEventListener('storage', syncPortalTarget);
    window.addEventListener('focus', syncPortalTarget);

    const fetchLinks = async () => {
      try {
        const res = await fetch(`${getApiBaseUrl()}/settings/public`);
        const result = await res.json();
        if (result.success && result.data) {
          setLinks({
            twitter: result.data.twitterLink || DEFAULT_LINKS.twitter,
            linkedin: result.data.linkedinLink || DEFAULT_LINKS.linkedin,
            instagram: result.data.instagramLink || DEFAULT_LINKS.instagram,
            facebook: result.data.facebookLink || DEFAULT_LINKS.facebook,
            youtube: result.data.youtubeLink || DEFAULT_LINKS.youtube,
            trustpilot: result.data.trustpilotLink || DEFAULT_LINKS.trustpilot,
            google: result.data.googleSearchLink || DEFAULT_LINKS.google,
            whatsapp: result.data.whatsappLink || DEFAULT_LINKS.whatsapp
          });
        }
      } catch (err) {
        console.error('Failed to load social links, using defaults', err);
      }
    };
    fetchLinks();

    return () => {
      window.removeEventListener('storage', syncPortalTarget);
      window.removeEventListener('focus', syncPortalTarget);
    };
  }, []);

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
              e<span className="text-cyan-400">repaircafe</span>
            </span>
          </div>

          <p className="text-gray-400 text-sm max-w-sm leading-relaxed font-['Inter']">
            Empowering customers with professional doorstep device repairs. Transparent pricing, certified field experts, and 6-month warranty.
          </p>

          {/* Social Links */}
          <div className="flex flex-wrap items-center gap-3 text-gray-300">
            {SOCIAL_ITEMS.map((item) => {
              const Icon = item.icon;
              return (
                <a
                  key={item.key}
                  href={links[item.hrefKey]}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={item.title}
                  aria-label={item.title}
                  className={`flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] transition-all duration-200 hover:-translate-y-0.5 ${item.hoverClass}`}
                >
                  <Icon />
                </a>
              );
            })}
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
              <Link to={customerPortalTarget} className="text-gray-300 hover:text-white hover:underline transition-all">Customer Portal</Link>
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
        Copyright © {new Date().getFullYear()}, erepaircafe.com, All Rights Reserved.
      </div>

    </footer>
  );
};

