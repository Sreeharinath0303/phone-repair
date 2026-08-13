import React, { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LogIn, Smartphone, Mail, Lock, Eye, EyeOff,
  AlertCircle, CheckCircle2, ArrowLeft, User, Phone, Loader2, KeyRound
} from 'lucide-react';
import { getApiBaseUrl } from '../utils/apiBase';
import { Seo } from '../components/Seo';

const TABS = ['Email Login', 'Mobile OTP', 'Register'];

export const CustomerLogin = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const API = getApiBaseUrl();
  const returnTo = useMemo(() => {
    const params = new URLSearchParams(location.search);
    const fromQuery = params.get('returnTo');
    const fromState = location.state?.returnTo;
    return fromQuery || fromState || '/dashboard';
  }, [location.search, location.state]);

  const [tab, setTab] = useState('Email Login');
  const [emailAuthView, setEmailAuthView] = useState('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [otpStep, setOtpStep] = useState(false);
  const [otpStepMobile, setOtpStepMobile] = useState(false);
  const [otp, setOtp] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [forgotEmail, setForgotEmail] = useState('');
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const emailAccessToken = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return params.get('emailAccessToken') || '';
  }, [location.search]);

  const resetTransientState = () => {
    setError('');
    setSuccess('');
    setOtp('');
    setOtpStep(false);
    setOtpStepMobile(false);
    setEmailAuthView('login');
    setForgotEmail('');
    setResetOtp('');
    setResetNewPassword('');
  };

  const persistSession = (data, token) => {
    localStorage.setItem('rv_token', token);
    localStorage.setItem('rv_role', 'customer');
    localStorage.setItem('rv_user', JSON.stringify(data));
    navigate(returnTo, { replace: true });
  };

  useEffect(() => {
    const token = localStorage.getItem('rv_token') || sessionStorage.getItem('rv_token');
    const role = localStorage.getItem('rv_role') || sessionStorage.getItem('rv_role');
    if (token && role === 'customer' && !emailAccessToken) {
      navigate(returnTo, { replace: true });
    }
  }, [emailAccessToken, navigate, returnTo]);

  useEffect(() => {
    if (!emailAccessToken) return;

    let cancelled = false;

    const restoreSession = async () => {
      setLoading(true);
      setError('');
      setSuccess('Restoring your customer session...');

      try {
        const res = await fetch(`${API}/customer-auth/email-access`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ token: emailAccessToken })
        });
        const data = await res.json();

        if (!cancelled) {
          if (data.success) {
            persistSession(data.data, data.token);
            return;
          }
          setSuccess('');
          setError(data.message || 'This email access link is no longer valid.');
        }
      } catch {
        if (!cancelled) {
          setSuccess('');
          setError('Unable to restore your session from the email link.');
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    restoreSession();

    return () => {
      cancelled = true;
    };
  }, [API, emailAccessToken, returnTo]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API}/customer-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), password })
      });
      const data = await res.json();

      if (data.success) {
        persistSession(data.data, data.token);
      } else if (data.unverified) {
        setError('Account not verified. Check your email for OTP.');
        setRegEmail(email.trim().toLowerCase());
        setOtpStep(true);
      } else {
        setError(data.message || 'Invalid credentials. Please check your email and password.');
      }
    } catch {
      setError('Cannot reach server. Please try again shortly.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API}/customer-auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password })
      });
      const data = await res.json();

      if (data.success) {
        setTab('Email Login');
        setPassword('');
        setSuccess('Registration successful. Please sign in with your new account.');
      } else {
        setError(data.message || 'Registration failed. Please try again.');
      }
    } catch {
      setError('Cannot reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API}/customer-auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: forgotEmail.trim().toLowerCase() })
      });
      const data = await res.json();

      if (data.success) {
        setEmailAuthView('reset');
        setSuccess(data.message || 'OTP sent to your email.');
      } else {
        setError(data.message || 'Could not send reset OTP.');
      }
    } catch {
      setError('Cannot reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await fetch(`${API}/customer-auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: forgotEmail.trim().toLowerCase(),
          otp: resetOtp.trim(),
          newPassword: resetNewPassword
        })
      });
      const data = await res.json();

      if (data.success) {
        setEmailAuthView('login');
        setPassword('');
        setResetOtp('');
        setResetNewPassword('');
        setEmail(forgotEmail.trim().toLowerCase());
        setSuccess('Password updated. Please sign in.');
      } else {
        setError(data.message || 'Password reset failed.');
      }
    } catch {
      setError('Cannot reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/customer-auth/verify-registration`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: regEmail.trim().toLowerCase(), otp: otp.trim() })
      });
      const data = await res.json();

      if (data.success) {
        persistSession(data.data, data.token);
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
    setLoading(true);
    setError('');
    setSuccess('');

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
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API}/customer-auth/verify-mobile-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: mobile.trim(), otp: otp.trim() })
      });
      const data = await res.json();

      if (data.success) {
        persistSession(data.data, data.token);
      } else {
        setError(data.message || 'Invalid OTP. Please retry.');
      }
    } catch {
      setError('Cannot reach server. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (otpStep) {
    return (
      <>
        <Seo
          title="Customer Login"
          description="Secure customer access for erepaircafe order tracking, booking history and repair updates."
          path="/customer-login"
          noIndex
        />
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

              <form onSubmit={otpStepMobile ? handleVerifyMobileOtp : handleVerifyOtp} className="space-y-4">
                <input
                  type="text"
                  required
                  maxLength={6}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.4em] font-bold focus:outline-none focus:border-blue-500 transition-colors placeholder:text-sm placeholder:tracking-normal"
                />
                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-40 transition-all flex items-center justify-center gap-2"
                >
                  {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying...</> : <><CheckCircle2 size={18} /> Verify and Login</>}
                </button>
              </form>

              <button
                type="button"
                onClick={() => {
                  setOtpStep(false);
                  setOtpStepMobile(false);
                  setOtp('');
                  setError('');
                  setSuccess('');
                }}
                className="mt-5 text-sm text-gray-500 hover:text-white transition-colors flex items-center gap-1.5 mx-auto"
              >
                <ArrowLeft size={14} /> Back to login
              </button>
            </div>
          </motion.div>
        </div>
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] flex items-start justify-center pt-10 pb-16 px-4 font-['Inter']">
      <Seo
        title="Customer Login"
        description="Secure customer access for erepaircafe order tracking, booking history and repair updates."
        path="/customer-login"
        noIndex
      />
      <div className="w-full max-w-4xl">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-white transition-colors mb-8">
          <ArrowLeft size={14} /> Back to Home
        </Link>

        <div className="grid md:grid-cols-5 gap-8 items-start">
          <div className="md:col-span-2 space-y-4">
            <div className="mb-5">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-7 h-7 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-xs font-bold">RV</div>
                <span className="font-black text-lg font-['Outfit'] text-white">e<span className="text-blue-400">repaircafe</span></span>
              </div>
              <h1 className="text-2xl font-black text-white font-['Outfit'] mt-3">Customer Portal</h1>
              <p className="text-gray-500 text-sm mt-1">Sign in to track repairs, view quotes, and manage your bookings.</p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 space-y-3">
              <div className="text-xs font-bold uppercase tracking-widest text-blue-400">Customer Access</div>
              <p className="text-sm text-gray-300 leading-relaxed">Use your registered email and password, or request a one-time OTP on your mobile number.</p>
              <p className="text-xs text-gray-500">If you booked as a guest earlier, use the same email or phone number linked to that booking.</p>
            </div>

            <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 text-xs text-gray-500 leading-relaxed">
              <span className="text-gray-400 font-semibold">Admin?</span>{' '}
              Use the <Link to="/login" className="text-blue-400 hover:underline">Admin Login</Link> portal with your assigned credentials.
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="md:col-span-3">
            <div className="bg-[#0d1422] border border-white/5 rounded-3xl p-8 shadow-2xl">
              <div className="flex gap-1 bg-white/5 p-1 rounded-xl mb-8">
                {TABS.map((item) => (
                  <button
                    key={item}
                    type="button"
                    onClick={() => {
                      setTab(item);
                      resetTransientState();
                      if (item !== 'Email Login') {
                        setEmailAuthView('login');
                      }
                    }}
                    className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${tab === item ? 'bg-blue-600 text-white' : 'text-gray-400 hover:text-white'}`}
                  >
                    {item}
                  </button>
                ))}
              </div>

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

              {tab === 'Email Login' && emailAuthView === 'login' && (
                <form onSubmit={handleLogin} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
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
                          setForgotEmail(email.trim().toLowerCase());
                          setEmailAuthView('forgot');
                          setError('');
                          setSuccess('');
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
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Enter your password"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((current) => !current)}
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
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : <><LogIn size={18} /> Sign In</>}
                  </button>

                  <p className="text-center text-xs text-gray-500">
                    Do not have an account?{' '}
                    <button type="button" onClick={() => setTab('Register')} className="text-blue-400 hover:underline font-semibold">
                      Create one
                    </button>
                  </p>
                </form>
              )}

              {tab === 'Email Login' && emailAuthView === 'forgot' && (
                <form onSubmit={handleForgotPassword} className="space-y-5">
                  <div>
                    <h3 className="text-white font-bold text-lg">Reset Password</h3>
                    <p className="text-gray-500 text-sm mt-1">We will send a 6-digit OTP to your registered email address.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Email Address</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="email"
                        required
                        value={forgotEmail}
                        onChange={(e) => setForgotEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold py-3.5 rounded-xl hover:shadow-[0_0_25px_rgba(59,130,246,0.5)] disabled:opacity-40 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Sending OTP...</> : <><Mail size={18} /> Send Reset OTP</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailAuthView('login');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Back to login
                  </button>
                </form>
              )}

              {tab === 'Email Login' && emailAuthView === 'reset' && (
                <form onSubmit={handleResetPassword} className="space-y-5">
                  <div>
                    <h3 className="text-white font-bold text-lg">Enter OTP</h3>
                    <p className="text-gray-500 text-sm mt-1">Use the OTP sent to {forgotEmail} and set a new password.</p>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">6-Digit OTP</label>
                    <input
                      type="text"
                      required
                      maxLength={6}
                      value={resetOtp}
                      onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">New Password</label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type={showPwd ? 'text' : 'password'}
                        required
                        value={resetNewPassword}
                        onChange={(e) => setResetNewPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((current) => !current)}
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
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Updating Password...</> : <><CheckCircle2 size={18} /> Update Password</>}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEmailAuthView('forgot');
                      setError('');
                      setSuccess('');
                    }}
                    className="text-xs text-gray-400 hover:text-white"
                  >
                    Back
                  </button>
                </form>
              )}

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
                        onChange={(e) => setMobile(e.target.value.replace(/\D/g, ''))}
                        maxLength={15}
                        placeholder="10-digit mobile number"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || mobile.trim().length < 10}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-500 text-white font-bold py-3.5 rounded-xl hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] disabled:opacity-40 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Sending OTP...</> : <><Smartphone size={18} /> Send OTP</>}
                  </button>
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
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                      placeholder="123456"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading || otp.trim().length < 6}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-500 text-white font-bold py-3.5 rounded-xl hover:shadow-[0_0_25px_rgba(34,211,238,0.4)] disabled:opacity-40 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Verifying OTP...</> : <><CheckCircle2 size={18} /> Verify and Login</>}
                  </button>

                  <p className="text-center text-xs text-gray-500">
                    Did not get OTP?{' '}
                    <button
                      type="button"
                      onClick={() => {
                        setOtp('');
                        setOtpStepMobile(false);
                        setOtpStep(false);
                        setSuccess('');
                      }}
                      className="text-blue-400 hover:underline font-semibold"
                    >
                      Retry mobile login
                    </button>
                  </p>
                </form>
              )}

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
                        onChange={(e) => setName(e.target.value)}
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
                        onChange={(e) => setEmail(e.target.value)}
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
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Minimum 6 characters"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPwd((current) => !current)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-white transition-colors"
                      >
                        {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-600 mt-1.5">Must be at least 6 characters long</p>
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold py-3.5 rounded-xl hover:shadow-[0_0_25px_rgba(139,92,246,0.4)] disabled:opacity-40 transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    {loading ? <><Loader2 size={18} className="animate-spin" /> Creating account...</> : <><User size={18} /> Create Account</>}
                  </button>
                </form>
              )}

              <div className="mt-8 pt-6 border-t border-white/5 flex items-center justify-between text-xs text-gray-600">
                <div className="flex items-center gap-1.5">
                  <Smartphone size={12} />
                  <span>Mobile OTP login active</span>
                </div>
                <Link to="/book" className="text-blue-400 hover:underline">Continue to booking after login</Link>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

