
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

export async function getApiConfig(service: ServiceType): Promise<ApiConfig | null> {
  try {
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
