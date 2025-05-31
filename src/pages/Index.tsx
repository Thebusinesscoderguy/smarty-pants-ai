
import { Button } from '@/components/ui/button';
import { BookOpen } from 'lucide-react';
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
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-8">
              Teachly uses adaptive AI to personalize your learning experience, adjusting to your pace and style automatically.
            </p>
            <Button 
              size="lg" 
              className="bg-purple-600 hover:bg-purple-700 h-16 px-12"
              onClick={() => navigate('/pricing')}
            >
              <BookOpen className="mr-2 h-5 w-5" />
              Get Started
            </Button>
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
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Gamified Learning Experience</h2>
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 max-w-2xl mx-auto">
              <div className="text-yellow-400 text-3xl mb-4">🏆</div>
              <h3 className="text-xl font-semibold mb-4">Achievements & Progress Tracking</h3>
              <p className="text-white/70">Unlock badges, earn points, and level up as you progress. Visual progress indicators and learning analytics help students stay motivated and understand their strengths.</p>
            </div>
          </div>

          <div className="mt-24 text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-8">Parent & Teacher Monitoring</h2>
            <div className="bg-white/5 border border-white/10 rounded-lg p-8 max-w-2xl mx-auto">
              <div className="text-orange-400 text-3xl mb-4">👨‍👩‍👧‍👦</div>
              <h3 className="text-xl font-semibold mb-4">Comprehensive Dashboards</h3>
              <p className="text-white/70">Parents and teachers can monitor student progress through detailed analytics, achievement tracking, and performance reports to support learning outcomes.</p>
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
