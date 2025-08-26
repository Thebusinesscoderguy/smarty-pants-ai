import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Sparkles } from 'lucide-react';

export const SampleDataButton = () => {
  const [isLoading, setIsLoading] = useState(false);

  const createSampleData = async () => {
    setIsLoading(true);
    
    try {
      const { data, error } = await supabase.functions.invoke('create-sample-quests');
      
      if (error) throw error;
      
      toast({
        title: "Sample Data Created!",
        description: "Sample quests and achievements are now available.",
      });
      
      // Refresh the page to show new data
      window.location.reload();
    } catch (error: any) {
      console.error('Error creating sample data:', error);
      toast({
        title: "Error",
        description: "Failed to create sample data. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Button 
      onClick={createSampleData}
      disabled={isLoading}
      className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
    >
      <Sparkles className="h-4 w-4 mr-2" />
      {isLoading ? 'Creating...' : 'Create Sample Quests & Achievements'}
    </Button>
  );
};