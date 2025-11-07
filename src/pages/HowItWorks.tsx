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
      title: "Create Your Account & Select Your Role",
      description: "Sign up and choose whether you're a student, parent, or school administrator. Each role gets a customized dashboard tailored to their needs.",
      icon: UserPlus,
      details: [
        "Student accounts get access to AI tutoring, quizzes, and gamification features",
        "Parent accounts can monitor multiple children's progress and receive detailed analytics",
        "School admins can manage entire classes, assign content, and track institution-wide performance"
      ]
    },
    {
      number: 2,
      title: "Set Up Your Learning Profile",
      description: "Customize your learning experience by selecting your grade level, preferred curriculum (e.g., IB, GCSE, US Common Core), and subjects of interest.",
      icon: Target,
      details: [
        "Choose from multiple international curricula adapted to your educational system",
        "Select specific subjects you want to focus on",
        "Set learning goals and preferences for personalized content delivery"
      ]
    },
    {
      number: 3,
      title: "Start Learning with AI Tutor",
      description: "Engage in one-on-one conversations with your AI tutor using text or voice. Ask questions, get explanations, and explore topics at your own pace.",
      icon: MessageSquare,
      details: [
        "Natural conversation flow - ask questions just like you would with a human tutor",
        "Get detailed explanations with step-by-step breakdowns of complex concepts",
        "Receive instant feedback and clarifications on any topic",
        "Switch between text and voice interaction seamlessly"
      ]
    },
    {
      number: 4,
      title: "Generate & Take Quizzes",
      description: "Transform your learning conversations into interactive quizzes. Upload documents or create quizzes from scratch on any topic.",
      icon: Mic,
      details: [
        "AI automatically generates quizzes from your chat conversations",
        "Upload PDFs, images, or documents to create topic-specific quizzes",
        "Adjust difficulty levels and question counts to match your needs",
        "Get instant grading and detailed explanations for each answer"
      ]
    },
    {
      number: 5,
      title: "Create Personalized Study Plans",
      description: "Generate AI-powered study plans tailored to your learning goals, schedule, and curriculum requirements with day-by-day breakdowns.",
      icon: TrendingUp,
      details: [
        "AI creates comprehensive study schedules based on your topics and available time",
        "Get daily learning objectives with specific goals and activities",
        "Combine study plans with quizzes for a complete learning experience",
        "Save and revisit your study plans anytime from your library"
      ]
    },
    {
      number: 6,
      title: "Track Progress & Analytics",
      description: "Monitor your learning journey with comprehensive analytics, performance metrics, and detailed insights into your strengths and weaknesses.",
      icon: TrendingUp,
      details: [
        "Real-time dashboards showing quiz scores, time spent, and topic mastery",
        "AI-generated insights identifying your strengths and areas for improvement",
        "Visual progress tracking across all subjects and learning activities",
        "Parents receive detailed reports on their children's learning activities"
      ]
    },
    {
      number: 7,
      title: "Earn Rewards & Complete Quests",
      description: "Stay motivated with gamification features including achievement badges, experience points, and subject-specific quests that make learning fun.",
      icon: Trophy,
      details: [
        "Complete quests to earn XP and unlock achievement badges",
        "Level up in different subjects as you master new topics",
        "Compete with yourself through progress tracking and milestone celebrations",
        "Administrators can create custom quests for their students"
      ]
    }
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground">
      <Header />
      
      <main className="flex-1 px-4 md:px-6 py-12">
        {/* Hero Section */}
        <div className="max-w-7xl mx-auto text-center mb-16">
          <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
            {t('howItWorks.title')}
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto mb-8">
            {t('howItWorks.subtitle')}
          </p>
          <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg" size="lg" asChild>
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
                  <div className="w-32 h-32 bg-primary rounded-full flex items-center justify-center relative shadow-lg">
                    <div className="absolute -top-4 -right-4 w-12 h-12 bg-card border-2 border-primary text-foreground rounded-full flex items-center justify-center font-bold text-xl shadow-md">
                      {step.number}
                    </div>
                    <step.icon className="h-12 w-12 text-primary-foreground" />
                  </div>
                  {/* Connector Line */}
                  {index < steps.length - 1 && (
                    <div className="absolute top-32 left-1/2 transform -translate-x-1/2 w-0.5 h-12 bg-gradient-to-b from-primary to-transparent hidden lg:block" />
                  )}
                </div>

                {/* Content */}
                <Card className="flex-1 bg-card border-border hover:shadow-lg transition-all duration-300">
                  <CardContent className="p-8">
                    <div className="flex items-start justify-between mb-4">
                      <h3 className="text-2xl md:text-3xl font-bold text-foreground mb-3">
                        {step.title}
                      </h3>
                      <ArrowRight className="h-6 w-6 text-primary hidden md:block flex-shrink-0 mt-1" />
                    </div>
                    <p className="text-lg text-muted-foreground mb-6 leading-relaxed">
                      {step.description}
                    </p>
                    <ul className="space-y-3">
                      {step.details.map((detail, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-foreground">
                          <Check className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
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
        <div className="max-w-4xl mx-auto text-center mt-20 p-12 bg-card border border-border rounded-3xl shadow-xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
            {t('howItWorks.cta.title')}
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            {t('howItWorks.cta.desc')}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-full shadow-lg" size="lg" asChild>
              <Link to="/auth">{t('howItWorks.startNow')}</Link>
            </Button>
            <Button variant="outline" className="border-2 border-border hover:bg-muted rounded-full" size="lg" asChild>
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
