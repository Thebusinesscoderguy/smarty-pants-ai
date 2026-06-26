import { useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Upload, FileSpreadsheet, FileText, Plus, Trash2, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { ENTITIES, getEntity } from '@/lib/dataPortability/registry';
import {
  parseCSVFile, parseXLSX, parsePDF, toCSV, buildXLSX, buildPDF,
  downloadBlob, downloadText, autoMap, coerce,
} from '@/lib/dataPortability/format';
import type { EntityDescriptor, ColumnDef } from '@/lib/dataPortability/types';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  defaultEntityKey?: string;
  fixedEntityKey?: string;
}

export const DataPortabilityDialog = ({ open, onOpenChange, defaultEntityKey, fixedEntityKey }: Props) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [schoolId, setSchoolId] = useState<string>('');
  const [entityKey, setEntityKey] = useState<string>(fixedEntityKey || defaultEntityKey || ENTITIES[0].key);
  const entity = useMemo(() => getEntity(entityKey)!, [entityKey]);

  useEffect(() => {
    if (!user || !open) return;
    supabase.from('school_accounts').select('id').eq('admin_user_id', user.id).maybeSingle()
      .then(({ data }) => setSchoolId((data?.id as string) || ''));
  }, [user, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5" /> {t('dp.title')}
          </DialogTitle>
          <DialogDescription>
            {t('dp.desc')}
          </DialogDescription>
        </DialogHeader>

        {!fixedEntityKey && (
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium">{t('dp.entity')}</span>
            <Select value={entityKey} onValueChange={setEntityKey}>
              <SelectTrigger className="w-72"><SelectValue /></SelectTrigger>
              <SelectContent>
                {ENTITIES.map(e => <SelectItem key={e.key} value={e.key}>{e.label}</SelectItem>)}
              </SelectContent>
            </Select>
            {entity.description && <span className="text-xs text-muted-foreground">{entity.description}</span>}
          </div>
        )}

        <Tabs defaultValue="export" className="mt-2">
          <TabsList>
            <TabsTrigger value="export"><Download className="h-4 w-4 mr-1" />{t('dp.tabExport')}</TabsTrigger>
            <TabsTrigger value="import"><Upload className="h-4 w-4 mr-1" />{t('dp.tabImport')}</TabsTrigger>
            <TabsTrigger value="manual"><Plus className="h-4 w-4 mr-1" />{t('dp.tabManual')}</TabsTrigger>
          </TabsList>

          <TabsContent value="export">
            <ExportPanel entity={entity} schoolId={schoolId} userId={user?.id || ''} />
          </TabsContent>
          <TabsContent value="import">
            <ImportPanel entity={entity} schoolId={schoolId} userId={user?.id || ''} />
          </TabsContent>
          <TabsContent value="manual">
            <ManualPanel entity={entity} schoolId={schoolId} userId={user?.id || ''} />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
};

// ===== Export Panel =====
const ExportPanel = ({ entity, schoolId, userId }: { entity: EntityDescriptor; schoolId: string; userId: string }) => {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Record<string, any>[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!schoolId) { toast.error(t('dp.schoolNotLoaded')); return; }
    setLoading(true);
    try {
      const data = await entity.fetch({ schoolId, userId });
      setRows(data);
      toast.success(`${t('dp.loadedPre')} ${data.length} ${t('dp.rowsWord')}`);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  };

  const exportAs = (fmt: 'csv' | 'xlsx' | 'pdf') => {
    if (!rows.length) { toast.error(t('dp.clickLoadFirst')); return; }
    const name = `${entity.key}-${new Date().toISOString().split('T')[0]}`;
    if (fmt === 'csv') downloadText(`${name}.csv`, toCSV(entity.columns, rows));
    else if (fmt === 'xlsx') downloadBlob(`${name}.xlsx`, buildXLSX(entity.label, entity.columns, rows));
    else downloadBlob(`${name}.pdf`, buildPDF(entity.label, entity.columns, rows));
    toast.success(`${t('dp.downloadedPre')} ${fmt.toUpperCase()}`);
  };

  return (
    <div className="space-y-4 py-2">
      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={load} disabled={loading} variant="outline">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
          {t('dp.loadData')}
        </Button>
        <Badge variant="secondary">{rows.length} {t('dp.rowsWord')}</Badge>
        <div className="flex-1" />
        <Button onClick={() => exportAs('csv')} disabled={!rows.length}><FileText className="h-4 w-4 mr-1" />CSV</Button>
        <Button onClick={() => exportAs('xlsx')} disabled={!rows.length}><FileSpreadsheet className="h-4 w-4 mr-1" />{t('dp.excelXlsx')}</Button>
        <Button onClick={() => exportAs('pdf')} disabled={!rows.length}><FileText className="h-4 w-4 mr-1" />PDF</Button>
      </div>
      <PreviewTable cols={entity.columns} rows={rows.slice(0, 20)} />
      {rows.length > 20 && <div className="text-xs text-muted-foreground">{t('dp.showingFirst20Pre')} {rows.length} {t('dp.rowsWord')}</div>}
    </div>
  );
};

// ===== Import Panel =====
const ImportPanel = ({ entity, schoolId, userId }: { entity: EntityDescriptor; schoolId: string; userId: string }) => {
  const { t } = useLanguage();
  const [parsed, setParsed] = useState<{ headers: string[]; rows: Record<string, any>[] } | null>(null);
  const [mapping, setMapping] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ inserted: number; errors: string[] } | null>(null);

  const downloadTemplate = (fmt: 'csv' | 'xlsx') => {
    const example: Record<string, any> = {};
    entity.columns.forEach(c => { example[c.key] = c.example ?? ''; });
    const name = `${entity.key}-template`;
    if (fmt === 'csv') downloadText(`${name}.csv`, toCSV(entity.columns, [example]));
    else downloadBlob(`${name}.xlsx`, buildXLSX(entity.label, entity.columns, [example]));
  };

  const onFile = async (f: File) => {
    setBusy(true); setResult(null);
    try {
      const ext = f.name.split('.').pop()?.toLowerCase();
      let p;
      if (ext === 'csv') p = await parseCSVFile(f);
      else if (ext === 'xlsx' || ext === 'xls') p = await parseXLSX(f);
      else if (ext === 'pdf') p = await parsePDF(f);
      else { toast.error(t('dp.unsupportedFile')); return; }
      if (!p.headers.length) { toast.error(t('dp.noDataInFile')); return; }
      setParsed(p);
      setMapping(autoMap(p.headers, entity.columns));
      toast.success(`${t('dp.parsedPre')} ${p.rows.length} ${t('dp.rowsWord')}`);
    } catch (e: any) { toast.error(e.message); }
    finally { setBusy(false); }
  };

  const commit = async () => {
    if (!parsed) return;
    if (!schoolId) { toast.error(t('dp.schoolNotLoaded')); return; }
    setBusy(true);
    try {
      const transformed = parsed.rows.map(r => {
        const out: Record<string, any> = {};
        for (const col of entity.columns) {
          const src = mapping[col.key];
          out[col.key] = coerce(src ? r[src] : null, col);
        }
        return out;
      }).filter(r => entity.columns.some(c => c.required ? !!r[c.key] : true));
      const res = await entity.upsert(transformed, { schoolId, userId });
      setResult(res);
      if (res.errors.length) toast.error(res.errors[0]);
      else toast.success(`${t('dp.importedPre')} ${res.inserted} ${t('dp.rowsWord')}`);
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-4 py-2">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-sm font-medium">{t('dp.templates')}</span>
        <Button size="sm" variant="outline" onClick={() => downloadTemplate('csv')}><Download className="h-4 w-4 mr-1" />CSV</Button>
        <Button size="sm" variant="outline" onClick={() => downloadTemplate('xlsx')}><Download className="h-4 w-4 mr-1" />{t('dp.excel')}</Button>
      </div>

      <label className="border border-dashed border-border rounded-lg p-6 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-muted">
        <Upload className="h-6 w-6" />
        <span className="font-medium">{t('dp.uploadLabel')}</span>
        <span className="text-xs text-muted-foreground">{t('dp.uploadHint')}</span>
        <input type="file" accept=".csv,.xlsx,.xls,.pdf" className="hidden"
          onChange={e => e.target.files?.[0] && onFile(e.target.files[0])} disabled={busy} />
      </label>

      {parsed && (
        <>
          <div>
            <h4 className="font-semibold mb-2 text-sm">{t('dp.columnMapping')}</h4>
            <div className="grid md:grid-cols-2 gap-2">
              {entity.columns.map(col => (
                <div key={col.key} className="flex items-center gap-2">
                  <span className="text-sm min-w-[140px]">
                    {col.label}{col.required && <span className="text-destructive">*</span>}
                  </span>
                  <Select value={mapping[col.key] || '__none__'} onValueChange={v => setMapping(m => ({ ...m, [col.key]: v === '__none__' ? '' : v }))}>
                    <SelectTrigger className="h-8"><SelectValue placeholder={t('dp.skip')} /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">{t('dp.skip')}</SelectItem>
                      {parsed.headers.map(h => <SelectItem key={h} value={h}>{h}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-2 text-sm">{t('dp.previewFirst10')}</h4>
            <PreviewTable cols={entity.columns} rows={parsed.rows.slice(0, 10).map(r => {
              const out: Record<string, any> = {};
              entity.columns.forEach(c => { out[c.key] = mapping[c.key] ? r[mapping[c.key]] : ''; });
              return out;
            })} />
          </div>

          <div className="flex items-center gap-2">
            <Button onClick={commit} disabled={busy}>
              {busy && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
              {t('dp.importNPre')} {parsed.rows.length} {t('dp.rowsCap')}
            </Button>
            <Button variant="outline" onClick={() => { setParsed(null); setResult(null); }}>{t('dp.cancel')}</Button>
          </div>

          {result && (
            <div className={`flex items-start gap-2 p-3 rounded border ${result.errors.length ? 'border-destructive/50 bg-destructive/10' : 'border-green-500/50 bg-green-500/10'}`}>
              {result.errors.length ? <AlertCircle className="h-4 w-4 mt-0.5 text-destructive" /> : <CheckCircle2 className="h-4 w-4 mt-0.5 text-green-600" />}
              <div className="text-sm">
                <div className="font-medium">{result.inserted} {t('dp.rowsImported')}</div>
                {result.errors.map((e, i) => <div key={i} className="text-destructive">{e}</div>)}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

// ===== Manual Entry Panel =====
const ManualPanel = ({ entity, schoolId, userId }: { entity: EntityDescriptor; schoolId: string; userId: string }) => {
  const { t } = useLanguage();
  const [rows, setRows] = useState<Record<string, any>[]>([{}]);
  const [busy, setBusy] = useState(false);

  const update = (i: number, k: string, v: any) =>
    setRows(rs => rs.map((r, idx) => idx === i ? { ...r, [k]: v } : r));

  const submit = async () => {
    if (!schoolId) { toast.error(t('dp.schoolNotLoaded')); return; }
    setBusy(true);
    try {
      const cleaned = rows.map(r => {
        const out: Record<string, any> = {};
        entity.columns.forEach(c => { out[c.key] = coerce(r[c.key], c); });
        return out;
      }).filter(r => entity.columns.some(c => c.required && r[c.key]));
      if (!cleaned.length) { toast.error(t('dp.fillRequired')); return; }
      const res = await entity.upsert(cleaned, { schoolId, userId });
      if (res.errors.length) toast.error(res.errors[0]);
      else { toast.success(`${t('dp.savedPre')} ${res.inserted} ${t('dp.rowsWord')}`); setRows([{}]); }
    } finally { setBusy(false); }
  };

  return (
    <div className="space-y-3 py-2">
      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              {entity.columns.map(c => (
                <TableHead key={c.key} className="text-xs">
                  {c.label}{c.required && <span className="text-destructive">*</span>}
                </TableHead>
              ))}
              <TableHead className="w-10" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                {entity.columns.map(c => (
                  <TableCell key={c.key} className="p-1">
                    {c.type === 'enum' ? (
                      <Select value={r[c.key] || ''} onValueChange={v => update(i, c.key, v)}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          {(c.enumValues || []).map(v => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    ) : c.type === 'boolean' ? (
                      <Select value={String(r[c.key] ?? '')} onValueChange={v => update(i, c.key, v === 'true')}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="—" /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="true">{t('dp.yes')}</SelectItem>
                          <SelectItem value="false">{t('dp.no')}</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Input
                        type={c.type === 'number' ? 'number' : c.type === 'date' ? 'date' : 'text'}
                        value={r[c.key] ?? ''}
                        onChange={e => update(i, c.key, e.target.value)}
                        className="h-8 text-xs" placeholder={c.example?.toString() || ''}
                      />
                    )}
                  </TableCell>
                ))}
                <TableCell className="p-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7"
                    onClick={() => setRows(rs => rs.length > 1 ? rs.filter((_, idx) => idx !== i) : rs)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setRows(rs => [...rs, {}])}>
          <Plus className="h-4 w-4 mr-1" />{t('dp.addRow')}
        </Button>
        <div className="flex-1" />
        <Button onClick={submit} disabled={busy}>
          {busy && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
          {t('dp.savePre')} {rows.length} {t('dp.rowsCap')}
        </Button>
      </div>
    </div>
  );
};

// ===== Shared preview table =====
const PreviewTable = ({ cols, rows }: { cols: ColumnDef[]; rows: Record<string, any>[] }) => {
  const { t } = useLanguage();
  return (
  <div className="border rounded overflow-x-auto max-h-80">
    <Table>
      <TableHeader>
        <TableRow>{cols.map(c => <TableHead key={c.key} className="text-xs">{c.label}</TableHead>)}</TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow><TableCell colSpan={cols.length} className="text-center text-xs text-muted-foreground py-4">{t('dp.noData')}</TableCell></TableRow>
        ) : rows.map((r, i) => (
          <TableRow key={i}>
            {cols.map(c => <TableCell key={c.key} className="text-xs">{String(r[c.key] ?? '')}</TableCell>)}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </div>
  );
};
