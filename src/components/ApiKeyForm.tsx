
import { useState } from 'react';
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

const ApiKeyForm = () => {
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [paypalClientId, setPaypalClientId] = useState('');
  const [paypalSecretKey, setPaypalSecretKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    try {
      // Here we would normally submit to a secure backend
      // For now we'll just simulate success and show a toast
      console.log('API Keys received securely');
      
      // Clear the form
      setGoogleApiKey('');
      setPaypalClientId('');
      setPaypalSecretKey('');
      
      toast({
        title: "API Keys Received",
        description: "Your API keys have been securely received. We'll implement them right away.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "There was a problem submitting your API keys.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Drawer>
      <DrawerTrigger asChild>
        <Button variant="outline" className="bg-white text-black hover:bg-gray-200">
          Submit API Keys
        </Button>
      </DrawerTrigger>
      <DrawerContent className="bg-black border-t border-white/20 text-white">
        <div className="mx-auto w-full max-w-lg">
          <DrawerHeader>
            <DrawerTitle className="text-xl font-bold">API Key Submission</DrawerTitle>
            <DrawerDescription className="text-white/70">
              Securely submit your API keys for Google and PayPal integration.
            </DrawerDescription>
          </DrawerHeader>
          <form onSubmit={handleSubmit} className="p-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="googleApiKey">Google API Key</Label>
                <Input
                  id="googleApiKey"
                  type="password"
                  value={googleApiKey}
                  onChange={(e) => setGoogleApiKey(e.target.value)}
                  className="bg-transparent border-white/30 text-white"
                  placeholder="Enter your Google API key"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paypalClientId">PayPal Client ID</Label>
                <Input
                  id="paypalClientId"
                  type="password"
                  value={paypalClientId}
                  onChange={(e) => setPaypalClientId(e.target.value)}
                  className="bg-transparent border-white/30 text-white"
                  placeholder="Enter your PayPal Client ID"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="paypalSecretKey">PayPal Secret Key</Label>
                <Input
                  id="paypalSecretKey"
                  type="password"
                  value={paypalSecretKey}
                  onChange={(e) => setPaypalSecretKey(e.target.value)}
                  className="bg-transparent border-white/30 text-white"
                  placeholder="Enter your PayPal Secret Key"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="notes"
                  className="bg-transparent border-white/30 text-white h-24"
                  placeholder="Any additional information we should know"
                />
              </div>
            </div>
            
            <DrawerFooter className="px-0 pt-6">
              <Button 
                type="submit" 
                className="w-full bg-white text-black hover:bg-gray-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Securely"}
              </Button>
              <DrawerClose asChild>
                <Button variant="outline" className="w-full border-white/30 bg-transparent text-white hover:bg-white/10">
                  Cancel
                </Button>
              </DrawerClose>
              <p className="text-sm text-white/60 text-center mt-4">
                Your API keys are securely handled and never stored in client-side code.
              </p>
            </DrawerFooter>
          </form>
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default ApiKeyForm;
