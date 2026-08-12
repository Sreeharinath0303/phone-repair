import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, Search } from 'lucide-react';
import { Seo } from '../components/Seo';

export const NotFound = () => {
  const location = useLocation();

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-6 py-16">
      <Seo
        title="404"
        description="The page you requested could not be found on erepaircafe."
        path={location.pathname}
        noIndex
      />
      <div className="w-full max-w-2xl text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-amber-500/20 bg-amber-500/10 text-amber-400">
          <AlertTriangle size={36} />
        </div>
        <div className="mb-3 text-sm font-bold uppercase tracking-[0.2em] text-amber-400">404 Error</div>
        <h1 className="mb-4 text-4xl font-black font-['Outfit'] text-white md:text-5xl">Page not found</h1>
        <p className="mx-auto mb-8 max-w-xl text-sm leading-relaxed text-gray-400 md:text-base">
          The page you requested does not exist or the brand/model URL is invalid. Check the address or continue from one of the main entry points below.
        </p>

        <div className="flex flex-col justify-center gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-500 px-6 py-3 text-sm font-bold text-white transition-all hover:-translate-y-0.5 hover:shadow-[0_0_20px_rgba(59,130,246,0.4)]"
          >
            <ArrowLeft size={16} />
            Back to Home
          </Link>
          <Link
            to="/book"
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-white/10"
          >
            <Search size={16} />
            Open Booking
          </Link>
        </div>
      </div>
    </div>
  );
};
