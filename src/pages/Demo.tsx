
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
      title: "Student Dashboard Overview",
      description: "Your personalized learning hub with progress tracking and achievements",
      image: "/images/student-dashboard.png",
      audioText: "Welcome to your student dashboard - your personalized learning command center where you can track your progress, view achievements, and manage your subjects all in one place."
    },
    {
      title: "Subject Progress & Learning Path",
      description: "Track your completion across different subjects with detailed progress bars",
      image: "/images/quests-achievements.png", 
      audioText: "Monitor your learning journey with detailed subject progress tracking. See exactly how far you've come and what's next on your learning path with visual progress indicators."
    },
    {
      title: "Gamified Quest System",
      description: "Complete daily and weekly quests to earn rewards and stay motivated",
      image: "/images/ai-chat-interface.png",
      audioText: "Stay motivated with our gamified quest system featuring daily challenges, achievement unlocks, and reward systems that make learning fun and engaging."
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
    
    // Auto-advance slides every 5 seconds for better viewing
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

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-12 md:px-6 lg:px-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              See TeachlyAI in <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">Action</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Explore our gamified learning platform - from student dashboards to achievement systems and progress tracking.
            </p>
          </div>

          {/* Video Demo Section */}
          <div className="mb-16" ref={videoDemoRef}>
            <div className="relative bg-black rounded-xl overflow-hidden shadow-2xl max-w-5xl mx-auto border border-white/10">
              {/* Video Player Interface */}
              <div className="relative aspect-video bg-gray-900">
                <img
                  src={videoSlides[currentSlide].image}
                  alt={videoSlides[currentSlide].title}
                  className="w-full h-full object-contain bg-gray-900"
                />
                
                {/* Video overlay with content */}
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

                {/* Play/Pause Button */}
                {!isVideoPlaying && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Button
                      onClick={startVideoDemo}
                      className="bg-white/20 hover:bg-white/30 text-white border-0 rounded-full p-8 backdrop-blur-sm"
                      size="icon"
                    >
                      <PlayCircle className="h-16 w-16" />
                    </Button>
                  </div>
                )}

                {/* Video Controls */}
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

                {/* Progress indicator and slide navigation */}
                <div className="absolute bottom-6 left-6 right-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 bg-white/30 rounded-full h-2">
                      <div 
                        className="bg-white rounded-full h-full transition-all duration-500"
                        style={{ width: `${((currentSlide + 1) / videoSlides.length) * 100}%` }}
                      />
                    </div>
                    <span className="text-white text-sm font-mono">
                      {currentSlide + 1}/{videoSlides.length}
                    </span>
                  </div>
                  
                  {/* Slide dots */}
                  <div className="flex justify-center gap-2 mt-4">
                    {videoSlides.map((_, index) => (
                      <button
                        key={index}
                        onClick={() => goToSlide(index)}
                        className={`w-3 h-3 rounded-full transition-all duration-300 ${
                          index === currentSlide ? 'bg-white' : 'bg-white/40 hover:bg-white/60'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Highlights */}
          <div className="grid md:grid-cols-3 gap-8 mt-16">
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-all duration-300">
              <div className="text-blue-400 text-3xl mb-6">🎯</div>
              <h3 className="text-xl font-semibold mb-4">Gamified Learning</h3>
              <p className="text-white/70 leading-relaxed">Complete quests, earn achievements, and track your progress with our engaging gamification system that makes learning addictive.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-all duration-300">
              <div className="text-purple-400 text-3xl mb-6">📊</div>
              <h3 className="text-xl font-semibold mb-4">Progress Tracking</h3>
              <p className="text-white/70 leading-relaxed">Monitor your learning journey with detailed analytics, completion percentages, and personalized insights to optimize your study time.</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-8 hover:bg-white/10 transition-all duration-300">
              <div className="text-green-400 text-3xl mb-6">🏆</div>
              <h3 className="text-xl font-semibold mb-4">Achievement System</h3>
              <p className="text-white/70 leading-relaxed">Unlock badges, complete challenges, and climb leaderboards as you master new concepts and reach learning milestones.</p>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center mt-16">
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Start Learning?</h2>
              <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
                Join thousands of students already using TeachlyAI to gamify their education and achieve better results.
              </p>
              <Button 
                size="lg" 
                className="bg-white text-blue-600 hover:bg-gray-100 font-semibold px-8 py-4 text-lg"
                onClick={() => window.location.href = '/auth'}
              >
                Get Started Today
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
