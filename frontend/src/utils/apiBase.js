const trimTrailingSlash = (value) => value.replace(/\/+$/, '');

export const getApiBaseUrl = () => {
  const rawValue = (import.meta.env.VITE_API_BASE_URL || '').trim();

  if (!rawValue) {
    return ['localhost', '127.0.0.1'].includes(window.location.hostname)
      ? 'http://localhost:5000/api'
      : '/api';
  }

  const normalized = trimTrailingSlash(rawValue);
  return normalized.endsWith('/api') ? normalized : `${normalized}/api`;
};
