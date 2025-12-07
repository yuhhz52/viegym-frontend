import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import PasswordInput from "@/components/PasswordInput";
import apiClient from "@/api/apiClient";

export default function ResetPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Validate password match
    if (newPassword !== confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    // Validate password length
    if (newPassword.length < 6) {
      setError("Mật khẩu phải có ít nhất 6 ký tự");
      return;
    }

    if (!token) {
      setError("Token không hợp lệ");
      return;
    }

    setIsLoading(true);

    try {
      await apiClient.post("/api/auth/reset-password", {
        token,
        newPassword,
      });
      
      alert("Đặt lại mật khẩu thành công! Vui lòng đăng nhập.");
      navigate("/auth/login");
    } catch (err: any) {
      setError(err.response?.data?.message || "Có lỗi xảy ra. Vui lòng thử lại.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-gray-900 to-gray-700 dark:from-blue-500 dark:to-blue-700 rounded-xl flex items-center justify-center shadow-lg">
              <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
              </svg>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              VieGym
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Đặt lại mật khẩu
          </h1>
          <p className="text-gray-500 text-sm">
            Nhập mật khẩu mới của bạn
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg">
            <p className="text-sm">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <div className="mb-4">
            <PasswordInput
              id="newPassword"
              placeholder="Mật khẩu mới"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              isInvalid={false}
            />
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <PasswordInput
              id="confirmPassword"
              placeholder="Xác nhận mật khẩu"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              isInvalid={false}
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isLoading}
            className={`w-full font-semibold py-3 rounded-lg transition-colors text-white mb-4 uppercase tracking-wide ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-orange-500 hover:bg-orange-600"
            }`}
          >
            {isLoading ? "ĐANG CẬP NHẬT..." : "Đặt lại mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
}
