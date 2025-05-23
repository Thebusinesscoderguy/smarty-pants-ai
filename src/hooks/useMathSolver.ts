
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

export interface WolframAlphaResult {
  success: boolean;
  error: boolean;
  numpods?: number;
  timing?: number;
  pods: Array<{
    title: string;
    id: string;
    position?: number;
    subpods: Array<{
      plaintext?: string;
      img?: {
        src: string;
        alt: string;
        width: string;
        height: string;
      };
    }>;
  }>;
  interpretation?: string;
  solutions?: Array<any>;
  visualizations?: Array<any>;
  steps?: Array<any>;
}

export const useMathSolver = () => {
  const [result, setResult] = useState<WolframAlphaResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const solveEquation = async (query: string, podState?: string) => {
    try {
      setIsProcessing(true);
      setError(null);

      console.log(`Sending math query to Wolfram|Alpha: ${query}`);

      const { data, error: apiError } = await supabase.functions.invoke('wolfram-alpha', {
        body: { 
          query,
          podState
        }
      });

      if (apiError) {
        console.error('Error calling Wolfram|Alpha API:', apiError);
        throw new Error(apiError.message || 'Failed to process mathematical query');
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setResult(data);
      return data;
    } catch (err: any) {
      const errorMessage = err.message || 'An error occurred while processing your mathematical query';
      console.error('Math solver error:', errorMessage);
      setError(errorMessage);
      toast({
        title: "Math Processing Error",
        description: errorMessage,
        variant: "destructive"
      });
      return null;
    } finally {
      setIsProcessing(false);
    }
  };

  const getStepByStepSolution = (result: WolframAlphaResult) => {
    // Find pods with step-by-step solutions
    const solutionPod = result.pods?.find(pod => 
      pod.id === 'Solution' || 
      pod.title.includes('Solution') || 
      pod.title.includes('step')
    );
    
    if (solutionPod) {
      return solutionPod.subpods;
    }
    
    return null;
  };

  const getResultValue = (result: WolframAlphaResult) => {
    // Find the Result pod
    const resultPod = result.pods?.find(pod => 
      pod.id === 'Result' || 
      pod.title === 'Result'
    );
    
    if (resultPod && resultPod.subpods.length > 0) {
      return resultPod.subpods[0].plaintext;
    }
    
    return null;
  };

  const getVisualization = (result: WolframAlphaResult) => {
    // Find pods with visualizations
    const visualPods = result.pods?.filter(pod => 
      pod.id === 'Plot' || 
      pod.id === 'VisualRepresentation' ||
      pod.id === 'Graphics'
    );
    
    if (visualPods && visualPods.length > 0) {
      return visualPods.flatMap(pod => 
        pod.subpods
          .filter(subpod => subpod.img)
          .map(subpod => subpod.img)
      );
    }
    
    return null;
  };

  return {
    result,
    isProcessing,
    error,
    solveEquation,
    getStepByStepSolution,
    getResultValue,
    getVisualization
  };
};
