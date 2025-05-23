
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Loader2, Calculator } from "lucide-react";
import { useMathSolver, WolframAlphaResult } from "@/hooks/useMathSolver";
import { MathSolution } from "./MathSolution";

interface MathInputProps {
  onResultGenerated?: (result: WolframAlphaResult) => void;
}

const MathInput = ({ onResultGenerated }: MathInputProps) => {
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const { solveEquation, result, isProcessing } = useMathSolver();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    
    setLastQuery(query);
    const mathResult = await solveEquation(query);
    
    if (mathResult && onResultGenerated) {
      onResultGenerated(mathResult);
    }
  };

  const handleRecompute = async () => {
    if (!lastQuery) return;
    const mathResult = await solveEquation(lastQuery);
    
    if (mathResult && onResultGenerated) {
      onResultGenerated(mathResult);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-4">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="flex flex-col space-y-2">
            <label htmlFor="math-query" className="text-sm font-medium">
              Enter a mathematical expression, equation, or problem:
            </label>
            <div className="flex space-x-2">
              <Input
                id="math-query"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="e.g., solve x^2 + 3x - 4 = 0"
                className="flex-1"
                disabled={isProcessing}
              />
              <Button type="submit" disabled={isProcessing || !query.trim()}>
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Computing
                  </>
                ) : (
                  <>
                    <Calculator className="mr-2 h-4 w-4" />
                    Solve
                  </>
                )}
              </Button>
            </div>
          </div>
          <div className="text-sm text-gray-500">
            <p>Examples:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={() => setQuery("integrate x^2 sin(x)")}
                >
                  integrate x^2 sin(x)
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={() => setQuery("solve system x + y = 7, x - y = 3")}
                >
                  solve system x + y = 7, x - y = 3
                </button>
              </li>
              <li>
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={() => setQuery("plot sin(x)cos(x) from x=0 to 2pi")}
                >
                  plot sin(x)cos(x) from x=0 to 2pi
                </button>
              </li>
            </ul>
          </div>
        </form>
      </Card>

      {result && (
        <MathSolution 
          result={result} 
          query={lastQuery} 
          onRecompute={handleRecompute} 
        />
      )}
    </div>
  );
};

export default MathInput;
