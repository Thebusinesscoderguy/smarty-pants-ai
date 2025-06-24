
import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, Clock, Play, Pause, RotateCcw } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { RoleSelection } from '@/components/RoleSelection';

const Demo = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get('role');
  const [showRoleSelection, setShowRoleSelection] = useState(!role);
  const [demoStarted, setDemoStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(15 * 60); // 15 minutes in seconds
  const [currentStep, setCurrentStep] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (demoStarted && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((time) => time - 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [demoStarted, isPaused, timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const schoolDemoSteps = [
    {
      title: "School Administrator Dashboard",
      description: "Welcome to your comprehensive management hub",
      content: (
        <div className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
          <h3 className="text-xl font-semibold mb-4">Dashboard Overview</h3>
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="p-4 bg-white/5 rounded-lg">
              <p className="text-2xl font-bold text-blue-400">1,247</p>
              <p className="text-sm text-gray-400">Total Students</p>
            </div>
            <div className="p-4 bg-white/5 rounded-lg">
              <p className="text-2xl font-bold text-green-400">89%</p>
              <p className="text-sm text-gray-400">Engagement Rate</p>
            </div>
          </div>
          <p className="text-white/70">Track student progress, manage curricula, and analyze performance metrics across your entire institution.</p>
        </div>
      )
    },
    {
      title: "Student Management System",
      description: "Efficiently manage your student body",
      content: (
        <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
          <h3 className="text-xl font-semibold mb-4">Student Profiles</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <p className="font-medium">Emma Johnson</p>
                <p className="text-sm text-gray-400">Grade 8 • Mathematics</p>
              </div>
              <div className="text-green-400 font-semibold">92%</div>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div>
                <p className="font-medium">Alex Chen</p>
                <p className="text-sm text-gray-400">Grade 7 • Science</p>
              </div>
              <div className="text-yellow-400 font-semibold">78%</div>
            </div>
          </div>
          <p className="text-white/70 mt-4">Monitor individual student progress, identify learning gaps, and provide targeted support.</p>
        </div>
      )
    },
    {
      title: "Curriculum Management",
      description: "Create and customize learning paths",
      content: (
        <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
          <h3 className="text-xl font-semibold mb-4">Custom Curricula</h3>
          <div className="space-y-2">
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="font-medium">Advanced Mathematics Program</p>
              <div className="flex items-center justify-between mt-1">
                <p className="text-sm text-gray-400">24 lessons • 156 students enrolled</p>
                <Button size="sm" variant="outline" className="border-white/20 text-white">Edit</Button>
              </div>
            </div>
          </div>
          <p className="text-white/70 mt-4">Design curricula that align with your educational goals and standards.</p>
        </div>
      )
    }
  ];

  const studentDemoSteps = [
    {
      title: "Personal Learning Dashboard",
      description: "Your gateway to personalized education",
      content: (
        <div className="p-6 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-xl border border-blue-500/20">
          <h3 className="text-xl font-semibold mb-4">Learning Progress</h3>
          <div className="space-y-3">
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span>Mathematics</span>
                <span className="text-blue-400">78%</span>
              </div>
              <Progress value={78} className="h-2" />
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span>Science</span>
                <span className="text-green-400">65%</span>
              </div>
              <Progress value={65} className="h-2" />
            </div>
          </div>
          <p className="text-white/70 mt-4">Track your progress across all subjects with detailed analytics and personalized recommendations.</p>
        </div>
      )
    },
    {
      title: "AI Chat Assistant",
      description: "Get instant help with your studies",
      content: (
        <div className="p-6 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-xl border border-purple-500/20">
          <h3 className="text-xl font-semibold mb-4">Chat with AI Tutor</h3>
          <div className="space-y-3 mb-4">
            <div className="p-3 bg-white/5 rounded-lg">
              <p className="text-sm text-gray-400 mb-1">You</p>
              <p>Can you help me understand quadratic equations?</p>
            </div>
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <p className="text-sm text-blue-400 mb-1">AI Tutor</p>
              <p>Of course! A quadratic equation is a polynomial equation of degree 2. Let me break it down for you step by step...</p>
            </div>
          </div>
          <p className="text-white/70">Get instant, personalized explanations and help with any topic, 24/7.</p>
        </div>
      )
    },
    {
      title: "Gamified Learning",
      description: "Earn rewards and achievements",
      content: (
        <div className="p-6 bg-gradient-to-br from-green-500/10 to-emerald-500/10 rounded-xl border border-green-500/20">
          <h3 className="text-xl font-semibold mb-4">Achievements & Quests</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🏆</span>
                <div>
                  <p className="font-medium">Math Champion</p>
                  <p className="text-sm text-gray-400">Complete 50 math problems</p>
                </div>
              </div>
              <span className="text-yellow-400">47/50</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <div className="flex items-center space-x-3">
                <span className="text-2xl">🔥</span>
                <div>
                  <p className="font-medium">7-Day Streak</p>
                  <p className="text-sm text-gray-400">Study for 7 consecutive days</p>
                </div>
              </div>
              <span className="text-green-400">✓</span>
            </div>
          </div>
          <p className="text-white/70 mt-4">Stay motivated with our gamification system that makes learning fun and rewarding.</p>
        </div>
      )
    }
  ];

  const demoSteps = role === 'school' ? schoolDemoSteps : studentDemoSteps;

  const startDemo = () => {
    setDemoStarted(true);
    setTimeLeft(15 * 60);
    setCurrentStep(0);
  };

  const resetDemo = () => {
    setDemoStarted(false);
    setTimeLeft(15 * 60);
    setCurrentStep(0);
    setIsPaused(false);
  };

  const nextStep = () => {
    if (currentStep < demoSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  if (!role) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
        <Header />
        <main className="flex items-center justify-center min-h-[80vh] px-4">
          <div className="text-center">
            <h1 className="text-4xl font-bold mb-4">Choose Your Demo Experience</h1>
            <p className="text-xl text-white/70 mb-8">Select which perspective you'd like to explore</p>
            <Button onClick={() => setShowRoleSelection(true)} size="lg" className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
              Select Role
            </Button>
          </div>
        </main>
        <Footer />
        <RoleSelection isOpen={showRoleSelection} onClose={() => setShowRoleSelection(false)} mode="demo" />
      </div>
    );
  }

  const roleTitle = role === 'school' ? 'School Administration' : 'Student Learning';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white">
      <Header />
      
      <main className="px-4 py-12 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <Button
              onClick={() => navigate('/')}
              variant="outline"
              className="border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Home
            </Button>

            {demoStarted && (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2 px-4 py-2 bg-white/10 rounded-lg backdrop-blur-sm">
                  <Clock className="h-4 w-4" />
                  <span className="font-mono">{formatTime(timeLeft)}</span>
                </div>
                <Button
                  onClick={() => setIsPaused(!isPaused)}
                  variant="outline"
                  size="sm"
                  className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                >
                  {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                </Button>
                <Button
                  onClick={resetDemo}
                  variant="outline"
                  size="sm"
                  className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                >
                  <RotateCcw className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {!demoStarted ? (
            <div className="text-center">
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                {roleTitle} <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Demo</span>
              </h1>
              <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-8">
                Experience a hands-on interactive demo of TeachlyAI. You have 15 minutes to explore the features and capabilities.
              </p>
              <Button
                onClick={startDemo}
                size="lg"
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 font-semibold px-8 py-4 text-lg"
              >
                <Play className="mr-2 h-5 w-5" />
                Start Interactive Demo
              </Button>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Progress Bar */}
              <div className="w-full">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/70">Demo Progress</span>
                  <span className="text-sm text-white/70">{currentStep + 1} of {demoSteps.length}</span>
                </div>
                <Progress value={(currentStep + 1) / demoSteps.length * 100} className="h-2" />
              </div>

              {/* Current Step */}
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">{demoSteps[currentStep].title}</CardTitle>
                  <p className="text-white/70">{demoSteps[currentStep].description}</p>
                </CardHeader>
                <CardContent>
                  {demoSteps[currentStep].content}
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex items-center justify-between">
                <Button
                  onClick={prevStep}
                  disabled={currentStep === 0}
                  variant="outline"
                  className="border-white/20 bg-white/5 hover:bg-white/10 text-white disabled:opacity-50"
                >
                  Previous
                </Button>
                
                <div className="text-center">
                  <p className="text-white/60 text-sm">
                    {timeLeft <= 0 ? "Demo time expired" : `${formatTime(timeLeft)} remaining`}
                  </p>
                </div>

                <Button
                  onClick={nextStep}
                  disabled={currentStep === demoSteps.length - 1}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
                >
                  Next
                </Button>
              </div>

              {/* Time Up or Demo Complete */}
              {(timeLeft <= 0 || currentStep === demoSteps.length - 1) && (
                <Card className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 border-white/10 backdrop-blur-sm">
                  <CardContent className="text-center p-8">
                    <h3 className="text-2xl font-bold mb-4">
                      {timeLeft <= 0 ? "Demo Time Complete!" : "Demo Complete!"}
                    </h3>
                    <p className="text-white/80 mb-6">
                      Ready to experience the full power of TeachlyAI? Sign up now to continue your learning journey.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                      <Button
                        onClick={() => navigate('/auth?signup=true')}
                        className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                      >
                        Sign Up Now
                      </Button>
                      <Button
                        onClick={resetDemo}
                        variant="outline"
                        className="border-white/20 bg-white/5 hover:bg-white/10 text-white"
                      >
                        Restart Demo
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Demo;
