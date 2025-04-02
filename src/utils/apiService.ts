
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

type ServiceType = 'google' | 'paypal';

interface GoogleApiConfig {
  apiKey: string;
}

interface PayPalApiConfig {
  clientId: string;
  hasSecret: boolean;
}

export type ApiConfig = GoogleApiConfig | PayPalApiConfig;

// Type guard functions to narrow down the type
export function isGoogleConfig(config: ApiConfig): config is GoogleApiConfig {
  return (config as GoogleApiConfig).apiKey !== undefined;
}

export function isPayPalConfig(config: ApiConfig): config is PayPalApiConfig {
  return (config as PayPalApiConfig).clientId !== undefined;
}

export async function getApiConfig(service: ServiceType): Promise<ApiConfig | null> {
  try {
    console.log(`Fetching API config for ${service}...`);
    const { data, error } = await supabase.functions.invoke('get-api-service', {
      body: { service },
    });

    if (error) {
      console.error("Error fetching API config:", error);
      toast({
        title: "Error",
        description: `Failed to fetch ${service} API configuration`,
        variant: "destructive",
      });
      return null;
    }

    if (!data) {
      console.warn(`No API config data returned for ${service}`);
      toast({
        title: "Warning",
        description: `No ${service} API configuration found`,
        variant: "destructive",
      });
      return null;
    }

    console.log(`Successfully retrieved ${service} API config`);
    toast({
      title: "Success",
      description: `${service} API configuration loaded successfully`,
    });
    
    return data;
  } catch (error) {
    console.error("Error fetching API config:", error);
    toast({
      title: "Error",
      description: `Failed to fetch ${service} API configuration`,
      variant: "destructive",
    });
    return null;
  }
}

// Function to test API connections on app startup
export async function testApiConnections(): Promise<boolean> {
  console.log("Testing API connections...");
  
  // Test Google API connectivity
  const googleConfig = await getApiConfig('google');
  const googleConnected = googleConfig ? isGoogleConfig(googleConfig) && !!googleConfig.apiKey : false;
  
  // Test PayPal API connectivity
  const paypalConfig = await getApiConfig('paypal');
  const paypalConnected = paypalConfig ? isPayPalConfig(paypalConfig) && !!paypalConfig.clientId && paypalConfig.hasSecret : false;
  
  const allConnected = googleConnected && paypalConnected;
  
  console.log(`API connections status: Google=${googleConnected}, PayPal=${paypalConnected}`);
  
  if (allConnected) {
    toast({
      title: "API Connections",
      description: "All API services connected successfully!",
    });
  } else {
    toast({
      title: "API Connection Warning",
      description: `Some API connections failed: ${!googleConnected ? 'Google, ' : ''}${!paypalConnected ? 'PayPal' : ''}`,
      variant: "destructive",
    });
  }
  
  return allConnected;
}
