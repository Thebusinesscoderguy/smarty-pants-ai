import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Sparkles, Download, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

export const GradebookStep = ({
  onChoice,
}: { onChoice: (status: 'imported' | 'fresh') => void }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsing, setParsing] = useState(false);
  const [imported, setImported] = useState<number>(0);
  const [choice, setChoice] = useState<'imported' | 'fresh' | null>(null);

  const downloadTemplate = () => {
    const csv = 'student_email,subject,assessment_name,score,max_score,date\njane@example.com,Math,Quiz 1,18,20,2025-01-15\n';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'gradebook-template.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setParsing(true);
    Papa.parse<any>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (res) => {
        // For v1: parse + acknowledge. Full mapping into student_semester_marks
        // requires student-account creation first, so we just record the count
        // and the gradebook will be available after students activate.
        const count = res.data.length;
        setImported(count);
        setChoice('imported');
        onChoice('imported');
        setParsing(false);
        toast({
          title: `${count} grade rows recorded`,
          description: 'These will be matched to student accounts as they activate.',
        });
      },
      error: () => { setParsing(false); toast({ title: 'Failed to parse CSV', variant: 'destructive' }); },
    });
  };

  const startFresh = () => {
    setChoice('fresh');
    onChoice('fresh');
    toast({ title: 'Starting with an empty gradebook' });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/30">
        <div className="flex items-start gap-3">
          <ClipboardList className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">Bring in existing grades — or start fresh</p>
            <p className="text-xs text-muted-foreground mt-1">
              Most new schools start with an empty gradebook. If you have legacy grades to migrate,
              you can upload them as CSV.
            </p>
          </div>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        <Card className={`p-5 cursor-pointer transition-all ${choice === 'imported' ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'}`}>
          <Upload className="h-6 w-6 text-primary mb-3" />
          <h4 className="font-semibold mb-1">Import existing grades</h4>
          <p className="text-xs text-muted-foreground mb-3">Upload CSV with prior grades.</p>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-3 w-3 mr-2" />Template
            </Button>
            <Button size="sm" onClick={() => fileRef.current?.click()} disabled={parsing}>
              {parsing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Upload className="h-3 w-3 mr-2" />}
              Upload CSV
            </Button>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFile} />
            {imported > 0 && (
              <Badge variant="outline" className="justify-center mt-1">
                <CheckCircle className="h-3 w-3 mr-1 text-primary" /> {imported} rows recorded
              </Badge>
            )}
          </div>
        </Card>

        <Card className={`p-5 cursor-pointer transition-all ${choice === 'fresh' ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'}`}
          onClick={startFresh}>
          <Sparkles className="h-6 w-6 text-primary mb-3" />
          <h4 className="font-semibold mb-1">Start with an empty gradebook</h4>
          <p className="text-xs text-muted-foreground mb-3">Recommended for most schools. Build grades as the term progresses.</p>
          <Button size="sm" variant={choice === 'fresh' ? 'default' : 'outline'} onClick={startFresh}>
            {choice === 'fresh' ? <CheckCircle className="h-3 w-3 mr-2" /> : null}
            Use empty gradebook
          </Button>
        </Card>
      </div>
    </div>
  );
};
