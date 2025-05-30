
import { Button } from '@/components/ui/button';
import { MessageSquare, Mic, BookOpen, Calculator, User, BarChart3 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ContactForm } from '@/components/contact/ContactForm';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <Header />

      <main className="flex-1 px-4 py-12 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Learn Faster with <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">AI</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              Teachly uses adaptive AI to personalize your learning experience, adjusting to your pace and style automatically.
            </p>
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              <Button 
                size="lg" 
                className="bg-white text-black hover:bg-gray-200 h-16"
                onClick={() => navigate('/chat')}
              >
                <MessageSquare className="mr-2 h-5 w-5" />
                Text Chat
              </Button>
              <Button 
                size="lg" 
                className="bg-purple-600 hover:bg-purple-700 h-16"
                onClick={() => navigate('/voice')}
              >
                <Mic className="mr-2 h-5 w-5" />
                Voice Chat
              </Button>
              <Button 
                size="lg" 
                className="bg-blue-600 hover:bg-blue-700 h-16"
                onClick={() => navigate('/math')}
              >
                <Calculator className="mr-2 h-5 w-5" />
                Math Solver
              </Button>
              <Button 
                size="lg" 
                className="bg-green-600 hover:bg-green-700 h-16"
                onClick={() => navigate('/avatar')}
              >
                <User className="mr-2 h-5 w-5" />
                AI Avatar
              </Button>
              <Button 
                size="lg" 
                className="bg-orange-600 hover:bg-orange-700 h-16"
                onClick={() => navigate('/progress')}
              >
                <BarChart3 className="mr-2 h-5 w-5" />
                Progress
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-purple-500/50 hover:bg-purple-500/10 text-purple-300 h-16"
                onClick={() => navigate('/pricing')}
              >
                <BookOpen className="mr-2 h-5 w-5" />
                Pricing
              </Button>
            </div>
          </div>

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
          
          <div className="mt-24 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Why Choose Teachly in 2025?</h2>
            <div className="grid md:grid-cols-2 gap-8 mt-12">
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-left">
                <h3 className="text-xl font-semibold mb-4">Personalized Learning Path</h3>
                <p className="text-white/70">Our AI analyzes your learning style, strengths, and weaknesses to create a custom curriculum that evolves as you progress.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-left">
                <h3 className="text-xl font-semibold mb-4">Real-time Feedback</h3>
                <p className="text-white/70">Get immediate, constructive feedback on your work that helps you understand mistakes and improve faster.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-left">
                <h3 className="text-xl font-semibold mb-4">Interactive Practice</h3>
                <p className="text-white/70">Engage with dynamic exercises that adapt to your skill level, making learning both challenging and enjoyable.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-8 text-left">
                <h3 className="text-xl font-semibold mb-4">Learn Anywhere</h3>
                <p className="text-white/70">Access your personalized learning experience on any device, with progress synced automatically across platforms.</p>
              </div>
            </div>
          </div>
          
          <div className="mt-24 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Frequently Asked Questions</h2>
            <p className="text-lg text-white/80 max-w-2xl mx-auto mb-12">
              Find answers to common questions about using Teachly and maximizing your learning experience.
            </p>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-blue-500/50 transition-all duration-300 text-left">
                <h3 className="text-xl font-semibold mb-4">How does adaptive learning work?</h3>
                <p className="text-white/70 mb-3">Our AI system analyzes your learning patterns and adjusts the difficulty and pace of content to match your individual needs, creating a personalized experience that evolves as you progress.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-purple-500/50 transition-all duration-300 text-left">
                <h3 className="text-xl font-semibold mb-4">How does voice learning work?</h3>
                <p className="text-white/70 mb-3">Click on the "Voice Chat" button to access our voice learning feature. You can record questions and receive spoken responses from our AI tutor.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-green-500/50 transition-all duration-300 text-left">
                <h3 className="text-xl font-semibold mb-4">What content can Teachly help me with?</h3>
                <p className="text-white/70 mb-3">Teachly can assist with a wide range of subjects including mathematics, science, languages, programming, and more. Our AI adapts to your specific learning needs.</p>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-6 hover:border-yellow-500/50 transition-all duration-300 text-left">
                <h3 className="text-xl font-semibold mb-4">Can I use Teachly on mobile devices?</h3>
                <p className="text-white/70 mb-3">Yes! Teachly is fully responsive and works on all devices including smartphones and tablets. Your learning progress syncs across all platforms automatically.</p>
              </div>
            </div>
          </div>

          <ContactForm />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
