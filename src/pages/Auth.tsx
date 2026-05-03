
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { School, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { UserRoleSelector } from '@/components/onboarding/UserRoleSelector';
import { AddChildrenFirst } from '@/components/onboarding/AddChildrenFirst';
import { toast } from 'sonner';
import { useLanguage } from '@/contexts/LanguageContext';

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState(false);
  
  const isSignup = searchParams.get('signup') === 'true';
  const [activeTab, setActiveTab] = useState(isSignup ? 'signup' : 'signin');
  const [onboardingStep, setOnboardingStep] = useState<'auth' | 'account-type' | 'add-children' | 'role-selector'>('auth');
  const [checkingChildren, setCheckingChildren] = useState(false);
  const [settingUpSchool, setSettingUpSchool] = useState(false);
  const [signupAccountType, setSignupAccountType] = useState<'school' | 'parent'>('parent');

  const safeT = (key: string, fallback: string) => {
    const value = t(key);
    return value && value !== key ? value : fallback;
  };

  useEffect(() => {
    if (user && onboardingStep === 'auth') {
      checkExistingAccountType();
    }
  }, [user, onboardingStep]);

  const checkExistingAccountType = async () => {
    if (!user) return;
    
    setCheckingChildren(true);
    try {
      // Check if user is already a school admin
      const { data: schoolData } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', user.id)
        .maybeSingle();

      if (schoolData) {
        // Already a school admin, go straight to school admin
        navigate('/school-admin');
        return;
      }

      // Check if user already has children (existing parent)
      const { data: children, error } = await supabase
        .from('children')
        .select('id')
        .eq('parent_id', user.id);

      if (error) throw error;

      if (children && children.length > 0) {
        // Existing parent with children, go to role selector
        setOnboardingStep('role-selector');
      } else {
        // New user - show account type choice
        setOnboardingStep('account-type');
      }
    } catch (error) {
      console.error('Error checking account type:', error);
      setOnboardingStep('account-type');
    } finally {
      setCheckingChildren(false);
    }
  };

  const handleAccountTypeSelected = async (type: 'school' | 'parent') => {
    if (type === 'school') {
      await setupSchoolAdmin();
    } else {
      // Parent flow - go to add children
      setOnboardingStep('add-children');
    }
  };

  const setupSchoolAdmin = async () => {
    if (!user) return;
    setSettingUpSchool(true);
    try {
      // Update profile role to teacher
      await supabase
        .from('profiles')
        .update({ role: 'teacher' as any, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      // Create school account
      const { error } = await supabase
        .from('school_accounts')
        .insert({
          admin_user_id: user.id,
          school_name: user.email?.split('@')[0] || 'My School',
          plan_type: 'school',
          student_limit: 100,
        });

      if (error) {
        // If RLS blocks insert, still navigate - they may need to set it up via admin
        console.error('Error creating school account:', error);
        toast.error('Could not create school account. Please contact support.');
        return;
      }

      toast.success('School account created!');
      navigate('/school-admin');
    } catch (error) {
      console.error('Error setting up school:', error);
      toast.error('Something went wrong. Please try again.');
    } finally {
      setSettingUpSchool(false);
    }
  };

  const handleChildrenAdded = () => {
    setOnboardingStep('role-selector');
  };

  const handleRoleSelected = (role: 'parent' | 'child', childId?: string) => {
    console.log('Auth: handleRoleSelected called', { role, childId });
    if (role === 'parent') {
      console.log('Auth: Navigating to monitoring dashboard');
      navigate('/monitoring');
    } else {
      console.log('Auth: Navigating to quiz generator');
      navigate('/quiz-generator');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError(t('auth.error.invalid'));
        } else if (error.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.');
        } else {
          setError(error.message);
        }
        return;
      }

      // If successful login, useEffect will handle the onboarding flow
      if (data?.session) {
        // The useEffect will detect the user and check for children
      }
    } catch (error: any) {
      setError(t('auth.error.unexpected'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSignupSuccess(false);

    if (password.length < 6) {
      setError(t('auth.error.passwordLength'));
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setError(t('auth.error.alreadyRegistered'));
        } else if (error.message.includes('rate limit')) {
          setError('Too many signup attempts. Please wait a minute before trying again.');
        } else {
          setError(error.message);
        }
        return;
      }

      // Check if user needs email confirmation
      if (data?.user && !data?.session) {
        setSignupSuccess(true);
        setError('');
        // Don't clear email for resend functionality
        setPassword('');
        return;
      }

      // If we have a session, useEffect will handle the onboarding flow
      if (data?.session) {
        // The useEffect will detect the user and check for children
      }
    } catch (error: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    if (!email) {
      setError('Please enter your email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        }
      });

      if (error) {
        setError(error.message);
      } else {
        toast.success('Verification email sent! Check your inbox.');
      }
    } catch (error: any) {
      setError('Failed to resend verification email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`,
          skipBrowserRedirect: true,
        }
      });
      
      if (error) {
        setError(error.message);
        return;
      }

      if (data?.url) {
        window.location.href = data.url;
      }
    } catch (error: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Show loading while checking account type
  if (user && checkingChildren) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show account type selector (School vs Parent)
  if (user && onboardingStep === 'account-type') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <div className="min-h-[80vh] flex items-center justify-center p-4">
          <div className="w-full max-w-3xl">
            <div className="text-center mb-10">
              <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3">
                {safeT('auth.accountType.title', 'How will you use Teachly?')}
              </h1>
              <p className="text-muted-foreground text-lg">
                {safeT('auth.accountType.subtitle', 'Choose your account type to get started')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {/* School / Institution */}
              <Card
                className="bg-card border-border hover:shadow-xl hover:border-primary/40 transition-all duration-300 cursor-pointer group"
                onClick={() => handleAccountTypeSelected('school')}
              >
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-4 p-5 bg-primary/10 rounded-2xl w-fit group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <School className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-foreground text-xl">
                    {safeT('auth.accountType.school', 'School / Institution')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      {safeT('auth.accountType.schoolFeature1', 'Manage multiple students & classes')}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      {safeT('auth.accountType.schoolFeature2', 'Create custom curricula')}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      {safeT('auth.accountType.schoolFeature3', 'School-wide analytics & reporting')}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      {safeT('auth.accountType.schoolFeature4', 'Student invitations & enrollment')}
                    </li>
                  </ul>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11"
                    disabled={settingUpSchool}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAccountTypeSelected('school');
                    }}
                  >
                    {settingUpSchool ? 'Setting up...' : safeT('auth.accountType.continueSchool', 'Continue as School')}
                  </Button>
                </CardContent>
              </Card>

              {/* Parent / Student */}
              <Card
                className="bg-card border-border hover:shadow-xl hover:border-primary/40 transition-all duration-300 cursor-pointer group"
                onClick={() => handleAccountTypeSelected('parent')}
              >
                <CardHeader className="text-center pb-2">
                  <div className="mx-auto mb-4 p-5 bg-primary/10 rounded-2xl w-fit group-hover:bg-primary/20 group-hover:scale-110 transition-all duration-300">
                    <Users className="h-10 w-10 text-primary" />
                  </div>
                  <CardTitle className="text-foreground text-xl">
                    {safeT('auth.accountType.parent', 'Parent / Student')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      {safeT('auth.accountType.parentFeature1', 'Personal learning journey')}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      {safeT('auth.accountType.parentFeature2', 'AI-powered study plans & quizzes')}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      {safeT('auth.accountType.parentFeature3', 'Parent monitoring dashboard')}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                      {safeT('auth.accountType.parentFeature4', 'Gamified quests & achievements')}
                    </li>
                  </ul>
                  <Button
                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-11"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleAccountTypeSelected('parent');
                    }}
                  >
                    {safeT('auth.accountType.continueParent', 'Continue as Parent')}
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  // Show add children step
  if (user && onboardingStep === 'add-children') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <AddChildrenFirst onComplete={handleChildrenAdded} />
        <Footer />
      </div>
    );
  }

  // Show role selector (parent vs child)
  if (user && onboardingStep === 'role-selector') {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <Header />
        <UserRoleSelector onRoleSelected={handleRoleSelected} />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="flex items-center justify-center min-h-[80vh] px-4 py-12">
        <div className="w-full max-w-md mx-auto">
          <Card className="shadow-lg rounded-2xl overflow-hidden border-border bg-card">
            <CardHeader className="text-center pb-6">
              <CardTitle className="text-2xl font-bold text-foreground mb-3">
                {t('auth.welcome')}
              </CardTitle>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {t('auth.subtitle')}
              </p>
            </CardHeader>
            
            <CardContent className="p-6">
            {signupSuccess && (
              <div className="mb-6 p-6 bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 rounded-2xl relative overflow-hidden">
                {/* Animated background elements */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/10 rounded-full blur-2xl animate-pulse delay-1000"></div>
                
                <div className="relative z-10">
                  <div className="flex items-center justify-center mb-4">
                    {/* Email envelope illustration with animation */}
                    <div className="relative">
                      <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center animate-scale-in">
                        <svg className="w-8 h-8 text-primary animate-bounce" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                      </div>
                      {/* Flying checkmark animation */}
                      <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center animate-fade-in delay-500">
                        <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-center mb-4">
                    <h3 className="text-lg font-semibold text-foreground mb-2 animate-fade-in">
                      Verify Your Email
                    </h3>
                    <p className="text-muted-foreground text-sm animate-fade-in delay-200">
                      We sent a verification link to <span className="font-medium text-foreground">{email}</span>
                    </p>
                  </div>
                  
                  <div className="space-y-3">
                    <Button
                      onClick={() => window.open('https://gmail.com', '_blank')}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-12 text-base font-semibold transition-all duration-300 shadow-lg hover:shadow-xl hover:scale-[1.02] animate-fade-in delay-400"
                    >
                      <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      Check Your Email
                    </Button>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => setActiveTab('signin')}
                        variant="outline"
                        className="flex-1 bg-background/50 border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-xl h-11 transition-all duration-200 animate-fade-in delay-500"
                      >
                        Continue to Sign In
                      </Button>
                      <Button
                        onClick={() => setSignupSuccess(false)}
                        variant="ghost"
                        className="flex-1 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl h-11 transition-all duration-200 animate-fade-in delay-600"
                      >
                        Sign Up Another Account
                      </Button>
                    </div>
                    
                    <div className="text-center pt-2 animate-fade-in delay-700">
                      <p className="text-xs text-muted-foreground mb-1">
                        Didn't receive the email?
                      </p>
                      <button
                        onClick={handleResendVerification}
                        disabled={loading}
                        className="text-primary hover:text-primary/80 text-sm font-medium underline transition-colors disabled:opacity-50"
                      >
                        Resend verification email
                      </button>
                      <p className="text-xs text-muted-foreground mt-1">
                        Check your spam folder or try resending
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-muted/50 rounded-xl p-1 mb-6">
                <TabsTrigger 
                  value="signin" 
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg font-medium py-2 px-4 transition-all duration-200"
                >
                  {t('auth.signIn')}
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary rounded-lg font-medium py-2 px-4 transition-all duration-200"
                >
                  {t('auth.signUp')}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">{t('auth.email')}</label>
                    <Input
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-muted/20 border-border text-foreground placeholder-muted-foreground rounded-lg h-11 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">{t('auth.password')}</label>
                    <Input
                      type="password"
                      placeholder={t('auth.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-muted/20 border-border text-foreground placeholder-muted-foreground rounded-lg h-11 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                  
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-destructive rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-destructive-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <p className="text-destructive text-sm font-medium">{error}</p>
                      </div>
                      {error.includes('Email not confirmed') && (
                        <Button
                          onClick={() => setActiveTab('signup')}
                          className="mt-3 w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        >
                          Resend Confirmation Email
                        </Button>
                      )}
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-11 text-base font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {loading ? t('auth.signingIn') : t('auth.signIn')}
                  </Button>
                </form>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-3 text-muted-foreground font-medium">{t('auth.or')}</span>
                  </div>
                </div>
                
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  variant="outline"
                  className="w-full bg-card border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg h-11 text-base font-medium transition-all duration-200"
                >
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {t('auth.continueWithGoogle')}
                </Button>
                
                <div className="text-center text-sm mt-4">
                  <p className="text-muted-foreground">
                    {t('auth.noAccount')}{' '}
                    <button
                      onClick={() => setActiveTab('signup')}
                      className="text-primary hover:text-primary/80 underline font-medium transition-colors"
                    >
                      {t('auth.signUpHere')}
                    </button>
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">{t('auth.email')}</label>
                    <Input
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-muted/20 border-border text-foreground placeholder-muted-foreground rounded-lg h-11 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-muted-foreground">{t('auth.password')}</label>
                    <Input
                      type="password"
                      placeholder={t('auth.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-muted/20 border-border text-foreground placeholder-muted-foreground rounded-lg h-11 focus:border-primary focus:ring-primary/20"
                    />
                  </div>
                  
                  {error && (
                    <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-6 bg-destructive rounded-full flex items-center justify-center flex-shrink-0">
                          <svg className="w-4 h-4 text-destructive-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </div>
                        <p className="text-destructive text-sm font-medium">{error}</p>
                      </div>
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-primary text-primary-foreground hover:bg-primary/90 rounded-lg h-11 text-base font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {loading ? t('auth.creatingAccount') : t('auth.createAccount')}
                  </Button>
                </form>
                
                <div className="relative my-4">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t border-border" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-3 text-muted-foreground font-medium">or</span>
                  </div>
                </div>
                
                <Button
                  onClick={handleGoogleSignIn}
                  disabled={loading}
                  variant="outline"
                  className="w-full bg-card border-border text-foreground hover:bg-accent hover:text-accent-foreground rounded-lg h-11 text-base font-medium transition-all duration-200"
                >
                  <svg className="mr-3 h-5 w-5" viewBox="0 0 24 24">
                    <path
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      fill="#4285F4"
                    />
                    <path
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      fill="#34A853"
                    />
                    <path
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      fill="#FBBC05"
                    />
                    <path
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      fill="#EA4335"
                    />
                  </svg>
                  {t('auth.continueWithGoogle')}
                </Button>
                
                <div className="text-center text-sm mt-4">
                  <p className="text-muted-foreground">
                    {t('auth.hasAccount')}{' '}
                    <button
                      onClick={() => setActiveTab('signin')}
                      className="text-primary hover:text-primary/80 underline font-medium transition-colors"
                    >
                      {t('auth.signInHere')}
                    </button>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
            </CardContent>
          </Card>
          </div>
        </main>
      
      <Footer />
    </div>
  );
};

export default Auth;
