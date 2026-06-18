import { lazy, Suspense } from 'react';
import { Toaster } from '@/components/ui/toaster';
import { Toaster as Sonner } from '@/components/ui/sonner';
import { TooltipProvider } from '@/components/ui/tooltip';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { AuthProvider } from '@/contexts/AuthContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { ViewingModeProvider } from '@/contexts/ViewingModeContext';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import ProtectedRoute from './components/ProtectedRoute';
import { MobileBottomNav } from './components/layout/MobileBottomNav';

// Eager — the public entry point. Keeping Landing in the main chunk means the
// hero paints immediately on first load with no Suspense fallback flash. Landing
// only imports its own light section components, so it stays cheap.
import Landing from './pages/Landing';

// Lazy — every other route splits into its own chunk. The heavy deps that live
// behind these routes (three / @react-three/drei, pdfjs-dist, jspdf, pptxgenjs,
// xlsx, katex, lottie) now load only when the route that uses them is visited,
// instead of being bundled into the initial download that the landing page pays for.
const Chat = lazy(() => import('./pages/Chat'));
const LearningModule = lazy(() => import('./pages/LearningModule'));
const FamilyHub = lazy(() => import('./pages/FamilyHub'));
const ParentOnboarding = lazy(() => import('./components/onboarding/ParentOnboarding'));
// Named export → map it to `default` so React.lazy can consume it.
const StudentDashboard = lazy(() =>
  import('./components/dashboards/StudentDashboard').then((m) => ({ default: m.StudentDashboard })),
);
const Progress = lazy(() => import('./pages/Progress'));
const Auth = lazy(() => import('./pages/Auth'));
const Features = lazy(() => import('./pages/Features'));
const PublicPricing = lazy(() => import('./pages/PublicPricing'));
const PricingCheckout = lazy(() => import('./pages/PricingCheckout'));
const Onboarding = lazy(() => import('./pages/Onboarding'));
const SchoolAdmin = lazy(() => import('./pages/SchoolAdmin'));
const AcceptInvitation = lazy(() => import('./pages/AcceptInvitation'));
const FAQ = lazy(() => import('./pages/FAQ'));
const QuizGenerator = lazy(() => import('./pages/QuizGenerator'));
const QuestsAchievements = lazy(() => import('./pages/QuestsAchievements'));
const MadeByMe = lazy(() => import('./pages/MadeByMe'));
const Monitoring = lazy(() => import('./pages/Monitoring'));
const News = lazy(() => import('./pages/News'));
const Inbox = lazy(() => import('./pages/Inbox'));
const Invoices = lazy(() => import('./pages/Invoices'));
const ReportCards = lazy(() => import('./pages/ReportCards'));
const Settings = lazy(() => import('./pages/Settings'));
const NotFound = lazy(() => import('./pages/NotFound'));
const Demo = lazy(() => import('./pages/Demo'));
const Leaderboard = lazy(() => import('./pages/Leaderboard'));
const SharedArtifact = lazy(() => import('./pages/SharedArtifact'));
const SchoolOnboarding = lazy(() => import('./pages/SchoolOnboarding'));
const ExamRunner = lazy(() => import('./pages/ExamRunner'));
const TestShareRedirect = lazy(() => import('./pages/TestShareRedirect'));
const LessonPlansLibrary = lazy(() => import('./pages/LessonPlansLibrary'));
const Privacy = lazy(() => import('./pages/Privacy'));
const Terms = lazy(() => import('./pages/Terms'));
const CurriculumQuizDemo = lazy(() => import('./pages/CurriculumQuizDemo'));

const queryClient = new QueryClient();

// Shown only during the brief window while a route's chunk is fetched.
// Matches the existing full-screen dark loading aesthetic used in ProtectedRoute.
function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-black text-white">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}

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
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<Landing />} />
                      <Route path="/dashboard" element={<ProtectedRoute><StudentDashboard /></ProtectedRoute>} />
                      <Route path="/family-hub" element={<ProtectedRoute><FamilyHub /></ProtectedRoute>} />
                      <Route path="/parent-onboarding" element={<ProtectedRoute><ParentOnboarding /></ProtectedRoute>} />
                      <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
                      <Route path="/modules" element={<ProtectedRoute><LearningModule /></ProtectedRoute>} />
                      <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
                      {/* SECURITY: students must not reach the monitoring dashboard. */}
                      <Route path="/monitoring" element={<ProtectedRoute allowedRoles={['parent', 'teacher', 'admin']}><Monitoring /></ProtectedRoute>} />
                      <Route path="/auth" element={<Auth />} />

                      <Route path="/features" element={<Features />} />
                      <Route path="/pricing" element={<PublicPricing />} />
                      <Route path="/faq" element={<FAQ />} />
                      <Route path="/pricing-checkout" element={<PricingCheckout />} />
                      <Route path="/onboarding" element={<Onboarding />} />
                      {/* SECURITY: school-admin console is staff-only (admins/teachers). */}
                      <Route path="/school-admin" element={<ProtectedRoute allowedRoles={['admin', 'teacher']}><SchoolAdmin /></ProtectedRoute>} />
                      <Route path="/school-onboarding" element={<ProtectedRoute><SchoolOnboarding /></ProtectedRoute>} />
                      <Route path="/accept-invitation" element={<AcceptInvitation />} />

                      <Route path="/quiz-generator" element={<ProtectedRoute><QuizGenerator /></ProtectedRoute>} />
                      <Route path="/demo" element={<Demo />} />
                      <Route path="/leaderboard" element={<Leaderboard />} />
                      <Route path="/quests" element={<ProtectedRoute><QuestsAchievements /></ProtectedRoute>} />
                      <Route path="/quests/made-by-me" element={<ProtectedRoute><MadeByMe /></ProtectedRoute>} />
                      <Route path="/news" element={<ProtectedRoute><News /></ProtectedRoute>} />
                      <Route path="/inbox" element={<ProtectedRoute><Inbox /></ProtectedRoute>} />
                      <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
                      {/* SECURITY: students must not reach report cards management. */}
                      <Route path="/report-cards" element={<ProtectedRoute allowedRoles={['parent', 'teacher', 'admin']}><ReportCards /></ProtectedRoute>} />
                      <Route path="/s/:token" element={<SharedArtifact />} />
                      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
                      <Route path="/exam/:testId" element={<ExamRunner />} />
                      <Route path="/t/:token" element={<TestShareRedirect />} />
                      <Route path="/lesson-plans" element={<ProtectedRoute><LessonPlansLibrary /></ProtectedRoute>} />
                      <Route path="/curriculum-quiz-demo" element={<ProtectedRoute><CurriculumQuizDemo /></ProtectedRoute>} />
                      <Route path="/privacy" element={<Privacy />} />
                      <Route path="/terms" element={<Terms />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                  <MobileBottomNav />
                </BrowserRouter>
              </ErrorBoundary>
            </TooltipProvider>
          </ViewingModeProvider>
        </AuthProvider>
      </LanguageProvider>
 the </QueryClientProvider>
  );
}

export default App;
