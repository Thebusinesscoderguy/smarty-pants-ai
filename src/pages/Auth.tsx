
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
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
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
      navigate('/chat');
    }
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setError(t('auth.error.invalid'));
        } else {
          setError(error.message);
        }
        return;
      }

      // Don't auto-navigate, let role selector handle it
      setShowRoleSelector(true);
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

    if (password !== confirmPassword) {
      setError(t('auth.error.passwordMismatch'));
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t('auth.error.passwordLength'));
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth`,
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setError(t('auth.error.alreadyRegistered'));
        } else {
          setError(error.message);
        }
        return;
      }

      // Don't auto-navigate, let role selector handle it
      setShowRoleSelector(true);
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
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <Header />
      
      {/* Show role selector if user is authenticated */}
      {user && showRoleSelector ? (
        <UserRoleSelector onRoleSelected={handleRoleSelected} />
      ) : (
        <main className="flex items-center justify-center min-h-[80vh] px-4 py-12">
          <div className="w-full max-w-md mx-auto">
            <Card className="bg-white/5 border-white/10 backdrop-blur-xl shadow-xl rounded-2xl overflow-hidden">
              <CardHeader className="text-center pb-6 bg-gradient-to-b from-white/5 to-transparent">
                <CardTitle className="text-2xl font-bold text-white mb-3">
                  {t('auth.welcome')}
                </CardTitle>
                <p className="text-slate-300 text-sm leading-relaxed">
                  {t('auth.subtitle')}
                </p>
              </CardHeader>
            
            <CardContent className="p-6">{/* ... rest of authentication form */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/10 rounded-xl p-1 mb-6">
                <TabsTrigger 
                  value="signin" 
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-lg font-medium py-2 px-4 transition-all duration-200"
                >
                  {t('auth.signIn')}
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="data-[state=active]:bg-white/20 data-[state=active]:text-white rounded-lg font-medium py-2 px-4 transition-all duration-200"
                >
                  {t('auth.signUp')}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">{t('auth.email')}</label>
                    <Input
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/5 border-white/20 text-white placeholder-white/40 rounded-lg h-11 focus:border-white/40 focus:ring-white/20"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">{t('auth.password')}</label>
                    <Input
                      type="password"
                      placeholder={t('auth.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white/5 border-white/20 text-white placeholder-white/40 rounded-lg h-11 focus:border-white/40 focus:ring-white/20"
                    />
                  </div>
                  
                  {error && (
                    <div className="text-red-300 text-xs text-center bg-red-500/5 p-3 rounded-lg border border-red-500/20">
                      {error}
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg h-11 text-base font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
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
                  className="w-full bg-white/5 border-white/15 text-white hover:bg-white/10 rounded-lg h-11 text-base font-medium transition-all duration-200"
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
                  <p className="text-slate-400">
                    {t('auth.noAccount')}{' '}
                    <button
                      onClick={() => setActiveTab('signup')}
                      className="text-blue-400 hover:text-blue-300 underline font-medium transition-colors"
                    >
                      {t('auth.signUpHere')}
                    </button>
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">{t('auth.email')}</label>
                    <Input
                      type="email"
                      placeholder={t('auth.emailPlaceholder')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/5 border-white/20 text-white placeholder-white/40 rounded-lg h-11 focus:border-white/40 focus:ring-white/20"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">{t('auth.password')}</label>
                    <Input
                      type="password"
                      placeholder={t('auth.passwordPlaceholder')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white/5 border-white/20 text-white placeholder-white/40 rounded-lg h-11 focus:border-white/40 focus:ring-white/20"
                    />
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-300">{t('auth.confirmPassword')}</label>
                    <Input
                      type="password"
                      placeholder={t('auth.confirmPasswordPlaceholder')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-white/5 border-white/20 text-white placeholder-white/40 rounded-lg h-11 focus:border-white/40 focus:ring-white/20"
                    />
                  </div>
                  
                  {error && (
                    <div className="text-red-300 text-xs text-center bg-red-500/5 p-3 rounded-lg border border-red-500/20">
                      {error}
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg h-11 text-base font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
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
                  className="w-full bg-white/5 border-white/15 text-white hover:bg-white/10 rounded-lg h-11 text-base font-medium transition-all duration-200"
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
                  <p className="text-slate-400">
                    {t('auth.hasAccount')}{' '}
                    <button
                      onClick={() => setActiveTab('signin')}
                      className="text-blue-400 hover:text-blue-300 underline font-medium transition-colors"
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
