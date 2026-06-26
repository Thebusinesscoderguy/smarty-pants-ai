import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';
import { SEO } from '@/components/SEO';
import { useLanguage } from '@/contexts/LanguageContext';

const SCHOOL_FAQS = ['s1', 's2', 's3', 's4', 's5', 's6'];
const GENERAL_FAQS = ['g1', 'g2', 'g3', 'g4', 'g5', 'g6', 'g7', 'g8', 'g9'];

const FAQ = () => {
  const { t } = useLanguage();

  const renderCards = (keys: string[]) => (
    <div className="grid md:grid-cols-2 gap-6">
      {keys.map((k) => (
        <Card key={k} className="bg-card border-border hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <h3 className="font-semibold text-lg mb-3 text-foreground">{t(`faq.${k}q`)}</h3>
            <p className="text-muted-foreground">{t(`faq.${k}a`)}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="FAQ — Teachly.AI Questions, Answered"
        description="Answers to common questions about Teachly.AI: school signup, pricing, AI tutoring, parent access, curricula support, privacy, and getting started."
        path="/faq"
      />
      <Header />

      {/* FAQ Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">{t('faq.badge')}</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                {t('faq.heading')}
              </h1>
              <p className="text-xl text-muted-foreground">
                {t('faq.subtitle')}
              </p>
            </div>

            {/* School Registration FAQ */}
            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">{t('faq.schoolsHeading')}</h2>
              {renderCards(SCHOOL_FAQS)}
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">{t('faq.generalHeading')}</h2>
            {renderCards(GENERAL_FAQS)}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
