import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserRole } from '@/hooks/useUserRole';
import { Loader2 } from 'lucide-react';

// Roles a route can require. A user's effective roles are derived from
// server-backed signals (school_accounts / is_school_teacher RPC / user_roles),
// not from any client-set flag.
export type AppRole = 'student' | 'parent' | 'teacher' | 'admin';

interface ProtectedRouteProps {
  children: React.ReactNode;
  // SECURITY (broken access control): when set, the route is gated so only users
  // holding one of these roles may enter. Authentication alone is NOT enough —
  // this stops e.g. a logged-in student from reaching admin/staff pages.
  // NOTE: this is defense-in-depth for the UI; the authoritative boundary is
  // still RLS + edge-function role checks on the data itself.
  allowedRoles?: AppRole[];
}

const ProtectedRoute = ({ children, allowedRoles }: ProtectedRouteProps) => {
  const { user, loading, isSchoolAdmin, isTeacher } = useAuth();
  const { userRole, loading: roleLoading } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();

  // Wait for auth AND role to resolve before any routing decision, so we never
  // briefly misroute (e.g. send an admin to the student dashboard).
  if (loading || roleLoading) {
    return (
      <div className="flex min-h-screen bg-black text-white items-center justify-center flex-col">
        <Loader2 className="h-8 w-8 animate-spin mb-4" />
        <p>Verifying your session...</p>
      </div>
    );
  }

  // Not authenticated → go to login.
  if (!user) {
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // SECURITY (broken access control / privilege escalation): enforce the route's
  // role requirement. The effective role set is built from server-backed signals
  // only (user_roles row, school_accounts admin check, is_school_teacher RPC) —
  // all of which are themselves protected by RLS — so a student cannot fake their
  // way into admin/staff pages by editing client state.
  if (allowedRoles && allowedRoles.length > 0) {
    const effectiveRoles = new Set<AppRole>();
    if (userRole) effectiveRoles.add(userRole);
    if (isSchoolAdmin) effectiveRoles.add('admin');
    if (isTeacher) effectiveRoles.add('teacher');

    const permitted = allowedRoles.some((role) => effectiveRoles.has(role));
    if (!permitted) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full rounded-lg border border-border bg-card p-6 text-center space-y-3">
            <h1 className="text-lg font-semibold text-foreground">Access denied</h1>
            <p className="text-sm text-muted-foreground">
              You don't have permission to view this page.
            </p>
            <button
              onClick={() => navigate('/dashboard', { replace: true })}
              className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90"
            >
              Back to dashboard
            </button>
          </div>
        </div>
      );
    }
  }

  // Home / dashboard landing: route to the right place by DB role. Roles come
  // exclusively from admin provisioning + invites now (no self-select chooser).
  if (location.pathname === '/dashboard' || location.pathname === '/') {
    if (isSchoolAdmin || isTeacher) return <Navigate to="/school-admin" replace />;
    if (userRole === 'parent') return <Navigate to="/family-hub" replace />;
    // Students fall through to the dashboard content.
  }

  // User is authenticated and permitted — render the protected content.
  return <>{children}</>;
};

export default ProtectedRoute;
