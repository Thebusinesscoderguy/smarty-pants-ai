import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Share2, Copy, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

export type SharableArtifactType = 'quiz' | 'study_plan' | 'presentation';

interface ShareArtifactButtonProps {
  artifactType: SharableArtifactType;
  title: string;
  /** Snapshot of the artifact content (questions array, study plan json, slides array, etc.) */
  content: Record<string, unknown> | unknown[];
  /** Optional source row id (e.g. quizzes.id) for traceability */
  sourceId?: string;
  size?: 'sm' | 'default' | 'lg' | 'icon';
  variant?: 'default' | 'outline' | 'ghost' | 'secondary';
  className?: string;
  label?: string;
}

export const ShareArtifactButton = ({
  artifactType,
  title,
  content,
  sourceId,
  size = 'sm',
  variant = 'outline',
  className,
  label,
}: ShareArtifactButtonProps) => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleClick = async () => {
    if (!user) {
      toast({ title: t('sab.signInShare'), description: t('sab.signInShareDesc') });
      navigate('/auth');
      return;
    }

    setOpen(true);
    if (shareUrl) return;

    setLoading(true);
    try {
      const payload = Array.isArray(content) ? { items: content } : content;
      const { data, error } = await supabase
        .from('shared_artifacts')
        .insert({
          artifact_type: artifactType,
          title,
          content: payload as never,
          owner_id: user.id,
          source_id: sourceId ?? null,
        })
        .select('share_token')
        .single();

      if (error) throw error;
      const url = `${window.location.origin}/s/${data.share_token}`;
      setShareUrl(url);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : t('sab.couldNotCreate');
      toast({ title: t('sab.shareFailed'), description: message, variant: 'destructive' });
      setOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!shareUrl) return;
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    toast({ title: t('sab.linkCopied'), description: t('sab.linkCopiedDesc') });
    setTimeout(() => setCopied(false), 2000);
  };

  const labelMap: Record<SharableArtifactType, string> = {
    quiz: t('sab.typeQuiz'),
    study_plan: t('sab.typeStudyPlan'),
    presentation: t('sab.typePresentation'),
  };

  return (
    <>
      <Button onClick={handleClick} size={size} variant={variant} className={className}>
        <Share2 className="h-4 w-4 mr-2" />
        {label ?? t('sab.share')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('sab.shareThis')} {labelMap[artifactType]}</DialogTitle>
            <DialogDescription>
              {t('sab.shareDesc')}
            </DialogDescription>
          </DialogHeader>

          {loading || !shareUrl ? (
            <div className="flex items-center justify-center py-8 text-muted-foreground gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              {t('sab.creatingLink')}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Input readOnly value={shareUrl} className="flex-1" onFocus={(e) => e.currentTarget.select()} />
              <Button onClick={handleCopy} size="sm" className="shrink-0">
                {copied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                {copied ? t('sab.copied') : t('sab.copy')}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ShareArtifactButton;
