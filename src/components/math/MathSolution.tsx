
import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { WolframAlphaResult } from '@/hooks/useMathSolver';
import { ScrollArea } from "@/components/ui/scroll-area";

interface MathSolutionProps {
  result: WolframAlphaResult;
  query: string;
  onRecompute?: () => void;
  className?: string;
}

export const MathSolution = ({ result, query, onRecompute, className = '' }: MathSolutionProps) => {
  const [expanded, setExpanded] = useState(true);

  if (!result || result.error) {
    return (
      <Card className="p-4 bg-red-50 text-red-800 dark:bg-red-900/20 dark:text-red-300">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">Error Processing Mathematical Query</h3>
            <p className="text-sm mt-1">{result?.error || "Could not process this equation."}</p>
          </div>
          {onRecompute && (
            <Button size="sm" variant="outline" onClick={onRecompute}>
              <RefreshCw className="h-4 w-4 mr-1" /> Try Again
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const hasSolutions = result.pods?.some(pod => pod.id === 'Solution' || pod.id === 'Result');
  const hasVisuals = result.pods?.some(pod => ['Plot', 'VisualRepresentation', 'Graphics'].includes(pod.id));

  return (
    <Card className={`overflow-hidden bg-white dark:bg-gray-900/60 ${className}`}>
      <div className="flex items-center justify-between p-4 bg-purple-50 dark:bg-purple-900/20">
        <div>
          <h3 className="text-lg font-semibold flex items-center">
            <span className="bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-100 px-2 py-0.5 rounded text-sm mr-2">
              Math Solution
            </span>
            {result.interpretation || query}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {onRecompute && (
            <Button size="sm" variant="outline" onClick={onRecompute} className="h-8">
              <RefreshCw className="h-4 w-4 mr-1" /> Recompute
            </Button>
          )}
          <Button 
            size="sm" 
            variant="ghost" 
            onClick={() => setExpanded(!expanded)} 
            className="h-8"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {expanded && (
        <div>
          <Tabs defaultValue="solution" className="w-full">
            <div className="px-4 pt-2">
              <TabsList className="grid w-full max-w-md grid-cols-3">
                <TabsTrigger value="solution">Solution</TabsTrigger>
                {hasVisuals && <TabsTrigger value="visuals">Visuals</TabsTrigger>}
                <TabsTrigger value="details">Details</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="solution" className="p-4">
              <ScrollArea className="h-[300px] pr-4">
                {result.pods?.filter(pod => 
                  ['Result', 'Solution', 'Derivative', 'Integral', 'Input', 'AlternativeForms'].includes(pod.id)
                ).map((pod, index) => (
                  <div key={`${pod.id}-${index}`} className="mb-4">
                    <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-1">{pod.title}</h4>
                    <div className="space-y-2">
                      {pod.subpods.map((subpod, subIndex) => (
                        <div key={subIndex} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                          {subpod.plaintext && (
                            <div className="whitespace-pre-wrap font-mono text-sm">
                              {subpod.plaintext}
                            </div>
                          )}
                          {subpod.img && (
                            <div className="mt-2">
                              <img 
                                src={subpod.img.src} 
                                alt={subpod.img.alt} 
                                width={subpod.img.width} 
                                height={subpod.img.height}
                                className="max-w-full"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {index < result.pods.length - 1 && <Separator className="my-3" />}
                  </div>
                ))}
                {!hasSolutions && (
                  <div className="text-center p-6">
                    <p className="text-gray-500">No detailed solution available for this query.</p>
                  </div>
                )}
              </ScrollArea>
            </TabsContent>

            {hasVisuals && (
              <TabsContent value="visuals" className="p-4">
                <ScrollArea className="h-[300px] pr-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {result.pods?.filter(pod => 
                      ['Plot', 'VisualRepresentation', 'Graphics'].includes(pod.id)
                    ).map((pod, index) => (
                      <div key={`${pod.id}-${index}`} className="mb-4">
                        <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-1">{pod.title}</h4>
                        <div className="space-y-2">
                          {pod.subpods.map((subpod, subIndex) => (
                            <div key={subIndex} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                              {subpod.img && (
                                <div className="flex justify-center">
                                  <img 
                                    src={subpod.img.src} 
                                    alt={subpod.img.alt} 
                                    width={subpod.img.width} 
                                    height={subpod.img.height}
                                    className="max-w-full"
                                  />
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {!hasVisuals && (
                      <div className="text-center p-6">
                        <p className="text-gray-500">No visualizations available for this query.</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </TabsContent>
            )}

            <TabsContent value="details" className="p-4">
              <ScrollArea className="h-[300px] pr-4">
                {result.pods?.map((pod, index) => (
                  <div key={`${pod.id}-${index}`} className="mb-4">
                    <h4 className="font-medium text-sm text-gray-500 dark:text-gray-400 mb-1">{pod.title}</h4>
                    <div className="space-y-2">
                      {pod.subpods.map((subpod, subIndex) => (
                        <div key={subIndex} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-md">
                          {subpod.plaintext && (
                            <div className="whitespace-pre-wrap font-mono text-sm">
                              {subpod.plaintext}
                            </div>
                          )}
                          {subpod.img && (
                            <div className="mt-2">
                              <img 
                                src={subpod.img.src} 
                                alt={subpod.img.alt} 
                                width={subpod.img.width} 
                                height={subpod.img.height}
                                className="max-w-full"
                              />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {index < result.pods.length - 1 && <Separator className="my-3" />}
                  </div>
                ))}
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </div>
      )}

      <div className="bg-purple-50 dark:bg-purple-900/10 px-4 py-2 text-xs text-purple-600 dark:text-purple-300">
        Powered by Wolfram|Alpha • Computed in {result.timing ? (result.timing / 1000).toFixed(2) : '?'} seconds
      </div>
    </Card>
  );
};
