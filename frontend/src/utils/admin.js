/* ============================================================
   RepairVafe – Admin Dashboard JS (Fully Dynamic / API-driven)
   All data fetched from backend: http://localhost:5000/api
   ============================================================ */

const API = (['localhost', '127.0.0.1', ''].includes(window.location.hostname))
  ? 'http://localhost:5000/api'
  : '/api';

// ── Auth headers ──────────────────────────────────────────────
function headers() {
  const token = (typeof getToken === 'function' ? getToken() : (localStorage.getItem('rv_token') || sessionStorage.getItem('rv_token')));
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token || ''}` };
}

// ── API helper ────────────────────────────────────────────────
async function api(path, opts = {}) {
  try {
    const res = await fetch(`${API}${path}`, { ...opts, headers: { ...headers(), ...(opts.headers || {}) } });
    if (res.status === 401) {
      if (typeof logout === 'function') logout();
      else { localStorage.clear(); sessionStorage.clear(); window.location.replace('login.html'); }
      return null;
    }
    return await res.json();
  } catch (e) {
    showToast('Cannot reach server. Is the backend running?', 'error');
    return null;
  }
}

// ── State ─────────────────────────────────────────────────────
let allRepairs = [];
let filteredRepairs = [];
let currentRepairId = null;

// ── Sidebar Nav ───────────────────────────────────────────────
function showPage(pageId, linkEl) {
  document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page' + capitalize(pageId));
  if (pg) pg.classList.add('active');
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  if (linkEl) linkEl.classList.add('active');
  const titles = { dashboard: 'Dashboard', repairs: 'All Repairs', quotations: 'Quotations', customers: 'Customers', technicians: 'Technicians', feedback: 'Customer Feedback', reports: 'Analytics' };
  document.getElementById('topbarTitle').textContent = titles[pageId] || 'Admin';

  // Lazy-load section data
  if (pageId === 'repairs')     loadRepairs();
  if (pageId === 'quotations')  loadQuotations();
  if (pageId === 'customers')   loadCustomers();
  if (pageId === 'technicians') loadTechnicians();
  if (pageId === 'feedback')    loadFeedback();
  if (pageId === 'reports')     renderReports();

  document.getElementById('sidebar').classList.remove('open');
  return false;
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

// ── Sidebar Mobile ────────────────────────────────────────────
document.getElementById('sidebarToggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
document.getElementById('sidebarClose')?.addEventListener('click', () => document.getElementById('sidebar').classList.remove('open'));

// ══════════════════════════════════════════════════════════════
//  DASHBOARD
// ══════════════════════════════════════════════════════════════
async function buildDashboard() {
  showSkeleton('recentRepairsTable', 5);

  const data = await api('/bookings/stats');
  if (!data?.success) return;

  const s = data.data;

  // Stat cards
  setEl('statNumTotal',    s.total        ?? 0);
  setEl('statNumPending',  s.pending       ?? 0);
  setEl('statNumProgress', s.inProgress    ?? 0);
  setEl('statNumComplete', s.completed     ?? 0);
  setEl('statNumRevenue',  s.revenue ? formatCurrency(s.revenue) : '₹0');

  // Feedback avg rating
  const fb = await api('/feedback');
  setEl('statNumRating', fb?.avgRating ?? '–');

  // Recent repairs table
  renderRecentTable(s.recent || []);

  // Donut from counts
  renderDonut({ 'In Progress': s.inProgress, 'Awaiting Approval': s.pending, 'Completed': s.completed, 'Received': s.total - s.inProgress - s.pending - s.completed });

  // Pending list
  loadPendingList();
}

function renderRecentTable(repairs) {
  const el = document.getElementById('recentRepairsTable');
  if (!el) return;
  if (!repairs.length) { el.innerHTML = '<div style="padding:20px;color:var(--clr-text-muted);text-align:center">No repairs yet</div>'; return; }
  el.innerHTML = repairs.map(r =>
    `<div class="mt-row">
      <div><div class="mt-ref">${r.referenceNumber}</div><div class="mt-name">${r.customerName}</div></div>
      <div class="mt-device">${r.deviceModel}</div>
      <div class="mt-device">${r.quotationAmount ? formatCurrency(r.quotationAmount) : '—'}</div>
      <div>${getBadge(r.status)}</div>
    </div>`
  ).join('');
}

async function loadPendingList() {
  const data = await api('/bookings?status=Awaiting%20Approval&limit=5');
  const pending = data?.data || [];
  document.getElementById('pendingBadge').textContent = data?.total || 0;
  const list = document.getElementById('pendingList');
  if (!list) return;
  if (!pending.length) { list.innerHTML = '<div style="padding:16px;color:var(--clr-text-muted)">No pending approvals 🎉</div>'; return; }
  list.innerHTML = pending.map(r =>
    `<div class="pending-item">
      <div class="pi-info">
        <div class="pi-name">${r.customerName} · ${r.deviceBrand} ${r.deviceModel}</div>
        <div class="pi-detail">Ref: ${r.referenceNumber} · ${r.repairTypes?.join(', ')} · ${formatDate(r.createdAt)}</div>
      </div>
      <div class="pi-amount">${r.quotationAmount ? formatCurrency(r.quotationAmount) : 'No Quote'}</div>
      <div class="pi-actions">
        <button class="btn btn-outline" style="padding:7px 14px;font-size:0.8rem" onclick="openRepairModal('${r._id}')">View</button>
      </div>
    </div>`
  ).join('');
}

function renderDonut(counts) {
  const colors = { 'In Progress': '#3b82f6', 'Awaiting Approval': '#f59e0b', 'Completed': '#10b981', 'Received': '#8b5cf6' };
  const total = Object.values(counts).reduce((s, v) => s + (v || 0), 0);
  if (!total) return;
  let cum = 0;
  const segs = [], legend = [];
  Object.entries(counts).forEach(([k, v]) => {
    if (!v || v <= 0) return;
    const pct = (v / total) * 100;
    segs.push(`${colors[k] || '#64748b'} ${cum}% ${cum + pct}%`);
    cum += pct;
    legend.push({ k, v, color: colors[k] || '#64748b' });
  });
  const donut = document.getElementById('donutChart');
  if (donut) donut.style.background = `conic-gradient(${segs.join(', ')})`;
  const leg = document.getElementById('donutLegend');
  if (leg) leg.innerHTML = legend.map(i => `<div class="legend-item"><div class="legend-dot" style="background:${i.color}"></div><span class="legend-label">${i.k}</span><span class="legend-val">${i.v}</span></div>`).join('');
}

// ══════════════════════════════════════════════════════════════
//  REPAIRS TABLE (dynamic)
// ══════════════════════════════════════════════════════════════
async function loadRepairs() {
  document.getElementById('repairsTableBody').innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--clr-text-muted)">Loading...</td></tr>`;
  const search = document.getElementById('repairSearch')?.value || '';
  const status = document.getElementById('repairFilter')?.value || '';

  let url = '/bookings?limit=50';
  if (status) url += `&status=${encodeURIComponent(status)}`;
  if (search) url += `&search=${encodeURIComponent(search)}`;

  const data = await api(url);
  allRepairs = data?.data || [];
  filteredRepairs = [...allRepairs];
  document.getElementById('repairCount').textContent = `${data?.total || 0} records`;
  renderRepairsTable(allRepairs);
}

function renderRepairsTable(repairs) {
  const tbody = document.getElementById('repairsTableBody');
  if (!tbody) return;
  if (!repairs.length) {
    tbody.innerHTML = `<tr><td colspan="8" style="text-align:center;padding:30px;color:var(--clr-text-muted)">No repairs found</td></tr>`;
    return;
  }
  tbody.innerHTML = repairs.map(r =>
    `<tr>
      <td class="td-ref">${r.referenceNumber}</td>
      <td><div class="td-name">${r.customerName}</div><div class="td-muted" style="font-size:.75rem">${r.customerPhone}</div></td>
      <td>${r.deviceBrand} ${r.deviceModel}</td>
      <td class="td-muted">${(r.repairTypes || []).join(', ')}</td>
      <td>${getBadge(r.status)}</td>
      <td>${r.quotationAmount ? formatCurrency(r.quotationAmount) : '—'}</td>
      <td class="td-muted">${formatDate(r.createdAt)}</td>
      <td><div class="td-actions">
        <button class="action-btn" onclick="openRepairModal('${r._id}')">View</button>
        <button class="action-btn danger" onclick="confirmDelete('${r._id}', '${r.referenceNumber}')">Delete</button>
      </div></td>
    </tr>`
  ).join('');
}

function filterRepairs() {
  clearTimeout(window._filterTimer);
  window._filterTimer = setTimeout(() => loadRepairs(), 400);
}

// ══════════════════════════════════════════════════════════════
//  QUOTATIONS (dynamic)
// ══════════════════════════════════════════════════════════════
async function loadQuotations() {
  document.getElementById('quotationsTableBody').innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--clr-text-muted)">Loading...</td></tr>`;
  const data = await api('/quotations');
  const rows = data?.data || [];
  const tbody = document.getElementById('quotationsTableBody');
  if (!rows.length) { tbody.innerHTML = `<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--clr-text-muted)">No quotations issued yet</td></tr>`; return; }
  tbody.innerHTML = rows.map(r =>
    `<tr>
      <td class="td-ref">${r.referenceNumber}</td>
      <td>${r.customerName}</td>
      <td>${r.deviceBrand} ${r.deviceModel}</td>
      <td>${r.quotationAmount ? formatCurrency(r.quotationAmount) : '—'}</td>
      <td>${getQuoteBadge(r.quotationStatus)}</td>
      <td class="td-muted">${formatDate(r.createdAt)}</td>
      <td><div class="td-actions">
        <button class="action-btn" onclick="openRepairModal('${r._id}')">View</button>
      </div></td>
    </tr>`
  ).join('');
}

// ══════════════════════════════════════════════════════════════
//  CUSTOMERS (dynamic)
// ══════════════════════════════════════════════════════════════
async function loadCustomers() {
  const grid = document.getElementById('customersGrid');
  if (!grid) return;
  grid.innerHTML = '<div style="padding:30px;color:var(--clr-text-muted);text-align:center">Loading customers...</div>';
  const data = await api('/customers');
  const custs = data?.data || [];
  if (!custs.length) { grid.innerHTML = '<div style="padding:30px;color:var(--clr-text-muted);text-align:center">No customers yet</div>'; return; }
  grid.innerHTML = custs.map(c =>
    `<div class="customer-card">
      <div class="cc-header">
        <div class="cc-avatar">${(c.name || 'UN').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}</div>
        <div><div class="cc-name">${c.name}</div><div class="cc-phone">${c.phone}</div></div>
      </div>
      <div class="cc-meta">
        <div class="cc-meta-row"><span>Email</span><span style="font-size:.75rem">${c.email}</span></div>
        <div class="cc-meta-row"><span>Total Repairs</span><span>${c.totalOrders}</span></div>
        <div class="cc-meta-row"><span>Total Spent</span><span>${c.totalSpent > 0 ? formatCurrency(c.totalSpent) : '—'}</span></div>
        <div class="cc-meta-row"><span>Last Device</span><span>${c.lastDevice || '—'}</span></div>
      </div>
    </div>`
  ).join('');
}

function filterCustomers() {
  const search = document.getElementById('custSearch')?.value?.toLowerCase() || '';
  document.querySelectorAll('.customer-card').forEach(card => {
    card.style.display = card.textContent.toLowerCase().includes(search) ? '' : 'none';
  });
}

// ══════════════════════════════════════════════════════════════
//  TECHNICIANS (dynamic)
// ══════════════════════════════════════════════════════════════
async function loadTechnicians() {
  const grid = document.getElementById('techGrid');
  if (!grid) return;
  grid.innerHTML = '<div style="padding:30px;color:var(--clr-text-muted);text-align:center">Loading technicians...</div>';
  const data = await api('/technicians');
  const techs = data?.data || [];
  if (!techs.length) {
    grid.innerHTML = `<div style="padding:30px;color:var(--clr-text-muted);text-align:center">No technicians added yet.<br><br>
      <button class="btn btn-primary" onclick="openAddTechModal()">+ Add First Technician</button></div>`;
    return;
  }
  grid.innerHTML = techs.map(t =>
    `<div class="tech-card">
      <div class="tc-header">
        <div class="tc-avatar">${(t.name || 'T').split(' ').map(w => w[0]).join('').slice(0,2)}</div>
        <div>
          <div class="tc-name">${t.name}</div>
          <div class="tc-spec">${t.specialization}</div>
          <div class="tc-rating">★ ${t.averageRating?.toFixed(1) || '–'}/5.0</div>
        </div>
      </div>
      <div class="tc-stats">
        <div class="tc-stat"><div class="tc-stat-num">${t.totalRepairs}</div><div class="tc-stat-label">Total</div></div>
        <div class="tc-stat"><div class="tc-stat-num">${t.completedRepairs}</div><div class="tc-stat-label">Completed</div></div>
      </div>
      <div class="tc-status ${t.status}">
        <span class="tc-status-dot"></span>
        ${t.status === 'available' ? 'Available' : t.status === 'busy' ? 'Busy' : 'Off Duty'}
      </div>
    </div>`
  ).join('');
}

// ══════════════════════════════════════════════════════════════
//  FEEDBACK (dynamic)
// ══════════════════════════════════════════════════════════════
async function loadFeedback() {
  const statsRow = document.getElementById('fbStatsRow');
  const list     = document.getElementById('adminFeedbackList');
  if (list) list.innerHTML = '<div style="padding:30px;color:var(--clr-text-muted);text-align:center">Loading feedback...</div>';

  const data = await api('/feedback');
  const fbs  = data?.data || [];

  if (statsRow) {
    statsRow.innerHTML = `
      <div class="fb-stat-card"><div class="fb-stat-num fb-star">${data?.avgRating ?? '–'}★</div><div class="fb-stat-label">Average Rating</div></div>
      <div class="fb-stat-card"><div class="fb-stat-num">${data?.total ?? 0}</div><div class="fb-stat-label">Total Reviews</div></div>
      <div class="fb-stat-card"><div class="fb-stat-num">${fbs.filter(f => f.overallRating === 5).length}</div><div class="fb-stat-label">5★ Reviews</div></div>
      <div class="fb-stat-card"><div class="fb-stat-num">${fbs.filter(f => f.wouldRecommend === 'yes').length}</div><div class="fb-stat-label">Would Recommend</div></div>
    `;
  }
  if (!fbs.length) { if (list) list.innerHTML = '<div style="padding:30px;color:var(--clr-text-muted);text-align:center">No feedback received yet</div>'; return; }
  if (list) list.innerHTML = fbs.map(f =>
    `<div class="fb-item">
      <div class="fb-item-header">
        <div class="fb-item-left">
          <div class="fb-item-avatar">${(f.customerName || 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase()}</div>
          <div><div class="fb-item-name">${f.customerName}</div><div class="fb-item-device">${f.deviceName} · Ref: ${f.referenceNumber}</div></div>
        </div>
        <div>
          <div class="fb-item-stars">${'★'.repeat(f.overallRating)}${'☆'.repeat(5 - f.overallRating)}</div>
          <div class="fb-item-date">${formatDate(f.createdAt)}</div>
        </div>
      </div>
      <div class="fb-item-text">"${f.comment || 'No written review'}"</div>
    </div>`
  ).join('');
}

// ══════════════════════════════════════════════════════════════
//  ANALYTICS (static charts — no dedicated API endpoint needed)
// ══════════════════════════════════════════════════════════════
async function renderReports() {
  // Fetch real booking data for charts
  const data = await api('/bookings?limit=200');
  const repairs = data?.data || [];

  // Device frequency
  const deviceCounts = {};
  repairs.forEach(r => { const k = `${r.deviceBrand} ${r.deviceModel}`; deviceCounts[k] = (deviceCounts[k] || 0) + 1; });
  const topDevices = Object.entries(deviceCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxD = topDevices[0]?.[1] || 1;
  renderBarChart('deviceChart', topDevices.map(([l, v]) => ({ label: l, val: v, max: maxD })));

  // Repair type frequency
  const repairCounts = {};
  repairs.forEach(r => (r.repairTypes || []).forEach(rt => { repairCounts[rt] = (repairCounts[rt] || 0) + 1; }));
  const topRepairs = Object.entries(repairCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const maxR = topRepairs[0]?.[1] || 1;
  renderBarChart('repairChart', topRepairs.map(([l, v]) => ({ label: l, val: v, max: maxR })));

  // Monthly volume (last 6 months)
  const monthlyCounts = {};
  const months = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(); d.setMonth(d.getMonth() - i);
    const key = d.toLocaleString('en-IN', { month: 'short' });
    monthlyCounts[key] = 0;
    months.push(key);
  }
  repairs.forEach(r => {
    const mn = new Date(r.createdAt).toLocaleString('en-IN', { month: 'short' });
    if (monthlyCounts[mn] !== undefined) monthlyCounts[mn]++;
  });
  const maxM = Math.max(...Object.values(monthlyCounts), 1);
  renderMonthChart(months.map(m => ({ m, h: (monthlyCounts[m] / maxM) * 100 })));

  // Revenue by category
  const catRev = {};
  repairs.forEach(r => {
    const c = r.deviceCategory || 'other';
    catRev[c] = (catRev[c] || 0) + ((r.quotationAmount || 0) - (r.discount || 0));
  });
  const topCats = Object.entries(catRev).sort((a, b) => b[1] - a[1]);
  const maxC = topCats[0]?.[1] || 1;
  renderBarChart('revenueChart', topCats.map(([l, v]) => ({ label: capitalize(l), val: v, max: maxC, prefix: formatCurrency(v) })));
}

function renderBarChart(id, data) {
  const el = document.getElementById(id);
  if (!el || !data.length) return;
  el.innerHTML = data.map(item =>
    `<div class="bar-row">
      <span class="bar-label">${item.label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${((item.val/item.max)*100).toFixed(1)}%"></div></div>
      <span class="bar-val">${item.prefix || item.val}</span>
    </div>`
  ).join('');
}

function renderMonthChart(months) {
  const el = document.getElementById('monthChart');
  if (!el) return;
  el.innerHTML = months.map(m =>
    `<div class="month-bar-wrap">
      <div class="month-bar" style="height:${m.h || 4}%"></div>
      <span class="month-label">${m.m}</span>
    </div>`
  ).join('');
}

// ══════════════════════════════════════════════════════════════
//  REPAIR MODAL (dynamic — fetch single booking by _id)
// ══════════════════════════════════════════════════════════════
async function openRepairModal(id) {
  currentRepairId = id;
  document.getElementById('modalTitle').textContent = 'Loading...';
  document.getElementById('modalBody').innerHTML = '<div style="padding:20px;text-align:center;color:var(--clr-text-muted)">Fetching details...</div>';
  document.getElementById('repairModal').style.display = 'flex';

  // Find in local cache first, else fetch
  const cached = allRepairs.find(r => r._id === id);
  const r = cached || (await api(`/bookings/${id}`))?.data;
  if (!r) { document.getElementById('modalBody').innerHTML = '<div style="color:red;padding:20px">Failed to load repair details.</div>'; return; }

  document.getElementById('modalTitle').textContent = `Repair Details — ${r.referenceNumber}`;
  document.getElementById('modalBody').innerHTML = `
    <div class="modal-detail-grid">
      <div><label class="form-label">Customer</label><div>${r.customerName}</div></div>
      <div><label class="form-label">Phone</label><div>${r.customerPhone}</div></div>
      <div><label class="form-label">Email</label><div>${r.customerEmail}</div></div>
      <div><label class="form-label">Service</label><div>${r.serviceType}</div></div>
      <div><label class="form-label">Device</label><div>${r.deviceBrand} ${r.deviceModel} (${r.deviceCategory})</div></div>
      <div><label class="form-label">Repair Type</label><div>${(r.repairTypes || []).join(', ')}</div></div>
      <div><label class="form-label">Status</label><div>${getBadge(r.status)}</div></div>
      <div><label class="form-label">Quote Status</label><div>${getQuoteBadge(r.quotationStatus)}</div></div>
      <div><label class="form-label">Amount</label><div>${r.quotationAmount ? formatCurrency(r.quotationAmount) : '—'}</div></div>
      <div><label class="form-label">Discount</label><div>${r.discount ? formatCurrency(r.discount) : '—'}</div></div>
      <div><label class="form-label">Booked</label><div>${formatDate(r.createdAt)}</div></div>
      <div><label class="form-label">Preferred Date</label><div>${formatDate(r.preferredDate)}</div></div>
    </div>
    ${r.technicianNote ? `<div style="margin-top:16px;padding:14px;background:rgba(59,130,246,0.08);border-radius:10px;font-size:.875rem;color:var(--clr-text-muted)"><strong>Technician Note:</strong> ${r.technicianNote}</div>` : ''}
    ${r.issueDescription ? `<div style="margin-top:10px;padding:14px;background:rgba(255,255,255,0.04);border-radius:10px;font-size:.875rem;color:var(--clr-text-muted)"><strong>Issue Description:</strong> ${r.issueDescription}</div>` : ''}
  `;
  document.getElementById('statusUpdateSelect').value = r.status;
}

function closeModal() {
  document.getElementById('repairModal').style.display = 'none';
  currentRepairId = null;
}

document.getElementById('repairModal')?.addEventListener('click', function(e) { if (e.target === this) closeModal(); });

async function updateRepairStatus() {
  if (!currentRepairId) return;
  const newStatus = document.getElementById('statusUpdateSelect').value;
  const btn = document.querySelector('.modal-footer .btn-primary');
  btn.textContent = 'Updating...'; btn.disabled = true;

  const data = await api(`/bookings/${currentRepairId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status: newStatus, note: `Status updated to ${newStatus} by admin` })
  });

  btn.textContent = 'Update Status'; btn.disabled = false;

  if (data?.success) {
    showToast(`✅ Status updated to "${newStatus}"`, 'success');
    closeModal();
    loadRepairs();
    buildDashboard();
  } else {
    showToast(data?.message || 'Update failed', 'error');
  }
}

async function confirmDelete(id, ref) {
  if (!confirm(`Delete repair ${ref}? This cannot be undone.`)) return;
  const data = await api(`/bookings/${id}`, { method: 'DELETE' });
  if (data?.success) {
    showToast('Repair deleted.', 'info');
    loadRepairs();
    buildDashboard();
  } else {
    showToast(data?.message || 'Delete failed', 'error');
  }
}

// ══════════════════════════════════════════════════════════════
//  UTILITIES
// ══════════════════════════════════════════════════════════════
function getBadge(status) {
  const map = { 'Received': 'badge-received', 'Diagnosed': 'badge-inprogress', 'Awaiting Approval': 'badge-pending', 'In Progress': 'badge-inprogress', 'Completed': 'badge-completed', 'Cancelled': 'badge-rejected' };
  return `<span class="badge ${map[status] || ''}">${status}</span>`;
}

function getQuoteBadge(qs) {
  const map = { 'Approved': 'badge-completed', 'Pending': 'badge-pending', 'Rejected': 'badge-rejected', 'Not Issued': 'badge-received' };
  return `<span class="badge ${map[qs] || ''}">${qs || '—'}</span>`;
}

function formatCurrency(n) {
  return '₹' + Number(n).toLocaleString('en-IN');
}

function formatDate(d) {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' });
}

function setEl(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val;
}

function showSkeleton(id, rows = 3) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = Array(rows).fill(`<div style="height:48px;border-radius:8px;background:rgba(255,255,255,0.05);margin-bottom:8px;animation:pulse 1.5s ease-in-out infinite"></div>`).join('');
}

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

// ── Init ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  buildDashboard();
});
