
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { RoleSelector } from '@/components/RoleSelector';
import { ParentDashboard } from '@/components/dashboards/ParentDashboard';
import { StudentDashboard } from '@/components/dashboards/StudentDashboard';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  useEffect(() => {
    console.log('ProtectedRoute: Current state:', {
      path: location.pathname,
      loading,
      hasUser: !!user,
      userId: user?.id,
      userRole,
      roleLoading
    });

    // Show role selector if user is authenticated but no role is set
    if (user && !roleLoading && !userRole) {
      setShowRoleSelector(true);
    } else {
      setShowRoleSelector(false);
    }
  }, [loading, user, location.pathname, userRole, roleLoading]);

  // Show loading only while auth is being determined
  if (loading || roleLoading) {
    console.log('ProtectedRoute: Auth/Role loading, showing spinner');
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

  // Show role selector if needed
  if (showRoleSelector) {
    console.log('ProtectedRoute: Showing role selector');
    return (
      <RoleSelector 
        onRoleSelected={(role) => {
          setShowRoleSelector(false);
          // The role is already saved to the database by RoleSelector
        }} 
      />
    );
  }

  // Check if we're on a dashboard route and should show role-specific dashboard
  if (location.pathname === '/dashboard' || location.pathname === '/') {
    if (userRole === 'parent') {
      return <ParentDashboard />;
    } else if (userRole === 'student') {
      return <StudentDashboard />;
    }
  }

  // User is authenticated, show protected content
  console.log('ProtectedRoute: User authenticated, showing content');
  return <>{children}</>;
};

export default ProtectedRoute;
