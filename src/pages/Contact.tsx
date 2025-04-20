
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/use-toast';
import { Mail, ContactRound } from 'lucide-react';

const Contact = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const mailtoLink = `mailto:aldawoodali50@gmail.com?subject=Contact%20from%20Teachly&body=Name:%20${encodeURIComponent(name)}%0AEmail:%20${encodeURIComponent(email)}%0A%0AMessage:%20${encodeURIComponent(message)}`;
    
    window.location.href = mailtoLink;
    
    toast({
      title: "Redirecting to Email",
      description: "Your default email client will open momentarily.",
    });

    // Reset form
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      <main className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white/5 border border-white/20 rounded-lg p-8">
          <div className="text-center mb-8">
            <ContactRound className="mx-auto h-12 w-12 text-blue-500 mb-4" />
            <h1 className="text-3xl font-bold">Contact Us</h1>
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
      </main>
    </div>
  );
};

export default Contact;
