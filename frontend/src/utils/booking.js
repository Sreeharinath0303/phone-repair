/* ============================================
   RepairVafe – Booking Page JS
   ============================================ */

// --- Data ---
const deviceData = {
  smartphone: {
    brands: [
      { name: 'Apple', icon: '🍎' }, { name: 'Samsung', icon: '📱' },
      { name: 'OnePlus', icon: '🔴' }, { name: 'Xiaomi', icon: '🟠' },
      { name: 'Google', icon: '🔵' }, { name: 'Vivo', icon: '🟣' },
      { name: 'OPPO', icon: '⚫' }, { name: 'Realme', icon: '🟡' }
    ],
    models: {
      Apple: ['iPhone 15 Pro Max', 'iPhone 15 Pro', 'iPhone 15', 'iPhone 14 Pro Max', 'iPhone 14 Pro', 'iPhone 14', 'iPhone 13 Pro', 'iPhone 13', 'iPhone 12', 'iPhone SE 3'],
      Samsung: ['Galaxy S24 Ultra', 'Galaxy S24+', 'Galaxy S24', 'Galaxy S23 Ultra', 'Galaxy A54', 'Galaxy A34', 'Galaxy M54', 'Galaxy F54'],
      OnePlus: ['OnePlus 12', 'OnePlus 11', 'OnePlus Nord 3', 'OnePlus Nord CE 3', 'OnePlus 10 Pro'],
      Xiaomi: ['Xiaomi 14 Ultra', 'Xiaomi 13', 'Redmi Note 13 Pro', 'Redmi Note 12', 'POCO X6 Pro', 'POCO F5'],
      Google: ['Pixel 8 Pro', 'Pixel 8', 'Pixel 7a', 'Pixel 7 Pro'],
      Vivo: ['Vivo X100 Pro', 'Vivo V30 Pro', 'Vivo Y200', 'Vivo T3'],
      OPPO: ['OPPO Find X7', 'OPPO Reno 12 Pro', 'OPPO A98', 'OPPO F23'],
      Realme: ['Realme GT 6', 'Realme 12 Pro+', 'Realme Narzo 70', 'Realme C67']
    },
    repairs: [
      { icon: '📺', name: 'Screen Replacement', price: '₹1,500 – ₹6,000' },
      { icon: '🔋', name: 'Battery Replacement', price: '₹800 – ₹2,500' },
      { icon: '🔌', name: 'Charging Port Repair', price: '₹600 – ₹1,500' },
      { icon: '📷', name: 'Camera Repair', price: '₹1,000 – ₹3,500' },
      { icon: '🔊', name: 'Speaker/Mic Fix', price: '₹500 – ₹1,200' },
      { icon: '💧', name: 'Water Damage', price: '₹1,500 – ₹4,000' },
      { icon: '🔘', name: 'Button Repair', price: '₹400 – ₹900' },
      { icon: '🔒', name: 'Back Cover Replace', price: '₹300 – ₹1,500' }
    ]
  },
  laptop: {
    brands: [
      { name: 'Apple', icon: '🍎' }, { name: 'Dell', icon: '🔵' },
      { name: 'HP', icon: '🔵' }, { name: 'Lenovo', icon: '⚫' },
      { name: 'ASUS', icon: '🔴' }, { name: 'Acer', icon: '🟢' },
      { name: 'MSI', icon: '🔴' }, { name: 'Samsung', icon: '🟦' }
    ],
    models: {
      Apple: ['MacBook Pro 16" M3', 'MacBook Pro 14" M3', 'MacBook Air 15" M2', 'MacBook Air 13" M2', 'MacBook Pro 13" Intel'],
      Dell: ['XPS 15', 'XPS 13', 'Inspiron 15', 'G15 Gaming', 'Latitude 5540', 'Vostro 15'],
      HP: ['Spectre x360', 'Envy 16', 'Pavilion 15', 'EliteBook 840', 'Omen 16'],
      Lenovo: ['ThinkPad X1 Carbon', 'IdeaPad 5', 'Legion 5', 'Yoga 9i', 'ThinkBook 14'],
      ASUS: ['ZenBook 14', 'ROG Zephyrus G14', 'VivoBook 15', 'TUF Gaming F15'],
      Acer: ['Swift 5', 'Aspire 7', 'Nitro 5', 'Spin 5', 'ConceptD 7'],
      MSI: ['Stealth 16', 'Raider GE78', 'Prestige 14', 'Creator Z16'],
      Samsung: ['Galaxy Book3 Pro', 'Galaxy Book3 360', 'Galaxy Book3 Ultra']
    },
    repairs: [
      { icon: '📺', name: 'Screen Replacement', price: '₹3,000 – ₹12,000' },
      { icon: '⌨️', name: 'Keyboard Replacement', price: '₹1,500 – ₹4,000' },
      { icon: '🔋', name: 'Battery Replacement', price: '₹2,000 – ₹6,000' },
      { icon: '💾', name: 'SSD/HDD Upgrade', price: '₹1,500 – ₹8,000' },
      { icon: '🧩', name: 'RAM Upgrade', price: '₹1,000 – ₹5,000' },
      { icon: '🌡️', name: 'Thermal Cleaning', price: '₹600 – ₹1,200' },
      { icon: '🖥️', name: 'Motherboard Repair', price: '₹3,000 – ₹10,000' },
      { icon: '💿', name: 'OS Installation', price: '₹500 – ₹1,000' }
    ]
  },
  tablet: {
    brands: [
      { name: 'Apple', icon: '🍎' }, { name: 'Samsung', icon: '📱' },
      { name: 'Lenovo', icon: '⚫' }, { name: 'Amazon', icon: '🟠' },
      { name: 'Xiaomi', icon: '🟠' }, { name: 'Realme', icon: '🟡' }
    ],
    models: {
      Apple: ['iPad Pro 13" M4', 'iPad Pro 11" M4', 'iPad Air 11" M2', 'iPad 10th Gen', 'iPad Mini 6'],
      Samsung: ['Galaxy Tab S9 Ultra', 'Galaxy Tab S9+', 'Galaxy Tab S9 FE', 'Galaxy Tab A9+'],
      Lenovo: ['Tab P12 Pro', 'Tab M10 Plus', 'Tab P11 Pro', 'Yoga Tab 13'],
      Amazon: ['Fire HD 10', 'Fire HD 8', 'Fire Max 11'],
      Xiaomi: ['Pad 6 Pro', 'Pad 6', 'Redmi Pad SE'],
      Realme: ['Pad 2', 'Pad X', 'Pad Mini']
    },
    repairs: [
      { icon: '📺', name: 'Screen Replacement', price: '₹2,000 – ₹8,000' },
      { icon: '🔋', name: 'Battery Replacement', price: '₹1,500 – ₹4,000' },
      { icon: '🔌', name: 'Charging Port Repair', price: '₹800 – ₹1,800' },
      { icon: '📷', name: 'Camera Repair', price: '₹1,000 – ₹3,000' },
      { icon: '💧', name: 'Water Damage', price: '₹2,000 – ₹5,000' },
      { icon: '🔘', name: 'Button Repair', price: '₹500 – ₹1,200' }
    ]
  },
  smartwatch: {
    brands: [
      { name: 'Apple', icon: '🍎' }, { name: 'Samsung', icon: '📱' },
      { name: 'Fitbit', icon: '💪' }, { name: 'Garmin', icon: '🟠' },
      { name: 'Noise', icon: '🔵' }, { name: 'Boat', icon: '⚫' }
    ],
    models: {
      Apple: ['Apple Watch Series 9', 'Apple Watch Ultra 2', 'Apple Watch SE 2', 'Apple Watch Series 8'],
      Samsung: ['Galaxy Watch 6 Classic', 'Galaxy Watch 6', 'Galaxy Watch 5 Pro', 'Galaxy Watch FE'],
      Fitbit: ['Fitbit Sense 2', 'Fitbit Versa 4', 'Fitbit Charge 6', 'Fitbit Inspire 3'],
      Garmin: ['Fenix 7 Pro', 'Venu 3', 'Forerunner 265', 'Instinct 2'],
      Noise: ['Noise Pulse Pro', 'Noise Icon 3', 'Noise ColorFit Ultra 3'],
      Boat: ['Boat Wave Horizon', 'Boat Storm Pro', 'Boat Ultima Select Edge Pro']
    },
    repairs: [
      { icon: '📺', name: 'Screen Replacement', price: '₹1,500 – ₹5,000' },
      { icon: '🔋', name: 'Battery Replacement', price: '₹800 – ₹2,500' },
      { icon: '⌚', name: 'Band Replacement', price: '₹300 – ₹1,000' },
      { icon: '💧', name: 'Water Damage', price: '₹1,200 – ₹3,500' },
      { icon: '💿', name: 'Software Issue', price: '₹400 – ₹800' }
    ]
  }
};

// --- State ---
const state = {
  category: null, brand: null, model: null, repairs: [],
  name: '', phone: '', email: '', serviceType: '',
  address: '', date: '', time: ''
};

// --- Step Logic ---
function goToStep(step) {
  if (step === 2 && !validateStep1()) return;
  if (step === 3 && !validateStep2()) return;
  if (step === 4) buildSummary();

  // Update wizard steps visual
  for (let i = 1; i <= 4; i++) {
    const ws = document.getElementById(`wizStep${i}`);
    if (ws) {
      ws.classList.remove('active', 'done');
      if (i < step) ws.classList.add('done');
      if (i === step) ws.classList.add('active');
    }
    const line = document.getElementById(`wLine${i}`);
    if (line) {
      line.classList.toggle('active', i < step);
    }
  }

  // Show/hide panels
  for (let i = 1; i <= 4; i++) {
    const panel = document.getElementById(`panel${i}`);
    if (panel) panel.classList.toggle('active', i === step);
  }

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function validateStep1() {
  if (!state.category) { showToast('Please select a device category.', 'error'); return false; }
  if (!state.brand) { showToast('Please select a brand.', 'error'); return false; }
  if (!state.model) { showToast('Please select a model.', 'error'); return false; }
  return true;
}

function validateStep2() {
  if (state.repairs.length === 0) { showToast('Please select at least one repair type.', 'error'); return false; }
  return true;
}

// --- Category Selection ---
document.querySelectorAll('.device-cat-card').forEach(card => {
  card.addEventListener('click', () => {
    document.querySelectorAll('.device-cat-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');
    state.category = card.dataset.cat;
    state.brand = null;
    state.model = null;
    renderBrands();
    document.getElementById('modelSection').style.display = 'none';
    updateStep1Btn();
  });
});

function renderBrands() {
  const brandSection = document.getElementById('brandSection');
  const brandGrid = document.getElementById('brandGrid');
  const data = deviceData[state.category];
  if (!data) return;

  brandGrid.innerHTML = data.brands.map(b =>
    `<button class="brand-chip" data-brand="${b.name}" onclick="selectBrand('${b.name}')">
      ${b.icon} ${b.name}
    </button>`
  ).join('');
  brandSection.style.display = 'block';
}

function selectBrand(brand) {
  document.querySelectorAll('.brand-chip').forEach(c => c.classList.remove('selected'));
  document.querySelector(`.brand-chip[data-brand="${brand}"]`)?.classList.add('selected');
  state.brand = brand;
  state.model = null;
  renderModels();
  updateStep1Btn();
}

function renderModels() {
  const modelSection = document.getElementById('modelSection');
  const modelSelect = document.getElementById('modelSelect');
  const models = deviceData[state.category]?.models[state.brand] || [];

  modelSelect.innerHTML = '<option value="">-- Select Model --</option>' +
    models.map(m => `<option value="${m}">${m}</option>`).join('');
  modelSection.style.display = 'block';
}

document.getElementById('modelSelect')?.addEventListener('change', function() {
  state.model = this.value;
  updateStep1Btn();
});

function updateStep1Btn() {
  const btn = document.getElementById('step1Next');
  if (btn) btn.disabled = !(state.category && state.brand && state.model);
}

// --- Repair Types ---
function renderRepairTypes() {
  const grid = document.getElementById('repairTypesGrid');
  if (!grid || !state.category) return;

  const repairs = deviceData[state.category]?.repairs || [];
  grid.innerHTML = repairs.map((r, i) =>
    `<div class="repair-type-card" id="rtc${i}" data-index="${i}" onclick="toggleRepair(${i}, '${r.name}')">
      <div class="rtc-icon">${r.icon}</div>
      <div class="rtc-info">
        <div class="rtc-name">${r.name}</div>
        <div class="rtc-price">${r.price}</div>
      </div>
      <div class="rtc-check">✓</div>
    </div>`
  ).join('');

  state.repairs = [];
  updateStep2Btn();
}

function toggleRepair(index, name) {
  const card = document.getElementById(`rtc${index}`);
  const isSelected = card.classList.toggle('selected');
  if (isSelected) {
    state.repairs.push(name);
  } else {
    state.repairs = state.repairs.filter(r => r !== name);
  }
  updateStep2Btn();
}

function updateStep2Btn() {
  const btn = document.getElementById('step2Next');
  if (btn) btn.disabled = state.repairs.length === 0;
}

// Hook step 1 → 2 to render repair types
document.getElementById('step1Next')?.addEventListener('click', () => {
  renderRepairTypes();
});

// --- Summary ---
function buildSummary() {
  state.name = document.getElementById('custName')?.value || '';
  state.phone = document.getElementById('custPhone')?.value || '';
  state.email = document.getElementById('custEmail')?.value || '';
  state.serviceType = document.getElementById('serviceType')?.value || '';
  state.address = document.getElementById('custAddress')?.value || '';
  state.date = document.getElementById('preferDate')?.value || '';
  state.time = document.getElementById('preferTime')?.value || '';

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val || '–'; };
  set('sumCat', state.category ? state.category.charAt(0).toUpperCase() + state.category.slice(1) : '');
  set('sumBrand', state.brand);
  set('sumModel', state.model);
  set('sumRepairs', state.repairs.join(', '));
  set('sumName', state.name);
  set('sumPhone', state.phone);
  set('sumEmail', state.email);
  set('sumService', state.serviceType);
  set('sumDate', state.date);
  set('sumTime', state.time);
  set('sumAddr', state.address || 'N/A');
}

// --- Submit ---
function submitBooking() {
  const btn = document.getElementById('submitBtn');
  btn.textContent = '⏳ Submitting...';
  btn.disabled = true;

  // Simulate API Call
  setTimeout(() => {
    const refNum = 'RV-2026-' + String(Math.floor(Math.random() * 90000) + 10000);
    document.getElementById('bookingRef').textContent = refNum;

    // Hide all panels, show success
    for (let i = 1; i <= 4; i++) {
      const p = document.getElementById(`panel${i}`);
      if (p) p.classList.remove('active');
    }
    const successPanel = document.getElementById('panelSuccess');
    if (successPanel) successPanel.classList.add('active');

    // Update wizard steps all done
    for (let i = 1; i <= 4; i++) {
      const ws = document.getElementById(`wizStep${i}`);
      if (ws) { ws.classList.remove('active'); ws.classList.add('done'); }
    }

    showToast('Booking submitted successfully! 🎉', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 1800);
}

// Pre-select from URL param
window.addEventListener('DOMContentLoaded', () => {
  const type = new URLSearchParams(window.location.search).get('type');
  if (type && deviceData[type]) {
    const card = document.querySelector(`.device-cat-card[data-cat="${type}"]`);
    if (card) card.click();
  }
});

// Shared toast (if not already defined)
if (typeof showToast === 'undefined') {
  function showToast(msg, type = 'info') {
    const container = document.getElementById('toastContainer');
    if (!container) return;
    const icons = { success: '✅', error: '❌', info: 'ℹ️' };
    const el = document.createElement('div');
    el.className = `toast ${type}`;
    el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
    container.appendChild(el);
    setTimeout(() => el.remove(), 4000);
  }
}
