/* ============================================================
   RepairVafe - Booking Page JS (API-driven)
   Submits booking data to POST /api/bookings
   ============================================================ */

const API = (['localhost', '127.0.0.1', ''].includes(window.location.hostname))
  ? 'http://localhost:5000/api' : '/api';

const deviceData = {
  smartphone: {
    brands: [{ name: 'Apple', icon: '🍎' }, { name: 'Samsung', icon: '📱' }, { name: 'OnePlus', icon: '🔴' }, { name: 'Xiaomi', icon: '🟠' }, { name: 'Google', icon: '🔵' }, { name: 'Vivo', icon: '🟣' }, { name: 'OPPO', icon: '⚫' }, { name: 'Realme', icon: '🟡' }],
    models: { Apple: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 12', 'iPhone SE 3'], Samsung: ['Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23 Ultra', 'Galaxy A54', 'Galaxy A34', 'Galaxy M54'], OnePlus: ['OnePlus 12', 'OnePlus 11', 'OnePlus Nord 3', 'OnePlus Nord CE 3'], Xiaomi: ['Xiaomi 14 Ultra', 'Xiaomi 13', 'Redmi Note 13 Pro', 'Redmi Note 12', 'POCO X6 Pro'], Google: ['Pixel 8 Pro', 'Pixel 8', 'Pixel 7a', 'Pixel 7 Pro'], Vivo: ['Vivo X100 Pro', 'Vivo V30 Pro', 'Vivo Y200'], OPPO: ['OPPO Find X7', 'OPPO Reno 12 Pro', 'OPPO A98'], Realme: ['Realme GT 6', 'Realme 12 Pro+', 'Realme Narzo 70'] },
    repairs: [{ icon: '📺', name: 'Screen Replacement', price: '₹1,500 - ₹6,000' }, { icon: '🔋', name: 'Battery Replacement', price: '₹800 - ₹2,500' }, { icon: '🔌', name: 'Charging Port Repair', price: '₹600 - ₹1,500' }, { icon: '📷', name: 'Camera Repair', price: '₹1,000 - ₹3,500' }, { icon: '🔊', name: 'Speaker/Mic Fix', price: '₹500 - ₹1,200' }, { icon: '💧', name: 'Water Damage', price: '₹1,500 - ₹4,000' }, { icon: '🔘', name: 'Button Repair', price: '₹400 - ₹900' }, { icon: '🔒', name: 'Back Cover Replace', price: '₹300 - ₹1,500' }]
  },
  laptop: {
    brands: [{ name: 'Apple', icon: '🍎' }, { name: 'Dell', icon: '🔵' }, { name: 'HP', icon: '💻' }, { name: 'Lenovo', icon: '⚫' }, { name: 'ASUS', icon: '🔴' }, { name: 'Acer', icon: '🟢' }, { name: 'MSI', icon: '🔴' }],
    models: { Apple: ['MacBook Pro 16" M3', 'MacBook Pro 14" M3', 'MacBook Air 15" M2', 'MacBook Air 13" M2'], Dell: ['XPS 15', 'XPS 13', 'Inspiron 15', 'G15 Gaming', 'Latitude 5540'], HP: ['Spectre x360', 'Envy 16', 'Pavilion 15', 'EliteBook 840'], Lenovo: ['ThinkPad X1 Carbon', 'IdeaPad 5', 'Legion 5', 'Yoga 9i'], ASUS: ['ZenBook 14', 'ROG Zephyrus G14', 'VivoBook 15'], Acer: ['Swift 5', 'Aspire 7', 'Nitro 5'], MSI: ['Stealth 16', 'Raider GE78', 'Creator Z16'] },
    repairs: [{ icon: '📺', name: 'Screen Replacement', price: '₹3,000 - ₹12,000' }, { icon: '⌨️', name: 'Keyboard Replacement', price: '₹1,500 - ₹4,000' }, { icon: '🔋', name: 'Battery Replacement', price: '₹2,000 - ₹6,000' }, { icon: '💾', name: 'SSD/HDD Upgrade', price: '₹1,500 - ₹8,000' }, { icon: '🧩', name: 'RAM Upgrade', price: '₹1,000 - ₹5,000' }, { icon: '🌡️', name: 'Thermal Cleaning', price: '₹600 - ₹1,200' }, { icon: '🖥️', name: 'Motherboard Repair', price: '₹3,000 - ₹10,000' }, { icon: '💿', name: 'OS Installation', price: '₹500 - ₹1,000' }]
  },
  tablet: {
    brands: [{ name: 'Apple', icon: '🍎' }, { name: 'Samsung', icon: '📱' }, { name: 'Lenovo', icon: '⚫' }, { name: 'Amazon', icon: '🟠' }, { name: 'Xiaomi', icon: '🟠' }],
    models: { Apple: ['iPad Pro 13" M4', 'iPad Pro 11" M4', 'iPad Air 11" M2', 'iPad 10th Gen', 'iPad Mini 6'], Samsung: ['Galaxy Tab S9 Ultra', 'Galaxy Tab S9+', 'Galaxy Tab S9 FE', 'Galaxy Tab A9+'], Lenovo: ['Tab P12 Pro', 'Tab M10 Plus', 'Yoga Tab 13'], Amazon: ['Fire HD 10', 'Fire HD 8', 'Fire Max 11'], Xiaomi: ['Pad 6 Pro', 'Pad 6', 'Redmi Pad SE'] },
    repairs: [{ icon: '📺', name: 'Screen Replacement', price: '₹2,000 - ₹8,000' }, { icon: '🔋', name: 'Battery Replacement', price: '₹1,500 - ₹4,000' }, { icon: '🔌', name: 'Charging Port Repair', price: '₹800 - ₹1,800' }, { icon: '📷', name: 'Camera Repair', price: '₹1,000 - ₹3,000' }, { icon: '💧', name: 'Water Damage', price: '₹2,000 - ₹5,000' }]
  },
  smartwatch: {
    brands: [{ name: 'Apple', icon: '🍎' }, { name: 'Samsung', icon: '📱' }, { name: 'Fitbit', icon: '💪' }, { name: 'Garmin', icon: '🟠' }, { name: 'Noise', icon: '🔵' }],
    models: { Apple: ['Apple Watch Series 9', 'Apple Watch Ultra 2', 'Apple Watch SE 2'], Samsung: ['Galaxy Watch 6 Classic', 'Galaxy Watch 6', 'Galaxy Watch FE'], Fitbit: ['Fitbit Sense 2', 'Fitbit Versa 4', 'Fitbit Charge 6'], Garmin: ['Fenix 7 Pro', 'Venu 3', 'Forerunner 265'], Noise: ['Noise Pulse Pro', 'Noise Icon 3', 'Noise ColorFit Ultra 3'] },
    repairs: [{ icon: '📺', name: 'Screen Replacement', price: '₹1,500 - ₹5,000' }, { icon: '🔋', name: 'Battery Replacement', price: '₹800 - ₹2,500' }, { icon: '⌚', name: 'Band Replacement', price: '₹300 - ₹1,000' }, { icon: '💧', name: 'Water Damage', price: '₹1,200 - ₹3,500' }]
  }
};

const state = {
  category: null,
  brand: null,
  model: null,
  repairs: [],
  serviceType: null
};

const leadCapture = {
  leadId: null,
  lastFingerprint: '',
  isBooked: false,
  timer: null
};

// ── Location Intelligence Module ──────────────────────────────
const locationIntel = {
  latitude: null,
  longitude: null,
  ipCity: null,
  locationSource: null // 'gps' | 'ip' | 'manual'
};

/**
 * Step 2: Try browser Geolocation API first (GPS/WiFi-based).
 * Resolves with coords or null — never rejects.
 */
function tryBrowserGeolocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    const timeout = setTimeout(() => resolve(null), 7000); // 7s max wait
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        clearTimeout(timeout);
        resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude });
      },
      () => { clearTimeout(timeout); resolve(null); },
      { timeout: 6000, maximumAge: 300000 }
    );
  });
}

/**
 * Step 3: IP-based fallback using a free public API (ip-api.com).
 * Returns { city, regionName, lat, lon } or null.
 */
async function tryIPGeolocation() {
  try {
    const res = await fetch('http://ip-api.com/json/?fields=city,regionName,lat,lon,status', { signal: AbortSignal.timeout(5000) });
    const data = await res.json();
    if (data.status === 'success') return data;
  } catch (_) { /* silent */ }
  return null;
}

/**
 * Step 4 & 5: Main location capture flow.
 * GPS → IP fallback → manual (whatever user typed).
 * Pre-fills city/state if fields are empty.
 */
async function captureLocationIntelligence() {
  updateLocationBadge('detecting', '📡 Detecting your location…');

  // Step 2: Try GPS
  const gps = await tryBrowserGeolocation();
  if (gps) {
    locationIntel.latitude  = gps.lat;
    locationIntel.longitude = gps.lng;
    locationIntel.locationSource = 'gps';
    updateLocationBadge('success', '📍 Location detected via GPS');
    return;
  }

  // Step 3: IP fallback
  updateLocationBadge('detecting', '🌐 Using IP-based location…');
  const ip = await tryIPGeolocation();
  if (ip) {
    locationIntel.latitude  = ip.lat;
    locationIntel.longitude = ip.lon;
    locationIntel.ipCity    = ip.city;
    locationIntel.locationSource = 'ip';

    // Pre-fill city & state only if user hasn't typed anything
    const cityEl  = document.getElementById('custCity');
    const stateEl = document.getElementById('custState');
    if (cityEl && !cityEl.value.trim() && ip.city)       cityEl.value = ip.city;
    if (stateEl && !stateEl.value && ip.regionName) {
      // Try to match against the option values
      const opts = Array.from(stateEl.options);
      const match = opts.find(o => o.text.toLowerCase().includes(ip.regionName.toLowerCase()) ||
                                   ip.regionName.toLowerCase().includes(o.text.toLowerCase()));
      if (match) stateEl.value = match.value;
    }
    updateLocationBadge('success', `🌐 Location via IP: ${ip.city || 'Unknown'}`);
    return;
  }

  // Step 4: Pure manual — address fields are primary
  locationIntel.locationSource = 'manual';
  updateLocationBadge('manual', '✏️ Using your entered address');
}

function updateLocationBadge(type, text) {
  const badge = document.getElementById('locationBadge');
  if (!badge) return;
  const colors = { detecting: '#f59e0b', success: '#10b981', manual: '#6366f1' };
  badge.textContent = text;
  badge.style.color = colors[type] || '#94a3b8';
  badge.style.display = 'inline-flex';
}


function getValue(id) {
  return document.getElementById(id)?.value?.trim() || '';
}

function normalizePhone(phone) {
  return phone.replace(/\s+/g, '');
}

function isValidPhone(phone) {
  return /^\+?[0-9]{10,15}$/.test(normalizePhone(phone));
}

function getServiceLabel(serviceType) {
  const map = { walkin: 'Walk-In', dropoff: 'Drop Off', pickup: 'Home Pickup' };
  return map[serviceType] || '';
}

function buildLeadPayload() {
  return {
    customerName: getValue('custName'),
    mobileNumber: getValue('custPhone'),
    email: getValue('custEmail'),
    address: getValue('custAddress'),
    city: getValue('custCity'),
    state: getValue('custState'),
    pincode: getValue('custPincode'),
    deviceCategory: state.category,
    deviceBrand: state.brand,
    deviceModel: state.model,
    repairTypes: state.repairs
  };
}

async function captureLeadNow() {
  const payload = buildLeadPayload();
  if (!payload.customerName || !isValidPhone(payload.mobileNumber)) return;

  const fingerprint = `${payload.customerName}|${normalizePhone(payload.mobileNumber)}`;
  if (fingerprint === leadCapture.lastFingerprint && leadCapture.leadId) return;

  try {
    const response = await fetch(`${API}/leads/capture`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (response.ok && data.success) {
      leadCapture.leadId = data.data.leadId;
      leadCapture.lastFingerprint = fingerprint;
    }
  } catch (error) {
    // Intentionally silent: lead capture should never block booking flow.
  }
}

function scheduleLeadCapture() {
  clearTimeout(leadCapture.timer);
  leadCapture.timer = setTimeout(captureLeadNow, 500);
}

function markLeadAbandoned() {
  if (!leadCapture.leadId || leadCapture.isBooked) return;
  fetch(`${API}/leads/${leadCapture.leadId}/abandon`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reason: 'Customer left booking flow before submit' }),
    keepalive: true
  }).catch(() => {});
}

function goToStep(step) {
  if (step === 2 && !validateStep1()) return;
  if (step === 3 && !validateStep2()) return;
  if (step === 4 && !validateStep3()) return;
  if (step === 4) buildSummary();

  for (let index = 1; index <= 4; index += 1) {
    document.getElementById(`wizStep${index}`)?.classList.remove('active', 'done');
    if (index < step) document.getElementById(`wizStep${index}`)?.classList.add('done');
    if (index === step) document.getElementById(`wizStep${index}`)?.classList.add('active');
    const line = document.getElementById(`wLine${index}`);
    if (line) line.classList.toggle('active', index < step);
    document.getElementById(`panel${index}`)?.classList.toggle('active', index === step);
  }

  // Step 2 trigger: kick off location detection when user reaches details step
  if (step === 3 && !locationIntel.locationSource) {
    captureLocationIntelligence();
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateStep1() {
  if (!state.category) return showToast('Please select a device category.', 'error'), false;
  if (!state.brand) return showToast('Please select a brand.', 'error'), false;
  if (!state.model) return showToast('Please select a model.', 'error'), false;
  return true;
}

function validateStep2() {
  if (!state.repairs.length) return showToast('Please select at least one repair type.', 'error'), false;
  return true;
}

function validateStep3() {
  const name = getValue('custName');
  const phone = normalizePhone(getValue('custPhone'));
  const email = getValue('custEmail');
  const address = getValue('custAddress');
  const city = getValue('custCity');
  const bookingState = getValue('custState');
  const pincode = getValue('custPincode');
  const preferredDate = getValue('preferDate');
  const preferredTime = getValue('preferTime');

  if (!name) return showToast('Please enter your full name.', 'error'), false;
  if (!phone) return showToast('Please enter your mobile number.', 'error'), false;
  if (!/^\+?[0-9]{10,15}$/.test(phone)) return showToast('Enter a valid mobile number.', 'error'), false;
  if (!email) return showToast('Please enter your email address.', 'error'), false;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return showToast('Enter a valid email address.', 'error'), false;
  if (!address) return showToast('Please enter your address.', 'error'), false;
  if (!city) return showToast('Please enter your city.', 'error'), false;
  if (!bookingState) return showToast('Please select your state.', 'error'), false;
  if (!/^[0-9]{6}$/.test(pincode)) return showToast('Enter a valid 6-digit pincode.', 'error'), false;
  if (!state.serviceType) return showToast('Please select pickup or visit store option.', 'error'), false;
  if (!preferredDate) return showToast('Please select a preferred date.', 'error'), false;
  if (!preferredTime) return showToast('Please select a preferred time slot.', 'error'), false;

  return true;
}

document.querySelectorAll('.device-cat-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.device-cat-card').forEach(item => item.classList.remove('selected'));
    card.classList.add('selected');
    state.category = card.dataset.cat;
    state.brand = null;
    state.model = null;
    state.repairs = [];
    renderBrands();
    document.getElementById('modelSection').style.display = 'none';
    updateStep1Btn();
  });
});

function renderBrands() {
  const grid = document.getElementById('brandGrid');
  document.getElementById('brandSection').style.display = 'block';
  grid.innerHTML = (deviceData[state.category]?.brands || []).map(brand =>
    `<button class="brand-chip" data-brand="${brand.name}" onclick="selectBrand('${brand.name}')">${brand.icon} ${brand.name}</button>`
  ).join('');
}

function selectBrand(brand) {
  document.querySelectorAll('.brand-chip').forEach(chip => chip.classList.remove('selected'));
  document.querySelector(`.brand-chip[data-brand="${brand}"]`)?.classList.add('selected');
  state.brand = brand;
  state.model = null;
  const models = deviceData[state.category]?.models[brand] || [];
  const modelSelect = document.getElementById('modelSelect');
  modelSelect.innerHTML = '<option value="">-- Select Model --</option>'
    + models.map(model => `<option value="${model}">${model}</option>`).join('');
  document.getElementById('modelSection').style.display = 'block';
  updateStep1Btn();
}

document.getElementById('modelSelect')?.addEventListener('change', function handleModelChange() {
  state.model = this.value;
  updateStep1Btn();
});

function updateStep1Btn() {
  const button = document.getElementById('step1Next');
  if (button) button.disabled = !(state.category && state.brand && state.model);
}

function renderRepairTypes() {
  const grid = document.getElementById('repairTypesGrid');
  state.repairs = [];
  if (!grid || !state.category) return;
  grid.innerHTML = (deviceData[state.category]?.repairs || []).map((repair, index) =>
    `<div class="repair-type-card" id="rtc${index}" onclick="toggleRepair(${index},'${repair.name}')">
      <div class="rtc-icon">${repair.icon}</div>
      <div class="rtc-info"><div class="rtc-name">${repair.name}</div><div class="rtc-price">${repair.price}</div></div>
      <div class="rtc-check">✓</div>
    </div>`
  ).join('');
  updateStep2Btn();
}

function toggleRepair(index, name) {
  const card = document.getElementById(`rtc${index}`);
  const selected = card.classList.toggle('selected');
  state.repairs = selected ? [...state.repairs, name] : state.repairs.filter(repair => repair !== name);
  updateStep2Btn();
}

function updateStep2Btn() {
  const button = document.getElementById('step2Next');
  if (button) button.disabled = !state.repairs.length;
}

function selectService(serviceType) {
  state.serviceType = serviceType;
  document.querySelectorAll('.service-card').forEach(card => {
    card.classList.toggle('selected', card.dataset.val === serviceType);
  });
}

document.getElementById('step1Next')?.addEventListener('click', () => renderRepairTypes());

function buildSummary() {
  const setText = (id, value) => {
    const element = document.getElementById(id);
    if (element) element.textContent = value || '–';
  };

  const selectedTimeSlotText = document.querySelector('#preferTime option:checked')?.textContent || '';

  setText('sumCat', state.category ? state.category.charAt(0).toUpperCase() + state.category.slice(1) : '');
  setText('sumBrand', state.brand);
  setText('sumModel', state.model);
  setText('sumRepairs', state.repairs.join(', '));
  setText('sumName', getValue('custName'));
  setText('sumPhone', getValue('custPhone'));
  setText('sumEmail', getValue('custEmail'));
  setText('sumService', getServiceLabel(state.serviceType));
  setText('sumDate', getValue('preferDate'));
  setText('sumTime', selectedTimeSlotText);
  setText('sumIssue', getValue('issueDesc'));
  setText('sumAddr', getValue('custAddress'));
  setText('sumCity', getValue('custCity'));
  setText('sumState', getValue('custState'));
  setText('sumPincode', getValue('custPincode'));
}

async function submitBooking() {
  if (!validateStep1() || !validateStep2() || !validateStep3()) {
    goToStep(3);
    return;
  }

  const button = document.getElementById('submitBtn');
  button.textContent = 'Submitting...';
  button.disabled = true;

  const payload = {
    deviceCategory: state.category,
    deviceBrand: state.brand,
    deviceModel: state.model,
    repairTypes: state.repairs,
    issueDescription: getValue('issueDesc'),
    customerName: getValue('custName'),
    customerPhone: normalizePhone(getValue('custPhone')),
    customerEmail: getValue('custEmail'),
    address: getValue('custAddress'),
    city: getValue('custCity'),
    state: getValue('custState'),
    pincode: getValue('custPincode'),
    serviceType: state.serviceType,
    preferredDate: getValue('preferDate'),
    preferredTimeSlot: getValue('preferTime'),
    leadId: leadCapture.leadId,
    // Location Intelligence (Step 5)
    latitude:       locationIntel.latitude,
    longitude:      locationIntel.longitude,
    ipCity:         locationIntel.ipCity,
    locationSource: locationIntel.locationSource || 'manual'
  };

  const userToken = localStorage.getItem('rv_user_token');
  const headers = { 'Content-Type': 'application/json' };
  if (userToken) headers['Authorization'] = `Bearer ${userToken}`;

  try {
    const response = await fetch(`${API}/bookings`, {
      method: 'POST',
      headers: headers,
      body: JSON.stringify(payload)
    });
    const data = await response.json();

    if (!response.ok || !data.success) {
      showToast(data.message || 'Booking failed. Please try again.', 'error');
      button.textContent = '✅ Submit Booking Request';
      button.disabled = false;
      return;
    }

    document.getElementById('bookingRef').textContent = data.data.referenceNumber;
    leadCapture.isBooked = true;
    for (let index = 1; index <= 4; index += 1) document.getElementById(`panel${index}`)?.classList.remove('active');
    document.getElementById('panelSuccess')?.classList.add('active');
    for (let index = 1; index <= 4; index += 1) {
      document.getElementById(`wizStep${index}`)?.classList.remove('active');
      document.getElementById(`wizStep${index}`)?.classList.add('done');
    }
    showToast('Booking submitted successfully!', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (error) {
    showToast('Cannot connect to server. Please try again.', 'error');
    button.textContent = '✅ Submit Booking Request';
    button.disabled = false;
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const type = new URLSearchParams(window.location.search).get('type');
  if (type) document.querySelector(`.device-cat-card[data-cat="${type}"]`)?.click();
  const today = new Date().toISOString().split('T')[0];
  const dateInput = document.getElementById('preferDate');
  if (dateInput) dateInput.min = today;

  document.getElementById('custPhone')?.addEventListener('blur', captureLeadNow);

  // Start location detection silently in background (Step 2 & 3)
  captureLocationIntelligence();

  // Pre-fill user data if logged in
  const userToken = localStorage.getItem('rv_user_token');
  if (userToken) {
    const apiBase = (['localhost', '127.0.0.1', ''].includes(window.location.hostname)) ? 'http://localhost:5000/api' : '/api';
    fetch(`${apiBase}/customer-auth/me`, {
      headers: { 'Authorization': `Bearer ${userToken}` }
    })
    .then(res => res.json())
    .then(res => {
      if (res.success && res.data) {
        const u = res.data;
        if (document.getElementById('custName')) document.getElementById('custName').value = u.name || '';
        if (document.getElementById('custPhone')) document.getElementById('custPhone').value = u.phone || '';
        if (document.getElementById('custEmail')) document.getElementById('custEmail').value = u.email || '';
        if (document.getElementById('custAddress')) document.getElementById('custAddress').value = u.address || '';
        if (document.getElementById('custCity')) document.getElementById('custCity').value = u.city || '';
        if (document.getElementById('custState')) document.getElementById('custState').value = u.state || '';
        if (document.getElementById('custPincode')) document.getElementById('custPincode').value = u.pincode || '';
      }
    }).catch(() => {});
  }
});

window.addEventListener('pagehide', markLeadAbandoned);
window.addEventListener('beforeunload', markLeadAbandoned);

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const element = document.createElement('div');
  element.className = `toast ${type}`;
  element.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(element);
  setTimeout(() => element.remove(), 4000);
}

window.goToStep = goToStep;
window.submitBooking = submitBooking;
window.selectBrand = selectBrand;
window.toggleRepair = toggleRepair;
window.selectService = selectService;
