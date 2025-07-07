
import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/AppSidebar";
import { ScrollArea } from "@/components/ui/scroll-area";

const MathSolver = () => {
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
      <div className="w-64 flex-shrink-0 border-r border-white/10">
        <AppSidebar />
      </div>

      <div className="flex-1 flex flex-col max-h-screen overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold">Math Solver</h1>
          <p className="text-white/70">
            Math solving functionality has been removed
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-white/5 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">Math Solver Disabled</h2>
              <p className="text-white/70">
                The mathematical reasoning functionality has been removed from this application.
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default MathSolver;
