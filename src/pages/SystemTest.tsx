
import { SystemTestPanel } from '@/components/SystemTestPanel';
import { AppSidebar } from '@/components/AppSidebar';

const SystemTest = () => {
  return (
    <div className="flex min-h-screen bg-black text-white">
      <AppSidebar />
      
      <div className="flex-1 overflow-hidden">
        <header className="p-6 border-b border-white/20">
          <h1 className="text-2xl font-bold">System Testing</h1>
          <p className="text-gray-400 mt-1">
            Comprehensive testing of all APIs, workflows, and integrations
          </p>
        </header>
        
        <main className="p-6">
          <SystemTestPanel />
        </main>
      </div>
    </div>
  );
};

export default SystemTest;
