import axios from 'axios';

const api = axios.create({ baseURL: 'http://localhost:5000/api' });

// ── v1 Compliance API ─────────────────────────────────
export const verifyCompliance = ({ user_eid, age, service_type, action }) =>
  api.post('/v1/verify', { user_eid, age, service_type, action });

export const getLaws     = ()              => api.get('/v1/laws');
export const getAuditLog = (limit = 10)   => api.get('/v1/audit-log', { params: { limit } });

// ── Registry mutations (legacy routes) ───────────────
export const addLaw    = (data)     => api.post('/laws', data);
export const updateLaw = (id, data) => api.put(`/laws/${id}`, data);

// ── x-api-key management ──────────────────────────────
let _currentApiKey = 'key_enterprise_demo'; // default: unlimited for demo
export const setApiKey = (key) => { _currentApiKey = key; };
export const getApiKey = () => _currentApiKey;

// Attach x-api-key to every request on the main api instance
api.interceptors.request.use(config => {
  if (_currentApiKey) config.headers['x-api-key'] = _currentApiKey;
  return config;
});

// ── Admin token management ────────────────────────────
export const getAdminToken   = ()    => localStorage.getItem('admin_token');
export const setAdminToken   = (tok) => localStorage.setItem('admin_token', tok);
export const clearAdminToken = ()    => localStorage.removeItem('admin_token');

// Admin axios instance — always includes x-admin-token
const adminApi = axios.create({ baseURL: 'http://localhost:5000/api/admin' });
adminApi.interceptors.request.use(config => {
  const tok = getAdminToken();
  if (tok) config.headers['x-admin-token'] = tok;
  return config;
});

export const adminLogin        = (username, password) => api.post('/admin/login', { username, password });
export const adminGetLaws      = ()           => adminApi.get('/laws');
export const adminCreateLaw    = (data)       => adminApi.post('/laws', data);
export const adminUpdateLaw    = (id, data)   => adminApi.put(`/laws/${id}`, data);
export const adminDeleteLaw    = (id)         => adminApi.delete(`/laws/${id}`);
export const adminGetAuditLog  = (params)     => adminApi.get('/audit-log', { params });
export const adminGetUsage     = ()           => adminApi.get('/usage');
