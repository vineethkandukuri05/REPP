// Locally the Vite proxy forwards /api. When hosted, VITE_API_URL is the backend's address (e.g. https://repp-api.vercel.app).
export const API_ORIGIN = (import.meta.env.VITE_API_URL || '').replace(/\/$/, '');
const BASE_URL = `${API_ORIGIN}/api`;

// The login token is also kept here and sent as a header: browsers can block cookies between the site and API domains.
const TOKEN_KEY = 'repp_token';
export function setAuthToken(token) {
  try {
    if (token) localStorage.setItem(TOKEN_KEY, token);
    else localStorage.removeItem(TOKEN_KEY);
  } catch { /* storage unavailable: cookie still works locally */ }
}
export function getAuthToken() {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
}
export function authHeaders() {
  const token = getAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}
export function apiUrl(path) {
  return `${BASE_URL}${path}`;
}
/** Full URL for a server file path such as /api/bodyvision/photo/x.jpg (adds the token for <img> tags). */
export function serverFileUrl(path) {
  if (!path || !path.startsWith('/')) return path;
  const token = getAuthToken();
  const sep = path.includes('?') ? '&' : '?';
  return `${API_ORIGIN}${path}${token && path.startsWith('/api/') ? `${sep}token=${encodeURIComponent(token)}` : ''}`;
}

export class ApiError extends Error {
  constructor(message, status = 500, data = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${BASE_URL}${endpoint}`;
  const headers = { ...authHeaders(), ...options.headers };

  // If not FormData, default to application/json
  const isFormData = options.body instanceof FormData;
  if (!isFormData && options.body && typeof options.body === 'object') {
    headers['Content-Type'] = 'application/json';
    options.body = JSON.stringify(options.body);
  }

  const config = {
    ...options,
    headers,
    credentials: 'include', // for httpOnly cookies
  };

  try {
    const res = await fetch(url, config);
    let data = null;

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      data = await res.json();
    } else {
      const text = await res.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }
    }

    if (!res.ok) {
      const detailMessage = data && Array.isArray(data.details) && data.details[0]?.message;
      const errorMessage = detailMessage || (data && data.error) || (data && data.message) || `Request failed (${res.status})`;
      throw new ApiError(errorMessage, res.status, data);
    }

    return data;
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(err.message || 'Network error occurred', 0);
  }
}

export const api = {
  get: (url, options) => request(url, { ...options, method: 'GET' }),
  post: (url, body, options) => request(url, { ...options, method: 'POST', body }),
  put: (url, body, options) => request(url, { ...options, method: 'PUT', body }),
  patch: (url, body, options) => request(url, { ...options, method: 'PATCH', body }),
  delete: (url, options) => request(url, { ...options, method: 'DELETE' }),
};

export default api;
