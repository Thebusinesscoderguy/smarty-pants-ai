import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, ImagePlus, Link2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';

type Audience = 'all' | 'teachers' | 'parents' | 'students' | 'class';

interface NewsComposerProps {
  schoolId: string;
  teacherId: string;
  onPost: (post: {
    school_id: string;
    teacher_id: string;
    title: string;
    content: string;
    image_url?: string;
    link_url?: string;
    link_title?: string;
    audience?: Audience;
    section_id?: string | null;
    expires_at?: string | null;
  }) => Promise<boolean>;
}

interface SectionOption {
  id: string;
  grade_level: string;
  section_name: string;
}

export const NewsComposer = ({ schoolId, teacherId, onPost }: NewsComposerProps) => {
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [linkTitle, setLinkTitle] = useState('');
  const [audience, setAudience] = useState<Audience>('all');
  const [sectionId, setSectionId] = useState<string>('');
  const [sections, setSections] = useState<SectionOption[]>([]);
  const [showImage, setShowImage] = useState(false);
  const [showLink, setShowLink] = useState(false);
  const [posting, setPosting] = useState(false);

  useEffect(() => {
    if (audience !== 'class' || sections.length > 0) return;
    supabase
      .from('school_sections')
      .select('id, grade_level, section_name')
      .eq('school_id', schoolId)
      .order('grade_level')
      .then(({ data }) => setSections((data as SectionOption[]) || []));
  }, [audience, schoolId, sections.length]);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    if (audience === 'class' && !sectionId) return;
    setPosting(true);
    const success = await onPost({
      school_id: schoolId,
      teacher_id: teacherId,
      title: title.trim(),
      content: content.trim(),
      image_url: imageUrl.trim() || undefined,
      link_url: linkUrl.trim() || undefined,
      link_title: linkTitle.trim() || undefined,
      audience,
      section_id: audience === 'class' ? sectionId : null,
    });
    if (success) {
      setTitle('');
      setContent('');
      setImageUrl('');
      setLinkUrl('');
      setLinkTitle('');
      setAudience('all');
      setSectionId('');
      setShowImage(false);
      setShowLink(false);
    }
    setPosting(false);
  };

  return (
    <Card className="border-primary/20">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Send className="h-5 w-5 text-primary" />
          {t('nc2.postAnnouncement')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor="news-title" className="text-xs text-muted-foreground">{t('nc2.title')}</Label>
          <Input
            id="news-title"
            placeholder={t('nc2.titlePlaceholder')}
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={200}
          />
        </div>
        <div>
          <Label htmlFor="news-content" className="text-xs text-muted-foreground">{t('nc2.message')}</Label>
          <Textarea
            id="news-content"
            placeholder={t('nc2.messagePlaceholder')}
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            maxLength={2000}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">{t('nc2.audience')}</Label>
            <Select value={audience} onValueChange={(v) => setAudience(v as Audience)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('nc2.everyone')}</SelectItem>
                <SelectItem value="teachers">{t('nc2.teachers')}</SelectItem>
                <SelectItem value="parents">{t('nc2.parents')}</SelectItem>
                <SelectItem value="students">{t('nc2.students')}</SelectItem>
                <SelectItem value="class">{t('nc2.specificClass')}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {audience === 'class' && (
            <div>
              <Label className="text-xs text-muted-foreground">{t('nc2.classLabel')}</Label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger><SelectValue placeholder={t('nc2.selectClass')} /></SelectTrigger>
                <SelectContent>
                  {sections.map(s => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.grade_level} - {s.section_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>

        {showImage && (
          <div className="flex gap-2 items-end">
            <div className="flex-1">
              <Label className="text-xs text-muted-foreground">{t('nc2.imageUrl')}</Label>
              <Input
                placeholder={t('nc2.imageUrlPlaceholder')}
                value={imageUrl}
                onChange={e => setImageUrl(e.target.value)}
              />
            </div>
            <Button variant="ghost" size="icon" onClick={() => { setShowImage(false); setImageUrl(''); }}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        {showLink && (
          <div className="space-y-2">
            <div className="flex gap-2 items-end">
              <div className="flex-1">
                <Label className="text-xs text-muted-foreground">{t('nc2.linkUrl')}</Label>
                <Input
                  placeholder={t('nc2.linkUrlPlaceholder')}
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setShowLink(false); setLinkUrl(''); setLinkTitle(''); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">{t('nc2.linkLabel')}</Label>
              <Input
                placeholder={t('nc2.linkLabelPlaceholder')}
                value={linkTitle}
                onChange={e => setLinkTitle(e.target.value)}
              />
            </div>
          </div>
        )}

        <div className="flex items-center justify-between pt-1">
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowImage(!showImage)}
              className="text-muted-foreground hover:text-primary"
            >
              <ImagePlus className="h-4 w-4 mr-1" /> {t('nc2.image')}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLink(!showLink)}
              className="text-muted-foreground hover:text-primary"
            >
              <Link2 className="h-4 w-4 mr-1" /> {t('nc2.link')}
            </Button>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || posting || (audience === 'class' && !sectionId)}
            size="sm"
            className="rounded-full px-6"
          >
            {posting ? t('nc2.posting') : t('nc2.post')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
