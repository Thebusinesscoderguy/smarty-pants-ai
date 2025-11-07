
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ContactRound, Mail } from 'lucide-react';
import { toast } from '@/components/ui/use-toast';
import { z } from 'zod';

const contactSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name must be less than 100 characters"),
  email: z.string().email("Invalid email address").max(255, "Email must be less than 255 characters"),
  message: z.string().min(1, "Message is required").max(1000, "Message must be less than 1000 characters"),
});

export const ContactForm = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate input
    const result = contactSchema.safeParse({ name, email, message });
    
    if (!result.success) {
      const firstError = result.error.errors[0];
      toast({
        title: "Validation Error",
        description: firstError.message,
        variant: "destructive",
      });
      return;
    }
    
    const mailtoLink = `mailto:aldawoodali50@gmail.com?subject=Contact%20from%20Teachly&body=Name:%20${encodeURIComponent(name)}%0AEmail:%20${encodeURIComponent(email)}%0A%0AMessage:%20${encodeURIComponent(message)}`;
    
    window.location.href = mailtoLink;
    
    toast({
      title: "Redirecting to Email",
      description: "Your default email client will open momentarily.",
    });

    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <section className="w-full px-4 py-16 border-t border-white/10">
      <div className="max-w-md mx-auto">
        <div className="text-center mb-8">
          <ContactRound className="mx-auto h-12 w-12 text-blue-500 mb-4" />
          <h2 className="text-3xl font-bold">Contact Us</h2>
          <p className="text-white/70 mt-2">We'd love to hear from you</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-white/80 mb-2">Name</label>
            <Input 
              type="text" 
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your Name" 
              required 
              className="bg-white/10 border-white/20 text-white placeholder-white/50"
            />
          </div>
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-white/80 mb-2">Email</label>
            <Input 
              type="email" 
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com" 
              required 
              className="bg-white/10 border-white/20 text-white placeholder-white/50"
            />
          </div>
          <div>
            <label htmlFor="message" className="block text-sm font-medium text-white/80 mb-2">Message</label>
            <Textarea 
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Your message..." 
              required 
              className="bg-white/10 border-white/20 text-white placeholder-white/50 min-h-[120px]"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full bg-blue-500 hover:bg-blue-600 text-white"
          >
            <Mail className="mr-2 h-4 w-4" /> Send Message
          </Button>
        </form>
      </div>
    </section>
  );
};
