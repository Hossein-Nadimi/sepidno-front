import axios, { AxiosError, type AxiosInstance, type InternalAxiosRequestConfig } from "axios";
import { toast } from "react-hot-toast";
import { useAuthStore } from "@/store/auth";
import { ApiError } from "@/types";

/**
 * API base URL resolution.
 *
 * Priority:
 *  1. NEXT_PUBLIC_API_URL env var (must be set for mobile/PWA testing)
 *  2. Same-origin fallback: "/api" (works when frontend & backend share a domain
 *     via a reverse proxy in production)
 *  3. http://localhost:5000/api (local desktop dev only)
 *
 * ⚠️ For testing on a phone, you MUST set NEXT_PUBLIC_API_URL to your
 * computer's LAN IP, e.g. http://192.168.1.100:5000/api — otherwise
 * "localhost" resolves to the phone itself and you get Network Error.
 */
function resolveBaseUrl(): string {
  const envUrl = process.env.NEXT_PUBLIC_API_URL;
  if (envUrl) return envUrl;

  // In production build with no env var, try same-origin (reverse proxy setup)
  if (process.env.NODE_ENV === "production") {
    return "/api";
  }

  return "http://localhost:5000/api";
}

const BASE_URL = resolveBaseUrl();

let isRefreshing = false;
let refreshSubscribers: Array<(token: string) => void> = [];

function onTokenRefreshed(token: string) {
  refreshSubscribers.forEach((cb) => cb(token));
  refreshSubscribers = [];
}

function addRefreshSubscriber(cb: (token: string) => void) {
  refreshSubscribers.push(cb);
}

export const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30_000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  // Active business id header (multi-tenant context).
  const businessId = useAuthStore.getState().activeBusinessId;
  if (businessId) {
    config.headers["x-business-id"] = businessId;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
    const status = error.response?.status;
    const message = error.response?.data?.message || error.message || "خطای شبکه";

    // 401 → try refresh once
    if (status === 401 && !originalRequest._retry) {
      const refreshToken = useAuthStore.getState().refreshToken;
      if (refreshToken && !isRefreshing) {
        originalRequest._retry = true;
        try {
          isRefreshing = true;
          const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          const newAccess = data.data.accessToken as string;
          const newRefresh = data.data.refreshToken as string | undefined;
          useAuthStore.getState().setTokens(newAccess, newRefresh ?? refreshToken);
          onTokenRefreshed(newAccess);
          isRefreshing = false;
          originalRequest.headers = originalRequest.headers || {};
          originalRequest.headers.Authorization = `Bearer ${newAccess}`;
          return api(originalRequest);
        } catch (refreshErr) {
          isRefreshing = false;
          refreshSubscribers = [];
          useAuthStore.getState().logout();
          if (typeof window !== "undefined") {
            // Only redirect if we're not already on the login page
            if (!window.location.pathname.startsWith("/login")) {
              toast.error("نشست شما منقضی شد. لطفاً دوباره وارد شوید.");
              window.location.href = "/login";
            }
          }
          return Promise.reject(refreshErr);
        }
      }

      // Refresh in-flight → queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          addRefreshSubscriber((newToken: string) => {
            originalRequest.headers = originalRequest.headers || {};
            originalRequest.headers.Authorization = `Bearer ${newToken}`;
            resolve(api(originalRequest));
          });
        });
      }

      // No refresh token available → logout silently without toast
      if (!refreshToken && typeof window !== "undefined") {
        if (!window.location.pathname.startsWith("/login")) {
          useAuthStore.getState().logout();
          window.location.href = "/login";
        }
      }
    }

    // Validation errors (422) → keep raw payload for forms
    if (status === 422) {
      return Promise.reject(error);
    }

    // Show toast for any other failure (skip 401 and 403 which are handled)
    // 403 for no-business users is expected — don't spam toasts
    if (status !== 401 && status !== 403 && typeof window !== "undefined") {
      // Network error (no response) → user-friendly message
      if (!error.response) {
        toast.error("خطای شبکه — اتصال به سرور برقرار نشد. لطفاً اتصال اینترنت را بررسی کنید.");
      } else {
        toast.error(message);
      }
    }
    return Promise.reject(error);
  },
);

export default api;
