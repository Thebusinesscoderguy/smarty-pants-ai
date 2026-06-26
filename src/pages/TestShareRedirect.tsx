import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

const TestShareRedirect = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (authLoading) return;
    let cancelled = false;
    (async () => {
      if (!token) {
        setError(t('tsr.invalidLink'));
        return;
      }
      try {
        const { data, error } = await supabase.rpc('resolve_test_share_token', { _token: token });
        if (cancelled) return;
        if (error) throw error;
        const testId = data as string | null;
        if (!testId) {
          setError(t('tsr.noLongerActive'));
          return;
        }
        if (!user) {
          navigate(`/auth?redirect=${encodeURIComponent(`/exam/${testId}`)}`, { replace: true });
        } else {
          navigate(`/exam/${testId}`, { replace: true });
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || t('tsr.failedOpen'));
      }
    })();
    return () => { cancelled = true; };
  }, [token, user, authLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <div className="text-center space-y-3">
        {error ? (
          <>
            <p className="text-destructive font-medium">{error}</p>
            <button
              onClick={() => navigate('/')}
              className="text-sm text-primary underline"
            >
              {t('tsr.backHome')}
            </button>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">{t('tsr.opening')}</p>
          </>
        )}
      </div>
    </div>
  );
};

export default TestShareRedirect;
