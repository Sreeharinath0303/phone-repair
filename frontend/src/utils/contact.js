/* ══ Support & Enquiry Page Logic ══ */

const API = (['localhost', '127.0.0.1', ''].includes(window.location.hostname))
  ? 'http://localhost:5000/api' : '/api';

document.addEventListener('DOMContentLoaded', () => {
  initTabs();
  initForms();
});

function initTabs() {
  const tabs = document.querySelectorAll('.tab-btn');
  const forms = document.querySelectorAll('.enquiry-form');

  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const type = tab.dataset.type;

      // Update Tabs
      tabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');

      // Update Forms
      forms.forEach(f => f.classList.remove('active'));
      const activeForm = Array.from(forms).find(f => f.id.toLowerCase().includes(type));
      if (activeForm) activeForm.classList.add('active');
    });
  });
}

function initForms() {
  const forms = document.querySelectorAll('.enquiry-form');

  forms.forEach(form => {
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalText = submitBtn.textContent;
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting...';

      const formData = new FormData(form);
      const payload = Object.fromEntries(formData.entries());

      // Special handling for Support Form (Email/Phone)
      if (payload.type === 'support') {
        const contact = payload.contact;
        if (contact.includes('@')) {
          payload.email = contact;
        } else {
          payload.phone = contact;
        }
      }

      try {
        const response = await fetch(`${API}/enquiries`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        const data = await response.json();

        if (response.ok && data.success) {
          showSuccess(data.message);
        } else {
          showToast(data.message || 'Error submitting enquiry', 'error');
          submitBtn.disabled = false;
          submitBtn.textContent = originalText;
        }
      } catch (err) {
        showToast('Server connection error. Please try again.', 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = originalText;
      }
    });
  });
}

function showSuccess(msg) {
  document.querySelector('.enquiry-card').style.display = 'none';
  document.querySelector('.enquiry-tabs').style.display = 'none';
  const successState = document.getElementById('successState');
  successState.style.display = 'block';
  document.getElementById('successMsg').textContent = msg;
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  if (!container) return;
  
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${icons[type]}</span> <span>${message}</span>`;
  
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 4000);
}
