import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export function DefaultRedirect() {
  const { currentUser, isLoading } = useAuth();

  // Show loading while auth state is being determined
  if (isLoading) {
    return <div>Loading...</div>;
  }

  // If not authenticated, redirect to login
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Handle redirect based on user role and mobile preference
  if (currentUser.role === "Продавец") {
    if (currentUser.is_mobile_user) {
      return <Navigate to="/create-sale" replace />;
    } else {
      return <Navigate to="/pos-fullscreen" replace />;
    }
  }

  // For all other roles (Администратор, etc.), redirect to dashboard
  return <Navigate to="/dashboard" replace />;
}
