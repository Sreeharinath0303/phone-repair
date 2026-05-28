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
    'audit-logs': 'Audit Logs / Activity Trail',
    'system-data': 'System Data',
    admins: 'Admin Users',
    'all-users': 'User Directory',
    enquiries: 'Enquiry & Support Management',
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
  if (pageId === 'audit-logs')      loadAuditLogs();
  if (pageId === 'system-data')     loadSystemData();
  if (pageId === 'admins')          loadAllAdmins();
  if (pageId === 'all-users')       loadAllUsers();
  if (pageId === 'enquiries')       loadEnquiries();
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
  
  const search = document.getElementById('leadsSearch')?.value || '';
  const qs = new URLSearchParams({ search }).toString();
  
  const data = await api(`/admin/incomplete-leads?${qs}`);
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
      <td><button class="action-btn" onclick="openRepairModal('${b._id}')">View</button></td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;padding:20px">No new bookings</td></tr>';
}

// ── Order Management ──────────────────────────────────────────
let currentSortBy = 'createdAt';
let currentSortOrder = 'desc';

window.toggleSort = function(field) {
  if (currentSortBy === field) {
    currentSortOrder = currentSortOrder === 'asc' ? 'desc' : 'asc';
  } else {
    currentSortBy = field;
    currentSortOrder = 'asc'; // default when switching to a new column
  }
  
  // Update header arrows
  const headers = ['referenceNumber', 'customerName', 'deviceBrand', 'city', 'status', 'assignedTechnician', 'createdAt'];
  headers.forEach(h => {
    const el = document.getElementById('sort_' + h);
    if (el) el.textContent = h === currentSortBy ? (currentSortOrder === 'asc' ? '▲' : '▼') : '';
  });
  
// Step 19: Performance Workflow (Debounce to prevent API spam on rapid typing)
function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

window.debouncedLoadOrders = debounce(() => loadOrders(), 350);
window.debouncedLoadLeads = debounce(() => loadLeads(), 350);
window.debouncedLoadLocationAnalytics = debounce(() => loadLocationAnalytics(), 350);
window.debouncedLoadCustomers = debounce(() => loadCustomers(), 350);
window.debouncedLoadTechnicians = debounce(() => loadTechnicians(), 350);
window.debouncedLoadSystemData = debounce(() => loadSystemData(), 350);
window.debouncedLoadEnquiries = debounce(() => loadEnquiries(), 350);
window.debouncedLoadLogs = debounce(() => loadLogs(), 350);
window.debouncedLoadAuditLogs = debounce(() => loadAuditLogs(), 350);

window.resetFilters = function() {
  const filterIds = [
    'ordersSearch', 'orderStatusFilter', 'orderCityFilter', 'orderStateFilter', 
    'orderPincodeFilter', 'orderBrandFilter', 'orderModelFilter', 'orderRepairTypeFilter', 
    'orderQuoteStatusFilter', 'orderAssignedStatusFilter', 'orderStartDateFilter', 
    'orderEndDateFilter', 'orderServiceModeFilter', 'orderFeedbackFilter'
  ];
  filterIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.value = '';
  });
  
  currentSortBy = 'createdAt';
  currentSortOrder = 'desc';
  const headers = ['referenceNumber', 'customerName', 'deviceBrand', 'city', 'status', 'assignedTechnician', 'createdAt'];
  headers.forEach(h => {
    const el = document.getElementById('sort_' + h);
    if (el) el.textContent = h === 'createdAt' ? '▼' : '';
  });
  
  loadOrders();
};

window.applyPresetFilter = function(preset) {
  resetFilters(); // Start fresh
  
  if (preset === 'pending_quotes') {
    document.getElementById('orderQuoteStatusFilter').value = 'Pending';
  } else if (preset === 'assigned_partner') {
    document.getElementById('orderAssignedStatusFilter').value = 'Assigned';
  } else if (preset === 'incomplete_leads') {
    // Navigate to Leads tab and filter
    document.querySelector('.sidebar-nav a:nth-child(2)').click();
    setTimeout(() => {
       document.getElementById('leadsSearch').value = 'New';
       loadLeads();
    }, 100);
    return;
  } else if (preset === 'completed_iphone') {
    document.getElementById('orderStatusFilter').value = 'Completed';
    document.getElementById('orderBrandFilter').value = 'Apple';
  }
  
  loadOrders();
};

async function loadOrders() {
  const tbody = document.getElementById('ordersTableBody');
  tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:20px">Loading...</td></tr>';
  const status  = document.getElementById('orderStatusFilter')?.value || '';
  const search  = document.getElementById('ordersSearch')?.value || '';
  const city    = document.getElementById('orderCityFilter')?.value || '';
  const state   = document.getElementById('orderStateFilter')?.value || '';
  const pincode = document.getElementById('orderPincodeFilter')?.value || '';
  
  const brand          = document.getElementById('orderBrandFilter')?.value || '';
  const model          = document.getElementById('orderModelFilter')?.value || '';
  const repairType     = document.getElementById('orderRepairTypeFilter')?.value || '';
  const quoteStatus    = document.getElementById('orderQuoteStatusFilter')?.value || '';
  const assignedStatus = document.getElementById('orderAssignedStatusFilter')?.value || '';
  
  const startDate      = document.getElementById('orderStartDateFilter')?.value || '';
  const endDate        = document.getElementById('orderEndDateFilter')?.value || '';
  const serviceMode    = document.getElementById('orderServiceModeFilter')?.value || '';
  const feedbackRating = document.getElementById('orderFeedbackFilter')?.value || '';

  const qs = new URLSearchParams({ 
    status, search, city, state, pincode, 
    brand, model, repairType, quoteStatus, assignedStatus,
    startDate, endDate, serviceMode, feedbackRating,
    sortBy: currentSortBy, sortOrder: currentSortOrder
  }).toString();
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
      <td>${new Date(o.createdAt).toLocaleDateString()}</td>
      <td><button class="action-btn" onclick="openRepairModal('${o._id}')">View</button></td>
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
  
  const search = document.getElementById('customersSearch')?.value || '';
  const qs = new URLSearchParams({ search }).toString();
  
  const data = await api(`/admin/customers?${qs}`);
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
                  <button class="action-btn" onclick="editCustomer('${c._id}')">Profile</button>
                  <button class="action-btn" onclick="openAccountSecurityModal('${c._id}', 'customer', '${c.name}', ${c.isLocked || false}, ${c.isActive || true})">🔐 Security</button>
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
  
  const search = document.getElementById('techniciansSearch')?.value || '';
  const qs = new URLSearchParams({ search }).toString();
  
  const data = await api(`/admin/partners?${qs}`);
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
                  <button class="action-btn" onclick="openAccountSecurityModal('${p._id}', 'partner', '${p.name}', ${p.isLocked || false}, ${p.isActive || true})">🔐 Security</button>
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
      <td>
        <div class="td-actions">
          <button class="action-btn" onclick="openAccountSecurityModal('${a._id}', 'admin', '${a.name}', ${a.isLocked || false}, ${a.isActive || true})">🔐 Security</button>
        </div>
      </td>
    </tr>
  `).join('');
}

// ── Unified Directory (Step 15 & 16) ──────────────────────────
let _allUsersDebounce = null;
function debouncedLoadAllUsers() {
  clearTimeout(_allUsersDebounce);
  _allUsersDebounce = setTimeout(loadAllUsers, 400);
}

async function loadAllUsers() {
  const tbody = document.getElementById('allUsersTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:20px">Searching Directory...</td></tr>';

  const search = document.getElementById('userDirSearch')?.value || '';
  const role   = document.getElementById('userDirRoleFilter')?.value || '';
  const status = document.getElementById('userDirStatusFilter')?.value || '';
  
  const qs = new URLSearchParams({ search, role, status }).toString();
  const data = await api(`/admin/accounts?${qs}`);
  const users = data?.data || [];

  tbody.innerHTML = users.map(u => {
    let statusHtml = '';
    if (u.isLocked) statusHtml = '<span class="badge badge-rejected">Locked</span>';
    else if (!u.isActive) statusHtml = '<span class="badge" style="background:rgba(255,255,255,0.05)">Inactive</span>';
    else statusHtml = '<span class="badge badge-completed">Active</span>';

    return `
      <tr>
        <td>
          <div style="font-weight:700">${u.name}</div>
          <div class="td-muted" style="font-size:0.72rem">${u._id}</div>
        </td>
        <td>${u.email}<br><span class="td-muted">${u.phone || ''}</span></td>
        <td><span class="badge" style="text-transform:capitalize; background:rgba(255,255,255,0.05)">${u.role || u.type}</span></td>
        <td>${statusHtml}</td>
        <td>${u.lastLogin ? formatDate(u.lastLogin) : 'Never'}</td>
        <td>
          <div class="td-actions">
            <button class="action-btn" onclick="openAccountSecurityModal('${u._id}', '${u.type}', '${u.name}', ${u.isLocked || false}, ${u.isActive || true})">🔐 Security</button>
          </div>
        </td>
      </tr>
    `;
  }).join('') || '<tr><td colspan="6" style="text-align:center;padding:20px">No users match filters</td></tr>';
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
  const countEl = document.getElementById('sysRecordCount');
  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px"><div class="loading-spinner"></div> Loading system data...</td></tr>';

  const search = document.getElementById('sysSearch')?.value || '';
  const status = document.getElementById('sysStatusFilter')?.value || '';
  const brand = document.getElementById('sysBrandFilter')?.value || '';
  
  // Tab-specific filter visibility
  document.getElementById('sysBrandFilterWrap').style.display = (currentDataTab === 'models' || currentDataTab === 'repair-types') ? 'block' : 'none';
  if (currentDataTab === 'models' && !document.getElementById('sysBrandFilter').options.length > 1) loadBrandFilterOptions();

  const data = await api(`/admin/${currentDataTab}?search=${search}&isActive=${status}&brand=${brand}`);
  const items = data?.data || [];
  if (countEl) countEl.textContent = `${items.length} records`;

  if (currentDataTab === 'repair-types') {
    header.innerHTML = '<tr><th>Name</th><th>Linked To</th><th>Price / Payout</th><th>Status</th><th>Actions</th></tr>';
    tbody.innerHTML = items.map(i => {
      const models = (i.applicableModels || []).map(m => m.name).join(', ');
      const linked = models ? `<div style="font-size:0.8rem;color:var(--clr-text-muted)">${models}</div>` : `<span style="text-transform:capitalize">${i.category || 'general'}</span>`;
      
      return `
      <tr>
        <td style="font-weight:600">${i.name}</td>
        <td>${linked}</td>
        <td>${formatCurrency(i.basePrice)} / ${formatCurrency(i.basePayout)}</td>
        <td><span class="badge ${i.isActive ? 'badge-completed' : 'badge-rejected'}">${i.isActive ? 'Active' : 'Inactive'}</span></td>
        <td>
          <div class="td-actions">
            <button class="action-btn" onclick="editSystemItem('${i._id}')">Edit</button>
            <button class="action-btn" onclick="toggleSystemStatus('${i._id}', ${i.isActive})">${i.isActive ? 'Deactivate' : 'Activate'}</button>
            <button class="action-btn delete-btn" style="color:#ef4444" onclick="deleteSystemItem('${i._id}')">Delete</button>
          </div>
        </td>
      </tr>`;
    }).join('') || '<tr><td colspan="5" style="text-align:center;padding:40px">No repair types found.</td></tr>';
  } else if (currentDataTab === 'brands') {
    header.innerHTML = '<tr><th>Brand Name</th><th>Category</th><th>Status</th><th>Actions</th></tr>';
    tbody.innerHTML = items.map(i => `
      <tr>
        <td style="font-weight:600">${i.name}</td>
        <td style="text-transform:capitalize">${i.category}</td>
        <td><span class="badge ${i.isActive ? 'badge-completed' : 'badge-rejected'}">${i.isActive ? 'Active' : 'Inactive'}</span></td>
        <td>
          <div class="td-actions">
            <button class="action-btn" onclick="editSystemItem('${i._id}')">Edit</button>
            <button class="action-btn" onclick="toggleSystemStatus('${i._id}', ${i.isActive})">${i.isActive ? 'Deactivate' : 'Activate'}</button>
            <button class="action-btn delete-btn" style="color:#ef4444" onclick="deleteSystemItem('${i._id}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="4" style="text-align:center;padding:40px">No brands found.</td></tr>';
  } else if (currentDataTab === 'models') {
    header.innerHTML = '<tr><th>Model Name</th><th>Brand</th><th>Category</th><th>Status</th><th>Actions</th></tr>';
    tbody.innerHTML = items.map(i => `
      <tr>
        <td style="font-weight:600">${i.name}</td>
        <td>${i.brand?.name || '—'}</td>
        <td style="text-transform:capitalize">${i.category}</td>
        <td><span class="badge ${i.isActive ? 'badge-completed' : 'badge-rejected'}">${i.isActive ? 'Active' : 'Inactive'}</span></td>
        <td>
          <div class="td-actions">
            <button class="action-btn" onclick="editSystemItem('${i._id}')">Edit</button>
            <button class="action-btn" onclick="toggleSystemStatus('${i._id}', ${i.isActive})">${i.isActive ? 'Deactivate' : 'Activate'}</button>
            <button class="action-btn delete-btn" style="color:#ef4444" onclick="deleteSystemItem('${i._id}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center;padding:40px">No models found.</td></tr>';
  } else if (currentDataTab === 'offers') {
    header.innerHTML = '<tr><th>Code</th><th>Discount</th><th>Uses</th><th>Status</th><th>Actions</th></tr>';
    tbody.innerHTML = items.map(i => `
      <tr>
        <td style="color:var(--clr-primary); font-weight:700">${i.code}</td>
        <td>${i.discountValue}${i.discountType === 'percentage' ? '%' : '₹'}</td>
        <td>${i.usedCount} / ${i.maxUses || '∞'}</td>
        <td><span class="badge ${i.isActive ? 'badge-completed' : 'badge-rejected'}">${i.isActive ? 'Active' : 'Inactive'}</span></td>
        <td>
          <div class="td-actions">
            <button class="action-btn" onclick="editSystemItem('${i._id}')">Edit</button>
            <button class="action-btn" onclick="toggleSystemStatus('${i._id}', ${i.isActive})">${i.isActive ? 'Deactivate' : 'Activate'}</button>
            <button class="action-btn delete-btn" style="color:#ef4444" onclick="deleteSystemItem('${i._id}')">Delete</button>
          </div>
        </td>
      </tr>
    `).join('') || '<tr><td colspan="5" style="text-align:center;padding:40px">No offers found.</td></tr>';
  }
}

function switchDataTab(tab, btn) {
  currentDataTab = tab;
  document.querySelectorAll('.tabs-wrap .btn').forEach(b => b.classList.remove('active'));
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

    <!-- Customer Complaint -->
    <div style="margin-top:16px; padding:15px; background:rgba(239,68,68,0.05); border:1px solid rgba(239,68,68,0.2); border-radius:12px;">
      <div class="form-label" style="color:#f87171; display:flex; align-items:center; gap:6px;">⚠️ Customer Complaint</div>
      <div style="font-size:0.9rem; color:#f3f4f6; margin-top:8px; line-height:1.4; white-space:pre-wrap;">${r.issueDescription || 'No complaint details provided by the customer.'}</div>
    </div>

    <!-- Assigned Partner Info -->
    <div style="margin-top:16px; padding:15px; background:rgba(168,85,247,0.07); border:1px solid rgba(168,85,247,0.25); border-radius:12px;">
      <div class="form-label" style="color:#c084fc; display:flex; align-items:center; gap:6px;">🤝 Assigned Partner</div>
      <div style="font-size:0.9rem; color:#f3f4f6; margin-top:8px; line-height:1.4;">
        ${r.assignedTechnician ? `
          <strong>${r.assignedTechnician.name}</strong> (${r.assignedTechnician.businessName || 'Independent Partner'})<br>
          <span style="color:var(--clr-text-faint)">Phone:</span> ${r.assignedTechnician.phone || '—'} · 
          <span style="color:var(--clr-text-faint)">Specialization:</span> ${r.assignedTechnician.specialization || 'General'} · 
          <span style="color:var(--clr-text-faint)">Payout Commission:</span> <strong>${r.partnerPayout ? formatCurrency(r.partnerPayout) : '₹0'}</strong>
        ` : `
          <span style="color:var(--clr-text-muted); font-style:italic;">No partner assigned to this order yet.</span>
        `}
      </div>
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

// ── Lead Modal ────────────────────────────────────────────────
async function openLeadModal(id) {
  const data = await api(`/admin/incomplete-leads`);
  const lead = (data?.data || []).find(l => l._id === id);
  if (!lead) return showToast('Lead not found', 'error');

  // Fetch Technicians for Dropdown
  const techRes = await api('/admin/partners');
  const techs = techRes?.data || [];

  const complaint = lead.issueDescription || lead.bookingId?.issueDescription || 'No complaint or issue description provided.';
  
  // Find current partner
  const currentPartner = lead.assignedTechnician || lead.bookingId?.assignedTechnician || null;
  const currentPartnerName = currentPartner 
    ? (typeof currentPartner === 'object' ? currentPartner.name : currentPartner) 
    : 'None';
  const partnerPayout = lead.partnerPayout || lead.bookingId?.partnerPayout || 0;

  document.getElementById('modalTitle').textContent = `Lead & Complaint: ${lead.customerName}`;
  document.getElementById('modalBody').innerHTML = `
    <div class="modal-detail-grid">
      <div><label class="form-label">Name</label><div style="font-weight:600;color:#fff">${lead.customerName}</div></div>
      <div><label class="form-label">Phone</label><div style="font-weight:600;color:#fff">${lead.mobileNumber}</div></div>
      <div><label class="form-label">Email</label><div style="color:#d1d5db">${lead.email || '—'}</div></div>
      <div><label class="form-label">Device</label><div style="color:#d1d5db">${lead.deviceBrand || ''} ${lead.deviceModel || ''}</div></div>
      <div><label class="form-label">City / State</label><div style="color:#d1d5db">${lead.city || '—'}, ${lead.state || '—'}</div></div>
      <div><label class="form-label">Stage</label><div>${getBadge(lead.stage || 'New')}</div></div>
    </div>
    
    <!-- Customer Complaint -->
    <div style="margin-top:18px; padding:15px; background:rgba(245,158,11,0.06); border:1px solid rgba(245,158,11,0.15); border-radius:12px;">
      <h4 style="margin:0 0 8px 0; color:#fbbf24; font-size:0.85rem; display:flex; align-items:center; gap:6px;">
        ⚠️ Customer Complaint
      </h4>
      <div style="font-size:0.82rem; color:#e5e7eb; line-height:1.4; white-space:pre-wrap;">${complaint}</div>
    </div>

    <!-- Assigned Partner Section -->
    <div style="margin-top:18px; padding:15px; background:rgba(192,132,252,0.06); border:1px solid rgba(192,132,252,0.15); border-radius:12px;">
      <h4 style="margin:0 0 8px 0; color:#c084fc; font-size:0.85rem; display:flex; align-items:center; gap:6px;">
        🤝 Assigned Partner Details
      </h4>
      <div style="font-size:0.82rem; color:#e5e7eb; margin-bottom:12px;">
        <strong>Currently Assigned:</strong> <span style="color:#c084fc;font-weight:700">${currentPartnerName}</span><br>
        ${currentPartner ? `<strong>Payout Pledged:</strong> ₹${partnerPayout.toLocaleString()}` : ''}
      </div>

      <div style="display:flex; flex-direction:column; gap:8px;">
        <div>
          <label class="form-label" style="font-size:0.75rem; margin-bottom:4px;">Assign or Change Partner</label>
          <select id="leadTechSelect" style="width:100%; background:#111; border:1px solid rgba(255,255,255,0.1); color:#fff; padding:8px; border-radius:8px; font-size:0.8rem;">
            <option value="">-- Select Available Partner --</option>
            ${techs.map(t => `<option value="${t._id}" ${currentPartner && (currentPartner._id === t._id || currentPartner === t._id) ? 'selected' : ''}>${t.name} - ${t.specialization || 'General'} (${t.city || 'Any'})</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="form-label" style="font-size:0.75rem; margin-bottom:4px;">Technician Payout Commission (₹)</label>
          <input type="number" id="leadPayoutInput" value="${partnerPayout || ''}" placeholder="Payout Amount" style="width:100%; background:#111; border:1px solid rgba(255,255,255,0.1); color:#fff; padding:8px; border-radius:8px; font-size:0.8rem;" />
        </div>
        <button class="btn" style="background:#8b5cf6; color:#fff; font-weight:bold; font-size:0.8rem; margin-top:6px; padding:10px; width:100%; border-radius:8px;" onclick="assignLeadPartner('${lead._id}')">
          Save Partner Assignment
        </button>
      </div>
    </div>

    ${lead.stage !== 'Converted to order' && lead.stage !== 'Lost / inactive' ? `
      <div style="margin-top:18px;">
        <button class="btn btn-primary" style="width:100%; font-weight:bold;" onclick="convertLead('${lead._id}')">Convert to Booking ↗</button>
      </div>
    ` : ''}
  `;
  document.getElementById('modalStatusActions').innerHTML = '';
  document.getElementById('repairModal').style.display = 'flex';
}

async function assignLeadPartner(leadId) {
  const technicianId = document.getElementById('leadTechSelect').value;
  const payoutAmount = document.getElementById('leadPayoutInput').value;

  if (!technicianId) return showToast('Please select a service partner', 'warning');

  const res = await api('/admin/assign-lead', {
    method: 'POST',
    body: JSON.stringify({
      leadId,
      technicianId,
      payoutAmount: Number(payoutAmount) || 0
    })
  });

  if (res?.success) {
    showToast('Service Partner assigned to Lead successfully!', 'success');
    closeModal();
    loadLeads();
  } else {
    showToast(res?.message || 'Assignment failed', 'error');
  }
}

async function convertLead(leadId) {
  const res = await api('/admin/convert-lead', { method: 'POST', body: JSON.stringify({ leadId }) });
  if (res?.success) {
    showToast('Lead converted to booking!', 'success');
    closeModal();
    loadLeads();
  } else {
    showToast(res?.message || 'Conversion failed', 'error');
  }
}

// ── Feedback ──────────────────────────────────────────────────
async function loadFeedback() {
  const tbody = document.getElementById('fbTableBody');
  const searchInput = document.getElementById('fbSearch');
  const typeSelect = document.getElementById('fbType');
  const minRatingSelect = document.getElementById('fbMinRating');

  if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:20px">Loading feedbacks...</td></tr>';
  
  const type = typeSelect?.value || '';
  const rating = minRatingSelect?.value || '';
  const search = searchInput?.value || '';
  
  const qs = new URLSearchParams({ type, rating, search }).toString();
  const listRes = await api(`/feedback?${qs}`);
  const feedbacks = listRes?.data || [];

  const statsRes = await api('/feedback/stats');
  const stats = statsRes?.success ? statsRes.data : {
    overallAvg: '0.0',
    totalCustomer: 0,
    totalPartner: 0
  };

  setEl('fbStatAvg', stats.overallAvg || stats.customerAvg || '0.0');
  setEl('fbStatCust', stats.totalCustomer || 0);
  setEl('fbStatPart', stats.totalPartner || 0);
  
  const custFeedbacks = feedbacks.filter(f => f.type === 'customer');
  const positive = custFeedbacks.filter(f => (f.rating || 0) >= 4).length;
  const satisRate = custFeedbacks.length ? Math.round((positive / custFeedbacks.length) * 100) + '%' : '100%';
  setEl('fbStatSatis', satisRate);

  if (tbody) {
    tbody.innerHTML = feedbacks.map(f => {
      const isCust = f.type === 'customer';
      const ratingVal = isCust ? (f.rating || 5) : (f.orderQuality || 5);
      const stars = '★'.repeat(ratingVal) + '☆'.repeat(5 - ratingVal);
      const stakeholder = isCust 
        ? `<div style="font-weight:600">${f.fromName || 'Customer'}</div><div style="font-size:0.75rem;color:var(--clr-text-muted)">User</div>`
        : `<div style="font-weight:600">${f.fromName || 'Partner'}</div><div style="font-size:0.75rem;color:var(--clr-text-muted)">Technician</div>`;
      
      const remarks = isCust
        ? `<div style="font-size:0.82rem;">${f.review || 'No review comments.'}</div>
           <div style="font-size:0.75rem;color:var(--clr-text-faint);margin-top:4px;">
             Quality: ${f.serviceQuality || 5}/5 · Time: ${f.timeliness || 5}/5 · Behavior: ${f.technicianBehavior || 5}/5
           </div>`
        : `<div style="font-size:0.82rem;">${f.partsNotes || 'No notes.'}</div>
           <div style="font-size:0.75rem;color:var(--clr-text-faint);margin-top:4px;">
             Job Quality: ${f.orderQuality || 5}/5 · Cooperation: ${f.customerCooperation || 5}/5
           </div>`;

      return `
        <tr>
          <td class="td-muted">${formatDate(f.createdAt)}</td>
          <td style="font-weight:700;color:var(--clr-primary)">${f.orderId || '—'}</td>
          <td>${stakeholder}</td>
          <td><span class="badge ${isCust ? 'badge-completed' : 'badge-inprogress'}">${isCust ? 'Customer' : 'Partner'}</span></td>
          <td><span style="color:#f59e0b;font-weight:bold;font-size:1rem">${stars}</span></td>
          <td>${remarks}</td>
          <td><button class="action-btn" onclick="viewFeedbackDetail('${f._id}')">Details</button></td>
        </tr>
      `;
    }).join('') || '<tr><td colspan="7" style="text-align:center;padding:20px;color:var(--clr-text-faint)">No feedback records match current filters</td></tr>';
  }
}

async function viewFeedbackDetail(id) {
  const res = await api('/feedback');
  const f = (res?.data || []).find(x => x._id === id);
  if (!f) return;

  document.getElementById('modalTitle').textContent = `Feedback Detail: Order #${f.orderId}`;
  
  let detailsHtml = '';
  if (f.type === 'customer') {
    detailsHtml = `
      <div style="font-size:0.9rem;">
        <p><strong>Customer Name:</strong> ${f.fromName}</p>
        <p><strong>Submitted At:</strong> ${new Date(f.createdAt).toLocaleString()}</p>
        <p><strong>Overall Rating:</strong> <span style="color:#f59e0b;font-size:1.1rem">${'★'.repeat(f.rating || 5)}${'☆'.repeat(5 - (f.rating || 5))}</span></p>
        <hr style="border:0;border-top:1px solid rgba(255,255,255,0.05);margin:15px 0;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:15px;">
          <div>Service Quality: <strong>${f.serviceQuality || 5} / 5</strong></div>
          <div>Pickup Experience: <strong>${f.pickupExperience || 5} / 5</strong></div>
          <div>Technician Behavior: <strong>${f.technicianBehavior || 5} / 5</strong></div>
          <div>Timeliness/Speed: <strong>${f.timeliness || 5} / 5</strong></div>
          <div>Overall Satisfaction: <strong>${f.overallSatisfaction || 5} / 5</strong></div>
        </div>
        <div style="background:rgba(255,255,255,0.03);padding:15px;border-radius:10px;border:1px solid rgba(255,255,255,0.05);">
          <strong>Review/Comments:</strong>
          <p style="margin-top:6px;font-style:italic;color:var(--clr-text-muted);">${f.review || 'No written comment.'}</p>
        </div>
      </div>
    `;
  } else {
    detailsHtml = `
      <div style="font-size:0.9rem;">
        <p><strong>Partner Name:</strong> ${f.fromName}</p>
        <p><strong>Submitted At:</strong> ${new Date(f.createdAt).toLocaleString()}</p>
        <hr style="border:0;border-top:1px solid rgba(255,255,255,0.05);margin:15px 0;">
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:15px;">
          <div>Job Quality: <strong>${f.orderQuality || 5} / 5</strong></div>
          <div>Customer Cooperation: <strong>${f.customerCooperation || 5} / 5</strong></div>
          <div>Admin Coordination: <strong>${f.adminCoordination || 5} / 5</strong></div>
          <div>Device Condition: <strong>${f.deviceCondition || '—'}</strong></div>
        </div>
        <div style="background:rgba(255,255,255,0.03);padding:15px;border-radius:10px;border:1px solid rgba(255,255,255,0.05);">
          <strong>Spare Parts/Remarks Notes:</strong>
          <p style="margin-top:6px;font-style:italic;color:var(--clr-text-muted);">${f.partsNotes || 'No notes.'}</p>
        </div>
      </div>
    `;
  }
  
  document.getElementById('modalBody').innerHTML = detailsHtml;
  document.getElementById('modalStatusActions').innerHTML = '';
  document.getElementById('repairModal').style.display = 'flex';
}

window.loadFeedback = loadFeedback;
window.viewFeedbackDetail = viewFeedbackDetail;


// ── Email Templates ───────────────────────────────────────────
async function loadEmailTemplates() {
  const tbody = document.getElementById('templatesTableBody');
  if (!tbody) return;
  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:20px">Loading...</td></tr>';
  const data = await api('/admin/email-templates');
  const templates = data?.data || [];
  tbody.innerHTML = templates.map(t => `
    <tr>
      <td style="font-weight:600">${t.name}</td>
      <td><span style="font-size:0.75rem;text-transform:uppercase">${t.type}</span></td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.subject}</td>
      <td><span class="badge ${t.isActive ? 'badge-completed' : 'badge-rejected'}">${t.isActive ? 'Active' : 'Inactive'}</span></td>
      <td><div class="td-actions">
        <button class="action-btn" onclick="editTemplate('${t._id}','${encodeURIComponent(t.subject)}','${encodeURIComponent(t.body || '')}')">Edit</button>
        <button class="action-btn" onclick="deleteTemplate('${t._id}')">Delete</button>
      </div></td>
    </tr>`).join('') || '<tr><td colspan="5" style="text-align:center;padding:20px">No templates</td></tr>';
}

function showAddTemplateModal() {
  document.getElementById('formModalTitle').textContent = 'New Email Template';
  document.getElementById('formModalBody').innerHTML = `
    <div class="form-group"><label>Name</label><input type="text" id="tmplName" class="form-input" placeholder="e.g. Booking Confirmation"></div>
    <div class="form-group"><label>Type</label>
      <select id="tmplType" class="form-select">
        <option value="booking_confirmation">Booking Confirmation</option>
        <option value="quote_sent">Quote Sent</option>
        <option value="status_update">Status Update</option>
        <option value="follow_up">Follow Up</option>
        <option value="custom">Custom</option>
      </select></div>
    <div class="form-group"><label>Subject</label><input type="text" id="tmplSubject" class="form-input"></div>
    <div class="form-group"><label>Body</label><textarea id="tmplBody" class="form-textarea" rows="5" placeholder="Use {{customerName}}, {{referenceNumber}}, {{deviceModel}} as placeholders"></textarea></div>`;
  document.getElementById('formModalSubmit').onclick = saveTemplate;
  document.getElementById('formModal').style.display = 'flex';
}

async function saveTemplate() {
  const name = getVal('tmplName'), type = getVal('tmplType'), subject = getVal('tmplSubject'), body = getVal('tmplBody');
  if (!name || !subject || !body) return showToast('Fill all fields', 'error');
  const res = await api('/admin/email-templates', { method: 'POST', body: JSON.stringify({ name, type, subject, body }) });
  if (res?.success) { showToast('Template created', 'success'); closeFormModal(); loadEmailTemplates(); }
  else showToast(res?.message || 'Error', 'error');
}

async function editTemplate(id, encSubject, encBody) {
  document.getElementById('formModalTitle').textContent = 'Edit Template';
  document.getElementById('formModalBody').innerHTML = `
    <div class="form-group"><label>Subject</label><input type="text" id="tmplSubject" class="form-input" value="${decodeURIComponent(encSubject)}"></div>
    <div class="form-group"><label>Body</label><textarea id="tmplBody" class="form-textarea" rows="5">${decodeURIComponent(encBody)}</textarea></div>
    <div class="form-group"><label><input type="checkbox" id="tmplActive" checked> Active</label></div>`;
  document.getElementById('formModalSubmit').onclick = async () => {
    const res = await api(`/admin/email-templates/${id}`, { method: 'PUT', body: JSON.stringify({ subject: getVal('tmplSubject'), body: getVal('tmplBody'), isActive: getCheck('tmplActive') }) });
    if (res?.success) { showToast('Updated', 'success'); closeFormModal(); loadEmailTemplates(); }
  };
  document.getElementById('formModal').style.display = 'flex';
}

async function deleteTemplate(id) {
  if (!confirm('Deactivate this template?')) return;
  const res = await api(`/admin/email-templates/${id}`, { method: 'DELETE' });
  if (res?.success) { showToast('Deactivated', 'success'); loadEmailTemplates(); }
}

// ── Customer CRUD ─────────────────────────────────────────────
function showAddCustomerModal() {
  document.getElementById('formModalTitle').textContent = 'Add Customer';
  document.getElementById('formModalBody').innerHTML = `
    <div class="form-group"><label>Name</label><input type="text" id="custFormName" class="form-input"></div>
    <div class="form-group"><label>Email</label><input type="email" id="custFormEmail" class="form-input"></div>
    <div class="form-group"><label>Phone</label><input type="tel" id="custFormPhone" class="form-input"></div>
    <div class="form-group"><label>City</label><input type="text" id="custFormCity" class="form-input"></div>
    <div class="form-group"><label>State</label><input type="text" id="custFormState" class="form-input"></div>
    <div class="form-group"><label>Password</label><input type="password" id="custFormPass" class="form-input"></div>`;
  document.getElementById('formModalSubmit').onclick = async () => {
    const payload = { name: getVal('custFormName'), email: getVal('custFormEmail'), phone: getVal('custFormPhone'), city: getVal('custFormCity'), state: getVal('custFormState'), password: getVal('custFormPass') };
    if (!payload.name || !payload.email) return showToast('Name and Email required', 'error');
    const res = await api('/admin/customers', { method: 'POST', body: JSON.stringify(payload) });
    if (res?.success) { showToast('Customer created', 'success'); closeFormModal(); loadCustomers(); }
    else showToast(res?.message || 'Error', 'error');
  };
  document.getElementById('formModal').style.display = 'flex';
}

async function editCustomer(id) {
  const data = await api('/admin/customers');
  const c = (data?.data || []).find(x => x._id === id);
  if (!c) return;
  document.getElementById('formModalTitle').textContent = 'Edit Customer';
  document.getElementById('formModalBody').innerHTML = `
    <div class="form-group"><label>Name</label><input type="text" id="custEditName" class="form-input" value="${c.name || ''}"></div>
    <div class="form-group"><label>Phone</label><input type="tel" id="custEditPhone" class="form-input" value="${c.phone || ''}"></div>
    <div class="form-group"><label>City</label><input type="text" id="custEditCity" class="form-input" value="${c.city || ''}"></div>
    <div class="form-group"><label>State</label><input type="text" id="custEditState" class="form-input" value="${c.state || ''}"></div>
    <div class="form-group"><label><input type="checkbox" id="custEditActive" ${c.isActive ? 'checked' : ''}> Active</label></div>`;
  document.getElementById('formModalSubmit').onclick = async () => {
    const res = await api(`/admin/customers/${id}`, { method: 'PUT', body: JSON.stringify({ name: getVal('custEditName'), phone: getVal('custEditPhone'), city: getVal('custEditCity'), state: getVal('custEditState'), isActive: getCheck('custEditActive') }) });
    if (res?.success) { showToast('Updated', 'success'); closeFormModal(); loadCustomers(); }
  };
  document.getElementById('formModal').style.display = 'flex';
}

async function viewCustomerHistory(email) {
  const data = await api(`/admin/customers/${email}/history`);
  const history = data?.data || [];
  document.getElementById('modalTitle').textContent = `Booking History: ${email}`;
  document.getElementById('modalBody').innerHTML = history.length
    ? `<div class="data-table-wrap" style="max-height:350px;overflow-y:auto"><table class="data-table"><thead><tr><th>Ref</th><th>Device</th><th>Status</th><th>Amount</th><th>Date</th></tr></thead><tbody>
      ${history.map(b => `<tr><td>${b.referenceNumber}</td><td>${b.deviceBrand} ${b.deviceModel}</td><td>${getBadge(b.status)}</td><td>${formatCurrency(b.quotationAmount || 0)}</td><td>${formatDate(b.createdAt)}</td></tr>`).join('')}
    </tbody></table></div>`
    : '<div style="padding:20px;text-align:center;color:var(--clr-text-faint)">No bookings found for this customer</div>';
  document.getElementById('modalStatusActions').innerHTML = '';
  document.getElementById('repairModal').style.display = 'flex';
}

// ── Partner CRUD ──────────────────────────────────────────────
function showAddPartnerModal() {
  document.getElementById('formModalTitle').textContent = 'Add Partner';
  document.getElementById('formModalBody').innerHTML = `
    <div class="form-group"><label>Name</label><input type="text" id="prtName" class="form-input"></div>
    <div class="form-group"><label>Email</label><input type="email" id="prtEmail" class="form-input"></div>
    <div class="form-group"><label>Phone</label><input type="tel" id="prtPhone" class="form-input"></div>
    <div class="form-group"><label>Specialization</label><input type="text" id="prtSpec" class="form-input" placeholder="e.g. Smartphones, Laptops"></div>
    <div class="form-group"><label>Service Areas (comma separated)</label><input type="text" id="prtAreas" class="form-input" placeholder="Chennai, Bangalore"></div>
    <div class="form-group"><label>City</label><input type="text" id="prtCity" class="form-input"></div>
    <div class="form-group"><label>State</label><input type="text" id="prtState" class="form-input"></div>
    <div class="form-group"><label>Password</label><input type="password" id="prtPass" class="form-input"></div>`;
  document.getElementById('formModalSubmit').onclick = async () => {
    const payload = { name: getVal('prtName'), email: getVal('prtEmail'), phone: getVal('prtPhone'), specialization: getVal('prtSpec'), serviceAreas: getVal('prtAreas'), city: getVal('prtCity'), state: getVal('prtState'), password: getVal('prtPass') };
    if (!payload.name || !payload.email || !payload.phone || !payload.password) return showToast('Fill required fields', 'error');
    const res = await api('/admin/partners', { method: 'POST', body: JSON.stringify(payload) });
    if (res?.success) { showToast('Partner created', 'success'); closeFormModal(); loadTechnicians(); }
    else showToast(res?.message || 'Error', 'error');
  };
  document.getElementById('formModal').style.display = 'flex';
}

async function editPartner(id) {
  const data = await api('/admin/partners');
  const p = (data?.data || []).find(x => x._id === id);
  if (!p) return;
  document.getElementById('formModalTitle').textContent = 'Edit Partner';
  document.getElementById('formModalBody').innerHTML = `
    <div class="form-group"><label>Name</label><input type="text" id="prtEditName" class="form-input" value="${p.name || ''}"></div>
    <div class="form-group"><label>Phone</label><input type="tel" id="prtEditPhone" class="form-input" value="${p.phone || ''}"></div>
    <div class="form-group"><label>Specialization</label><input type="text" id="prtEditSpec" class="form-input" value="${p.specialization || ''}"></div>
    <div class="form-group"><label>Service Areas</label><input type="text" id="prtEditAreas" class="form-input" value="${(p.serviceAreas || []).join(', ')}"></div>
    <div class="form-group"><label>City</label><input type="text" id="prtEditCity" class="form-input" value="${p.city || ''}"></div>
    <div class="form-group"><label>State</label><input type="text" id="prtEditState" class="form-input" value="${p.state || ''}"></div>
    <div class="form-group"><label><input type="checkbox" id="prtEditActive" ${p.isActive ? 'checked' : ''}> Active</label></div>`;
  document.getElementById('formModalSubmit').onclick = async () => {
    const res = await api(`/admin/partners/${id}`, { method: 'PUT', body: JSON.stringify({ name: getVal('prtEditName'), phone: getVal('prtEditPhone'), specialization: getVal('prtEditSpec'), serviceAreas: getVal('prtEditAreas'), city: getVal('prtEditCity'), state: getVal('prtEditState'), isActive: getCheck('prtEditActive') }) });
    if (res?.success) { showToast('Updated', 'success'); closeFormModal(); loadTechnicians(); }
  };
  document.getElementById('formModal').style.display = 'flex';
}

async function openPayoutModal(partnerId, currentBal) {
  document.getElementById('formModalTitle').textContent = 'Manage Payout';
  document.getElementById('formModalBody').innerHTML = `
    <div style="margin-bottom:12px;font-size:0.9rem;color:var(--clr-text-muted)">Current Balance: <strong>${formatCurrency(currentBal || 0)}</strong></div>
    <div class="form-group"><label>Amount (₹)</label><input type="number" id="payoutAmt" class="form-input" placeholder="Enter amount"></div>
    <div class="form-group"><label>Action</label>
      <select id="payoutAction" class="form-select">
        <option value="add">Add (Work Done)</option>
        <option value="subtract">Subtract (Paid Out)</option>
      </select></div>
    <div class="form-group"><label>Note (optional)</label><input type="text" id="payoutNote" class="form-input"></div>`;
  document.getElementById('formModalSubmit').onclick = async () => {
    const res = await api(`/admin/partners/${partnerId}/payout`, { method: 'POST', body: JSON.stringify({ amount: getVal('payoutAmt'), action: getVal('payoutAction'), note: getVal('payoutNote') }) });
    if (res?.success) { showToast('Payout updated', 'success'); closeFormModal(); loadTechnicians(); }
    else showToast(res?.message || 'Error', 'error');
  };
  document.getElementById('formModal').style.display = 'flex';
}

// ── System Data CRUD ──────────────────────────────────────────
async function showAddSystemItemModal() {
  document.getElementById('formModalTitle').textContent = `Add New ${currentDataTab.slice(0, -1).replace('-', ' ')}`;
  let fields = '';
  
  if (currentDataTab === 'repair-types') {
    const modelsData = await api('/admin/models');
    const models = modelsData?.data || [];
    fields = `
      <div class="form-group"><label>Name</label><input type="text" id="sysName" class="form-input" placeholder="e.g. Screen Replacement"></div>
      <div class="form-group"><label>Category</label>
        <select id="sysCat" class="form-select">
          <option value="general">General (All)</option>
          <option value="smartphone">Smartphone</option>
          <option value="laptop">Laptop</option>
          <option value="tablet">Tablet</option>
          <option value="smartwatch">Smartwatch</option>
        </select></div>
      <div class="form-group"><label>Specific Models (optional)</label>
        <select id="sysModels" class="form-select" multiple style="height:100px">
          ${models.map(m => `<option value="${m._id}">${m.brand?.name || ''} ${m.name}</option>`).join('')}
        </select>
        <small style="color:var(--clr-text-faint)">Hold Ctrl to select multiple</small>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Base Price (₹)</label><input type="number" id="sysPrice" class="form-input"></div>
        <div class="form-group"><label>Base Payout (₹)</label><input type="number" id="sysPayout" class="form-input"></div>
      </div>
      <div class="form-group"><label>Description</label><textarea id="sysDesc" class="form-input" style="height:60px"></textarea></div>`;
  } else if (currentDataTab === 'brands') {
    fields = `
      <div class="form-group"><label>Brand Name</label><input type="text" id="sysName" class="form-input" placeholder="e.g. Apple"></div>
      <div class="form-group"><label>Category</label>
        <select id="sysCat" class="form-select">
          <option value="smartphone">Smartphone</option><option value="laptop">Laptop</option>
          <option value="tablet">Tablet</option><option value="smartwatch">Smartwatch</option>
        </select></div>`;
  } else if (currentDataTab === 'models') {
    const brandsData = await api('/admin/brands');
    const brands = brandsData?.data || [];
    fields = `
      <div class="form-group"><label>Model Name</label><input type="text" id="sysName" class="form-input" placeholder="e.g. iPhone 15 Pro"></div>
      <div class="form-group"><label>Brand</label>
        <select id="sysBrand" class="form-select">
          <option value="">-- Select Brand --</option>
          ${brands.map(b => `<option value="${b._id}">${b.name}</option>`).join('')}
        </select></div>
      <div class="form-group"><label>Category</label>
        <select id="sysCat" class="form-select">
          <option value="smartphone">Smartphone</option><option value="laptop">Laptop</option>
          <option value="tablet">Tablet</option><option value="smartwatch">Smartwatch</option>
        </select></div>`;
  } else if (currentDataTab === 'offers') {
    fields = `
      <div class="form-group"><label>Offer Code</label><input type="text" id="sysCode" class="form-input" placeholder="e.g. REPAIR10"></div>
      <div class="form-group"><label>Discount Type</label>
        <select id="sysDiscType" class="form-select"><option value="percentage">Percentage</option><option value="fixed">Fixed Amount</option></select></div>
      <div class="form-group"><label>Discount Value</label><input type="number" id="sysDiscVal" class="form-input"></div>
      <div class="form-group"><label>Start Date</label><input type="date" id="sysStart" class="form-input"></div>
      <div class="form-group"><label>End Date</label><input type="date" id="sysEnd" class="form-input"></div>`;
  }

  document.getElementById('formModalBody').innerHTML = fields;
  document.getElementById('formModalSubmit').onclick = async () => {
    let payload = {}, endpoint = `/admin/${currentDataTab}`;
    if (currentDataTab === 'repair-types') {
      const modelsSelect = document.getElementById('sysModels');
      const selectedModels = Array.from(modelsSelect.selectedOptions).map(o => o.value);
      payload = { 
        name: getVal('sysName'), 
        category: getVal('sysCat'),
        applicableModels: selectedModels,
        basePrice: getVal('sysPrice'), 
        basePayout: getVal('sysPayout'), 
        description: getVal('sysDesc') 
      };
    } else if (currentDataTab === 'brands') payload = { name: getVal('sysName'), category: getVal('sysCat') };
    else if (currentDataTab === 'models') payload = { name: getVal('sysName'), brand: getVal('sysBrand'), category: getVal('sysCat') };
    else if (currentDataTab === 'offers') payload = { code: getVal('sysCode'), discountType: getVal('sysDiscType'), discountValue: getVal('sysDiscVal'), startDate: getVal('sysStart'), endDate: getVal('sysEnd') };
    
    const res = await api(endpoint, { method: 'POST', body: JSON.stringify(payload) });
    if (res?.success) { showToast('Item created successfully', 'success'); closeFormModal(); loadSystemData(); }
    else showToast(res?.message || 'Error creating item', 'error');
  };
  document.getElementById('formModal').style.display = 'flex';
}

async function editSystemItem(id) {
  const data = await api(`/admin/${currentDataTab}`);
  const item = (data?.data || []).find(x => x._id === id);
  if (!item) return;

  document.getElementById('formModalTitle').textContent = `Edit ${currentDataTab.slice(0, -1).replace('-', ' ')}`;
  let fields = '';
  
  if (currentDataTab === 'repair-types') {
    const modelsData = await api('/admin/models');
    const models = modelsData?.data || [];
    const appModels = (item.applicableModels || []).map(m => typeof m === 'object' ? m._id : m);
    
    fields = `
      <div class="form-group"><label>Name</label><input type="text" id="sysName" class="form-input" value="${item.name}"></div>
      <div class="form-group"><label>Category</label>
        <select id="sysCat" class="form-select">
          <option value="general" ${item.category === 'general' ? 'selected' : ''}>General (All)</option>
          <option value="smartphone" ${item.category === 'smartphone' ? 'selected' : ''}>Smartphone</option>
          <option value="laptop" ${item.category === 'laptop' ? 'selected' : ''}>Laptop</option>
          <option value="tablet" ${item.category === 'tablet' ? 'selected' : ''}>Tablet</option>
          <option value="smartwatch" ${item.category === 'smartwatch' ? 'selected' : ''}>Smartwatch</option>
        </select></div>
      <div class="form-group"><label>Specific Models (optional)</label>
        <select id="sysModels" class="form-select" multiple style="height:100px">
          ${models.map(m => `<option value="${m._id}" ${appModels.includes(m._id) ? 'selected' : ''}>${m.brand?.name || ''} ${m.name}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group"><label>Base Price (₹)</label><input type="number" id="sysPrice" class="form-input" value="${item.basePrice}"></div>
        <div class="form-group"><label>Base Payout (₹)</label><input type="number" id="sysPayout" class="form-input" value="${item.basePayout}"></div>
      </div>
      <div class="form-group"><label>Description</label><textarea id="sysDesc" class="form-input" style="height:60px">${item.description || ''}</textarea></div>`;
  } else if (currentDataTab === 'brands') {
    fields = `
      <div class="form-group"><label>Brand Name</label><input type="text" id="sysName" class="form-input" value="${item.name}"></div>
      <div class="form-group"><label>Category</label>
        <select id="sysCat" class="form-select">
          <option value="smartphone" ${item.category === 'smartphone' ? 'selected' : ''}>Smartphone</option>
          <option value="laptop" ${item.category === 'laptop' ? 'selected' : ''}>Laptop</option>
          <option value="tablet" ${item.category === 'tablet' ? 'selected' : ''}>Tablet</option>
          <option value="smartwatch" ${item.category === 'smartwatch' ? 'selected' : ''}>Smartwatch</option>
        </select></div>`;
  } else if (currentDataTab === 'models') {
    const brandsData = await api('/admin/brands');
    const brands = brandsData?.data || [];
    fields = `
      <div class="form-group"><label>Model Name</label><input type="text" id="sysName" class="form-input" value="${item.name}"></div>
      <div class="form-group"><label>Brand</label>
        <select id="sysBrand" class="form-select">
          ${brands.map(b => `<option value="${b._id}" ${item.brand?._id === b._id ? 'selected' : ''}>${b.name}</option>`).join('')}
        </select></div>
      <div class="form-group"><label>Category</label>
        <select id="sysCat" class="form-select">
          <option value="smartphone" ${item.category === 'smartphone' ? 'selected' : ''}>Smartphone</option>
          <option value="laptop" ${item.category === 'laptop' ? 'selected' : ''}>Laptop</option>
          <option value="tablet" ${item.category === 'tablet' ? 'selected' : ''}>Tablet</option>
          <option value="smartwatch" ${item.category === 'smartwatch' ? 'selected' : ''}>Smartwatch</option>
        </select></div>`;
  }

  document.getElementById('formModalBody').innerHTML = fields;
  document.getElementById('formModalSubmit').onclick = async () => {
    let payload = {};
    if (currentDataTab === 'repair-types') {
      const modelsSelect = document.getElementById('sysModels');
      const selectedModels = Array.from(modelsSelect.selectedOptions).map(o => o.value);
      payload = { 
        name: getVal('sysName'), 
        category: getVal('sysCat'),
        applicableModels: selectedModels,
        basePrice: getVal('sysPrice'), 
        basePayout: getVal('sysPayout'), 
        description: getVal('sysDesc') 
      };
    } else if (currentDataTab === 'brands') payload = { name: getVal('sysName'), category: getVal('sysCat') };
    else if (currentDataTab === 'models') payload = { name: getVal('sysName'), brand: getVal('sysBrand'), category: getVal('sysCat') };
    
    const res = await api(`/admin/${currentDataTab}/${id}`, { method: 'PUT', body: JSON.stringify(payload) });
    if (res?.success) { showToast('Updated successfully', 'success'); closeFormModal(); loadSystemData(); }
    else showToast(res?.message || 'Error updating item', 'error');
  };
  document.getElementById('formModal').style.display = 'flex';
}

// ── Enquiries Management ─────────────────────────────────────
let currentEnquiryTab = 'contact';

function switchEnquiryTab(tab, btn) {
  currentEnquiryTab = tab;
  document.querySelectorAll('#pageEnquiries .t-btn').forEach(b => b.classList.remove('active'));
  btn.classList.add('active');
  loadEnquiries();
}

async function loadEnquiries() {
  const tbody = document.getElementById('enquiryTableBody');
  const header = document.getElementById('enquiryTableHeader');
  const search = document.getElementById('enquirySearch')?.value || '';
  const status = document.getElementById('enquiryStatusFilter')?.value || '';
  const start = document.getElementById('enquiryStartDate')?.value || '';
  const end = document.getElementById('enquiryEndDate')?.value || '';
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px">Loading enquiries...</td></tr>';

  const res = await api(`/enquiries/admin?type=${currentEnquiryTab}&search=${search}&status=${status}&startDate=${start}&endDate=${end}`);
  const items = res?.data || [];
  document.getElementById('enquiryRecordCount').textContent = `${items.length} records`;

  header.innerHTML = `<tr>
    <th>Name / Contact</th>
    <th>Type</th>
    <th>Date</th>
    ${currentEnquiryTab === 'support' ? '<th>Order Ref</th>' : ''}
    <th>Status</th>
    <th>Actions</th>
  </tr>`;

  tbody.innerHTML = items.map(i => `
    <tr>
      <td>
        <div style="font-weight:600">${i.name}</div>
        <div style="font-size:0.8rem;color:var(--clr-text-muted)">${i.email} | ${i.phone}</div>
      </td>
      <td style="text-transform:capitalize">${i.type}</td>
      <td>${new Date(i.createdAt).toLocaleDateString()}</td>
      ${currentEnquiryTab === 'support' ? `<td>${i.orderReference || i.orderId?.referenceNumber || '—'}</td>` : ''}
      <td><span class="badge badge-${i.status}">${i.status.replace('_', ' ')}</span></td>
      <td>
        <div class="td-actions">
          <button class="action-btn" onclick="viewEnquiryDetail('${i._id}')">View</button>
          <button class="action-btn" onclick="updateEnquiryStatus('${i._id}')">Status</button>
        </div>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;padding:40px">No enquiries found.</td></tr>';
}

// ── Email Template Management ──────────────────────────────
async function loadEmailTemplates() {
  const tbody = document.getElementById('templateTableBody');
  if (!tbody) return;

  tbody.innerHTML = '<tr><td colspan="5" style="text-align:center;padding:40px">Loading templates...</td></tr>';

  const res = await api('/admin/email-templates');
  const items = res?.data || [];
  document.getElementById('templateRecordCount').textContent = `${items.length} templates`;

  tbody.innerHTML = items.map(i => `
    <tr>
      <td><div style="font-weight:600">${i.name}</div></td>
      <td style="text-transform:capitalize">${i.type}</td>
      <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${i.subject}</td>
      <td><span class="badge badge-${i.isActive ? 'active' : 'inactive'}">${i.isActive ? 'Active' : 'Inactive'}</span></td>
      <td>
        <div class="td-actions">
          <button class="action-btn" onclick="openTemplateModal('${i._id}')">Edit</button>
          <button class="action-btn" onclick="deleteTemplate('${i._id}')">Delete</button>
        </div>
      </td>
    </tr>
  `).join('') || '<tr><td colspan="5" style="text-align:center;padding:40px">No templates found.</td></tr>';
}

async function openTemplateModal(id = null) {
  let template = { name: '', subject: '', header: '', body: '', footer: '', ctaText: '', ctaLink: '', type: 'booking' };
  
  if (id) {
    const res = await api('/admin/email-templates');
    template = res.data.find(x => x._id === id);
  }

  document.getElementById('formModalTitle').textContent = id ? 'Edit Email Template' : 'Create New Email Template';
  
  const formHtml = `
    <div class="form-row">
      <div class="form-group">
        <label>Template Name</label>
        <input type="text" id="tmName" class="form-input" value="${template.name}" ${id ? 'disabled' : ''} placeholder="e.g. Booking Confirmation">
      </div>
      <div class="form-group">
        <label>Event Type</label>
        <select id="tmType" class="form-select" ${id ? 'disabled' : ''}>
          <option value="booking" ${template.type === 'booking' ? 'selected' : ''}>Booking</option>
          <option value="quotation" ${template.type === 'quotation' ? 'selected' : ''}>Quotation</option>
          <option value="status_update" ${template.type === 'status_update' ? 'selected' : ''}>Status Update</option>
          <option value="otp" ${template.type === 'otp' ? 'selected' : ''}>OTP</option>
          <option value="password_reset" ${template.type === 'password_reset' ? 'selected' : ''}>Password Reset</option>
          <option value="partner_assigned" ${template.type === 'partner_assigned' ? 'selected' : ''}>Partner Assigned</option>
          <option value="feedback_request" ${template.type === 'feedback_request' ? 'selected' : ''}>Feedback Request</option>
          <option value="marketing" ${template.type === 'marketing' ? 'selected' : ''}>Marketing</option>
        </select>
      </div>
    </div>
    <div class="form-group">
      <label>Email Subject</label>
      <input type="text" id="tmSubject" class="form-input" value="${template.subject}" placeholder="Use {{customerName}} for variables">
    </div>
    <div class="form-group">
      <label>Header Text (Optional)</label>
      <input type="text" id="tmHeader" class="form-input" value="${template.header || ''}">
    </div>
    <div class="form-group">
      <label>Body Content</label>
      <textarea id="tmBody" class="form-textarea" style="height:150px" placeholder="HTML or Plain text. Use {{orderId}}, {{brand}}, etc.">${template.body}</textarea>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label>CTA Button Text</label>
        <input type="text" id="tmCtaText" class="form-input" value="${template.ctaText || ''}">
      </div>
      <div class="form-group">
        <label>CTA Button Link</label>
        <input type="text" id="tmCtaLink" class="form-input" value="${template.ctaLink || ''}">
      </div>
    </div>
    <div class="form-group">
      <label>Footer Text (Optional)</label>
      <input type="text" id="tmFooter" class="form-input" value="${template.footer || ''}">
    </div>
  `;

  document.getElementById('formModalBody').innerHTML = formHtml;
  document.getElementById('formModalSubmit').textContent = id ? 'Update Template' : 'Create Template';
  document.getElementById('formModalSubmit').onclick = async () => {
    const data = {
      name: document.getElementById('tmName').value,
      type: document.getElementById('tmType').value,
      subject: document.getElementById('tmSubject').value,
      header: document.getElementById('tmHeader').value,
      body: document.getElementById('tmBody').value,
      ctaText: document.getElementById('tmCtaText').value,
      ctaLink: document.getElementById('tmCtaLink').value,
      footer: document.getElementById('tmFooter').value
    };

    const method = id ? 'PUT' : 'POST';
    const url = id ? `/admin/email-templates/${id}` : '/admin/email-templates';
    
    const res = await api(url, { method, body: JSON.stringify(data) });
    if (res?.success) {
      showToast(id ? 'Template updated' : 'Template created', 'success');
      closeFormModal();
      loadEmailTemplates();
    }
  };

  document.getElementById('formModal').style.display = 'flex';
}

async function deleteTemplate(id) {
  if (!confirm('Are you sure you want to delete this template?')) return;
  const res = await api(`/admin/email-templates/${id}`, { method: 'DELETE' });
  if (res?.success) {
    showToast('Template deleted', 'success');
    loadEmailTemplates();
  }
}

// ── Communication Logs Management ──────────────────────────
async function loadLogs() {
  const tbody = document.getElementById('logsTableBody');
  if (!tbody) return;

  const eventType = document.getElementById('logTypeFilter')?.value || '';
  const status = document.getElementById('logStatusFilter')?.value || '';
  const date = document.getElementById('logDateFilter')?.value || '';
  const search = document.getElementById('logSearch')?.value || '';

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px">Loading logs...</td></tr>';

  const res = await api(`/admin/notification-logs?eventType=${eventType}&deliveryStatus=${status}&date=${date}&recipient=${search}`);
  const items = res?.data || [];
  document.getElementById('logRecordCount').textContent = `${items.length} logs`;

  tbody.innerHTML = items.map(i => `
    <tr>
      <td><div style="font-weight:600">${i.recipient}</div></td>
      <td>
        <div style="text-transform:capitalize">${i.eventName}</div>
        <div style="font-size:0.7rem;color:var(--clr-text-faint)">${i.eventType || 'SYSTEM'}</div>
      </td>
      <td><div style="font-size:0.85rem;max-width:200px;overflow:hidden;text-overflow:ellipsis">${i.subject || '—'}</div></td>
      <td>${i.channel}</td>
      <td>${new Date(i.sentAt).toLocaleString()}</td>
      <td>
        <span class="badge badge-${i.deliveryStatus === 'SENT' ? 'active' : 'inactive'}">
          ${i.deliveryStatus}
        </span>
        ${i.errorMessage ? `<div style="font-size:0.7rem;color:var(--clr-danger);margin-top:4px">${i.errorMessage}</div>` : ''}
      </td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;padding:40px">No logs found matching filters.</td></tr>';
}

// ── Audit Logs Management ───────────────────────────
async function loadAuditLogs() {
  const tbody = document.getElementById('auditLogsTableBody');
  if (!tbody) return;

  const action = document.getElementById('auditActionFilter')?.value || '';
  const role = document.getElementById('auditRoleFilter')?.value || '';
  const date = document.getElementById('auditDateFilter')?.value || '';
  const search = document.getElementById('auditSearch')?.value || '';

  tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:40px">Loading audit trail...</td></tr>';

  const res = await api(`/admin/audit-logs?action=${action}&role=${role}&startDate=${date}&orderId=${search}`);
  const items = res?.data || [];
  document.getElementById('auditRecordCount').textContent = `${items.length} logs`;

  tbody.innerHTML = items.map(i => `
    <tr onclick="showAuditDetail('${i._id}')" style="cursor:pointer">
      <td><span class="badge badge-info" style="font-size:0.7rem">${i.action}</span></td>
      <td>
        <div style="font-weight:600">${i.performedBy?.name || 'System'}</div>
        <div style="font-size:0.75rem;color:var(--clr-text-faint)">${i.performedBy?.email || 'automated@system'}</div>
      </td>
      <td><div style="text-transform:capitalize">${i.performerRole || 'System'}</div></td>
      <td>${new Date(i.createdAt).toLocaleString()}</td>
      <td>
        <div style="font-weight:500">${i.entityType}</div>
        <div style="font-size:0.75rem;color:var(--clr-accent)">${i.entityId}</div>
      </td>
      <td><div style="font-size:0.85rem;max-width:250px;overflow:hidden;text-overflow:ellipsis">${i.description || '—'}</div></td>
    </tr>
  `).join('') || '<tr><td colspan="6" style="text-align:center;padding:40px">No activity logs found matching filters.</td></tr>';
}

async function showAuditDetail(id) {
  const res = await api(`/admin/audit-logs/${id}`);
  if (!res?.success) return;
  const log = res.data;
  
  const content = `
    <div style="text-align:left; font-family:monospace; font-size:0.9rem;">
      <p><strong>Action:</strong> ${log.action}</p>
      <p><strong>Performer:</strong> ${log.performedBy?.name || 'System'} (${log.performerRole})</p>
      <p><strong>Entity:</strong> ${log.entityType} [${log.entityId}]</p>
      <p><strong>Time:</strong> ${new Date(log.createdAt).toLocaleString()}</p>
      <p><strong>IP:</strong> ${log.ipAddress || 'Internal'}</p>
      <hr style="margin:10px 0; border:0; border-top:1px solid #eee;">
      <p><strong>Description:</strong> ${log.description || 'N/A'}</p>
      <p><strong>Previous State:</strong> <pre style="background:#f9f9f9; padding:8px; border-radius:4px;">${JSON.stringify(log.previousValue, null, 2)}</pre></p>
      <p><strong>New State:</strong> <pre style="background:#f1f7ff; padding:8px; border-radius:4px;">${JSON.stringify(log.updatedValue, null, 2)}</pre></p>
    </div>
  `;
  
  // Custom modal or simple styled alert
  const modal = document.createElement('div');
  modal.style = "position:fixed; top:0; left:0; width:100%; height:100%; background:rgba(0,0,0,0.5); display:flex; align-items:center; justify-content:center; z-index:10000; padding:20px;";
  modal.innerHTML = `
    <div style="background:white; padding:30px; border-radius:12px; max-width:600px; width:100%; max-height:90vh; overflow-y:auto; box-shadow:0 20px 50px rgba(0,0,0,0.3);">
      <h3 style="margin-top:0;">Activity Detail</h3>
      ${content}
      <button onclick="this.parentElement.parentElement.remove()" class="btn btn-primary" style="margin-top:20px; width:100%;">Close</button>
    </div>
  `;
  document.body.appendChild(modal);
}

async function testEmailTemplate(id) {
  const email = prompt('Enter recipient email for test:');
  if (!email) return;
  
  const res = await api('/admin/send-test-email', {
    method: 'POST',
    body: JSON.stringify({ templateId: id, testEmail: email })
  });
  if (res?.success) showToast('Test email sent!', 'success');
}

async function previewTemplate(id) {
  const res = await api(`/admin/email-templates`);
  const template = res.data.find(x => x._id === id);
  if (!template) return;

  // Use a temporary data object for preview variables
  const mockData = {
    customerName: 'John Doe',
    orderId: 'RV-TEST-12345',
    brand: 'Apple',
    model: 'iPhone 15 Pro',
    price: '4,999',
    service: 'Screen Replacement',
    otp: '123456',
    status: 'In Progress',
    partnerName: 'RepairPro Delhi',
    trackUrl: '#',
    resetUrl: '#',
    feedbackUrl: '#'
  };

  // We'll call a preview endpoint or just mimic logic
  // Better: I'll add a preview route to backend
  const previewRes = await api('/admin/preview-template', {
    method: 'POST',
    body: JSON.stringify({ templateId: id, mockData })
  });
  
  if (previewRes?.success) {
    const win = window.open('', '_blank');
    win.document.write(previewRes.html);
    win.document.close();
  }
}

async function viewEnquiryDetail(id) {
  const res = await api(`/enquiries/admin?id=${id}`); // Helper to get single
  // Wait, my getAll returns all. I'll just find in list or add single route.
  // I'll assume my API can handle single if I filter by search=id (not ideal but works for now)
  // Better: I'll fetch all and find
  const all = await api(`/enquiries/admin`);
  const item = all.data.find(x => x._id === id);
  if (!item) return;

  document.getElementById('formModalTitle').textContent = `Enquiry Detail - ${item.type.toUpperCase()}`;
  let detailHtml = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px">
      <div><label style="color:var(--clr-text-faint);font-size:0.8rem">From</label><div style="font-weight:600">${item.name}</div></div>
      <div><label style="color:var(--clr-text-faint);font-size:0.8rem">Date</label><div>${new Date(item.createdAt).toLocaleString()}</div></div>
      <div><label style="color:var(--clr-text-faint);font-size:0.8rem">Email</label><div>${item.email}</div></div>
      <div><label style="color:var(--clr-text-faint);font-size:0.8rem">Phone</label><div>${item.phone}</div></div>
    </div>`;

  if (item.type === 'contact') detailHtml += `<div class="form-group"><label>Message</label><p style="background:rgba(0,0,0,0.2);padding:10px;border-radius:8px">${item.message}</p></div>`;
  else if (item.type === 'sales') detailHtml += `
    <div class="form-group"><label>Company</label><div>${item.company || '—'}</div></div>
    <div class="form-group"><label>Requirement</label><p style="background:rgba(0,0,0,0.2);padding:10px;border-radius:8px">${item.requirementDetails}</p></div>`;
  else if (item.type === 'support') detailHtml += `
    <div class="form-group"><label>Issue Type</label><div style="text-transform:capitalize">${item.issueType}</div></div>
    <div class="form-group"><label>Order Ref</label><div>${item.orderReference || '—'}</div></div>
    <div class="form-group"><label>Description</label><p style="background:rgba(0,0,0,0.2);padding:10px;border-radius:8px">${item.description}</p></div>`;
  else if (item.type === 'promotional') detailHtml += `
    <div class="form-group"><label>Interest</label><div style="text-transform:capitalize">${item.interest}</div></div>
    <div class="form-group"><label>Campaign Source</label><div>${item.campaignSource}</div></div>`;

  detailHtml += `
    <hr style="border:0;border-top:1px solid rgba(255,255,255,0.05);margin:20px 0">
    <div class="enquiry-history" style="max-height:200px;overflow-y:auto;margin-bottom:20px">
      <h4 style="margin-bottom:10px;font-size:0.9rem">Reply History</h4>
      ${(item.responses || []).map(r => `
        <div style="background:rgba(255,255,255,0.05);padding:10px;border-radius:8px;margin-bottom:8px;font-size:0.85rem">
          <div style="color:var(--clr-text-faint);font-size:0.7rem;margin-bottom:4px">Replied on ${new Date(r.sentAt).toLocaleString()}</div>
          <div>${r.message}</div>
        </div>
      `).join('') || '<p style="color:var(--clr-text-faint);font-size:0.8rem">No replies sent yet.</p>'}
    </div>
    <div class="form-group"><label>Direct Reply (Sends Email)</label><textarea id="enqReply" class="form-textarea" placeholder="Type your response to the customer..." style="height:80px"></textarea></div>
    <div class="form-group"><label>Internal Admin Notes</label><textarea id="enqAdminNotes" class="form-textarea" placeholder="Add internal notes...">${item.adminNotes || ''}</textarea></div>
  `;

  document.getElementById('formModalBody').innerHTML = detailHtml;
  document.getElementById('formModalSubmit').textContent = 'Send Reply & Save';
  document.getElementById('formModalSubmit').onclick = async () => {
    const reply = document.getElementById('enqReply').value;
    const notes = document.getElementById('enqAdminNotes').value;
    const updateRes = await api(`/enquiries/admin/${id}`, { 
      method: 'PUT', 
      body: JSON.stringify({ replyMessage: reply, adminNotes: notes }) 
    });
    if (updateRes?.success) { showToast('Reply sent and notes saved', 'success'); closeFormModal(); loadEnquiries(); }
  };
  document.getElementById('formModal').style.display = 'flex';
}

async function updateEnquiryStatus(id) {
  const status = prompt('Enter new status (new, in_progress, resolved, closed):');
  if (!status || !['new', 'in_progress', 'resolved', 'closed'].includes(status)) return;

  const res = await api(`/enquiries/admin/${id}`, { method: 'PUT', body: JSON.stringify({ status }) });
  if (res?.success) {
    showToast(`Status updated to ${status}`, 'success');
    loadEnquiries();
  }
}

async function toggleSystemStatus(id, currentStatus) {
  const res = await api(`/admin/${currentDataTab}/${id}`, { 
    method: 'PUT', 
    body: JSON.stringify({ isActive: !currentStatus }) 
  });
  if (res?.success) {
    showToast(`Item ${!currentStatus ? 'activated' : 'deactivated'}`, 'success');
    loadSystemData();
  }
}

async function deleteSystemItem(id) {
  if (!confirm('Are you sure you want to PERMANENTLY delete this item?')) return;
  const res = await api(`/admin/${currentDataTab}/${id}`, { method: 'DELETE' });
  if (res?.success) {
    showToast('Item deleted successfully', 'success');
    loadSystemData();
  } else {
    showToast(res?.message || 'Error deleting item', 'error');
  }
}

async function loadBrandFilterOptions() {
  const res = await api('/admin/brands');
  const brands = res?.data || [];
  const select = document.getElementById('sysBrandFilter');
  if (!select) return;
  select.innerHTML = '<option value="">All Brands</option>' + 
    brands.map(b => `<option value="${b._id}">${b.name}</option>`).join('');
}

// ── Export & Auth ─────────────────────────────────────────────
async function exportData(format = 'csv') {
  const token = localStorage.getItem('rv_token') || sessionStorage.getItem('rv_token');
  const url = `${API}/admin/export/bookings?format=${format}`;
  const a = document.createElement('a');
  a.href = url + `&token=${token}`;
  a.download = `bookings.${format}`;
  a.click();
}

// ── Account Security Module (Steps 1-6) ─────────────────────
function openAccountSecurityModal(id, type, name, isLocked, isActive) {
  const modal = document.getElementById('formModal');
  document.getElementById('formModalTitle').textContent = `Security Control: ${name}`;
  document.getElementById('formModalBody').innerHTML = `
    <div style="display:grid; gap:15px;">
      <div style="padding:15px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
        <h4 style="margin-bottom:10px; color:var(--clr-primary)">Credential Management</h4>
        <div class="form-group">
          <label>Set New Password</label>
          <div style="display:flex; gap:8px;">
            <input type="password" id="secNewPass" class="form-input" placeholder="Min 8 chars">
            <button class="btn btn-outline" onclick="adminUpdatePassword('${id}', '${type}')">Update</button>
          </div>
        </div>
        <button class="btn btn-outline" style="width:100%; margin-top:10px;" onclick="adminUpdateAccountStatus('${id}', '${type}', 'forceReset')">⚠️ Force Password Reset on Next Login</button>
      </div>

      <div style="padding:15px; background:rgba(255,255,255,0.03); border-radius:10px; border:1px solid rgba(255,255,255,0.05);">
        <h4 style="margin-bottom:10px; color:var(--clr-primary)">Access Control</h4>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
          <button class="btn ${isActive ? 'btn-outline' : 'btn-primary'}" onclick="adminUpdateAccountStatus('${id}', '${type}', '${isActive ? 'deactivate' : 'activate'}')">
            ${isActive ? '⛔ Deactivate Account' : '✅ Activate Account'}
          </button>
          <button class="btn ${isLocked ? 'btn-primary' : 'btn-outline'}" onclick="adminUpdateAccountStatus('${id}', '${type}', '${isLocked ? 'unlock' : 'lock'}')">
            ${isLocked ? '🔓 Unlock Account' : '🔒 Lock Account'}
          </button>
        </div>
      </div>
    </div>
  `;
  document.getElementById('formModalFooter').style.display = 'none'; // Use internal buttons
  modal.style.display = 'flex';
}

async function adminUpdatePassword(id, type) {
  const newPassword = document.getElementById('secNewPass').value;
  if (!newPassword || newPassword.length < 8) return showToast('Password must be at least 8 characters', 'error');
  
  const res = await api('/admin/accounts/manage-password', {
    method: 'POST',
    body: JSON.stringify({ id, type, newPassword })
  });
  
  if (res?.success) {
    showToast('Password updated successfully', 'success');
    closeFormModal();
  }
}

async function adminUpdateAccountStatus(id, type, action) {
  const confirmMsg = {
    deactivate: 'Are you sure you want to DEACTIVATE this account? The user will not be able to log in.',
    lock: 'Are you sure you want to LOCK this account due to suspicious activity?',
    forceReset: 'Force this user to change their password immediately upon their next login?'
  };
  
  if (confirmMsg[action] && !confirm(confirmMsg[action])) return;

  const res = await api('/admin/accounts/update-status', {
    method: 'POST',
    body: JSON.stringify({ id, type, action })
  });

  if (res?.success) {
    showToast(`Account successfully ${action}ed`, 'success');
    closeFormModal();
    if (type === 'customer') loadCustomers(); else loadTechnicians();
  }
}

// Ensure form footer is restored when modal closes
const originalCloseFormModal = closeFormModal;
closeFormModal = function() {
  document.getElementById('formModalFooter').style.display = 'flex';
  originalCloseFormModal();
};

function logout() {
  localStorage.clear();
  sessionStorage.clear();
  window.location.replace('login.html');
}

// ── Feedback Intelligence (Steps 8-11) ──────────────────────
async function loadFeedback() {
  const type = document.getElementById('fbType').value;
  const rating = document.getElementById('fbMinRating').value;
  const search = document.getElementById('fbSearch').value;

  const stats = await api(`/feedback/stats`);
  if (stats?.success) renderFeedbackStats(stats.data);

  const res = await api(`/feedback?type=${type}&rating=${rating}&search=${search}`);
  if (res?.success) {
    const tbody = document.getElementById('fbTableBody');
    tbody.innerHTML = res.data.map(f => `
      <tr>
        <td style="font-size:0.8rem">${new Date(f.createdAt).toLocaleDateString()}</td>
        <td><strong style="color:var(--clr-primary)">${f.orderId}</strong></td>
        <td>
          <div style="font-weight:600">${f.fromName}</div>
          <div style="font-size:0.7rem; color:var(--clr-text-faint)">ID: ${f.fromId}</div>
        </td>
        <td><span class="badge" style="background:${f.type === 'customer' ? 'rgba(99,102,241,0.1)' : 'rgba(16,185,129,0.1)'}; color:${f.type === 'customer' ? '#6366f1' : '#10b981'}; font-size:0.7rem; padding:2px 8px; border-radius:10px">${f.type.toUpperCase()}</span></td>
        <td>
          <div style="color:#f59e0b">
            ${'⭐'.repeat(f.rating || f.orderQuality || 0)}
            <span style="font-weight:bold; color:#fff; margin-left:5px">${f.rating || f.orderQuality || 0}.0</span>
          </div>
          ${f.type === 'customer' ? `<div style="font-size:0.7rem; color:var(--clr-text-faint)">Quality: ${f.serviceQuality}/5</div>` : `<div style="font-size:0.7rem; color:var(--clr-text-faint)">Admin Coord: ${f.adminCoordination}/5</div>`}
        </td>
        <td style="max-width:300px">
          <div style="font-size:0.85rem; color:rgba(255,255,255,0.8); line-height:1.4">${f.review || f.partsNotes || 'No written comments.'}</div>
          ${f.deviceCondition ? `<div style="font-size:0.7rem; color:#10b981; margin-top:4px">Cond: ${f.deviceCondition}</div>` : ''}
        </td>
        <td>
           <button class="btn btn-outline" style="padding:4px 8px; font-size:0.75rem" onclick="viewOrderDetails('${f.booking?._id || f.booking}')">View Order</button>
        </td>
      </tr>
    `).join('');
  }
}

function renderFeedbackStats(s) {
  setEl('fbStatAvg', s.overallAvg);
  setEl('fbStatCust', s.totalCustomer);
  setEl('fbStatPart', s.totalPartner);
  
  const satis = s.customerAvg ? Math.round((s.customerAvg / 5) * 100) : 0;
  setEl('fbStatSatis', satis + '%');

  document.getElementById('fbQuickStats').innerHTML = `
    <div style="background:rgba(255,255,255,0.05); padding:4px 12px; border-radius:20px; font-size:0.8rem">
      🔧 Quality: <span style="color:#10b981">${s.qualityAvg || 0}</span>
    </div>
    <div style="background:rgba(255,255,255,0.05); padding:4px 12px; border-radius:20px; font-size:0.8rem">
      🤝 Behavior: <span style="color:#6366f1">${s.behaviorAvg || 0}</span>
    </div>
  `;
}

async function viewOrderDetails(id) {
   if (!id) return showToast('Order record not found', 'error');
   showPage('orders');
   // wait for orders to load then highlight? 
   // for now just switch page
}

// ── Initialize ────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  showPage('dashboard', document.querySelector('[data-page="dashboard"]'));
  document.getElementById('sidebarToggle')?.addEventListener('click', () => document.getElementById('sidebar').classList.toggle('open'));
  document.getElementById('sidebarClose')?.addEventListener('click', () => document.getElementById('sidebar').classList.remove('open'));

  // Step 17: Secure Session Handling (Auto Logout after 15m inactivity)
  let idleTime = 0;
  const idleInterval = setInterval(() => {
    idleTime++;
    if (idleTime >= 15) { // 15 minutes
      showToast('Session expired due to inactivity.', 'info');
      setTimeout(logout, 2000);
    }
  }, 60000);

  document.addEventListener('mousemove', () => idleTime = 0);
  document.addEventListener('keypress', () => idleTime = 0);
});

