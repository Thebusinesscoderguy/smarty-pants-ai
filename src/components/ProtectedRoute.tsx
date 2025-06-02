
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading, isDemoMode } = useAuth();
  const location = useLocation();

  useEffect(() => {
    // This helps debug protected route issues
    console.log('Protected Route Status:', {
      path: location.pathname,
      isLoading: loading,
      isAuthenticated: !!user,
      isDemoMode,
    });
  }, [loading, user, location.pathname, isDemoMode]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center flex-col">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Verifying your session...</p>
      </div>
    );
  }

  // Allow access in demo mode or if user is authenticated
  if (!user && !isDemoMode) {
    // Special handling for admin route - redirect to home instead of auth
    // This allows the demo mode button on the home page to work
    if (location.pathname === '/admin') {
      console.log('Admin route accessed without auth, redirecting to home for demo access');
      return <Navigate to="/" replace />;
    }
    
    console.log('User not authenticated and not in demo mode, redirecting to auth page');
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  console.log('Rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;
