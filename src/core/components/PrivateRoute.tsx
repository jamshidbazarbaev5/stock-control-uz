import { Navigate, useLocation } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { data: currentUser, isLoading } = useCurrentUser();
  const location = useLocation();

  if (isLoading) {
    // You can replace this with a loading spinner component
    return <div>Loading...</div>;
  }

  if (!currentUser) {
    // Redirect them to the /login page, but save the current location they were
    // trying to go to when they were redirected.
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if route requires specific roles and if user has required role
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    // If user's role is not in the allowed roles, redirect to a default page
    // For sellers, redirect to /sales page
    if (currentUser.role === "Продавец") {
      return <Navigate to="/sales" replace />;
    }
    // For other unauthorized roles, you can redirect to a different page
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
}
