/* ============================================================
   RepairVafe – Tracking Page JS (API-driven)
   Fetches real repair data from GET /api/tracking/:ref
   ============================================================ */

const API = (['localhost', '127.0.0.1', ''].includes(window.location.hostname))
  ? 'http://localhost:5000/api' : '/api';

function resetTrackingForm() {
  document.getElementById('trackingRequestCard').style.display = 'block';
  document.getElementById('otpVerificationCard').style.display = 'none';
  document.getElementById('trackResult').style.display = 'none';
  document.getElementById('trackOtpInput').value = '';
}

async function requestTrackingOtp() {
  const refInput = document.getElementById('trackRefInput');
  const phoneInput = document.getElementById('trackPhoneInput');
  const ref = refInput?.value?.trim().toUpperCase();
  const phone = phoneInput?.value?.trim();

  if (!ref) {
    return showToast('Please enter an Order ID.', 'error');
  }

  // Step 16: Authenticated Bypass Check
  const token = localStorage.getItem('token');
  if (token) {
    try {
      const authRes = await fetch(`${API}/tracking/auth/${ref}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const authData = await authRes.json();
      if (authRes.ok && authData.success) {
        document.getElementById('trackingRequestCard').style.display = 'none';
        return renderTracking(authData.data);
      }
    } catch (e) {
      console.log('Auth bypass failed, falling back to OTP.');
    }
  }

  if (!phone) {
    return showToast('Please enter your Mobile Number.', 'error');
  }

  const btn = document.getElementById('requestOtpBtn');
  btn.textContent = '⏳ Requesting...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/tracking/request-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referenceNumber: ref, mobileNumber: phone })
    });
    const data = await res.json();
    btn.textContent = 'Request OTP';
    btn.disabled = false;

    if (!res.ok || !data.success) {
      return showToast(data.message || 'Verification failed.', 'error');
    }

    showToast('OTP Sent successfully to your mobile number!', 'success');
    document.getElementById('trackingRequestCard').style.display = 'none';
    document.getElementById('otpVerificationCard').style.display = 'block';
  } catch (err) {
    btn.textContent = 'Request OTP';
    btn.disabled = false;
    showToast('Cannot connect to server. Is the backend running?', 'error');
  }
}

async function verifyTrackingOtp() {
  const ref = document.getElementById('trackRefInput').value.trim().toUpperCase();
  const phone = document.getElementById('trackPhoneInput').value.trim();
  const otp = document.getElementById('trackOtpInput').value.trim();

  if (!otp || otp.length < 6) {
    return showToast('Please enter the 6-digit OTP.', 'error');
  }

  const btn = document.getElementById('verifyOtpBtn');
  btn.textContent = '⏳ Verifying...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/tracking/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referenceNumber: ref, mobileNumber: phone, otp })
    });
    const data = await res.json();
    btn.textContent = 'Verify & Track Order';
    btn.disabled = false;

    if (!res.ok || !data.success) {
      return showToast(data.message || 'Invalid OTP.', 'error');
    }

    // Success! Hide OTP box, show results
    document.getElementById('otpVerificationCard').style.display = 'none';
    renderTracking(data.data);
  } catch (err) {
    btn.textContent = 'Verify & Track Order';
    btn.disabled = false;
    showToast('Cannot connect to server.', 'error');
  }
}

async function requestOrderUpdate() {
  const ref = document.getElementById('tRef').textContent;
  if (!ref) return;
  
  const btn = document.getElementById('requestUpdateBtn');
  btn.textContent = '⏳ Sending...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/tracking/request-update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ referenceNumber: ref })
    });
    const data = await res.json();
    btn.textContent = '🔔 Request Update';
    btn.disabled = false;
    
    if (res.ok && data.success) {
      showToast('Update request sent! Our team will ping you shortly.', 'success');
    } else {
      showToast(data.message || 'Failed to send request.', 'error');
    }
  } catch (err) {
    btn.textContent = '🔔 Request Update';
    btn.disabled = false;
    showToast('Connection error.', 'error');
  }
}

function renderTracking(d) {
  const result = document.getElementById('trackResult');
  result.style.display = 'block';

  setText('tRef',      d.ref);
  setText('tDevice',   `${d.device} – ${d.repairs}`);
  setText('tCustomer', `${d.customer} · ${d.phone}`);
  setText('tEst',      d.estimatedTime ? `Est. ${d.estimatedTime}` : 'Estimation Pending');
  document.getElementById('tDeviceIcon').textContent = { smartphone: '📱', laptop: '💻', tablet: '📟', smartwatch: '⌚' }[d.category] || '📱';

  // Status badge
  const badge = document.getElementById('tStatusBadge');
  const statusMap = { 'Received': 'badge-received', 'Diagnosed': 'badge-inprogress', 'Awaiting Approval': 'badge-pending', 'In Progress': 'badge-inprogress', 'Completed': 'badge-completed', 'Cancelled': 'badge-rejected' };
  badge.className = 'badge ' + (statusMap[d.status] || 'badge-pending');
  badge.textContent = d.status;

  setText('tLastUpdated', 'Last Updated: ' + formatDateTime(d.updatedAt));

  // Details
  setText('tdDevice',    d.device);
  setText('tdBrand',     d.category ? d.category.charAt(0).toUpperCase() + d.category.slice(1) : '—');
  setText('tdRepairs',   d.repairs);
  setText('tdTech',      d.technician);
  setText('tdAmount',    d.amount);
  setText('tdWarranty',  d.warranty || '—');
  setText('tdDropped',   formatDate(d.bookedAt));
  setText('tdReady',     d.estimatedTime || 'TBD');
  setText('tdService',   d.serviceType ? d.serviceType.charAt(0).toUpperCase() + d.serviceType.slice(1) : '—');

  // Quote status
  const qsEl = document.getElementById('tdQuoteStatus');
  const qMap  = { 'Approved': 'badge-approved', 'Pending': 'badge-pending', 'Rejected': 'badge-rejected', 'Not Issued': 'badge-received' };
  if (qsEl) qsEl.innerHTML = `<span class="badge ${qMap[d.quotationStatus] || ''}">${d.quotationStatus}</span>`;

  // Timeline
  const timeline = document.getElementById('trackTimeline');
  if (timeline && d.timeline?.length) {
    timeline.innerHTML = d.timeline.map((item, idx) => {
      const isLast    = idx === d.timeline.length - 1;
      const isDone    = !isLast;
      const isCurrent = isLast;
      return `<div class="timeline-item ${isDone ? 'completed' : isCurrent ? 'active' : 'pending'}">
        <div class="tl-dot-wrap"><div class="tl-dot">${isDone ? '✓' : '⚡'}</div></div>
        <div class="tl-content">
          <div class="tl-title">${item.stage}</div>
          <div class="tl-desc">${item.note}</div>
          <div class="tl-time">${item.date ? formatDateTime(item.date) : '—'}</div>
        </div>
      </div>`;
    }).join('');
  }

  // Action buttons
  const feedbackBtn = document.getElementById('feedbackBtn');
  const quotBtn     = document.getElementById('viewQuotBtn');
  if (feedbackBtn) feedbackBtn.style.display = d.status === 'Completed' ? 'flex' : 'none';
  if (quotBtn && d.quotationStatus === 'Pending') quotBtn.textContent = '⚡ View & Approve Quotation';

  result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast('Tracking info loaded!', 'success');
}

function setText(id, val) { const el = document.getElementById(id); if (el) el.textContent = val || '–'; }
function formatDate(d) { if (!d) return '—'; return new Date(d).toLocaleDateString('en-IN', { year: 'numeric', month: 'short', day: 'numeric' }); }
function formatDateTime(d) { if (!d) return '—'; return new Date(d).toLocaleString('en-IN', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }); }

document.getElementById('trackRefInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') requestTrackingOtp(); });
document.getElementById('trackPhoneInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') requestTrackingOtp(); });
document.getElementById('trackOtpInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') verifyTrackingOtp(); });

function showToast(msg, type = 'info') {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div'); el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  c.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
