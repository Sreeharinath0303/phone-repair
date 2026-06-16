import React, { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { PublicNavbar } from './PublicNavbar.jsx';
import { PublicFooter } from './PublicFooter.jsx';

export const PublicLayout = ({ children }) => {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#080c14] text-white font-['Inter']">
      <PublicNavbar />
      <main className="flex-grow pt-16">
        {children}
      </main>
      <PublicFooter />
    </div>
  );
};
