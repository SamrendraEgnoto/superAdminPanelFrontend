import axios from 'axios';
import { toast } from 'react-hot-toast';

// export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://adminpanel-server-hzzo.onrender.com';
// export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001';

export const api = axios.create({
  baseURL: `${(BASE_URL || '').replace(/\/$/, '')}/api`,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json' }
})

// ===================== REQUEST INTERCEPTOR =====================
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token')
      if (token) config.headers.Authorization = `Bearer ${token}`

      // Attach the tenant passkey so the backend can unwrap the DEK and
      // decrypt PII fields (name, email, phone) before returning them.
      // Without this header every lead shows as raw encrypted ciphertext.
      const passkey = localStorage.getItem('passkey')
      if (passkey) config.headers['x-tenant-passkey'] = passkey
    }
    return config
  },
  (error) => Promise.reject(error)
)

// ===================== RESPONSE INTERCEPTOR =====================

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (typeof window !== 'undefined') {
      const status = error.response?.status;
      const message = error.response?.data?.message || 'Something went wrong';

      if (status === 401) {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        localStorage.removeItem('passkey');
        // basePath-aware: /leadManager/login (not /login which hits root 3000)
        if (!window.location.pathname.startsWith('/leadManager/login')) {
          window.location.href = '/leadManager/login';
        }
        return Promise.reject(error);
      }

      if (status === 403) {
        if (message.toLowerCase().includes('deactivated')) {
          toast.error(message);
          localStorage.removeItem('token');
          if (!window.location.pathname.startsWith('/leadManager/login')) {
            window.location.href = '/leadManager/login';
          }
        }
      }

      // if (status === 401) {
      //   localStorage.removeItem('token');
      //   localStorage.removeItem('role');

      //   const path = window.location.pathname;

      //   if (path.startsWith('/salesview')) {
      //     window.location.href = '/salesview/login';
      //   } else {
      //     window.location.href = '/login';
      //   }

      //   return Promise.reject(error);
      // }


      // if (status === 403) {
      //   if (message.toLowerCase().includes('deactivated')) {
      //     toast.error(message);
      //     localStorage.removeItem('token');
      //     window.location.href = '/salesview/login';
      //   }
      // }

      if (status === 400 || status === 409) {
        // toast.error(message); // Let component handle specific validation errors if needed, or keep global toast
      }

      if (status >= 500) {
        toast.error('Server error, please try again');
      }
    }

    return Promise.reject(error);
  }
);

// ===================== QUERY KEYS =====================
export const queryKeys = {
  // Dashboard
  dashboardStats: (role) => ['dashboard', 'stats', role],

  // Users
  users: () => ['users'],
  user: (id) => ['users', id],

  // Buildings/Leads
  buildings: (filters) => ['buildings', filters],
  building: (id) => ['buildings', id],
  userBuildings: (filters) => ['user-buildings', filters],

  // Admins
  admins: (params) => ['admins', params],
  admin: (id) => ['admins', id],

  // Reports
  reports: (params) => ['reports', params],

  // Settings
  settings: () => ['settings'],

  // Profile
  profile: (role) => ['profile', role],
}

// ===================== FILE UPLOAD HELPER =====================
export const uploadFile = async (file) => {
  const formData = new FormData()
  formData.append('avatar', file)
  const response = await api.post('/auth/upload-avatar', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
  return response.data
}

// ===================== USER API =====================
export const userApi = {
  updateProfile: (data) => api.put('/auth/profile', data),
  getReports: (params) => api.get('/reports', { params }),
}

// ===================== ADMIN API =====================
export const adminApi = {
  getUsers: () => api.get('/admin/users'),
  getUser: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post('/admin/users', data),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  getUserBuildings: (id, params) => api.get(`/admin/users/${id}/buildings`, { params }),
  assignLeads: (data) => api.post('/admin/assign-leads', data),
  updateLeadPermission: (data) => api.put('/admin/update-permission', data),
  assignUsersToBuilding: (leadId, assignments) =>
    api.post(`/buildings/${leadId}/assign`, { assignments }),

  getBuilding: (leadId) => api.get(`/buildings/${leadId}`),
  getDashboard: () => api.get('/admin/dashboard'),

  // Tenant Admin Personal Embed Keys (Admin created by Root)
  listMyEmbedKeys: () => api.get('/admin/my-embed-keys'),
  generateMyEmbedKey: (scope = 'create-lead-only') => api.post('/admin/my-embed-keys', { scope }),
  rotateMyEmbedKey: (key) => api.post(`/admin/my-embed-keys/${key}/rotate`),
  revokeMyEmbedKey: (key) => api.delete(`/admin/my-embed-keys/${key}/revoke`),
}

// ===================== SUPER ADMIN API ======================
export const superAdminApi = {
  getAdmins: (params) => api.get('/superadmin/admins', { params }),
  getAdmin: (id) => api.get(`/superadmin/admins/${id}`),
  createAdmin: (data) => api.post('/superadmin/admins', data),
  updateAdmin: (id, data) => api.put(`/superadmin/admins/${id}`, data),
  deleteAdmin: (id) => api.delete(`/superadmin/admins/${id}`),
  updatePlan: (id, plan) => api.put(`/superadmin/admins/${id}/plan`, { plan }),
  toggleStatus: (id, isActive) => api.put(`/superadmin/admins/${id}/status`, { isActive }),
  getDashboardStats: () => api.get('/superadmin/dashboard/stats'),

  // Tenant Admin embed keys management (by RSA)
  getAdminEmbedKeys: (adminId) => api.get(`/superadmin/admins/${adminId}/embed-keys`),
  generateAdminEmbedKey: (adminId, scope = 'create-lead-only') => api.post(`/superadmin/admins/${adminId}/embed-keys`, { scope }),
  rotateAdminEmbedKey: (adminId, key) => api.post(`/superadmin/admins/${adminId}/embed-keys/${key}/rotate`),
  revokeAdminEmbedKey: (adminId, key) => api.delete(`/superadmin/admins/${adminId}/embed-keys/${key}/revoke`),

  // Delegated Super Admin management (root only)
  getSuperAdmins: () => api.get('/superadmin/superadmins'),
  createSuperAdmin: (data) => api.post('/superadmin/superadmins', data),
  updateSuperAdmin: (id, data) => api.put(`/superadmin/superadmins/${id}`, data),
  deleteSuperAdmin: (id) => api.delete(`/superadmin/superadmins/${id}`),

  // DSA Personal Embed Keys (Delegated SA embeds 3D on their own website)
  listMyEmbedKeys: () => api.get('/superadmin/my-embed-keys'),
  generateMyEmbedKey: (scope = 'create-lead-only') => api.post('/superadmin/my-embed-keys', { scope }),
  rotateMyEmbedKey: (key) => api.post(`/superadmin/my-embed-keys/${key}/rotate`),
  revokeMyEmbedKey: (key) => api.delete(`/superadmin/my-embed-keys/${key}/revoke`),

  // DSA Lead Management & Sharing
  getDsaLeads: (params = {}) => api.get('/superadmin/leads', { params }),
  shareLeads: (leadIds, adminId, note = '') => api.post('/superadmin/leads/share', { leadIds, adminId, note }),
  unshareLead: (leadId, adminId) => api.delete(`/superadmin/leads/${leadId}/share/${adminId}`),

  // DSA / Branch Users
  getUsers: (params) => api.get('/superadmin/users', { params }),
  createUser: (data) => api.post('/superadmin/users', data),
  updateUser: (id, data) => api.put(`/superadmin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/superadmin/users/${id}`),
}


// ===================== SETTINGS API =====================
export const settingsApi = {
  getSettings: () => api.get('/settings'),
  updateSettings: (data) => api.put('/settings', data),
}

// ===================== AUTH API ===================== 
export const authApi = {
  verifyOtp: (data) => api.post('/auth/verify-otp', data),
  resendOtp: (email) => api.post('/auth/resend-otp', { email }),
  forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
  resetPassword: (data) => api.post('/auth/reset-password', data),
}
export default api;
