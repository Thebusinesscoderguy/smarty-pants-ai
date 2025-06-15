
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Features from "./pages/Features";
import Chat from "./pages/Chat";
import Voice from "./pages/Voice";
import MathSolver from "./pages/MathSolver";
import Progress from "./pages/Progress";
import PricingCheckout from "./pages/PricingCheckout";
import PublicPricing from "./pages/PublicPricing";
import HowItWorks from "./pages/HowItWorks";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import AcceptInvitation from "./pages/AcceptInvitation";
import SchoolAdmin from "./pages/SchoolAdmin";
import QuizGenerator from "./pages/QuizGenerator";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";
import SystemTest from "./pages/SystemTest";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/pricing" element={<PublicPricing />} />
              <Route path="/how-it-works" element={<HowItWorks />} />
              <Route path="/accept-invitation" element={<AcceptInvitation />} />
              <Route path="/features" element={
                <ProtectedRoute>
                  <Features />
                </ProtectedRoute>
              } />
              <Route path="/chat" element={
                <ProtectedRoute>
                  <Chat />
                </ProtectedRoute>
              } />
              <Route path="/voice" element={
                <ProtectedRoute>
                  <Voice />
                </ProtectedRoute>
              } />
              <Route path="/math" element={
                <ProtectedRoute>
                  <MathSolver />
                </ProtectedRoute>
              } />
              <Route path="/quiz" element={
                <ProtectedRoute>
                  <QuizGenerator />
                </ProtectedRoute>
              } />
              <Route path="/progress" element={
                <ProtectedRoute>
                  <Progress />
                </ProtectedRoute>
              } />
              <Route path="/pricing-checkout" element={
                <ProtectedRoute>
                  <PricingCheckout />
                </ProtectedRoute>
              } />
              <Route path="/onboarding" element={
                <ProtectedRoute>
                  <Onboarding />
                </ProtectedRoute>
              } />
              <Route path="/admin" element={
                <ProtectedRoute>
                  <SchoolAdmin />
                </ProtectedRoute>
              } />
              <Route path="/system-test" element={
                <ProtectedRoute>
                  <SystemTest />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
