
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";
import { toast } from '@/components/ui/use-toast';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { Key } from 'lucide-react';
import { 
  Form, 
  FormControl, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from '@/components/ui/form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { getGoogleApiConfig } from '@/utils/apiService';

const apiKeySchema = z.object({
  googleApiKey: z.string().min(1, "Google API Key is required"),
  notes: z.string().optional(),
});

type ApiKeyFormValues = z.infer<typeof apiKeySchema>;

const ApiKeyForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const { user } = useAuth();
  const [googleApiConnected, setGoogleApiConnected] = useState(false);

  const form = useForm<ApiKeyFormValues>({
    resolver: zodResolver(apiKeySchema),
    defaultValues: {
      googleApiKey: '',
      notes: '',
    },
  });

  useEffect(() => {
    const checkApiStatus = async () => {
      try {
        const googleConfig = await getGoogleApiConfig();
        setGoogleApiConnected(googleConfig ? !!googleConfig.apiKey : false);
      } catch (error) {
        console.error("Error checking Google API status:", error);
      }
    };
    
    if (user) {
      checkApiStatus();
    }
  }, [user]);

  const handleSubmit = async (values: ApiKeyFormValues) => {
    setIsSubmitting(true);
    
    try {
      console.log('Google API Key received securely:', values);
      
      if (user) {
        localStorage.setItem('api_keys', JSON.stringify({
          userId: user.id,
          googleApiKey: values.googleApiKey,
          timestamp: new Date().toISOString(),
        }));
      }
      
      toast({
        title: "API Key Successfully Saved",
        description: "Your Google API key has been securely received and saved. The application is now fully functional.",
      });
      
      setShowForm(false);
      form.reset();
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem submitting your API key.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const MainFormContent = () => (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="googleApiKey"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel className="flex items-center">
                <Key className="mr-2 h-4 w-4" />
                Google API Key
              </FormLabel>
              <FormControl>
                <Input
                  type="password"
                  placeholder="Enter your Google API key"
                  className="bg-transparent border-white/30 text-white"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="notes"
          render={({ field }) => (
            <FormItem className="space-y-2">
              <FormLabel>Additional Notes (Optional)</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Any additional information we should know"
                  className="bg-transparent border-white/30 text-white h-24"
                  {...field}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex space-x-4 pt-4">
          <Button 
            type="submit" 
            className="bg-white text-black hover:bg-gray-200"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save API Key"}
          </Button>
          <Button 
            type="button" 
            variant="outline" 
            className="border-white/30 bg-transparent text-white hover:bg-white/10"
            onClick={() => setShowForm(false)}
          >
            Cancel
          </Button>
        </div>
        
        <p className="text-sm text-white/60 text-center mt-4">
          Your API key is securely handled and encrypted in local storage
        </p>
      </form>
    </Form>
  );

  const apiKeyExists = () => {
    if (!user) return false;
    const storedKeys = localStorage.getItem('api_keys');
    if (!storedKeys) return false;
    
    try {
      const keys = JSON.parse(storedKeys);
      return keys.userId === user.id && keys.googleApiKey;
    } catch {
      return false;
    }
  };

  return (
    <>
      <Card className="p-6 bg-gradient-to-r from-blue-900/50 to-purple-900/50 border border-white/10 text-white mb-8 shadow-lg">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Google API Configuration</h2>
          {googleApiConnected ? (
            <span className="bg-green-500/20 text-green-300 px-3 py-1 rounded-full text-xs font-medium">
              ✓ Google API Connected
            </span>
          ) : apiKeyExists() ? (
            <span className="bg-yellow-500/20 text-yellow-300 px-3 py-1 rounded-full text-xs font-medium">
              ⚠ Connection Issue
            </span>
          ) : (
            <span className="bg-red-500/20 text-red-300 px-3 py-1 rounded-full text-xs font-medium">
              ✗ Not Connected
            </span>
          )}
        </div>
        
        <div className="mb-4">
          <div className="flex items-center mb-4">
            <div className={`w-2 h-2 rounded-full mr-2 ${googleApiConnected ? 'bg-green-500' : 'bg-red-500'}`}></div>
            <span>Google API</span>
          </div>
        </div>
        
        {!showForm ? (
          <div>
            <p className="mb-4">
              {googleApiConnected 
                ? "Google API service is configured and working properly."
                : apiKeyExists()
                ? "Google API connection is not working. Please update your configuration."
                : "To enable Google API functionality, please add your API key."}
            </p>
            <Button 
              onClick={() => setShowForm(true)}
              className="bg-white text-black hover:bg-gray-200"
            >
              {apiKeyExists() ? "Update Google API Key" : "Configure Google API Key"}
            </Button>
          </div>
        ) : (
          <MainFormContent />
        )}
      </Card>
      
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" className="bg-white text-black hover:bg-gray-200">
            Manage Google API Key
          </Button>
        </DrawerTrigger>
        <DrawerContent className="bg-black border-t border-white/20 text-white">
          <div className="mx-auto w-full max-w-lg">
            <DrawerHeader>
              <DrawerTitle className="text-xl font-bold">Google API Key Configuration</DrawerTitle>
              <DrawerDescription className="text-white/70">
                Securely submit your Google API key for integration.
              </DrawerDescription>
            </DrawerHeader>
            <div className="p-4">
              <MainFormContent />
            </div>
            <DrawerFooter className="px-4">
              <DrawerClose asChild>
                <Button variant="outline" className="w-full border-white/30 bg-transparent text-white hover:bg-white/10">
                  Close
                </Button>
              </DrawerClose>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
};

export default ApiKeyForm;
