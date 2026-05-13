import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogIn, Smartphone, Mail, Lock, Eye, EyeOff,
  AlertCircle, CheckCircle2, Copy, ArrowLeft, User, Phone, Loader2, KeyRound
} from 'lucide-react';

// ── Sample demo credentials (shown in UI) ──────────────────────
const DEMO_ACCOUNTS = [
  {
    role: 'Customer',
    email: 'customer@repairvafe.com',
    password: 'Customer@123',
    name: 'Rohan Verma',
    color: 'from-blue-600 to-cyan-500',
    bg: 'bg-blue-500/10',
    border: 'border-blue-500/20',
    text: 'text-blue-400'
  },
  {
    role: 'Demo User',
    email: 'demo@repairvafe.com',
    password: 'Demo@1234',
    name: 'Priya Sharma',
    color: 'from-purple-600 to-pink-500',
    bg: 'bg-purple-500/10',
    border: 'border-purple-500/20',
    text: 'text-purple-400'
  }
];

const TABS = ['Email Login', 'Mobile OTP', 'Register'];

export const CustomerLogin = () => {
  const navigate = useNavigate();
  const [tab, setTab]           = useState('Email Login');
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [mobile, setMobile]     = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [error, setError]       = useState('');
  const [success, setSuccess]   = useState('');
  const [loading, setLoading]   = useState(false);
  const [copied, setCopied]     = useState(null);

  // OTP verification state (shown after register or mobile login)
  const [otpStep, setOtpStep]       = useState(false);
  const [otpStepMobile, setOtpStepMobile] = useState(false);
  const [otp, setOtp]               = useState('');
  const [regEmail, setRegEmail]     = useState('');

  const API = import.meta.env.VITE_API_BASE_URL;

  // ── Auto-fill demo credentials ──────────────────────────────
  const fillDemo = (acc) => {
    setEmail(acc.email);
    setPassword(acc.password);
    setTab('Email Login');
    setError('');
    setSuccess('');
  };

  const copyText = (text, key) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  // ── Login ───────────────────────────────────────────────────
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const res  = await fetch(`${API}/customer-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('rv_token', data.token);
        localStorage.setItem('rv_role',  'customer');
        localStorage.setItem('rv_user',  JSON.stringify(data.data));
        navigate('/dashboard');
      } else if (data.unverified) {
        setError('Account not verified. Check your email for OTP.');
        setRegEmail(email);
        setOtpStep(true);
      } else {
        setError(data.message || 'Invalid credentials. Try the demo accounts below.');
      }
    } catch {
      setError('Cannot reach server. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  // ── Register ────────────────────────────────────────────────
  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const res  = await fetch(`${API}/customer-auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password })
      });
      const data = await res.json();

      if (data.success) {
        setRegEmail(email);
        setOtpStep(true);
        setSuccess('Account created! Enter the OTP sent to your email.');
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch {
      setError('Cannot reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Verify OTP ──────────────────────────────────────────────
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res  = await fetch(`${API}/customer-auth/verify-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail.trim().toLowerCase(), otp: otp.trim() })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('rv_token', data.token);
        localStorage.setItem('rv_role',  'customer');
        localStorage.setItem('rv_user',  JSON.stringify(data.data));
        navigate('/dashboard');
      } else {
        setError(data.message || 'Invalid OTP. Please check your email.');
      }
    } catch {
      setError('Cannot reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRequestMobileOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError(''); setSuccess('');
    try {
      const res = await fetch(`${API}/customer-auth/mobile-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: mobile.trim() })
      });
      const data = await res.json();
      if (data.success) {
        setOtpStep(true);
        setOtpStepMobile(true);
        setSuccess('OTP sent to your mobile number. Enter it below to login.');
        setPhone(mobile.trim());
      } else {
        setError(data.message || 'Unable to send OTP. Please check your number.');
      }
    } catch {
      setError('Cannot reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyMobileOtp = async (e) => {
    e.preventDefault();
    setLoading(true); setError('');
    try {
      const res = await fetch(`${API}/customer-auth/verify-mobile-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: mobile.trim(), otp: otp.trim() })
      });
      const data = await res.json();
      if (data.success) {
        localStorage.setItem('rv_token', data.token);
        localStorage.setItem('rv_role',  'customer');
        localStorage.setItem('rv_user',  JSON.stringify(data.data));
        navigate('/dashboard');
      } else {
        setError(data.message || 'Invalid OTP. Please retry.');
      }
    } catch {
      setError('Cannot reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── OTP Step ────────────────────────────────────────────────
  if (otpStep) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#080c14] px-4 font-['Inter']">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="bg-[#0d1422] border border-white/5 rounded-3xl p-8 shadow-2xl">
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <KeyRound size={28} className="text-blue-400" />
              </div>
              <h2 className="text-2xl font-black text-white font-['Outfit']">Enter OTP</h2>
              <p className="text-gray-400 text-sm mt-2">
                We sent a 6-digit code to <span className="text-white font-semibold">{otpStepMobile ? mobile : regEmail}</span>
              </p>
            </div>

            {success && (
              <div className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 border border-emerald-500/20 p-3 rounded-xl text-sm mb-5">
                <CheckCircle2 size={15} /> {success}
              </div>
            )}
            {error && (
              <div className="flex items-center gap-2 text-red-400 bg-red-400/10 border border-red-500/20 p-3 rounded-xl text-sm mb-5">
                <AlertCircle size={15} /> {error}
              </div>
            )}

            <form onSubmit={handleVerifyOtp} className="space-y-4">
              <input
                type="text"
                required
                maxLength={6}
                placeholder="• • • • • •"
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.6em] font-bold focus:outline-none focus:border-blue-500 transition-colors placeholder:text-sm placeholder:tracking-normal"
              />
              <button
                type="submit"
                disabled={loading || otp.length < 6}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-40 transition-all flex items-center justify-center gap-2"
              >
                {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : <><CheckCircle2 size={18} /> Verify & Login</>}
              </button>
            </form>

            <button
              onClick={() => { setOtpStep(false); setOtp(''); setError(''); setSuccess(''); }}
              className="mt-5 text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1.5 mx-auto"
            >
              <ArrowLeft size={14} /> Back to login
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  // ── Main Login/Register View ────────────────────────────────
  return (
    <div className="min-h-screen bg-[#080c14] flex items-start justify-center pt-10 pb-16 px-4 font-['Inter']">
      <div className="w-full max-w-4xl">

        {/* Back link */}
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-8">
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="grid md:grid-cols-5 gap-8 items-start">

          {/* ─── Left: Demo Credentials Panel ─── */}
          <div className="md:col-span-2 space-y-4">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-xs font-bold">⚡</div>
                <span className="font-black text-lg font-['Outfit']">Repair<span className="text-blue-400">Vafe</span></span>
              </div>
              <h1 className="text-2xl font-black text-white font-['Outfit'] mt-3">Customer Portal</h1>
              <p className="text-gray-500 text-sm mt-1">Login to track your repairs, view history, and manage bookings.</p>
            </div>

            {/* Demo accounts */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Sample Credentials</p>
              {DEMO_ACCOUNTS.map((acc, i) => (
                <motion.div
                  key={acc.role}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  className={`${acc.bg} border ${acc.border} rounded-2xl p-4 space-y-3`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${acc.color} flex items-center justify-center font-bold text-xs text-white`}>
                        {acc.name[0]}
                      </div>
                      <div>
                        <div className={`text-xs font-bold ${acc.text}`}>{acc.role}</div>
                        <div className="text-[11px] text-gray-500">{acc.name}</div>
                      </div>
                    </div>
                    <button
                      onClick={() => fillDemo(acc)}
                      className={`text-[10px] font-bold px-2.5 py-1 rounded-lg ${acc.bg} border ${acc.border} ${acc.text} hover:opacity-80 transition-opacity`}
                    >
                      Use this
                    </button>
                  </div>

                  {/* Email */}
                  <div className="bg-black/20 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-gray-500 mb-0.5">Email</div>
                      <div className="text-xs font-mono text-white">{acc.email}</div>
                    </div>
                    <button
                      onClick={() => copyText(acc.email, `${i}-email`)}
                      className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
                    >
                      {copied === `${i}-email` ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>

                  {/* Password */}
                  <div className="bg-black/20 rounded-xl px-3 py-2 flex items-center justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-gray-500 mb-0.5">Password</div>
                      <div className="text-xs font-mono text-white">{acc.password}</div>
                    </div>
                    <button
                      onClick={() => copyText(acc.password, `${i}-pwd`)}
                      className="text-gray-500 hover:text-white transition-colors flex-shrink-0"
                    >
                      {copied === `${i}-pwd` ? <CheckCircle2 size={14} className="text-emerald-400" /> : <Copy size={14} />}
                    </button>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Admin note */}
            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-xs text-gray-500 leading-relaxed">
              <span className="text-gray-400 font-semibold">Admin?</span>{' '}
              Use the{' '}
              <Link to="/login" className="text-blue-400 hover:underline">Admin Login</Link>{' '}
              portal with your admin credentials.
            </div>
          </div>

          {/* ─── Right: Login / Register Form ─── */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:col-span-3"
          >
            <div className="bg-[#0d1422] border border-white/5 rounded-3xl p-8 shadow-2xl">

              {/* Tabs */}
              <div className="flex gap-1 bg-white/5 p-1 rounded-xl mb-8">
                {TABS.map(t => (
                  <button
                    key={t}
                    onClick={() => { setTab(t); setError(''); setSuccess(''); setOtp(''); setOtpStep(false); setOtpStepMobile(false); }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === t ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Alert messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-start gap-2 text-red-400 bg-red-400/10 border border-red-500/20 p-3 rounded-xl text-sm mb-6"
                  >
                    <AlertCircle size={15} className="flex-shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </motion.div>
                )}
                {success && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-2 text-emerald-400 bg-emerald-400/10 border border-emerald-500/20 p-3 rounded-xl text-sm mb-6"
                  >
                    <CheckCircle2 size={15} /> {success}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* ── EMAIL LOGIN TAB ── */}
              {tab === 'Email Login' && (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Password</label>
                      <button
                        type="button"
                        onClick={() => {
                          setTab('Email Login');
                          setError('Forgot password? Use the /forgot-password flow.');
                        }}
                        className="text-xs text-blue-400 hover:underline"
                      >
                        Forgot password?
                      </button>
                    </div>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd(!showPwd)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                      >
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3.5 rounded-xl hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] disabled:opacity-40 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {loading
                      ? <><Loader2 size={18} className="animate-spin" /> Signing in...</>
                      : <><LogIn size={18} /> Sign In</>
                    }
                  </button>

                  <p className="text-center text-xs text-gray-500">
                    Don't have an account?{' '}
                    <button type="button" onClick={() => setTab('Register')} className="text-blue-400 hover:underline font-semibold">
                      Create one free
                    </button>
                  </p>
                </form>
              )}

              {/* ── MOBILE OTP TAB ── */}
              {tab === 'Mobile OTP' && !otpStepMobile && (
                <form onSubmit={handleRequestMobileOtp} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Mobile Number</label>
                    <div className="relative">
                      <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="tel"
                        required
                        value={mobile}
                        onChange={e => setMobile(e.target.value.replace(/\D/g, ''))}
                        maxLength={15}
                        placeholder="10-digit mobile"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || mobile.trim().length < 10}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-500 text-white font-bold py-3.5 rounded-xl hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] disabled:opacity-40 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {loading
                      ? <><Loader2 size={18} className="animate-spin" /> Sending OTP...</>
                      : <><Smartphone size={18} /> Send OTP</>
                    }
                  </button>

                  <p className="text-center text-xs text-gray-500">
                    Have an account?{' '}
                    <button type="button" onClick={() => setTab('Email Login')} className="text-blue-400 hover:underline font-semibold">
                      Use email login
                    </button>
                  </p>
                </form>
              )}

              {tab === 'Mobile OTP' && otpStepMobile && (
                <form onSubmit={handleVerifyMobileOtp} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Enter OTP</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.trim().length < 6}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-500 text-white font-bold py-3.5 rounded-xl hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] disabled:opacity-40 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {loading
                      ? <><Loader2 size={18} className="animate-spin" /> Verifying OTP...</>
                      : <><CheckCircle2 size={18} /> Verify & Login</>
                    }
                  </button>

                  <p className="text-center text-xs text-gray-500">
                    Didn't get OTP?{' '}
                    <button type="button" onClick={() => { setOtp(''); setOtpStepMobile(false); setOtpStep(false); setSuccess(''); }} className="text-blue-400 hover:underline font-semibold">
                      Retry mobile login
                    </button>
                  </p>
                </form>
              )}

              {/* ── REGISTER TAB ── */}
              {tab === 'Register' && (
                <form onSubmit={handleRegister} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Full Name</label>
                    <div className="relative">
                      <User size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="Your full name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        required
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder="Min 8 chars, upper, lower, number, symbol"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <button type="button" onClick={() => setShowPwd(!showPwd)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors">
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-1.5">Must include uppercase, lowercase, number & special character</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3.5 rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] disabled:opacity-40 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {loading
                      ? <><Loader2 size={18} className="animate-spin" /> Creating account...</>
                      : <><User size={18} /> Create Account</>
                    }
                  </button>

                  <p className="text-center text-xs text-gray-500">
                    Already have an account?{' '}
                    <button type="button" onClick={() => setTab('Email Login')} className="text-blue-400 hover:underline font-semibold">
                      Sign in
                    </button>
                  </p>
                </form>
              )}

              {/* Quick access row */}
              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Smartphone size={12} />
                  <span>Mobile OTP login coming soon</span>
                </div>
                <Link to="/book" className="text-blue-400 hover:underline">Book without login →</Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};
