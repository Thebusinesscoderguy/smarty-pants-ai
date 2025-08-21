import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { 
  Brain, MessageSquare, BookOpen, Gamepad2, BarChart, Users, 
  Globe, Lightbulb, Target, CheckCircle, Star, Zap, Shield, 
  Clock, Mic, Upload, Camera, PlayCircle, Trophy, TrendingUp,
  FileText, Settings, Monitor, Smartphone, Tablet, Headphones,
  PenTool, Calculator, Languages, GraduationCap, Award,
  ChevronRight, ArrowRight, Play
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';

const Features = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
      <Header />
      
      <main className="px-4 py-12 md:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          {/* Hero Section */}
          <div className="text-center mb-16">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Complete Learning Platform Features
            </h1>
            <p className="text-xl text-white/80 max-w-4xl mx-auto mb-8 leading-relaxed">
              Discover our comprehensive suite of AI-powered tools designed to revolutionize education. 
              From intelligent tutoring to advanced analytics, we provide everything needed for personalized learning success.
            </p>
            <Button 
              size="lg" 
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
              onClick={() => navigate('/auth')}
            >
              Start Learning Today
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Feature Categories */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4 bg-white/10 border border-white/20 mb-12">
              <TabsTrigger value="overview" className="text-xs md:text-sm">Overview</TabsTrigger>
              <TabsTrigger value="ai-tutoring" className="text-xs md:text-sm">AI Tutoring</TabsTrigger>
              <TabsTrigger value="tools" className="text-xs md:text-sm">Study Tools</TabsTrigger>
              <TabsTrigger value="analytics" className="text-xs md:text-sm">Analytics</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="mt-8">
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                <Card className="bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all duration-300">
                  <CardHeader>
                    <Brain className="h-12 w-12 text-blue-400 mb-4" />
                    <CardTitle>Advanced AI Tutoring</CardTitle>
                    <CardDescription className="text-white/70">
                      Personalized learning with GPT-5 powered AI that adapts to your learning style, provides instant feedback, and guides you through complex concepts step-by-step in 15+ languages.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-white/80">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        Natural language conversations
                      </div>
                      <div className="flex items-center text-sm text-white/80">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        Multi-language support (15+ languages)
                      </div>
                      <div className="flex items-center text-sm text-white/80">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        Socratic method teaching
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-300">
                  <CardHeader>
                    <BookOpen className="h-12 w-12 text-purple-400 mb-4" />
                    <CardTitle>Smart Study Tools</CardTitle>
                    <CardDescription className="text-white/70">
                      AI-generated quizzes, personalized study plans, interactive lessons, and adaptive learning paths tailored to your progress with multilingual support.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-white/80">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        Auto-generated quizzes
                      </div>
                      <div className="flex items-center text-sm text-white/80">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        Personalized study plans
                      </div>
                      <div className="flex items-center text-sm text-white/80">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        Interactive learning modules
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:from-green-500/20 hover:to-emerald-500/20 transition-all duration-300">
                  <CardHeader>
                    <Languages className="h-12 w-12 text-green-400 mb-4" />
                    <CardTitle>Global Language Support</CardTitle>
                    <CardDescription className="text-white/70">
                      Complete platform localization with AI responses, study materials, quizzes, and learning content available in 15+ languages including Spanish, French, German, Chinese, and more.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-white/80">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        AI responses in your language
                      </div>
                      <div className="flex items-center text-sm text-white/80">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        Localized study materials
                      </div>
                      <div className="flex items-center text-sm text-white/80">
                        <CheckCircle className="h-4 w-4 text-green-400 mr-2" />
                        Cultural context awareness
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* AI Tutoring Tab */}
            <TabsContent value="ai-tutoring" className="mt-8">
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="bg-white/5 border border-white/10">
                  <CardHeader>
                    <Languages className="h-8 w-8 text-purple-400 mb-2" />
                    <CardTitle>Multi-Language AI Tutoring</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80 mb-4">
                      Our AI tutor communicates fluently in 15+ languages, providing culturally appropriate responses and educational content in your native language.
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <Badge variant="outline">🇺🇸 English</Badge>
                      <Badge variant="outline">🇪🇸 Spanish</Badge>
                      <Badge variant="outline">🇫🇷 French</Badge>
                      <Badge variant="outline">🇩🇪 German</Badge>
                      <Badge variant="outline">🇮🇹 Italian</Badge>
                      <Badge variant="outline">🇯🇵 Japanese</Badge>
                      <Badge variant="outline">🇰🇷 Korean</Badge>
                      <Badge variant="outline">🇨🇳 Chinese</Badge>
                      <Badge variant="outline">🇷🇺 Russian</Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border border-white/10">
                  <CardHeader>
                    <Brain className="h-8 w-8 text-blue-400 mb-2" />
                    <CardTitle>Advanced AI Intelligence</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80 mb-4">
                      Powered by GPT-5 technology for human-like conversations, deep subject understanding, and personalized teaching approaches that adapt to your learning style.
                    </p>
                    <div className="space-y-2">
                      <Badge variant="outline" className="mr-2">Socratic Method</Badge>
                      <Badge variant="outline" className="mr-2">Adaptive Learning</Badge>
                      <Badge variant="outline">Instant Feedback</Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Study Tools Tab */}
            <TabsContent value="tools" className="mt-8">
              <div className="grid lg:grid-cols-3 gap-8">
                <Card className="bg-white/5 border border-white/10">
                  <CardHeader>
                    <FileText className="h-8 w-8 text-blue-400 mb-2" />
                    <CardTitle>AI Quiz Generator</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80 text-sm mb-4">
                      Generate personalized quizzes in any language from uploaded content, voice input, or topic descriptions.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-white/70">
                        <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                        Multilingual quiz generation
                      </div>
                      <div className="flex items-center text-sm text-white/70">
                        <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                        Difficulty adaptation
                      </div>
                      <div className="flex items-center text-sm text-white/70">
                        <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                        Instant grading & feedback
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border border-white/10">
                  <CardHeader>
                    <Mic className="h-8 w-8 text-pink-400 mb-2" />
                    <CardTitle>Voice Learning</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80 text-sm mb-4">
                      Natural voice conversations with AI tutors in multiple languages, speech-to-text input, and text-to-speech responses.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-white/70">
                        <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                        Multilingual voice support
                      </div>
                      <div className="flex items-center text-sm text-white/70">
                        <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                        Accent recognition
                      </div>
                      <div className="flex items-center text-sm text-white/70">
                        <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                        Audio lesson content
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border border-white/10">
                  <CardHeader>
                    <BookOpen className="h-8 w-8 text-purple-400 mb-2" />
                    <CardTitle>Localized Study Plans</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80 text-sm mb-4">
                      Create comprehensive study plans with daily lessons in your preferred language, adapted to local educational standards.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-white/70">
                        <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                        Regional curriculum alignment
                      </div>
                      <div className="flex items-center text-sm text-white/70">
                        <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                        Cultural context integration
                      </div>
                      <div className="flex items-center text-sm text-white/70">
                        <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                        Native language content
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Analytics Tab */}
            <TabsContent value="analytics" className="mt-8">
              <div className="grid md:grid-cols-2 gap-8">
                <Card className="bg-white/5 border border-white/10">
                  <CardHeader>
                    <BarChart className="h-8 w-8 text-teal-400 mb-2" />
                    <CardTitle>Comprehensive Analytics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80 mb-4">
                      Track learning progress with detailed analytics, performance insights, and personalized recommendations available in your preferred language.
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-2 bg-gradient-to-r from-green-400 to-blue-400 rounded-full"></div>
                        <span className="text-sm text-white/80">Mathematics: 87% Mastery</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-6 h-2 bg-gradient-to-r from-yellow-400 to-orange-400 rounded-full"></div>
                        <span className="text-sm text-white/80">Science: 65% Progress</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-white/5 border border-white/10">
                  <CardHeader>
                    <Users className="h-8 w-8 text-indigo-400 mb-2" />
                    <CardTitle>Multi-User Management</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-white/80 mb-4">
                      Family and school management with parent dashboards, teacher controls, and student monitoring in multiple languages.
                    </p>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-white/70">
                        <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                        Multilingual parent dashboard
                      </div>
                      <div className="flex items-center text-sm text-white/70">
                        <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                        Localized reports
                      </div>
                      <div className="flex items-center text-sm text-white/70">
                        <CheckCircle className="h-3 w-3 text-green-400 mr-2" />
                        Cultural preferences
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>

          {/* Call to Action */}
          <div className="text-center mt-16 p-8 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-2xl border border-white/10">
            <h2 className="text-3xl font-bold mb-4">Ready to Experience Next-Gen Learning?</h2>
            <p className="text-white/80 mb-6 max-w-2xl mx-auto">
              Join thousands of students, families, and schools already transforming their educational journey with our AI-powered platform available in 15+ languages.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                onClick={() => navigate('/auth')}
              >
                Start Free Trial
                <Play className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg"
                onClick={() => navigate('/demo')}
              >
                Try Demo First
                <ChevronRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Features;