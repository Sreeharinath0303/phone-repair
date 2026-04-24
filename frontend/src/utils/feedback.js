/* ============================================================
   RepairVafe – Feedback Page JS (API-driven)
   Submits review to POST /api/feedback
   ============================================================ */

const API = (['localhost', '127.0.0.1', ''].includes(window.location.hostname))
  ? 'http://localhost:5000/api' : '/api';

let selectedRating = 0;
const catRatings  = { quality: 0, time: 0, value: 0, staff: 0 };
const ratingLabels = ['', 'Poor 😕', 'Below Average 😐', 'Average 😊', 'Good 😄', 'Excellent 🌟'];

// ── Main Star Rating ─────────────────────────────────────────
document.querySelectorAll('#starRating .star').forEach(star => {
  star.addEventListener('mouseover', () => highlightStars(parseInt(star.dataset.val)));
  star.addEventListener('mouseout',  () => highlightStars(selectedRating));
  star.addEventListener('click', () => {
    selectedRating = parseInt(star.dataset.val);
    highlightStars(selectedRating);
    document.getElementById('ratingLabel').textContent = ratingLabels[selectedRating];
  });
});

function highlightStars(count) {
  document.querySelectorAll('#starRating .star').forEach((s, i) => s.classList.toggle('active', i < count));
}

// ── Category Mini Stars ───────────────────────────────────────
document.querySelectorAll('.mini-stars').forEach(group => {
  const cat = group.dataset.cat;
  const spans = group.querySelectorAll('span');
  spans.forEach(span => {
    span.addEventListener('mouseover', () => { const v = parseInt(span.dataset.v); spans.forEach((s, i) => s.classList.toggle('active', i < v)); });
    span.addEventListener('mouseout',  () => spans.forEach((s, i) => s.classList.toggle('active', i < catRatings[cat])));
    span.addEventListener('click',     () => { catRatings[cat] = parseInt(span.dataset.v); spans.forEach((s, i) => s.classList.toggle('active', i < catRatings[cat])); });
  });
});

// ── Recommend ────────────────────────────────────────────────
document.querySelectorAll('.recommend-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.recommend-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  });
});

// ── Submit to API ─────────────────────────────────────────────
async function submitFeedback() {
  if (selectedRating === 0) return showToast('Please select an overall rating.', 'error');

  const refEl = document.getElementById('fbRef');
  const ref   = refEl?.textContent || new URLSearchParams(window.location.search).get('ref') || '';
  if (!ref) return showToast('Missing booking reference. Please use the link from your repair completion message.', 'error');

  const recommend   = document.querySelector('.recommend-btn.selected')?.dataset?.val || 'yes';
  const comment     = document.getElementById('fbText')?.value?.trim() || '';
  const contactConsent = document.getElementById('contactConsent')?.checked || false;

  const btn = document.getElementById('submitFbBtn');
  btn.textContent = '⏳ Submitting...';
  btn.disabled = true;

  try {
    const res  = await fetch(`${API}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        referenceNumber:  ref,
        overallRating:    selectedRating,
        qualityRating:    catRatings.quality || selectedRating,
        timeRating:       catRatings.time    || selectedRating,
        valueRating:      catRatings.value   || selectedRating,
        staffRating:      catRatings.staff   || selectedRating,
        comment, wouldRecommend: recommend, contactConsent
      })
    });
    const data = await res.json();
    btn.textContent = 'Submit Review';
    btn.disabled = false;

    if (!res.ok || !data.success) {
      showToast(data.message || 'Submission failed. Please try again.', 'error');
      return;
    }

    // Show success state
    document.querySelector('.feedback-layout').style.display = 'none';
    const success = document.getElementById('feedbackSuccess');
    success.style.display = 'flex';
    document.getElementById('fsStars').textContent  = '★'.repeat(selectedRating) + '☆'.repeat(5 - selectedRating);
    document.getElementById('fsLabel').textContent  = ratingLabels[selectedRating];
    showToast('Thank you for your feedback! 🎉', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } catch (err) {
    btn.textContent = 'Submit Review';
    btn.disabled = false;
    showToast('Cannot connect to server. Please try again.', 'error');
  }
}

// ── Init ──────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  const ref = new URLSearchParams(window.location.search).get('ref');
  if (ref) {
    const el = document.getElementById('fbRef');
    if (el) el.textContent = ref;
  }
});

function showToast(msg, type = 'info') {
  const c = document.getElementById('toastContainer');
  if (!c) return;
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const el = document.createElement('div'); el.className = `toast ${type}`;
  el.innerHTML = `<span>${icons[type]}</span><span>${msg}</span>`;
  c.appendChild(el);
  setTimeout(() => el.remove(), 4000);
}
