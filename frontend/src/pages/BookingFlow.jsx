import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Smartphone, ChevronLeft, ChevronRight, Loader2, CheckCircle2,
  Monitor, Cpu, Wrench, Battery, Search, Mail, Lock, AlertCircle
} from 'lucide-react';

const STEPS = ['Device', 'Brand', 'Model', 'Services', 'Contact', 'Schedule', 'Confirm'];

const DEVICE_TYPES = [
  { id: 'smartphone', label: 'Smartphone', icon: Smartphone },
  { id: 'tablet', label: 'Tablet', icon: Monitor },
  { id: 'laptop', label: 'Laptop', icon: Monitor },
  { id: 'smartwatch', label: 'Smartwatch', icon: Cpu }
];

const BRAND_FALLBACKS = {
  smartphone: [
    'Apple', 'Samsung', 'Vivo', 'Oppo', 'Xiaomi', 'Realme', 'OnePlus', 'Google', 'Nothing', 'Motorola',
    'Nokia', 'Poco', 'IQOO', 'Infinix', 'Tecno', 'Huawei', 'Honor', 'Asus', 'Sony', 'Lava', 'Other'
  ],
  tablet: ['Apple', 'Samsung', 'Lenovo', 'Xiaomi', 'Realme', 'Honor', 'Huawei', 'Other'],
  laptop: ['Apple', 'Dell', 'HP', 'Lenovo', 'Asus', 'Acer', 'MSI', 'Samsung', 'Microsoft', 'Other'],
  smartwatch: ['Apple', 'Samsung', 'Garmin', 'Fossil', 'Fitbit', 'Amazfit', 'Noise', 'boAt', 'Other']
};

const MODEL_FALLBACKS = {
  smartphone: {
    Apple: ['iPhone 15', 'iPhone 15 Pro', 'iPhone 14', 'iPhone 14 Pro', 'iPhone 13', 'iPhone 13 Pro', 'Other Model'],
    Samsung: ['Galaxy S24', 'Galaxy S24 Ultra', 'Galaxy S23', 'Galaxy S22 Ultra', 'Galaxy A55', 'Galaxy A35', 'Other Model'],
    Vivo: ['Vivo V30', 'Vivo V29', 'Vivo X100', 'Vivo T3', 'Other Model'],
    Oppo: ['Oppo Reno 11', 'Oppo F27', 'Oppo Find X7', 'Other Model'],
    Xiaomi: ['Redmi Note 13', 'Xiaomi 14', 'Redmi 13C', 'Other Model'],
    Realme: ['Realme 12 Pro', 'Realme Narzo 70', 'Realme GT 6', 'Other Model'],
    OnePlus: ['OnePlus 12', 'OnePlus 11R', 'OnePlus Nord CE 4', 'Other Model'],
    Google: ['Pixel 8', 'Pixel 8 Pro', 'Pixel 7 Pro', 'Other Model'],
    Nothing: ['Nothing Phone 2', 'Nothing Phone 2a', 'Other Model'],
    Motorola: ['Moto Edge 50', 'Moto G84', 'Other Model'],
    Nokia: ['Nokia G42', 'Nokia X30', 'Other Model'],
    Poco: ['Poco X6', 'Poco F6', 'Other Model'],
    IQOO: ['iQOO Neo 9 Pro', 'iQOO Z9', 'Other Model'],
    Infinix: ['Infinix Note 40', 'Infinix GT 20 Pro', 'Other Model'],
    Tecno: ['Tecno Camon 30', 'Tecno Pova 6', 'Other Model'],
    Huawei: ['Huawei P60', 'Huawei Nova 12', 'Other Model'],
    Honor: ['Honor 200', 'Honor X9b', 'Other Model'],
    Asus: ['ROG Phone 8', 'Zenfone 11', 'Other Model'],
    Sony: ['Xperia 1 V', 'Xperia 10 V', 'Other Model'],
    Lava: ['Lava Blaze 2', 'Lava Agni 2', 'Other Model'],
    Other: ['Other Model']
  },
  tablet: {
    Apple: ['iPad 10th Gen', 'iPad Air', 'iPad Pro', 'Other Model'],
    Samsung: ['Galaxy Tab S9', 'Galaxy Tab A9', 'Other Model'],
    Lenovo: ['Tab M11', 'Tab P12', 'Other Model'],
    Xiaomi: ['Pad 6', 'Other Model'],
    Realme: ['Realme Pad 2', 'Other Model'],
    Honor: ['Pad 9', 'Other Model'],
    Huawei: ['MatePad 11', 'Other Model'],
    Other: ['Other Model']
  },
  laptop: {
    Apple: ['MacBook Air M2', 'MacBook Air M3', 'MacBook Pro 14', 'Other Model'],
    Dell: ['Inspiron 15', 'XPS 13', 'Latitude 5440', 'Other Model'],
    HP: ['Pavilion 15', 'Victus 15', 'Spectre x360', 'Other Model'],
    Lenovo: ['IdeaPad Slim 5', 'ThinkPad E14', 'Legion 5', 'Other Model'],
    Asus: ['Vivobook 15', 'Zenbook 14', 'ROG Strix', 'Other Model'],
    Acer: ['Aspire 7', 'Nitro V', 'Other Model'],
    MSI: ['GF63', 'Katana 15', 'Other Model'],
    Samsung: ['Galaxy Book4', 'Other Model'],
    Microsoft: ['Surface Laptop 5', 'Other Model'],
    Other: ['Other Model']
  },
  smartwatch: {
    Apple: ['Apple Watch Series 9', 'Apple Watch Ultra 2', 'Other Model'],
    Samsung: ['Galaxy Watch 6', 'Galaxy Watch 5 Pro', 'Other Model'],
    Garmin: ['Venu 3', 'Forerunner 265', 'Other Model'],
    Fossil: ['Gen 6', 'Other Model'],
    Fitbit: ['Versa 4', 'Sense 2', 'Other Model'],
    Amazfit: ['GTR 4', 'Bip 5', 'Other Model'],
    Noise: ['ColorFit Pro 5', 'Other Model'],
    boAt: ['Xtend Pro', 'Wave Sigma', 'Other Model'],
    Other: ['Other Model']
  }
};

const ISSUE_TYPES_MAP = {
  smartphone: [
    { id: 'screen', label: 'Screen Damage', icon: Monitor, price: 'Rs 899+' },
    { id: 'battery', label: 'Battery Issue', icon: Battery, price: 'Rs 499+' },
    { id: 'camera', label: 'Camera Fault', icon: Cpu, price: 'Rs 699+' },
    { id: 'charging', label: 'Charging Port', icon: Wrench, price: 'Rs 399+' },
    { id: 'water', label: 'Water Damage', icon: Wrench, price: 'Rs 999+' },
    { id: 'back_glass', label: 'Back Glass', icon: Smartphone, price: 'Rs 599+' }
  ],
  tablet: [
    { id: 'screen', label: 'Screen Replacement', icon: Monitor, price: 'Rs 1499+' },
    { id: 'battery', label: 'Battery Issue', icon: Battery, price: 'Rs 899+' },
    { id: 'charging', label: 'Charging Port', icon: Wrench, price: 'Rs 499+' },
    { id: 'water', label: 'Water Damage', icon: Wrench, price: 'Rs 1299+' },
    { id: 'software', label: 'Software Issue', icon: Cpu, price: 'Rs 399+' }
  ],
  laptop: [
    { id: 'screen', label: 'Screen / Display', icon: Monitor, price: 'Rs 2499+' },
    { id: 'battery', label: 'Battery Replacement', icon: Battery, price: 'Rs 1999+' },
    { id: 'keyboard', label: 'Keyboard Issue', icon: Wrench, price: 'Rs 999+' },
    { id: 'motherboard', label: 'Motherboard / Chip', icon: Cpu, price: 'Rs 2999+' },
    { id: 'software', label: 'OS / Software', icon: Monitor, price: 'Rs 499+' },
    { id: 'cleaning', label: 'Overheating / Cleaning', icon: Wrench, price: 'Rs 599+' }
  ],
  smartwatch: [
    { id: 'screen', label: 'Screen Damage', icon: Monitor, price: 'Rs 799+' },
    { id: 'battery', label: 'Battery Replacement', icon: Battery, price: 'Rs 599+' },
    { id: 'strap', label: 'Strap / Body', icon: Wrench, price: 'Rs 299+' },
    { id: 'sensor', label: 'Sensor Issue', icon: Cpu, price: 'Rs 699+' },
    { id: 'water', label: 'Water Damage', icon: Wrench, price: 'Rs 899+' }
  ]
};

const TIME_SLOTS = ['09:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM'];
const OTHER_BRAND = 'Other';
const OTHER_MODEL = 'Other Model';

const formatServiceType = (serviceType) => {
  if (serviceType === 'dropoff') return 'Store Dropoff';
  if (serviceType === 'walkin') return 'Store Visit';
  return 'Pickup';
};

export const BookingFlow = () => {
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [modelSearch, setModelSearch] = useState('');
  const [emailLookup, setEmailLookup] = useState({ checking: false, exists: false, checkedEmail: '', isActive: true });
  const [resetMode, setResetMode] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const savedUser = JSON.parse(localStorage.getItem('rv_user') || '{}');
  const isAuthenticatedCustomer = localStorage.getItem('rv_role') === 'customer' && Boolean(localStorage.getItem('rv_token'));

  const [form, setForm] = useState({
    deviceType: '',
    brand: '',
    customBrand: '',
    model: '',
    customModel: '',
    issues: [],
    description: '',
    name: savedUser.name || '',
    phone: savedUser.phone || '',
    email: savedUser.email || '',
    accountPassword: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    date: '',
    timeSlot: '',
    serviceType: 'pickup'
  });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  const selectedDevice = DEVICE_TYPES.find((item) => item.id === form.deviceType);
  const availableIssues = ISSUE_TYPES_MAP[form.deviceType] || [];

  const resolvedBrand = form.brand === OTHER_BRAND ? form.customBrand.trim() : form.brand;
  const resolvedModel = form.model === OTHER_MODEL ? form.customModel.trim() : form.model;

  const displayedBrands = useMemo(() => {
    const normalized = brands.map((item) => item.name).filter(Boolean);
    const merged = normalized.length > 0 ? normalized : (BRAND_FALLBACKS[form.deviceType] || []);
    return Array.from(new Set([...merged.filter(Boolean), OTHER_BRAND]));
  }, [brands, form.deviceType]);

  const displayedModels = useMemo(() => {
    const apiModels = models
      .map((item) => item.name)
      .filter(Boolean);

    const fallbackModels = MODEL_FALLBACKS[form.deviceType]?.[form.brand] || MODEL_FALLBACKS[form.deviceType]?.[OTHER_BRAND] || [OTHER_MODEL];
    const merged = apiModels.length > 0 ? apiModels : fallbackModels;
    const filtered = merged.filter((item) => item.toLowerCase().includes(modelSearch.trim().toLowerCase()));
    return Array.from(new Set([...filtered, OTHER_MODEL]));
  }, [form.brand, form.deviceType, modelSearch, models]);

  const selectedIssueLabels = useMemo(() => {
    return form.issues.map((issueId) => {
      const match = availableIssues.find((issue) => issue.id === issueId);
      return match?.label || issueId;
    });
  }, [availableIssues, form.issues]);

  useEffect(() => {
    if (isAuthenticatedCustomer) {
      setEmailLookup({ checking: false, exists: false, checkedEmail: '', isActive: true });
      return;
    }

    const normalizedEmail = form.email.trim().toLowerCase();
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

    if (!isValidEmail) {
      setEmailLookup({ checking: false, exists: false, checkedEmail: '', isActive: true });
      return;
    }

    let ignore = false;
    const timer = setTimeout(async () => {
      setEmailLookup((current) => ({ ...current, checking: true }));
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/customer-auth/account-status?email=${encodeURIComponent(normalizedEmail)}`);
        const data = await res.json();
        if (!ignore && data.success) {
          setEmailLookup({
            checking: false,
            exists: Boolean(data.data?.exists),
            checkedEmail: normalizedEmail,
            isActive: data.data?.isActive ?? true
          });
        }
      } catch {
        if (!ignore) {
          setEmailLookup({ checking: false, exists: false, checkedEmail: normalizedEmail, isActive: true });
        }
      }
    }, 450);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [form.email, isAuthenticatedCustomer]);

  useEffect(() => {
    if (!form.deviceType) {
      setBrands([]);
      return;
    }

    let ignore = false;

    const loadBrands = async () => {
      setCatalogLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/bookings/catalog/brands?category=${form.deviceType}`);
        const data = await res.json();
        if (!ignore && data.success) {
          setBrands(Array.isArray(data.data) ? data.data : []);
        }
      } catch {
        if (!ignore) {
          setBrands([]);
        }
      } finally {
        if (!ignore) {
          setCatalogLoading(false);
        }
      }
    };

    loadBrands();

    return () => {
      ignore = true;
    };
  }, [form.deviceType]);

  useEffect(() => {
    if (!form.deviceType || !form.brand || form.brand === OTHER_BRAND) {
      setModels([]);
      return;
    }

    let ignore = false;

    const loadModels = async () => {
      setCatalogLoading(true);
      try {
        const params = new URLSearchParams({
          category: form.deviceType,
          brand: form.brand
        });
        const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/bookings/catalog/models?${params.toString()}`);
        const data = await res.json();
        if (!ignore && data.success) {
          setModels(Array.isArray(data.data) ? data.data : []);
        }
      } catch {
        if (!ignore) {
          setModels([]);
        }
      } finally {
        if (!ignore) {
          setCatalogLoading(false);
        }
      }
    };

    loadModels();

    return () => {
      ignore = true;
    };
  }, [form.brand, form.deviceType]);

  const resetBrandAndBelow = () => {
    update('brand', '');
    update('customBrand', '');
    update('model', '');
    update('customModel', '');
    update('issues', []);
    update('description', '');
    setModels([]);
    setModelSearch('');
  };

  const resetModelAndBelow = () => {
    update('model', '');
    update('customModel', '');
    update('issues', []);
    update('description', '');
    setModelSearch('');
  };

  const toggleIssue = (issueId) => {
    update(
      'issues',
      form.issues.includes(issueId)
        ? form.issues.filter((current) => current !== issueId)
        : [...form.issues, issueId]
    );
  };

  const canProceed = () => {
    if (step === 0) return Boolean(form.deviceType);
    if (step === 1) return Boolean(form.brand && (form.brand !== OTHER_BRAND || form.customBrand.trim()));
    if (step === 2) return Boolean(form.model && (form.model !== OTHER_MODEL || form.customModel.trim()));
    if (step === 3) return form.issues.length > 0;
    if (step === 4) {
      return Boolean(
        form.name.trim() &&
        form.phone.trim() &&
        form.email.trim() &&
        emailLookup.isActive &&
        (!emailLookup.exists || isAuthenticatedCustomer || form.accountPassword.trim()) &&
        form.address.trim() &&
        form.city.trim() &&
        form.state.trim() &&
        form.pincode.trim()
      );
    }
    if (step === 5) return Boolean(form.date && form.timeSlot);
    return true;
  };

  const next = () => {
    if (canProceed()) {
      setStep((current) => Math.min(current + 1, STEPS.length - 1));
    }
  };

  const back = () => {
    setError('');
    setStep((current) => Math.max(current - 1, 0));
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const token = isAuthenticatedCustomer ? localStorage.getItem('rv_token') : null;
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/bookings`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({
          deviceType: form.deviceType,
          brand: resolvedBrand,
          model: resolvedModel,
          repairTypes: selectedIssueLabels,
          issueDescription: form.description,
          customerName: form.name.trim(),
          customerPhone: form.phone.trim(),
          customerEmail: form.email.trim(),
          accountPassword: form.accountPassword,
          serviceType: form.serviceType,
          address: form.address.trim(),
          city: form.city.trim(),
          state: form.state.trim(),
          pincode: form.pincode.trim(),
          scheduledDate: form.date,
          scheduledTime: form.timeSlot
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setError(data.message || 'Booking failed. Please try again.');
        return;
      }

      setSubmitted(true);
    } catch {
      setError('Booking could not be submitted right now. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSendResetOtp = async () => {
    const normalizedEmail = form.email.trim().toLowerCase();
    if (!normalizedEmail) {
      setResetError('Enter your email first.');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetMessage('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/customer-auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setResetError(data.message || 'Could not send reset OTP.');
        return;
      }

      setResetMode(true);
      setResetMessage(data.message || 'OTP sent to your email.');
    } catch {
      setResetError('Could not send reset OTP right now.');
    } finally {
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    const normalizedEmail = form.email.trim().toLowerCase();
    if (!normalizedEmail || !resetOtp.trim() || !resetNewPassword.trim()) {
      setResetError('Enter OTP and a new password.');
      return;
    }

    setResetLoading(true);
    setResetError('');
    setResetMessage('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}/customer-auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: normalizedEmail,
          otp: resetOtp.trim(),
          newPassword: resetNewPassword
        })
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        setResetError(data.message || 'Password reset failed.');
        return;
      }

      update('accountPassword', resetNewPassword);
      setResetMessage('Password updated. You can continue booking now.');
      setResetOtp('');
      setResetNewPassword('');
      setResetMode(false);
    } catch {
      setResetError('Password reset failed right now.');
    } finally {
      setResetLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 size={40} className="text-emerald-400" />
          </div>
          <h1 className="text-3xl font-black font-['Outfit'] text-white mb-3">Booking Confirmed</h1>
          <p className="text-gray-400 mb-2">
            Your repair request for <span className="text-white font-semibold">{resolvedBrand} {resolvedModel}</span> has been received.
          </p>
          <p className="text-gray-500 text-sm mb-8">Our team will review the request and share the next update in your customer dashboard.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/" className="bg-white/5 border border-white/10 text-white font-bold px-6 py-3 rounded-xl hover:bg-white/10 transition-colors">
              Back to Home
            </Link>
            <Link
              to={localStorage.getItem('rv_token') ? '/dashboard' : '/customer-login'}
              className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-6 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] transition-all"
            >
              Track Order
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-6">
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-sm font-bold">RV</div>
            <span className="text-lg font-bold font-['Outfit'] text-white">Repair<span className="text-blue-400">Vafe</span></span>
          </Link>
          <h1 className="text-2xl font-black font-['Outfit'] text-white">Book a Repair</h1>
          <p className="text-gray-500 text-sm mt-1">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
        </div>

        <div className="flex gap-1.5 mb-8">
          {STEPS.map((item, index) => (
            <div
              key={item}
              className={`h-1 flex-1 rounded-full transition-all duration-300 ${index <= step ? 'bg-blue-500' : 'bg-white/10'}`}
            />
          ))}
        </div>

        <div className="bg-[#0d1422] border border-white/5 rounded-3xl p-6 md:p-8 shadow-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.25 }}
            >
              {step === 0 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white font-['Outfit']">Choose your device type</h2>
                  <div className="grid md:grid-cols-4 sm:grid-cols-2 gap-3">
                    {DEVICE_TYPES.map((device) => (
                      <button
                        key={device.id}
                        type="button"
                        onClick={() => {
                          if (form.deviceType !== device.id) {
                            update('deviceType', device.id);
                            resetBrandAndBelow();
                          }
                        }}
                        className={`flex flex-col items-start gap-3 p-5 rounded-2xl border transition-all ${form.deviceType === device.id ? 'border-blue-500 bg-blue-500/10 text-blue-400' : 'border-white/5 bg-white/[0.02] text-gray-400 hover:border-white/15'}`}
                      >
                        <device.icon size={24} />
                        <span className="text-base font-semibold">{device.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-white font-['Outfit']">Select {selectedDevice?.label} brand</h2>
                      <p className="text-gray-500 text-sm mt-1">Choose the correct brand to continue to the model page.</p>
                    </div>
                    {catalogLoading && <Loader2 size={18} className="animate-spin text-blue-400" />}
                  </div>
                  <div className="grid md:grid-cols-4 sm:grid-cols-3 grid-cols-2 gap-3">
                    {displayedBrands.map((brand) => (
                      <button
                        key={brand}
                        type="button"
                        onClick={() => {
                          if (form.brand !== brand) {
                            update('brand', brand);
                            update('customBrand', '');
                            resetModelAndBelow();
                          }
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all ${form.brand === brand ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/5 bg-white/[0.02] text-gray-300 hover:border-white/15'}`}
                      >
                        <div className="text-sm font-semibold">{brand}</div>
                      </button>
                    ))}
                  </div>
                  {form.brand === OTHER_BRAND && (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Enter Brand Name *</label>
                      <input
                        type="text"
                        value={form.customBrand}
                        onChange={(e) => update('customBrand', e.target.value)}
                        placeholder="Enter your device brand"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  )}
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-white font-['Outfit']">Select your model</h2>
                      <p className="text-gray-500 text-sm mt-1">Brand selected: <span className="text-white">{resolvedBrand}</span></p>
                    </div>
                    <div className="relative w-full md:w-72">
                      <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="text"
                        value={modelSearch}
                        onChange={(e) => setModelSearch(e.target.value)}
                        placeholder="Search model"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div className="grid md:grid-cols-3 sm:grid-cols-2 gap-3">
                    {displayedModels.map((model) => (
                      <button
                        key={model}
                        type="button"
                        onClick={() => {
                          update('model', model);
                          if (model !== OTHER_MODEL) {
                            update('customModel', '');
                          }
                          update('issues', []);
                        }}
                        className={`p-4 rounded-2xl border text-left transition-all ${form.model === model ? 'border-blue-500 bg-blue-500/10 text-white' : 'border-white/5 bg-white/[0.02] text-gray-300 hover:border-white/15'}`}
                      >
                        <div className="text-sm font-semibold">{model}</div>
                      </button>
                    ))}
                  </div>
                  {form.model === OTHER_MODEL && (
                    <div>
                      <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Enter Model Name *</label>
                      <input
                        type="text"
                        value={form.customModel}
                        onChange={(e) => update('customModel', e.target.value)}
                        placeholder="Enter your exact model"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  )}
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white font-['Outfit']">Select service options</h2>
                  <p className="text-gray-500 text-sm">Choose one or more repair services for {resolvedBrand} {resolvedModel}.</p>
                  <div className="grid md:grid-cols-2 gap-3">
                    {availableIssues.map((issue) => (
                      <button
                        key={issue.id}
                        type="button"
                        onClick={() => toggleIssue(issue.id)}
                        className={`flex items-start gap-3 p-4 rounded-2xl border transition-all text-left ${form.issues.includes(issue.id) ? 'border-blue-500 bg-blue-500/10' : 'border-white/5 bg-white/[0.02] hover:border-white/15'}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${form.issues.includes(issue.id) ? 'bg-blue-500/20 text-blue-400' : 'bg-white/5 text-gray-400'}`}>
                          <issue.icon size={18} />
                        </div>
                        <div className="flex-1">
                          <div className={`text-sm font-semibold ${form.issues.includes(issue.id) ? 'text-white' : 'text-gray-300'}`}>{issue.label}</div>
                          <div className="text-xs text-gray-500 mt-1">{issue.price}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Service preference</label>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'pickup', label: 'Pickup', desc: 'Doorstep pickup' },
                        { id: 'dropoff', label: 'Store Dropoff', desc: 'Dropoff at store' },
                        { id: 'walkin', label: 'Store Visit', desc: 'Visit the service center' }
                      ].map((option) => (
                        <button
                          key={option.id}
                          type="button"
                          onClick={() => update('serviceType', option.id)}
                          className={`rounded-2xl border p-3 text-left transition-all ${form.serviceType === option.id ? 'bg-blue-500/10 border-blue-500 text-white' : 'bg-white/[0.02] border-white/10 text-gray-300 hover:border-white/20'}`}
                        >
                          <div className="text-sm font-semibold">{option.label}</div>
                          <div className="text-[11px] text-gray-500 mt-1">{option.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Describe the issue (optional)</label>
                    <textarea
                      rows={4}
                      value={form.description}
                      onChange={(e) => update('description', e.target.value)}
                      placeholder="Add any extra details about the problem"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>
                </div>
              )}

              {step === 4 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white font-['Outfit']">Your contact details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">Full Name *</label>
                      <input
                        type="text"
                        value={form.name}
                        onChange={(e) => update('name', e.target.value)}
                        placeholder="Your full name"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">Mobile *</label>
                      <input
                        type="tel"
                        value={form.phone}
                        onChange={(e) => update('phone', e.target.value)}
                        placeholder="10-digit mobile number"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2">Email *</label>
                    <div className="relative">
                      <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => {
                          update('email', e.target.value);
                          update('accountPassword', '');
                          setResetMode(false);
                          setResetOtp('');
                          setResetNewPassword('');
                          setResetMessage('');
                          setResetError('');
                        }}
                        placeholder="you@example.com"
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    {emailLookup.checking && (
                      <div className="text-xs text-blue-400 mt-2 flex items-center gap-2">
                        <Loader2 size={12} className="animate-spin" /> Checking customer account
                      </div>
                    )}
                    {!emailLookup.checking && emailLookup.exists && !isAuthenticatedCustomer && (
                      <div className="mt-3 space-y-3">
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                          This email already has a customer account. Enter the password to continue with booking.
                        </div>
                        <div className="relative">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input
                            type="password"
                            value={form.accountPassword}
                            onChange={(e) => update('accountPassword', e.target.value)}
                            placeholder="Enter account password"
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div className="flex flex-wrap items-center gap-3 text-xs">
                          <button
                            type="button"
                            onClick={handleSendResetOtp}
                            disabled={resetLoading}
                            className="text-blue-400 hover:underline disabled:opacity-50"
                          >
                            Forgot password? Send OTP to email
                          </button>
                          {!emailLookup.isActive && (
                            <span className="text-red-400">This account is inactive. Contact support.</span>
                          )}
                        </div>
                        {resetMode && (
                          <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                            <div className="text-sm font-semibold text-white">Reset password</div>
                            <input
                              type="text"
                              value={resetOtp}
                              onChange={(e) => setResetOtp(e.target.value.replace(/\D/g, ''))}
                              maxLength={6}
                              placeholder="Enter 6-digit OTP"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            <input
                              type="password"
                              value={resetNewPassword}
                              onChange={(e) => setResetNewPassword(e.target.value)}
                              placeholder="New password"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                            />
                            <div className="flex gap-3">
                              <button
                                type="button"
                                onClick={handleResetPassword}
                                disabled={resetLoading}
                                className="bg-blue-600 text-white font-semibold px-4 py-2 rounded-xl text-sm disabled:opacity-50"
                              >
                                {resetLoading ? 'Updating...' : 'Update Password'}
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setResetMode(false);
                                  setResetOtp('');
                                  setResetNewPassword('');
                                  setResetError('');
                                  setResetMessage('');
                                }}
                                className="text-gray-400 hover:text-white text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}
                        {resetMessage && (
                          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
                            {resetMessage}
                          </div>
                        )}
                        {resetError && (
                          <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300 flex items-start gap-2">
                            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                            <span>{resetError}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2">Street Address *</label>
                    <input
                      type="text"
                      value={form.address}
                      onChange={(e) => update('address', e.target.value)}
                      placeholder="House no, street, area"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">City *</label>
                      <input
                        type="text"
                        value={form.city}
                        onChange={(e) => update('city', e.target.value)}
                        placeholder="City"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">State *</label>
                      <input
                        type="text"
                        value={form.state}
                        onChange={(e) => update('state', e.target.value)}
                        placeholder="State"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">Pincode *</label>
                      <input
                        type="text"
                        value={form.pincode}
                        onChange={(e) => update('pincode', e.target.value)}
                        placeholder="6-digit pincode"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 5 && (
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-white font-['Outfit']">Pick a date and time</h2>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Preferred Date</label>
                    <input
                      type="date"
                      value={form.date}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => update('date', e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Time Slot</label>
                    <div className="grid md:grid-cols-4 grid-cols-2 gap-2">
                      {TIME_SLOTS.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => update('timeSlot', slot)}
                          className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${form.timeSlot === slot ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'}`}
                        >
                          {slot}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {step === 6 && (
                <div className="space-y-4">
                  <h2 className="text-xl font-bold text-white font-['Outfit']">Confirm your booking</h2>
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl divide-y divide-white/5">
                    {[
                      { label: 'Device Type', value: selectedDevice?.label || form.deviceType },
                      { label: 'Brand', value: resolvedBrand },
                      { label: 'Model', value: resolvedModel },
                      { label: 'Services', value: selectedIssueLabels.join(', ') },
                      { label: 'Service Mode', value: formatServiceType(form.serviceType) },
                      { label: 'Customer', value: `${form.name} • ${form.phone}` },
                      { label: 'Email', value: form.email },
                      { label: 'Location', value: `${form.address}, ${form.city}, ${form.state} - ${form.pincode}` },
                      { label: 'Schedule', value: `${form.date} at ${form.timeSlot}` }
                    ].map((row) => (
                      <div key={row.label} className="flex justify-between gap-3 px-5 py-3.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500">{row.label}</span>
                        <span className="text-sm font-medium text-right text-white">{row.value}</span>
                      </div>
                    ))}
                  </div>
                  {form.description && (
                    <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                      <div className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Issue Notes</div>
                      <p className="text-sm text-gray-300">{form.description}</p>
                    </div>
                  )}
                  {error && (
                    <div className="text-red-400 text-sm bg-red-400/10 border border-red-400/20 rounded-xl px-4 py-3">
                      {error}
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between mt-8">
            <button
              type="button"
              onClick={back}
              disabled={step === 0 || loading}
              className="flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronLeft size={16} /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button
                type="button"
                onClick={next}
                disabled={!canProceed() || loading}
                className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:shadow-[0_0_20px_rgba(59,130,246,0.4)] disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2"
              >
                Continue <ChevronRight size={16} />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="bg-gradient-to-r from-emerald-600 to-teal-500 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:shadow-[0_0_20px_rgba(16,185,129,0.4)] disabled:opacity-40 transition-all flex items-center gap-2"
              >
                {loading ? <><Loader2 size={16} className="animate-spin" /> Booking...</> : <><CheckCircle2 size={16} /> Confirm Booking</>}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
