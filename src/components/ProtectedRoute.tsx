
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
    console.log('ProtectedRoute: Current state:', {
      path: location.pathname,
      loading,
      hasUser: !!user,
      userId: user?.id
    });
  }, [loading, user, location.pathname]);

  // Show loading only while auth is being determined
  if (loading) {
    console.log('ProtectedRoute: Auth loading, showing spinner');
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center flex-col">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Verifying your session...</p>
      </div>
    );
  }

  // If not loading and no user, redirect to auth
  if (!user) {
    console.log('ProtectedRoute: No user found, redirecting to auth');
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // User is authenticated, show protected content
  console.log('ProtectedRoute: User authenticated, showing content');
  return <>{children}</>;
};

export default ProtectedRoute;
