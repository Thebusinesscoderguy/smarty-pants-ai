
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Index from './pages/Index';
import Chat from './pages/Chat';
import Progress from './pages/Progress';
import Auth from './pages/Auth';
import Demo from './pages/Demo';
import Features from './pages/Features';
import HowItWorks from './pages/HowItWorks';
import PublicPricing from './pages/PublicPricing';
import PricingCheckout from './pages/PricingCheckout';
import Onboarding from './pages/Onboarding';
import SchoolAdmin from './pages/SchoolAdmin';
import AcceptInvitation from './pages/AcceptInvitation';
import SystemTest from './pages/SystemTest';
import TestResults from './pages/TestResults';
import MathSolver from './pages/MathSolver';
import QuizGenerator from './pages/QuizGenerator';
import Monitoring from './pages/Monitoring';
import Settings from './pages/Settings';
import VoiceTest from './pages/VoiceTest';
import NotFound from './pages/NotFound';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/chat" element={<Chat />} />
                <Route path="/progress" element={<Progress />} />
                <Route path="/monitoring" element={<Monitoring />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/demo" element={<Demo />} />
                <Route path="/features" element={<Features />} />
                <Route path="/how-it-works" element={<HowItWorks />} />
                <Route path="/pricing" element={<PublicPricing />} />
                <Route path="/pricing-checkout" element={<PricingCheckout />} />
                <Route path="/onboarding" element={<Onboarding />} />
                <Route path="/school-admin" element={<SchoolAdmin />} />
                <Route path="/accept-invitation" element={<AcceptInvitation />} />
                <Route path="/system-test" element={<SystemTest />} />
                <Route path="/test-results" element={<TestResults />} />
                <Route path="/math-solver" element={<MathSolver />} />
                <Route path="/quiz" element={<QuizGenerator />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/voice-test" element={<VoiceTest />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
