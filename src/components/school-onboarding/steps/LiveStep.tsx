import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, Copy, Users, GraduationCap, BookOpen, Sparkles, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';

interface Props {
  schoolName: string;
  studentsImported: number;
  teachersInvited: number;
  frameworkChosen: boolean;
  onFinish: () => Promise<void>;
}

export const LiveStep = ({ schoolName, studentsImported, teachersInvited, frameworkChosen, onFinish }: Props) => {
  const navigate = useNavigate();
  const [finishing, setFinishing] = useState(false);

  const baseUrl = window.location.origin;
  const studentInviteUrl = `${baseUrl}/auth?role=student`;
  const teacherInviteUrl = `${baseUrl}/auth?role=teacher`;

  const copy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: `${label} link copied!` });
  };

  const handleFinish = async (target: string) => {
    setFinishing(true);
    await onFinish();
    navigate(target);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/15 to-transparent border-primary/30 text-center">
        <div className="flex justify-center mb-3">
          <div className="p-3 rounded-full bg-primary/20">
            <CheckCircle2 className="h-10 w-10 text-primary" />
          </div>
        </div>
        <h3 className="text-2xl font-bold mb-2">{schoolName} is live! 🎉</h3>
        <p className="text-sm text-muted-foreground">
          Your school is set up and ready. Here's what's been done:
        </p>
        <div className="grid grid-cols-3 gap-3 mt-5">
          <div className="p-3 rounded-lg bg-card border">
            <Users className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{studentsImported}</p>
            <p className="text-xs text-muted-foreground">students</p>
          </div>
          <div className="p-3 rounded-lg bg-card border">
            <GraduationCap className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{teachersInvited}</p>
            <p className="text-xs text-muted-foreground">teachers</p>
          </div>
          <div className="p-3 rounded-lg bg-card border">
            <BookOpen className="h-4 w-4 text-primary mx-auto mb-1" />
            <p className="text-2xl font-bold">{frameworkChosen ? '✓' : '—'}</p>
            <p className="text-xs text-muted-foreground">curriculum</p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <div className="flex items-start gap-3 mb-4">
          <Sparkles className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h4 className="font-semibold">Share your invite links</h4>
            <p className="text-xs text-muted-foreground mt-0.5">
              Send these to anyone who didn't get an automatic invitation email.
            </p>
          </div>
        </div>
        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5">
              <Users className="h-3 w-3" /> Student sign-up link
            </label>
            <div className="flex gap-2">
              <Input value={studentInviteUrl} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="sm" onClick={() => copy(studentInviteUrl, 'Student')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
          <div>
            <label className="text-xs font-medium flex items-center gap-1.5 mb-1.5">
              <GraduationCap className="h-3 w-3" /> Teacher sign-up link
            </label>
            <div className="flex gap-2">
              <Input value={teacherInviteUrl} readOnly className="font-mono text-xs" />
              <Button variant="outline" size="sm" onClick={() => copy(teacherInviteUrl, 'Teacher')}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h4 className="font-semibold mb-3">How to invite more people later</h4>
        <ol className="space-y-2 text-sm text-muted-foreground">
          <li className="flex gap-3">
            <Badge variant="outline" className="shrink-0">1</Badge>
            <span><strong className="text-foreground">Students:</strong> School Admin → Students → "Invite student" or "Bulk import CSV"</span>
          </li>
          <li className="flex gap-3">
            <Badge variant="outline" className="shrink-0">2</Badge>
            <span><strong className="text-foreground">Teachers:</strong> School Admin → Teachers → "Add Teacher", then assign subjects + sections</span>
          </li>
          <li className="flex gap-3">
            <Badge variant="outline" className="shrink-0">3</Badge>
            <span><strong className="text-foreground">Announce it:</strong> Post a welcome message in the News tab so parents and students know what to expect</span>
          </li>
        </ol>
      </Card>

      <div className="flex flex-col sm:flex-row gap-2">
        <Button
          variant="outline"
          className="flex-1"
          disabled={finishing}
          onClick={() => handleFinish('/news')}
        >
          Send welcome announcement
        </Button>
        <Button
          className="flex-1"
          disabled={finishing}
          onClick={() => handleFinish('/school-admin')}
        >
          Go to dashboard <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>
    </div>
  );
};
