import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CheckCircle, Sparkles, School, ArrowRight } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

const PublicPricing = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const schoolFeatures = isAr ? [
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
          <div className="text-center mb-12 mt-8">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              {isAr ? 'تسعير بسيط للمدارس' : 'Simple pricing, built for schools'}
            </h1>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              {isAr
                ? 'كل ميزة لكل دور — بسعر واحد واضح. الذكاء الاصطناعي مدمج، لا إضافات مخفية.'
                : 'Every feature for every role — one clear price. AI included, no hidden add-ons.'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* SCHOOL PLAN */}
            <Card className="bg-card border-2 border-primary/40 relative shadow-xl">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
                {isAr ? 'الأكثر شعبية' : 'MOST POPULAR'}
              </div>
              <CardHeader className="text-center pt-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <School className="h-6 w-6 text-primary" />
                  <span className="text-lg font-semibold">{isAr ? 'خطة المدرسة' : 'School Plan'}</span>
                </div>
                <CardTitle className="text-4xl font-bold">
                  {isAr ? '$25/شهرياً' : '$25/month'}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {isAr ? '+ $5 لكل طالب · كل شيء مدرج' : '+ $5 per student · everything included'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {schoolFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-foreground">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-muted p-4 rounded-lg text-sm space-y-1">
                  <p className="font-semibold">{isAr ? 'مثال:' : 'Example:'}</p>
                  <p className="text-muted-foreground">
                    {isAr ? '50 طالباً = $25 + (50 × $5) = $275/شهرياً' : '50 students = $25 + (50 × $5) = $275/month'}
                  </p>
                  <p className="text-muted-foreground">
                    {isAr ? 'بدون رسوم إعداد · إلغاء في أي وقت' : 'No setup fees · cancel anytime'}
                  </p>
                </div>
              </CardContent>
              <CardFooter className="flex flex-col gap-3">
                <Button className="w-full rounded-full shadow-lg" size="lg" asChild>
                  <Link to="/auth?signup=true" className="flex items-center justify-center gap-2">
                    {isAr ? 'ابدأ مجاناً' : 'Start Free'}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </CardFooter>
            </Card>

            {/* STUDENT AI UPGRADE */}
            <Card className="bg-card border border-border relative">
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-accent text-accent-foreground px-4 py-1 rounded-full text-sm font-bold">
                {isAr ? 'إضافة اختيارية' : 'OPTIONAL ADD-ON'}
              </div>
              <CardHeader className="text-center pt-8">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <Sparkles className="h-6 w-6 text-primary" />
                  <span className="text-lg font-semibold">{isAr ? 'ترقية الذكاء الاصطناعي للطالب' : 'Student AI Upgrade'}</span>
                </div>
                <CardTitle className="text-4xl font-bold">
                  {isAr ? '$6/شهرياً' : '$6/month'}
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  {isAr ? 'لكل طالب · توليد ذكاء اصطناعي غير محدود' : 'Per student · unlimited AI generation'}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-sm text-muted-foreground">
                  {isAr
                    ? 'تتضمن خطة المدرسة حصة ذكاء اصطناعي سخية لكل طالب. هذه الترقية للطلاب الذين يحتاجون أكثر.'
                    : 'The School Plan includes a generous AI quota per student. This upgrade is for students who want unlimited usage beyond that.'}
                </p>
                <ul className="space-y-3">
                  {upgradeFeatures.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-foreground">
                      <CheckCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>
                <div className="bg-muted p-4 rounded-lg text-sm">
                  <p className="text-muted-foreground">
                    {isAr
                      ? 'متاح للطلاب وأولياء الأمور بعد تسجيل المدرسة.'
                      : 'Available to students and parents once their school is enrolled.'}
                  </p>
                </div>
              </CardContent>
              <CardFooter>
                <Button variant="outline" className="w-full rounded-full" size="lg" asChild>
                  <Link to="/auth?signup=true">{isAr ? 'تعرّف أكثر' : 'Learn more'}</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="text-center mt-12 p-8 bg-card border border-border rounded-2xl shadow-lg max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-4">
              {isAr ? 'مدرسة كبيرة؟ لنتحدث.' : 'Larger school? Let\'s talk.'}
            </h2>
            <p className="text-muted-foreground mb-6">
              {isAr ? 'تسعير مخصص ودعم تنفيذ متاح للمدارس بأكثر من 500 طالب.' : 'Custom pricing and implementation support available for schools with 500+ students.'}
            </p>
            <Button size="lg" className="rounded-full shadow-lg" asChild>
              <Link to="/auth?signup=true">{isAr ? 'احجز عرضاً توضيحياً' : 'Book a demo'}</Link>
            </Button>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PublicPricing;
