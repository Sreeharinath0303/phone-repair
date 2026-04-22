/* ============================================
   RepairVafe – Feedback Page JS
   ============================================ */

let selectedRating = 0;
const catRatings = { quality: 0, time: 0, value: 0, staff: 0 };

const ratingLabels = ['', 'Poor 😕', 'Below Average 😐', 'Average 😊', 'Good 😄', 'Excellent 🌟'];

// --- Main Star Rating ---
const stars = document.querySelectorAll('#starRating .star');
stars.forEach(star => {
  star.addEventListener('mouseover', () => highlightStars(parseInt(star.dataset.val)));
  star.addEventListener('mouseout', () => highlightStars(selectedRating));
  star.addEventListener('click', () => {
    selectedRating = parseInt(star.dataset.val);
    highlightStars(selectedRating);
    document.getElementById('ratingLabel').textContent = ratingLabels[selectedRating];
  });
});

function highlightStars(count) {
  stars.forEach((star, i) => {
    star.classList.toggle('active', i < count);
  });
}

// --- Category Mini Stars ---
document.querySelectorAll('.mini-stars').forEach(miniGroup => {
  const cat = miniGroup.dataset.cat;
  const spans = miniGroup.querySelectorAll('span');
  spans.forEach(span => {
    span.addEventListener('mouseover', () => {
      const v = parseInt(span.dataset.v);
      spans.forEach((s, i) => s.classList.toggle('active', i < v));
    });
    span.addEventListener('mouseout', () => {
      spans.forEach((s, i) => s.classList.toggle('active', i < catRatings[cat]));
    });
    span.addEventListener('click', () => {
      catRatings[cat] = parseInt(span.dataset.v);
      spans.forEach((s, i) => s.classList.toggle('active', i < catRatings[cat]));
    });
  });
});

// --- Recommend buttons ---
document.querySelectorAll('.recommend-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.recommend-btn').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
  });
});

// --- Submit Feedback ---
function submitFeedback() {
  if (selectedRating === 0) {
    showToast('Please select an overall rating.', 'error');
    return;
  }
  const text = document.getElementById('fbText')?.value?.trim();
  const recommend = document.querySelector('input[name="recommend"]:checked');

  const btn = document.getElementById('submitFbBtn');
  btn.textContent = '⏳ Submitting...';
  btn.disabled = true;

  setTimeout(() => {
    // Hide form, show success
    document.querySelector('.feedback-layout').style.display = 'none';
    const success = document.getElementById('feedbackSuccess');
    success.style.display = 'flex';

    // Render stars
    document.getElementById('fsStars').textContent = '★'.repeat(selectedRating) + '☆'.repeat(5 - selectedRating);
    document.getElementById('fsLabel').textContent = ratingLabels[selectedRating];

    showToast('Thank you for your valuable feedback! 🎉', 'success');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, 1500);
}

// Pre-fill ref from URL
const ref = new URLSearchParams(window.location.search).get('ref');
if (ref) {
  const refEl = document.getElementById('fbRef');
  if (refEl) refEl.textContent = ref;
}

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
