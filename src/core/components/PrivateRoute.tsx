import { Navigate, useLocation } from 'react-router-dom';
import { useRef } from 'react';
import { useAuth } from '../context/AuthContext';

interface PrivateRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export function PrivateRoute({ children, allowedRoles }: PrivateRouteProps) {
  const { currentUser, isLoading, isAuthenticated } = useAuth();
  const location = useLocation();
  const componentId = useRef(Math.random().toString(36).substring(7));
  
  console.log(`[PrivateRoute-${componentId.current}] Path: ${location.pathname}, Roles: ${JSON.stringify(allowedRoles)}, Loading: ${isLoading}, User: ${currentUser ? currentUser.name : 'null'}, Authenticated: ${isAuthenticated}`);
  
  // Show loading screen while auth state is being determined
  if (isLoading) {
    console.log(`[PrivateRoute-${componentId.current}] Showing loading screen, auth is loading`);
    return <div>Loading...</div>;
  }

  // Not authenticated, redirect to login
  if (!isAuthenticated || !currentUser) {
    console.log(`[PrivateRoute-${componentId.current}] Not authenticated, redirecting to login`);
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check if route requires specific roles and if user has required role
  if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
    console.log(`[PrivateRoute-${componentId.current}] User role '${currentUser.role}' not in allowed roles ${JSON.stringify(allowedRoles)}`);
    
    // If user's role is not in the allowed roles, redirect to a default page
    // For sellers, redirect to /sales page
    if (currentUser.role === "Продавец") {
      return <Navigate to="/sales" replace />;
    }
    
    // For other unauthorized roles, redirect to unauthorized page
    return <Navigate to="/unauthorized" replace />;
  }

  console.log(`[PrivateRoute-${componentId.current}] Rendering children for user ${currentUser.name} with role ${currentUser.role}`);
  return <>{children}</>;
}
