import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ChildrenManagement } from '@/components/onboarding/ChildrenManagement';
import { UserRoleSelector } from '@/components/onboarding/UserRoleSelector';
import { ParentDashboard } from '@/components/dashboards/ParentDashboard';
import { StudentDashboard } from '@/components/dashboards/StudentDashboard';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [showChildrenManagement, setShowChildrenManagement] = useState(false);
  const [hasNavigated, setHasNavigated] = useState(false);

  useEffect(() => {
    const checkUserSetup = async () => {
      // Only proceed if we have a user and auth is not loading
      if (!user || loading || hasNavigated) {
        console.log('ProtectedRoute: Skipping setup check', { hasUser: !!user, loading, hasNavigated });
        return;
      }

      console.log('ProtectedRoute: User authenticated, showing role selector');
      // Show role selector for authenticated users on initial access
      setShowRoleSelector(true);
    };

    checkUserSetup();
  }, [loading, user, hasNavigated]);

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
    console.log('ProtectedRoute: No user found, redirecting to auth. Current path:', location.pathname);
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Show children management if parent needs to set up children
  if (showChildrenManagement) {
    console.log('ProtectedRoute: Showing children management');
    return (
      <ChildrenManagement 
        onComplete={() => {
          setShowChildrenManagement(false);
          navigate('/monitoring', { replace: true });
        }} 
      />
    );
  }

  // Show role selector - always show this to let user choose their role for this session
  if (showRoleSelector) {
    console.log('ProtectedRoute: Showing role selector');
    return (
      <UserRoleSelector 
        onRoleSelected={async (role, childId) => {
          // Immediately navigate for child selection without any intermediate state
          if (role === 'child') {
            navigate('/chat', { replace: true });
            return;
          }
          
          setShowRoleSelector(false);
          setHasNavigated(true);
          
          // Stay on current route if it's not dashboard/home, otherwise navigate based on role
          if (location.pathname !== '/dashboard' && location.pathname !== '/') {
            return;
          }
          
          // Handle parent role - check if they need to add children
          try {
            const { data: childrenData } = await supabase
              .from('children')
              .select('id')
              .eq('parent_id', user.id);
              
            if (!childrenData || childrenData.length === 0) {
              setShowChildrenManagement(true);
            } else {
              navigate('/monitoring', { replace: true });
            }
          } catch (error) {
            console.error('Error checking children:', error);
          }
        }} 
      />
    );
  }

  // Check if we're on a dashboard route and should show role-specific dashboard
  if (location.pathname === '/dashboard' || location.pathname === '/') {
    // Don't auto-navigate here, let the role selector handle navigation
    return null;
  }

  // User is authenticated, show protected content
  console.log('ProtectedRoute: User authenticated, showing content');
  return <>{children}</>;
};

export default ProtectedRoute;