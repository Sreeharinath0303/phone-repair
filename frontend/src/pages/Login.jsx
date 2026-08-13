import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LogIn, Shield, AlertCircle, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { getApiBaseUrl } from '../utils/apiBase';
import { Seo } from '../components/Seo';

export const Login = () => {
  const [portalMode, setPortalMode] = useState('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const resetForm = (mode) => {
    setPortalMode(mode);
    setError('');
    setEmail('');
    setPassword('');
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const apiBaseUrl = getApiBaseUrl();
      const loginUrl = portalMode === 'partner'
        ? `${apiBaseUrl}/technician-auth/login`
        : `${apiBaseUrl}/auth/login`;

      const payload = portalMode === 'partner'
        ? { identifier: email.trim(), password }
        : { email: email.trim(), password };

      const response = await fetch(loginUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (!data.success) {
        setError(data.message || 'Invalid credentials');
        return;
      }

      localStorage.removeItem('rv_token');
      localStorage.removeItem('rv_admin');
      localStorage.removeItem('rv_partner_token');
      localStorage.removeItem('rv_role');
      localStorage.removeItem('rv_user');
      localStorage.removeItem('rv_partner');

      localStorage.setItem('rv_token', data.token);

      if (portalMode === 'partner') {
        localStorage.setItem('rv_partner_token', data.token);
        localStorage.setItem('rv_role', 'partner');
        localStorage.setItem('rv_user', JSON.stringify(data.data));
        localStorage.setItem('rv_partner', JSON.stringify(data.data));
        navigate('/partner');
        return;
      }

      localStorage.setItem('rv_admin', JSON.stringify(data.data));
      localStorage.setItem('rv_role', data.data.role);
      localStorage.setItem('rv_user', JSON.stringify(data.data));

      if (data.data.role === 'admin' || data.data.role === 'superadmin') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch {
      setError('Connection failed. Please verify that your backend server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#080c14] p-4 font-['Outfit'] relative overflow-hidden">
      <Seo
        title="Admin and Partner Login"
        description="Secure login for erepaircafe administrators and service partners."
        path="/login"
        noIndex
      />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.01)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none opacity-30" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <div className="bg-[#0c1322]/90 border border-white/10 rounded-3xl p-8 md:p-10 shadow-2xl backdrop-blur-xl">
          <div className="flex justify-center mb-6">
            <div className="w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-500/20">
              {portalMode === 'partner' ? 'PR' : 'AD'}
            </div>
          </div>

          <h1 className="text-3xl font-black text-center text-white mb-1">
            e<span className="text-blue-400">repaircafe</span>
          </h1>
          <p className="text-gray-500 text-center text-sm mb-6">Secure Access Control Panel</p>

          <div className="grid grid-cols-2 gap-2 bg-white/5 p-1.5 rounded-xl mb-6 border border-white/5">
            <button
              type="button"
              onClick={() => resetForm('admin')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${portalMode === 'admin' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            >
              Admin Portal
            </button>
            <button
              type="button"
              onClick={() => resetForm('partner')}
              className={`py-2 text-xs font-bold rounded-lg transition-all ${portalMode === 'partner' ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
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
                placeholder={portalMode === 'partner' ? 'Enter assigned email or phone' : 'Enter your admin email'}
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
                placeholder="Enter your password"
              />
            </div>

            {portalMode === 'partner' && (
              <div className="flex items-start gap-2.5 text-purple-400 bg-purple-500/10 border border-purple-500/20 p-4 rounded-xl text-xs text-left">
                <Shield className="mt-0.5 flex-shrink-0 text-purple-400" size={14} />
                <span>Partners must be registered by an administrator before they can sign in.</span>
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
              {loading ? <RefreshCw size={18} className="animate-spin" /> : <><LogIn size={18} /><span>Sign In to Dashboard</span></>}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/5 flex flex-col items-center">
            <div className="text-xs text-gray-500 mb-3 bg-white/5 border border-white/5 px-4 py-3 rounded-xl w-full">
              {portalMode === 'partner'
                ? 'Use the email or phone number assigned to your partner account.'
                : 'Use your issued administrator credentials.'}
            </div>
            <p className="text-[10px] text-gray-600">
              &copy; 2026 erepaircafe Systems. All rights reserved.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

