
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Users, User, ArrowRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

const PublicPricing = () => {
  const { t } = useLanguage();
  
  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />

      <main className="flex-1 flex flex-col items-center justify-center p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">{t('publicPricing.title')}</h1>
            <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto">
              {t('publicPricing.subtitle')}
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-8 w-full max-w-5xl mx-auto">
            {/* Individual Plan */}
            <Card className="w-full bg-card border border-border relative hover:shadow-lg transition-all duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
                {t('publicPricing.recommended')}
              </div>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <User className="h-6 w-6 text-primary" />
                  <span className="text-lg font-semibold text-foreground">{t('publicPricing.individual')}</span>
                </div>
                <CardTitle className="text-4xl font-bold text-foreground">{t('publicPricing.individualPrice')}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t('publicPricing.individualDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-center">
                <div>
                  <p className="text-xl mb-2 text-foreground">{t('publicPricing.fullAccess')}</p>
                  <p className="text-muted-foreground mb-4">{t('publicPricing.startImmediately')}</p>
                </div>
                
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{t('publicPricing.feature.adaptiveLearning')}</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{t('publicPricing.feature.voiceMessages')}</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{t('publicPricing.feature.unlimitedChat')}</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{t('publicPricing.feature.fileUploads')}</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{t('publicPricing.feature.progressTracking')}</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{t('publicPricing.feature.quizzes')}</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{t('publicPricing.feature.achievements')}</span>
                  </li>
                </ul>
                
                <div className="bg-muted p-4 rounded-lg">
                  <p className="font-medium text-foreground">{t('publicPricing.whatYouGet')}</p>
                  <p className="text-sm text-muted-foreground">{t('publicPricing.personalTutor')}</p>
                  <p className="text-sm text-muted-foreground">{t('publicPricing.freeTrial')}</p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg" 
                  size="lg"
                  asChild
                >
                  <Link to="/auth?signup=true" className="flex items-center justify-center gap-2">
                    {t('publicPricing.startFreeTrial')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t('publicPricing.signupNote')}
                </p>
              </CardFooter>
            </Card>

            {/* Business Plan */}
            <Card className="w-full bg-card border border-border relative hover:shadow-lg transition-all duration-300">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
                {t('publicPricing.business')}
              </div>
              <CardHeader className="text-center">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Users className="h-6 w-6 text-primary" />
                  <span className="text-lg font-semibold text-foreground">{t('publicPricing.business')}</span>
                </div>
                <CardTitle className="text-4xl font-bold text-foreground">{t('publicPricing.businessPrice')}</CardTitle>
                <CardDescription className="text-muted-foreground">
                  {t('publicPricing.businessDesc')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6 text-center">
                <div>
                  <p className="text-xl mb-2 text-foreground">{t('publicPricing.businessIncludes')}</p>
                  <p className="text-muted-foreground mb-4">{t('publicPricing.businessFeatures')}</p>
                </div>
                
                <ul className="space-y-3 text-left">
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{t('publicPricing.business.feature1')}</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{t('publicPricing.business.feature2')}</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{t('publicPricing.business.feature3')}</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{t('publicPricing.business.feature4')}</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{t('publicPricing.business.feature5')}</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{t('publicPricing.business.feature6')}</span>
                  </li>
                  <li className="flex items-center gap-2 text-foreground">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span>{t('publicPricing.business.feature7')}</span>
                  </li>
                </ul>
                
                <div className="bg-muted p-4 rounded-lg text-left">
                  <h4 className="font-semibold mb-2 text-foreground">{t('publicPricing.flexiblePricing')}</h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>{t('publicPricing.example1')}</li>
                    <li>{t('publicPricing.example2')}</li>
                    <li>{t('publicPricing.example3')}</li>
                    <li>{t('publicPricing.scaleNote')}</li>
                  </ul>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button 
                  className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg" 
                  size="lg"
                  asChild
                >
                  <Link to="/auth?signup=true" className="flex items-center justify-center gap-2">
                    {t('publicPricing.startFreeTrial')}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <p className="text-xs text-muted-foreground text-center">
                  {t('publicPricing.contactEnterprise')}
                </p>
              </CardFooter>
            </Card>
          </div>

          {/* FAQ Section */}
          <div className="mt-16 max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold text-center mb-8 text-foreground">{t('publicPricing.faqTitle')}</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2 text-foreground">{t('publicPricing.faq1.q')}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t('publicPricing.faq1.a')}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2 text-foreground">{t('publicPricing.faq2.q')}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t('publicPricing.faq2.a')}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2 text-foreground">{t('publicPricing.faq3.q')}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t('publicPricing.faq3.a')}
                  </p>
                </CardContent>
              </Card>
              <Card className="bg-card border-border">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-2 text-foreground">{t('publicPricing.faq4.q')}</h3>
                  <p className="text-muted-foreground text-sm">
                    {t('publicPricing.faq4.a')}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Demo Section */}
          <div className="text-center mt-16 mb-12 p-8 bg-card border border-border rounded-2xl shadow-lg">
            <h2 className="text-2xl md:text-3xl font-bold mb-3 text-foreground">{t('publicPricing.demoTitle')}</h2>
            <p className="text-muted-foreground mb-5">
              {t('publicPricing.demoDesc')}
            </p>
            <Button
              className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg font-semibold"
              size="lg"
              asChild
            >
              <Link to="/demo" className="flex items-center gap-2 justify-center">
                {t('publicPricing.tryDemo')}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <div className="text-xs mt-3 text-muted-foreground">
              {t('publicPricing.demoNote')}
            </div>
          </div>

          {/* Final CTA */}
          <div className="text-center mt-8 p-8 bg-card border border-border rounded-2xl shadow-lg">
            <h2 className="text-3xl font-bold mb-4 text-foreground">{t('publicPricing.ctaTitle')}</h2>
            <p className="text-muted-foreground mb-6">
              {t('publicPricing.ctaDesc')}
            </p>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg" size="lg" asChild>
              <Link to="/auth?signup=true">{t('publicPricing.startFreeTrial')}</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default PublicPricing;
