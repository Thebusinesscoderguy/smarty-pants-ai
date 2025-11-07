import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export type UserRole = 'student' | 'parent' | 'teacher';

export const useUserRole = () => {
  const { user } = useAuth();
  const [userRole, setUserRole] = useState<UserRole>('student');
  const [isSchoolAdmin, setIsSchoolAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        // Query user_roles table using secure function
        const { data: userRoles, error: roleError } = await supabase
          .from('user_roles')
          .select('role')
          .eq('user_id', user.id)
          .limit(1)
          .single();

        if (roleError && roleError.code !== 'PGRST116') {
          console.error('Error fetching user role:', roleError);
        }

        if (userRoles?.role) {
          setUserRole(userRoles.role as UserRole);
        }

        // Check if user is a school admin
        const { data: schoolAdmin } = await supabase
          .from('school_accounts')
          .select('id')
          .eq('admin_user_id', user.id)
          .single();

        setIsSchoolAdmin(!!schoolAdmin);
      } catch (error) {
        console.error('Error fetching user role:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserRole();
  }, [user]);

  return { userRole, isSchoolAdmin, loading };
};