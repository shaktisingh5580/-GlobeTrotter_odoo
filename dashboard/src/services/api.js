/**
 * API Service for GlobeTrotter Admin Dashboard
 * Communicates with backend endpoints at /api/v1/
 */

const API_BASE = '/api/v1';

function getAuthHeader() {
  const token = localStorage.getItem('globetrotter_admin_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const data = await response.json();

    if (!response.ok) {
      if (response.status === 401 || response.status === 404) {
        // If unauthorized or not found (RolesGuard 404), notify session
        if (response.status === 401) {
          localStorage.removeItem('globetrotter_admin_token');
          localStorage.removeItem('globetrotter_admin_user');
        }
      }
      throw new Error(data.error?.message || data.message || `Request failed with status ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Error on [${options.method || 'GET'}] ${endpoint}:`, error);
    throw error;
  }
}

export const api = {
  // Auth
  login: (email, password) =>
    request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Admin Dashboard Core Metrics
  getStats: () => request('/admin/stats'),

  // User Management
  getUsers: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.search) searchParams.append('search', params.search);
    if (params.role) searchParams.append('role', params.role);
    if (params.sort_by) searchParams.append('sort_by', params.sort_by);
    if (params.sort_order) searchParams.append('sort_order', params.sort_order);
    const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/admin/users${queryStr}`);
  },

  getUserTrips: (userId) => request(`/admin/users/${userId}/trips`),

  changeUserRole: (userId, role) =>
    request(`/admin/users/${userId}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role }),
    }),

  deleteUser: (userId) =>
    request(`/admin/users/${userId}`, {
      method: 'DELETE',
    }),

  // Popular Rankings
  getPopularDestinations: (limit = 10) =>
    request(`/admin/destinations/popular?limit=${limit}`),

  getPopularActivities: (limit = 10) =>
    request(`/admin/activities/popular?limit=${limit}`),

  // Analytics Trends & Telemetry
  getAnalyticsTrends: (period = '30d') =>
    request(`/admin/analytics/trends?period=${period}`),

  // Security Audit Logs
  getAuditLogs: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.action) searchParams.append('action', params.action);
    if (params.resource_type) searchParams.append('resource_type', params.resource_type);
    if (params.actor_user_id) searchParams.append('actor_user_id', params.actor_user_id);
    const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/admin/audit-logs${queryStr}`);
  },

  // Trips Explorer
  getTrips: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.status) searchParams.append('status', params.status);
    if (params.search) searchParams.append('search', params.search);
    const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/admin/trips${queryStr}`);
  },

  // Community Moderation
  getCommunityPosts: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/admin/community/posts${queryStr}`);
  },

  deleteCommunityPost: (postId) =>
    request(`/admin/community/posts/${postId}`, {
      method: 'DELETE',
    }),

  // Destinations & Activities Catalog
  getDestinations: (params = {}) => {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.append('page', params.page);
    if (params.limit) searchParams.append('limit', params.limit);
    if (params.search) searchParams.append('search', params.search);
    const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return request(`/destinations${queryStr}`);
  },

  createDestination: (data) =>
    request('/destinations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateDestination: (id, data) =>
    request(`/destinations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),

  getDestinationActivities: (destinationId) =>
    request(`/destinations/${destinationId}/activities`),

  createActivity: (destinationId, data) =>
    request(`/destinations/${destinationId}/activities`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
};
