
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Pricing from './pages/Pricing';
import Tokens from './pages/Tokens';
import Avatar from './pages/Avatar';
import Features from './pages/Features';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';
import Chat from './pages/Chat';

const App = () => {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/tokens" element={<ProtectedRoute><Tokens /></ProtectedRoute>} />
          <Route path="/voice" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/avatar" element={<ProtectedRoute><Avatar /></ProtectedRoute>} />
          <Route path="/features" element={<ProtectedRoute><Features /></ProtectedRoute>} />
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;

