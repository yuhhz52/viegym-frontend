import axios from "axios";
import { API_BASE_URL } from "./constant";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { "Content-Type": "application/json" },
  withCredentials: true,
  timeout: 10000, // 10 seconds timeout
});

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (error?: any) => void;
}> = [];

const processQueue = (error: any = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve();
    }
  });
  failedQueue = [];
};

// --- REQUEST INTERCEPTOR ---
// Xử lý FormData: xóa Content-Type header để axios tự động set với boundary
apiClient.interceptors.request.use(
  (config) => {
    // Nếu data là FormData, xóa Content-Type header để axios tự động set
    if (config.data instanceof FormData && config.headers) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// --- RESPONSE INTERCEPTOR ---
apiClient.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    // Log detailed error information for debugging
    if (error.response) {
      console.error(`[API Error] ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        status: error.response.status,
        statusText: error.response.statusText,
        data: error.response.data,
        headers: error.response.headers,
      });
    } else if (error.request) {
      console.error(`[API Error] No response received for ${error.config?.method?.toUpperCase()} ${error.config?.url}`, {
        request: error.request,
      });
    } else {
      console.error('[API Error] Request setup failed:', error.message);
    }

    // Chỉ xử lý 401 và không phải request refresh, logout, login, hoặc my-info (để tránh vòng lặp)
    if (
      error.response?.status === 401 && 
      !originalRequest._retry &&
      !originalRequest.url?.includes("/api/auth/refresh") &&
      !originalRequest.url?.includes("/api/auth/logout") &&
      !originalRequest.url?.includes("/api/auth/login") &&
      !originalRequest.url?.includes("/api/user/my-info") // Không refresh cho my-info để tránh vòng lặp
    ) {
      // Nếu đang refresh, thêm request vào queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            // Retry original request sau khi refresh thành công
            return apiClient(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Gọi API refresh - backend sẽ set cookie mới
        const refreshResponse = await apiClient.post("/api/auth/refresh");
        
        // Kiểm tra nếu refresh thành công
        if (refreshResponse.status === 200) {
          // Xử lý queue: resolve tất cả requests đang chờ
          processQueue();

          // Retry original request với cookie mới
          return apiClient(originalRequest);
        } else {
          throw new Error("Refresh token failed");
        }
      } catch (refreshError: any) {
        // Refresh thất bại - reject tất cả requests trong queue
        processQueue(refreshError);

        // Clear auth state bằng cách dispatch event
        // App.tsx sẽ lắng nghe và logout
        window.dispatchEvent(new CustomEvent("auth:refresh-failed"));

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);


export default apiClient;
