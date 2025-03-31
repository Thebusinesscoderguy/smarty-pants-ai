
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import LoginModal from '@/components/LoginModal';
import SignupModal from '@/components/SignupModal';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="w-full px-4 md:px-6 py-4 flex items-center justify-between border-b border-white/10">
        <h1 className="text-xl font-bold">Teachly</h1>
        <div className="space-x-4">
          {user ? (
            <Button variant="outline" className="bg-white text-black hover:bg-gray-200">
              <Link to="/features">Dashboard</Link>
            </Button>
          ) : (
            <>
              <Button variant="outline" className="text-white border-white/30 hover:bg-white/10" onClick={() => setIsLoginOpen(true)}>
                Log in
              </Button>
              <Button className="bg-white text-black hover:bg-gray-200" onClick={() => setIsSignupOpen(true)}>
                Sign up
              </Button>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-12 md:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
              Learn Faster with <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-purple-500">AI</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto">
              Teachly uses adaptive AI to personalize your learning experience, adjusting to your pace and style automatically.
            </p>
            <div className="mt-8">
              {user ? (
                <Button size="lg" className="bg-white text-black hover:bg-gray-200">
                  <Link to="/features">Go to Dashboard</Link>
                </Button>
              ) : (
                <Button size="lg" className="bg-white text-black hover:bg-gray-200" onClick={() => setIsSignupOpen(true)}>
                  Get Started
                </Button>
              )}
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
        </div>
      </main>

      <footer className="w-full px-4 md:px-6 py-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center">
          <p className="text-white/60 text-sm">© 2023 Teachly. All rights reserved.</p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-white/60 hover:text-white text-sm">Terms</a>
            <a href="#" className="text-white/60 hover:text-white text-sm">Privacy</a>
            <Link to="/pricing" className="text-white/60 hover:text-white text-sm">Pricing</Link>
          </div>
        </div>
      </footer>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <SignupModal isOpen={isSignupOpen} onClose={() => setIsSignupOpen(false)} />
    </div>
  );
};

export default Index;
