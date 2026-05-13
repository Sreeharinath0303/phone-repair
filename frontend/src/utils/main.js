/* ============================================
   RepairVafe – Main JS (shared across pages)
   ============================================ */

const AUTH_TOKEN_KEY = 'rv_token';

function getAuthToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
}

function isTokenValid(token) {
  if (!token) return false;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp ? payload.exp * 1000 > Date.now() : true;
  } catch {
    return false;
  }
}

function isLoggedIn() {
  return isTokenValid(getAuthToken());
}

function getPageName() {
  const path = window.location.pathname;
  const parts = path.split('/').filter(Boolean);
  return parts.length ? parts[parts.length - 1].toLowerCase() : 'index.html';
}

function getLoginPathForCurrentPage() {
  return window.location.pathname.includes('/src/pages/') ? 'login.html' : './src/pages/login.html';
}

function redirectToLogin(target = window.location.pathname + window.location.search + window.location.hash) {
  const loginPath = getLoginPathForCurrentPage();
  window.location.replace(`${loginPath}?redirect=${encodeURIComponent(target)}`);
}

function enforceAuthForProtectedPages() {
  const protectedPages = new Set(['booking.html', 'tracking.html', 'quotation.html', 'feedback.html', 'admin.html']);
  const currentPage = getPageName();
  if (protectedPages.has(currentPage) && !isLoggedIn()) {
    redirectToLogin();
    return true;
  }
  return false;
}

function setupProtectedLinkInterception() {
  if (isLoggedIn()) return;
  const protectedNames = ['booking.html', 'tracking.html', 'quotation.html', 'feedback.html', 'admin.html'];
  document.querySelectorAll('a[href]').forEach(link => {
    const href = link.getAttribute('href') || '';
    const isProtected = protectedNames.some(name => href.toLowerCase().includes(name));
    if (!isProtected) return;
    link.addEventListener('click', (event) => {
      event.preventDefault();
      const targetUrl = new URL(href, window.location.href);
      redirectToLogin(targetUrl.pathname + targetUrl.search + targetUrl.hash);
    });
  });
}

function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  window.location.href = window.location.origin;
}

function updateHomeDynamicAuthUI() {
  const currentPage = getPageName();
  if (currentPage !== 'index.html' && window.location.pathname !== '/') return;

  const loggedIn = isLoggedIn();
  const adminNavLink = document.querySelector('#navLinks a[href*="admin.html"]');
  const navBookBtn = document.getElementById('navBookBtn');
  const heroBookBtn = document.getElementById('heroBookBtn');
  const ctaBookBtn = document.getElementById('ctaBookBtn');

  if (adminNavLink) {
    if (loggedIn) {
      adminNavLink.textContent = 'Dashboard';
      adminNavLink.setAttribute('href', './src/pages/admin.html');
      
      // Add a logout link directly to the navigation if authenticated
      if (!document.getElementById('logoutLink')) {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = '#';
        a.id = 'logoutLink';
        a.textContent = 'Logout';
        a.onclick = (e) => { e.preventDefault(); logout(); };
        li.appendChild(a);
        adminNavLink.parentElement.insertAdjacentElement('afterend', li);
      }
    } else {
      adminNavLink.textContent = 'Login';
      adminNavLink.setAttribute('href', './src/pages/login.html');
      const lo = document.getElementById('logoutLink');
      if (lo) lo.parentElement.remove();
    }
  }

  if (!loggedIn) {
    if (navBookBtn) navBookBtn.style.display = 'none';
    if (heroBookBtn) heroBookBtn.setAttribute('href', './src/pages/login.html?redirect=%2Fsrc%2Fpages%2Fbooking.html');
    if (ctaBookBtn) ctaBookBtn.setAttribute('href', './src/pages/login.html?redirect=%2Fsrc%2Fpages%2Fbooking.html');
  } else if (navBookBtn) {
    navBookBtn.style.display = 'none';
  }
}

if (enforceAuthForProtectedPages()) {
  // Stop executing page interactions if we redirect.
} else {
  setupProtectedLinkInterception();
  updateHomeDynamicAuthUI();
}

// --- Navbar scroll effect ---
const navbar = document.getElementById('navbar');
if (navbar) {
  window.addEventListener('scroll', () => {
    if (window.scrollY > 20) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  });
}

// --- Hamburger menu ---
const hamburger = document.getElementById('hamburger');
const navLinks = document.getElementById('navLinks');
if (hamburger && navLinks) {
  hamburger.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    hamburger.classList.toggle('open');
  });
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => {
      navLinks.classList.remove('open');
      hamburger.classList.remove('open');
    });
  });
}

// --- Toast Notifications ---
function showToast(message, type = 'info', duration = 4000) {
  const container = document.getElementById('toastContainer');
  if (!container) return;

  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span><span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// --- Smooth scroll for anchor links ---
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// --- Read URL params ---
function getUrlParam(name) {
  const params = new URLSearchParams(window.location.search);
  return params.get(name);
}

// --- Format date ---
function formatDate(dateStr) {
  if (!dateStr) return '–';
  const d = new Date(dateStr);
  return d.toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function initDynamicHomeExperience() {
  const stepsGrid = document.getElementById('stepsGrid');
  const servicesGrid = document.getElementById('servicesGrid');
  const testimonialsGrid = document.getElementById('testimonialsGrid');
  const heroTitle = document.getElementById('heroTitle');
  const heroSubtitle = document.getElementById('heroSubtitle');
  if (!stepsGrid || !servicesGrid || !testimonialsGrid || !heroTitle || !heroSubtitle) return;

  const stepsData = [
    { icon: '📱', title: 'Select Your Device', desc: 'Choose your device brand, model, and exact issue in seconds.', href: './src/pages/booking.html', cta: 'Start Here →' },
    { icon: '📝', title: 'Submit Request', desc: 'Enter your details and preferred pickup/visit schedule.', href: './src/pages/booking.html', cta: 'Book Now →' },
    { icon: '💰', title: 'Approve Quote', desc: 'Get transparent estimate and approve only when you are ready.', href: './src/pages/quotation.html', cta: 'See Quote →' },
    { icon: '🎉', title: 'Track & Collect', desc: 'Follow live status updates till completion and collect smoothly.', href: './src/pages/tracking.html', cta: 'Track Now →' }
  ];

  const servicesData = [
    { type: 'smartphone', icon: '📱', title: 'Smartphones', desc: 'Screen, battery, charging port, camera, speaker, water damage and more.', brands: ['Apple', 'Samsung', 'OnePlus', 'Xiaomi'] },
    { type: 'laptop', icon: '💻', title: 'Laptops', desc: 'Screen, keyboard, battery, RAM/SSD upgrades, motherboard and OS issues.', brands: ['Dell', 'HP', 'Lenovo', 'Apple'] },
    { type: 'tablet', icon: '📟', title: 'Tablets', desc: 'Cracked screens, battery changes, charging, speaker and software restoration.', brands: ['iPad', 'Samsung', 'Lenovo', 'Amazon'] },
    { type: 'smartwatch', icon: '⌚', title: 'Smartwatches', desc: 'Display, battery, band replacement and water-damage service.', brands: ['Apple Watch', 'Samsung', 'Fitbit'] }
  ];

  const testimonialsData = [
    { stars: '★★★★★', text: 'My iPhone screen was shattered. RepairVafe fixed it in under 4 hours and tracking was super clear.', name: 'Arjun Kumar', device: 'iPhone 14 Pro – Screen Repair', featured: false },
    { stars: '★★★★★', text: 'Booked online, got quote quickly, approved in one tap, and repair completed next day. Smooth flow.', name: 'Priya Rajan', device: 'Samsung S23 – Battery Replacement', featured: true },
    { stars: '★★★★★', text: 'Real-time status updates were excellent. I always knew what stage my laptop was in.', name: 'Meera Sharma', device: 'Dell XPS 15 – SSD Upgrade', featured: false }
  ];

  const heroVariants = [
    {
      title: 'Fast & Reliable<br /><span class="gradient-text">Device Repair</span><br />At Your Doorstep',
      subtitle: 'Book repairs for your smartphone, laptop, or tablet in minutes. Get transparent quotes, real-time tracking, and professional service — guaranteed.'
    },
    {
      title: 'Certified Experts<br /><span class="gradient-text">Honest Pricing</span><br />Zero Hidden Charges',
      subtitle: 'See detailed quotations before work starts. Approve only when satisfied, with full repair visibility at every stage.'
    },
    {
      title: 'Pickup, Diagnose<br /><span class="gradient-text">Repair, Deliver</span><br />All In One Flow',
      subtitle: 'From booking to completion, every step is managed through one smart workflow designed for speed and trust.'
    }
  ];

  const phoneScenarios = [
    { device: 'iPhone 15 Pro', issue: 'Screen Replacement', status: 'In Progress', progress: 65, stage: 2, quoteTitle: 'Quote Approved', quoteSub: '₹2,499 · Screen Fix', doneTitle: 'Repair Complete!', doneSub: 'Ready for pickup' },
    { device: 'Galaxy S24', issue: 'Battery Replacement', status: 'Diagnosed', progress: 42, stage: 1, quoteTitle: 'Diagnosis Done', quoteSub: 'Battery health at 61%', doneTitle: 'Pickup Scheduled', doneSub: 'Today, 6:30 PM' },
    { device: 'MacBook Air M2', issue: 'Keyboard + Trackpad', status: 'Quality Check', progress: 88, stage: 3, quoteTitle: 'Parts Installed', quoteSub: 'Final tests running', doneTitle: 'Delivery Today', doneSub: 'ETA 4:00 PM' }
  ];

  const repairsEl = document.getElementById('heroStatRepairs');
  const ratingEl = document.getElementById('heroStatRating');
  const turnEl = document.getElementById('heroStatTurnaround');
  const badgeText = document.getElementById('heroBadgeText');

  function renderSteps() {
    stepsGrid.innerHTML = stepsData.map((item, index) => {
      const connector = index < stepsData.length - 1 ? '<div class="step-connector"></div>' : '';
      return `<div class="step-card" data-step="${index + 1}">
        <div class="step-number">${String(index + 1).padStart(2, '0')}</div>
        <div class="step-icon-wrap"><div class="step-icon">${item.icon}</div></div>
        <h3>${item.title}</h3>
        <p>${item.desc}</p>
        <a href="${item.href}" class="step-link">${item.cta}</a>
      </div>${connector}`;
    }).join('');
  }

  function renderServices() {
    servicesGrid.innerHTML = servicesData.map(item => `
      <div class="service-card">
        <div class="service-icon">${item.icon}</div>
        <h3>${item.title}</h3>
        <p>${item.desc}</p>
        <div class="service-brands">${item.brands.map(brand => `<span>${brand}</span>`).join('')}</div>
        <a href="./src/pages/booking.html?type=${item.type}" class="btn btn-ghost">Book Repair →</a>
      </div>
    `).join('');
  }

  function renderTestimonials() {
    testimonialsGrid.innerHTML = testimonialsData.map(item => {
      const initials = item.name.split(' ').map(word => word[0]).join('').slice(0, 2).toUpperCase();
      return `
        <div class="testimonial-card ${item.featured ? 'featured' : ''}">
          <div class="stars">${item.stars}</div>
          <p>"${item.text}"</p>
          <div class="testimonial-author">
            <div class="author-avatar">${initials}</div>
            <div>
              <div class="author-name">${item.name}</div>
              <div class="author-device">${item.device}</div>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  function setPhoneStage(stageIndex) {
    const dots = document.querySelectorAll('.phone-steps .step-dot');
    const lines = document.querySelectorAll('.phone-steps .step-line');
    dots.forEach((dot, index) => {
      dot.classList.remove('active', 'current');
      if (index < stageIndex) dot.classList.add('active');
      if (index === stageIndex) dot.classList.add('current');
    });
    lines.forEach((line, index) => line.classList.toggle('active', index < stageIndex));
  }

  function animateCounter(el, target, formatter, duration = 1500) {
    if (!el) return;
    const start = performance.now();
    const from = 0;
    const step = (now) => {
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = from + (target - from) * eased;
      el.textContent = formatter(value, t === 1);
      if (t < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  function initHeroCounters() {
    const targetRepairs = Number(repairsEl?.dataset.target || 12000);
    const targetRating = Number(ratingEl?.dataset.target || 4.9);
    const targetTurn = Number(turnEl?.dataset.target || 24);
    animateCounter(repairsEl, targetRepairs, (value, done) => `${Math.round(value / 1000)}K${done ? '+' : ''}`);
    animateCounter(ratingEl, targetRating, (value) => `${value.toFixed(1)}★`);
    animateCounter(turnEl, targetTurn, (value) => `${Math.round(value)}hr`);
  }

  let heroIndex = 0;
  function rotateHeroCopy() {
    heroIndex = (heroIndex + 1) % heroVariants.length;
    const next = heroVariants[heroIndex];
    heroTitle.classList.add('dynamic-fade');
    heroSubtitle.classList.add('dynamic-fade');
    setTimeout(() => {
      heroTitle.innerHTML = next.title;
      heroSubtitle.textContent = next.subtitle;
      heroTitle.classList.remove('dynamic-fade');
      heroSubtitle.classList.remove('dynamic-fade');
    }, 220);
  }

  let phoneIndex = 0;
  function rotatePhoneScenario() {
    phoneIndex = (phoneIndex + 1) % phoneScenarios.length;
    const next = phoneScenarios[phoneIndex];
    const deviceEl = document.getElementById('phoneDevice');
    const issueEl = document.getElementById('phoneIssue');
    const statusEl = document.getElementById('phoneStatus');
    const progressEl = document.getElementById('phoneProgress');
    const quoteTitleEl = document.getElementById('quoteTitle');
    const quoteSubEl = document.getElementById('quoteSub');
    const doneTitleEl = document.getElementById('doneTitle');
    const doneSubEl = document.getElementById('doneSub');
    if (deviceEl) deviceEl.textContent = next.device;
    if (issueEl) issueEl.textContent = next.issue;
    if (statusEl) statusEl.textContent = next.status;
    if (progressEl) progressEl.style.width = `${next.progress}%`;
    if (quoteTitleEl) quoteTitleEl.textContent = next.quoteTitle;
    if (quoteSubEl) quoteSubEl.textContent = next.quoteSub;
    if (doneTitleEl) doneTitleEl.textContent = next.doneTitle;
    if (doneSubEl) doneSubEl.textContent = next.doneSub;
    setPhoneStage(next.stage);
  }

  function initPhoneClock() {
    const phoneTime = document.getElementById('phoneTime');
    if (!phoneTime) return;
    const tick = () => {
      phoneTime.textContent = new Date().toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: false });
    };
    tick();
    setInterval(tick, 10000);
  }

  function initHeroParallax() {
    const heroVisual = document.getElementById('heroVisual');
    const phoneMockup = document.querySelector('.phone-mockup');
    const quoteCard = document.getElementById('floatingQuote');
    const doneCard = document.getElementById('floatingDone');
    if (!heroVisual || !phoneMockup || !quoteCard || !doneCard) return;

    heroVisual.addEventListener('mousemove', (event) => {
      const rect = heroVisual.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width - 0.5;
      const y = (event.clientY - rect.top) / rect.height - 0.5;
      phoneMockup.style.transform = `translate(${x * 10}px, ${y * 12}px) rotateY(${x * 10}deg) rotateX(${y * -10}deg)`;
      quoteCard.style.transform = `translate(${x * -18}px, ${y * -12}px)`;
      doneCard.style.transform = `translate(${x * 14}px, ${y * 10}px)`;
    });
    heroVisual.addEventListener('mouseleave', () => {
      phoneMockup.style.transform = '';
      quoteCard.style.transform = '';
      doneCard.style.transform = '';
    });
  }

  const trustedCount = 10000 + Math.floor(Math.random() * 7000);
  if (badgeText) badgeText.textContent = `Trusted by ${trustedCount.toLocaleString('en-IN')}+ Customers`;

  renderSteps();
  renderServices();
  renderTestimonials();
  initHeroCounters();
  initHeroParallax();
  initPhoneClock();
  setInterval(rotateHeroCopy, 5500);
  setInterval(rotatePhoneScenario, 4500);
  observeAnimatedCards();
}

// --- Intersection Observer for animations ---
const observerOptions = { threshold: 0.1, rootMargin: '0px 0px -50px 0px' };
const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.style.opacity = '1';
      entry.target.style.transform = 'translateY(0)';
      observer.unobserve(entry.target);
    }
  });
}, observerOptions);

function observeAnimatedCards() {
  document.querySelectorAll('.step-card, .service-card, .testimonial-card, .stat-card').forEach(el => {
    el.style.opacity = '0';
    el.style.transform = 'translateY(20px)';
    el.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
    observer.observe(el);
  });
}

observeAnimatedCards();
initDynamicHomeExperience();

// Set min date for date pickers
const dateInputs = document.querySelectorAll('input[type="date"]');
dateInputs.forEach(input => {
  const today = new Date().toISOString().split('T')[0];
  input.min = today;
});
