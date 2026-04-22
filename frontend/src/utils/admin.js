/* ============================================
   RepairVafe – Admin Dashboard JS
   ============================================ */

// ============= DEMO DATA =============
const allRepairs = [
  { ref: 'RV-2026-00042', customer: 'Arjun Kumar', phone: '+91 98765 43210', device: 'iPhone 14 Pro', brand: 'Apple', repairs: 'Screen Replacement', status: 'In Progress', amount: '₹2,400', date: 'Apr 21, 2026', tech: 'Rajesh V.', email: 'arjun@email.com' },
  { ref: 'RV-2026-00041', customer: 'Meena Pillai', phone: '+91 99887 76655', device: 'Samsung S24', brand: 'Samsung', repairs: 'Battery Replacement', status: 'Awaiting Approval', amount: '₹1,800', date: 'Apr 21, 2026', tech: 'Suresh K.', email: 'meena@email.com' },
  { ref: 'RV-2026-00040', customer: 'Rahul Singh', phone: '+91 88776 65544', device: 'Dell XPS 13', brand: 'Dell', repairs: 'SSD Upgrade', status: 'Awaiting Approval', amount: '₹6,500', date: 'Apr 20, 2026', tech: 'Dinesh R.', email: 'rahul@email.com' },
  { ref: 'RV-2026-00039', customer: 'Kavya Nair', phone: '+91 77665 54433', device: 'iPad Pro 11"', brand: 'Apple', repairs: 'Screen Replacement', status: 'Received', amount: '₹4,500', date: 'Apr 20, 2026', tech: 'Arun M.', email: 'kavya@email.com' },
  { ref: 'RV-2026-00038', customer: 'Vikram Patel', phone: '+91 66554 43322', device: 'OnePlus 11', brand: 'OnePlus', repairs: 'Charging Port', status: 'Awaiting Approval', amount: '₹900', date: 'Apr 19, 2026', tech: 'Rajesh V.', email: 'vikram@email.com' },
  { ref: 'RV-2026-00037', customer: 'Divya Krishnan', phone: '+91 55443 32211', device: 'MacBook Air M2', brand: 'Apple', repairs: 'Keyboard Replacement', status: 'In Progress', amount: '₹3,200', date: 'Apr 19, 2026', tech: 'Dinesh R.', email: 'divya@email.com' },
  { ref: 'RV-2026-00036', customer: 'Suresh Babu', phone: '+91 44332 21100', device: 'Samsung A54', brand: 'Samsung', repairs: 'Camera Repair', status: 'Completed', amount: '₹1,500', date: 'Apr 18, 2026', tech: 'Suresh K.', email: 'suresh@email.com' },
  { ref: 'RV-2026-00035', customer: 'Ananya Rao', phone: '+91 33221 10099', device: 'Xiaomi Pad 6', brand: 'Xiaomi', repairs: 'Screen Replacement', status: 'Completed', amount: '₹3,500', date: 'Apr 18, 2026', tech: 'Arun M.', email: 'ananya@email.com' },
  { ref: 'RV-2026-00034', customer: 'Karthik Ravi', phone: '+91 22110 09988', device: 'Pixel 8 Pro', brand: 'Google', repairs: 'Water Damage', status: 'Awaiting Approval', amount: '₹2,800', date: 'Apr 17, 2026', tech: 'Rajesh V.', email: 'karthik@email.com' },
  { ref: 'RV-2026-00033', customer: 'Priya Sharma', phone: '+91 11009 98877', device: 'HP Spectre x360', brand: 'HP', repairs: 'Battery + Screen', status: 'Completed', amount: '₹7,200', date: 'Apr 17, 2026', tech: 'Dinesh R.', email: 'priya@email.com' },
  { ref: 'RV-2026-00032', customer: 'Arun Menon', phone: '+91 99988 77766', device: 'Apple Watch Series 9', brand: 'Apple', repairs: 'Screen Replacement', status: 'Completed', amount: '₹3,800', date: 'Apr 16, 2026', tech: 'Suresh K.', email: 'arun@email.com' },
  { ref: 'RV-2026-00031', customer: 'Lakshmi Devi', phone: '+91 88877 66655', device: 'Lenovo IdeaPad 5', brand: 'Lenovo', repairs: 'RAM Upgrade', status: 'Completed', amount: '₹2,200', date: 'Apr 16, 2026', tech: 'Arun M.', email: 'lakshmi@email.com' },
];

const techniciansData = [
  { name: 'Rajesh V.', spec: 'Smartphones & Tablets', rating: '4.9', repairs: 142, completed: 138, status: 'busy' },
  { name: 'Suresh K.', spec: 'All Devices', rating: '4.8', repairs: 98, completed: 95, status: 'available' },
  { name: 'Dinesh R.', spec: 'Laptops & Desktops', rating: '4.9', repairs: 115, completed: 112, status: 'busy' },
  { name: 'Arun M.', spec: 'Water Damage & Motherboard', rating: '4.7', repairs: 76, completed: 73, status: 'available' },
];

const feedbackData = [
  { name: 'Arjun Kumar', device: 'iPhone 14 Pro', rating: 5, text: 'Absolutely amazing service! Got my phone back in 4 hours. The tracking feature is brilliant.', date: 'Apr 22, 2026', recommend: 'Yes' },
  { name: 'Priya Rajan', device: 'Samsung S23', rating: 5, text: 'Professional, fast and affordable. Highly recommended to everyone!', date: 'Apr 21, 2026', recommend: 'Yes' },
  { name: 'Meera Sharma', device: 'Dell XPS 15', rating: 4, text: 'Good service overall. The technician was knowledgeable. Slight delay but worth it.', date: 'Apr 19, 2026', recommend: 'Yes' },
  { name: 'Karthik Ravi', device: 'Pixel 8 Pro', rating: 5, text: 'Transparent pricing, no hidden costs. The warranty gives peace of mind.', date: 'Apr 18, 2026', recommend: 'Yes' },
  { name: 'Suresh Babu', device: 'Samsung A54', rating: 4, text: 'Quick turnaround. Camera works perfectly now. Happy with the repair!', date: 'Apr 18, 2026', recommend: 'Maybe' },
];

// ============= SIDEBAR NAV =============
function showPage(pageId, linkEl) {
  // Hide all pages
  document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
  // Show target
  document.getElementById('page' + capitalize(pageId)).classList.add('active');
  // Update nav links
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  if (linkEl) linkEl.classList.add('active');
  // Update topbar title
  const titles = { dashboard: 'Dashboard', repairs: 'All Repairs', quotations: 'Quotations', customers: 'Customers', technicians: 'Technicians', feedback: 'Customer Feedback', reports: 'Analytics' };
  document.getElementById('topbarTitle').textContent = titles[pageId] || 'Admin';

  // Lazy load content
  if (pageId === 'repairs') renderRepairsTable(allRepairs);
  if (pageId === 'quotations') renderQuotationsTable();
  if (pageId === 'customers') renderCustomers();
  if (pageId === 'technicians') renderTechnicians();
  if (pageId === 'feedback') renderFeedback();
  if (pageId === 'reports') renderReports();

  // Close sidebar on mobile
  document.getElementById('sidebar').classList.remove('open');
  return false;
}

function capitalize(str) { return str.charAt(0).toUpperCase() + str.slice(1); }

// ============= SIDEBAR TOGGLE =============
document.getElementById('sidebarToggle')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.toggle('open');
});
document.getElementById('sidebarClose')?.addEventListener('click', () => {
  document.getElementById('sidebar').classList.remove('open');
});

// ============= DASHBOARD =============
function buildDashboard() {
  renderRecentRepairs();
  renderDonutChart();
  renderPendingList();
}

function renderRecentRepairs() {
  const tbody = document.getElementById('recentRepairsTable');
  if (!tbody) return;
  const recent = allRepairs.slice(0, 5);
  tbody.innerHTML = recent.map(r =>
    `<div class="mt-row">
      <div><div class="mt-ref">${r.ref}</div><div class="mt-name">${r.customer}</div></div>
      <div class="mt-device">${r.device}</div>
      <div class="mt-device">${r.amount}</div>
      <div>${getBadge(r.status)}</div>
    </div>`
  ).join('');
}

function renderDonutChart() {
  const statusCounts = {};
  allRepairs.forEach(r => { statusCounts[r.status] = (statusCounts[r.status] || 0) + 1; });

  const colors = {
    'In Progress': '#3b82f6', 'Awaiting Approval': '#f59e0b',
    'Completed': '#10b981', 'Received': '#8b5cf6', 'Diagnosed': '#06b6d4'
  };
  const total = allRepairs.length;
  let cumulativePercent = 0;
  const segments = [];
  const legendItems = [];

  Object.entries(statusCounts).forEach(([status, count]) => {
    const pct = (count / total) * 100;
    segments.push(`${colors[status] || '#64748b'} ${cumulativePercent}% ${cumulativePercent + pct}%`);
    cumulativePercent += pct;
    legendItems.push({ status, count, color: colors[status] || '#64748b' });
  });

  const donut = document.getElementById('donutChart');
  if (donut) {
    donut.style.background = `conic-gradient(${segments.join(', ')})`;
    // Inner circle cutout effect
    donut.style.borderRadius = '50%';
    donut.style.boxShadow = 'inset 0 0 0 30px var(--clr-surface)';
  }

  const legend = document.getElementById('donutLegend');
  if (legend) {
    legend.innerHTML = legendItems.map(item =>
      `<div class="legend-item">
        <div class="legend-dot" style="background:${item.color}"></div>
        <span class="legend-label">${item.status}</span>
        <span class="legend-val">${item.count}</span>
      </div>`
    ).join('');
  }
}

function renderPendingList() {
  const pending = allRepairs.filter(r => r.status === 'Awaiting Approval');
  document.getElementById('pendingBadge').textContent = pending.length;
  const list = document.getElementById('pendingList');
  if (!list) return;
  list.innerHTML = pending.map(r =>
    `<div class="pending-item">
      <div class="pi-info">
        <div class="pi-name">${r.customer} · ${r.device}</div>
        <div class="pi-detail">Ref: ${r.ref} · ${r.repairs} · ${r.date}</div>
      </div>
      <div class="pi-amount">${r.amount}</div>
      <div class="pi-actions">
        <a href="quotation.html" class="btn btn-success" style="padding:7px 14px;font-size:0.8rem">Send Quote</a>
        <button class="btn btn-outline" style="padding:7px 14px;font-size:0.8rem" onclick="openRepairModal('${r.ref}')">View</button>
      </div>
    </div>`
  ).join('');
}

// ============= REPAIRS TABLE =============
let filteredRepairs = [...allRepairs];

function renderRepairsTable(repairs) {
  const tbody = document.getElementById('repairsTableBody');
  if (!tbody) return;
  document.getElementById('repairCount').textContent = repairs.length + ' records';
  tbody.innerHTML = repairs.map(r =>
    `<tr>
      <td class="td-ref">${r.ref}</td>
      <td><div class="td-name">${r.customer}</div><div class="td-muted" style="font-size:0.75rem">${r.phone}</div></td>
      <td>${r.device}</td>
      <td class="td-muted">${r.repairs}</td>
      <td>${getBadge(r.status)}</td>
      <td>${r.amount}</td>
      <td class="td-muted">${r.date}</td>
      <td><div class="td-actions">
        <button class="action-btn" onclick="openRepairModal('${r.ref}')">View</button>
        <button class="action-btn danger" onclick="confirmDelete('${r.ref}')">Delete</button>
      </div></td>
    </tr>`
  ).join('');
}

function filterRepairs() {
  const search = document.getElementById('repairSearch')?.value?.toLowerCase() || '';
  const filter = document.getElementById('repairFilter')?.value || '';
  filteredRepairs = allRepairs.filter(r => {
    const matchSearch = !search ||
      r.customer.toLowerCase().includes(search) ||
      r.ref.toLowerCase().includes(search) ||
      r.device.toLowerCase().includes(search);
    const matchFilter = !filter || r.status === filter;
    return matchSearch && matchFilter;
  });
  renderRepairsTable(filteredRepairs);
}

// ============= QUOTATIONS TABLE =============
function renderQuotationsTable() {
  const tbody = document.getElementById('quotationsTableBody');
  if (!tbody) return;
  tbody.innerHTML = allRepairs.map(r =>
    `<tr>
      <td class="td-ref">${r.ref}</td>
      <td>${r.customer}</td>
      <td>${r.device}</td>
      <td>${r.amount}</td>
      <td>${getQuoteBadge(r.status)}</td>
      <td class="td-muted">${r.date}</td>
      <td><div class="td-actions">
        <a href="quotation.html" class="action-btn">View</a>
        <button class="action-btn" onclick="showToast('Quote sent to ${r.email}!', 'success')">Resend</button>
      </div></td>
    </tr>`
  ).join('');
}

function getQuoteBadge(status) {
  const map = {
    'Awaiting Approval': '<span class="badge badge-pending">Pending</span>',
    'In Progress': '<span class="badge badge-approved">Approved</span>',
    'Completed': '<span class="badge badge-completed">Approved</span>',
    'Received': '<span class="badge badge-received">Draft</span>'
  };
  return map[status] || '<span class="badge">–</span>';
}

// ============= CUSTOMERS =============
function renderCustomers() {
  const unique = {};
  allRepairs.forEach(r => {
    if (!unique[r.customer]) {
      unique[r.customer] = { ...r, count: 1, total: parseInt(r.amount.replace(/[₹,]/g, '')) };
    } else {
      unique[r.customer].count++;
      unique[r.customer].total += parseInt(r.amount.replace(/[₹,]/g, ''));
    }
  });

  const grid = document.getElementById('customersGrid');
  if (!grid) return;
  grid.innerHTML = Object.values(unique).map(c =>
    `<div class="customer-card">
      <div class="cc-header">
        <div class="cc-avatar">${c.customer.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
        <div>
          <div class="cc-name">${c.customer}</div>
          <div class="cc-phone">${c.phone}</div>
        </div>
      </div>
      <div class="cc-meta">
        <div class="cc-meta-row"><span>Email</span><span style="font-size:0.75rem">${c.email}</span></div>
        <div class="cc-meta-row"><span>Total Repairs</span><span>${c.count}</span></div>
        <div class="cc-meta-row"><span>Total Spent</span><span>₹${c.total.toLocaleString('en-IN')}</span></div>
        <div class="cc-meta-row"><span>Last Device</span><span>${c.device}</span></div>
      </div>
    </div>`
  ).join('');
}

function filterCustomers() {
  const search = document.getElementById('custSearch')?.value?.toLowerCase() || '';
  document.querySelectorAll('.customer-card').forEach(card => {
    const text = card.textContent.toLowerCase();
    card.style.display = text.includes(search) ? '' : 'none';
  });
}

// ============= TECHNICIANS =============
function renderTechnicians() {
  const grid = document.getElementById('techGrid');
  if (!grid) return;
  grid.innerHTML = techniciansData.map(t =>
    `<div class="tech-card">
      <div class="tc-header">
        <div class="tc-avatar">${t.name.split(' ').map(w=>w[0]).join('')}</div>
        <div>
          <div class="tc-name">${t.name}</div>
          <div class="tc-spec">${t.spec}</div>
          <div class="tc-rating">★ ${t.rating}/5.0</div>
        </div>
      </div>
      <div class="tc-stats">
        <div class="tc-stat">
          <div class="tc-stat-num">${t.repairs}</div>
          <div class="tc-stat-label">Total Repairs</div>
        </div>
        <div class="tc-stat">
          <div class="tc-stat-num">${t.completed}</div>
          <div class="tc-stat-label">Completed</div>
        </div>
      </div>
      <div class="tc-status ${t.status}">
        <span class="tc-status-dot"></span>
        ${t.status === 'available' ? 'Available' : 'Currently Busy'}
      </div>
    </div>`
  ).join('');
}

// ============= FEEDBACK =============
function renderFeedback() {
  // Stats
  const statsRow = document.getElementById('fbStatsRow');
  const avgRating = (feedbackData.reduce((s, f) => s + f.rating, 0) / feedbackData.length).toFixed(1);
  if (statsRow) {
    statsRow.innerHTML = `
      <div class="fb-stat-card"><div class="fb-stat-num fb-star">${avgRating}★</div><div class="fb-stat-label">Average Rating</div></div>
      <div class="fb-stat-card"><div class="fb-stat-num">${feedbackData.length}</div><div class="fb-stat-label">Total Reviews</div></div>
      <div class="fb-stat-card"><div class="fb-stat-num">${feedbackData.filter(f=>f.rating===5).length}</div><div class="fb-stat-label">5★ Reviews</div></div>
      <div class="fb-stat-card"><div class="fb-stat-num">${feedbackData.filter(f=>f.recommend==='Yes').length}</div><div class="fb-stat-label">Would Recommend</div></div>
    `;
  }

  const list = document.getElementById('adminFeedbackList');
  if (!list) return;
  list.innerHTML = feedbackData.map(f =>
    `<div class="fb-item">
      <div class="fb-item-header">
        <div class="fb-item-left">
          <div class="fb-item-avatar">${f.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
          <div>
            <div class="fb-item-name">${f.name}</div>
            <div class="fb-item-device">${f.device}</div>
          </div>
        </div>
        <div>
          <div class="fb-item-stars">${'★'.repeat(f.rating)}${'☆'.repeat(5-f.rating)}</div>
          <div class="fb-item-date">${f.date}</div>
        </div>
      </div>
      <div class="fb-item-text">"${f.text}"</div>
    </div>`
  ).join('');
}

// ============= REPORTS =============
function renderReports() {
  renderBarChart('deviceChart', [
    { label: 'iPhone 14 Pro', val: 45, max: 45 },
    { label: 'Samsung S24', val: 38, max: 45 },
    { label: 'Dell XPS', val: 27, max: 45 },
    { label: 'iPad Pro', val: 22, max: 45 },
    { label: 'OnePlus 11', val: 18, max: 45 }
  ]);
  renderBarChart('repairChart', [
    { label: 'Screen Replacement', val: 89, max: 89 },
    { label: 'Battery Replacement', val: 62, max: 89 },
    { label: 'Charging Port', val: 34, max: 89 },
    { label: 'Camera Repair', val: 28, max: 89 },
    { label: 'Water Damage', val: 21, max: 89 }
  ]);
  renderBarChart('revenueChart', [
    { label: 'Smartphones', val: 48, max: 48, prefix: '₹1.2L' },
    { label: 'Laptops', val: 38, max: 48, prefix: '₹98K' },
    { label: 'Tablets', val: 22, max: 48, prefix: '₹54K' },
    { label: 'Smartwatches', val: 14, max: 48, prefix: '₹32K' }
  ]);
  renderMonthChart();
}

function renderBarChart(containerId, data) {
  const container = document.getElementById(containerId);
  if (!container) return;
  container.innerHTML = data.map(item =>
    `<div class="bar-row">
      <span class="bar-label">${item.label}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(item.val/item.max)*100}%"></div>
      </div>
      <span class="bar-val">${item.prefix || item.val}</span>
    </div>`
  ).join('');
}

function renderMonthChart() {
  const months = [
    { m: 'Nov', h: 45 }, { m: 'Dec', h: 60 }, { m: 'Jan', h: 55 },
    { m: 'Feb', h: 70 }, { m: 'Mar', h: 80 }, { m: 'Apr', h: 95 }
  ];
  const maxH = Math.max(...months.map(m => m.h));
  const container = document.getElementById('monthChart');
  if (!container) return;
  container.innerHTML = months.map(m =>
    `<div class="month-bar-wrap">
      <div class="month-bar" style="height:${(m.h/maxH)*100}%"></div>
      <span class="month-label">${m.m}</span>
    </div>`
  ).join('');
}

// ============= MODAL =============
let currentRepairRef = null;

function openRepairModal(ref) {
  const repair = allRepairs.find(r => r.ref === ref);
  if (!repair) return;
  currentRepairRef = ref;

  document.getElementById('modalTitle').textContent = `Repair Details — ${ref}`;
  document.getElementById('modalBody').innerHTML = `
    <div class="modal-detail-grid">
      <div><label class="form-label">Customer</label><div>${repair.customer}</div></div>
      <div><label class="form-label">Phone</label><div>${repair.phone}</div></div>
      <div><label class="form-label">Device</label><div>${repair.device} (${repair.brand})</div></div>
      <div><label class="form-label">Repair Type</label><div>${repair.repairs}</div></div>
      <div><label class="form-label">Status</label><div>${getBadge(repair.status)}</div></div>
      <div><label class="form-label">Amount</label><div>${repair.amount}</div></div>
      <div><label class="form-label">Date</label><div>${repair.date}</div></div>
      <div><label class="form-label">Technician</label><div>${repair.tech}</div></div>
    </div>
  `;
  document.getElementById('statusUpdateSelect').value = repair.status;
  document.getElementById('repairModal').style.display = 'flex';
}

function closeModal() {
  document.getElementById('repairModal').style.display = 'none';
  currentRepairRef = null;
}

function updateRepairStatus() {
  if (!currentRepairRef) return;
  const newStatus = document.getElementById('statusUpdateSelect').value;
  const repair = allRepairs.find(r => r.ref === currentRepairRef);
  if (repair) {
    repair.status = newStatus;
    showToast(`Status updated to "${newStatus}" for ${currentRepairRef}`, 'success');
    closeModal();
    renderRepairsTable(filteredRepairs);
    renderRecentRepairs();
    renderDonutChart();
    renderPendingList();
  }
}

function confirmDelete(ref) {
  if (!confirm(`Are you sure you want to delete repair ${ref}?`)) return;
  const idx = allRepairs.findIndex(r => r.ref === ref);
  if (idx > -1) {
    allRepairs.splice(idx, 1);
    filteredRepairs = [...allRepairs];
    renderRepairsTable(filteredRepairs);
    showToast('Repair record deleted.', 'info');
  }
}

// Close modal on overlay click
document.getElementById('repairModal')?.addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});

// ============= BADGES =============
function getBadge(status) {
  const map = {
    'Received': 'badge-received',
    'Diagnosed': 'badge-inprogress',
    'Awaiting Approval': 'badge-pending',
    'In Progress': 'badge-inprogress',
    'Completed': 'badge-completed'
  };
  return `<span class="badge ${map[status] || ''}">${status}</span>`;
}

// ============= TOAST =============
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 4000);
}

// ============= INIT =============
window.addEventListener('DOMContentLoaded', () => {
  buildDashboard();
});
