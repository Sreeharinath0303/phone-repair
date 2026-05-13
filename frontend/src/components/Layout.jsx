import React, { useState, useEffect } from 'react';
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
  FileText,
  MessageSquare,
  BarChart3,
  MapPin,
  ClipboardList
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Layout = ({ children }) => {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const storedUser = localStorage.getItem('rv_user');
    if (storedUser) setUser(JSON.parse(storedUser));
  }, []);

  const handleLogout = () => {
    localStorage.clear();
    sessionStorage.clear();
    navigate('/login');
  };

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
    { label: 'Governance', type: 'label' },
    { path: '/admin/audit-logs', icon: ShieldCheck, label: 'Audit Logs' },
    { path: '/admin/templates', icon: Mail, label: 'Email Templates' },
    { path: '/admin/enquiries', icon: MessageSquare, label: 'Enquiries' },
    { label: 'Intelligence', type: 'label' },
    { path: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/admin/location', icon: MapPin, label: 'Location Intel' },
    { label: 'System', type: 'label' },
    { path: '/admin/settings', icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="flex min-h-screen bg-[#0a0a0a] text-white font-['Outfit']">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-[#111111] border-r border-white/5 transition-transform duration-300 lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="flex items-center gap-3 p-6 border-b border-white/5">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">⚡</div>
            <span className="text-xl font-bold">Repair<span className="text-blue-500">Vafe</span></span>
          </div>

          <nav className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            {navItems.map((item, index) => (
              item.type === 'label' ? (
                <div key={index} className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mt-6 mb-2 px-3">
                  {item.label}
                </div>
              ) : (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all group ${location.pathname === item.path ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  <item.icon size={18} className={location.pathname === item.path ? 'text-white' : 'text-gray-400 group-hover:text-blue-500'} />
                  <span className="text-sm font-medium">{item.label}</span>
                </Link>
              )
            ))}
          </nav>

          <div className="p-4 border-t border-white/5">
            <div className="flex items-center gap-3 p-3 bg-white/5 rounded-2xl">
              <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-600 to-purple-600 flex items-center justify-center font-bold">
                {user?.name?.substring(0, 2).toUpperCase() || 'AD'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-bold truncate">{user?.name || 'Administrator'}</div>
                <div className="text-[10px] text-gray-500 uppercase tracking-tighter">{user?.role || 'Super Admin'}</div>
              </div>
              <button onClick={handleLogout} className="text-gray-500 hover:text-red-500 transition-colors">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`flex-1 transition-all duration-300 ${isSidebarOpen ? 'lg:ml-64' : ''}`}>
        {/* Topbar */}
        <header className="sticky top-0 z-40 h-16 bg-[#0a0a0a]/80 backdrop-blur-md border-b border-white/5 px-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(!isSidebarOpen)} className="lg:hidden text-gray-400 hover:text-white">
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <span className="capitalize">{location.pathname.split('/').pop() || 'Dashboard'}</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
              <input 
                type="text" 
                placeholder="Global Search..." 
                className="bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-xs focus:outline-none focus:border-blue-500 w-64"
              />
            </div>
            <div className="w-px h-6 bg-white/10" />
            <div className="text-xs text-gray-500 hidden sm:block">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
            </div>
          </div>
        </header>

        <div className="p-8">
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
