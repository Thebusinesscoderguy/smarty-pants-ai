
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RoleSelection } from '@/components/RoleSelection';

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
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  
  const role = searchParams.get('role');
  const isSignup = searchParams.get('signup') === 'true';
  const [activeTab, setActiveTab] = useState(isSignup ? 'signup' : 'signin');

  useEffect(() => {
    if (user) {
      navigate('/chat');
    }
  }, [user, navigate]);

  useEffect(() => {
    if (!role && !user) {
      setShowRoleSelection(true);
    }
  }, [role, user]);

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
          setError(t('auth.errors.invalidCredentials'));
        } else {
          setError(error.message);
        }
        return;
      }

      navigate('/chat');
    } catch (error: any) {
      setError(t('auth.errors.genericError'));
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (password !== confirmPassword) {
      setError(t('auth.errors.passwordMismatch'));
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError(t('auth.errors.weakPassword'));
      setLoading(false);
      return;
    }

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/chat`,
          data: {
            role: role || 'student'
          }
        }
      });

      if (error) {
        if (error.message.includes('already registered')) {
          setError(t('auth.errors.emailInUse'));
        } else {
          setError(error.message);
        }
        return;
      }

      navigate('/chat');
    } catch (error: any) {
      setError(t('auth.errors.genericError'));
    } finally {
      setLoading(false);
    }
  };

  const handleRoleSelect = (selectedRole: string) => {
    navigate(`/auth?role=${selectedRole}&signup=true`);
    setShowRoleSelection(false);
    setActiveTab('signup');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
      <Header />
      
      <main className="flex items-center justify-center min-h-[80vh] px-4 py-12">
        <Card className="w-full max-w-md bg-white/10 border-white/20 backdrop-blur-sm">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold text-white">
              {t('auth.title')}
            </CardTitle>
            <p className="text-white/70">
              {t('auth.subtitle')}
            </p>
          </CardHeader>
          
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-white/20">
                <TabsTrigger 
                  value="signin" 
                  className="data-[state=active]:bg-white/30 data-[state=active]:text-white"
                >
                  {t('auth.signInTab')}
                </TabsTrigger>
                <TabsTrigger 
                  value="signup" 
                  className="data-[state=active]:bg-white/30 data-[state=active]:text-white"
                >
                  {t('auth.signUpTab')}
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="signin" className="space-y-4 mt-6">
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      placeholder={t('auth.email')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder-white/60"
                    />
                  </div>
                  
                  <div>
                    <Input
                      type="password"
                      placeholder={t('auth.password')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder-white/60"
                    />
                  </div>
                  
                  {error && (
                    <div className="text-red-400 text-sm text-center">
                      {error}
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {loading ? t('common.loading') : t('auth.signInButton')}
                  </Button>
                </form>
                
                <div className="text-center text-sm">
                  <p className="text-white/70">
                    {t('auth.noAccount')}{' '}
                    <button
                      onClick={() => setActiveTab('signup')}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {t('auth.signUpLink')}
                    </button>
                  </p>
                </div>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4 mt-6">
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div>
                    <Input
                      type="email"
                      placeholder={t('auth.email')}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder-white/60"
                    />
                  </div>
                  
                  <div>
                    <Input
                      type="password"
                      placeholder={t('auth.password')}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder-white/60"
                    />
                  </div>
                  
                  <div>
                    <Input
                      type="password"
                      placeholder={t('auth.confirmPassword')}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="bg-white/10 border-white/20 text-white placeholder-white/60"
                    />
                  </div>
                  
                  {error && (
                    <div className="text-red-400 text-sm text-center">
                      {error}
                    </div>
                  )}
                  
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                  >
                    {loading ? t('common.loading') : t('auth.signUpButton')}
                  </Button>
                </form>
                
                <div className="text-center text-sm">
                  <p className="text-white/70">
                    {t('auth.hasAccount')}{' '}
                    <button
                      onClick={() => setActiveTab('signin')}
                      className="text-blue-400 hover:text-blue-300 underline"
                    >
                      {t('auth.signInLink')}
                    </button>
                  </p>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
      
      <Footer />
      
      <RoleSelection 
        isOpen={showRoleSelection} 
        onClose={() => setShowRoleSelection(false)} 
        mode="signup"
        onRoleSelect={handleRoleSelect}
      />
    </div>
  );
};

export default Auth;
