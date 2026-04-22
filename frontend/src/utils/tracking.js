/* ============================================
   RepairVafe – Tracking Page JS
   ============================================ */

const trackingData = {
  'RV-2026-00042': {
    ref: 'RV-2026-00042',
    device: 'iPhone 14 Pro',
    deviceIcon: '📱',
    brand: 'Apple',
    repairs: 'Screen Replacement',
    customer: 'Arjun Kumar',
    phone: '+91 98765 43210',
    status: 'In Progress',
    amount: '₹2,400',
    quoteStatus: 'Approved',
    warranty: '3 Months',
    dropped: 'Apr 21, 2026',
    estReady: 'Apr 22, 2026 — 6:00 PM',
    service: 'Drop Off',
    tech: 'Rajesh V.',
    est: 'Today, 6:00 PM',
    timeline: [
      { status: 'completed', icon: '📋', title: 'Repair Booked', desc: 'Your repair request was received and confirmed.', time: 'Apr 21, 2026 · 10:30 AM' },
      { status: 'completed', icon: '🔬', title: 'Device Received', desc: 'Device collected at our service center.', time: 'Apr 21, 2026 · 2:15 PM' },
      { status: 'completed', icon: '🩺', title: 'Diagnosis Complete', desc: 'Screen and digitizer damage confirmed. Quotation sent.', time: 'Apr 21, 2026 · 4:00 PM' },
      { status: 'completed', icon: '✅', title: 'Quote Approved', desc: 'Customer approved the repair quotation of ₹2,400.', time: 'Apr 21, 2026 · 5:30 PM' },
      { status: 'active', icon: '🔧', title: 'Repair In Progress', desc: 'Technician is replacing the display assembly.', time: 'Apr 22, 2026 · 9:00 AM' },
      { status: 'pending', icon: '🧪', title: 'Quality Check', desc: 'Device will be tested for functionality and quality.', time: 'Estimated: Today, 4:00 PM' },
      { status: 'pending', icon: '🎉', title: 'Ready for Pickup', desc: 'You\'ll be notified when your device is ready.', time: 'Estimated: Today, 6:00 PM' }
    ]
  },
  'RV-2026-00087': {
    ref: 'RV-2026-00087',
    device: 'Samsung Galaxy S23',
    deviceIcon: '📱',
    brand: 'Samsung',
    repairs: 'Battery Replacement',
    customer: 'Priya Rajan',
    phone: '+91 87654 32109',
    status: 'Completed',
    amount: '₹2,000',
    quoteStatus: 'Approved',
    warranty: '3 Months',
    dropped: 'Apr 20, 2026',
    estReady: 'Apr 21, 2026 — 12:00 PM',
    service: 'Pickup',
    tech: 'Suresh K.',
    est: 'Completed',
    timeline: [
      { status: 'completed', icon: '📋', title: 'Repair Booked', desc: 'Repair request received and confirmed.', time: 'Apr 20, 2026 · 9:00 AM' },
      { status: 'completed', icon: '🔬', title: 'Device Picked Up', desc: 'Device collected from customer\'s home.', time: 'Apr 20, 2026 · 11:00 AM' },
      { status: 'completed', icon: '🩺', title: 'Diagnosis Complete', desc: 'Battery health at 62%. Replacement confirmed.', time: 'Apr 20, 2026 · 1:30 PM' },
      { status: 'completed', icon: '✅', title: 'Quote Approved', desc: 'Customer approved the repair quotation of ₹2,000.', time: 'Apr 20, 2026 · 2:15 PM' },
      { status: 'completed', icon: '🔧', title: 'Repair Completed', desc: 'Battery replaced with original Samsung unit.', time: 'Apr 21, 2026 · 10:00 AM' },
      { status: 'completed', icon: '🧪', title: 'Quality Check Passed', desc: 'All functions tested and verified working.', time: 'Apr 21, 2026 · 11:00 AM' },
      { status: 'completed', icon: '🎉', title: 'Delivered to Customer', desc: 'Device returned to customer doorstep.', time: 'Apr 21, 2026 · 12:30 PM' }
    ]
  },
  'RV-2026-00013': {
    ref: 'RV-2026-00013',
    device: 'Dell XPS 15',
    deviceIcon: '💻',
    brand: 'Dell',
    repairs: 'SSD Upgrade (1TB)',
    customer: 'Meera Sharma',
    phone: '+91 76543 21098',
    status: 'Awaiting Approval',
    amount: '₹7,000',
    quoteStatus: 'Pending',
    warranty: '1 Year',
    dropped: 'Apr 17, 2026',
    estReady: 'Apr 22, 2026 — 4:00 PM',
    service: 'Drop Off',
    tech: 'Dinesh R.',
    est: 'Pending Approval',
    timeline: [
      { status: 'completed', icon: '📋', title: 'Repair Booked', desc: 'SSD upgrade request received.', time: 'Apr 17, 2026 · 11:00 AM' },
      { status: 'completed', icon: '🔬', title: 'Device Received', desc: 'Laptop received at service center.', time: 'Apr 17, 2026 · 2:00 PM' },
      { status: 'completed', icon: '🩺', title: 'Diagnosis Complete', desc: 'Current SSD assessed, upgrade plan prepared.', time: 'Apr 17, 2026 · 4:30 PM' },
      { status: 'active', icon: '⏳', title: 'Awaiting Quote Approval', desc: 'Quotation of ₹7,000 sent. Waiting for customer approval.', time: 'Apr 17, 2026 · 5:00 PM' },
      { status: 'pending', icon: '🔧', title: 'Repair Scheduled', desc: 'Will begin once quote is approved.', time: 'Pending' },
      { status: 'pending', icon: '🧪', title: 'Quality Check', desc: 'Post-upgrade testing.', time: 'Pending' },
      { status: 'pending', icon: '🎉', title: 'Ready for Collection', desc: 'Device ready for pickup.', time: 'Pending' }
    ]
  }
};

function quickTrack(ref) {
  document.getElementById('trackRefInput').value = ref;
  trackRepair();
}

function trackRepair() {
  const input = document.getElementById('trackRefInput');
  const ref = input?.value?.trim().toUpperCase();
  if (!ref) { showToast('Please enter a booking reference.', 'error'); return; }

  const btn = document.getElementById('trackBtn');
  btn.textContent = '⏳ Tracking...';
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = 'Track Now';
    btn.disabled = false;

    const data = trackingData[ref];
    if (!data) {
      showToast('No repair found for reference: ' + ref + '. Try one of the demo buttons.', 'error');
      return;
    }
    renderTracking(data);
  }, 800);
}

function renderTracking(d) {
  const result = document.getElementById('trackResult');
  result.style.display = 'block';

  setText('tRef', d.ref);
  setText('tDevice', `${d.device} – ${d.repairs}`);
  setText('tCustomer', `${d.customer} · ${d.phone}`);
  setText('tEst', `Est. ${d.est}`);
  document.getElementById('tDeviceIcon').textContent = d.deviceIcon;

  // Status badge
  const badge = document.getElementById('tStatusBadge');
  const statusMap = {
    'Received': 'badge-received',
    'Awaiting Approval': 'badge-pending',
    'In Progress': 'badge-inprogress',
    'Completed': 'badge-completed'
  };
  badge.className = 'badge ' + (statusMap[d.status] || 'badge-pending');
  badge.textContent = d.status;

  // Details
  setText('tdDevice', d.device);
  setText('tdBrand', d.brand);
  setText('tdRepairs', d.repairs);
  setText('tdTech', d.tech);
  setText('tdAmount', d.amount);
  const qStatusMap = {
    'Approved': '<span class="badge badge-approved">Approved</span>',
    'Pending': '<span class="badge badge-pending">Pending Approval</span>'
  };
  const qsEl = document.getElementById('tdQuoteStatus');
  if (qsEl) qsEl.innerHTML = qStatusMap[d.quoteStatus] || d.quoteStatus;
  setText('tdWarranty', d.warranty);
  setText('tdDropped', d.dropped);
  setText('tdReady', d.estReady);
  setText('tdService', d.service);

  // Timeline
  const timeline = document.getElementById('trackTimeline');
  timeline.innerHTML = d.timeline.map(item =>
    `<div class="timeline-item ${item.status}">
      <div class="tl-dot-wrap">
        <div class="tl-dot">${item.status === 'completed' ? '✓' : item.status === 'active' ? '⚡' : item.icon}</div>
      </div>
      <div class="tl-content">
        <div class="tl-title">${item.title}</div>
        <div class="tl-desc">${item.desc}</div>
        <div class="tl-time">${item.time}</div>
      </div>
    </div>`
  ).join('');

  // Actions
  const feedbackBtn = document.getElementById('feedbackBtn');
  const quotBtn = document.getElementById('viewQuotBtn');
  if (d.status === 'Completed') {
    if (feedbackBtn) feedbackBtn.style.display = 'flex';
  }
  if (d.quoteStatus === 'Pending' && quotBtn) {
    quotBtn.textContent = '⚡ View & Approve Quotation';
  }

  result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  showToast('Tracking info loaded!', 'success');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val || '–';
}

document.getElementById('trackRefInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') trackRepair();
});

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
