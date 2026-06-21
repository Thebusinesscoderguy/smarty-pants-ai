import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  ChevronUp, ChevronDown, Trash2, Scissors, ArrowUpToLine, Plus, FileText, X,
} from 'lucide-react';
import type { CurriculumTree, ImageMeta } from '@/hooks/useCurriculumImport';

const CONF_COLOR: Record<string, string> = {
  high: 'text-green-700 bg-green-50 border-green-200',
  medium: 'text-amber-700 bg-amber-50 border-amber-200',
  low: 'text-orange-700 bg-orange-50 border-orange-200',
  unresolved: 'text-red-700 bg-red-50 border-red-200',
};

interface Props {
  tree: CurriculumTree;
  setTree: React.Dispatch<React.SetStateAction<CurriculumTree | null>>;
  images: ImageMeta[];
  getContent: (start: number, end: number) => string;
}

const clone = (t: CurriculumTree): CurriculumTree => ({
  units: t.units.map((u) => ({ ...u, lessons: u.lessons.map((l) => ({ ...l })) })),
});

export function CurriculumReviewTree({ tree, setTree, images, getContent }: Props) {
  const [editingContent, setEditingContent] = useState<string | null>(null); // lesson id

  const apply = (fn: (t: CurriculumTree) => void) =>
    setTree((prev) => {
      const next = clone(prev ?? tree);
      fn(next);
      return next;
    });

  const move = <T,>(arr: T[], i: number, dir: -1 | 1) => {
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
  };

  // ---- unit ops ----
  const setUnit = (ui: number, patch: Partial<CurriculumTree['units'][number]>) =>
    apply((t) => { t.units[ui] = { ...t.units[ui], ...patch }; });
  const moveUnit = (ui: number, dir: -1 | 1) => apply((t) => move(t.units, ui, dir));
  const deleteUnit = (ui: number) => apply((t) => { t.units.splice(ui, 1); });
  const mergeUnitUp = (ui: number) => apply((t) => {
    if (ui === 0) return;
    const prev = t.units[ui - 1], cur = t.units[ui];
    prev.lessons = [...prev.lessons, ...cur.lessons];
    prev.start_page = Math.min(prev.start_page, cur.start_page);
    prev.end_page = Math.max(prev.end_page, cur.end_page);
    t.units.splice(ui, 1);
  });
  const addLesson = (ui: number) => apply((t) => {
    const u = t.units[ui];
    u.lessons.push({ id: `l-new-${Date.now()}`, title: 'New lesson', start_page: u.start_page, end_page: u.end_page, confidence: null });
  });

  // ---- lesson ops ----
  const setLesson = (ui: number, li: number, patch: Partial<CurriculumTree['units'][number]['lessons'][number]>) =>
    apply((t) => { t.units[ui].lessons[li] = { ...t.units[ui].lessons[li], ...patch }; });
  const moveLesson = (ui: number, li: number, dir: -1 | 1) => apply((t) => move(t.units[ui].lessons, li, dir));
  const deleteLesson = (ui: number, li: number) => apply((t) => { t.units[ui].lessons.splice(li, 1); });
  const mergeLessonUp = (ui: number, li: number) => apply((t) => {
    if (li === 0) return;
    const ls = t.units[ui].lessons;
    const prev = ls[li - 1], cur = ls[li];
    prev.end_page = Math.max(prev.end_page, cur.end_page);
    prev.start_page = Math.min(prev.start_page, cur.start_page);
    if (cur.content || prev.content) prev.content = `${prev.content ?? getContent(prev.start_page, prev.end_page)}`;
    ls.splice(li, 1);
  });
  const splitLesson = (ui: number, li: number, at: number) => apply((t) => {
    const ls = t.units[ui].lessons;
    const cur = ls[li];
    if (at <= cur.start_page || at > cur.end_page) return;
    const second = { ...cur, id: `l-split-${Date.now()}`, title: `${cur.title} (cont.)`, start_page: at, content: undefined };
    cur.end_page = at - 1; cur.content = undefined;
    ls.splice(li + 1, 0, second);
  });

  return (
    <div className="space-y-4">
      {tree.units.map((u, ui) => (
        <div key={u.id} className="rounded-2xl border border-violet-100 bg-white p-3 shadow-sm">
          {/* unit header */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-violet-500">Unit {ui + 1}</span>
            <Input
              value={u.title}
              onChange={(e) => setUnit(ui, { title: e.target.value })}
              className="h-8 flex-1 min-w-[12rem] text-sm font-semibold"
            />
            <PageRange
              start={u.start_page} end={u.end_page}
              onStart={(v) => setUnit(ui, { start_page: v })}
              onEnd={(v) => setUnit(ui, { end_page: v })}
            />
            <IconBtn title="Move up" onClick={() => moveUnit(ui, -1)} disabled={ui === 0}><ChevronUp className="h-4 w-4" /></IconBtn>
            <IconBtn title="Move down" onClick={() => moveUnit(ui, 1)} disabled={ui === tree.units.length - 1}><ChevronDown className="h-4 w-4" /></IconBtn>
            <IconBtn title="Merge into previous unit" onClick={() => mergeUnitUp(ui)} disabled={ui === 0}><ArrowUpToLine className="h-4 w-4" /></IconBtn>
            <IconBtn title="Delete unit" onClick={() => deleteUnit(ui)}><Trash2 className="h-4 w-4 text-red-500" /></IconBtn>
          </div>

          {/* lessons */}
          <div className="mt-2 space-y-2 pl-2">
            {u.lessons.map((l, li) => {
              const startImages = images.filter((img) => img.page === l.start_page).slice(0, 4);
              const conf = l.confidence ? CONF_COLOR[l.confidence] ?? 'text-gray-600 bg-gray-50 border-gray-200' : '';
              const isEditing = editingContent === l.id;
              return (
                <div key={l.id} className="rounded-xl border border-gray-100 bg-gray-50/60 p-2.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <Input
                      value={l.title}
                      onChange={(e) => setLesson(ui, li, { title: e.target.value })}
                      className="h-7 flex-1 min-w-[10rem] text-sm"
                    />
                    {l.confidence && (
                      <span className={`rounded-md border px-1.5 py-0.5 text-[10px] font-semibold ${conf}`}>{l.confidence}</span>
                    )}
                    <PageRange
                      start={l.start_page} end={l.end_page}
                      onStart={(v) => setLesson(ui, li, { start_page: v })}
                      onEnd={(v) => setLesson(ui, li, { end_page: v })}
                    />
                    <IconBtn title="Move up" onClick={() => moveLesson(ui, li, -1)} disabled={li === 0}><ChevronUp className="h-4 w-4" /></IconBtn>
                    <IconBtn title="Move down" onClick={() => moveLesson(ui, li, 1)} disabled={li === u.lessons.length - 1}><ChevronDown className="h-4 w-4" /></IconBtn>
                    <IconBtn title="Merge into previous lesson" onClick={() => mergeLessonUp(ui, li)} disabled={li === 0}><ArrowUpToLine className="h-4 w-4" /></IconBtn>
                    <IconBtn title="Split at mid-page" onClick={() => splitLesson(ui, li, Math.ceil((l.start_page + l.end_page) / 2))} disabled={l.end_page <= l.start_page}><Scissors className="h-4 w-4" /></IconBtn>
                    <IconBtn title="Edit content" onClick={() => setEditingContent(isEditing ? null : l.id)}><FileText className={`h-4 w-4 ${l.content ? 'text-violet-600' : ''}`} /></IconBtn>
                    <IconBtn title="Delete lesson" onClick={() => deleteLesson(ui, li)}><Trash2 className="h-4 w-4 text-red-500" /></IconBtn>
                  </div>

                  {l.first_line && (
                    <p className="mt-1 truncate pl-1 text-[11px] italic text-gray-500">“{l.first_line}”</p>
                  )}

                  {startImages.length > 0 && (
                    <div className="mt-1.5 flex flex-wrap gap-1.5 pl-1">
                      {startImages.map((img) => (
                        <img
                          key={img.storage_path}
                          src={img.previewUrl}
                          alt={`figure on page ${img.page}`}
                          className="h-12 w-12 rounded-md border border-violet-100 object-cover"
                        />
                      ))}
                    </div>
                  )}

                  {isEditing && (
                    <div className="mt-2">
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                          Lesson content (pages {l.start_page}–{l.end_page})
                        </span>
                        <button onClick={() => setEditingContent(null)} className="text-gray-400 hover:text-gray-600"><X className="h-3.5 w-3.5" /></button>
                      </div>
                      <Textarea
                        value={l.content ?? getContent(l.start_page, l.end_page)}
                        onChange={(e) => setLesson(ui, li, { content: e.target.value })}
                        className="min-h-[8rem] text-xs"
                        placeholder="Lesson text used to ground quizzes…"
                      />
                      {l.content !== undefined && (
                        <button
                          onClick={() => setLesson(ui, li, { content: undefined })}
                          className="mt-1 text-[10px] text-violet-600 hover:underline"
                        >
                          Reset to page-range text
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <Button variant="ghost" size="sm" onClick={() => addLesson(ui)} className="h-7 text-xs text-violet-600">
              <Plus className="mr-1 h-3.5 w-3.5" /> Add lesson
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}

function IconBtn({ children, title, onClick, disabled }: { children: React.ReactNode; title: string; onClick: () => void; disabled?: boolean }) {
  return (
    <button
      type="button"
      title={title}
      onClick={onClick}
      disabled={disabled}
      className="flex h-7 w-7 items-center justify-center rounded-md text-gray-500 transition-colors hover:bg-violet-50 hover:text-violet-700 disabled:opacity-30 disabled:hover:bg-transparent"
    >
      {children}
    </button>
  );
}

function PageRange({ start, end, onStart, onEnd }: { start: number; end: number; onStart: (v: number) => void; onEnd: (v: number) => void }) {
  return (
    <span className="flex items-center gap-1 text-xs text-gray-500">
      <span className="hidden sm:inline">p.</span>
      <Input type="number" value={start} onChange={(e) => onStart(Math.max(1, Number(e.target.value) || 1))} className="h-7 w-14 px-1.5 text-center text-xs" />
      <span>–</span>
      <Input type="number" value={end} onChange={(e) => onEnd(Math.max(1, Number(e.target.value) || 1))} className="h-7 w-14 px-1.5 text-center text-xs" />
    </span>
  );
}
