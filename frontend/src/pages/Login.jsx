import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Shield, AlertCircle, Sparkles, Wrench, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Login = () => {
  const [portalMode, setPortalMode] = useState('admin'); // 'admin', 'partner'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const loginUrl = portalMode === 'partner'
        ? `${import.meta.env.VITE_API_BASE_URL}/technician-auth/login`
        : `${import.meta.env.VITE_API_BASE_URL}/auth/login`;

      const payload = portalMode === 'partner'
        ? { identifier: email, password }
        : { email, password };

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.removeItem('rv_token');
        localStorage.removeItem('rv_admin');
        localStorage.removeItem('rv_partner_token');
        localStorage.removeItem('rv_role');
        localStorage.removeItem('rv_user');

        localStorage.setItem('rv_token', data.token);
        
        if (portalMode === 'partner') {
          localStorage.setItem('rv_partner_token', data.token);
          localStorage.setItem('rv_role', 'partner');
          localStorage.setItem('rv_user', JSON.stringify(data.data));
          localStorage.setItem('rv_partner', JSON.stringify(data.data));
          navigate('/partner');
        } else {
          localStorage.setItem('rv_admin', JSON.stringify(data.data));
          localStorage.setItem('rv_role', data.data.role);
          localStorage.setItem('rv_user', JSON.stringify(data.data));
          
          if (data.data.role === 'admin' || data.data.role === 'superadmin') {
            navigate('/admin');
          } else {
            navigate('/dashboard');
          }
        }
      } else {
        setError(data.message || 'Invalid credentials');
      }
    } catch (err) {
      setError('Connection failed. Please verify that your backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleFillDemo = () => {
    setError('');
    if (portalMode === 'partner') {
      setEmail('sharma@repairvafe.com');
      setPassword('Partner@123');
    } else {
      setEmail('admin@repairvafe.com');
      setPassword('Admin@1234');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080c14] p-4 font-['Outfit'] relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-30" />

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#0c1322]/90 border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-xl">
          {/* Header Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-2xl shadow-lg shadow-blue-500/20">
              {portalMode === 'partner' ? '🔧' : '⚡'}
            </div>
          </div>
          
          <h1 className="text-3xl font-black text-center text-white mb-1">
            Repair<span className="text-blue-400">Vafe</span>
          </h1>
          <p className="text-gray-500 text-center text-sm mb-6">Secure Access Control Panel</p>

          {/* Portal Switcher Tab Layout */}
          <div className="grid grid-cols-2 gap-2 bg-white/5 p-1.5 rounded-xl mb-6 border border-white/5">
            <button
              type="button"
              onClick={() => { setPortalMode('admin'); setError(''); setEmail(''); setPassword(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                portalMode === 'admin' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Admin Portal
            </button>
            <button
              type="button"
              onClick={() => { setPortalMode('partner'); setError(''); setEmail(''); setPassword(''); }}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${
                portalMode === 'partner' 
                  ? 'bg-blue-600 text-white shadow-lg' 
                  : 'text-gray-400 hover:text-white hover:bg-white/5'
              }`}
            >
              Partner Portal
            </button>
          </div>

          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">
                {portalMode === 'partner' ? 'Email or Phone' : 'Email Address'}
              </label>
              <input
                type={portalMode === 'partner' ? 'text' : 'email'}
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-all text-sm"
                placeholder={portalMode === 'partner' ? 'partner@repairvafe.com or 9876543211' : 'admin@repairvafe.com'}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 mb-2 uppercase tracking-wider">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3.5 text-white focus:outline-none focus:border-blue-500 transition-all text-sm"
                placeholder="••••••••"
              />
            </div>

            {portalMode === 'partner' && (
              <div className="flex items-start gap-2.5 text-purple-400 bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl text-xs text-left">
                <Shield className="mt-0.5 flex-shrink-0 text-purple-400" size={14} />
                <span>Note: Partners must first be registered by the Administrator in the admin portal before attempting to sign in.</span>
              </div>
            )}

            {error && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-start gap-2.5 text-red-400 bg-red-500/10 border border-red-500/20 p-4 rounded-xl text-sm"
              >
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{error}</span>
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-extrabold py-3.5 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 text-sm mt-8"
            >
              {loading ? (
                <RefreshCw size={18} className="animate-spin" />
              ) : (
                <>
                  <LogIn size={18} />
                  <span>Sign In to Dashboard</span>
                </>
              )}
            </button>
          </form>

          {/* Demo Credentials Box */}
          <div className="mt-6 pt-6 border-t border-white/5 flex flex-col items-center">
            <div className="flex items-center gap-2 text-xs text-gray-500 mb-3 bg-white/5 border border-white/5 px-4 py-2.5 rounded-xl w-full justify-between">
              <div className="flex items-start gap-2">
                <Sparkles size={14} className="text-blue-400 mt-0.5" />
                <div className="text-left">
                  <div className="font-bold text-white uppercase tracking-wider text-[9px] mb-0.5">
                    {portalMode === 'partner' ? 'Partner Notice' : 'Admin Credentials'}
                  </div>
                  <div className="text-gray-400 text-[10px]">
                    {portalMode === 'partner' ? 'Create "sharma@repairvafe.com" as partner first!' : 'admin@repairvafe.com · Admin@1234'}
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="text-[10px] font-bold text-blue-400 bg-blue-500/10 hover:bg-blue-500/20 border border-blue-500/20 px-2 py-1 rounded-md transition-colors"
              >
                Auto Fill
              </button>
            </div>
            <p className="text-[10px] text-gray-600">
              &copy; 2026 RepairVafe Systems. All rights reserved.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
