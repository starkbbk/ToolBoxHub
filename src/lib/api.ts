import axios from 'axios';
import { API_URL } from '@/constants';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
api.interceptors.request.use(
  (config: any) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: any) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response: any) => response.data,
  (error: any) => {
    const errorData = error.response?.data;
    let message = errorData?.detail || errorData?.message || (error as Error).message || 'An error occurred';
    
    // Handle FastAPI validation error arrays
    if (Array.isArray(message)) {
      message = message[0]?.msg || JSON.stringify(message);
    }
    
    console.error('API Error:', message);
    
    // Attach the cleaned up message to the error object so catch blocks can use it
    (error as Error).message = message;
    return Promise.reject(error);
  }
);

// API methods categorized by service
export const clipmaster = {
  upload: (file: File) => {
    const formData = new FormData();
    formData.append('video', file);
    return api.post('/api/clipmaster/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  processUrl: (url: string) => api.post('/api/clipmaster/process-url', { url }),
  startProcessing: (projectId: number, rubricId?: number) => 
    api.post(`/api/clipmaster/process/${projectId}`, { rubric_id: rubricId }),
  getProject: (projectId: number) => api.get(`/api/clipmaster/project/${projectId}`),
  getProjects: (params?: any) => api.get('/api/clipmaster/projects', { params }),
  deleteProject: (projectId: number) => api.delete(`/api/clipmaster/project/${projectId}`),
  getClips: (projectId: number, params?: any) => api.get(`/api/clipmaster/clips/${projectId}`, { params }),
  updateClip: (clipId: number, data: any) => api.put(`/api/clipmaster/clip/${clipId}`, data),
  deleteClip: (clipId: number) => api.delete(`/api/clipmaster/clip/${clipId}`),
  approveAll: (projectId: number) => api.post(`/api/clipmaster/clips/${projectId}/approve-all`),
  bulkAction: (projectId: number, clipIds: number[], action: string) => 
    api.post(`/api/clipmaster/clips/${projectId}/bulk-action`, { clip_ids: clipIds, action }),
  renderClips: (projectId: number) => api.post(`/api/clipmaster/clips/${projectId}/render-clips`),
  exportClips: (projectId: number, format: string, onlyApproved: boolean) => 
    api.post(`/api/clipmaster/export/${projectId}`, { format, only_approved: onlyApproved }, { responseType: 'blob' }),
  getRubrics: () => api.get('/api/clipmaster/rubrics'),
  createRubric: (data: any) => api.post('/api/clipmaster/rubric', data),
  updateRubric: (rubricId: number, data: any) => api.put(`/api/clipmaster/rubric/${rubricId}`, data),
  deleteRubric: (rubricId: number) => api.delete(`/api/clipmaster/rubric/${rubricId}`),
};

export const auth = {
  signup: (data: any) => api.post('/api/auth/signup', data),
  login: (data: any) => api.post('/api/auth/login', data),
  google: (token: string) => api.post('/api/auth/google', { token }),
  me: () => api.get('/api/auth/me'),
  forgotPassword: (email: string) => api.post('/api/auth/forgot-password', { email }),
  resetPassword: (data: any) => api.post('/api/auth/reset-password', data),
};

export const tools = {
  getAll: () => api.get('/api/tools'),
  getHealth: () => api.get('/api/health'),
};

export const subscription = {
  createCheckoutSession: (plan: string, cycle: string) => 
    api.post('/api/subscription/create-checkout-session', { plan, cycle }),
  verifySession: (sessionId: string) => 
    api.get(`/api/subscription/verify-session/${sessionId}`),
  getStatus: () => api.get('/api/subscription/status'),
};

export default api;
