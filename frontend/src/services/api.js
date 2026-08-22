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
  
  const isFormData = options.body && typeof FormData !== 'undefined' && options.body instanceof FormData;

  const headers = {
    ...(options.headers || {})
  };

  if (!isFormData && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  // Normalise path and construct full target URL
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const fullUrl = cleanPath.startsWith('http') ? cleanPath : `${BASE_URL}${cleanPath}`;
  
  try {
    let response = await fetch(fullUrl, {
      ...options,
      headers
    });
    
    // Automatic Token Refresh Logic
    if (response.status === 401 && token) {
      const refreshToken = localStorage.getItem('globe_refresh_token');
      if (refreshToken) {
        try {
          const refreshRes = await fetch(`${BASE_URL}/auth/refresh`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refresh_token: refreshToken })
          });
          if (refreshRes.ok) {
            const refreshData = await refreshRes.json();
            const newAccessToken = refreshData.data?.access_token || refreshData.access_token;
            const newRefreshToken = refreshData.data?.refresh_token || refreshData.refresh_token;
            if (newAccessToken) {
              localStorage.setItem('globe_access_token', newAccessToken);
              headers['Authorization'] = `Bearer ${newAccessToken}`;
              if (newRefreshToken) {
                localStorage.setItem('globe_refresh_token', newRefreshToken);
              }
              // Retry original request
              response = await fetch(fullUrl, { ...options, headers });
            }
          } else {
            // Refresh failed, clear tokens and force login
            localStorage.removeItem('globe_access_token');
            localStorage.removeItem('globe_refresh_token');
            localStorage.removeItem('globe_user');
            if (typeof window !== 'undefined') window.location.href = '/';
          }
        } catch (e) {
          // Ignore refresh error and let the 401 fall through
        }
      }
    }

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      // Backend returns { success: false, error: { code, message, details? } }
      const apiError = errData.error || errData;
      const details = apiError.details;
      const msg = Array.isArray(details) ? details.join('. ') : (apiError.message || errData.message || `API error: ${response.status}`);
      throw new Error(msg);
    }
    
    if (response.status === 204) return null;
    
    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  } catch (err) {
    console.error(`[API Network Request Failed] ${options.method || 'GET'} ${fullUrl}:`, err.message);
    throw err;
  }
}

export const api = {
  get: (path, options) => request(path, { method: 'GET', ...options }),
  post: (path, body, options) => request(path, { method: 'POST', body: (body instanceof FormData) ? body : JSON.stringify(body), ...options }),
  patch: (path, body, options) => request(path, { method: 'PATCH', body: (body instanceof FormData) ? body : JSON.stringify(body), ...options }),
  put: (path, body, options) => request(path, { method: 'PUT', body: (body instanceof FormData) ? body : JSON.stringify(body), ...options }),
  delete: (path, options) => request(path, { method: 'DELETE', ...options })
};

export default api;
