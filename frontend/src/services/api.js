/**
 * API Service Client
 *
 * Purpose:
 * Standardized network request client communicating with NestJS backend.
 *
 * Responsibility:
 * - Automatically injects stored access token into Bearer headers.
 * - Handles JSON serialization and status error parsing.
 * - Exposes get, post, patch, put, and delete query methods.
 *
 * Why this file exists:
 * Restricts API endpoints interactions to a single zero-dependency fetch utility.
 *
 * Used by:
 * - components/AuthModal.jsx
 * - pages/index.js
 * - pages/trips.js
 * - pages/profile.js
 * - pages/[userId]/trip/[tripId].js
 */

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

async function request(path, options = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('globe_access_token') : null;
  
  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    throw new Error(errData.message || `API error: ${response.status}`);
  }
  
  if (response.status === 204) return null;
  
  const json = await response.json();
  return json.data !== undefined ? json.data : json;
}

export const api = {
  get: (path, options) => request(path, { method: 'GET', ...options }),
  post: (path, body, options) => request(path, { method: 'POST', body: JSON.stringify(body), ...options }),
  patch: (path, body, options) => request(path, { method: 'PATCH', body: JSON.stringify(body), ...options }),
  put: (path, body, options) => request(path, { method: 'PUT', body: JSON.stringify(body), ...options }),
  delete: (path, options) => request(path, { method: 'DELETE', ...options })
};
export default api;
