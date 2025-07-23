
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { GraduationCap, BookOpen, Trophy, Zap, Users, Heart } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RoleSelection } from '@/components/RoleSelection';
import VoiceTestNavButton from '@/components/VoiceTestNavButton';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const { t } = useLanguage();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    setShowRoleSelection(true);
  };

  const handleRoleSelected = (role: 'student' | 'teacher' | 'parent') => {
    console.log('Role selected:', role);
    navigate('/onboarding', { state: { role } });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-purple-900 text-white">
      <Header />
      
      <main className="pt-16">
        <section className="relative px-6 py-20 text-center">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-center mb-6">
              <GraduationCap className="h-12 w-12 text-blue-400 mr-4" />
              <h1 className="text-5xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
                {t('hero.title')}
              </h1>
            </div>
            
            <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
              {t('hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
              <Button 
                onClick={handleGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full text-lg transition-all duration-200 transform hover:scale-105"
              >
                {t('hero.cta')}
                <Zap className="ml-2 h-5 w-5" />
              </Button>
              
              <VoiceTestNavButton />
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 px-6">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-12 text-blue-100">
              {t('features.title')}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <Card className="bg-white/10 backdrop-blur-sm border-blue-500/20">
                <CardHeader>
                  <BookOpen className="h-8 w-8 text-blue-400 mb-2" />
                  <CardTitle className="text-blue-100">{t('features.aiTutor.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-blue-200">
                    {t('features.aiTutor.description')}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-purple-500/20">
                <CardHeader>
                  <Trophy className="h-8 w-8 text-purple-400 mb-2" />
                  <CardTitle className="text-blue-100">{t('features.gamification.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-blue-200">
                    {t('features.gamification.description')}
                  </CardDescription>
                </CardContent>
              </Card>

              <Card className="bg-white/10 backdrop-blur-sm border-green-500/20">
                <CardHeader>
                  <Users className="h-8 w-8 text-green-400 mb-2" />
                  <CardTitle className="text-blue-100">{t('features.collaborative.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-blue-200">
                    {t('features.collaborative.description')}
                  </CardDescription>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-20 px-6 bg-white/5">
          <div className="max-w-4xl mx-auto text-center">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div>
                <div className="text-4xl font-bold text-blue-400 mb-2">10K+</div>
                <div className="text-blue-200">Active Students</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-purple-400 mb-2">50+</div>
                <div className="text-blue-200">Subjects Covered</div>
              </div>
              <div>
                <div className="text-4xl font-bold text-green-400 mb-2">98%</div>
                <div className="text-blue-200">Satisfaction Rate</div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 px-6 text-center">
          <div className="max-w-2xl mx-auto">
            <Heart className="h-12 w-12 text-red-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4 text-blue-100">
              Ready to Transform Learning?
            </h2>
            <p className="text-xl text-blue-200 mb-8">
              Join thousands of students, teachers, and parents who are already experiencing the future of education.
            </p>
            <Button 
              onClick={handleGetStarted}
              className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-8 rounded-full text-lg transition-all duration-200 transform hover:scale-105"
            >
              Start Your Journey
              <Zap className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </section>
      </main>

      <Footer />
      
      {showRoleSelection && (
        <RoleSelection 
          onClose={() => setShowRoleSelection(false)}
          onRoleSelected={handleRoleSelected}
        />
      )}
    </div>
  );
};

export default Index;
