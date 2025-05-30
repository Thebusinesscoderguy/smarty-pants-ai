
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Calculator, ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { WolframAlphaResult } from '@/hooks/useMathSolver';

interface MathResultDisplayProps {
  result: WolframAlphaResult;
  className?: string;
}

export const MathResultDisplay = ({ result, className = '' }: MathResultDisplayProps) => {
  const [showDetails, setShowDetails] = useState(false);

  if (!result || result.error) {
    return null;
  }

  const resultPod = result.pods?.find(pod => 
    pod.id === 'Result' || pod.title === 'Result'
  );

  const solutionPod = result.pods?.find(pod => 
    pod.id === 'Solution' || pod.title.includes('Solution')
  );

  const plotPods = result.pods?.filter(pod => 
    ['Plot', 'VisualRepresentation', 'Graphics'].includes(pod.id)
  );

  return (
    <Card className={`mt-3 p-4 bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-700 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Calculator className="h-4 w-4 text-purple-600 dark:text-purple-400" />
          <span className="text-sm font-medium text-purple-800 dark:text-purple-200">
            Math Solution
          </span>
        </div>
        {(solutionPod || plotPods?.length) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowDetails(!showDetails)}
            className="text-purple-600 dark:text-purple-400"
          >
            {showDetails ? (
              <>Hide Details <ChevronUp className="h-3 w-3 ml-1" /></>
            ) : (
              <>Show Details <ChevronDown className="h-3 w-3 ml-1" /></>
            )}
          </Button>
        )}
      </div>

      {resultPod && resultPod.subpods[0]?.plaintext && (
        <div className="mb-2">
          <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Result:</div>
          <div className="font-mono text-sm bg-white dark:bg-gray-800 p-2 rounded border">
            {resultPod.subpods[0].plaintext}
          </div>
        </div>
      )}

      {showDetails && (
        <div className="space-y-3 mt-3 border-t border-purple-200 dark:border-purple-700 pt-3">
          {solutionPod && (
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Step-by-step solution:</div>
              <div className="space-y-2">
                {solutionPod.subpods.map((subpod, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 p-2 rounded border">
                    {subpod.plaintext && (
                      <div className="font-mono text-sm whitespace-pre-wrap">
                        {subpod.plaintext}
                      </div>
                    )}
                    {subpod.img && (
                      <img 
                        src={subpod.img.src} 
                        alt={subpod.img.alt}
                        className="mt-2 max-w-full"
                      />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {plotPods && plotPods.length > 0 && (
            <div>
              <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Visualizations:</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {plotPods.map((pod, podIndex) => 
                  pod.subpods.map((subpod, subIndex) => 
                    subpod.img && (
                      <div key={`${podIndex}-${subIndex}`} className="bg-white dark:bg-gray-800 p-2 rounded border">
                        <img 
                          src={subpod.img.src} 
                          alt={subpod.img.alt}
                          className="w-full"
                        />
                      </div>
                    )
                  )
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-purple-600 dark:text-purple-400 mt-2">
        Powered by Wolfram|Alpha
      </div>
    </Card>
  );
};
