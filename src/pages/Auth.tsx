
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { UserRoleSelector } from '@/components/onboarding/UserRoleSelector';
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
  const [showRoleSelector, setShowRoleSelector] = useState(false);

  useEffect(() => {
    if (user && !showRoleSelector) {
      setShowRoleSelector(true);
    }
  }, [user, showRoleSelector]);

  const handleRoleSelected = (role: 'parent' | 'child', childId?: string) => {
    if (role === 'parent') {
      navigate('/monitoring');
    } else {
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

      // If successful login, show role selector
      if (data?.session) {
        setShowRoleSelector(true);
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
        // Clear the form
        setEmail('');
        setPassword('');
        return;
      }

      // If we have a session, show role selector
      if (data?.session) {
        setShowRoleSelector(true);
      }
    } catch (error: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth`
        }
      });
      
      if (error) {
        setError(error.message);
      }
    } catch (error: any) {
      setError('An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900 text-white">
      <Header />
      
      {/* Show role selector if user is authenticated */}
      {user && showRoleSelector ? (
        <UserRoleSelector onRoleSelected={handleRoleSelected} />
      ) : (
        <main className="flex items-center justify-center min-h-[80vh] px-4 py-12">
          <div className="w-full max-w-md mx-auto">
            <Card className="glass-dark shadow-2xl rounded-2xl overflow-hidden border-white/10">
              <CardHeader className="text-center pb-6 bg-gradient-to-b from-white/5 to-transparent">
                <CardTitle className="text-2xl font-bold gradient-text mb-3">
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
                        onClick={handleSignUp}
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
                    <span className="w-full border-t border-white/15" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-3 text-white/50 font-medium">{t('auth.or')}</span>
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
                    <span className="w-full border-t border-white/15" />
                  </div>
                  <div className="relative flex justify-center text-xs">
                    <span className="bg-card px-3 text-white/50 font-medium">or</span>
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
      )}
      
      <Footer />
    </div>
  );
};

export default Auth;
