import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:8000",
  headers: { "Content-Type": "application/json" },
});

// Request interceptor: inject JWT from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("taskflow_token");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Response interceptor: 401 → clear token and redirect to /login
// Skip auth endpoints — a 401 on /auth/login means wrong credentials, not
// an expired session. Redirecting there would swallow the error message.
api.interceptors.response.use(
  (res) => res,
  (error) => {
    const isAuthEndpoint = (error.config?.url as string | undefined)?.startsWith("/auth/");
    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("taskflow_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  }
);

export default api;
