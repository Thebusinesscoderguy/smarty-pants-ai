
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import Index from './pages/Index';
import Auth from './pages/Auth';
import Pricing from './pages/Pricing';
import NotFound from './pages/NotFound';
import Progress from './pages/Progress';
import Onboarding from './pages/Onboarding';
import SchoolAdmin from './pages/SchoolAdmin';
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
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/admin" element={<SchoolAdmin />} />
          <Route path="/voice" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/math" element={<ProtectedRoute><MathSolver /></ProtectedRoute>} />
          <Route path="/progress" element={<Progress />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </AuthProvider>
  );
};

export default App;
