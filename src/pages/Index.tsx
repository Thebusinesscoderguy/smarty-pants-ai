import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Play, Loader2, ArrowRight, CheckCircle, Users, Award, BookOpen, Zap, Shield, Globe, Brain, Target, Clock, Mic, MessageSquare, PieChart, Gamepad2, School, GraduationCap, Camera, FileText, Headphones, Sparkles } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ContactForm } from '@/components/contact/ContactForm';
import { RoleSelection } from '@/components/RoleSelection';
import { CurriculumSelector } from '@/components/CurriculumSelector';
import { useNavigate } from 'react-router-dom';
import { runSystemTests } from '@/utils/systemTester';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

const Index = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [showRoleSelection, setShowRoleSelection] = useState(false);
  const [showDemoSelection, setShowDemoSelection] = useState(false);
  const [showCurriculumSelector, setShowCurriculumSelector] = useState(false);

  const handleRunSystemTests = async () => {
    setIsRunningTests(true);
    
    try {
      toast({
        title: "Running System Tests",
        description: "Testing all APIs and integrations...",
      });

      const results = await runSystemTests();

      const totalTests = results.reduce((sum, suite) => sum + suite.totalTests, 0);
      const failedTests = results.reduce((sum, suite) => sum + suite.failedTests, 0);

      if (failedTests > 0) {
        toast({
          title: "Tests Completed with Issues",
          description: `${failedTests} out of ${totalTests} tests failed. Check system test page for details.`,
          variant: "destructive"
        });
      } else {
        toast({
          title: "All Tests Passed!",
          description: `${totalTests} tests completed successfully.`,
        });
      }

      navigate('/system-test');
    } catch (error: any) {
      toast({
        title: "Test Execution Failed",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setIsRunningTests(false);
    }
  };

  const handleCurriculumSelect = (curriculum: any) => {
    if (curriculum) {
      console.log('Selected curriculum:', curriculum);
      // Navigate to chat with selected curriculum
      navigate('/auth', { state: { selectedCurriculum: curriculum } });
    } else {
      // Navigate to custom curriculum creation
      navigate('/auth', { state: { createCustom: true } });
    }
    setShowCurriculumSelector(false);
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

      <main className="relative z-10 flex-1 px-4 py-12 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <div className="mb-8">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight">
                {t('hero.title')}
              </h1>
              <p className="text-xl md:text-2xl text-white/80 max-w-4xl mx-auto mb-12 leading-relaxed">
                {t('hero.subtitle')}
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-16">
              <Button 
                size="lg" 
                onClick={() => setShowCurriculumSelector(true)}
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 px-8 py-4 text-lg font-semibold shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
              >
                {t('cta.start')}
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              
              <Button 
                variant="outline"
                size="lg" 
                onClick={() => setShowDemoSelection(true)}
                className="border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 py-4 text-lg font-semibold backdrop-blur-sm transition-all duration-300"
              >
                <Play className="mr-2 h-5 w-5" />
                {t('cta.demo')}
              </Button>
              
              <Button 
                variant="outline"
                size="lg" 
                onClick={handleRunSystemTests}
                disabled={isRunningTests}
                className="border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white px-8 py-4 text-lg font-semibold backdrop-blur-sm transition-all duration-300"
              >
                {isRunningTests ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Testing Platform...
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-5 w-5" />
                    {t('cta.test')}
                  </>
                )}
              </Button>
            </div>

            {/* Interactive Video Preview */}
            <div className="relative max-w-5xl mx-auto mb-20">
              <div className="relative rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-gradient-to-br from-white/5 to-white/10 backdrop-blur-sm">
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
                  <Button
                    onClick={() => setShowDemoSelection(true)}
                    className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-full p-8 backdrop-blur-sm transition-all duration-300 hover:scale-110 shadow-2xl z-10"
                    size="icon"
                  >
                    <Play className="h-12 w-12" />
                  </Button>
                  <div className="absolute bottom-4 left-4 right-4 bg-black/40 backdrop-blur-sm rounded-lg p-4">
                    <p className="text-white/90 text-sm">Watch TeachlyAI in action - See how AI adapts to different learning styles in real-time</p>
                  </div>
                </div>
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none"></div>
              </div>
            </div>
          </div>

          {/* Core Features Showcase */}
          <div className="grid md:grid-cols-3 gap-8 mb-20">
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all duration-300 backdrop-blur-sm">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🧠</div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">Adaptive Intelligence</h3>
              <p className="text-white/70 leading-relaxed mb-4">Our proprietary AI engine continuously analyzes learning patterns, comprehension speed, and knowledge retention to dynamically adjust content difficulty, pacing, and teaching methods in real-time.</p>
              <ul className="text-sm text-white/60 space-y-2">
                <li>• Real-time difficulty adjustment</li>
                <li>• Learning style recognition</li>
                <li>• Personalized content sequencing</li>
                <li>• Intelligent knowledge gap detection</li>
              </ul>
            </div>
            
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-300 backdrop-blur-sm">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">🎤</div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">Natural Voice Learning</h3>
              <p className="text-white/70 leading-relaxed mb-4">Engage in natural conversations with your AI tutor using advanced speech recognition and synthesis. Practice pronunciation, ask questions verbally, and receive immediate spoken feedback.</p>
              <ul className="text-sm text-white/60 space-y-2">
                <li>• Multi-language speech recognition</li>
                <li>• Natural conversation flow</li>
                <li>• Pronunciation coaching</li>
                <li>• Hands-free learning experience</li>
              </ul>
            </div>
            
            <div className="group p-8 rounded-2xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:from-green-500/20 hover:to-emerald-500/20 transition-all duration-300 backdrop-blur-sm">
              <div className="text-5xl mb-6 group-hover:scale-110 transition-transform duration-300">📚</div>
              <h3 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent">Smart Content Analysis</h3>
              <p className="text-white/70 leading-relaxed mb-4">Upload any document, textbook, or study material and watch as our AI instantly creates interactive lessons, quizzes, and study guides tailored to your learning objectives.</p>
              <ul className="text-sm text-white/60 space-y-2">
                <li>• PDF & document processing</li>
                <li>• Automatic quiz generation</li>
                <li>• Key concept extraction</li>
                <li>• Interactive study guides</li>
              </ul>
            </div>
          </div>

          {/* Advanced Features Deep Dive */}
          <div className="mb-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Comprehensive Learning Ecosystem
              </h2>
              <p className="text-xl text-white/70 max-w-4xl mx-auto">
                TeachlyAI offers a complete suite of advanced learning tools designed to address every aspect of modern education, from individual study sessions to institutional management.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-12 items-start">
              <div className="space-y-8">
                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                    <MessageSquare className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Interactive AI Conversations</h3>
                    <p className="text-white/70 mb-3">Engage in Socratic dialogues with your AI tutor that guides you to discover answers through thoughtful questioning rather than simple information transfer.</p>
                    <ul className="text-sm text-white/60 space-y-1">
                      <li>• Context-aware conversations</li>
                      <li>• Socratic method teaching</li>
                      <li>• Multi-turn problem solving</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
                    <Gamepad2 className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Gamified Achievement System</h3>
                    <p className="text-white/70 mb-3">Transform learning into an engaging adventure with comprehensive quest systems, achievement badges, and progress tracking that motivates continuous improvement.</p>
                    <ul className="text-sm text-white/60 space-y-1">
                      <li>• Dynamic quest generation</li>
                      <li>• Skill-based achievements</li>
                      <li>• Progress visualization</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                    <PieChart className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Advanced Analytics Dashboard</h3>
                    <p className="text-white/70 mb-3">Comprehensive insights into learning patterns, knowledge retention, and skill development with detailed analytics for students, parents, and educators.</p>
                    <ul className="text-sm text-white/60 space-y-1">
                      <li>• Learning pattern analysis</li>
                      <li>• Retention rate tracking</li>
                      <li>• Performance predictions</li>
                    </ul>
                  </div>
                </div>

                <div className="flex gap-4">
                  <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-r from-orange-500 to-red-600 rounded-xl flex items-center justify-center">
                    <Camera className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white mb-3">Visual Learning Recognition</h3>
                    <p className="text-white/70 mb-3">Take photos of handwritten notes, diagrams, or textbook pages and receive instant AI-powered explanations and interactive lessons based on the visual content.</p>
                    <ul className="text-sm text-white/60 space-y-1">
                      <li>• Handwriting recognition</li>
                      <li>• Diagram interpretation</li>
                      <li>• Visual content analysis</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-3xl p-8 backdrop-blur-sm border border-white/20">
                  <div className="grid grid-cols-2 gap-6">
                    <div className="bg-black/20 rounded-xl p-6 text-center">
                      <Brain className="h-10 w-10 text-purple-400 mx-auto mb-3" />
                      <div className="text-lg font-semibold text-white mb-1">AI-Powered</div>
                      <div className="text-sm text-white/60">Advanced machine learning algorithms</div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-6 text-center">
                      <Shield className="h-10 w-10 text-green-400 mx-auto mb-3" />
                      <div className="text-lg font-semibold text-white mb-1">Privacy First</div>
                      <div className="text-sm text-white/60">COPPA & GDPR compliant</div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-6 text-center">
                      <Globe className="h-10 w-10 text-blue-400 mx-auto mb-3" />
                      <div className="text-lg font-semibold text-white mb-1">Multilingual</div>
                      <div className="text-sm text-white/60">Support for 50+ languages</div>
                    </div>
                    <div className="bg-black/20 rounded-xl p-6 text-center">
                      <Zap className="h-10 w-10 text-yellow-400 mx-auto mb-3" />
                      <div className="text-lg font-semibold text-white mb-1">Adaptive Speed</div>
                      <div className="text-sm text-white/60">Learns your optimal pace</div>
                    </div>
                  </div>
                  
                  <div className="mt-8 p-6 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-xl border border-white/10">
                    <h4 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-yellow-400" />
                      Latest AI Innovations
                    </h4>
                    <ul className="text-sm text-white/70 space-y-2">
                      <li>• GPT-4 powered conversational learning</li>
                      <li>• Real-time speech synthesis and recognition</li>
                      <li>• Computer vision for document analysis</li>
                      <li>• Predictive learning path optimization</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Learning Subjects & Capabilities */}
          <div className="mb-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Comprehensive Subject Coverage
              </h2>
              <p className="text-xl text-white/70 max-w-4xl mx-auto">
                From elementary concepts to advanced university-level topics, TeachlyAI provides expert tutoring across all major academic disciplines.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[
                { icon: "🔢", title: "Mathematics", desc: "Algebra to Calculus", color: "from-blue-500/20 to-cyan-500/20 border-blue-500/30" },
                { icon: "🧪", title: "Sciences", desc: "Physics, Chemistry, Biology", color: "from-green-500/20 to-emerald-500/20 border-green-500/30" },
                { icon: "📚", title: "Literature", desc: "Reading, Writing, Analysis", color: "from-purple-500/20 to-pink-500/20 border-purple-500/30" },
                { icon: "🌍", title: "Social Studies", desc: "History, Geography, Civics", color: "from-orange-500/20 to-red-500/20 border-orange-500/30" },
                { icon: "💻", title: "Computer Science", desc: "Programming, Algorithms", color: "from-indigo-500/20 to-purple-500/20 border-indigo-500/30" },
                { icon: "🎨", title: "Arts & Design", desc: "Creative expression", color: "from-pink-500/20 to-rose-500/20 border-pink-500/30" },
                { icon: "🗣️", title: "Languages", desc: "50+ languages supported", color: "from-teal-500/20 to-cyan-500/20 border-teal-500/30" },
                { icon: "📈", title: "Test Prep", desc: "SAT, ACT, AP exams", color: "from-yellow-500/20 to-orange-500/20 border-yellow-500/30" }
              ].map((subject, index) => (
                <div key={index} className={`p-6 rounded-xl bg-gradient-to-br ${subject.color} backdrop-blur-sm hover:scale-105 transition-all duration-300`}>
                  <div className="text-3xl mb-3">{subject.icon}</div>
                  <h3 className="font-semibold text-white mb-2">{subject.title}</h3>
                  <p className="text-sm text-white/70">{subject.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Real User Success Stories */}
          <div className="mb-20">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">
                Transforming Lives Through AI Education
              </h2>
              <p className="text-xl text-white/70 max-w-3xl mx-auto">
                Real stories from students, teachers, and parents who have experienced the power of personalized AI learning.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    S
                  </div>
                  <div>
                    <div className="font-semibold text-white">Sarah Chen</div>
                    <div className="text-sm text-white/60">High School Junior</div>
                    <div className="text-xs text-blue-400">Math Achievement Unlocked</div>
                  </div>
                </div>
                <p className="text-white/80 italic mb-4">
                  "I went from struggling with basic algebra to mastering calculus concepts in just six months. The AI understood exactly where I was getting confused and broke down complex problems into steps I could actually follow. My confidence in math has completely transformed."
                </p>
                <div className="flex items-center gap-2 text-sm text-green-400">
                  <Target className="h-4 w-4" />
                  <span>Grade improvement: C+ to A-</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    M
                  </div>
                  <div>
                    <div className="font-semibold text-white">Ms. Rodriguez</div>
                    <div className="text-sm text-white/60">5th Grade Teacher</div>
                    <div className="text-xs text-purple-400">Classroom Integration Expert</div>
                  </div>
                </div>
                <p className="text-white/80 italic mb-4">
                  "TeachlyAI has revolutionized how I understand my students' progress. The detailed analytics show me exactly which concepts each child has mastered and where they need support. I can now provide truly personalized instruction to all 28 students in my class."
                </p>
                <div className="flex items-center gap-2 text-sm text-blue-400">
                  <Users className="h-4 w-4" />
                  <span>Student engagement increased 40%</span>
                </div>
              </div>

              <div className="bg-gradient-to-br from-white/10 to-white/5 rounded-2xl p-8 backdrop-blur-sm border border-white/20">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-14 h-14 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    D
                  </div>
                  <div>
                    <div className="font-semibold text-white">David Park</div>
                    <div className="text-sm text-white/60">Parent of Two</div>
                    <div className="text-xs text-green-400">Family Learning Coordinator</div>
                  </div>
                </div>
                <p className="text-white/80 italic mb-4">
                  "Both my kids learn completely differently - one is visual, the other learns by talking through problems. TeachlyAI adapted to each of their styles automatically. As a parent, the insight dashboard helps me support their learning without overwhelming them."
                </p>
                <div className="flex items-center gap-2 text-sm text-yellow-400">
                  <Award className="h-4 w-4" />
                  <span>Family study time more effective</span>
                </div>
              </div>
            </div>
          </div>

          {/* Comprehensive FAQ Section */}
          <div className="mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-12 text-center bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent">Everything You Need to Know</h2>
            <div className="space-y-6 max-w-4xl mx-auto">
              {[
                {
                  question: "How does TeachlyAI's adaptive learning technology actually work?",
                  answer: "TeachlyAI uses advanced machine learning algorithms to continuously analyze your learning patterns, response times, comprehension levels, and knowledge retention. The system identifies your optimal learning pace, preferred explanation styles, and areas where you need additional support. It then automatically adjusts content difficulty, teaching methods, and practice frequency to match your unique learning profile. The AI also recognizes when you're ready to advance to more challenging material and when you need more reinforcement of foundational concepts."
                },
                {
                  question: "What makes TeachlyAI different from other online learning platforms?",
                  answer: "Unlike traditional online courses that follow a fixed curriculum, TeachlyAI creates a completely personalized learning path for each student. Our AI tutor engages in natural conversations, answers questions in real-time, and adapts its teaching style based on how you learn best. The platform combines voice interaction, visual learning, gamification, and comprehensive analytics in a seamless experience. Additionally, our AI can process and teach from your own materials - textbooks, notes, or documents - creating custom lessons tailored to your specific curriculum."
                },
                {
                  question: "How comprehensive is the subject matter coverage?",
                  answer: "TeachlyAI covers all major academic subjects from elementary through university level, including Mathematics (arithmetic through advanced calculus), Sciences (physics, chemistry, biology, earth science), Literature and Writing, Social Studies, Computer Science, Foreign Languages, and test preparation for standardized exams. The AI can also assist with specialized topics, research projects, and interdisciplinary studies. New subject areas and advanced topics are continuously added based on user needs and educational trends."
                },
                {
                  question: "What privacy and safety measures protect student data?",
                  answer: "Student privacy and data security are our highest priorities. TeachlyAI is fully compliant with COPPA, FERPA, and GDPR regulations. All student data is encrypted both in transit and at rest using enterprise-grade security measures. We never sell or share personal information with third parties for marketing purposes. Parents and educators have full control over data access and can request data deletion at any time. Our AI models are trained on anonymized datasets, and individual student responses are not used to train models for other users."
                },
                {
                  question: "How do parents and teachers monitor student progress?",
                  answer: "TeachlyAI provides comprehensive dashboards for both parents and educators with detailed insights into learning progress, time spent studying, topics mastered, areas needing improvement, and achievement milestones. Real-time notifications alert guardians to significant progress or challenges. Teachers can access classroom-wide analytics to identify trends and adjust instruction accordingly. All monitoring features respect student privacy while providing the transparency needed for effective support."
                },
                {
                  question: "Can TeachlyAI integrate with existing school systems and curricula?",
                  answer: "Yes, TeachlyAI is designed to complement and enhance existing educational systems rather than replace them. The platform can align with specific state standards, school curricula, and textbook series. Teachers can create assignments that sync with their lesson plans, and the AI can adapt to match the pacing and emphasis of classroom instruction. Integration APIs allow connection with popular learning management systems (LMS) and student information systems (SIS)."
                },
                {
                  question: "What technical requirements are needed to use TeachlyAI?",
                  answer: "TeachlyAI works on any device with an internet connection - computers, tablets, or smartphones. The platform is web-based, so no special software installation is required. For optimal voice interaction features, a microphone and speakers (or headphones) are recommended. The system works with all modern web browsers and automatically adapts to different screen sizes. Offline study modes are available for core content when internet connectivity is limited."
                },
                {
                  question: "How does the pricing structure work for schools versus individual families?",
                  answer: "TeachlyAI offers flexible pricing options for different needs.The pricing model includes institutional discounts for schools and districts, with special considerations for Title I schools and underserved communities. Free trial periods allow families and schools to experience the full platform before committing. Detailed pricing information is available through our contact form, as costs vary based on the number of users and specific feature requirements."
                }
              ].map((faq, index) => (
                <div key={index} className="p-6 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-all duration-300">
                  <h3 className="text-xl font-semibold mb-4 text-white flex items-start gap-3">
                    <span className="flex-shrink-0 w-6 h-6 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-xs font-bold">
                      {index + 1}
                    </span>
                    {faq.question}
                  </h3>
                  <p className="text-white/70 leading-relaxed pl-9">{faq.answer}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Enhanced Call to Action Section */}
          <div className="text-center mb-20">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-3xl p-12 md:p-16 border border-white/10 backdrop-blur-sm">
              <div className="max-w-4xl mx-auto">
                <h2 className="text-4xl md:text-6xl font-bold mb-6">
                  Ready to Transform Education?
                </h2>
                <p className="text-xl text-white/90 mb-8 max-w-3xl mx-auto leading-relaxed">
                  Join thousands of students, teachers, and families who are already experiencing the future of personalized learning. Start your AI-powered educational journey today and discover how technology can unlock every learner's potential.
                </p>
                
                <div className="grid md:grid-cols-3 gap-6 mb-10">
                  <div className="p-6 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Clock className="h-8 w-8 text-blue-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-white mb-2">Instant Setup</h3>
                    <p className="text-sm text-white/70">Start learning in under 2 minutes with our streamlined onboarding process</p>
                  </div>
                  <div className="p-6 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Shield className="h-8 w-8 text-green-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-white mb-2">Risk-Free Trial</h3>
                    <p className="text-sm text-white/70">Full access to all features with no commitment required</p>
                  </div>
                  <div className="p-6 bg-white/10 rounded-xl backdrop-blur-sm">
                    <Headphones className="h-8 w-8 text-purple-400 mx-auto mb-3" />
                    <h3 className="font-semibold text-white mb-2">Expert Support</h3>
                    <p className="text-sm text-white/70">24/7 technical support and educational guidance from our team</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-6 justify-center">
                  <Button 
                    size="lg" 
                    onClick={() => setShowRoleSelection(true)}
                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 font-semibold px-10 py-5 text-xl shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
                  >
                    Begin Your Learning Adventure
                    <ArrowRight className="ml-2 h-6 w-6" />
                  </Button>
                  <Button 
                    variant="outline"
                    size="lg" 
                    onClick={() => setShowDemoSelection(true)}
                    className="border-2 border-white/20 bg-white/5 hover:bg-white/10 text-white px-10 py-5 text-xl font-semibold backdrop-blur-sm transition-all duration-300"
                  >
                    <Play className="mr-2 h-6 w-6" />
                    Experience the Demo
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <ContactForm />
        </div>
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

      <CurriculumSelector
        isOpen={showCurriculumSelector}
        onClose={() => setShowCurriculumSelector(false)}
        onSelect={handleCurriculumSelect}
      />
    </div>
  );
};

export default Index;
