import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';
import { 
  UserPlus, 
  Target, 
  MessageSquare, 
  TrendingUp, 
  Mic, 
  Trophy,
  ArrowRight,
  Check
} from 'lucide-react';

const HowItWorks = () => {
  const { t } = useLanguage();
  
  const steps = [
    {
      number: 1,
      title: t('howItWorks.step1.title'),
      description: t('howItWorks.step1.desc'),
      icon: UserPlus,
      details: [t('howItWorks.step1.detail1'), t('howItWorks.step1.detail2'), t('howItWorks.step1.detail3')]
    },
    {
      number: 2,
      title: t('howItWorks.step2.title'),
      description: t('howItWorks.step2.desc'),
      icon: Target,
      details: [t('howItWorks.step2.detail1'), t('howItWorks.step2.detail2'), t('howItWorks.step2.detail3')]
    },
    {
      number: 3,
      title: t('howItWorks.step3.title'),
      description: t('howItWorks.step3.desc'),
      icon: MessageSquare,
      details: [t('howItWorks.step3.detail1'), t('howItWorks.step3.detail2'), t('howItWorks.step3.detail3')]
    },
    {
      number: 4,
      title: t('howItWorks.step4.title'),
      description: t('howItWorks.step4.desc'),
      icon: Mic,
      details: [t('howItWorks.step4.detail1'), t('howItWorks.step4.detail2'), t('howItWorks.step4.detail3')]
    },
    {
      number: 5,
      title: t('howItWorks.step5.title'),
      description: t('howItWorks.step5.desc'),
      icon: TrendingUp,
      details: [t('howItWorks.step5.detail1'), t('howItWorks.step5.detail2'), t('howItWorks.step5.detail3')]
    },
    {
      number: 6,
      title: t('howItWorks.step6.title'),
      description: t('howItWorks.step6.desc'),
      icon: Trophy,
      details: [t('howItWorks.step6.detail1'), t('howItWorks.step6.detail2'), t('howItWorks.step6.detail3')]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Header />
      
      <main className="flex-1 px-4 md:px-6 py-12">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            {t('howItWorks.title')}
          </h1>
          <p className="text-xl md:text-2xl text-white/80 max-w-3xl mx-auto mb-8">
            {t('howItWorks.subtitle')}
          </p>
          <Button className="bg-white text-black hover:bg-gray-200" size="lg" asChild>
            <Link to="/auth">{t('howItWorks.getStartedFree')}</Link>
          </Button>
        </div>

        {/* Steps Section */}
        <div className="max-w-7xl mx-auto">
          <div className="grid gap-8 md:gap-12">
            {steps.map((step, index) => (
              <div key={step.number} className="flex flex-col lg:flex-row items-center gap-8">
                {/* Step Number and Icon */}
                <div className="flex-shrink-0 relative">
                  <div className="w-32 h-32 bg-gradient-to-br from-purple-600 to-blue-600 rounded-full flex items-center justify-center relative">
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-white text-black rounded-full flex items-center justify-center font-bold text-xl">
                      {step.number}
                    </div>
                    <step.icon className="h-12 w-12 text-white" />
                  </div>
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute top-32 left-1/2 transform -translate-x-1/2 w-0.5 h-12 bg-gradient-to-b from-purple-600 to-transparent hidden lg:block" />
                  )}
                </div>

                {/* Content */}
                <Card className="flex-1 bg-white/5 border-white/10 hover:bg-white/10 transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                        {step.title}
                      </h3>
                      <ArrowRight className="h-6 w-6 text-purple-400 hidden md:block" />
                    </div>
                    <p className="text-lg text-white/80 mb-6 leading-relaxed">
                      {step.description}
                    </p>
                    <ul className="space-y-3">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-center gap-3 text-white/70">
                          <Check className="h-5 w-5 text-green-400 flex-shrink-0" />
                          <span>{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto text-center mt-20 p-8 bg-gradient-to-r from-purple-900/50 to-blue-900/50 rounded-2xl border border-white/10">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {t('howItWorks.cta.title')}
          </h2>
          <p className="text-xl text-white/80 mb-8">
            {t('howItWorks.cta.desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-white text-black hover:bg-gray-200" size="lg" asChild>
              <Link to="/auth">{t('howItWorks.startNow')}</Link>
            </Button>
            <Button variant="outline" className="border-white/30 text-white hover:bg-white/10" size="lg" asChild>
              <Link to="/pricing">{t('howItWorks.viewPricing')}</Link>
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default HowItWorks;
