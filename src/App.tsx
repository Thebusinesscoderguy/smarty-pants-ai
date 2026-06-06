
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
import Landing from './pages/Landing';
import Chat from './pages/Chat';
import LearningModule from './pages/LearningModule';
import FamilyHub from './pages/FamilyHub';
import ParentOnboarding from './components/onboarding/ParentOnboarding';
import { StudentDashboard } from './components/dashboards/StudentDashboard';

import Progress from './pages/Progress';
import Auth from './pages/Auth';

import Features from './pages/Features';
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
import Inbox from './pages/Inbox';
import Invoices from './pages/Invoices';
import ReportCards from './pages/ReportCards';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import Demo from './pages/Demo';
import Leaderboard from './pages/Leaderboard';
import SharedArtifact from './pages/SharedArtifact';
import SchoolOnboarding from './pages/SchoolOnboarding';
import ExamRunner from './pages/ExamRunner';
import TestShareRedirect from './pages/TestShareRedirect';
import LessonPlansLibrary from './pages/LessonPlansLibrary';
import Privacy from './pages/Privacy';
import Terms from './pages/Terms';
import { MobileBottomNav } from './components/layout/MobileBottomNav';

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
                    <Route path="/" element={<Landing />} />
                    <Route path="/home-old" element={<Index />} />
                    <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
                    <Route path="/family-hub" element={<FamilyHub />} />
                    <Route path="/parent-onboarding" element={<ParentOnboarding />} />
                    <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                    <Route path="/modules" element={<LearningModule />} />
                    <Route path="/progress" element={<Progress />} />
                    <Route path="/monitoring" element={<ProtectedRoute><Monitoring /></ProtectedRoute>} />
                    <Route path="/auth" element={<Auth />} />

                    <Route path="/features" element={<Features />} />
                    <Route path="/pricing" element={<PublicPricing />} />
                    <Route path="/faq" element={<FAQ />} />
                    <Route path="/pricing-checkout" element={<PricingCheckout />} />
                    <Route path="/onboarding" element={<Onboarding />} />
                    <Route path="/school-admin" element={<ProtectedRoute><SchoolAdmin /></ProtectedRoute>} />
                    <Route path="/school-onboarding" element={<ProtectedRoute><SchoolOnboarding /></ProtectedRoute>} />
                    <Route path="/accept-invitation" element={<AcceptInvitation />} />

                    <Route path="/quiz-generator" element={<QuizGenerator />} />
                    <Route path="/demo" element={<Demo />} />
                    <Route path="/leaderboard" element={<Leaderboard />} />
                    <Route path="/quests" element={<ProtectedRoute><QuestsAchievements /></ProtectedRoute>} />
                    <Route path="/quests/made-by-me" element={<ProtectedRoute><MadeByMe /></ProtectedRoute>} />
                    <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
                    <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
                    <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
                    <Route path="/report-cards" element={<ProtectedRoute><ReportCards /></ProtectedRoute>} />
                    <Route path="/s/:token" element={<SharedArtifact />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/exam/:testId" element={<ExamRunner />} />
                    <Route path="/t/:token" element={<TestShareRedirect />} />
                    <Route path="/lesson-plans" element={<ProtectedRoute><LessonPlansLibrary /></ProtectedRoute>} />
                    <Route path="/privacy" element={<Privacy />} />
                    <Route path="/terms" element={<Terms />} />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                  <MobileBottomNav />
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
