
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ViewingModeProvider } from '@/contexts/ViewingModeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';

import Index from './pages/Index';
import Chat from './pages/Chat';
import LearningModule from './pages/LearningModule';
import FamilyHub from './pages/FamilyHub';
import ParentOnboarding from './components/onboarding/ParentOnboarding';
import { StudentDashboard } from './components/dashboards/StudentDashboard';

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

import QuizGenerator from './pages/QuizGenerator';
import QuestsAchievements from './pages/QuestsAchievements';
import MadeByMe from './pages/MadeByMe';
import Monitoring from './pages/Monitoring';
import News from './pages/News';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Demo from './pages/Demo';
import Leaderboard from './pages/Leaderboard';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <ViewingModeProvider>
            <TooltipProvider>
              <ErrorBoundary>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
                    <Route path="/family-hub" element={<FamilyHub />} />
                    <Route path="/parent-onboarding" element={<ParentOnboarding />} />
                    <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                    <Route path="/modules" element={<LearningModule />} />
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
                    <Route path="/school-admin" element={<ProtectedRoute><SchoolAdmin /></ProtectedRoute>} />
                    <Route path="/accept-invitation" element={<AcceptInvitation />} />

                    <Route path="/quiz-generator" element={<QuizGenerator />} />
                    <Route path="/demo" element={<Demo />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/quests" element={<ProtectedRoute><QuestsAchievements /></ProtectedRoute>} />
                    <Route path="/quests/made-by-me" element={<ProtectedRoute><MadeByMe /></ProtectedRoute>} />
                    <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </ErrorBoundary>
            </TooltipProvider>
          </ViewingModeProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
}

export default App;
