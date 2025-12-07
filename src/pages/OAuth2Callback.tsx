import LoadingState from "@/components/LoadingState";
import { fetchCurrentUser } from "@/store/features/auth/authSlice";
import { useAppDispatch } from "@/store/hooks";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const user = await dispatch(fetchCurrentUser()).unwrap();

        if (!user) {
          navigate("/auth/login", { replace: true });
          return;
        }

        const normalizedRoles = Array.isArray(user.roles)
          ? user.roles
              .filter((role): role is string => typeof role === "string")
              .map((role) => role.trim().toUpperCase())
          : [];

        const hasAdminRole = normalizedRoles.some(
          (role) => role === "ROLE_ADMIN" || role === "ADMIN" || role === "ROLE_SUPER_ADMIN"
        );
        
        const hasCoachRole = normalizedRoles.some(
          (role) => role === "ROLE_COACH" || role === "COACH"
        );

        if (hasAdminRole) {
          navigate("/admin", { replace: true });
        } else if (hasCoachRole) {
          navigate("/coach", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      } catch (error) {
        console.error("Failed to complete Google OAuth callback:", error);
        navigate("/auth/login", { replace: true });
      }
    };

    void handleCallback();
  }, [dispatch, navigate]);

  return (
    <LoadingState message="Đang xử lý đăng nhập..." fullScreen />
  );
}
