import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { MessageCircle } from 'lucide-react';

const FAQ = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* FAQ Section */}
      <section className="py-12 md:py-16">
        <div className="container mx-auto px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-12">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-sm mb-6">
                <MessageCircle className="h-4 w-4 text-primary" />
                <span className="text-sm font-semibold text-primary">Frequently Asked Questions</span>
              </div>
              <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
                Got Questions? We've Got Answers
              </h1>
              <p className="text-xl text-muted-foreground">
                Everything you need to know about Smarty Pants AI
              </p>
            </div>

            {/* School Registration FAQ */}
            <div className="mb-12">
              <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">For Schools: Registering Directly</h2>
              <div className="grid md:grid-cols-2 gap-6">
                <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-3 text-foreground">How does my school sign up?</h3>
                    <p className="text-muted-foreground">
                      Click "Register your school" anywhere on the site to create your principal/admin account directly. No sales call, no demo booking, no waiting list — you go straight from signup into your school dashboard. The whole process takes about 2 minutes.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-3 text-foreground">What happens immediately after signup?</h3>
                    <p className="text-muted-foreground">
                      Your school workspace is provisioned instantly. You're dropped into a guided onboarding wizard that walks you through choosing your curriculum framework, importing your student roster, inviting teachers, and setting up your gradebook — all in one session.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-3 text-foreground">How quickly is access provisioned?</h3>
                    <p className="text-muted-foreground">
                      Immediately. Admin access is live the moment you finish signup. Teachers and students get access as soon as they accept their email invitation — typically within minutes. There's no manual approval step on our end.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-3 text-foreground">How do I add my teachers and students?</h3>
                    <p className="text-muted-foreground">
                      From the admin dashboard you can bulk-import students via CSV or add them manually, then invite teachers by email and assign them to subject-sections. Invitation emails are sent automatically and include a secure registration link.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-3 text-foreground">Do I need to talk to sales first?</h3>
                    <p className="text-muted-foreground">
                      No. Schools register and start using the platform on their own — same as a teacher or parent would. Pricing is transparent ($25 base + $5 per student), and you can explore the full admin suite before committing. If you want to talk to us, we're available, but it's never required.
                    </p>
                  </CardContent>
                </Card>

                <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-3 text-foreground">What if I get stuck during onboarding?</h3>
                    <p className="text-muted-foreground">
                      The onboarding checklist saves your progress at every step, so you can leave and return anytime. In-app help is available throughout, and our support team responds to admin questions within one business day.
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>

            <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">General Questions</h2>
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-foreground">What makes Smarty Pants AI unique?</h3>
                  <p className="text-muted-foreground">
                    Smarty Pants AI isn't just a chatbot—it's a complete learning platform. It combines AI-powered tutoring with structured study plans, gamified challenges, and dashboards for parents and teachers to monitor progress. ChatGPT can answer questions, but it doesn't organize learning, track progress, or motivate students with achievements.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-foreground">How do study plans work?</h3>
                  <p className="text-muted-foreground">
                    Our AI creates personalized study plans based on your curriculum, learning pace, and goals. It breaks down topics into manageable daily sessions, suggests practice quizzes, and adapts based on your performance. You'll never feel overwhelmed—just steady, guided progress.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-foreground">What types of quizzes are available?</h3>
                  <p className="text-muted-foreground">
                    Generate quizzes from any topic, uploaded files, or even your chat conversations. Choose multiple choice, true/false, or open-ended questions. The AI tracks your performance and identifies weak areas to focus on, making every quiz a learning opportunity.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-foreground">How does parent monitoring work?</h3>
                  <p className="text-muted-foreground">
                    Parents get a comprehensive dashboard showing their child's study time, quiz scores, topics covered, strengths and weaknesses. You can see real progress analytics, not just login times. Stay informed without micromanaging—perfect for busy families.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-foreground">What gamification features do you offer?</h3>
                  <p className="text-muted-foreground">
                    Earn XP points, unlock achievements, complete daily and weekly quests, and compete on leaderboards. Students can level up by completing lessons, acing quizzes, and maintaining study streaks. Learning becomes engaging and rewarding, not a chore.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-foreground">Which curricula do you support?</h3>
                  <p className="text-muted-foreground">
                    We support major international curricula including IGCSE, A-Levels, IB, American Common Core, AP, and more. Content is aligned to curriculum standards, ensuring students learn exactly what they need for their exams and coursework.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-foreground">Can I upload my own study materials?</h3>
                  <p className="text-muted-foreground">
                    Absolutely! Upload PDFs, documents, images, and more. The AI will analyze them and help you study from your own materials. Generate quizzes from your notes, get explanations of complex concepts, and create custom study plans from any content.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-foreground">What age groups is this suitable for?</h3>
                  <p className="text-muted-foreground">
                    Smarty Pants AI works for students from age 10 to university level. The AI adapts its language, explanations, and difficulty based on the student's level. From middle school math to advanced physics, we've got you covered.
                  </p>
                </CardContent>
              </Card>

              <Card className="bg-card border-border hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-3 text-foreground">How does the free trial work?</h3>
                  <p className="text-muted-foreground">
                    Start with a 7-day free trial with full access to all features—no credit card required. Explore AI tutoring, create study plans, take quizzes, and see the parent dashboard. If you love it, subscribe. If not, no obligations.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FAQ;
