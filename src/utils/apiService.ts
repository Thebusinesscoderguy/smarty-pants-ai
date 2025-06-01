
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface GoogleApiConfig {
  apiKey: string;
}

export async function getGoogleApiConfig(): Promise<GoogleApiConfig | null> {
  try {
    console.log('Fetching Google API config...');
    const { data, error } = await supabase.functions.invoke('get-api-service', {
      body: { service: 'google' },
    });

    if (error) {
      console.error("Error fetching Google API config:", error);
      toast({
        title: "Error",
        description: "Failed to fetch Google API configuration",
        variant: "destructive",
      });
      return null;
    }

    if (!data) {
      console.warn('No Google API config data returned');
      toast({
        title: "Warning",
        description: "No Google API configuration found",
        variant: "destructive",
      });
      return null;
    }

    console.log('Successfully retrieved Google API config');
    toast({
      title: "Success",
      description: "Google API configuration loaded successfully",
    });
    
    return data;
  } catch (error) {
    console.error("Error fetching Google API config:", error);
    toast({
      title: "Error",
      description: "Failed to fetch Google API configuration",
      variant: "destructive",
    });
    return null;
  }
}

// Function to test Google API connectivity on app startup
export async function testApiConnections(): Promise<boolean> {
  console.log("Testing Google API connection...");
  
  const googleConfig = await getGoogleApiConfig();
  const googleConnected = googleConfig ? !!googleConfig.apiKey : false;
  
  console.log(`Google API connection status: ${googleConnected}`);
  
  if (googleConnected) {
    toast({
      title: "API Connection",
      description: "Google API connected successfully!",
    });
  } else {
    toast({
      title: "API Connection Warning",
      description: "Google API connection failed",
      variant: "destructive",
    });
  }
  
  return googleConnected;
}
