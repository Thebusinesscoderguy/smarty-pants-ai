
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
    // This helps debug protected route issues
    console.log('Protected Route Status:', {
      path: location.pathname,
      isLoading: loading,
      isAuthenticated: !!user,
    });
  }, [loading, user, location.pathname]);

  if (loading) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center flex-col">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Verifying your session...</p>
      </div>
    );
  }

  if (!user) {
    console.log('User not authenticated, redirecting to auth page');
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  console.log('Rendering protected content');
  return <>{children}</>;
};

export default ProtectedRoute;
