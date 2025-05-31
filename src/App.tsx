import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Toaster } from "@/components/ui/toaster"
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Chat from "./pages/Chat";
import Voice from "./pages/Voice";
import MathSolver from "./pages/MathSolver";
import Progress from "./pages/Progress";
import Features from "./pages/Features";
import Pricing from "./pages/Pricing";
import NotFound from "./pages/NotFound";
import Onboarding from "./pages/Onboarding";
import SchoolAdmin from "./pages/SchoolAdmin";
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import {
  QueryClient,
  QueryClientProvider,
} from '@tanstack/react-query'
import AcceptInvitation from '@/pages/AcceptInvitation';

function App() {
  const queryClient = new QueryClient()

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="min-h-screen bg-background">
            <Toaster />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/auth" element={<Auth />} />
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
              <Route path="/progress" element={
                <ProtectedRoute>
                  <Progress />
                </ProtectedRoute>
              } />
              <Route path="/features" element={<Features />} />
              <Route path="/pricing" element={<Pricing />} />
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
              <Route path="/accept-invitation" element={<AcceptInvitation />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
