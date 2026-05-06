import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

const Terms = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isAr ? 'rtl' : 'ltr'}>
      <Header />
      <main className="container mx-auto px-6 py-16 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {isAr ? 'شروط الاستخدام' : 'Terms of Service'}
        </h1>
        <p className="text-muted-foreground mb-10">
          {isAr ? 'آخر تحديث: 6 مايو 2026' : 'Last updated: May 6, 2026'}
        </p>

        <div className="prose prose-neutral max-w-none space-y-6 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-3">{isAr ? '1. قبول الشروط' : '1. Acceptance'}</h2>
            <p>
              {isAr
                ? 'باستخدامك Teachly فإنك توافق على هذه الشروط. إذا كنت تستخدم المنصة نيابة عن مدرسة، فأنت تؤكد أنك مفوض بذلك.'
                : 'By using Teachly you agree to these Terms. If you use the platform on behalf of a school, you confirm you are authorized to bind that school.'}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-3">{isAr ? '2. الحسابات' : '2. Accounts'}</h2>
            <p>
              {isAr
                ? 'أنت مسؤول عن أمان حسابك والحفاظ على سرية بيانات الدخول. يجب أن تكون المعلومات التي تقدمها دقيقة وحديثة.'
                : 'You are responsible for keeping your credentials confidential and your account information accurate.'}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-3">{isAr ? '3. الاستخدام المقبول' : '3. Acceptable use'}</h2>
            <ul className="list-disc ms-6 space-y-2">
              <li>{isAr ? 'لا تستخدم المنصة لأي غرض غير قانوني أو ضار.' : 'Do not use the platform for unlawful or harmful purposes.'}</li>
              <li>{isAr ? 'لا تحاول التحايل على أنظمة الأمان أو وضع الامتحان.' : 'Do not attempt to bypass security or exam-mode protections.'}</li>
              <li>{isAr ? 'لا ترفع محتوى ينتهك حقوق الآخرين أو يحتوي على برامج ضارة.' : 'Do not upload content that infringes others’ rights or contains malware.'}</li>
              <li>{isAr ? 'لا تسيء استخدام مولدات الذكاء الاصطناعي لإنشاء محتوى مسيء أو مضلل.' : 'Do not misuse AI generators to produce abusive or deceptive content.'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-3">{isAr ? '4. المحتوى الذي تنشئه' : '4. Content you create'}</h2>
            <p>
              {isAr
                ? 'تحتفظ بملكية المحتوى الذي ترفعه أو تنشئه. تمنحنا ترخيصاً محدوداً لاستخدامه فقط لتقديم خدمات Teachly لك ولمدرستك.'
                : 'You retain ownership of content you upload or create. You grant us a limited license to use it solely to provide Teachly services to you and your school.'}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-3">{isAr ? '5. عقود المدارس' : '5. School agreements'}</h2>
            <p>
              {isAr
                ? 'تخضع حسابات المدارس لعقد منفصل يشمل نطاق الخدمة وعدد الطلاب والفوترة. تسود شروط العقد عند أي تعارض.'
                : 'School accounts are governed by a separate agreement covering scope, student count, and billing. The school agreement controls in case of conflict.'}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-3">{isAr ? '6. الفوترة' : '6. Billing'}</h2>
            <p>
              {isAr
                ? 'الاشتراكات الفردية تُجدد تلقائياً ما لم يتم إلغاؤها. اشتراكات المدارس تُفوتر وفق العقد. لا توجد استردادات للفترات الجزئية.'
                : 'Individual subscriptions auto-renew unless cancelled. School subscriptions are invoiced under contract. No refunds for partial periods.'}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-3">{isAr ? '7. الإنهاء' : '7. Termination'}</h2>
            <p>
              {isAr
                ? 'يمكننا تعليق أو إنهاء الحسابات التي تنتهك هذه الشروط. يمكنك إغلاق حسابك في أي وقت من الإعدادات.'
                : 'We may suspend or terminate accounts that violate these Terms. You may close your account at any time from Settings.'}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-3">{isAr ? '8. إخلاء المسؤولية' : '8. Disclaimer'}</h2>
            <p>
              {isAr
                ? 'يُقدم المحتوى الناتج عن الذكاء الاصطناعي للأغراض التعليمية وقد يحتوي على أخطاء. تحقق دائماً قبل الاعتماد عليه في القرارات الأكاديمية.'
                : 'AI-generated content is for educational purposes and may contain errors. Always verify before relying on it for academic decisions.'}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-3">{isAr ? '9. التواصل' : '9. Contact'}</h2>
            <p>support@teachlyai.com</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Terms;
