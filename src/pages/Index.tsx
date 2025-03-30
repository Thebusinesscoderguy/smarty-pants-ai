
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { 
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import LoginModal from '@/components/LoginModal';
import SignupModal from '@/components/SignupModal';

const Index = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isSignupOpen, setIsSignupOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <header className="py-6 px-8 flex justify-between items-center border-b border-white/10">
        <h1 className="text-3xl font-bold">EduAI</h1>
        <div className="flex gap-4">
          <Button 
            variant="ghost" 
            className="text-white hover:bg-white/10"
            onClick={() => setIsLoginOpen(true)}
          >
            Log In
          </Button>
          <Button 
            className="bg-white text-black hover:bg-gray-200"
            onClick={() => setIsSignupOpen(true)}
          >
            Sign Up
          </Button>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-8 lg:p-12">
        <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div className="flex flex-col space-y-6">
            <h2 className="text-5xl md:text-6xl font-bold leading-tight">
              AI-Powered Learning Tailored to You
            </h2>
            <p className="text-xl text-white/80">
              EduAI adapts to your learning pace and style, providing personalized education for students of all ages.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link to="/features" className="w-full sm:w-auto">
                <Button className="w-full sm:w-auto bg-white text-black hover:bg-gray-200 text-lg h-12 px-8">
                  Try Now
                </Button>
              </Link>
              <Link to="/pricing" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full sm:w-auto border-white/30 text-white hover:bg-white/10 text-lg h-12 px-8">
                  View Plans
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-8">
            <h3 className="text-2xl font-bold mb-6">Frequently Asked Questions</h3>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="item-1" className="border-white/20">
                <AccordionTrigger className="text-left">What makes EduAI different?</AccordionTrigger>
                <AccordionContent>
                  EduAI uses adaptive learning technology to adjust to your pace, providing personalized educational support.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-2" className="border-white/20">
                <AccordionTrigger className="text-left">How much does it cost?</AccordionTrigger>
                <AccordionContent>
                  $16/month via PayPal with a 7-day free trial available.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-3" className="border-white/20">
                <AccordionTrigger className="text-left">Who is this for?</AccordionTrigger>
                <AccordionContent>
                  Students of all ages, from elementary school to university, as well as lifelong learners.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="item-4" className="border-white/20">
                <AccordionTrigger className="text-left">Can I try before subscribing?</AccordionTrigger>
                <AccordionContent>
                  Yes, you can try our core features without signing up, or start a 7-day free trial for full access.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </main>

      <footer className="py-8 px-8 border-t border-white/10 text-center text-white/60">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <p>© 2025 EduAI • All rights reserved</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-white transition-colors">Terms</a>
            <a href="#" className="hover:text-white transition-colors">Privacy</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <SignupModal isOpen={isSignupOpen} onClose={() => setIsSignupOpen(false)} />
    </div>
  );
};

export default Index;
