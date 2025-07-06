
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { StudentDashboard } from '@/components/monitoring/StudentDashboard';
import { ParentDashboard } from '@/components/monitoring/ParentDashboard';
import { TestManagement } from '@/components/TestManagement';
import { useAuth } from '@/contexts/AuthContext';

const Progress = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-purple-900">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">Learning Progress</h1>
          <p className="text-white/70">Track your learning journey and achievements</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-white/10 border border-white/20">
            <TabsTrigger 
              value="overview" 
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70"
            >
              Overview
            </TabsTrigger>
            <TabsTrigger 
              value="detailed" 
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70"
            >
              Detailed
            </TabsTrigger>
            <TabsTrigger 
              value="tests" 
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70"
            >
              Tests
            </TabsTrigger>
            <TabsTrigger 
              value="monitoring" 
              className="data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/70"
            >
              Monitoring
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6">
            <StudentDashboard />
          </TabsContent>

          <TabsContent value="detailed" className="mt-6">
            <ParentDashboard />
          </TabsContent>

          <TabsContent value="tests" className="mt-6">
            <TestManagement />
          </TabsContent>

          <TabsContent value="monitoring" className="mt-6">
            <div className="grid gap-6">
              <StudentDashboard />
              <ParentDashboard />
            </div>
          </TabsContent>
        </Tabs>
      </main>

      <Footer />
    </div>
  );
};

export default Progress;
