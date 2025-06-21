
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    console.log('ProtectedRoute: Status check:', {
      path: location.pathname,
      isLoading: loading,
      isAuthenticated: !!user,
      userId: user?.id,
      timestamp: new Date().toISOString()
    });
  }, [loading, user, location.pathname]);

  // Show loading spinner only while actually loading
  if (loading) {
    console.log('ProtectedRoute: Still loading auth state, showing spinner...');
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center flex-col">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Verifying your session...</p>
      </div>
    );
  }

  // If not loading and no user, redirect to auth
  if (!loading && !user) {
    console.log('ProtectedRoute: User not authenticated, redirecting to auth page');
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // If not loading and user exists, render protected content
  if (!loading && user) {
    console.log('ProtectedRoute: User authenticated, rendering protected content for:', user.email);
    return <>{children}</>;
  }

  // Fallback case - should not reach here
  console.warn('ProtectedRoute: Unexpected state - showing loading as fallback');
  return (
    <div className="flex min-h-screen bg-black text-white items-center justify-center flex-col">
      <Loader2 className="h-8 w-8 animate-spin mb-4" />
      <p>Loading...</p>
    </div>
  );
};

export default ProtectedRoute;
