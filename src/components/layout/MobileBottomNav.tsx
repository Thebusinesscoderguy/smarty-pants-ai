import { useNavigate, useLocation } from 'react-router-dom';
import { BookOpen, MessageSquare, Trophy, User, Home } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';

/**
 * Fixed bottom navigation bar shown only on mobile for logged-in
 * student users (i.e. anyone who is not a school admin or teacher).
 */
export const MobileBottomNav = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isSchoolAdmin, isTeacher } = useAuth();

  // Enrolled (school) students get Home → their dashboard as the first slot;
  // self-study users keep Study Tools there. Scoped to own rows by RLS.
  const [isSchoolStudent, setIsSchoolStudent] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (!user || isSchoolAdmin || isTeacher) { setIsSchoolStudent(false); return; }
    (async () => {
      const { data } = await supabase
        .from('school_student_relationships')
        .select('school_id')
        .eq('student_id', user.id)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle();
      if (!cancelled) setIsSchoolStudent(!!data);
    })();
    return () => { cancelled = true; };
  }, [user, isSchoolAdmin, isTeacher]);

  if (!user || isSchoolAdmin || isTeacher) return null;

  const firstItem = isSchoolStudent
    ? { label: 'Home', icon: Home, path: '/dashboard', match: ['/dashboard'] }
    : { label: 'Study', icon: BookOpen, path: '/quiz-generator', match: ['/quiz-generator', '/modules'] };

  const items = [
    firstItem,
    { label: 'Chat', icon: MessageSquare, path: '/chat', match: ['/chat'] },
    { label: 'Quests', icon: Trophy, path: '/quests', match: ['/quests'] },
    { label: 'Profile', icon: User, path: '/settings', match: ['/settings'] },
  ];

  const isActive = (matches: string[]) => matches.some((m) => location.pathname.startsWith(m));

  return (
    <nav
      aria-label="Primary mobile navigation"
      className="md:hidden fixed bottom-0 inset-x-0 z-40 bg-background/95 backdrop-blur-md border-t border-border shadow-[0_-4px_20px_-4px_hsl(var(--foreground)/0.08)]"
    >
      <div className="flex items-stretch justify-around h-16 max-w-md mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.match);
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={cn(
                'flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors',
                active ? 'text-primary' : 'text-muted-foreground hover:text-foreground',
              )}
              aria-current={active ? 'page' : undefined}
            >
              <Icon className={cn('h-5 w-5', active && 'fill-primary/10')} />
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
