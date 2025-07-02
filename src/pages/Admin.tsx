
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, Users, BarChart3, Settings as SettingsIcon } from 'lucide-react';
import { Navigate } from 'react-router-dom';

const Admin = () => {
  const { user, isSchoolAdmin } = useAuth();

  if (!user || !isSchoolAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900 text-white flex flex-col">
      <Header />
      
      <main className="flex-1 px-4 py-8 md:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
              Admin Dashboard
            </h1>
            <p className="text-gray-300 text-lg">
              Manage your school's learning platform
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Students
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-400 mb-2">156</div>
                <p className="text-gray-300 text-sm">Active students</p>
                <Button className="mt-4 w-full bg-blue-600 hover:bg-blue-700">
                  Manage Students
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <BarChart3 className="mr-2 h-5 w-5" />
                  Analytics
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-400 mb-2">87%</div>
                <p className="text-gray-300 text-sm">Average performance</p>
                <Button className="mt-4 w-full bg-green-600 hover:bg-green-700">
                  View Reports
                </Button>
              </CardContent>
            </Card>

            <Card className="bg-white/10 border-white/20 backdrop-blur-sm hover:bg-white/15 transition-colors cursor-pointer">
              <CardHeader>
                <CardTitle className="text-white flex items-center">
                  <SettingsIcon className="mr-2 h-5 w-5" />
                  Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-300 text-sm mb-4">Configure school settings</p>
                <Button className="mt-4 w-full bg-purple-600 hover:bg-purple-700">
                  School Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Admin;
