/* ============================================================
   RepairVafe – Tracking Page JS (API-driven)
   Fetches real repair data from GET /api/tracking/:ref
   ============================================================ */

const API = (['localhost', '127.0.0.1', ''].includes(window.location.hostname))
  ? 'http://localhost:5000/api' : '/api';

function quickTrack(ref) {
  document.getElementById('trackRefInput').value = ref;
  trackRepair();
}

async function trackRepair() {
  const input = document.getElementById('trackRefInput');
  const ref = input?.value?.trim().toUpperCase();
  if (!ref) return showToast('Please enter a booking reference number.', 'error');

  const btn = document.getElementById('trackBtn');
  btn.textContent = '⏳ Tracking...';
  btn.disabled = true;

  try {
    const res = await fetch(`${API}/tracking/${ref}`);
    const data = await res.json();
    btn.textContent = 'Track Now';
    btn.disabled = false;

    if (!res.ok || !data.success) {
      showToast(data.message || 'No repair found for this reference.', 'error');
      return;
    }
    renderTracking(data.data);
  } catch (err) {
    btn.textContent = 'Track Now';
    btn.disabled = false;
    showToast('Cannot connect to server. Is the backend running?', 'error');
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
          <div class="tl-time">${item.timestamp ? formatDate(item.timestamp) : '—'}</div>
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

document.getElementById('trackRefInput')?.addEventListener('keydown', e => { if (e.key === 'Enter') trackRepair(); });

function showToast(msg, type = 'info') {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div'); el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  c.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
