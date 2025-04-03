
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
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
  const { loading } = useAuth();

  useEffect(() => {
    const handleHashRedirect = async () => {
      if (location.hash && location.hash.includes('access_token')) {
        try {
          // Process the hash parameters - using signInWithOAuth().redirect() result
          const { data, error } = await supabase.auth.getSession();
          
          if (error) {
            console.error('Error getting session from URL:', error);
            toast({
              title: "Authentication failed",
              description: error.message,
              variant: "destructive",
            });
            return;
          }
          
          if (data.session) {
            console.log('Successfully authenticated from OAuth provider');
            // Clear the hash from the URL and navigate to pricing
            window.history.replaceState({}, document.title, window.location.pathname);
            navigate('/pricing');
            
            toast({
              title: "Successfully signed in",
              description: "Welcome back!",
            });
          }
        } catch (error: any) {
          console.error('Error processing auth redirect:', error);
          toast({
            title: "Authentication error",
            description: error.message || "Failed to process authentication",
            variant: "destructive",
          });
        }
      }
    };

    if (!loading) {
      handleHashRedirect();
    }
  }, [location.hash, navigate, loading]);

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
