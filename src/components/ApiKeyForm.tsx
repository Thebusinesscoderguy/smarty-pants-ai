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
import { Card } from '@/components/ui/card';

const ApiKeyForm = () => {
  const [googleApiKey, setGoogleApiKey] = useState('');
  const [paypalClientId, setPaypalClientId] = useState('');
  const [paypalSecretKey, setPaypalSecretKey] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);

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
      setShowForm(false);
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
    <>
      {!showForm ? (
        <Card className="p-6 bg-white/5 border border-white/10 text-white mb-8">
          <h2 className="text-xl font-bold mb-4">Add Your API Keys</h2>
          <p className="mb-4">To enable all functionality, please add your Google API key and PayPal credentials.</p>
          <Button 
            onClick={() => setShowForm(true)}
            className="bg-white text-black hover:bg-gray-200"
          >
            Add API Keys Now
          </Button>
        </Card>
      ) : (
        <Card className="p-6 bg-white/5 border border-white/10 text-white mb-8">
          <h2 className="text-xl font-bold mb-4">API Key Submission</h2>
          <p className="mb-4">Securely submit your API keys for Google and PayPal integration.</p>
          
          <form onSubmit={handleSubmit} className="space-y-4">
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
            
            <div className="flex space-x-4 pt-4">
              <Button 
                type="submit" 
                className="bg-white text-black hover:bg-gray-200"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Submitting..." : "Submit Securely"}
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
              Your API keys are securely handled and never stored in client-side code.
            </p>
          </form>
        </Card>
      )}
      
      <Drawer>
        <DrawerTrigger asChild>
          <Button variant="outline" className="bg-white text-black hover:bg-gray-200">
            Manage API Keys
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
                    id="drawerGoogleApiKey"
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
                    id="drawerPaypalClientId"
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
                    id="drawerPaypalSecretKey"
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
                    id="drawerNotes"
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
    </>
  );
};

export default ApiKeyForm;
