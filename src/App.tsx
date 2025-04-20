
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useNavigate, useLocation, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";
import Index from "./pages/Index";
import Pricing from "./pages/Pricing";
import Voice from "./pages/Voice";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const AuthRedirectHandler = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { loading } = useAuth();
  const [isProcessingAuth, setIsProcessingAuth] = useState(false);

  useEffect(() => {
    const handleHashRedirect = async () => {
      if (location.hash && location.hash.includes('access_token') && !isProcessingAuth) {
        try {
          setIsProcessingAuth(true);
          console.log('Processing auth redirect with hash:', location.hash);
          
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
            window.history.replaceState({}, document.title, window.location.pathname);
            navigate('/features');
            
            toast({
              title: "Successfully signed in",
              description: "Welcome back!",
            });
          } else {
            console.log('No session found after processing hash');
            toast({
              title: "Authentication incomplete",
              description: "Could not establish a session. Please try again.",
              variant: "destructive",
            });
          }
        } catch (error: any) {
          console.error('Error processing auth redirect:', error);
          toast({
            title: "Authentication error",
            description: error.message || "Failed to process authentication",
            variant: "destructive",
          });
        } finally {
          setIsProcessingAuth(false);
        }
      }
    };

    if (!loading) {
      handleHashRedirect();
    }
  }, [location.hash, navigate, loading, isProcessingAuth]);

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
                  <Navigate to="/voice" replace />
                </ProtectedRoute>
              } />
              <Route path="/voice" element={
                <ProtectedRoute>
                  <Voice />
                </ProtectedRoute>
              } />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </AuthRedirectHandler>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
