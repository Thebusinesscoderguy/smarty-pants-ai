
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { PlayCircle, Pause } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const Demo = () => {
  const [isVideoPlaying, setIsVideoPlaying] = useState(false);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const videoDemoRef = useRef<HTMLDivElement>(null);

  const videoSlides = [
    {
      title: "Sign Up & Get Started",
      description: "Create your account and set up your learning profile",
      image: "/images/auth-signup.png",
      audioText: "Start your learning journey by creating your account and setting up your personalized learning preferences."
    },
    {
      title: "Student Dashboard",
      description: "Track your progress and manage your subjects",
      image: "/images/student-dashboard.png",
      audioText: "Your student dashboard provides a comprehensive view of your learning progress, current subjects, and daily achievements."
    },
    {
      title: "AI Tutor Chat",
      description: "Get instant help from your AI tutor",
      image: "/images/ai-chat-interface.png",
      audioText: "Chat with your AI tutor anytime to get explanations, ask questions, and receive personalized learning guidance."
    },
    {
      title: "Quests & Achievements",
      description: "Complete challenges and unlock rewards",
      image: "/images/quests-achievements.png",
      audioText: "Stay motivated with our gamified learning system featuring daily quests, achievements, and progress rewards."
    },
    {
      title: "School Administration",
      description: "Monitor student progress and manage your school",
      image: "/images/school-admin-dashboard.png",
      audioText: "Educators can monitor student progress, assign subjects, and track learning outcomes across their institution."
    }
  ];

  // Auto-start video when scrolled into view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isVideoPlaying) {
            startVideoDemo();
          }
        });
      },
      {
        threshold: 0.6,
      }
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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
          voice: 'alloy'
        })
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
    
    // Generate and play audio for first slide
    const audio = await generateAudio(videoSlides[0].audioText);
    if (audio) {
      setCurrentAudio(audio);
      audio.play();
    }
    
    // Auto-advance slides every 4 seconds
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
        
        // Generate audio for next slide
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
    }, 4000);
  };

  const pauseVideoDemo = () => {
    setIsVideoPlaying(false);
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-12 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              See TeachlyAI in <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">Action</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Explore our platform features - from student dashboards to AI tutoring and gamified learning.
            </p>
          </div>

          {/* Video Demo Section */}
          <div className="mb-16" ref={videoDemoRef}>
            <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl max-w-4xl mx-auto">
              {/* Video Player Interface */}
              <div className="relative aspect-video bg-gray-900">
                <img
                  src={videoSlides[currentSlide].image}
                  alt={videoSlides[currentSlide].title}
                  className="w-full h-full object-cover"
                />
                
                {/* Video overlay with content */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent">
                  <div className="absolute bottom-0 left-0 right-0 p-6">
                    <h3 className="text-2xl font-bold text-white mb-2">
                      {videoSlides[currentSlide].title}
                    </h3>
                    <p className="text-gray-200 text-lg">
                      {videoSlides[currentSlide].description}
                    </p>
                  </div>
                </div>

                {/* Play/Pause Button */}
                {!isVideoPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      onClick={startVideoDemo}
                      className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-full p-6"
                      size="icon"
                    >
                      <PlayCircle className="h-12 w-12" />
                    </Button>
                  </div>
                )}

                {/* Video Controls */}
                {isVideoPlaying && (
                  <div className="absolute top-4 right-4">
                    <Button
                      onClick={pauseVideoDemo}
                      className="bg-black/50 hover:bg-black/70 text-white border-0 rounded-full"
                      size="icon"
                    >
                      <Pause className="h-5 w-5" />
                    </Button>
                  </div>
                )}

                {/* Progress indicator */}
                <div className="absolute bottom-4 left-4 right-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 bg-white/30 rounded-full h-1">
                      <div 
                        className="bg-white rounded-full h-full transition-all duration-300"
                        style={{ width: `${((currentSlide + 1) / videoSlides.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-white text-sm font-mono">
                      {currentSlide + 1}/{videoSlides.length}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-6 mt-16">
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="text-blue-400 text-2xl mb-4">🧠</div>
              <h3 className="text-xl font-semibold mb-2">Adaptive Learning</h3>
              <p className="text-white/70">Our AI adjusts to your learning pace, slowing down when you need time and speeding up when you're flying.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="text-purple-400 text-2xl mb-4">🗣️</div>
              <h3 className="text-xl font-semibold mb-2">Voice Interactions</h3>
              <p className="text-white/70">Learn on the go with natural voice conversations. Ask questions and get answers just like talking to a tutor.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="text-green-400 text-2xl mb-4">📚</div>
              <h3 className="text-xl font-semibold mb-2">Study Material Analysis</h3>
              <p className="text-white/70">Upload your notes and documents, and our AI will help you understand and quiz you on the content.</p>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Demo;
