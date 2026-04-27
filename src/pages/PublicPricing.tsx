import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Sparkles, School, ArrowRight, Gift } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

const PublicPricing = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const includedFeatures = isAr ? [
    'إدارة كاملة للفصول والأقسام والمعلمين',
    'سجل درجات وحضور وواجبات',
    'مولّد خطط دروس وأسئلة بالذكاء الاصطناعي',
    'مدرّس ذكي وخطط دراسة لكل طالب',
    'تواصل أولياء الأمور والتقارير الأسبوعية',
    'دعم المناهج العربية والدولية',
    'لوحة تحليلات شاملة',
  ] : [
    'Full class, section & teacher management',
    'Gradebook, attendance & homework',
    'AI lesson plan & quiz generator',
    'AI tutor & study plans for every student',
    'Parent messaging & weekly digests',
    'Arabic + international curricula',
    'Complete analytics dashboard',
  ];

  const tiers = [
    {
      name: isAr ? 'مجاني' : 'Free',
      price: isAr ? '$0' : '$0',
      cadence: isAr ? '/شهرياً' : '/month',
      cap: isAr ? 'حتى 30 طالباً' : 'Up to 30 students',
      blurb: isAr ? 'بدون بطاقة ائتمان · جميع الميزات' : 'No credit card · full features',
      cta: isAr ? 'ابدأ مجاناً' : 'Start Free',
      highlight: false,
    },
    {
      name: isAr ? 'المبتدئ' : 'Starter',
      price: '$79',
      cadence: isAr ? '/شهرياً' : '/month',
      cap: isAr ? 'حتى 150 طالباً' : 'Up to 150 students',
      blurb: isAr ? 'للمدارس الصغيرة' : 'For small schools',
      cta: isAr ? 'ابدأ المبتدئ' : 'Choose Starter',
      highlight: false,
    },
    {
      name: isAr ? 'النمو' : 'Growth',
      price: '$149',
      cadence: isAr ? '/شهرياً' : '/month',
      cap: isAr ? 'حتى 400 طالب' : 'Up to 400 students',
      blurb: isAr ? 'الأكثر شعبية بين المدارس' : 'Most popular for schools',
      cta: isAr ? 'ابدأ النمو' : 'Choose Growth',
      highlight: true,
    },
    {
      name: isAr ? 'غير محدود' : 'Unlimited',
      price: '$249',
      cadence: isAr ? '/شهرياً' : '/month',
      cap: isAr ? 'طلاب غير محدودين' : 'Unlimited students',
      blurb: isAr ? 'للمدارس الكبيرة والمناطق التعليمية' : 'For large schools & districts',
      cta: isAr ? 'ابدأ غير المحدود' : 'Choose Unlimited',
      highlight: false,
    },
  ];

  const upgradeFeatures = isAr ? [
    'توليد غير محدود للاختبارات والخطط الدراسية',
    'محادثات مدرّس ذكي بدون حدود',
    'عروض تقديمية وملخصات أكثر',
    'أولوية في الاستجابة',
  ] : [
    'Unlimited quiz & study plan generation',
    'Unlimited AI tutor conversations',
    'More presentations and summaries',
    'Priority response speed',
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      <main className="flex-1 flex flex-col items-center p-4 md:p-8">
        <div className="max-w-7xl mx-auto w-full">
          <div className="text-center mb-10 mt-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {isAr ? 'تسعير ثابت بسيط للمدارس' : 'Simple flat pricing for schools'}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {isAr
                ? 'سعر واحد ثابت شهرياً. كل الميزات مدرجة في كل خطة. لا تكاليف لكل طالب.'
                : 'One flat price per month. Every feature included in every tier. No per-student surprises.'}
            </p>
          </div>

          {/* GCC promo banner */}
          <div className="mb-10 max-w-4xl mx-auto">
            <div className="flex items-start gap-3 p-4 rounded-2xl bg-gradient-to-r from-primary/15 via-primary/5 to-transparent border border-primary/30 shadow-sm">
              <div className="p-2 rounded-lg bg-primary/20 shrink-0">
                <Gift className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-semibold">
                  {isAr ? '🎁 عرض خاص لدول الخليج' : '🎁 Special offer for GCC schools'}
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {isAr
                    ? 'احصل على 3 أشهر مجانية عند التسجيل قبل يونيو 2026.'
                    : 'Schools in the GCC get 3 months free when signing up before June 2026.'}
                </p>
              </div>
            </div>
          </div>

          {/* TIERS */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {tiers.map((tier) => (
              <Card
                key={tier.name}
                className={`relative flex flex-col bg-card transition-all ${
                  tier.highlight
                    ? 'border-2 border-primary shadow-xl scale-[1.02]'
                    : 'border border-border'
                }`}
              >
                {tier.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-3 py-0.5 rounded-full text-xs font-bold">
                    {isAr ? 'الأكثر شعبية' : 'MOST POPULAR'}
                  </div>
                )}
                <CardHeader className="text-center pt-6 pb-4">
                  <div className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                    {tier.name}
                  </div>
                  <CardTitle className="text-4xl font-bold mt-2">
                    {tier.price}
                    <span className="text-base font-normal text-muted-foreground">{tier.cadence}</span>
                  </CardTitle>
                  <CardDescription className="font-medium text-foreground/80 mt-1">
                    {tier.cap}
                  </CardDescription>
                  <p className="text-xs text-muted-foreground mt-1">{tier.blurb}</p>
                </CardHeader>
                <CardContent className="flex-1">
                  <ul className="space-y-2">
                    {includedFeatures.slice(0, 5).map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button
                    variant={tier.highlight ? 'default' : 'outline'}
                    className="w-full rounded-full"
                    asChild
                  >
                    <Link to="/auth?signup=true" className="flex items-center justify-center gap-2">
                      {tier.cta}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>

          {/* Everything included */}
          <div className="max-w-4xl mx-auto mb-14 p-6 rounded-2xl bg-muted/40 border border-border">
            <div className="flex items-center gap-2 mb-4">
              <School className="h-5 w-5 text-primary" />
              <h3 className="font-semibold">{isAr ? 'كل الميزات مدرجة في كل خطة' : 'Every plan includes everything'}</h3>
            </div>
            <ul className="grid sm:grid-cols-2 gap-2">
              {includedFeatures.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm">
                  <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* STUDENT AI UPGRADE */}
          <Card className="max-w-3xl mx-auto bg-card border border-border relative mb-12">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-0.5 rounded-full text-xs font-bold">
              {isAr ? 'إضافة اختيارية' : 'OPTIONAL ADD-ON'}
            </div>
            <CardHeader className="text-center pt-7">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span className="text-lg font-semibold">
                  {isAr ? 'ترقية الذكاء الاصطناعي للطالب' : 'Student AI Upgrade'}
                </span>
              </div>
              <CardTitle className="text-3xl font-bold">
                {isAr ? '$6/شهرياً' : '$6/month'}
              </CardTitle>
              <CardDescription>
                {isAr ? 'لكل طالب · توليد ذكاء اصطناعي غير محدود' : 'Per student · unlimited AI generation'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground text-center mb-4">
                {isAr
                  ? 'تتضمن خطة المدرسة حصة ذكاء اصطناعي سخية لكل طالب. هذه الترقية للطلاب الذين يحتاجون أكثر.'
                  : 'Every school plan includes a generous AI quota per student. This optional upgrade is for students who want unlimited usage beyond that.'}
              </p>
              <ul className="grid sm:grid-cols-2 gap-2 max-w-xl mx-auto">
                {upgradeFeatures.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <div className="text-center mt-4 mb-12 p-8 bg-card border border-border rounded-2xl shadow-lg max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              {isAr ? 'منطقة تعليمية أو عدة مدارس؟' : 'District or multi-school?'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isAr ? 'تسعير مخصص ودعم تنفيذ متاح للمناطق التعليمية والمدارس الكبيرة.' : 'Custom pricing and dedicated implementation support for districts and multi-campus schools.'}
            </p>
            <Button size="lg" className="rounded-full shadow-lg" asChild>
              <Link to="/auth?signup=true">{isAr ? 'سجل مدرستك' : 'Register your school'}</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PublicPricing;
