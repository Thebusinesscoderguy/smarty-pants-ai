import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SEO } from '@/components/SEO';
import { 
  Brain, MessageSquare, BookOpen, Gamepad2, BarChart, Users, 
  Globe, Lightbulb, Target, CheckCircle, Star, Zap, Shield, 
  Clock, Mic, Upload, Camera, PlayCircle, Trophy, TrendingUp,
  FileText, Settings, Monitor, Smartphone, Tablet, Headphones,
  PenTool, Calculator, Languages, GraduationCap, Award,
  ChevronRight, ArrowRight, Play
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const Features = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title="Features — Teachly.AI AI Tools for Schools"
        description="Explore Teachly.AI features: AI tutor, adaptive quizzes, study plans, lesson generation, gradebook, parent messaging, and school analytics."
        path="/features"
      />
      <Header />
      
      <main className="px-4 py-12 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground">
              {t('features.title')}
            </h1>
            <p className="text-xl text-muted-foreground max-w-4xl mx-auto mb-8 leading-relaxed">
              {t('features.subtitle')}
            </p>
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg"
              onClick={() => navigate('/quiz-generator')}
            >
              {t('features.startToday')}
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Feature Categories */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-muted border border-border mb-12">
              <TabsTrigger value="overview" className="text-xs md:text-sm">{t('features.tab.overview')}</TabsTrigger>
              <TabsTrigger value="ai-tutoring" className="text-xs md:text-sm">{t('features.tab.aiTutoring')}</TabsTrigger>
              <TabsTrigger value="tools" className="text-xs md:text-sm">{t('features.tab.tools')}</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs md:text-sm">{t('features.tab.analytics')}</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="bg-card border border-border hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <Brain className="h-12 w-12 text-primary mb-4" />
                    <CardTitle>{t('features.aiTutor.title')}</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {t('features.aiTutor.desc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-4 w-4 text-primary mr-2" />
                        {t('features.aiTutor.natural')}
                      </div>
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-4 w-4 text-primary mr-2" />
                        {t('features.aiTutor.multilang')}
                      </div>
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-4 w-4 text-primary mr-2" />
                        {t('features.aiTutor.socratic')}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <BookOpen className="h-12 w-12 text-primary mb-4" />
                    <CardTitle>{t('features.studyTools.title')}</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {t('features.studyTools.desc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-4 w-4 text-primary mr-2" />
                        {t('features.studyTools.quizzes')}
                      </div>
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-4 w-4 text-primary mr-2" />
                        {t('features.studyTools.plans')}
                      </div>
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-4 w-4 text-primary mr-2" />
                        {t('features.studyTools.modules')}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border hover:shadow-lg transition-all duration-300">
                  <CardHeader>
                    <Languages className="h-12 w-12 text-primary mb-4" />
                    <CardTitle>{t('features.language.title')}</CardTitle>
                    <CardDescription className="text-muted-foreground">
                      {t('features.language.desc')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-4 w-4 text-primary mr-2" />
                        {t('features.language.responses')}
                      </div>
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-4 w-4 text-primary mr-2" />
                        {t('features.language.materials')}
                      </div>
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-4 w-4 text-primary mr-2" />
                        {t('features.language.cultural')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* AI Tutoring Tab */}
            <TabsContent value="ai-tutoring" className="mt-8">
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="bg-card border border-border">
                  <CardHeader>
                    <Languages className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>{t('features.multilang.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {t('features.multilang.desc')}
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <Badge variant="outline">{t('features.lang.english')}</Badge>
                      <Badge variant="outline">{t('features.lang.spanish')}</Badge>
                      <Badge variant="outline">{t('features.lang.french')}</Badge>
                      <Badge variant="outline">{t('features.lang.german')}</Badge>
                      <Badge variant="outline">{t('features.lang.italian')}</Badge>
                      <Badge variant="outline">{t('features.lang.japanese')}</Badge>
                      <Badge variant="outline">{t('features.lang.korean')}</Badge>
                      <Badge variant="outline">{t('features.lang.chinese')}</Badge>
                      <Badge variant="outline">{t('features.lang.russian')}</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardHeader>
                    <Brain className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>{t('features.intelligence.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {t('features.intelligence.desc')}
                    </p>
                    <div className="space-y-2">
                      <Badge variant="outline" className="mr-2">{t('features.method.socratic')}</Badge>
                      <Badge variant="outline" className="mr-2">{t('features.method.adaptive')}</Badge>
                      <Badge variant="outline">{t('features.method.feedback')}</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Study Tools Tab */}
            <TabsContent value="tools" className="mt-8">
              <div className="grid lg:grid-cols-3 gap-8">
                <Card className="bg-card border border-border">
                  <CardHeader>
                    <FileText className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>{t('features.quizGen.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">
                      {t('features.quizGen.desc')}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-3 w-3 text-primary mr-2" />
                        {t('features.quizGen.multilang')}
                      </div>
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-3 w-3 text-primary mr-2" />
                        {t('features.quizGen.difficulty')}
                      </div>
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-3 w-3 text-primary mr-2" />
                        {t('features.quizGen.grading')}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardHeader>
                    <Mic className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>{t('features.voice.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">
                      {t('features.voice.desc')}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-3 w-3 text-primary mr-2" />
                        {t('features.voice.support')}
                      </div>
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-3 w-3 text-primary mr-2" />
                        {t('features.voice.accent')}
                      </div>
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-3 w-3 text-primary mr-2" />
                        {t('features.voice.audio')}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardHeader>
                    <BookOpen className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>{t('features.localizedPlans.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground text-sm mb-4">
                      {t('features.localizedPlans.desc')}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-3 w-3 text-primary mr-2" />
                        {t('features.localizedPlans.curriculum')}
                      </div>
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-3 w-3 text-primary mr-2" />
                        {t('features.localizedPlans.cultural')}
                      </div>
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-3 w-3 text-primary mr-2" />
                        {t('features.localizedPlans.native')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-8">
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="bg-card border border-border">
                  <CardHeader>
                    <BarChart className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>{t('features.analytics.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {t('features.analytics.desc')}
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-2 bg-primary rounded-full"></div>
                        <span className="text-sm text-foreground">{t('features.analytics.mathMastery')}</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-2 bg-primary/60 rounded-full"></div>
                        <span className="text-sm text-foreground">{t('features.analytics.scienceProgress')}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border">
                  <CardHeader>
                    <Users className="h-8 w-8 text-primary mb-2" />
                    <CardTitle>{t('features.multiUser.title')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground mb-4">
                      {t('features.multiUser.desc')}
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-3 w-3 text-primary mr-2" />
                        {t('features.multiUser.dashboard')}
                      </div>
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-3 w-3 text-primary mr-2" />
                        {t('features.multiUser.reports')}
                      </div>
                      <div className="flex items-center text-sm text-foreground">
                        <CheckCircle className="h-3 w-3 text-primary mr-2" />
                        {t('features.multiUser.preferences')}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Call to Action */}
          <div className="text-center mt-16 p-8 bg-card border border-border rounded-2xl shadow-lg">
            <h2 className="text-3xl font-bold mb-4 text-foreground">{t('features.cta.title')}</h2>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              {t('features.cta.subtitle')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg"
                onClick={() => navigate('/quiz-generator')}
              >
                {t('features.cta.startTrial')}
                <Play className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/quiz-generator')}
                className="rounded-full border-2 border-border bg-background hover:bg-muted"
              >
                {t('features.cta.tryDemo')}
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Features;