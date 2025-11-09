
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import Index from './pages/Index';
import Chat from './pages/Chat';
import LearningModule from './pages/LearningModule';
import FamilyHub from './pages/FamilyHub';
import ParentOnboarding from './components/onboarding/ParentOnboarding';

import Progress from './pages/Progress';
import Auth from './pages/Auth';

import Features from './pages/Features';
import HowItWorks from './pages/HowItWorks';
import PublicPricing from './pages/PublicPricing';
import PricingCheckout from './pages/PricingCheckout';
import Onboarding from './pages/Onboarding';
import SchoolAdmin from './pages/SchoolAdmin';
import AcceptInvitation from './pages/AcceptInvitation';
import FAQ from './pages/FAQ';


import MathSolver from './pages/MathSolver';
import QuizGenerator from './pages/QuizGenerator';
import QuestsAchievements from './pages/QuestsAchievements';
import CreateQuest from './pages/CreateQuest';
import AIGenerateQuest from './pages/AIGenerateQuest';
import MadeByMe from './pages/MadeByMe';
import Monitoring from './pages/Monitoring';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';

const queryClient = new QueryClient();

function App() {
  // Clean app without system tests
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
              <Route path="/dashboard" element={<ProtectedRoute><div /></ProtectedRoute>} />
              <Route path="/family-hub" element={<FamilyHub />} />
              <Route path="/parent-onboarding" element={<ParentOnboarding />} />
              <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
               <Route path="/modules" element={<ProtectedRoute><LearningModule /></ProtectedRoute>} />
               <Route path="/voice" element={<Chat />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />
              <Route path="/auth" element={<Auth />} />
              
              <Route path="/features" element={<Features />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/pricing" element={<PublicPricing />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/pricing-checkout" element={<PricingCheckout />} />
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/school-admin" element={<SchoolAdmin />} />
              <Route path="/accept-invitation" element={<AcceptInvitation />} />
              
              
               <Route path="/math-solver" element={<MathSolver />} />
               <Route path="/quiz-generator" element={<ProtectedRoute><QuizGenerator /></ProtectedRoute>} />
               <Route path="/quests" element={<ProtectedRoute><QuestsAchievements /></ProtectedRoute>} />
               <Route path="/quests/create" element={<ProtectedRoute><CreateQuest /></ProtectedRoute>} />
               <Route path="/quests/ai-generate" element={<ProtectedRoute><AIGenerateQuest /></ProtectedRoute>} />
               <Route path="/quests/made-by-me" element={<ProtectedRoute><MadeByMe /></ProtectedRoute>} />
               <Route path="/settings" element={<Settings />} />
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
