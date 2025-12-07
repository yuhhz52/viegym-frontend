import apiClient from "./apiClient";
import type { ApiResponse, LoginPayload, RegisterPayload, UserInfo } from "../types/auth";

export const loginAPI = async (data: LoginPayload): Promise<UserInfo> => {
  const res = await apiClient.post<ApiResponse<UserInfo>>("/api/auth/login", data);
  return res.data.result; 
};

export const registerAPI = async (data: RegisterPayload): Promise<UserInfo> => {
  const res = await apiClient.post<ApiResponse<UserInfo>>("/api/user/register", data);
  return res.data.result;
};

export const logoutAPI = async () => {
  try {
    const res = await apiClient.post("/api/auth/logout", {}, { withCredentials: true });
    console.log("Logout response:", res);
  } catch (err) {
    console.error("Logout error:", err);
  }
};

export const getMyInfoAPI = async (): Promise<UserInfo> => {
  const res = await apiClient.get<ApiResponse<UserInfo>>("/api/user/my-info");
  return res.data.result;
};

export const updateCurrentUserAPI = async (data: Partial<UserInfo>): Promise<UserInfo> => {
  const res = await apiClient.patch<ApiResponse<UserInfo>>("/api/user/my-info", data);
  return res.data.result;
};

export const updateProfileAPI = async (data: Partial<UserInfo>): Promise<UserInfo> => {
  const res = await apiClient.put<ApiResponse<UserInfo>>("/api/user/profile", data);
  return res.data.result;
};

export const updateAvatarAPI = async (formData: FormData): Promise<UserInfo> => {
  const res = await apiClient.post<ApiResponse<UserInfo>>("/api/user/avatar", formData);
  return res.data.result;
};

export const updateSettingsAPI = async (data: {
  darkMode?: boolean;
  notifications?: boolean;
  language?: string;
}): Promise<UserInfo> => {
  const res = await apiClient.patch<ApiResponse<UserInfo>>("/api/user/settings", data);
  return res.data.result;
};

export const updateDailyGoalsAPI = async (data: {
  dailyCalorieGoal?: number;
  dailyWaterGoal?: number;
  dailyWorkoutMins?: number;
}): Promise<UserInfo> => {
  const res = await apiClient.patch<ApiResponse<UserInfo>>("/api/user/daily-goals", data);
  return res.data.result;
};

export const refreshTokenAPI = async () => {
  const res = await apiClient.post("/api/auth/refresh");
  return res.data;
};

// Bắt đầu đăng nhập Google OAuth2
export const loginWithGoogleAPI = () => {
  window.location.href = "http://localhost:8080/oauth2/authorization/google";
};

export const handleGoogleCallbackAPI = async (): Promise<UserInfo | null> => {
  try {
    const res = await apiClient.get<ApiResponse<UserInfo>>("/api/user/my-info");
    return res.data.result;
  } catch {
    return null;
  }
};