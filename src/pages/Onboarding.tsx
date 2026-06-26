
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Mail, CheckCircle } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

const Onboarding = () => {
  const { t } = useLanguage();
  const [guardianEmail, setGuardianEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userRole, setUserRole] = useState<'student' | 'parent' | 'teacher' | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { setGuardianEmail: saveGuardianEmail, onboardingStatus } = useOnboarding();
  const { user, isSchoolAdmin } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      fetchUserRole();
    }
  }, [user]);

  const fetchUserRole = async () => {
    try {
      setIsLoading(true);
      
      // If user is school admin, skip guardian email requirement
      if (isSchoolAdmin) {
        setUserRole('teacher');
        setIsLoading(false);
        navigate('/progress');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user?.id)
        .single();

      if (error) throw error;
      
      setUserRole(data.role);
      
      // Only parents need to provide guardian email
      if (data.role !== 'parent') {
        navigate('/progress');
      }
    } catch (error: any) {
      console.error('Error fetching user role:', error);
      // Default to requiring guardian email if we can't determine role
      setUserRole('parent');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!guardianEmail.trim()) return;

    try {
      setIsSubmitting(true);
      await saveGuardianEmail(guardianEmail);
      navigate('/progress');
    } catch (error) {
      console.error('Failed to save guardian email:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSkip = () => {
    navigate('/progress');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-pulse">{t('onb.loading')}</div>
      </div>
    );
  }

  // If not a parent or already completed, redirect
  if (userRole !== 'parent' || onboardingStatus?.has_provided_guardian_email) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center px-4">
          <Card className="w-full max-w-md bg-card border-border">
            <CardHeader className="text-center">
              <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
              <CardTitle className="text-foreground">{t('onb.setupComplete')}</CardTitle>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                {t('onb.setupCompleteDesc')}
              </p>
              <Button onClick={() => navigate('/progress')} className="w-full">
                {t('onb.goToDashboard')}
              </Button>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4">
        <Card className="w-full max-w-md bg-card border-border">
          <CardHeader className="text-center">
            <Mail className="h-12 w-12 text-primary mx-auto mb-4" />
            <CardTitle className="text-foreground">{t('onb.guardianTitle')}</CardTitle>
            <p className="text-muted-foreground">
              {t('onb.guardianDesc')}
            </p>
          </CardHeader>

          <CardContent>
            <form onSubmit={handleSubmitEmail} className="space-y-4">
              <div>
                <Label htmlFor="guardianEmail" className="text-foreground">
                  {t('onb.emailLabel')}
                </Label>
                <Input
                  id="guardianEmail"
                  type="email"
                  value={guardianEmail}
                  onChange={(e) => setGuardianEmail(e.target.value)}
                  placeholder="parent@example.com"
                  className="bg-background border-input"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Button 
                  type="submit" 
                  disabled={isSubmitting || !guardianEmail.trim()}
                  className="w-full"
                >
                  {isSubmitting ? t('onb.saving') : t('onb.continue')}
                </Button>

                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleSkip}
                  className="w-full text-muted-foreground hover:text-foreground"
                >
                  {t('onb.skip')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>

      <Footer />
    </div>
  );
};

export default Onboarding;
