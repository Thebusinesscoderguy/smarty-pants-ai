
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
      timestamp: new Date().toISOString()
    });
  }, [loading, user, location.pathname]);

  // Show loading only while actually loading
  if (loading) {
    console.log('ProtectedRoute: Still loading auth state...');
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center flex-col">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Verifying your session...</p>
      </div>
    );
  }

  // If not loading and no user, redirect to auth
  if (!user) {
    console.log('ProtectedRoute: User not authenticated, redirecting to auth page');
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  console.log('ProtectedRoute: User authenticated, rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;
