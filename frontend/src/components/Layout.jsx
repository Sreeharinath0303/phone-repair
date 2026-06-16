import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Calendar,
  Package,
  Mail,
  ShieldCheck,
  Search,
  Settings,
  LogOut,
  Menu,
  X,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('rv_user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const mediaQuery = window.matchMedia('(min-width: 1024px)');
    const syncLayout = (event) => {
      setIsDesktop(event.matches);
      setSidebarOpen(event.matches);
    };

    syncLayout(mediaQuery);

    if (typeof mediaQuery.addEventListener === 'function') {
      mediaQuery.addEventListener('change', syncLayout);
      return () => mediaQuery.removeEventListener('change', syncLayout);
    }

    mediaQuery.addListener(syncLayout);
    return () => mediaQuery.removeListener(syncLayout);
  }, []);

  useEffect(() => {
    if (isDesktop) {
      document.body.classList.remove('overflow-hidden');
      return;
    }

    document.body.classList.toggle('overflow-hidden', isSidebarOpen);

    return () => {
      document.body.classList.remove('overflow-hidden');
    };
  }, [isDesktop, isSidebarOpen]);

  useEffect(() => {
    if (!isDesktop) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isDesktop]);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);
  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  const navItems = [
    { label: 'Main', type: 'label' },
    { path: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
    { label: 'Operations', type: 'label' },
    { path: '/admin/leads', icon: ClipboardList, label: 'Leads' },
    { path: '/admin/bookings', icon: Calendar, label: 'Bookings' },
    { path: '/admin/orders', icon: Package, label: 'Orders' },
    { label: 'Stakeholders', type: 'label' },
    { path: '/admin/customers', icon: Users, label: 'Customers' },
    { path: '/admin/partners', icon: Users, label: 'Partners' },
    { path: '/admin/partner-applications', icon: ClipboardList, label: 'Partner Apps' },
    { label: 'Governance', type: 'label' },
    { path: '/admin/audit-logs', icon: ShieldCheck, label: 'Audit Logs' },
    { path: '/admin/templates', icon: Mail, label: 'Email Templates' },
    { label: 'System', type: 'label' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-['Outfit']">
      {isSidebarOpen && !isDesktop && (
        <button
          type="button"
          aria-label="Close sidebar overlay"
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={closeSidebar}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 max-w-[85vw] bg-[#111111] border-r border-white/5 transition-transform duration-300 lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between gap-3 border-b border-white/5 p-6">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white font-bold">
                &#9889;
              </div>
              <span className="text-xl font-bold">
                Repair<span className="text-blue-500">Vafe</span>
              </span>
            </div>
            <button
              type="button"
              onClick={closeSidebar}
              aria-label="Hide sidebar"
              className="text-gray-400 transition-colors hover:text-white lg:hidden"
            >
              <X size={20} />
            </button>
          </div>

          <nav className="custom-scrollbar flex-1 overflow-y-auto p-4">
            {navItems.map((item, index) =>
              item.type === 'label' ? (
                <div
                  key={index}
                  className="mt-6 mb-2 px-3 text-[10px] font-bold uppercase tracking-widest text-gray-500"
                >
                  {item.label}
                </div>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (!isDesktop) closeSidebar();
                  }}
                  className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all ${
                    location.pathname === item.path
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-400 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <item.icon
                    size={18}
                    className={
                      location.pathname === item.path
                        ? 'text-white'
                        : 'text-gray-400 group-hover:text-blue-500'
                    }
                  />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            )}
          </nav>

          <div className="border-t border-white/5 p-4">
            <div className="flex items-center gap-3 rounded-2xl bg-white/5 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 font-bold">
                {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-bold">{user?.name || 'Administrator'}</div>
                <div className="text-[10px] uppercase tracking-tighter text-gray-500">
                  {user?.role || 'Super Admin'}
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="text-gray-500 transition-colors hover:text-red-500"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      <main className={`flex-1 transition-all duration-300 ${isDesktop ? 'lg:ml-64' : ''}`}>
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-white/5 bg-[#0a0a0a]/80 px-4 backdrop-blur-md sm:px-8">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={toggleSidebar}
              aria-label={isSidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
              className="text-gray-400 hover:text-white lg:hidden"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="capitalize">{location.pathname.split('/').pop() || 'Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center gap-4 sm:gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input
                type="text"
                placeholder="Global Search..."
                className="w-64 rounded-full border border-white/10 bg-white/5 py-1.5 pr-4 pl-10 text-xs focus:border-blue-500 focus:outline-none"
              />
            </div>
            <div className="hidden h-6 w-px bg-white/10 sm:block" />
            <div className="hidden text-xs text-gray-500 sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </header>

        <div className="p-4 sm:p-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};
