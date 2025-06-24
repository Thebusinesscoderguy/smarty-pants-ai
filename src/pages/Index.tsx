
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight, BookOpen, Brain, Gamepad2, BarChart, Users, Globe, Lightbulb, Target, Award, CheckCircle, Star, MessageSquare, Zap, Shield, Clock } from 'lucide-react';
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
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-16">
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Powerful Features for Modern Learning</h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Experience cutting-edge educational technology designed to make learning engaging, effective, and accessible to everyone.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              <div className="p-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all duration-300 backdrop-blur-sm">
                <Brain className="h-12 w-12 text-blue-400 mb-6" />
                <h3 className="text-xl font-semibold mb-4">{t('features.adaptive.title')}</h3>
                <p className="text-white/70 leading-relaxed">
                  Our AI adapts to each student's learning style, pace, and preferences, creating truly personalized educational experiences that evolve with the learner.
                </p>
              </div>

              <div className="p-8 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-300 backdrop-blur-sm">
                <MessageSquare className="h-12 w-12 text-purple-400 mb-6" />
                <h3 className="text-xl font-semibold mb-4">{t('features.voice.title')}</h3>
                <p className="text-white/70 leading-relaxed">
                  Engage in natural conversations with our AI tutor through voice or text, making learning as easy as having a conversation with a knowledgeable friend.
                </p>
              </div>

              <div className="p-8 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:from-green-500/20 hover:to-emerald-500/20 transition-all duration-300 backdrop-blur-sm">
                <Lightbulb className="h-12 w-12 text-green-400 mb-6" />
                <h3 className="text-xl font-semibold mb-4">{t('features.content.title')}</h3>
                <p className="text-white/70 leading-relaxed">
                  Upload any document, image, or resource and our AI instantly creates interactive lessons, quizzes, and learning materials tailored to the content.
                </p>
              </div>

              <div className="p-8 rounded-xl bg-gradient-to-br from-orange-500/10 to-red-500/10 border border-orange-500/20 hover:from-orange-500/20 hover:to-red-500/20 transition-all duration-300 backdrop-blur-sm">
                <Gamepad2 className="h-12 w-12 text-orange-400 mb-6" />
                <h3 className="text-xl font-semibold mb-4">Gamified Learning Journey</h3>
                <p className="text-white/70 leading-relaxed">
                  Transform education into an adventure with quests, achievements, leaderboards, and rewards that motivate students to reach their full potential.
                </p>
              </div>

              <div className="p-8 rounded-xl bg-gradient-to-br from-teal-500/10 to-cyan-500/10 border border-teal-500/20 hover:from-teal-500/20 hover:to-cyan-500/20 transition-all duration-300 backdrop-blur-sm">
                <BarChart className="h-12 w-12 text-teal-400 mb-6" />
                <h3 className="text-xl font-semibold mb-4">Advanced Analytics</h3>
                <p className="text-white/70 leading-relaxed">
                  Comprehensive insights into learning progress, strengths, weaknesses, and recommendations for improvement with detailed visual analytics.
                </p>
              </div>

              <div className="p-8 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 hover:from-indigo-500/20 hover:to-purple-500/20 transition-all duration-300 backdrop-blur-sm">
                <Users className="h-12 w-12 text-indigo-400 mb-6" />
                <h3 className="text-xl font-semibold mb-4">Collaborative Environment</h3>
                <p className="text-white/70 leading-relaxed">
                  Connect students, teachers, and parents in a unified platform that promotes collaboration, communication, and shared learning goals.
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
                  <Award className="h-16 w-16 text-yellow-400 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold mb-2">Achievement System</h3>
                  <p className="text-white/70">
                    Unlock badges, climb leaderboards, and celebrate milestones as you progress through your learning journey.
                  </p>
                </div>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white/80">Daily Learning Streak</span>
                    <span className="text-yellow-400 font-semibold">🔥 15 days</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white/80">Problems Solved</span>
                    <span className="text-green-400 font-semibold">⚡ 247</span>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <span className="text-white/80">Current Level</span>
                    <span className="text-blue-400 font-semibold">🏆 Expert</span>
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
                  content: "We've seen a 40% improvement in student engagement since implementing TeachlyAI. The analytics help us make data-driven decisions about our curriculum and teaching methods.",
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
                <h3 className="text-2xl font-bold mb-4">Individual</h3>
                <div className="text-4xl font-bold mb-6">$19<span className="text-lg text-white/60">/month</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Unlimited AI tutoring</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Progress tracking</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Gamification features</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Mobile app access</li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                  Get Started
                </Button>
              </div>

              <div className="p-8 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-2 border-purple-500/50 backdrop-blur-sm relative">
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-4 py-1 rounded-full text-sm font-semibold">
                  Most Popular
                </div>
                <h3 className="text-2xl font-bold mb-4">Family</h3>
                <div className="text-4xl font-bold mb-6">$39<span className="text-lg text-white/60">/month</span></div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Up to 4 student profiles</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Parent dashboard</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />All Individual features</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Priority support</li>
                </ul>
                <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600">
                  Get Started
                </Button>
              </div>

              <div className="p-8 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm">
                <h3 className="text-2xl font-bold mb-4">School</h3>
                <div className="text-4xl font-bold mb-6">Custom</div>
                <ul className="space-y-3 mb-8">
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Unlimited students</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Admin dashboard</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Custom curricula</li>
                  <li className="flex items-center"><CheckCircle className="h-5 w-5 text-green-400 mr-3" />Dedicated support</li>
                </ul>
                <Button variant="outline" className="w-full border-white/30 text-white hover:bg-white/10">
                  Contact Sales
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6">About TeachlyAI</h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                We're on a mission to democratize quality education through artificial intelligence, making personalized learning accessible to every student, everywhere.
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <h3 className="text-2xl font-bold mb-6">Our Vision</h3>
                <p className="text-white/80 leading-relaxed mb-6">
                  We believe every student deserves access to personalized, high-quality education. Our AI-powered platform adapts to individual learning styles, making education more effective, engaging, and accessible than ever before.
                </p>
                <p className="text-white/80 leading-relaxed">
                  Founded by educators and technologists, TeachlyAI combines decades of teaching experience with cutting-edge artificial intelligence to create learning experiences that truly work for every student.
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-6">
                <div className="p-6 rounded-xl bg-blue-500/10 border border-blue-500/20 text-center backdrop-blur-sm">
                  <div className="text-3xl font-bold text-blue-400 mb-2">50K+</div>
                  <div className="text-white/70">Active Students</div>
                </div>
                <div className="p-6 rounded-xl bg-green-500/10 border border-green-500/20 text-center backdrop-blur-sm">
                  <div className="text-3xl font-bold text-green-400 mb-2">1M+</div>
                  <div className="text-white/70">Lessons Completed</div>
                </div>
                <div className="p-6 rounded-xl bg-purple-500/10 border border-purple-500/20 text-center backdrop-blur-sm">
                  <div className="text-3xl font-bold text-purple-400 mb-2">95%</div>
                  <div className="text-white/70">Satisfaction Rate</div>
                </div>
                <div className="p-6 rounded-xl bg-orange-500/10 border border-orange-500/20 text-center backdrop-blur-sm">
                  <div className="text-3xl font-bold text-orange-400 mb-2">24/7</div>
                  <div className="text-white/70">AI Support</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="px-4 py-20 md:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Get in Touch</h2>
              <p className="text-xl text-white/70">
                Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
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
              <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Learning?</h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of students, teachers, and parents who are already experiencing the future of education with TeachlyAI.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  size="lg" 
                  className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 font-semibold px-8 py-4 text-lg"
                  onClick={() => setShowRoleSelection(true)}
                >
                  Start Your Free Trial
                </Button>
                <Button 
                  size="lg" 
                  variant="outline" 
                  className="border-white/30 bg-white/10 text-white hover:bg-white/20 backdrop-blur-sm font-semibold px-8 py-4 text-lg"
                  onClick={() => setShowDemoSelection(true)}
                >
                  Watch Demo
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
        mode="signup"
      />

      <RoleSelection 
        isOpen={showDemoSelection} 
        onClose={() => setShowDemoSelection(false)} 
        mode="demo"
      />
    </div>
  );
};

export default Index;
