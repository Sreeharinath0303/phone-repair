/* ============================================
   RepairVafe – Quotation Page JS
   ============================================ */

const sampleQuotes = {
  'RV-2026-00042': {
    ref: 'RV-2026-00042', date: 'April 22, 2026', status: 'pending',
    customer: { name: 'Arjun Kumar', phone: '+91 98765 43210', email: 'arjun@email.com', service: 'Drop Off' },
    device: { name: 'iPhone 14 Pro', brand: 'Apple', issues: 'Screen Crack, Touch Not Working', bookedDate: 'Apr 21, 2026' },
    items: [
      { name: 'Screen Replacement', desc: 'OEM iPhone 14 Pro Display', cost: 2200 },
      { name: 'Labor Charges', desc: 'Repair & Installation', cost: 300 },
      { name: 'Diagnostic Fee', desc: 'Device Assessment', cost: 0 }
    ],
    discount: 100,
    estTime: 'Same Day (4–6 hours)',
    warranty: '3 Months',
    techNote: 'Device screen has significant damage. We recommend a full display assembly replacement using OEM parts for best results and longevity. The digitizer will also be inspected during the process at no extra charge.'
  },
  'RV-2026-00087': {
    ref: 'RV-2026-00087', date: 'April 21, 2026', status: 'approved',
    customer: { name: 'Priya Rajan', phone: '+91 87654 32109', email: 'priya@email.com', service: 'Pickup' },
    device: { name: 'Samsung Galaxy S23', brand: 'Samsung', issues: 'Battery Drain, Slow Charging', bookedDate: 'Apr 20, 2026' },
    items: [
      { name: 'Battery Replacement', desc: 'Original Samsung Battery', cost: 1800 },
      { name: 'Labor Charges', desc: 'Repair & Testing', cost: 200 }
    ],
    discount: 0,
    estTime: '2–3 Hours',
    warranty: '3 Months',
    techNote: 'Battery health at 62%. Replacement recommended immediately. Charging port will also be cleaned during repair at no extra cost.'
  },
  'RV-2026-00013': {
    ref: 'RV-2026-00013', date: 'April 18, 2026', status: 'completed',
    customer: { name: 'Meera Sharma', phone: '+91 76543 21098', email: 'meera@email.com', service: 'Drop Off' },
    device: { name: 'Dell XPS 15', brand: 'Dell', issues: 'SSD Upgrade Request', bookedDate: 'Apr 17, 2026' },
    items: [
      { name: 'SSD Upgrade (1TB)', desc: 'Samsung 970 EVO Plus NVMe', cost: 6500 },
      { name: 'Data Migration', desc: 'Transfer existing data to new SSD', cost: 500 },
      { name: 'Labor Charges', desc: 'Installation & Testing', cost: 300 }
    ],
    discount: 300,
    estTime: '3–4 Hours',
    warranty: '1 Year (SSD Manufacturer)',
    techNote: 'Current 512GB SSD is at 88% capacity. Upgrading to 1TB Samsung 970 EVO Plus for significant performance and storage improvement. OS migration will be done with zero data loss.'
  }
};

function loadQuotation() {
  const refInput = document.getElementById('refInput');
  const ref = refInput?.value?.trim().toUpperCase();
  if (!ref) { showToast('Please enter a booking reference.', 'error'); return; }

  const btn = document.getElementById('lookupBtn');
  btn.textContent = '⏳ Loading...';
  btn.disabled = true;

  setTimeout(() => {
    btn.textContent = 'View Quote';
    btn.disabled = false;
    const quote = sampleQuotes[ref];
    if (!quote) {
      showToast('No quotation found for this reference. Try: RV-2026-00042', 'error');
      return;
    }
    renderQuotation(quote);
  }, 1000);
}

function renderQuotation(q) {
  document.getElementById('lookupCard').style.display = 'none';
  const content = document.getElementById('quotationContent');
  content.style.display = 'block';

  // Header
  document.getElementById('qRef').textContent = q.ref;
  document.getElementById('qDate').textContent = 'Issued: ' + q.date;

  // Status
  const statusBadge = document.getElementById('qStatus');
  const statusConfigs = {
    pending: { cls: 'badge-pending', text: '⏳ Awaiting Approval' },
    approved: { cls: 'badge-approved', text: '✅ Approved' },
    rejected: { cls: 'badge-rejected', text: '✕ Declined' },
    completed: { cls: 'badge-completed', text: '🎉 Completed' }
  };
  const sc = statusConfigs[q.status] || statusConfigs.pending;
  statusBadge.className = 'badge ' + sc.cls;
  statusBadge.innerHTML = sc.text;

  // Customer
  setText('qCustName', q.customer.name);
  setText('qCustPhone', q.customer.phone);
  setText('qCustEmail', q.customer.email);
  setText('qServiceType', q.customer.service);

  // Device
  setText('qDevice', q.device.name);
  setText('qBrand', q.device.brand);
  setText('qIssues', q.device.issues);
  setText('qBookedDate', q.device.bookedDate);

  // Cost rows
  const costRows = document.getElementById('costRows');
  costRows.innerHTML = q.items.map(item =>
    `<div class="cost-row">
      <span>${item.name}</span>
      <span>${item.desc}</span>
      <span>${item.cost === 0 ? 'Free' : '₹' + item.cost.toLocaleString('en-IN')}</span>
    </div>`
  ).join('');

  const subtotal = q.items.reduce((sum, i) => sum + i.cost, 0);
  const total = subtotal - q.discount;
  setText('qSubtotal', '₹' + subtotal.toLocaleString('en-IN'));
  setText('qDiscount', q.discount > 0 ? '−₹' + q.discount.toLocaleString('en-IN') : '–');
  setText('qTotal', '₹' + total.toLocaleString('en-IN'));

  // Misc
  setText('qEstTime', q.estTime);
  setText('qTechNote', q.techNote);

  // Actions
  const actions = document.getElementById('quotActions');
  const postAction = document.getElementById('quotPostAction');
  if (q.status === 'pending') {
    actions.style.display = 'flex';
    postAction.style.display = 'none';
  } else {
    actions.style.display = 'none';
    postAction.style.display = 'block';
    const messages = {
      approved: '<span style="font-size:2rem">✅</span><br><strong>Quote Approved</strong><br><p style="color:var(--clr-text-muted);margin-top:8px">Your repair is now in progress. We\'ll notify you when it\'s ready.</p><br><a href="tracking.html" class="btn btn-primary" style="margin-top:12px">Track My Repair</a>',
      completed: '<span style="font-size:2rem">🎉</span><br><strong>Repair Completed!</strong><br><p style="color:var(--clr-text-muted);margin-top:8px">Your device has been repaired and is ready for pickup.</p><br><a href="feedback.html" class="btn btn-primary" style="margin-top:12px">Leave Feedback</a>',
      rejected: '<span style="font-size:2rem">❌</span><br><strong>Quote Declined</strong><br><p style="color:var(--clr-text-muted);margin-top:8px">You declined this quote. Contact us if you change your mind.</p>'
    };
    postAction.innerHTML = messages[q.status] || '';
  }

  content.scrollIntoView({ behavior: 'smooth' });
}

function approveQuote() {
  const btn = document.getElementById('approveBtn');
  btn.textContent = '⏳ Processing...';
  btn.disabled = true;

  setTimeout(() => {
    document.getElementById('quotActions').style.display = 'none';
    const postAction = document.getElementById('quotPostAction');
    postAction.style.display = 'block';
    postAction.innerHTML = '<span style="font-size:2rem">✅</span><br><strong>Quote Approved Successfully!</strong><br><p style="color:var(--clr-text-muted);margin-top:8px">Great! Our technician will begin the repair immediately. You\'ll receive status updates via SMS.</p><br><a href="tracking.html" class="btn btn-primary" style="margin-top:12px">Track My Repair</a>';

    const statusBadge = document.getElementById('qStatus');
    statusBadge.className = 'badge badge-approved';
    statusBadge.innerHTML = '✅ Approved';
    showToast('Quote approved! Repair starts now. 🔧', 'success');
  }, 1200);
}

function rejectQuote() {
  if (!confirm('Are you sure you want to decline this quotation? Your device will not be repaired.')) return;

  document.getElementById('quotActions').style.display = 'none';
  const postAction = document.getElementById('quotPostAction');
  postAction.style.display = 'block';
  postAction.innerHTML = '<span style="font-size:2rem">❌</span><br><strong>Quotation Declined</strong><br><p style="color:var(--clr-text-muted);margin-top:8px">We understand. Contact us if you need further assistance or reconsider.</p><br><a href="../index.html" class="btn btn-outline" style="margin-top:12px">Back to Home</a>';

  const statusBadge = document.getElementById('qStatus');
  statusBadge.className = 'badge badge-rejected';
  statusBadge.innerHTML = '✕ Declined';
  showToast('Quotation declined.', 'info');
}

function setText(id, val) {
  const el = document.getElementById(id);
  if (el) el.textContent = val || '–';
}

// --- Allow enter key on input ---
document.getElementById('refInput')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') loadQuotation();
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
