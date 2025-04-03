
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import Features from "./pages/Features";
import Voice from "./pages/Voice";
import Tokens from "./pages/Tokens";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// This wrapper handles OAuth redirects and must be inside Router
const AuthRedirectHandler = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleOAuthCallback } = useAuth();

  useEffect(() => {
    // Handle OAuth redirects
    const processHash = async () => {
      if (location.hash && location.hash.includes('access_token')) {
        const success = await handleOAuthCallback(location.hash);
        if (success) {
          // Clear the hash from the URL
          window.history.replaceState({}, document.title, location.pathname);
          // Navigate to pricing page after successful auth
          navigate('/pricing');
        }
      }
    };

    processHash();
  }, [location.hash, navigate, handleOAuthCallback, location.pathname]);

  return <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <BrowserRouter>
        <AuthProvider>
          <AuthRedirectHandler>
            <Toaster />
            <Sonner />
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/pricing" element={<Pricing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/features" element={
                <ProtectedRoute>
                  <Features />
                </ProtectedRoute>
              } />
              <Route path="/voice" element={
                <ProtectedRoute>
                  <Voice />
                </ProtectedRoute>
              } />
              <Route path="/tokens" element={
                <ProtectedRoute>
                  <Tokens />
                </ProtectedRoute>
              } />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthRedirectHandler>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
