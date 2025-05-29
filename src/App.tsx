
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Pricing from './pages/Pricing';
import Tokens from './pages/Tokens';
import Avatar from './pages/Avatar';
import NotFound from './pages/NotFound';
import Progress from './pages/Progress';
import ProtectedRoute from './components/ProtectedRoute';
import { Toaster } from '@/components/ui/toaster';
import Chat from './pages/Chat';
import MathSolver from './pages/MathSolver';

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
          <Route path="/chat" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/math" element={<ProtectedRoute><MathSolver /></ProtectedRoute>} />
          <Route path="/progress" element={<ProtectedRoute><Progress /></ProtectedRoute>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
