import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileSpreadsheet, Download, Upload, Plus } from 'lucide-react';
import { ENTITIES } from '@/lib/dataPortability/registry';
import { DataPortabilityDialog } from './data-portability/DataPortabilityDialog';
import { useLanguage } from '@/contexts/LanguageContext';

export const ImportExportCenter = () => {
  const { t } = useLanguage();
  const [open, setOpen] = useState(false);
  const [entityKey, setEntityKey] = useState<string>(ENTITIES[0].key);

  const launch = (key: string) => { setEntityKey(key); setOpen(true); };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" /> {t('io.title')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            {t('io.desc')}
          </p>

          <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
            {ENTITIES.map(e => (
              <Card key={e.key} className="bg-card border-border hover:border-primary/40 transition cursor-pointer" onClick={() => launch(e.key)}>
                <CardContent className="p-4">
                  <div className="font-semibold text-foreground">{e.label}</div>
                  {e.description && <div className="text-xs text-muted-foreground mt-1">{e.description}</div>}
                  <div className="flex gap-2 mt-3">
                    <Button size="sm" variant="outline" className="h-7 text-xs"><Download className="h-3 w-3 mr-1" />{t('io.export')}</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs"><Upload className="h-3 w-3 mr-1" />{t('io.import')}</Button>
                    <Button size="sm" variant="outline" className="h-7 text-xs"><Plus className="h-3 w-3 mr-1" />{t('io.manual')}</Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      <DataPortabilityDialog open={open} onOpenChange={setOpen} defaultEntityKey={entityKey} />
    </div>
  );
};
