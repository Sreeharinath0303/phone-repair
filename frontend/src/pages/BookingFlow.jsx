import React, { useEffect, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  Smartphone, ChevronLeft, ChevronRight, Loader2, CheckCircle2,
  Monitor, Cpu, Wrench, Battery, Search, Mail, Lock, AlertCircle, MessageCircle
} from 'lucide-react';
import { getApiBaseUrl } from '../utils/apiBase';
import { NotFound } from './NotFound.jsx';
import { Seo } from '../components/Seo';
import { buildBreadcrumbSchema, buildLocalBusinessSchema, buildServiceSchema } from '../utils/seo';

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
    Apple: [
      'iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15 Plus', 'iPhone 15', 
      'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14 Plus', 'iPhone 14', 
      'iPhone 13 Pro Max', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 13 mini',
      'iPhone 12 Pro Max', 'iPhone 12 Pro', 'iPhone 12', 'iPhone 12 mini',
      'iPhone 11 Pro Max', 'iPhone 11 Pro', 'iPhone 11',
      'iPhone SE (3rd Gen)', 'iPhone SE (2nd Gen)', 'Other Model'
    ],
    Samsung: [
      'Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24',
      'Galaxy S23 Ultra', 'Galaxy S23+', 'Galaxy S23', 'Galaxy S23 FE',
      'Galaxy S22 Ultra', 'Galaxy S22+', 'Galaxy S22',
      'Galaxy S21 Ultra', 'Galaxy S21 FE',
      'Galaxy Z Fold 5', 'Galaxy Z Fold 4', 'Galaxy Z Fold 3',
      'Galaxy Z Flip 5', 'Galaxy Z Flip 4', 'Galaxy Z Flip 3',
      'Galaxy A55', 'Galaxy A54', 'Galaxy A53', 'Galaxy A35', 'Galaxy A34', 'Galaxy A15', 'Galaxy M34', 'Other Model'
    ],
    Vivo: ['Vivo X100 Pro', 'Vivo X100', 'Vivo X90 Pro', 'Vivo V30 Pro', 'Vivo V30', 'Vivo V29 Pro', 'Vivo V29', 'Vivo T3', 'Vivo T2 Pro', 'Vivo Y200', 'Other Model'],
    Oppo: ['Oppo Find X7 Ultra', 'Oppo Find X7', 'Oppo Find N3 Flip', 'Oppo Reno 11 Pro', 'Oppo Reno 11', 'Oppo Reno 10 Pro', 'Oppo F27', 'Oppo F25 Pro', 'Oppo A79', 'Other Model'],
    Xiaomi: ['Xiaomi 14 Ultra', 'Xiaomi 14', 'Xiaomi 13 Pro', 'Redmi Note 13 Pro+', 'Redmi Note 13 Pro', 'Redmi Note 13', 'Redmi Note 12 Pro', 'Redmi 13C', 'Redmi 12', 'Other Model'],
    Realme: ['Realme 12 Pro+', 'Realme 12 Pro', 'Realme 12', 'Realme GT 6', 'Realme GT 5 Pro', 'Realme Narzo 70 Pro', 'Realme Narzo 60', 'Realme C67', 'Other Model'],
    OnePlus: ['OnePlus 12', 'OnePlus 12R', 'OnePlus 11', 'OnePlus 11R', 'OnePlus Open', 'OnePlus Nord 3', 'OnePlus Nord CE 4', 'OnePlus Nord CE 3 Lite', 'Other Model'],
    Google: ['Pixel 8 Pro', 'Pixel 8', 'Pixel 8a', 'Pixel 7 Pro', 'Pixel 7', 'Pixel 7a', 'Pixel Fold', 'Pixel 6 Pro', 'Pixel 6a', 'Other Model'],
    Nothing: ['Nothing Phone (2)', 'Nothing Phone (2a)', 'Nothing Phone (1)', 'Other Model'],
    Motorola: ['Moto Edge 50 Pro', 'Moto Edge 40 Neo', 'Moto Razr 40 Ultra', 'Moto G84', 'Moto G54', 'Moto G34', 'Other Model'],
    Nokia: ['Nokia G42', 'Nokia X30', 'Nokia C32', 'Nokia G22', 'Other Model'],
    Poco: ['Poco F6 Pro', 'Poco F6', 'Poco X6 Pro', 'Poco X6', 'Poco M6 Pro', 'Poco C65', 'Other Model'],
    IQOO: ['iQOO 12', 'iQOO Neo 9 Pro', 'iQOO Neo 7 Pro', 'iQOO Z9', 'iQOO Z7 Pro', 'Other Model'],
    Infinix: ['Infinix Note 40 Pro', 'Infinix GT 20 Pro', 'Infinix Zero 30', 'Infinix Hot 40', 'Other Model'],
    Tecno: ['Tecno Phantom V Fold', 'Tecno Camon 30 Pro', 'Tecno Camon 20', 'Tecno Pova 6 Pro', 'Tecno Spark 20', 'Other Model'],
    Huawei: ['Huawei Pura 70 Ultra', 'Huawei P60 Pro', 'Huawei Mate 60 Pro', 'Huawei Nova 12', 'Other Model'],
    Honor: ['Honor Magic 6 Pro', 'Honor Magic V2', 'Honor 200 Pro', 'Honor 200', 'Honor X9b', 'Honor 90', 'Other Model'],
    Asus: ['ROG Phone 8 Pro', 'ROG Phone 8', 'ROG Phone 7', 'Zenfone 11 Ultra', 'Zenfone 10', 'Other Model'],
    Sony: ['Xperia 1 V', 'Xperia 5 V', 'Xperia 10 V', 'Xperia 1 IV', 'Other Model'],
    Lava: ['Lava Agni 2', 'Lava Blaze Curve', 'Lava Blaze 2 5G', 'Lava Storm 5G', 'Other Model'],
    Other: ['Other Model']
  },
  tablet: {
    Apple: [
      'iPad Pro 13-inch (M4)', 'iPad Pro 11-inch (M4)', 'iPad Pro 12.9-inch (6th Gen)', 
      'iPad Air 13-inch (M2)', 'iPad Air 11-inch (M2)', 'iPad Air (5th Gen)',
      'iPad (10th Gen)', 'iPad (9th Gen)', 'iPad mini (6th Gen)', 'Other Model'
    ],
    Samsung: [
      'Galaxy Tab S9 Ultra', 'Galaxy Tab S9+', 'Galaxy Tab S9', 'Galaxy Tab S9 FE',
      'Galaxy Tab S8 Ultra', 'Galaxy Tab S8+', 'Galaxy Tab S8',
      'Galaxy Tab A9+', 'Galaxy Tab A9', 'Galaxy Tab A8', 'Other Model'
    ],
    Lenovo: ['Tab P12 Pro', 'Tab P12', 'Tab P11 Pro', 'Tab M11', 'Tab M10 Plus', 'Tab M9', 'Legion Y700', 'Other Model'],
    Xiaomi: ['Xiaomi Pad 6S Pro', 'Xiaomi Pad 6', 'Xiaomi Pad 5', 'Redmi Pad SE', 'Redmi Pad', 'Other Model'],
    Realme: ['Realme Pad 2', 'Realme Pad X', 'Realme Pad Mini', 'Other Model'],
    Honor: ['Honor Pad 9', 'Honor Pad X9', 'Honor Pad 8', 'Other Model'],
    Huawei: ['MatePad Pro 13.2', 'MatePad Pro 11', 'MatePad 11.5', 'MatePad SE', 'Other Model'],
    Other: ['Other Model']
  },
  laptop: {
    Apple: [
      'MacBook Air 13" (M3)', 'MacBook Air 15" (M3)', 'MacBook Air 13" (M2)', 'MacBook Air 15" (M2)', 'MacBook Air (M1)',
      'MacBook Pro 14" (M3)', 'MacBook Pro 16" (M3)', 'MacBook Pro 14" (M2)', 'MacBook Pro 16" (M2)',
      'MacBook Pro 13" (M2)', 'MacBook Pro 14" (M1)', 'MacBook Pro 16" (M1)', 'Other Model'
    ],
    Dell: [
      'XPS 13', 'XPS 14', 'XPS 16', 'XPS 15', 
      'Inspiron 14', 'Inspiron 15', 'Inspiron 16', 
      'Alienware m16', 'Alienware m18', 'Alienware x14',
      'Latitude 5440', 'Latitude 7440', 'Precision 3580', 'Other Model'
    ],
    HP: [
      'Spectre x360 14', 'Spectre x360 16', 
      'Envy x360', 'Envy 16', 
      'Pavilion 14', 'Pavilion 15', 'Pavilion Aero 13',
      'Omen 16', 'Omen Transcend 14', 'Victus 15', 'Victus 16',
      'EliteBook 840', 'ProBook 450', 'Other Model'
    ],
    Lenovo: [
      'ThinkPad X1 Carbon', 'ThinkPad T14', 'ThinkPad E14', 'ThinkPad E16',
      'Yoga 9i', 'Yoga 7i', 'Yoga Pro 9i',
      'IdeaPad Slim 5', 'IdeaPad Slim 3', 'IdeaPad Flex 5',
      'Legion Pro 7i', 'Legion Pro 5i', 'Legion Slim 5', 'LOQ 15', 'Other Model'
    ],
    Asus: [
      'Zenbook 14 OLED', 'Zenbook Pro 14 Duo', 
      'Vivobook 15', 'Vivobook 16X', 'Vivobook S 15',
      'ROG Zephyrus G14', 'ROG Zephyrus G16', 'ROG Strix SCAR 16',
      'TUF Gaming A15', 'TUF Gaming F15', 'ExpertBook B5', 'Other Model'
    ],
    Acer: [
      'Swift X 14', 'Swift Go 14', 'Swift 3',
      'Aspire 5', 'Aspire 7', 'Aspire 3',
      'Predator Helios 16', 'Predator Helios Neo 16',
      'Nitro V 15', 'Nitro 5', 'Other Model'
    ],
    MSI: ['Titan 18 HX', 'Raider GE78', 'Stealth 14', 'Stealth 16', 'Katana 15', 'Cyborg 15', 'GF63 Thin', 'Prestige 16', 'Modern 14', 'Other Model'],
    Samsung: ['Galaxy Book4 Ultra', 'Galaxy Book4 Pro', 'Galaxy Book4 Pro 360', 'Galaxy Book3 Ultra', 'Galaxy Book3 Pro', 'Galaxy Book2', 'Other Model'],
    Microsoft: ['Surface Laptop 6', 'Surface Laptop 5', 'Surface Laptop Go 3', 'Surface Pro 10', 'Surface Pro 9', 'Surface Laptop Studio 2', 'Other Model'],
    Other: ['Other Model']
  },
  smartwatch: {
    Apple: ['Apple Watch Ultra 2', 'Apple Watch Ultra', 'Apple Watch Series 9', 'Apple Watch Series 8', 'Apple Watch Series 7', 'Apple Watch SE (2nd Gen)', 'Other Model'],
    Samsung: ['Galaxy Watch 6 Classic', 'Galaxy Watch 6', 'Galaxy Watch 5 Pro', 'Galaxy Watch 5', 'Galaxy Watch 4 Classic', 'Galaxy Watch 4', 'Other Model'],
    Garmin: ['Fenix 7 Pro', 'Epix Pro (Gen 2)', 'Forerunner 965', 'Forerunner 265', 'Venu 3', 'Venu Sq 2', 'Instinct 2', 'Other Model'],
    Fossil: ['Gen 6 Wellness Edition', 'Gen 6', 'Hybrid HR', 'Other Model'],
    Fitbit: ['Sense 2', 'Versa 4', 'Charge 6', 'Charge 5', 'Inspire 3', 'Other Model'],
    Amazfit: ['Cheetah Pro', 'GTR 4', 'GTS 4', 'T-Rex Ultra', 'T-Rex 2', 'Bip 5', 'Active', 'Other Model'],
    Noise: ['ColorFit Pro 5 Max', 'ColorFit Pro 5', 'ColorFit Ultra 3', 'Halo Plus', 'Other Model'],
    boAt: ['Lunar Pro LTE', 'Xtend Pro', 'Wave Sigma', 'Storm Call 3', 'Other Model'],
    Other: ['Other Model']
  }
};

const ISSUE_TYPES_MAP = {
  smartphone: [
    { id: 'screen', label: 'Screen Damage', icon: Monitor },
    { id: 'battery', label: 'Battery Issue', icon: Battery },
    { id: 'camera', label: 'Camera Fault', icon: Cpu },
    { id: 'charging', label: 'Charging Port', icon: Wrench },
    { id: 'water', label: 'Water Damage', icon: Wrench },
    { id: 'back_glass', label: 'Back Glass', icon: Smartphone }
  ],
  tablet: [
    { id: 'screen', label: 'Screen Replacement', icon: Monitor },
    { id: 'battery', label: 'Battery Issue', icon: Battery },
    { id: 'charging', label: 'Charging Port', icon: Wrench },
    { id: 'water', label: 'Water Damage', icon: Wrench },
    { id: 'software', label: 'Software Issue', icon: Cpu }
  ],
  laptop: [
    { id: 'screen', label: 'Screen / Display', icon: Monitor },
    { id: 'battery', label: 'Battery Replacement', icon: Battery },
    { id: 'keyboard', label: 'Keyboard Issue', icon: Wrench },
    { id: 'motherboard', label: 'Motherboard / Chip', icon: Cpu },
    { id: 'software', label: 'OS / Software', icon: Monitor },
    { id: 'cleaning', label: 'Overheating / Cleaning', icon: Wrench }
  ],
  smartwatch: [
    { id: 'screen', label: 'Screen Damage', icon: Monitor },
    { id: 'battery', label: 'Battery Replacement', icon: Battery },
    { id: 'strap', label: 'Strap / Body', icon: Wrench },
    { id: 'sensor', label: 'Sensor Issue', icon: Cpu },
    { id: 'water', label: 'Water Damage', icon: Wrench }
  ]
};

const TIME_SLOTS = ['10:00 AM', '11:00 AM', '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM', '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM', '08:00 PM', '09:00 PM'];
const OTHER_BRAND = 'Other';
const OTHER_MODEL = 'Other Model';
const CUSTOM_TIME_SLOT = 'custom';

const formatServiceType = (serviceType) => {
  if (serviceType === 'dropoff') return 'Store Dropoff';
  if (serviceType === 'walkin') return 'Store Visit';
  return 'Pickup';
};

const formatDeviceType = (deviceType) => {
  if (!deviceType) return '';
  return CATEGORY_LABEL_MAP[deviceType] || `${deviceType.charAt(0).toUpperCase()}${deviceType.slice(1)}`;
};

const WHATSAPP_PHONE_NUMBER = '919148136086';
const DEFAULT_WHATSAPP_LINK = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE_NUMBER}`;
const CATEGORY_SLUG_MAP = {
  smartphone: 'phone',
  tablet: 'tablet',
  laptop: 'laptop',
  smartwatch: 'smartwatch'
};
const CATEGORY_LABEL_MAP = {
  smartphone: 'Phone',
  tablet: 'Tablet',
  laptop: 'Laptop',
  smartwatch: 'Smartwatch'
};

const slugify = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const buildBrandCategorySlug = (brand, category) => `${slugify(brand)}-${CATEGORY_SLUG_MAP[category] || slugify(category)}-repair`;

const parseBrandCategorySlug = (value) => {
  const slug = slugify(value);
  if (!slug.endsWith('-repair')) {
    return { brandSlug: slug, category: null, isCanonical: false };
  }

  const core = slug.slice(0, -'-repair'.length);
  const entry = Object.entries(CATEGORY_SLUG_MAP).find(([, alias]) => core.endsWith(`-${alias}`));
  if (!entry) {
    return null;
  }

  const [category, alias] = entry;
  const brandSlug = core.slice(0, -(`-${alias}`).length);
  if (!brandSlug) {
    return null;
  }

  return { brandSlug, category, isCanonical: true };
};

const buildWhatsAppUrl = (baseLink, message) => {
  const fallbackBase = `https://api.whatsapp.com/send?phone=${WHATSAPP_PHONE_NUMBER}`;
  const normalizedBase = String(baseLink || '').trim();
  const text = encodeURIComponent(message);

  if (!normalizedBase) {
    return `${fallbackBase}&text=${text}`;
  }

  const directPhone = normalizedBase.replace(/\D/g, '');
  if (directPhone.length >= 10 && directPhone.length <= 15) {
    return `https://api.whatsapp.com/send?phone=${directPhone}&text=${text}`;
  }

  try {
    const parsedUrl = new URL(/^https?:\/\//i.test(normalizedBase) ? normalizedBase : `https://${normalizedBase}`);
    const hostname = parsedUrl.hostname.replace(/^www\./i, '').toLowerCase();
    const pathSegments = parsedUrl.pathname.split('/').filter(Boolean);
    const phoneFromQuery = parsedUrl.searchParams.get('phone')?.replace(/\D/g, '') || '';
    const phoneFromPath = (
      (hostname === 'wa.me' && pathSegments[0] && /^\d{10,15}$/.test(pathSegments[0]))
        ? pathSegments[0]
        : ''
    );
    const resolvedPhone = phoneFromQuery || phoneFromPath || WHATSAPP_PHONE_NUMBER;

    return `https://api.whatsapp.com/send?phone=${resolvedPhone}&text=${text}`;
  } catch {
    return `${fallbackBase}&text=${text}`;
  }
};

const formatCustomTime = (value) => {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) return '';
  const [hoursText, minutes] = value.split(':');
  const hours = Number(hoursText);
  if (Number.isNaN(hours)) return '';
  const suffix = hours >= 12 ? 'PM' : 'AM';
  const normalizedHours = hours % 12 || 12;
  return `${String(normalizedHours).padStart(2, '0')}:${minutes} ${suffix}`;
};

const resolveScheduledTime = (timeSlot, customTime) => (
  timeSlot === CUSTOM_TIME_SLOT ? formatCustomTime(customTime) : timeSlot
);

const buildWhatsAppMessage = ({ bookingRef, form, resolvedBrand, resolvedModel, selectedIssueLabels }) => {
  const formattedAddress = [form.address.trim(), form.city.trim(), form.state.trim(), form.pincode.trim()]
    .filter(Boolean)
    .join(', ');
  const normalizedDescription = form.description.trim();
  const normalizedOfferCode = form.offerCode.trim().toUpperCase();
  const lines = [
    'Hello eRepairCafe team, I have submitted a new repair booking.',
    '',
    '*New Order Details*',
    `*Booking Ref:* ${bookingRef || 'Pending Reference'}`,
    `*Customer Name:* ${form.name.trim()}`,
    `*Phone:* ${form.phone.trim()}`,
    `*Email:* ${form.email.trim()}`,
    `*Device Type:* ${formatDeviceType(form.deviceType)}`,
    `*Brand:* ${resolvedBrand}`,
    `*Model:* ${resolvedModel}`,
    `*Repair Type:* ${selectedIssueLabels.join(', ')}`,
    `*Service Mode:* ${formatServiceType(form.serviceType)}`,
    `*Preferred Schedule:* ${form.date} at ${resolveScheduledTime(form.timeSlot, form.customTime)}`,
    `*Pickup / Store Details:* ${formattedAddress || 'Not provided'}`
  ];

  if (normalizedDescription) {
    lines.push(`*Issue Details:* ${normalizedDescription}`);
  }

  if (normalizedOfferCode) {
    lines.push(`*Promo Code:* ${normalizedOfferCode}`);
  }

  return lines.join('\n');
};

export const BookingFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { brandCategorySlug, modelSlug } = useParams();
  const apiBaseUrl = getApiBaseUrl();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');
  const [brands, setBrands] = useState([]);
  const [models, setModels] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [routeResolving, setRouteResolving] = useState(Boolean(brandCategorySlug || modelSlug));
  const [routeNotFound, setRouteNotFound] = useState(false);
  const [bookingResult, setBookingResult] = useState(null);
  const [redirectCountdown, setRedirectCountdown] = useState(3);
  const [whatsAppLink, setWhatsAppLink] = useState(DEFAULT_WHATSAPP_LINK);
  const [publicOffers, setPublicOffers] = useState([]);
  const [modelSearch, setModelSearch] = useState('');
  const [emailLookup, setEmailLookup] = useState({
    checking: false,
    exists: false,
    checkedEmail: '',
    checkedPhone: '',
    isActive: true,
    matchedBy: '',
    message: ''
  });
  const [resetMode, setResetMode] = useState(false);
  const [resetOtp, setResetOtp] = useState('');
  const [resetNewPassword, setResetNewPassword] = useState('');
  const [resetLoading, setResetLoading] = useState(false);
  const [resetMessage, setResetMessage] = useState('');
  const [resetError, setResetError] = useState('');

  const [customerSession, setCustomerSession] = useState(() => {
    const token = localStorage.getItem('rv_role') === 'customer' ? localStorage.getItem('rv_token') : '';
    const user = token ? JSON.parse(localStorage.getItem('rv_user') || '{}') : {};
    return { token: token || '', user };
  });
  const savedUser = customerSession.user || {};
  const isAuthenticatedCustomer = Boolean(customerSession.token);

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
    customTime: '',
    serviceType: 'pickup'
    ,
    offerCode: ''
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
  const scheduledTimeLabel = resolveScheduledTime(form.timeSlot, form.customTime);
  const normalizedOfferCode = form.offerCode.trim().toUpperCase();

  const categoryBookingLabel = selectedDevice ? CATEGORY_LABEL_MAP[selectedDevice.id] || selectedDevice.label : '';
  const bookingPageTitle = resolvedBrand && resolvedModel
    ? `Book ${resolvedBrand} ${resolvedModel} Repair`
    : resolvedBrand
      ? `Book ${resolvedBrand} ${categoryBookingLabel} Repair`
      : 'Book a Repair';
  const bookingSeoDescription = resolvedBrand && resolvedModel
    ? `Book a repair for ${resolvedBrand} ${resolvedModel} with erepaircafe. Fast doorstep service, transparent pricing, and instant WhatsApp support in Bengaluru.`
    : resolvedBrand
      ? `Book a repair for ${resolvedBrand} ${categoryBookingLabel || 'device'} devices with erepaircafe. Choose your model, service type, and preferred schedule online.`
      : 'Book your repair with erepaircafe. Select your device, model, repair type, and preferred schedule online.';
  const bookingStructuredData = [
    buildLocalBusinessSchema(location.pathname),
    buildServiceSchema({
      name: resolvedBrand && resolvedModel
        ? `${resolvedBrand} ${resolvedModel} Repair`
        : resolvedBrand
          ? `${resolvedBrand} ${categoryBookingLabel || 'Device'} Repair`
          : 'Device Repair Booking',
      description: bookingSeoDescription,
      path: location.pathname
    }),
    buildBreadcrumbSchema([
      { name: 'Home', path: '/' },
      { name: 'Book Repair', path: location.pathname }
    ])
  ];

  useEffect(() => {
    const fetchPublicSettings = async () => {
      try {
        const res = await fetch(`${apiBaseUrl}/settings/public`);
        const result = await res.json();
        if (result.success && result.data) {
          if (result.data.whatsappLink) {
            setWhatsAppLink(result.data.whatsappLink);
          }
          setPublicOffers(Array.isArray(result.data.offers) ? result.data.offers : []);
        }
      } catch {
        setWhatsAppLink(DEFAULT_WHATSAPP_LINK);
        setPublicOffers([]);
      }
    };

    fetchPublicSettings();
  }, [apiBaseUrl]);

  useEffect(() => {
    if (!brandCategorySlug && !modelSlug) {
      setRouteNotFound(false);
      return;
    }

    let ignore = false;

    const resolveRouteSelection = async () => {
      setRouteResolving(true);
      setRouteNotFound(false);

      try {
        const parsedSlug = parseBrandCategorySlug(brandCategorySlug);
        if (brandCategorySlug && !parsedSlug) {
          if (!ignore) setRouteNotFound(true);
          return;
        }

        const brandRes = await fetch(`${apiBaseUrl}/bookings/catalog/brands`);
        const brandData = await brandRes.json();
        const brandList = Array.isArray(brandData.data) ? brandData.data : [];
        const candidateBrands = parsedSlug?.category
          ? brandList.filter((brand) => brand.category === parsedSlug.category)
          : brandList;
        const slugMatches = candidateBrands.filter((brand) => slugify(brand.name) === parsedSlug.brandSlug);
        const fallbackBrandName = (BRAND_FALLBACKS[parsedSlug?.category] || []).find(
          (brandName) => slugify(brandName) === parsedSlug.brandSlug
        );
        const matchedBrand = slugMatches[0] || (
          fallbackBrandName
            ? { name: fallbackBrandName, category: parsedSlug.category }
            : null
        );

        if (!parsedSlug.isCanonical && slugMatches.length > 1) {
          if (!ignore) setRouteNotFound(true);
          return;
        }

        if (!matchedBrand) {
          if (!ignore) setRouteNotFound(true);
          return;
        }

        if (ignore) return;

        setForm((current) => ({
          ...current,
          deviceType: matchedBrand.category,
          brand: matchedBrand.name,
          customBrand: '',
          model: '',
          customModel: '',
          issues: [],
          description: ''
        }));
        setStep(modelSlug ? 3 : 2);

        if (!modelSlug) {
          return;
        }

        const params = new URLSearchParams({
          category: matchedBrand.category,
          brand: matchedBrand.name
        });

        const modelRes = await fetch(`${apiBaseUrl}/bookings/catalog/models?${params.toString()}`);
        const modelData = await modelRes.json();
        const modelList = Array.isArray(modelData.data) ? modelData.data : [];
        const fallbackModels = MODEL_FALLBACKS[matchedBrand.category]?.[matchedBrand.name]
          || MODEL_FALLBACKS[matchedBrand.category]?.[OTHER_BRAND]
          || [];
        const matchedModel = modelList.find((model) => slugify(model.name) === modelSlug) || (
          fallbackModels.find((modelName) => slugify(modelName) === modelSlug)
            ? { name: fallbackModels.find((modelName) => slugify(modelName) === modelSlug) }
            : null
        );

        if (!matchedModel) {
          if (!ignore) setRouteNotFound(true);
          return;
        }

        if (!ignore) {
          setForm((current) => ({
            ...current,
            deviceType: matchedBrand.category,
            brand: matchedBrand.name,
            customBrand: '',
            model: matchedModel.name,
            customModel: '',
            issues: [],
            description: ''
          }));
          setStep(3);
        }
      } catch {
        if (!ignore) {
          setRouteNotFound(true);
        }
      } finally {
        if (!ignore) {
          setRouteResolving(false);
        }
      }
    };

    resolveRouteSelection();

    return () => {
      ignore = true;
    };
  }, [apiBaseUrl, brandCategorySlug, modelSlug]);

  useEffect(() => {
    if (isAuthenticatedCustomer) {
      setEmailLookup({ checking: false, exists: false, checkedEmail: '', checkedPhone: '', isActive: true, matchedBy: '', message: '' });
      return;
    }

    const normalizedEmail = form.email.trim().toLowerCase();
    const normalizedPhone = form.phone.replace(/\D/g, '');
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);
    const isValidPhone = /^[0-9]{10}$/.test(normalizedPhone);

    if (!isValidEmail && !isValidPhone) {
      setEmailLookup({ checking: false, exists: false, checkedEmail: '', checkedPhone: '', isActive: true, matchedBy: '', message: '' });
      return;
    }

    let ignore = false;
    const timer = setTimeout(async () => {
      setEmailLookup((current) => ({ ...current, checking: true }));
      try {
        const params = new URLSearchParams();
        if (isValidEmail) params.set('email', normalizedEmail);
        if (isValidPhone) params.set('phone', normalizedPhone);

        const res = await fetch(`${apiBaseUrl}/customer-auth/account-status?${params.toString()}`);
        const data = await res.json();
        if (!ignore && data.success) {
          setEmailLookup({
            checking: false,
            exists: Boolean(data.data?.exists),
            checkedEmail: normalizedEmail,
            checkedPhone: normalizedPhone,
            isActive: data.data?.isActive ?? true,
            matchedBy: data.data?.matchedBy || '',
            message: data.data?.message || ''
          });
        }
      } catch {
        if (!ignore) {
          setEmailLookup({
            checking: false,
            exists: false,
            checkedEmail: normalizedEmail,
            checkedPhone: normalizedPhone,
            isActive: true,
            matchedBy: '',
            message: ''
          });
        }
      }
    }, 450);

    return () => {
      ignore = true;
      clearTimeout(timer);
    };
  }, [apiBaseUrl, form.email, form.phone, isAuthenticatedCustomer]);

  useEffect(() => {
    if (!form.deviceType) {
      setBrands([]);
      return;
    }

    let ignore = false;

    const loadBrands = async () => {
      setCatalogLoading(true);
      try {
        const res = await fetch(`${apiBaseUrl}/bookings/catalog/brands?category=${form.deviceType}`);
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
        const res = await fetch(`${apiBaseUrl}/bookings/catalog/models?${params.toString()}`);
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

  const navigateToBookingRoot = () => {
    if (location.pathname !== '/book') {
      navigate('/book');
    }
  };

  const navigateToBrandRoute = (brandName, category = form.deviceType) => {
    const nextPath = `/${buildBrandCategorySlug(brandName, category)}`;
    if (location.pathname !== nextPath) {
      navigate(nextPath);
    }
  };

  const navigateToModelRoute = (brandName, modelName, category = form.deviceType) => {
    const nextPath = `/${buildBrandCategorySlug(brandName, category)}/${slugify(modelName)}`;
    if (location.pathname !== nextPath) {
      navigate(nextPath);
    }
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
        (isAuthenticatedCustomer || form.accountPassword.trim().length >= 6) &&
        form.address.trim() &&
        form.city.trim() &&
        form.state.trim() &&
        form.pincode.trim()
      );
    }
    if (step === 5) return Boolean(form.date && scheduledTimeLabel);
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

  const persistCustomerSession = (user, token) => {
    const normalizedUser = user || {};
    localStorage.setItem('rv_token', token);
    localStorage.setItem('rv_role', 'customer');
    localStorage.setItem('rv_user', JSON.stringify(normalizedUser));
    setCustomerSession({ token, user: normalizedUser });
  };

  const ensureCustomerSession = async () => {
    if (customerSession.token) {
      return customerSession.token;
    }

    const normalizedEmail = form.email.trim().toLowerCase();
    const password = form.accountPassword.trim();

    if (!normalizedEmail) {
      throw new Error('Enter your email address before placing the order.');
    }

    if (!password || password.length < 6) {
      throw new Error('Enter a password with at least 6 characters to continue.');
    }

    if (emailLookup.exists) {
      if (emailLookup.matchedBy === 'phone' || emailLookup.matchedBy === 'conflict') {
        throw new Error(emailLookup.message || 'This mobile number is already linked to an existing customer account. Please sign in with that account to continue.');
      }

      const loginRes = await fetch(`${apiBaseUrl}/customer-auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: normalizedEmail, password })
      });
      const loginData = await loginRes.json();

      if (!loginRes.ok || !loginData.success || !loginData.token) {
        throw new Error(loginData.message || 'Could not sign in with this customer account.');
      }

      persistCustomerSession(loginData.data, loginData.token);
      return loginData.token;
    }

    const registerRes = await fetch(`${apiBaseUrl}/customer-auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name.trim(),
        email: normalizedEmail,
        phone: form.phone.trim(),
        password
      })
    });
    const registerData = await registerRes.json();

    if (!registerRes.ok || !registerData.success) {
      throw new Error(registerData.message || 'Could not create your customer account.');
    }

    const loginRes = await fetch(`${apiBaseUrl}/customer-auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: normalizedEmail, password })
    });
    const loginData = await loginRes.json();

    if (!loginRes.ok || !loginData.success || !loginData.token) {
      throw new Error(loginData.message || 'Account was created, but automatic sign-in failed.');
    }

    persistCustomerSession(loginData.data, loginData.token);
    return loginData.token;
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');

    try {
      const token = await ensureCustomerSession();
      const res = await fetch(`${apiBaseUrl}/bookings`, {
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
          scheduledTime: scheduledTimeLabel,
          offerCode: form.offerCode.trim().toUpperCase()
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        if (res.status === 401) {
          setCustomerSession({ token: '', user: {} });
          localStorage.removeItem('rv_token');
          localStorage.removeItem('rv_role');
          localStorage.removeItem('rv_user');
          setError('Your session expired. Please enter your password again to place the booking.');
          return;
        }
        setError(data.message || 'Booking failed. Please try again.');
        return;
      }

      setBookingResult(data.data || null);
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
      const res = await fetch(`${apiBaseUrl}/customer-auth/forgot-password`, {
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
      const res = await fetch(`${apiBaseUrl}/customer-auth/reset-password`, {
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

  const whatsappRedirectUrl = useMemo(() => {
    if (!submitted) return '';
    return buildWhatsAppUrl(
      whatsAppLink,
      buildWhatsAppMessage({
        bookingRef: bookingResult?.referenceNumber,
        form,
        resolvedBrand,
        resolvedModel,
        selectedIssueLabels
      })
    );
  }, [bookingResult, form, resolvedBrand, resolvedModel, selectedIssueLabels, submitted, whatsAppLink]);

  useEffect(() => {
    if (!submitted || !whatsappRedirectUrl) return;

    setRedirectCountdown(3);
    const intervalId = window.setInterval(() => {
      setRedirectCountdown((current) => (current > 1 ? current - 1 : 0));
    }, 1000);

    const timeoutId = window.setTimeout(() => {
      window.location.assign(whatsappRedirectUrl);
    }, 3000);

    return () => {
      window.clearInterval(intervalId);
      window.clearTimeout(timeoutId);
    };
  }, [submitted, whatsappRedirectUrl]);

  if (routeNotFound) {
    return <NotFound />;
  }

  if (routeResolving) {
    return (
      <>
        <Seo
          title={bookingPageTitle}
          description={bookingSeoDescription}
          path={location.pathname}
          keywords="repair booking, device repair booking, mobile repair booking Bengaluru"
          structuredData={bookingStructuredData}
        />
        <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-6">
          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-sm text-gray-300">
            <Loader2 size={18} className="animate-spin text-blue-400" />
            Loading brand and model page...
          </div>
        </div>
      </>
    );
  }

  if (submitted) {
    return (
      <>
        <Seo
          title={`${bookingPageTitle} Confirmed`}
          description={bookingSeoDescription}
          path={location.pathname}
          noIndex
        />
        <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-6">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
            <div className="w-20 h-20 bg-emerald-500/10 border border-emerald-500/30 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 size={40} className="text-emerald-400" />
            </div>
            <h1 className="text-3xl font-black font-['Outfit'] text-white mb-3">Booking Confirmed</h1>
            <p className="text-gray-400 mb-2">
              Your repair request for <span className="text-white font-semibold">{resolvedBrand} {resolvedModel}</span> has been received.
            </p>
            <p className="text-gray-500 text-sm mb-2">
              Booking reference: <span className="font-semibold text-white">{bookingResult?.referenceNumber || 'Generating...'}</span>
            </p>
            <p className="text-gray-500 text-sm mb-6">
              Redirecting to WhatsApp in {redirectCountdown} second{redirectCountdown === 1 ? '' : 's'} with your booking details prefilled.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href={whatsappRedirectUrl}
                className="bg-gradient-to-r from-emerald-600 to-green-500 text-white font-bold px-6 py-3 rounded-xl hover:shadow-[0_0_20px_rgba(34,197,94,0.35)] transition-all inline-flex items-center gap-2"
              >
                <MessageCircle size={18} />
                Open WhatsApp
              </a>
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
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#080c14] flex items-center justify-center p-6">
      <Seo
        title={bookingPageTitle}
        description={bookingSeoDescription}
        path={location.pathname}
        keywords="repair booking, mobile repair booking Bengaluru, tablet repair booking, laptop repair booking, smartwatch repair booking"
        structuredData={bookingStructuredData}
      />
      <div className="w-full max-w-5xl">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center text-sm font-bold">RV</div>
            <span className="text-lg font-bold font-['Outfit'] text-white">e<span className="text-blue-400">repaircafe</span></span>
          </Link>
          <h1 className="text-2xl font-black font-['Outfit'] text-white">{bookingPageTitle}</h1>
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
                            navigateToBookingRoot();
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
                            if (brand === OTHER_BRAND) {
                              navigateToBookingRoot();
                            } else {
                              navigateToBrandRoute(brand, form.deviceType);
                            }
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
                            navigateToModelRoute(resolvedBrand, model, form.deviceType);
                          } else {
                            navigateToBrandRoute(resolvedBrand, form.deviceType);
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
                    {!emailLookup.checking && !emailLookup.exists && !isAuthenticatedCustomer && form.email.trim() && (
                      <div className="mt-3 space-y-3">
                        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                          No customer account exists for this email or mobile number yet. Create one here and we will finish the booking after you place the order.
                        </div>
                        <div className="relative">
                          <Lock size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                          <input
                            type="password"
                            value={form.accountPassword}
                            onChange={(e) => update('accountPassword', e.target.value)}
                            placeholder="Create account password"
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors"
                          />
                        </div>
                        <div className="text-xs text-gray-500">
                          Use at least 6 characters. This will become your customer login password.
                        </div>
                      </div>
                    )}
                    {!emailLookup.checking && emailLookup.exists && !isAuthenticatedCustomer && (
                      <div className="mt-3 space-y-3">
                        <div className="rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200">
                          {emailLookup.message || 'A customer account already exists for this email or mobile number. Sign in here and we will place the booking in the final step.'}
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
                  <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-bold text-gray-400 mb-2">Coupon Code (Optional)</label>
                      <input
                        type="text"
                        value={form.offerCode}
                        onChange={(e) => update('offerCode', e.target.value.toUpperCase())}
                        placeholder="Enter coupon or promo code"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors font-mono uppercase"
                      />
                    </div>
                    {publicOffers.length > 0 && (
                      <div className="text-xs text-gray-400">
                        Available codes: {publicOffers.map((offer) => offer.code).join(', ')}
                      </div>
                    )}
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
                          onClick={() => {
                            update('timeSlot', slot);
                            update('customTime', '');
                          }}
                          className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${form.timeSlot === slot ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'}`}
                        >
                          {slot}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => update('timeSlot', CUSTOM_TIME_SLOT)}
                        className={`py-2.5 px-2 rounded-xl text-xs font-semibold transition-all ${form.timeSlot === CUSTOM_TIME_SLOT ? 'bg-blue-600 text-white' : 'bg-white/5 text-gray-400 hover:bg-white/10 border border-white/5'}`}
                      >
                        Custom Time
                      </button>
                    </div>
                    {form.timeSlot === CUSTOM_TIME_SLOT && (
                      <div className="mt-4">
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Choose Custom Time</label>
                        <input
                          type="time"
                          value={form.customTime}
                          min="10:00"
                          max="21:00"
                          step="900"
                          onChange={(e) => update('customTime', e.target.value)}
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-blue-500 transition-colors [color-scheme:dark]"
                        />
                        <div className="mt-2 text-xs text-gray-500">Available every day from 10:00 AM to 9:00 PM.</div>
                      </div>
                    )}
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
                      { label: 'Schedule', value: `${form.date} at ${scheduledTimeLabel}` },
                      { label: 'Promo Code', value: normalizedOfferCode || 'Not applied' }
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
                  <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-4 space-y-3">
                    <div>
                      <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">Promo Code</label>
                      <input
                        type="text"
                        value={form.offerCode}
                        onChange={(e) => update('offerCode', e.target.value.toUpperCase())}
                        placeholder="Enter promo code"
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-blue-500 transition-colors font-mono uppercase"
                      />
                    </div>
                    {publicOffers.length > 0 && (
                      <div className="text-xs text-gray-400">
                        Active codes: {publicOffers.map((offer) => offer.code).join(', ')}
                      </div>
                    )}
                  </div>
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

