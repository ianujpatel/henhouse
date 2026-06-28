import axios from "axios";

// Create custom Axios instance
export const api = axios.create({
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("henhouse_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle authorization errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem("henhouse_token");
      localStorage.removeItem("henhouse_user");
      // Optional: redirect to auth page if unauthorized
      if (window.location.pathname !== "/auth" && window.location.pathname !== "/") {
        window.location.href = "/auth";
      }
    }
    const message = error.response?.data?.message || error.message || "Request failed";
    return Promise.reject(new Error(message));
  }
);

// Identity hook for TanStack Start compat: simply returns the function
export function useServerFn<T extends (...args: any[]) => any>(fn: T): T {
  return fn;
}

// Dummy helper to bypass compile checks if needed
export function createServerFn() {
  return {
    middleware: () => ({
      handler: (fn: any) => fn,
    }),
  };
}
