import axios from 'axios';

const API_BASE_URL = 'http://localhost:3000';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if available
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Auth API
export const authAPI = {
  login: (credentials: { username: string; password: string }) =>
    api.post('/api/auth/login', credentials),
  register: (userData: { username: string; password: string; email?: string }) =>
    api.post('/api/auth/register', userData),
  getProfile: () => api.get('/api/auth/profile'),
};

// Apps API
export const appsAPI = {
  getAll: () => api.get('/api/dify-apps'),
  getById: (id: string) => api.get(`/api/dify-apps/${id}`),
  create: (appData: any) => api.post('/api/dify-apps', appData),
  update: (id: string, appData: any) => api.put(`/api/dify-apps/${id}`, appData),
  delete: (id: string) => api.delete(`/api/dify-apps/${id}`),
  getStats: () => api.get('/api/dify-apps/stats'),
  toggleStatus: (id: string, isEnabled: boolean) => api.patch(`/api/dify-apps/${id}/toggle`, { isEnabled }),
  // API Keys for specific app
  createApiKey: (appId: string, keyData: { name: string }) => api.post(`/api/dify-apps/${appId}/api-keys`, keyData),
  getApiKeys: (appId: string) => api.get(`/api/dify-apps/${appId}/api-keys`),
  deleteApiKey: (appId: string, keyId: string) => api.delete(`/api/dify-apps/${appId}/api-keys/${keyId}`),
};

// API Keys API - Using app-specific endpoints from backend
export const apiKeysAPI = {
  getAll: async () => {
    // Get all apps first, then get keys for each app
    const appsResponse = await api.get('/api/dify-apps');
    const allKeys: any[] = [];
    
    for (const app of appsResponse.data) {
      try {
        const keysResponse = await api.get(`/api/dify-apps/${app.id}/api-keys`);
        const keysWithAppInfo = keysResponse.data.map((key: any) => ({
          ...key,
          appId: app.id,
          appName: app.name
        }));
        allKeys.push(...keysWithAppInfo);
      } catch (error) {
        // Skip if app has no keys or error occurred
        console.warn(`Failed to fetch keys for app ${app.id}:`, error);
      }
    }
    
    return { data: allKeys };
  },
  create: (keyData: { name: string; appId: string }) => 
    api.post(`/api/dify-apps/${keyData.appId}/api-keys`, { name: keyData.name }),
  delete: (keyId: string) => {
    // This is a simplified approach - in reality you'd need to know the appId
    // For now, we'll need to modify the frontend to pass both appId and keyId
    throw new Error('deleteApiKey requires both appId and keyId - use appsAPI.deleteApiKey instead');
  },
};

// Logs API
export const logsAPI = {
  getAll: (params?: any) => api.get('/api/logs', { params }),
  getStats: () => api.get('/api/logs/stats'),
  delete: (id: string) => api.delete(`/api/logs/${id}`),
};

// Dashboard API - These endpoints don't exist in backend
// Use appsAPI.getStats() and logsAPI.getStats() instead
// export const dashboardAPI = {
//   getStats: () => api.get('/dashboard/stats'),
//   getRecentActivity: () => api.get('/dashboard/activity'),
//   getUsageMetrics: (timeRange?: string) => api.get('/dashboard/metrics', { 
//     params: { timeRange } 
//   }),
// };

export default api;