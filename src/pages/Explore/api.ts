// Explore Page APIs
import apiClient from "@/api/apiClient";
import type { ApiResponse, Program } from "@/types/program";

/** Lấy tất cả chương trình công khai */
export const getAllPublicProgramsAPI = async (): Promise<Program[]> => {
  const res = await apiClient.get<ApiResponse<Program[]>>("/api/programs");
  return res.data.result;
};

/** Lấy chương trình phổ biến (có nhiều đánh giá) */
export const getPopularProgramsAPI = async (limit: number = 10): Promise<Program[]> => {
  const res = await apiClient.get<ApiResponse<Program[]>>(`/api/programs/popular?limit=${limit}`);
  return res.data.result;
};

/** Xem chi tiết chương trình */
export const getProgramDetailAPI = async (id: string): Promise<Program> => {
  const res = await apiClient.get<ApiResponse<Program>>(`/api/programs/${id}`);
  return res.data.result;
};

/** Lấy thống kê chương trình (rating, saves) */
export const getProgramStatsAPI = async (programId: string): Promise<{
  programId: string;
  averageRating: number;
  totalRatings: number;
  totalSaves: number;
  isSaved: boolean;
  userRating: number | null;
}> => {
  const res = await apiClient.get<ApiResponse<any>>(`/api/programs/${programId}/stats`);
  return res.data.result;
};

/** Lưu chương trình */
export const saveProgramAPI = async (programId: string): Promise<void> => {
  await apiClient.post(`/api/programs/${programId}/save`);
};

/** Bỏ lưu chương trình */
export const unsaveProgramAPI = async (programId: string): Promise<void> => {
  await apiClient.delete(`/api/programs/${programId}/save`);
};

/** Đánh giá chương trình */
export const rateProgramAPI = async (
  programId: string,
  data: { rating: number; review?: string }
): Promise<any> => {
  const res = await apiClient.post<ApiResponse<any>>(`/api/programs/${programId}/rate`, data);
  return res.data.result;
};
