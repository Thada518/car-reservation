import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4050/api',
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response?.status === 401 && typeof window !== 'undefined') {
      redirectToLogin();
    }
    return Promise.reject(err);
  }
);

export function isTokenExpired(token: string) {
  try {
    // JWT uses base64url, which atob() can't decode directly
    const base64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    const payload = JSON.parse(atob(base64));
    return payload.exp * 1000 <= Date.now();
  } catch {
    return true;
  }
}

// Clear the session and send the user to login, returning to the current page afterwards
export function redirectToLogin() {
  const current = window.location.pathname + window.location.search;
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  const returnTo = current !== '/login' ? `?returnUrl=${encodeURIComponent(current)}` : '';
  window.location.href = `/login${returnTo}`;
}

export default api;
