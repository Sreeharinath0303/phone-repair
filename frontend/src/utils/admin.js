/* ============================================================
   RepairVafe – Admin Dashboard JS (Consolidated & Modular)
   ============================================================ */

const API = (['localhost', '127.0.0.1', ''].includes(window.location.hostname))
  ? 'http://localhost:5000/api'
  : '/api';

// ── Auth & Headers ──────────────────────────────────────────────
function headers() {
  const token = localStorage.getItem('rv_token') || sessionStorage.getItem('rv_token') || localStorage.getItem('adminToken');
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token || ''}` };
}

async function api(path, opts = {}) {
  try {
    const res = await fetch(`${API}${path}`, { ...opts, headers: { ...headers(), ...(opts.headers || {}) } });
    if (res.status === 401) {
      localStorage.clear(); sessionStorage.clear(); window.location.replace('login.html');
      return null;
    }
    return await res.json();
  } catch (e) {
    showToast('Cannot reach server. Is the backend running?', 'error');
    return null;
  }
}

// ── State ─────────────────────────────────────────────────────
let allOrders = [];
let currentRepairId = null;
let currentDataTab = 'repair-types';

// ── Navigation ────────────────────────────────────────────────
function showPage(pageId, linkEl) {
  document.querySelectorAll('.admin-page').forEach(p => p.classList.remove('active'));
  const pg = document.getElementById('page' + pageId.charAt(0).toUpperCase() + pageId.slice(1).replace(/-([a-z])/g, g => g[1].toUpperCase()));
  if (pg) pg.classList.add('active');
  
  document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
  if (linkEl) linkEl.classList.add('active');

  const titles = {
    dashboard: 'Dashboard',
    leads: 'Lead Management',
    bookings: 'Booking Management',
    orders: 'Order Management',
    quotations: 'Quotations',
    customers: 'Customer Base',
    technicians: 'Partner Network',
    reports: 'Business Analytics',
    location: 'Location Intelligence',
    feedback: 'Customer Feedback',
    'email-templates': 'Email Templates',
    logs: 'Communication Logs',
    'system-data': 'System Data',
    admins: 'Admin Users',
    'comm-settings': 'Communication Settings'
  };
  document.getElementById('topbarTitle').textContent = titles[pageId] || 'Admin Dashboard';

  // Load data for specific pages
  if (pageId === 'dashboard')       buildDashboard();
  if (pageId === 'leads')           loadLeads();
  if (pageId === 'bookings')        loadBookings();
  if (pageId === 'orders')          loadOrders();
  if (pageId === 'quotations')      loadQuotations();
  if (pageId === 'customers')       loadCustomers();
  if (pageId === 'technicians')     loadTechnicians();
  if (pageId === 'reports')         renderReports();
  if (pageId === 'location')        loadLocationAnalytics();
  if (pageId === 'feedback')        loadFeedback();
  if (pageId === 'email-templates') loadEmailTemplates();
  if (pageId === 'logs')            loadLogs();
  if (pageId === 'system-data')     loadSystemData();
  if (pageId === 'admins')          loadAllAdmins();
  if (pageId === 'comm-settings')   loadCommunicationSettings();

  document.getElementById('sidebar').classList.remove('open');
  return false;
}

// ── Dashboard ─────────────────────────────────────────────────
async function buildDashboard() {
  const data = await api('/admin/analytics');
  if (!data?.success) return;
  const s = data.data;

  setEl('statNumTotalLeads',      s.totalLeads || 0);
  setEl('statNumIncompleteLeads',  s.incompleteLeads || 0);
  setEl('statNumTotalBookings',    s.totalBookings || 0);
  setEl('statNumPendingQuotes',   s.pendingQuotations || 0);
  setEl('statNumApprovedQuotes',  s.approvedQuotations || 0);
  setEl('statNumAssignedOrders',  s.assignedOrders || 0);

  setEl('metricsGrossRev',  formatCurrency(s.financials?.grossRevenue || 0));
  setEl('metricsPayouts',   formatCurrency(s.financials?.totalPayouts || 0));
  setEl('metricsNetProfit', formatCurrency(s.financials?.netProfit || 0));

  // Load recent orders
  const ordersData = await api('/bookings?limit=5');
  const recent = ordersData?.data || [];
  document.getElementById('recentRepairsTable').innerHTML = recent.map(r => `
    <div class="mt-row">
      <div><div class="mt-ref">${r.referenceNumber}</div><div class="mt-name">${r.customerName}</div></div>
      <div class="mt-device">${r.deviceBrand} ${r.deviceModel}</div>
      <div>${getBadge(r.status)}</div>
    </div>
  `).join('') || '<div style="padding:20px;text-align:center">No recent orders</div>';
}

// ── Communication Logs ────────────────────────────────────────
async function loadLogs() {
  const tbody = document.getElementById('logsTableBody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px">Loading logs...</td></tr>';
  const data = await api('/admin/notification-logs');
  const logs = data?.data || [];

  tbody.innerHTML = logs.map(l => `
    <tr>
      <td class="td-muted">${formatDate(l.sentAt)}</td>
      <td style="font-weight:600">${l.eventName}</td>
      <td>${l.recipient}</td>
      <td><span style="text-transform:uppercase; font-size:0.7rem">${l.channel}</span></td>
      <td><span class="badge ${l.deliveryStatus === 'delivered' ? 'badge-completed' : 'badge-pending'}">${l.deliveryStatus}</span></td>
      <td><button class="action-btn" onclick="viewLogDetail('${l._id}')">View</button></td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;padding:20px">No logs found</td></tr>';
}

async function viewLogDetail(id) {
  const data = await api(`/admin/notification-logs?id=${id}`);
  const log = data?.data?.[0];
  if (!log) return;

  document.getElementById('modalTitle').textContent = `Log Detail: ${log.eventName}`;
  document.getElementById('modalBody').innerHTML = `
    <div style="font-size:0.9rem">
      <p><strong>Sent At:</strong> ${new Date(log.sentAt).toLocaleString()}</p>
      <p><strong>Recipient:</strong> ${log.recipient}</p>
      <p><strong>Channel:</strong> ${log.channel.toUpperCase()}</p>
      <p><strong>Status:</strong> ${log.deliveryStatus}</p>
      <div style="margin-top:15px; padding:15px; background:rgba(0,0,0,0.2); border-radius:10px; font-family:monospace; white-space:pre-wrap;">${log.messageBody || 'No message content stored.'}</div>
    </div>
  `;
  document.getElementById('modalStatusActions').innerHTML = '';
  document.getElementById('repairModal').style.display = 'flex';
}

async function loadCommunicationSettings() {
  const data = await api('/admin/communication-settings');
  if (!data?.success) return;
  const s = data.data;
  setVal('otpExpiry', s.otpExpiry);
  setVal('maxOtpAttempts', s.maxOtpAttempts);
  setCheck('emailNotif', s.emailNotifications);
  setCheck('smsNotif', s.smsNotifications);
  setCheck('autoFollowup', s.autoFollowup);
  setVal('followupDays', s.followupDays);
}

async function saveCommunicationSettings() {
  const payload = {
    otpExpiry: Number(getVal('otpExpiry')),
    maxOtpAttempts: Number(getVal('maxOtpAttempts')),
    emailNotifications: getCheck('emailNotif'),
    smsNotifications: getCheck('smsNotif'),
    autoFollowup: getCheck('autoFollowup'),
    followupDays: Number(getVal('followupDays'))
  };
  const res = await api('/admin/communication-settings', { method: 'PUT', body: JSON.stringify(payload) });
  if (res?.success) showToast('Settings updated', 'success');
}

// ── Lead Management ───────────────────────────────────────────
async function loadLeads() {
  const tbody = document.getElementById('leadsTableBody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px">Loading...</td></tr>';
  const data = await api('/admin/incomplete-leads');
  const leads = data?.data || [];
  document.getElementById('leadsCount').textContent = `${leads.length} leads`;
  
  tbody.innerHTML = leads.map(l => `
    <tr>
      <td>${l.customerName}</td>
      <td>${l.mobileNumber}<br><span class="td-muted">${l.email || ''}</span></td>
      <td>${l.deviceBrand} ${l.deviceModel}</td>
      <td><span class="badge badge-pending">${l.stage || 'New'}</span></td>
      <td class="td-muted">${formatDate(l.createdAt)}</td>
      <td><button class="action-btn" onclick="openLeadModal('${l._id}')">View</button></td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;padding:20px">No leads found</td></tr>';
}

// ── Booking Management ────────────────────────────────────────
async function loadBookings() {
  const tbody = document.getElementById('bookingsTableBody');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px">Loading...</td></tr>';
  const data = await api('/bookings?status=Pending');
  const bookings = data?.data || [];
  document.getElementById('bookingsCount').textContent = `${bookings.length} new bookings`;

  tbody.innerHTML = bookings.map(b => `
    <tr>
      <td class="td-ref">${b.referenceNumber}</td>
      <td>${b.customerName}</td>
      <td>${b.deviceBrand} ${b.deviceModel}</td>
      <td>${formatDate(b.preferredDate)}</td>
      <td>${getBadge(b.status)}</td>
      <td><button class="action-btn" onclick="openRepairModal('${b._id}')">Manage</button></td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;padding:20px">No new bookings</td></tr>';
}

// ── Order Management ──────────────────────────────────────────
async function loadOrders() {
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px">Loading...</td></tr>';
  const status  = document.getElementById('orderStatusFilter')?.value || '';
  const search  = document.getElementById('ordersSearch')?.value || '';
  const city    = document.getElementById('orderCityFilter')?.value || '';
  const state   = document.getElementById('orderStateFilter')?.value || '';
  const pincode = document.getElementById('orderPincodeFilter')?.value || '';

  const qs = new URLSearchParams({ status, search, city, state, pincode }).toString();
  const data = await api(`/bookings?${qs}`);
  allOrders = data?.data || [];
  document.getElementById('ordersCount').textContent = `${allOrders.length} orders`;

  const srcIcon = (src) => ({ gps: '📍', ip: '🌐', manual: '✏️' }[src] || '');

  tbody.innerHTML = allOrders.map(o => `
    <tr>
      <td class="td-ref">${o.referenceNumber}</td>
      <td>${o.customerName}</td>
      <td>${o.deviceBrand} ${o.deviceModel}</td>
      <td style="font-size:0.8rem;">${srcIcon(o.locationSource)} ${o.city || '—'}${o.state ? ', ' + o.state : ''}<br><span class="td-muted">${o.pincode || ''}</span></td>
      <td>${getBadge(o.status)}</td>
      <td>${o.assignedTechnician?.name || '—'}</td>
      <td style="font-weight:700">${formatCurrency(o.finalAmount || o.quotationAmount || 0)}</td>
      <td><button class="action-btn" onclick="openRepairModal('${o._id}')">Details</button></td>
    </tr>
  `).join('') || '<tr><td colspan="8" style="text-align:center;padding:20px">No orders found</td></tr>';
}

// ── Quotations ────────────────────────────────────────────────
async function loadQuotations() {
  const tbody = document.getElementById('quotationsTableBody');
  tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px">Loading...</td></tr>';
  const data = await api('/bookings?hasQuotation=true');
  const quotes = data?.data || [];

  tbody.innerHTML = quotes.map(q => `
    <tr>
      <td class="td-ref">${q.referenceNumber}</td>
      <td>${q.customerName}</td>
      <td>${q.deviceBrand} ${q.deviceModel}</td>
      <td style="font-weight:700">${formatCurrency(q.quotationAmount)}</td>
      <td>${getQuoteBadge(q.quotationStatus)}</td>
      <td class="td-muted">${formatDate(q.createdAt)}</td>
      <td><button class="action-btn" onclick="openRepairModal('${q._id}')">View</button></td>
    </tr>
  `).join('') || '<tr><td colspan="7" style="text-align:center;padding:20px">No quotations found</td></tr>';
}

// ── Customer Management ───────────────────────────────────────
async function loadCustomers() {
  const grid = document.getElementById('customersGrid');
  grid.innerHTML = '<div style="padding:20px;text-align:center">Loading...</div>';
  const data = await api('/admin/customers');
  const custs = data?.data || [];

  grid.innerHTML = `
    <div class="data-table-wrap">
      <table class="data-table">
        <thead><tr><th>Name</th><th>Email / Phone</th><th>Location</th><th>Stats</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${custs.map(c => `
            <tr>
              <td style="font-weight:600">${c.name}</td>
              <td>${c.email}<br><span class="td-muted">${c.phone || ''}</span></td>
              <td>${c.city || '—'}${c.state ? ', ' + c.state : ''}</td>
              <td class="td-muted">Repairs: ${c.totalRepairs || 0}</td>
              <td><span class="badge ${c.isActive ? 'badge-completed' : 'badge-rejected'}">${c.isActive ? 'Active' : 'Inactive'}</span></td>
              <td>
                <div class="td-actions">
                  <button class="action-btn" onclick="editCustomer('${c._id}')">Edit</button>
                  <button class="action-btn" onclick="viewCustomerHistory('${c.email}')">History</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ── Partner Management ────────────────────────────────────────
async function loadTechnicians() {
  const grid = document.getElementById('techGrid');
  grid.innerHTML = '<div style="padding:20px;text-align:center">Loading partners...</div>';
  const data = await api('/admin/partners');
  const partners = data?.data || [];

  grid.innerHTML = `
    <div class="data-table-wrap">
      <table class="data-table">
        <thead><tr><th>Business / Profile</th><th>Location</th><th>Capability</th><th>Performance</th><th>Status</th><th>Actions</th></tr></thead>
        <tbody>
          ${partners.map(p => `
            <tr>
              <td><div style="font-weight:700">${p.businessName || p.name}</div><div class="td-muted">${p.phone}</div></td>
              <td>${p.city || '—'}, ${p.state || '—'}</td>
              <td class="td-muted">${p.supportedBrands?.slice(0,2).join(', ')}${p.supportedBrands?.length > 2 ? '...' : ''}</td>
              <td>Done: ${p.completedRepairs || 0} / Bal: ${formatCurrency(p.payoutBalance || 0)}</td>
              <td>${p.isActive ? '<span class="badge badge-completed">Active</span>' : '<span class="badge badge-rejected">Inactive</span>'}</td>
              <td>
                <div class="td-actions">
                  <button class="action-btn" onclick="editPartner('${p._id}')">Profile</button>
                  <button class="action-btn" onclick="openPayoutModal('${p._id}', ${p.payoutBalance})">Payout</button>
                </div>
              </td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>
  `;
}

// ── Admin Management ──────────────────────────────────────────
async function loadAllAdmins() {
  const tbody = document.getElementById('adminsTableBody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px">Loading...</td></tr>';
  const data = await api('/admin/admins');
  const admins = data?.data || [];
  tbody.innerHTML = admins.map(a => `
    <tr>
      <td style="font-weight:600">${a.name}</td>
      <td>${a.email}</td>
      <td><span class="badge" style="background:rgba(255,255,255,0.05)">${a.role.toUpperCase()}</span></td>
      <td><span class="badge ${a.isActive ? 'badge-completed' : 'badge-rejected'}">${a.isActive ? 'Active' : 'Inactive'}</span></td>
      <td><button class="action-btn" onclick="resetAdminPassword('${a._id}')">Reset Pass</button></td>
    </tr>
  `).join('');
}

async function showAddAdminModal() {
  const modal = document.getElementById('formModal');
  document.getElementById('formModalTitle').textContent = 'Create New Admin';
  document.getElementById('formModalBody').innerHTML = `
    <form class="modal-form">
      <div class="form-group"><label>Name</label><input type="text" id="admName" class="form-input" required></div>
      <div class="form-group"><label>Email</label><input type="email" id="admEmail" class="form-input" required></div>
      <div class="form-group"><label>Password</label><input type="password" id="admPass" class="form-input" required></div>
      <div class="form-group"><label>Role</label>
        <select id="admRole" class="form-select">
          <option value="admin">Admin</option>
          <option value="superadmin">Super Admin</option>
        </select>
      </div>
    </form>
  `;
  document.getElementById('formModalSubmit').onclick = saveAdmin;
  modal.style.display = 'flex';
}

async function saveAdmin() {
  const payload = {
    name: getVal('admName'),
    email: getVal('admEmail'),
    password: getVal('admPass'),
    role: getVal('admRole')
  };
  const res = await api('/admin/admins', { method: 'POST', body: JSON.stringify(payload) });
  if (res?.success) { showToast('Admin created', 'success'); closeFormModal(); loadAllAdmins(); }
}

async function resetAdminPassword(id) {
  const pass = prompt('New password for admin:');
  if (!pass || pass.length < 8) return showToast('Min 8 chars', 'error');
  const res = await api('/admin/reset-password', { method: 'POST', body: JSON.stringify({ userId: id, newPassword: pass }) });
  if (res?.success) showToast('Password reset successfully', 'success');
}
async function renderReports() {
  const data = await api('/admin/analytics');
  if (!data?.success) return;
  const s = data.data;

  renderBarChart('stateChart', s.stateWise.map(x => ({ label: x._id || 'Unknown', val: x.count, max: s.stateWise[0]?.count || 1 })));
  renderBarChart('cityChart', s.cityWise.map(x => ({ label: x._id || 'Unknown', val: x.count, max: s.cityWise[0]?.count || 1 })));
  renderBarChart('deviceChart', s.brandDistributed.map(x => ({ label: x._id || 'Unknown', val: x.count, max: s.brandDistributed[0]?.count || 1 })));
  
  const convData = [
    { label: 'Lead Conv %', val: s.conversions.leadConversionRate, max: 100 },
    { label: 'Quote Approval %', val: s.conversions.quoteConversionRate, max: 100 }
  ];
  renderBarChart('conversionChart', convData);
}

function renderBarChart(id, data) {
  const el = document.getElementById(id);
  if (!el || !data.length) return;
  el.innerHTML = data.map(item => `
    <div class="bar-row">
      <span class="bar-label">${item.label}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${((item.val/item.max)*100).toFixed(1)}%"></div></div>
      <span class="bar-val">${item.val}</span>
    </div>
  `).join('');
}

// ── System Data Management ────────────────────────────────────
async function loadSystemData() {
  const header = document.getElementById('dataTableHeader');
  const tbody  = document.getElementById('dataTableBody');
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px">Loading...</td></tr>';

  const data = await api(`/admin/${currentDataTab}`);
  const items = data?.data || [];

  if (currentDataTab === 'repair-types') {
    header.innerHTML = '<tr><th>Name</th><th>Base Price</th><th>Payout</th><th>Status</th><th>Actions</th></tr>';
    tbody.innerHTML = items.map(i => `
      <tr><td>${i.name}</td><td>${formatCurrency(i.basePrice)}</td><td>${formatCurrency(i.basePayout)}</td>
      <td><span class="badge ${i.isActive ? 'badge-completed' : 'badge-rejected'}">${i.isActive ? 'Active' : 'Inactive'}</span></td>
      <td><button class="action-btn" onclick="editSystemItem('${i._id}')">Edit</button></td></tr>
    `).join('');
  } else if (currentDataTab === 'brands') {
    header.innerHTML = '<tr><th>Brand</th><th>Category</th><th>Status</th><th>Actions</th></tr>';
    tbody.innerHTML = items.map(i => `
      <tr><td>${i.name}</td><td>${i.category}</td>
      <td><span class="badge ${i.isActive ? 'badge-completed' : 'badge-rejected'}">${i.isActive ? 'Active' : 'Inactive'}</span></td>
      <td><button class="action-btn" onclick="editSystemItem('${i._id}')">Edit</button></td></tr>
    `).join('');
  } else if (currentDataTab === 'models') {
    header.innerHTML = '<tr><th>Model</th><th>Brand</th><th>Category</th><th>Actions</th></tr>';
    tbody.innerHTML = items.map(i => `
      <tr><td>${i.name}</td><td>${i.brand?.name || '—'}</td><td>${i.category}</td>
      <td><button class="action-btn" onclick="editSystemItem('${i._id}')">Edit</button></td></tr>
    `).join('');
  } else if (currentDataTab === 'offers') {
    header.innerHTML = '<tr><th>Code</th><th>Discount</th><th>Uses</th><th>Status</th><th>Actions</th></tr>';
    tbody.innerHTML = items.map(i => `
      <tr><td style="color:var(--clr-primary); font-weight:700">${i.code}</td><td>${i.discountValue}${i.discountType === 'percentage' ? '%' : '₹'}</td>
      <td>${i.usedCount} / ${i.maxUses || '∞'}</td><td><span class="badge ${i.isActive ? 'badge-completed' : 'badge-rejected'}">${i.isActive ? 'Active' : 'Inactive'}</span></td>
      <td><button class="action-btn" onclick="editSystemItem('${i._id}')">Edit</button></td></tr>
    `).join('');
  }
}

function switchDataTab(tab, btn) {
  currentDataTab = tab;
  document.querySelectorAll('.tab-btns .btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadSystemData();
}

// ── Repair Detail Modal ───────────────────────────────────────
async function openRepairModal(id) {
  currentRepairId = id;
  const modal = document.getElementById('repairModal');
  const body = document.getElementById('modalBody');
  body.innerHTML = '<div style="padding:20px;text-align:center">Fetching details...</div>';
  modal.style.display = 'flex';

  const data = await api(`/bookings/${id}`);
  const r = data?.data;
  if (!r) { body.innerHTML = '<div style="color:red;padding:20px">Failed to load booking.</div>'; return; }

  body.innerHTML = `
    <div class="modal-detail-grid">
      <div><label class="form-label">Customer</label><div>${r.customerName} (${r.customerPhone})</div></div>
      <div><label class="form-label">Device</label><div>${r.deviceBrand} ${r.deviceModel}</div></div>
      <div><label class="form-label">Repair Types</label><div>${(r.repairTypes || []).join(', ')}</div></div>
      <div><label class="form-label">Status</label><div>${getBadge(r.status)}</div></div>
      <div><label class="form-label">Amount</label><div style="font-weight:700; color:var(--clr-primary)">${r.quotationAmount ? formatCurrency(r.quotationAmount) : 'Pending Quote'}</div></div>
    </div>

    <!-- Step 13: Location Detail Section -->
    <div style="margin-top:16px; padding:14px; background:rgba(99,102,241,0.07); border:1px solid rgba(99,102,241,0.2); border-radius:12px;">
      <div class="form-label" style="margin-bottom:8px;">📍 Order Location</div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:8px;font-size:0.85rem;">
        <div><span style="color:var(--clr-text-faint)">Address:</span> ${r.address || '—'}</div>
        <div><span style="color:var(--clr-text-faint)">City:</span> ${r.city || '—'}</div>
        <div><span style="color:var(--clr-text-faint)">State:</span> ${r.state || '—'}</div>
        <div><span style="color:var(--clr-text-faint)">Pincode:</span> ${r.pincode || '—'}</div>
        ${r.latitude ? `<div><span style="color:var(--clr-text-faint)">GPS:</span> ${r.latitude?.toFixed(4)}, ${r.longitude?.toFixed(4)}</div>` : ''}
        ${r.locationSource ? `<div><span style="color:var(--clr-text-faint)">Detected via:</span> <span style="text-transform:capitalize">${r.locationSource}</span>${r.ipCity ? ' (' + r.ipCity + ')' : ''}</div>` : ''}
      </div>
      ${r.latitude ? `<a href="https://www.google.com/maps?q=${r.latitude},${r.longitude}" target="_blank" style="display:inline-block;margin-top:10px;font-size:0.8rem;color:var(--clr-primary)">🗺️ Open in Google Maps</a>` : ''}
    </div>

    <!-- Partner Assignment -->
    <div style="margin-top:16px; padding:15px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.05)">
      <div class="form-label">Assign Partner & Payout</div>
      <div style="display:flex; gap:10px; margin-top:8px">
        <select id="assignTechSelect" class="form-select" style="flex:2"></select>
        <input type="number" id="partnerPayoutAmt" class="form-input" placeholder="Payout ₹" style="flex:1" value="${r.partnerPayout || ''}">
        <button class="btn btn-outline" onclick="assignPartner()">Assign</button>
      </div>
    </div>

    <!-- Quotation Management -->
    <div style="margin-top:16px; padding:15px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.05)">
      <div class="form-label">Send Estimate to Customer</div>
      <div style="display:grid; grid-template-columns: 1fr 2fr; gap:10px; margin-top:8px">
        <input type="number" id="quoteAmt" class="form-input" placeholder="Amount ₹" value="${r.quotationAmount || ''}">
        <input type="text" id="quoteNote" class="form-input" placeholder="Technician Notes" value="${r.technicianNote || ''}">
      </div>
      <button class="btn btn-primary" style="width:100%; margin-top:10px" onclick="setRepairQuote()">Send Quote</button>
    </div>

    <!-- Timeline -->
    <div style="margin-top:16px;">
      <div class="form-label">Order Timeline</div>
      <div class="timeline" style="margin-top:10px; display:flex; flex-direction:column; gap:10px;">
        ${(r.timeline || []).reverse().map(t => `
          <div style="font-size:0.8rem; border-left:2px solid var(--clr-primary); padding-left:10px;">
            <div style="font-weight:700">${t.stage}</div>
            <div class="td-muted">${formatDate(t.date)} · ${t.note}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `;

  // Load partners for dropdown
  const partnersData = await api('/admin/partners');
  const partners = partnersData?.data || [];
  const select = document.getElementById('assignTechSelect');
  select.innerHTML = '<option value="">-- Select Partner --</option>' + partners.map(p => `
    <option value="${p._id}" ${r.assignedTechnician?._id === p._id ? 'selected' : ''}>${p.businessName || p.name} (${p.city})</option>
  `).join('');

  // Status Actions
  document.getElementById('modalStatusActions').innerHTML = `
    <select id="statusUpdateSelect" class="form-select">
      ${['Pending', 'Received', 'Diagnosed', 'Repair Ongoing', 'Completed', 'Delivered', 'Cancelled'].map(s => `
        <option value="${s}" ${r.status === s ? 'selected' : ''}>${s}</option>
      `).join('')}
    </select>
    <button class="btn btn-primary" onclick="updateRepairStatus()">Update Status</button>
  `;
}

// ── Actions ───────────────────────────────────────────────────
async function updateRepairStatus() {
  const status = document.getElementById('statusUpdateSelect').value;
  const data = await api(`/bookings/${currentRepairId}/status`, { method: 'PUT', body: JSON.stringify({ status }) });
  if (data?.success) { showToast('Status updated', 'success'); closeModal(); loadOrders(); buildDashboard(); }
}

async function assignPartner() {
  const technicianId = document.getElementById('assignTechSelect').value;
  const payoutAmount = document.getElementById('partnerPayoutAmt').value;
  if (!technicianId) return showToast('Select a partner', 'error');
  const data = await api('/admin/assign-order', { method: 'POST', body: JSON.stringify({ bookingId: currentRepairId, technicianId, payoutAmount }) });
  if (data?.success) { showToast('Partner assigned', 'success'); closeModal(); loadOrders(); }
}

async function setRepairQuote() {
  const quotationAmount = document.getElementById('quoteAmt').value;
  const description = document.getElementById('quoteNote').value;
  if (!quotationAmount) return showToast('Enter amount', 'error');
  const data = await api('/admin/set-quote', { method: 'POST', body: JSON.stringify({ bookingId: currentRepairId, quotationAmount, description }) });
  if (data?.success) { showToast('Quote sent to customer', 'success'); closeModal(); loadOrders(); }
}

// ── Utilities ─────────────────────────────────────────────────
function formatCurrency(n) { return '₹' + Number(n).toLocaleString('en-IN'); }
function formatDate(d) { return d ? new Date(d).toLocaleDateString('en-IN', { day:'numeric', month:'short', year:'numeric' }) : '—'; }
function setEl(id, val) { const el = document.getElementById(id); if (el) el.textContent = val; }
function getVal(id) { return document.getElementById(id)?.value; }
function setVal(id, val) { const el = document.getElementById(id); if (el) el.value = val; }
function getCheck(id) { return document.getElementById(id)?.checked; }
function setCheck(id, val) { const el = document.getElementById(id); if (el) el.checked = val; }
function getBadge(s) {
  const map = { 'Pending': 'badge-pending', 'Completed': 'badge-completed', 'Cancelled': 'badge-rejected', 'Received': 'badge-inprogress' };
  return `<span class="badge ${map[s] || 'badge-pending'}">${s}</span>`;
}
function getQuoteBadge(s) {
  const map = { 'Approved': 'badge-completed', 'Rejected': 'badge-rejected', 'Pending': 'badge-pending' };
  return `<span class="badge ${map[s] || 'badge-pending'}">${s || 'Pending'}</span>`;
}
function showToast(msg, type = 'info') {
  const container = document.getElementById('toastContainer');
  const el = document.createElement('div');
  el.className = `toast ${type}`;
  el.innerHTML = `<span>${type === 'success' ? '✅' : 'ℹ️'}</span> ${msg}`;
  container.appendChild(el);
  setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 300); }, 4000);
}

function closeModal() { document.getElementById('repairModal').style.display = 'none'; }
function closeFormModal() { document.getElementById('formModal').style.display = 'none'; }

// ── Location Intelligence (Steps 6-14) ───────────────────────

let _locDebounce = null;
async function loadLocationAnalytics() {
  clearTimeout(_locDebounce);
  _locDebounce = setTimeout(async () => {
    const state   = document.getElementById('locFilterState')?.value || '';
    const city    = document.getElementById('locFilterCity')?.value  || '';
    const pincode = document.getElementById('locFilterPin')?.value   || '';

    const qs = new URLSearchParams({ state, city, pincode }).toString();
    const res = await api(`/admin/location-analytics?${qs}`);
    if (!res?.success) return showToast('Failed to load location data', 'error');

    const d = res.data;
    const s = d.summary;

    // KPI cards
    setEl('locStatOrders', s.total);
    setEl('locStatCities', s.uniqueCities);
    setEl('locStatStates', s.uniqueStates);
    setEl('locStatPins',   s.uniquePincodes);
    setEl('locTotal',      `${s.total} orders across ${s.uniqueCities} cities`);

    // Step 8: City demand chart
    const cityMax = d.cityWise[0]?.count || 1;
    renderLocationBarChart('locCityChart', d.cityWise.slice(0, 12).map(x => ({
      label: x._id || 'Unknown',
      val: x.count,
      sub: `₹${Number(x.revenue || 0).toLocaleString('en-IN')}`,
      max: cityMax
    })), '#6366f1');

    // Step 9: State volume chart
    const stateMax = d.stateWise[0]?.count || 1;
    renderLocationBarChart('locStateChart', d.stateWise.slice(0, 10).map(x => ({
      label: x._id || 'Unknown',
      val: x.count,
      sub: `${(x.cities || []).length} cities`,
      max: stateMax
    })), '#10b981');

    // Step 11: Map dot view
    renderLocationDotMap('locMapCanvas', d.mapPoints);
    const locMapLegend = document.getElementById('locMapLegend');
    if (locMapLegend) locMapLegend.textContent = `${d.mapPoints.length} GPS-tagged orders shown`;

    // Pincode table (Step 9)
    const pinTbody = document.getElementById('locPincodeTable');
    if (pinTbody) {
      pinTbody.innerHTML = d.pincodeWise.map(p => `
        <tr>
          <td style="font-weight:700">${p._id || '—'}</td>
          <td>${p.city || '—'}</td>
          <td>${p.state || '—'}</td>
          <td>${p.count}</td>
        </tr>
      `).join('') || '<tr><td colspan="4" style="text-align:center;padding:10px;color:var(--clr-text-faint)">No data</td></tr>';
    }

    // Location source chart
    const srcMax = Math.max(...(d.locationSourceStats.map(x => x.count)), 1);
    const srcColors = { gps: '#10b981', ip: '#6366f1', manual: '#f59e0b', null: '#6b7280' };
    const srcLabels = { gps: '📍 GPS', ip: '🌐 IP-based', manual: '✏️ Manual', null: '❓ Unknown' };
    renderLocationBarChart('locSourceChart', d.locationSourceStats.map(x => ({
      label: srcLabels[x._id] || x._id || 'Unknown',
      val: x.count,
      max: srcMax
    })), '#f59e0b');

  }, 400);
}

/**
 * Renders a horizontal bar chart with labels, bars, and values.
 */
function renderLocationBarChart(id, items, color = '#6366f1') {
  const el = document.getElementById(id);
  if (!el || !items.length) {
    if (el) el.innerHTML = '<div style="text-align:center;padding:20px;color:var(--clr-text-faint);font-size:0.85rem;">No data available</div>';
    return;
  }
  el.innerHTML = items.map(item => `
    <div style="display:flex;align-items:center;gap:10px;margin-bottom:8px;">
      <span style="min-width:100px;max-width:110px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:0.8rem;color:var(--clr-text-muted)">${item.label}</span>
      <div style="flex:1;height:10px;background:rgba(255,255,255,0.06);border-radius:20px;overflow:hidden;">
        <div style="height:100%;width:${Math.max(2, (item.val / item.max) * 100).toFixed(1)}%;background:${color};border-radius:20px;transition:width 0.6s ease;"></div>
      </div>
      <span style="min-width:28px;text-align:right;font-size:0.8rem;font-weight:700">${item.val}</span>
      ${item.sub ? `<span style="min-width:70px;font-size:0.72rem;color:var(--clr-text-faint)">${item.sub}</span>` : ''}
    </div>
  `).join('');
}

/**
 * Step 11: Renders a dot-map visualization using SVG.
 * Maps India-approximate lat/lng to a bounded canvas.
 */
function renderLocationDotMap(id, points) {
  const el = document.getElementById(id);
  if (!el) return;

  if (!points || !points.length) {
    el.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:240px;color:var(--clr-text-faint);font-size:0.85rem;">No GPS-tagged orders yet</div>';
    return;
  }

  // India bounds approx: lat 8-37, lng 68-97
  const LAT_MIN = 8, LAT_MAX = 37, LNG_MIN = 68, LNG_MAX = 97;
  const W = el.offsetWidth || 400, H = 240;

  const toX = (lng) => ((lng - LNG_MIN) / (LNG_MAX - LNG_MIN)) * (W - 20) + 10;
  const toY = (lat) => H - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * (H - 20) - 10;

  const statusColor = (s) => {
    if (['Completed', 'Delivered', 'Closed'].includes(s)) return '#10b981';
    if (['Cancelled'].includes(s)) return '#ef4444';
    if (['Repair Ongoing', 'Diagnosis In Progress'].includes(s)) return '#f59e0b';
    return '#6366f1';
  };

  const dots = points.map(p => {
    const x = toX(p.longitude);
    const y = toY(p.latitude);
    const color = statusColor(p.status);
    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="5" fill="${color}" fill-opacity="0.75" stroke="rgba(255,255,255,0.3)" stroke-width="1">
      <title>${p.referenceNumber} · ${p.city || ''}, ${p.state || ''} · ${p.status || ''}</title>
    </circle>`;
  }).join('');

  el.innerHTML = `
    <svg width="${W}" height="${H}" style="display:block;">
      <rect width="${W}" height="${H}" fill="rgba(99,102,241,0.04)" rx="10"/>
      ${dots}
    </svg>
    <div style="display:flex;gap:12px;padding:6px 4px;font-size:0.7rem;color:var(--clr-text-faint);">
      <span><span style="color:#10b981">●</span> Completed</span>
      <span><span style="color:#6366f1">●</span> Active</span>
      <span><span style="color:#f59e0b">●</span> In Repair</span>
      <span><span style="color:#ef4444">●</span> Cancelled</span>
    </div>
  `;
}

/**
 * Step 10: Find nearby partners for a booking by ID or ref.
 */
async function findNearbyPartners() {
  const input = document.getElementById('partnerFinderBookingId')?.value.trim();
  const resultEl = document.getElementById('nearbyPartnersResult');
  if (!input || !resultEl) return;

  resultEl.innerHTML = '<div style="color:var(--clr-text-faint);font-size:0.85rem;padding:8px 0">Searching…</div>';

  // Try to find the booking ID — could be either MongoDB _id or referenceNumber
  // Step: first resolve ref → id if needed
  let bookingId = input;
  if (input.startsWith('RV-')) {
    const bRes = await api(`/bookings?search=${input}&limit=1`);
    const found = bRes?.data?.[0];
    if (!found) { resultEl.innerHTML = '<div style="color:#ef4444;font-size:0.85rem">Booking not found</div>'; return; }
    bookingId = found._id;
  }

  const res = await api(`/admin/nearby-partners?bookingId=${bookingId}`);
  if (!res?.success) { resultEl.innerHTML = `<div style="color:#ef4444;font-size:0.85rem">${res?.message || 'Error'}</div>`; return; }

  const { partners, bookingLocation } = res.data;
  if (!partners.length) {
    resultEl.innerHTML = '<div style="color:var(--clr-text-faint);font-size:0.85rem;padding:8px 0">No partners found in this area</div>';
    return;
  }

  resultEl.innerHTML = `
    <div style="font-size:0.78rem;color:var(--clr-text-faint);margin-bottom:8px;">
      📍 Customer: ${bookingLocation.city}, ${bookingLocation.state} (${bookingLocation.pincode})
    </div>
    ${partners.slice(0, 6).map(p => `
      <div style="display:flex;align-items:center;justify-content:space-between;padding:8px;border-radius:8px;background:rgba(255,255,255,0.04);margin-bottom:6px;border:1px solid rgba(255,255,255,0.06);">
        <div>
          <div style="font-weight:600;font-size:0.85rem">${p.name}</div>
          <div style="font-size:0.75rem;color:var(--clr-text-faint)">${p.city || '—'}, ${p.state || '—'} · ${p.specialization || ''}</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:0.75rem;color:#10b981;font-weight:700">Score: ${p.matchScore?.toFixed(1)}</div>
          <div style="font-size:0.72rem;color:var(--clr-text-faint)">⭐ ${p.averageRating?.toFixed(1) || '—'} · ${p.completedRepairs || 0} jobs</div>
        </div>
      </div>
    `).join('')}
  `;
}

// ── Initialize ────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  showPage('dashboard', document.querySelector('[data-page="dashboard"]'));
  
  // Sidebar Toggle
  document.getElementById('sidebarToggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
  document.getElementById('sidebarClose')?.addEventListener('click', () => document.getElementById('sidebar').classList.remove('open'));
});
