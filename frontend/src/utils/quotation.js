/* ============================================================
   RepairVafe – Quotation Page JS (API-driven)
   Fetches real quote from GET /api/quotations/:ref
   Approve/Reject via PUT /api/bookings/:ref/quote-action
   ============================================================ */

const API = (['localhost', '127.0.0.1', ''].includes(window.location.hostname))
  ? 'http://localhost:5000/api' : '/api';

let currentRef = null;

async function loadQuotation() {
  const input = document.getElementById('refInput');
  const ref = input?.value?.trim().toUpperCase();
  if (!ref) return showToast('Please enter a booking reference.', 'error');

  const btn = document.getElementById('lookupBtn');
  btn.textContent = '⏳ Loading...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/quotations/${ref}`);
    const data = await res.json();
    btn.textContent = 'View Quote';
    btn.disabled = false;

    if (!res.ok || !data.success) {
      showToast(data.message || 'No quotation found for this reference.', 'error');
      return;
    }
    currentRef = data.data.referenceNumber;
    renderQuotation(data.data);
  } catch (err) {
    btn.textContent = 'View Quote';
    btn.disabled = false;
    showToast('Cannot connect to server. Is the backend running?', 'error');
  }
}

function renderQuotation(q) {
  document.getElementById('lookupCard').style.display = 'none';
  const content = document.getElementById('quotationContent');
  content.style.display = 'block';

  setText('qRef',  q.referenceNumber);
  setText('qDate', 'Issued: ' + formatDate(q.updatedAt || q.createdAt));

  // Status badge
  const badge = document.getElementById('qStatus');
  const statusMap = { 'Pending': { cls: 'badge-pending', text: '⏳ Awaiting Your Approval' }, 'Approved': { cls: 'badge-approved', text: '✅ Approved' }, 'Rejected': { cls: 'badge-rejected', text: '✕ Declined' }, 'Not Issued': { cls: 'badge-received', text: '📋 Not Issued Yet' } };
  const sc = statusMap[q.quotationStatus] || statusMap['Not Issued'];
  badge.className = 'badge ' + sc.cls;
  badge.innerHTML = sc.text;

  // Customer
  setText('qCustName',    q.customerName);
  setText('qCustPhone',   q.customerPhone);
  setText('qCustEmail',   q.customerEmail);
  setText('qServiceType', q.serviceType ? q.serviceType.charAt(0).toUpperCase() + q.serviceType.slice(1) : '—');

  // Device
  setText('qDevice',     `${q.deviceBrand} ${q.deviceModel}`);
  setText('qBrand',      q.deviceBrand);
  setText('qIssues',     (q.repairTypes || []).join(', '));
  setText('qBookedDate', formatDate(q.createdAt));

  // Cost breakdown
  const costRows = document.getElementById('costRows');
  if (q.quotationAmount) {
    const items = (q.repairTypes || []).map((rt, i) => {
      const isCost = i === 0;
      return `<div class="cost-row"><span>${rt}</span><span>Repair Service</span><span>${isCost ? '₹' + q.quotationAmount.toLocaleString('en-IN') : 'Incl.'}</span></div>`;
    });
    items.push(`<div class="cost-row"><span>Labor Charges</span><span>Repair & Installation</span><span>Included</span></div>`);
    if (q.discount > 0) items.push(`<div class="cost-row"><span>Discount</span><span>Applied Offer</span><span style="color:#10b981">−₹${q.discount.toLocaleString('en-IN')}</span></div>`);
    costRows.innerHTML = items.join('');
  } else {
    costRows.innerHTML = '<div class="cost-row" style="color:var(--clr-text-muted)"><span colspan="3">Quotation not yet issued by technician</span></div>';
  }

  const subtotal = q.quotationAmount || 0;
  const total    = subtotal - (q.discount || 0);
  setText('qSubtotal', subtotal ? '₹' + subtotal.toLocaleString('en-IN') : '—');
  setText('qDiscount', q.discount > 0 ? '−₹' + q.discount.toLocaleString('en-IN') : '—');
  setText('qTotal',    total > 0 ? '₹' + total.toLocaleString('en-IN') : '—');

  // Misc
  setText('qEstTime',   q.estimatedTime || 'Will be updated');
  setText('qTechNote',  q.technicianNote || 'No notes added yet.');

  // Warranty
  const wEl = document.getElementById('qWarranty');
  if (wEl) wEl.textContent = q.warrantyPeriod || '3 Months';

  // Actions
  const actions    = document.getElementById('quotActions');
  const postAction = document.getElementById('quotPostAction');
  if (q.quotationStatus === 'Pending') {
    actions.style.display = 'flex';
    postAction.style.display = 'none';
  } else {
    actions.style.display = 'none';
    postAction.style.display = 'block';
    const messages = {
      Approved:   `<span style="font-size:2rem">✅</span><br><strong>Quote Approved!</strong><br><p style="color:var(--clr-text-muted);margin-top:8px">Your repair is now in progress. We'll notify you when it's ready.</p><br><a href="tracking.html" class="btn btn-primary" style="margin-top:12px">Track My Repair</a>`,
      Completed:  `<span style="font-size:2rem">🎉</span><br><strong>Repair Completed!</strong><br><p style="color:var(--clr-text-muted);margin-top:8px">Your device is ready for pickup.</p><br><a href="feedback.html" class="btn btn-primary" style="margin-top:12px">Leave Feedback</a>`,
      Rejected:   `<span style="font-size:2rem">❌</span><br><strong>Quote Declined</strong><br><p style="color:var(--clr-text-muted);margin-top:8px">Contact us if you change your mind.</p>`,
      'Not Issued': `<span style="font-size:2rem">⏳</span><br><strong>Quote Not Issued Yet</strong><br><p style="color:var(--clr-text-muted);margin-top:8px">Our technician will send a quote after diagnosing your device. Check back soon.</p>`
    };
    postAction.innerHTML = messages[q.quotationStatus] || messages['Not Issued'];
  }

  content.scrollIntoView({ behavior: 'smooth' });
}

async function requestQuoteApprovalOtp() {
  if (!currentRef) return;
  const btn = document.getElementById('approveBtn');
  btn.textContent = '⏳ Sending OTP...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/bookings/${currentRef}/quote-otp`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    btn.textContent = '✓ Approve & Proceed'; 
    btn.disabled = false;

    if (data.success) {
      document.getElementById('quotActions').style.display = 'none';
      document.getElementById('quoteOtpBlock').style.display = 'flex';
      showToast('OTP sent to your registered contacts.', 'info');
    } else {
      showToast(data.message || 'Failed to send OTP', 'error');
    }
  } catch (e) {
    btn.textContent = '✓ Approve & Proceed'; 
    btn.disabled = false;
    showToast('Cannot connect to server.', 'error');
  }
}

function cancelApproval() {
  document.getElementById('quoteOtpBlock').style.display = 'none';
  document.getElementById('quotActions').style.display = 'flex';
  document.getElementById('quoteOtpInput').value = '';
}

async function approveQuoteWithOtp() {
  if (!currentRef) return;
  const otpVal = document.getElementById('quoteOtpInput').value.trim();
  if (!otpVal) return showToast('Please enter the OTP.', 'error');

  const btn = document.getElementById('confirmOtpBtn');
  btn.textContent = '⏳ Verifying...';
  btn.disabled = true;

  try {
    const res  = await fetch(`${API}/bookings/${currentRef}/quote-action`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'approve', otp: otpVal })
    });
    const data = await res.json();
    btn.textContent = 'Confirm Approval'; btn.disabled = false;

    if (data.success) {
      document.getElementById('quoteOtpBlock').style.display = 'none';
      const p = document.getElementById('quotPostAction');
      p.style.display = 'block';
      p.innerHTML = `<span style="font-size:2rem">✅</span><br><strong>Approved Successfully!</strong><br><p style="color:var(--clr-text-muted);margin-top:8px">Repair has started. You'll get SMS updates.</p><br><a href="tracking.html" class="btn btn-primary" style="margin-top:12px">Track My Repair</a>`;
      document.getElementById('qStatus').className = 'badge badge-approved';
      document.getElementById('qStatus').innerHTML = '✅ Approved';
      showToast('Quote approved! Repair starts now. 🔧', 'success');
    } else {
      showToast(data.message || 'Action failed', 'error');
    }
  } catch (e) {
    btn.textContent = 'Confirm Approval'; btn.disabled = false;
    showToast('Cannot connect to server.', 'error');
  }
}

async function rejectQuote() {
  if (!currentRef || !confirm('Are you sure you want to decline this quotation?')) return;
  const res  = await fetch(`${API}/bookings/${currentRef}/quote-action`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'reject' }) });
  const data = await res.json();
  if (data.success) {
    document.getElementById('quotActions').style.display = 'none';
    const p = document.getElementById('quotPostAction');
    p.style.display = 'block';
    p.innerHTML = `<span style="font-size:2rem">❌</span><br><strong>Quotation Declined</strong><br><p style="color:var(--clr-text-muted);margin-top:8px">Contact us if you need assistance.</p>`;
    document.getElementById('qStatus').className = 'badge badge-rejected';
    document.getElementById('qStatus').innerHTML = '✕ Declined';
    showToast('Quotation declined.', 'info');
  }
}

function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val || '–'; }
function formatDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }); }
document.getElementById('refInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') loadQuotation(); });

function showToast(msg, type = 'info') {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div'); el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  c.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
