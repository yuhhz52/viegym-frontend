import { useEffect, useState } from "react";
import { 
  getMyInfoAPI, 
  updateAvatarAPI, 
  updateSettingsAPI,
  updateProfileAPI,
  logoutAPI
} from "@/api/authApi";
import type { UserInfo } from "@/types/auth";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";
import { useTheme } from "@/contexts/ThemeContext";
import LoadingState from "@/components/LoadingState";

// Import components
import { ProfileCard } from "./ProfileCard";
import { StatsCards } from "./StatsCards";
import { GoalCard } from "./GoalCard";
import { DailyGoals } from "./DailyGoals";
import { BodyStats } from "./BodyStats";
import { PersonalInfo } from "./PersonalInfo";
import { Achievements } from "./Achievements";
import { Settings } from "./Settings";
import { ProfileEditModal } from "./ProfileEditModal";

export default function AccountPage() {
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [savingSettings, setSavingSettings] = useState(false);
  const [editingProfile, setEditingProfile] = useState(false);
  const [editingGoals, setEditingGoals] = useState(false);

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    gender: "",
    birthDate: "",
    heightCm: "",
    weightKg: "",
    bodyFatPercent: "",
    experienceLevel: "",
    goal: "",
  });

  const [goalsData, setGoalsData] = useState({
    dailyCalorieGoal: 2000,
    dailyWaterGoal: 8,
    dailyWorkoutMins: 60,
  });

  // Settings states
  const [notifications, setNotifications] = useState(true);
  const [darkMode, setDarkMode] = useState(theme === "dark");

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const data = await getMyInfoAPI();
        console.log("📥 User data from API:", data);
        setUser(data);
        setNotifications(data.notifications ?? true);
        
        // Sync dark mode từ backend
        const userDarkMode = data.darkMode ?? false;
        setDarkMode(userDarkMode);
        setTheme(userDarkMode ? "dark" : "light");
        setFormData({
          fullName: data.fullName || "",
          phone: data.phone || "",
          gender: data.gender || "",
          birthDate: data.birthDate || "",
          heightCm: data.heightCm?.toString() || "",
          weightKg: data.weightKg?.toString() || "",
          bodyFatPercent: data.bodyFatPercent?.toString() || "",
          experienceLevel: data.experienceLevel || "",
          goal: data.goal || "",
        });
        setGoalsData({
          dailyCalorieGoal: data.dailyCalorieGoal || 2000,
          dailyWaterGoal: data.dailyWaterGoal || 8,
          dailyWorkoutMins: data.dailyWorkoutMins || 60,
        });
        console.log("📊 Goals data set:", {
          dailyCalorieGoal: data.dailyCalorieGoal || 2000,
          dailyWaterGoal: data.dailyWaterGoal || 8,
          dailyWorkoutMins: data.dailyWorkoutMins || 60,
        });
      } catch (err) {
        console.error("Failed to load user info:", err);
        setError("Không thể tải thông tin người dùng");
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [setTheme]);

  const getAvatarUrl = () => {
    if (previewUrl) return previewUrl;
    if (user?.avatarUrl) {
      return user.avatarUrl.startsWith("http")
        ? user.avatarUrl
        : `${import.meta.env.VITE_API_BASE_URL || "http://localhost:8080"}/media/${user.avatarUrl}`;
    }
    return "";
  };

  const getInitials = () => {
    if (user?.fullName) return user.fullName.charAt(0).toUpperCase();
    if (user?.email) return user.email.charAt(0).toUpperCase();
    return "U";
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setError("Vui lòng chọn một tệp hình ảnh");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError("Kích thước hình ảnh không được vượt quá 5MB");
      return;
    }
    setError(null);
    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    if (!selectedFile) return;
    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      const formData = new FormData();
      formData.append("file", selectedFile);
      const updatedUser = await updateAvatarAPI(formData);
      setUser(updatedUser);
      setSelectedFile(null);
      setPreviewUrl(null);
      setSuccess("Avatar đã được cập nhật thành công!");
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error("Failed to upload avatar:", err);
      setError("Lỗi khi tải lên avatar. Vui lòng thử lại.");
    } finally {
      setUploading(false);
    }
  };

  const handleCancel = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
  };

  const handleFormChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleGoalsChange = (field: string, value: number) => {
    setGoalsData(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    try {
      setSavingSettings(true);
      setError(null);
      const profileData: Partial<UserInfo> = {
        fullName: formData.fullName,
        phone: formData.phone,
        gender: formData.gender,
        birthDate: formData.birthDate,
        heightCm: formData.heightCm ? parseFloat(formData.heightCm) : undefined,
        weightKg: formData.weightKg ? parseFloat(formData.weightKg) : undefined,
        bodyFatPercent: formData.bodyFatPercent ? parseFloat(formData.bodyFatPercent) : undefined,
        experienceLevel: formData.experienceLevel,
        goal: formData.goal,
      };
      const updated = await updateProfileAPI(profileData);
      setUser(updated);
      setEditingProfile(false);
      setSuccess("Hồ sơ đã được cập nhật thành công!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("Lỗi khi cập nhật hồ sơ");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleSaveDailyGoals = async () => {
    if (!user) return;
    try {
      setSavingSettings(true);
      setError(null);
      setSuccess(null);
      const goalsUpdateData = {
        dailyCalorieGoal: goalsData.dailyCalorieGoal,
        dailyWaterGoal: goalsData.dailyWaterGoal,
        dailyWorkoutMins: goalsData.dailyWorkoutMins,
      };
      console.log("🚀 Sending goals update:", goalsUpdateData);
      const updated = await updateProfileAPI(goalsUpdateData);
      console.log("✅ Response from API:", updated);
      setUser(updated);
      // Cập nhật goalsData từ response để đồng bộ
      setGoalsData({
        dailyCalorieGoal: updated.dailyCalorieGoal || 2000,
        dailyWaterGoal: updated.dailyWaterGoal || 8,
        dailyWorkoutMins: updated.dailyWorkoutMins || 60,
      });
      setEditingGoals(false);
      setSuccess("Mục tiêu đã được cập nhật thành công!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error("❌ Failed to update daily goals:", err);
      setError("Lỗi khi cập nhật mục tiêu");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleCancelEditGoals = () => {
    // Reset về giá trị ban đầu từ user
    if (user) {
      setGoalsData({
        dailyCalorieGoal: user.dailyCalorieGoal || 2000,
        dailyWaterGoal: user.dailyWaterGoal || 8,
        dailyWorkoutMins: user.dailyWorkoutMins || 60,
      });
    }
    setEditingGoals(false);
    setError(null);
  };

  const handleNotificationsToggle = async (newValue: boolean) => {
    setNotifications(newValue);
    try {
      setSavingSettings(true);
      const updated = await updateSettingsAPI({ notifications: newValue });
      setUser(updated);
      setSuccess("Cài đặt thông báo đã được cập nhật!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error("Failed to update notifications:", err);
      setNotifications(!newValue);
      setError("Lỗi khi cập nhật cài đặt");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleDarkModeToggle = async (newValue: boolean) => {
    setDarkMode(newValue);
    // Update theme immediately cho UX tốt hơn
    setTheme(newValue ? "dark" : "light");
    
    try {
      setSavingSettings(true);
      const updated = await updateSettingsAPI({ darkMode: newValue });
      setUser(updated);
      setSuccess("Chế độ tối đã được cập nhật!");
      setTimeout(() => setSuccess(null), 2000);
    } catch (err) {
      console.error("Failed to update dark mode:", err);
      // Rollback nếu API fail
      setDarkMode(!newValue);
      setTheme(!newValue ? "dark" : "light");
      setError("Lỗi khi cập nhật cài đặt");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logoutAPI();
      navigate("/login");
    } catch (err) {
      console.error("Logout failed:", err);
      setError("Lỗi khi đăng xuất");
    }
  };

  if (loading) return <LoadingState message="Đang tải thông tin tài khoản..." fullScreen />;
  if (!user) return <p className="text-center mt-20 text-red-500">Không tìm thấy người dùng</p>;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900 pb-8 transition-colors">
      {/* Header */}
      <div className="bg-gradient-to-r from-orange-600 to-slate-700 dark:from-orange-700 dark:to-gray-800 px-4 pt-6 pb-20">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-bold text-white">Hồ Sơ Của Tôi</h1>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 -mt-14">
        {/* Profile Card */}
        <ProfileCard
          user={user}
          previewUrl={previewUrl}
          selectedFile={selectedFile}
          uploading={uploading}
          error={error}
          success={success}
          onFileSelect={handleFileSelect}
          onUpload={handleAvatarUpload}
          onCancel={handleCancel}
        />

        {/* Stats Cards */}
        <StatsCards user={user} />

        {/* Goal Card */}
        <GoalCard user={user} />

        {/* Daily Goals */}
        <DailyGoals
          user={user}
          editing={editingGoals}
          goalsData={goalsData}
          saving={savingSettings}
          onEdit={setEditingGoals}
          onGoalsChange={handleGoalsChange}
          onSave={handleSaveDailyGoals}
          onCancel={handleCancelEditGoals}
        />

        {/* Body Stats */}
        <BodyStats user={user} />

        {/* Personal Info */}
        <PersonalInfo user={user} />

        {/* Achievements */}
        <Achievements />

        {/* Settings */}
        <Settings
          notifications={notifications}
          darkMode={darkMode}
          saving={savingSettings}
          onNotificationsToggle={handleNotificationsToggle}
          onDarkModeToggle={handleDarkModeToggle}
        />

        {/* Edit Profile Button */}
        <Button
          onClick={() => setEditingProfile(!editingProfile)}
          className="w-full mt-4 py-6 rounded-xl bg-orange-600 hover:bg-orange-700 dark:bg-orange-700 dark:hover:bg-orange-800 text-white font-semibold shadow-sm"
        >
          {editingProfile ? "Đóng chỉnh sửa" : "Chỉnh sửa hồ sơ"}
        </Button>

        {/* Profile Edit Modal */}
        <ProfileEditModal
          isOpen={editingProfile}
          saving={savingSettings}
          formData={formData}
          onFormChange={handleFormChange}
          onSave={handleSaveProfile}
          onClose={() => setEditingProfile(false)}
        />

        {/* Logout Button */}
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full mt-3 py-6 rounded-xl border-red-200 dark:border-red-900 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 font-semibold"
        >
          <LogOut size={18} className="mr-2" />
          Đăng xuất
        </Button>
      </div>
    </div>
  );
}