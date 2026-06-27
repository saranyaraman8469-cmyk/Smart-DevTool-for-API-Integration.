import axios from "axios";

// All requests go through the Next.js proxy at /backend/*
// The proxy is configured in next.config.js and forwards to FastAPI on port 8000.
// This eliminates all CORS issues — the browser never talks directly to FastAPI.
const API_BASE_URL = "/backend";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 120000, // 120s for AI generation endpoints
});

// Request interceptor for logging
apiClient.interceptors.request.use((config) => {
  if (process.env.NODE_ENV === "development") {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
  }
  return config;
});

// Response interceptor for error normalization
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.code === "ECONNABORTED") {
      console.error("[API Error] Request timed out — backend may still be processing");
      return Promise.reject(new Error("Request timed out. The AI pipeline may still be running."));
    }
    const message = error.response?.data?.detail || error.message || "An unknown error occurred";
    console.error(`[API Error] ${message}`);
    return Promise.reject(new Error(message));
  }
);

// API Document endpoints
export const apiDocsAPI = {
  ingest: (url: string) => apiClient.post("/api-docs/ingest", { url }),
  getAll: (skip = 0, limit = 100) => apiClient.get(`/api-docs/?skip=${skip}&limit=${limit}`),
  getById: (id: number) => apiClient.get(`/api-docs/${id}`),
  getEndpoints: (docId: number) => apiClient.get(`/api-docs/${docId}/endpoints`),
  checkEndpointHealth: (docId: number, endpointId: number) =>
    apiClient.post(`/api-docs/${docId}/endpoints/${endpointId}/check-health`),
};

// Wrapper generation endpoints
export const wrappersAPI = {
  generate: (docId: number, language: string) =>
    apiClient.post(`/wrappers/${docId}/generate`, { language }),
  getTasks: (docId: number) => apiClient.get(`/wrappers/${docId}/tasks`),
  getDownloadUrl: (taskId: number) => `/backend/wrappers/download/${taskId}`,
  getOpenAPISpec: (docId: number) => apiClient.get(`/wrappers/openapi/${docId}`),
  getPostmanCollection: (docId: number) => apiClient.get(`/wrappers/postman/${docId}`),
};

// Chat endpoints
export const chatAPI = {
  send: (docId: number, message: string) =>
    apiClient.post(`/chat/${docId}`, { message }),
  getHistory: (docId: number) => apiClient.get(`/chat/${docId}/history`),
  clearHistory: (docId: number) => apiClient.delete(`/chat/${docId}/history`),
};

// Analytics endpoints
export const analyticsAPI = {
  getDashboard: (docId: number) => apiClient.get(`/analytics/dashboard/${docId}`),
  getOverview: () => apiClient.get("/analytics/overview"),
  getWrappersSummary: () => apiClient.get("/analytics/wrappers/summary"),
};

export default apiClient;
