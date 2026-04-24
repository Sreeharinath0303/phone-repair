/* ============================================
   RepairVafe – Auth Utility (shared across admin pages)
   Handles JWT token storage, validation, logout
   ============================================ */

const AUTH_TOKEN_KEY = 'rv_token';
const AUTH_ADMIN_KEY = 'rv_admin';

const API_BASE = (['localhost', '127.0.0.1', ''].includes(window.location.hostname))
  ? 'http://localhost:5000/api'
  : '/api';

/* ─── Token Helpers ─────────────────────────── */
function getToken() {
  return localStorage.getItem(AUTH_TOKEN_KEY) || sessionStorage.getItem(AUTH_TOKEN_KEY);
}

function getAdmin() {
  try {
    const raw = localStorage.getItem(AUTH_ADMIN_KEY) || sessionStorage.getItem(AUTH_ADMIN_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function isAuthenticated() {
  const token = getToken();
  if (!token) return false;
  try {
    // Decode JWT payload (no verification — just check expiry client-side)
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 > Date.now();
  } catch { return false; }
}

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${getToken()}`
  };
}

function logout() {
  localStorage.removeItem(AUTH_TOKEN_KEY);
  localStorage.removeItem(AUTH_ADMIN_KEY);
  sessionStorage.removeItem(AUTH_TOKEN_KEY);
  sessionStorage.removeItem(AUTH_ADMIN_KEY);
  window.location.replace('login.html');
}

/* ─── Guard – Call at top of protected pages ── */
function requireAuth() {
  if (!isAuthenticated()) {
    window.location.replace('login.html');
    return false;
  }
  return true;
}

/* ─── Populate admin name/role in UI ─────────── */
function populateAdminUI() {
  const admin = getAdmin();
  if (!admin) return;
  const nameEl = document.getElementById('adminName');
  const roleEl = document.getElementById('adminRole');
  const avatarEl = document.getElementById('adminAvatar');
  if (nameEl) nameEl.textContent = admin.name || 'Admin';
  if (roleEl) roleEl.textContent = admin.role === 'superadmin' ? 'Super Admin' : 'Admin';
  if (avatarEl) avatarEl.textContent = (admin.name || 'AD').split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
}

/* ─── Authenticated fetch wrapper ─────────────── */
async function apiFetch(endpoint, options = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      ...authHeaders(),
      ...(options.headers || {})
    }
  });

  if (res.status === 401) {
    logout();
    return null;
  }

  return res.json();
}
