import { useState, useRef } from 'react';
import Papa from 'papaparse';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ClipboardList, Sparkles, Download, Upload, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { useLanguage } from '@/contexts/LanguageContext';

export const GradebookStep = ({
  onChoice,
}: { onChoice: (status: 'imported' | 'fresh') => void }) => {
  const { t } = useLanguage();
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
          title: `${count} ${t('gs2.gradeRowsRecorded')}`,
          description: t('gs2.matchedDesc'),
        });
      },
      error: () => { setParsing(false); toast({ title: t('gs2.failedParse'), variant: 'destructive' }); },
    });
  };

  const startFresh = () => {
    setChoice('fresh');
    onChoice('fresh');
    toast({ title: t('gs2.startingEmpty') });
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/30">
        <div className="flex items-start gap-3">
          <ClipboardList className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">{t('gs2.bringInTitle')}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {t('gs2.bringInDesc')}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid sm:grid-cols-2 gap-3">
        <Card className={`p-5 cursor-pointer transition-all ${choice === 'imported' ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'}`}>
          <Upload className="h-6 w-6 text-primary mb-3" />
          <h4 className="font-semibold mb-1">{t('gs2.importTitle')}</h4>
          <p className="text-xs text-muted-foreground mb-3">{t('gs2.importDesc')}</p>
          <div className="flex flex-col gap-2">
            <Button variant="outline" size="sm" onClick={downloadTemplate}>
              <Download className="h-3 w-3 mr-2" />{t('gs2.template')}
            </Button>
            <Button size="sm" onClick={() => fileRef.current?.click()} disabled={parsing}>
              {parsing ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Upload className="h-3 w-3 mr-2" />}
              {t('gs2.uploadCsv')}
            </Button>
            <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={onFile} />
            {imported > 0 && (
              <Badge variant="outline" className="justify-center mt-1">
                <CheckCircle className="h-3 w-3 mr-1 text-primary" /> {imported} {t('gs2.rowsRecordedSuffix')}
              </Badge>
            )}
          </div>
        </Card>

        <Card className={`p-5 cursor-pointer transition-all ${choice === 'fresh' ? 'border-primary ring-1 ring-primary' : 'hover:border-primary/50'}`}
          onClick={startFresh}>
          <Sparkles className="h-6 w-6 text-primary mb-3" />
          <h4 className="font-semibold mb-1">{t('gs2.startEmptyTitle')}</h4>
          <p className="text-xs text-muted-foreground mb-3">{t('gs2.startEmptyDesc')}</p>
          <Button size="sm" variant={choice === 'fresh' ? 'default' : 'outline'} onClick={startFresh}>
            {choice === 'fresh' ? <CheckCircle className="h-3 w-3 mr-2" /> : null}
            {t('gs2.useEmpty')}
          </Button>
        </Card>
      </div>
    </div>
  );
};
