
import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { PlayCircle, Pause, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useNavigate } from 'react-router-dom';

const Demo = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const role = searchParams.get('role') || 'parent';
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const videoDemoRef = useRef<HTMLDivElement>(null);

  const schoolSlides = [
    {
      title: "School Admin Dashboard",
      description: "Comprehensive overview of all students, classes, and performance metrics",
      image: "/images/school-admin-dashboard.png",
      audioText: "Welcome to the school admin dashboard - your command center for managing students, tracking performance, and overseeing educational programs across your institution."
    },
    {
      title: "Student Management System",
      description: "Manage student enrollment, track progress, and communicate with parents",
      image: "/images/student-dashboard.png",
      audioText: "Efficiently manage your student body with detailed profiles, progress tracking, and seamless communication tools for parents and guardians."
    },
    {
      title: "Analytics & Reporting",
      description: "Advanced analytics to understand learning patterns and optimize curriculum",
      image: "/images/quests-achievements.png",
      audioText: "Gain deep insights into learning patterns with comprehensive analytics and reporting tools that help you optimize your curriculum and teaching methods."
    }
  ];

  const parentSlides = [
    {
      title: "Student Learning Dashboard",
      description: "Your child's personalized learning hub with progress tracking and achievements",
      image: "/images/student-dashboard.png",
      audioText: "Welcome to your child's learning dashboard - track their progress, celebrate achievements, and stay connected with their educational journey."
    },
    {
      title: "Gamified Learning Experience",
      description: "Complete quests, earn achievements, and unlock rewards while learning",
      image: "/images/quests-achievements.png",
      audioText: "Experience gamified learning with engaging quests, achievement systems, and rewards that make education fun and motivating for students."
    },
    {
      title: "AI-Powered Chat Assistance",
      description: "Get instant help with homework and concepts through intelligent AI tutoring",
      image: "/images/ai-chat-interface.png",
      audioText: "Access intelligent AI tutoring anytime with our chat interface that provides personalized help and explanations tailored to your learning needs."
    }
  ];

  const videoSlides = role === 'school' ? schoolSlides : parentSlides;

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVideoPlaying) {
            startVideoDemo();
          }
        });
      },
      { threshold: 0.6 }
    );

    if (videoDemoRef.current) {
      observer.observe(videoDemoRef.current);
    }

    return () => {
      if (videoDemoRef.current) {
        observer.unobserve(videoDemoRef.current);
      }
    };
  }, [isVideoPlaying]);

  const generateAudio = async (text: string) => {
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, voice: 'alloy' })
      });

      if (response.ok) {
        const audioBlob = await response.blob();
        const audioUrl = URL.createObjectURL(audioBlob);
        return new Audio(audioUrl);
      }
    } catch (error) {
      console.log('Audio generation not available, continuing without audio');
    }
    return null;
  };

  const startVideoDemo = async () => {
    setIsVideoPlaying(true);
    setCurrentSlide(0);
    
    const audio = await generateAudio(videoSlides[0].audioText);
    if (audio) {
      setCurrentAudio(audio);
      audio.play();
    }
    
    const interval = setInterval(async () => {
      setCurrentSlide(prev => {
        const nextSlide = prev + 1;
        if (nextSlide >= videoSlides.length) {
          setIsVideoPlaying(false);
          if (currentAudio) {
            currentAudio.pause();
            setCurrentAudio(null);
          }
          clearInterval(interval);
          return 0;
        }
        
        generateAudio(videoSlides[nextSlide].audioText).then(audio => {
          if (currentAudio) {
            currentAudio.pause();
          }
          if (audio) {
            setCurrentAudio(audio);
            audio.play();
          }
        });
        
        return nextSlide;
      });
    }, 5000);
  };

  const pauseVideoDemo = () => {
    setIsVideoPlaying(false);
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
  };

  const goToSlide = (slideIndex: number) => {
    setCurrentSlide(slideIndex);
    if (currentAudio) {
      currentAudio.pause();
    }
    generateAudio(videoSlides[slideIndex].audioText).then(audio => {
      if (audio) {
        setCurrentAudio(audio);
        if (isVideoPlaying) {
          audio.play();
        }
      }
    });
  };

  const roleTitle = role === 'school' ? 'School Administration' : 'Student Learning';
  const roleDescription = role === 'school' 
    ? 'Discover how TeachlyAI empowers schools with comprehensive management and analytics tools'
    : 'Experience how TeachlyAI makes learning engaging and effective for students';

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 text-white overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/20 to-purple-600/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-br from-cyan-400/20 to-blue-600/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <Header />

      <main className="relative z-10 flex-1 px-4 py-12 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          {/* Back button */}
          <Button
            onClick={() => navigate('/')}
            variant="outline"
            className="mb-8 border-white/20 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>

          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              {roleTitle} <span className="bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">Demo</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-3xl mx-auto mb-8">
              {roleDescription}
            </p>
          </div>

          {/* Video Demo Section */}
          <div className="mb-16" ref={videoDemoRef}>
            <div className="relative bg-gradient-to-br from-white/5 to-white/10 rounded-2xl overflow-hidden shadow-2xl max-w-5xl mx-auto border border-white/10 backdrop-blur-sm">
              <div className="relative aspect-video bg-gradient-to-br from-gray-800 to-gray-900">
                <img
                  src={videoSlides[currentSlide].image}
                  alt={videoSlides[currentSlide].title}
                  className="w-full h-full object-contain bg-gray-900"
                />
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent">
                  <div className="absolute bottom-0 left-0 right-0 p-8">
                    <h3 className="text-2xl md:text-3xl font-bold text-white mb-3">
                      {videoSlides[currentSlide].title}
                    </h3>
                    <p className="text-gray-200 text-lg md:text-xl max-w-3xl">
                      {videoSlides[currentSlide].description}
                    </p>
                  </div>
                </div>

                {!isVideoPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      onClick={startVideoDemo}
                      className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 rounded-full p-8 shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300 hover:scale-110"
                      size="icon"
                    >
                      <PlayCircle className="h-16 w-16" />
                    </Button>
                  </div>
                )}

                {isVideoPlaying && (
                  <div className="absolute top-6 right-6">
                    <Button
                      onClick={pauseVideoDemo}
                      className="bg-black/50 hover:bg-black/70 text-white border-0 rounded-full backdrop-blur-sm"
                      size="icon"
                    >
                      <Pause className="h-6 w-6" />
                    </Button>
                  </div>
                )}

                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-white/30 rounded-full h-2">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-full h-full transition-all duration-500"
                        style={{ width: `${((currentSlide + 1) / videoSlides.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-white text-sm font-mono">
                      {currentSlide + 1}/{videoSlides.length}
                    </span>
                  </div>
                  
                  <div className="flex justify-center gap-2 mt-4">
                    {videoSlides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentSlide 
                            ? 'bg-gradient-to-r from-blue-500 to-purple-600' 
                            : 'bg-white/40 hover:bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature highlights based on role */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            {role === 'school' ? (
              <>
                <div className="p-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all duration-300 backdrop-blur-sm">
                  <div className="text-4xl mb-6">🏫</div>
                  <h3 className="text-xl font-semibold mb-4">Institution Management</h3>
                  <p className="text-white/70 leading-relaxed">Comprehensive tools for managing students, teachers, and curriculum across your entire institution.</p>
                </div>
                <div className="p-8 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-300 backdrop-blur-sm">
                  <div className="text-4xl mb-6">📊</div>
                  <h3 className="text-xl font-semibold mb-4">Advanced Analytics</h3>
                  <p className="text-white/70 leading-relaxed">Deep insights into learning patterns, performance metrics, and curriculum effectiveness.</p>
                </div>
                <div className="p-8 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:from-green-500/20 hover:to-emerald-500/20 transition-all duration-300 backdrop-blur-sm">
                  <div className="text-4xl mb-6">🎯</div>
                  <h3 className="text-xl font-semibold mb-4">Curriculum Control</h3>
                  <p className="text-white/70 leading-relaxed">Create, customize, and optimize learning paths tailored to your institution's needs.</p>
                </div>
              </>
            ) : (
              <>
                <div className="p-8 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 border border-blue-500/20 hover:from-blue-500/20 hover:to-cyan-500/20 transition-all duration-300 backdrop-blur-sm">
                  <div className="text-4xl mb-6">🎮</div>
                  <h3 className="text-xl font-semibold mb-4">Gamified Learning</h3>
                  <p className="text-white/70 leading-relaxed">Complete quests, earn achievements, and track progress with our engaging gamification system.</p>
                </div>
                <div className="p-8 rounded-xl bg-gradient-to-br from-purple-500/10 to-pink-500/10 border border-purple-500/20 hover:from-purple-500/20 hover:to-pink-500/20 transition-all duration-300 backdrop-blur-sm">
                  <div className="text-4xl mb-6">🤖</div>
                  <h3 className="text-xl font-semibold mb-4">AI Tutoring</h3>
                  <p className="text-white/70 leading-relaxed">Get personalized help and explanations from our intelligent AI tutor available 24/7.</p>
                </div>
                <div className="p-8 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10 border border-green-500/20 hover:from-green-500/20 hover:to-emerald-500/20 transition-all duration-300 backdrop-blur-sm">
                  <div className="text-4xl mb-6">📈</div>
                  <h3 className="text-xl font-semibold mb-4">Progress Tracking</h3>
                  <p className="text-white/70 leading-relaxed">Monitor learning journey with detailed analytics and personalized insights.</p>
                </div>
              </>
            )}
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-2xl p-8 md:p-12 border border-white/10 backdrop-blur-sm">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Get Started?</h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                {role === 'school' 
                  ? 'Transform your institution with TeachlyAI\'s comprehensive educational platform.'
                  : 'Join thousands of students already using TeachlyAI to gamify their education and achieve better results.'
                }
              </p>
              <Button 
                size="lg" 
                className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white border-0 font-semibold px-8 py-4 text-lg shadow-2xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-all duration-300"
                onClick={() => navigate('/auth')}
              >
                Start Your Journey Today
              </Button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Demo;
