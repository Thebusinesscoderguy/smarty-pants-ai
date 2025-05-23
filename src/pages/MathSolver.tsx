
import { useAuth } from "@/contexts/AuthContext";
import { AppSidebar } from "@/components/AppSidebar";
import { ScrollArea } from "@/components/ui/scroll-area";
import MathInput from "@/components/math/MathInput";
import { useEffect, useState } from "react";
import { WolframAlphaResult } from "@/hooks/useMathSolver";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";

const MathSolver = () => {
  const { user } = useAuth();
  const [hasAppId, setHasAppId] = useState<boolean | null>(null);

  // Check if Wolfram Alpha App ID is configured
  useEffect(() => {
    const checkWolframConfig = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('wolfram-alpha', {
          body: { query: "pi" }
        });
        
        if (error && error.message.includes('App ID not configured')) {
          setHasAppId(false);
          toast({
            title: "Configuration Required",
            description: "Wolfram|Alpha App ID is not configured. Please contact your administrator.",
            variant: "destructive"
          });
        } else {
          setHasAppId(true);
        }
      } catch (err) {
        console.error("Error checking Wolfram|Alpha configuration:", err);
        setHasAppId(false);
      }
    };
    
    checkWolframConfig();
  }, []);

  const handleResultGenerated = (result: WolframAlphaResult) => {
    if (result.success) {
      // You could integrate this with your chat system here
      console.log("Math problem solved successfully");
    }
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 to-gray-800 text-white overflow-hidden">
      <div className="w-64 flex-shrink-0 border-r border-white/10">
        <AppSidebar />
      </div>

      <div className="flex-1 flex flex-col max-h-screen overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-white/10">
          <h1 className="text-2xl font-bold">Advanced Mathematical Solver</h1>
          <p className="text-white/70">
            Solve complex equations, visualize functions, and get step-by-step solutions
          </p>
        </div>

        <ScrollArea className="flex-1">
          <div className="p-6 max-w-4xl mx-auto">
            {!hasAppId && hasAppId !== null ? (
              <div className="bg-amber-900/20 border border-amber-700/30 rounded-lg p-4 mb-6">
                <h2 className="text-lg font-semibold text-amber-400">Configuration Required</h2>
                <p className="text-white/70 mt-2">
                  The Wolfram|Alpha integration requires an App ID. Please add your Wolfram|Alpha App ID to the Supabase Edge Functions secrets with the name <code className="bg-black/30 px-1 py-0.5 rounded">WOLFRAM_ALPHA_APP_ID</code>.
                </p>
                <p className="text-white/70 mt-2">
                  You can get a free App ID from the <a href="https://developer.wolframalpha.com/portal/myapps/" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Wolfram|Alpha Developer Portal</a>.
                </p>
              </div>
            ) : null}
            
            <div className="bg-white/5 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Math Solver</h2>
              <MathInput onResultGenerated={handleResultGenerated} />
            </div>
            
            <div className="bg-white/5 rounded-lg p-6">
              <h2 className="text-xl font-semibold mb-4">About This Feature</h2>
              <p className="text-white/70 mb-4">
                This mathematical reasoning system leverages the Wolfram|Alpha computational knowledge engine to provide:
              </p>
              <ul className="list-disc text-white/70 pl-5 space-y-2 mb-4">
                <li>Highly accurate mathematical computations</li>
                <li>Step-by-step solutions to complex problems</li>
                <li>Visual representations of functions and equations</li>
                <li>Access to a vast database of mathematical formulas and rules</li>
              </ul>
              <p className="text-white/70">
                By combining our AI tutor with this external computational logic layer, we create a hybrid intelligence model that dramatically increases accuracy, particularly in STEM subjects.
              </p>
            </div>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default MathSolver;
