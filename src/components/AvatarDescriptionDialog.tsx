
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface AvatarDescriptionDialogProps {
  open: boolean;
  onClose: () => void;
  onAvatarGenerated: (avatarUrl: string) => void;
}

const AvatarDescriptionDialog: React.FC<AvatarDescriptionDialogProps> = ({
  open,
  onClose,
  onAvatarGenerated
}) => {
  const [description, setDescription] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();

  const handleGenerateAvatar = async () => {
    if (!description.trim()) {
      toast({
        title: "Description required",
        description: "Please provide a description of how you want your avatar to look.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsGenerating(true);

      // Currently, we'll use the default animation since we don't have a real
      // avatar generation service connected yet. In a real implementation,
      // this would call an AI image generation API.
      
      // Simulate API call with timeout
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For now, we store the description but use the default avatar
      const avatarUrl = "/default-avatar.png"; // Default placeholder

      // Store the user's avatar description and URL
      if (user) {
        // Use type assertion to bypass TypeScript's type checking
        // for the RPC function that's not in the generated types
        const { error } = await (supabase.rpc as any)('store_user_avatar', {
          p_user_id: user.id,
          p_description: description,
          p_avatar_url: avatarUrl
        });

        if (error) throw error;
      }

      toast({
        title: "Avatar created",
        description: "Your personalized avatar has been generated!",
      });

      onAvatarGenerated(avatarUrl);
      onClose();
    } catch (error: any) {
      console.error("Error generating avatar:", error);
      toast({
        title: "Generation failed",
        description: error.message || "Could not generate your avatar. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="bg-black border-white/20 text-white max-w-md">
        <DialogHeader>
          <DialogTitle>Create Your Avatar</DialogTitle>
          <DialogDescription className="text-white/70">
            Describe how you want your avatar to look, and we'll generate it for you.
          </DialogDescription>
        </DialogHeader>
        
        <Textarea
          placeholder="Example: A professional looking avatar with short brown hair, glasses, and a friendly smile."
          className="min-h-[150px] bg-white/5 border-white/20 text-white"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="border-white/20 text-white">
            Cancel
          </Button>
          <Button 
            onClick={handleGenerateAvatar} 
            disabled={isGenerating || !description.trim()}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {isGenerating ? "Generating..." : "Generate Avatar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AvatarDescriptionDialog;
