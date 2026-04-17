import { Card } from '@/components/ui/card';
import { BookOpen, Users, GraduationCap, ClipboardList, CheckCircle2, Clock } from 'lucide-react';

export const WelcomeStep = ({ schoolName }: { schoolName: string }) => {
  const items = [
    { icon: BookOpen, label: 'Pick your curriculum framework', time: '1 min' },
    { icon: Users, label: 'Import your student roster (CSV)', time: '5 min' },
    { icon: GraduationCap, label: 'Invite teachers and assign subjects', time: '4 min' },
    { icon: ClipboardList, label: 'Optional: Import existing grades', time: '3 min' },
    { icon: CheckCircle2, label: 'Share invite links and go live', time: '2 min' },
  ];

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/20">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-lg">Welcome, {schoolName || 'there'} 👋</h3>
            <p className="text-sm text-muted-foreground mt-1">
              In about 15 minutes, you'll have your school set up: students enrolled, teachers invited,
              and your curriculum mapped. You can pause anytime — we'll save your progress.
            </p>
          </div>
        </div>
      </Card>

      <div>
        <h4 className="font-semibold mb-3">What you'll do</h4>
        <div className="space-y-2">
          {items.map((it, i) => (
            <div key={i} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-muted text-sm font-mono">
                {i + 1}
              </div>
              <it.icon className="h-4 w-4 text-muted-foreground" />
              <span className="flex-1 text-sm">{it.label}</span>
              <span className="text-xs text-muted-foreground">{it.time}</span>
            </div>
          ))}
        </div>
      </div>

      <Card className="p-4 bg-muted/30 border-dashed">
        <p className="text-sm text-muted-foreground">
          <strong className="text-foreground">Before you start:</strong> Have a CSV file with your student roster ready
          (or use our template), and a list of teacher emails handy.
        </p>
      </Card>
    </div>
  );
};
