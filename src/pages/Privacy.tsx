import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useLanguage } from '@/contexts/LanguageContext';

const Privacy = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className="min-h-screen bg-background text-foreground" dir={isAr ? 'rtl' : 'ltr'}>
      <Header />
      <main className="container mx-auto px-6 py-16 max-w-3xl">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">
          {isAr ? 'سياسة الخصوصية' : 'Privacy Policy'}
        </h1>
        <p className="text-muted-foreground mb-10">
          {isAr ? 'آخر تحديث: 6 مايو 2026' : 'Last updated: May 6, 2026'}
        </p>

        <div className="prose prose-neutral max-w-none space-y-6 text-foreground/90 leading-relaxed">
          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-3">{isAr ? '1. من نحن' : '1. Who we are'}</h2>
            <p>
              {isAr
                ? 'Teachly منصة تعليمية تعتمد على الذكاء الاصطناعي للمدارس والمعلمين والطلاب وأولياء الأمور. تتولى Teachly مسؤولية حماية بياناتك الشخصية.'
                : 'Teachly is an AI-powered education platform for schools, teachers, students, and parents. Teachly is the controller responsible for your personal data.'}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-3">{isAr ? '2. البيانات التي نجمعها' : '2. Data we collect'}</h2>
            <ul className="list-disc ms-6 space-y-2">
              <li>{isAr ? 'بيانات الحساب: الاسم، البريد الإلكتروني، الدور، المدرسة، الصف.' : 'Account data: name, email, role, school, grade level.'}</li>
              <li>{isAr ? 'محتوى تعليمي: الإجابات، الواجبات، الاختبارات، خطط الدراسة، رسائل المحادثة.' : 'Learning content: answers, assignments, quizzes, study plans, chat messages.'}</li>
              <li>{isAr ? 'الملفات التي ترفعها لتوليد المحتوى التعليمي.' : 'Files you upload to generate learning content.'}</li>
              <li>{isAr ? 'بيانات استخدام: الصفحات التي تزورها وأوقات الاستخدام.' : 'Usage data: pages visited and timestamps.'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-3">{isAr ? '3. كيف نستخدم البيانات' : '3. How we use data'}</h2>
            <ul className="list-disc ms-6 space-y-2">
              <li>{isAr ? 'تشغيل المنصة وتقديم الميزات الأساسية.' : 'To operate the platform and deliver core features.'}</li>
              <li>{isAr ? 'إنشاء محتوى تعليمي مخصص باستخدام الذكاء الاصطناعي.' : 'To generate personalized learning content via AI.'}</li>
              <li>{isAr ? 'إرسال إشعارات الحساب والمصادقة عبر البريد الإلكتروني.' : 'To send account, authentication, and notification emails.'}</li>
              <li>{isAr ? 'تحسين الجودة والأمان.' : 'To improve quality and security.'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-3">{isAr ? '4. مزودو الخدمة' : '4. Service providers'}</h2>
            <p className="mb-3">
              {isAr ? 'نستخدم مزودي الخدمة التاليين، الذين يلتزمون بمعايير حماية بيانات صارمة:' : 'We use the following sub-processors, all bound by strict data-protection standards:'}
            </p>
            <ul className="list-disc ms-6 space-y-2">
              <li><strong>Supabase</strong> — {isAr ? 'استضافة قاعدة البيانات وتخزين الملفات والمصادقة.' : 'database hosting, file storage, authentication.'}</li>
              <li><strong>Resend</strong> — {isAr ? 'إرسال البريد الإلكتروني المعاملاتي.' : 'transactional email delivery.'}</li>
              <li><strong>OpenAI / Google Gemini</strong> — {isAr ? 'توليد المحتوى التعليمي بالذكاء الاصطناعي.' : 'AI-powered learning-content generation.'}</li>
              <li><strong>Stripe / PayPal</strong> — {isAr ? 'معالجة المدفوعات.' : 'payment processing.'}</li>
              <li><strong>DeepL</strong> — {isAr ? 'الترجمة الآلية لواجهة المستخدم.' : 'machine translation for the UI.'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-3">{isAr ? '5. ما لا نفعله' : '5. What we never do'}</h2>
            <ul className="list-disc ms-6 space-y-2">
              <li>{isAr ? 'لا نبيع بياناتك أبداً.' : 'We never sell your data.'}</li>
              <li>{isAr ? 'لا نستخدم بيانات الطلاب لتدريب نماذج ذكاء اصطناعي خارجية.' : 'We do not use student data to train third-party AI models.'}</li>
              <li>{isAr ? 'لا نعرض إعلانات لأي مستخدم.' : 'We do not show ads to any user.'}</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-3">{isAr ? '6. حقوقك' : '6. Your rights'}</h2>
            <p>
              {isAr
                ? 'يحق لك الوصول إلى بياناتك أو تصحيحها أو حذفها أو تصديرها. للتواصل: privacy@teachlyai.com.'
                : 'You may access, correct, delete, or export your data. Contact: privacy@teachlyai.com.'}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-3">{isAr ? '7. حسابات المدارس والقاصرين' : '7. School accounts and minors'}</h2>
            <p>
              {isAr
                ? 'تُنشأ حسابات الطلاب القاصرين عبر مدارسهم بموافقة موثقة. تتحكم المدرسة في الوصول وإلغاء التفعيل.'
                : 'Student accounts for minors are created by their schools with documented consent. Schools control access and deactivation.'}
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold mt-8 mb-3">{isAr ? '8. التواصل' : '8. Contact'}</h2>
            <p>privacy@teachlyai.com</p>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Privacy;
