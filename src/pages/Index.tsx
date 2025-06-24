
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Brain, Gamepad2, BarChart, Users, Globe, Lightbulb, Target, CheckCircle, Star, MessageSquare, Zap, Shield, Clock } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RoleSelection } from '@/components/RoleSelection';
import { useLanguage } from '@/contexts/LanguageContext';

const Index = () => {
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [showDemoSelection, setShowDemoSelection] = useState(false);
  const { t } = useLanguage();

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-br from-purple-400/10 to-pink-600/10 rounded-full blur-3xl animate-pulse delay-500"></div>
      </div>

      <Header />

      <main className="relative z-10 flex-1">
        {/* Hero Section */}
        <section className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
              {t('hero.title')}
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-12 leading-relaxed">
              {t('hero.subtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-8">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 font-semibold px-8 py-4 text-lg shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
                onClick={() => setShowRoleSelection(true)}
              >
                {t('cta.start')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm font-semibold px-8 py-4 text-lg"
                onClick={() => setShowDemoSelection(true)}
              >
                {t('cta.demo')}
                <BookOpen className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('features.section.title')}</h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                {t('features.section.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              <div className="p-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all duration-300 backdrop-blur-sm">
                <Brain className="h-12 w-12 text-blue-400 mb-6" />
                <h3 className="text-xl font-semibold mb-4">{t('features.adaptive.title')}</h3>
                <p className="text-white/70 leading-relaxed">
                  {t('features.adaptive.desc')}
                </p>
              </div>

              <div className="p-8 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-300 backdrop-blur-sm">
                <MessageSquare className="h-12 w-12 text-purple-400 mb-6" />
                <h3 className="text-xl font-semibold mb-4">{t('features.voice.title')}</h3>
                <p className="text-white/70 leading-relaxed">
                  {t('features.voice.desc')}
                </p>
              </div>

              <div className="p-8 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:from-green-500/20 hover:to-emerald-500/20 transition-all duration-300 backdrop-blur-sm">
                <Lightbulb className="h-12 w-12 text-green-400 mb-6" />
                <h3 className="text-xl font-semibold mb-4">{t('features.content.title')}</h3>
                <p className="text-white/70 leading-relaxed">
                  {t('features.content.desc')}
                </p>
              </div>

              <div className="p-8 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 hover:from-orange-500/20 hover:to-red-500/20 transition-all duration-300 backdrop-blur-sm">
                <Gamepad2 className="h-12 w-12 text-orange-400 mb-6" />
                <h3 className="text-xl font-semibold mb-4">{t('features.gamified.title')}</h3>
                <p className="text-white/70 leading-relaxed">
                  {t('features.gamified.desc')}
                </p>
              </div>

              <div className="p-8 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20 hover:from-teal-500/20 hover:to-cyan-500/20 transition-all duration-300 backdrop-blur-sm">
                <BarChart className="h-12 w-12 text-teal-400 mb-6" />
                <h3 className="text-xl font-semibold mb-4">{t('features.analytics.title')}</h3>
                <p className="text-white/70 leading-relaxed">
                  {t('features.analytics.desc')}
                </p>
              </div>

              <div className="p-8 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 hover:from-indigo-500/20 hover:to-purple-500/20 transition-all duration-300 backdrop-blur-sm">
                <Users className="h-12 w-12 text-indigo-400 mb-6" />
                <h3 className="text-xl font-semibold mb-4">{t('features.collaborative.title')}</h3>
                <p className="text-white/70 leading-relaxed">
                  {t('features.collaborative.desc')}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Subject Coverage */}
        <section className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Comprehensive Subject Coverage</h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                From elementary concepts to advanced topics, our AI tutors cover every subject with depth and expertise.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { icon: "📚", title: "Mathematics", desc: "Algebra, Calculus, Statistics, Geometry" },
                { icon: "🔬", title: "Sciences", desc: "Physics, Chemistry, Biology, Environmental" },
                { icon: "📖", title: "Literature", desc: "Reading, Writing, Critical Analysis" },
                { icon: "🌍", title: "Social Studies", desc: "History, Geography, Civics, Economics" },
                { icon: "💻", title: "Technology", desc: "Programming, Digital Literacy, AI" },
                { icon: "🎨", title: "Arts", desc: "Visual Arts, Music, Creative Expression" },
                { icon: "🗣️", title: "Languages", desc: "English, Spanish, French, Mandarin" },
                { icon: "🏃", title: "Health & PE", desc: "Physical Education, Health Sciences" }
              ].map((subject, index) => (
                <div key={index} className="p-6 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 text-center backdrop-blur-sm">
                  <div className="text-4xl mb-4">{subject.icon}</div>
                  <h3 className="text-lg font-semibold mb-2 text-white">{subject.title}</h3>
                  <p className="text-white/60 text-sm">{subject.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Advanced Features */}
        <section className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Advanced Learning Features</h2>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-blue-500/20 rounded-lg">
                    <Target className="h-6 w-6 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Adaptive Learning Paths</h3>
                    <p className="text-white/70">
                      Our AI creates personalized learning journeys that adapt in real-time based on student performance, interests, and learning goals.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-green-500/20 rounded-lg">
                    <Zap className="h-6 w-6 text-green-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Instant Feedback System</h3>
                    <p className="text-white/70">
                      Receive immediate, constructive feedback on assignments, quizzes, and activities to accelerate learning and understanding.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-purple-500/20 rounded-lg">
                    <Shield className="h-6 w-6 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">Safe Learning Environment</h3>
                    <p className="text-white/70">
                      COPPA-compliant platform with robust privacy protections and content filtering to ensure a safe educational experience.
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="p-2 bg-orange-500/20 rounded-lg">
                    <Clock className="h-6 w-6 text-orange-400" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold mb-2">24/7 Availability</h3>
                    <p className="text-white/70">
                      Learn at your own pace, anytime, anywhere. Our AI tutors are available around the clock to support your educational journey.
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
                <div className="text-center mb-6">
                  <h3 className="text-2xl font-bold mb-2">Achievement System</h3>
                  <p className="text-white/70">
                    Unlock badges, climb leaderboards, and celebrate milestones as you progress through your learning journey.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white/80">Daily Learning Streak</span>
                    <span className="text-yellow-400 font-semibold">🔥 Progress</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white/80">Problems Solved</span>
                    <span className="text-green-400 font-semibold">⚡ Tracking</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white/80">Current Level</span>
                    <span className="text-blue-400 font-semibold">🏆 Growing</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">What Educators Are Saying</h2>
              <p className="text-xl text-white/70">Real feedback from teachers, parents, and students using TeachlyAI</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  name: "Sarah Chen",
                  role: "5th Grade Teacher",
                  content: "TeachlyAI has transformed my classroom. Students are more engaged than ever, and I can track their progress in real-time. The AI adapts to each student's needs perfectly.",
                  rating: 5
                },
                {
                  name: "Michael Rodriguez",
                  role: "Parent of Two",
                  content: "My kids actually look forward to homework now! The gamification features make learning fun, and I love getting detailed progress reports on their strengths and areas for improvement.",
                  rating: 5
                },
                {
                  name: "Dr. Emily Johnson",
                  role: "School Principal",
                  content: "We've seen significant improvement in student engagement since implementing TeachlyAI. The analytics help us make data-driven decisions about our curriculum and teaching methods.",
                  rating: 5
                }
              ].map((testimonial, index) => (
                <div key={index} className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-white/80 mb-4 italic">"{testimonial.content}"</p>
                  <div>
                    <p className="text-white font-semibold">{testimonial.name}</p>
                    <p className="text-white/60 text-sm">{testimonial.role}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="pricing" className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Choose Your Learning Plan</h2>
              <p className="text-xl text-white/70">Flexible pricing options for individuals, families, and institutions</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="p-8 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-4">{t('pricing.individual')}</h3>
                <div className="text-4xl font-bold mb-6">{t('pricing.individual.price')}<span className="text-lg text-white/60">{t('pricing.month')}</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Unlimited AI tutoring</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Progress tracking</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Gamification features</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Mobile app access</li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  {t('pricing.get.started')}
                </Button>
              </div>

              <div className="p-8 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/50 backdrop-blur-sm relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  {t('pricing.most.popular')}
                </div>
                <h3 className="text-2xl font-bold mb-4">{t('pricing.family')}</h3>
                <div className="text-4xl font-bold mb-6">{t('pricing.family.price')}<span className="text-lg text-white/60">{t('pricing.month')}</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Up to 4 student profiles</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Parent dashboard</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />All Individual features</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Priority support</li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  {t('pricing.get.started')}
                </Button>
              </div>

              <div className="p-8 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-4">{t('pricing.school')}</h3>
                <div className="text-4xl font-bold mb-6">{t('pricing.school.price')}<span className="text-lg text-white/60">{t('pricing.month')}</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Base subscription</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />+$5 per additional account</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Admin dashboard</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Dedicated support</li>
                </ul>
                <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">
                  {t('pricing.contact.sales')}
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Frequently Asked Questions</h2>
            </div>

            <div className="space-y-6">
              {[
                {
                  question: "How does the AI tutoring system work?",
                  answer: "Our AI analyzes your learning style, pace, and preferences to create personalized lessons. It uses natural language processing to understand your questions and provides explanations tailored to your level of understanding."
                },
                {
                  question: "Is TeachlyAI suitable for all age groups?",
                  answer: "Yes! TeachlyAI adapts content complexity based on the learner's age, grade level, and ability. We support learners from elementary school through college and adult education."
                },
                {
                  question: "How do you ensure student data privacy?",
                  answer: "We are COPPA and FERPA compliant with end-to-end encryption for all data. Student information is never shared with third parties, and parents have complete control over their child's data."
                },
                {
                  question: "Can teachers integrate TeachlyAI with existing curricula?",
                  answer: "Absolutely! Teachers can upload their own materials, align with standards-based curricula, and customize learning paths to match their teaching objectives and school requirements."
                },
                {
                  question: "What subjects and grade levels do you cover?",
                  answer: "We cover all core subjects (Math, Science, English, Social Studies) plus specialized areas like coding, foreign languages, and arts for grades K-12 and beyond."
                },
                {
                  question: "How does the gamification system motivate students?",
                  answer: "Students earn points, badges, and achievements for completing lessons and reaching milestones. Our system includes daily challenges, progress streaks, and friendly competition to maintain engagement."
                }
              ].map((faq, index) => (
                <div key={index} className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <h3 className="text-lg font-semibold mb-3 text-white">{faq.question}</h3>
                  <p className="text-white/70 leading-relaxed">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('about.title')}</h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                {t('about.subtitle')}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-6">{t('about.vision.title')}</h3>
                <p className="text-white/80 leading-relaxed mb-6">
                  {t('about.vision.desc1')}
                </p>
                <p className="text-white/80 leading-relaxed">
                  {t('about.vision.desc2')}
                </p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-2xl p-8 border border-white/10 backdrop-blur-sm">
                <div className="text-center">
                  <h3 className="text-2xl font-bold mb-6">Our Impact</h3>
                  <p className="text-white/70 mb-6">
                    Making personalized education accessible worldwide through advanced AI technology and innovative learning approaches.
                  </p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-lg text-center">
                      <div className="text-2xl font-bold text-blue-400 mb-1">AI-Powered</div>
                      <div className="text-white/70 text-sm">Learning Experience</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg text-center">
                      <div className="text-2xl font-bold text-green-400 mb-1">Global</div>
                      <div className="text-white/70 text-sm">Accessibility</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg text-center">
                      <div className="text-2xl font-bold text-purple-400 mb-1">Adaptive</div>
                      <div className="text-white/70 text-sm">Curriculum</div>
                    </div>
                    <div className="p-4 bg-white/5 rounded-lg text-center">
                      <div className="text-2xl font-bold text-orange-400 mb-1">Real-time</div>
                      <div className="text-white/70 text-sm">Analytics</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('contact.title')}</h2>
              <p className="text-xl text-white/70">
                {t('contact.subtitle')}
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12">
              <div className="space-y-8">
                <div>
                  <h3 className="text-xl font-semibold mb-4">Contact Information</h3>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-blue-500/20 rounded-lg">
                        <MessageSquare className="h-5 w-5 text-blue-400" />
                      </div>
                      <div>
                        <p className="text-white/60 text-sm">Email</p>
                        <p className="text-white">support@teachlyai.com</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500/20 rounded-lg">
                        <Globe className="h-5 w-5 text-green-400" />
                      </div>
                      <div>
                        <p className="text-white/60 text-sm">Website</p>
                        <p className="text-white">www.teachlyai.com</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-xl font-semibold mb-4">Office Hours</h3>
                  <div className="space-y-2 text-white/70">
                    <p>Monday - Friday: 9:00 AM - 6:00 PM PST</p>
                    <p>Saturday: 10:00 AM - 4:00 PM PST</p>
                    <p>Sunday: Closed</p>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 rounded-xl p-8 border border-white/10 backdrop-blur-sm">
                <form className="space-y-6">
                  <div>
                    <label className="block text-white/80 mb-2">Name</label>
                    <input 
                      type="text" 
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 mb-2">Email</label>
                    <input 
                      type="email" 
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400"
                      placeholder="your@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-white/80 mb-2">Message</label>
                    <textarea 
                      rows={4}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:border-blue-400 resize-none"
                      placeholder="How can we help you?"
                    />
                  </div>
                  <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                    Send Message
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-12 border border-white/10 backdrop-blur-sm">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">{t('final.cta.title')}</h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                {t('final.cta.subtitle')}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 font-semibold px-8 py-4 text-lg"
                  onClick={() => setShowRoleSelection(true)}
                >
                  {t('final.cta.trial')}
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm font-semibold px-8 py-4 text-lg"
                  onClick={() => setShowDemoSelection(true)}
                >
                  {t('final.cta.demo')}
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />

      <RoleSelection 
        isOpen={showRoleSelection} 
        onClose={() => setShowRoleSelection(false)} 
      />
    </div>
  );
};

export default Index;
