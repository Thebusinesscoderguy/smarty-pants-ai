
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
    <div className="flex flex-col min-h-screen bg-black text-white">
      <header className="py-6 text-center">
        <h1 className="text-3xl font-bold">EduAI</h1>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-4 max-w-3xl mx-auto text-center">
        <h2 className="text-4xl md:text-5xl font-bold mb-4">Adaptive AI Learning</h2>
        <p className="text-xl mb-8">Tailored education for kids and learners.</p>
        
        <div className="flex gap-4 mb-12">
          <Button 
            variant="outline" 
            className="bg-white text-black hover:bg-gray-200"
            onClick={() => setIsLoginOpen(true)}
          >
            Log In
          </Button>
          <Button 
            variant="outline" 
            className="bg-white text-black hover:bg-gray-200"
            onClick={() => setIsSignupOpen(true)}
          >
            Sign Up
          </Button>
        </div>

        <div className="w-full max-w-md mb-12">
          <h3 className="text-2xl font-bold mb-4">FAQs</h3>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1" className="border-white/20">
              <AccordionTrigger className="text-left">What's this?</AccordionTrigger>
              <AccordionContent>
                AI that adapts to your learning pace.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2" className="border-white/20">
              <AccordionTrigger className="text-left">Cost?</AccordionTrigger>
              <AccordionContent>
                $16/month via PayPal.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3" className="border-white/20">
              <AccordionTrigger className="text-left">For who?</AccordionTrigger>
              <AccordionContent>
                Kids and students.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>

        <Link to="/pricing">
          <Button className="bg-white text-black hover:bg-gray-200">
            Get Started
          </Button>
        </Link>
      </main>

      <footer className="py-6 text-center text-sm text-white/70">
        © 2025 EduAI
      </footer>

      <LoginModal isOpen={isLoginOpen} onClose={() => setIsLoginOpen(false)} />
      <SignupModal isOpen={isSignupOpen} onClose={() => setIsSignupOpen(false)} />
    </div>
  );
};

export default Index;
