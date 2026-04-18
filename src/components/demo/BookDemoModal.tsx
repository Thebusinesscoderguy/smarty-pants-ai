import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, Loader2, Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';

const schema = z.object({
  name: z.string().trim().min(1, 'Required').max(200),
  email: z.string().trim().email('Invalid email').max(320),
  schoolName: z.string().trim().max(200).optional(),
  schoolSize: z.string().max(50).optional(),
  role: z.string().max(100).optional(),
  message: z.string().trim().max(2000).optional(),
});

interface BookDemoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const BookDemoModal = ({ open, onOpenChange }: BookDemoModalProps) => {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', email: '', schoolName: '', schoolSize: '', role: 'principal', message: '',
  });

  const handleChange = (field: string, value: string) => setForm(f => ({ ...f, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('submit-demo-request', { body: parsed.data });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || 'Could not send request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = (next: boolean) => {
    if (!next) {
      // Reset on close
      setTimeout(() => {
        setSubmitted(false);
        setForm({ name: '', email: '', schoolName: '', schoolSize: '', role: 'principal', message: '' });
      }, 200);
    }
    onOpenChange(next);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Calendar className="w-6 h-6 text-primary" />
            Book a demo
          </DialogTitle>
          <DialogDescription>
            See how Teachly fits your school. We'll get back within 24 hours to schedule a 30-minute walkthrough.
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center space-y-3">
            <CheckCircle2 className="w-14 h-14 text-primary mx-auto" />
            <h3 className="text-xl font-semibold">Thanks — we got it.</h3>
            <p className="text-muted-foreground">We'll reply to <strong>{form.email}</strong> within 24 hours to set up a time.</p>
            <Button onClick={() => handleClose(false)} variant="outline" className="mt-4">Close</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="bd-name">Your name *</Label>
                <Input id="bd-name" value={form.name} onChange={e => handleChange('name', e.target.value)} required maxLength={200} />
              </div>
              <div>
                <Label htmlFor="bd-email">Work email *</Label>
                <Input id="bd-email" type="email" value={form.email} onChange={e => handleChange('email', e.target.value)} required maxLength={320} />
              </div>
            </div>
            <div>
              <Label htmlFor="bd-school">School / organization</Label>
              <Input id="bd-school" value={form.schoolName} onChange={e => handleChange('schoolName', e.target.value)} maxLength={200} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label>Role</Label>
                <Select value={form.role} onValueChange={v => handleChange('role', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="principal">Principal / Head</SelectItem>
                    <SelectItem value="admin">School admin</SelectItem>
                    <SelectItem value="teacher">Teacher</SelectItem>
                    <SelectItem value="it">IT / Tech lead</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>School size</Label>
                <Select value={form.schoolSize} onValueChange={v => handleChange('schoolSize', v)}>
                  <SelectTrigger><SelectValue placeholder="Optional" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="<100">Under 100 students</SelectItem>
                    <SelectItem value="100-500">100–500</SelectItem>
                    <SelectItem value="500-1500">500–1,500</SelectItem>
                    <SelectItem value="1500+">1,500+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="bd-msg">What would you like to see? (optional)</Label>
              <Textarea id="bd-msg" rows={3} value={form.message} onChange={e => handleChange('message', e.target.value)} maxLength={2000} placeholder="e.g., gradebook, parent communication, AI tutor..." />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Sending...</> : 'Request demo'}
            </Button>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};
