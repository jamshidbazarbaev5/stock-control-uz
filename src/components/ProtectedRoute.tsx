import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../core/context/AuthContext.tsx'

interface ProtectedRouteProps {
    children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
    const { currentUser, isLoading, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const location = useLocation();

    useEffect(() => {
        // Only redirect if we're done loading and user is not authenticated
        if (!isLoading && !isAuthenticated) {
            console.log('[ProtectedRoute] User not authenticated, redirecting to login');
            navigate('/login', {
                replace: true,
                state: { from: location }
            });
        }
    }, [isLoading, isAuthenticated, navigate, location]);

    // Show loading while checking authentication
    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-lg">Loading...</div>
            </div>
        );
    }

    // Show content only if authenticated
    if (isAuthenticated && currentUser) {
        return <>{children}</>;
    }

    // Return null while redirecting
    return null;
}
