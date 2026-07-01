import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export type Semester = 'S1' | 'S2';

/**
 * Reads a school's currently-open semester from school_semester_state (authenticated
 * read, so teachers can use it to stamp their entries). Falls back to 'S1' when no row
 * exists yet. Only the admin "End Semester" control writes it.
 */
export const useActiveSemester = (schoolId: string | undefined) => {
  const [activeSemester, setActiveSemester] = useState<Semester>('S1');
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!schoolId) { setLoading(false); return; }
    setLoading(true);
    const { data } = await supabase
      .from('school_semester_state')
      .select('active_semester')
      .eq('school_id', schoolId)
      .maybeSingle();
    setActiveSemester((data?.active_semester as Semester) || 'S1');
    setLoading(false);
  }, [schoolId]);

  useEffect(() => { load(); }, [load]);

  return { activeSemester, setActiveSemester, loading, reload: load };
};
