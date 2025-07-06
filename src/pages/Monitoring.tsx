
import { useAuth } from '@/contexts/AuthContext';
import { AppSidebar } from '@/components/AppSidebar';
import { DemoMonitoringPanel } from '@/components/demo/DemoMonitoringPanel';

const Monitoring = () => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900/50 via-purple-900/30 to-slate-900/50">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-700/20 via-slate-900/20 to-slate-900/20"></div>
      </div>

      {/* Sidebar */}
      <div className="relative z-10 w-64 flex-shrink-0 border-r border-white/10 backdrop-blur-xl bg-black/20">
        <AppSidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 relative z-10 backdrop-blur-sm">
        <DemoMonitoringPanel role={user ? 'student' : 'demo'} />
      </div>
    </div>
  );
};

export default Monitoring;
