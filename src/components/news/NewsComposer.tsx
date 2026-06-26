import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Send, ImagePlus, Link2, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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
          Post an Announcement
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div>
          <Label htmlFor="news-title" className="text-xs text-muted-foreground">Title</Label>
          <Input
            id="news-title"
            placeholder="e.g. Math test next Monday!"
            value={title}
            onChange={e => setTitle(e.target.value)}
            maxLength={200}
          />
        </div>
        <div>
          <Label htmlFor="news-content" className="text-xs text-muted-foreground">Message</Label>
          <Textarea
            id="news-content"
            placeholder="Write your announcement here..."
            value={content}
            onChange={e => setContent(e.target.value)}
            rows={3}
            maxLength={2000}
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Label className="text-xs text-muted-foreground">Audience</Label>
            <Select value={audience} onValueChange={(v) => setAudience(v as Audience)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Everyone</SelectItem>
                <SelectItem value="teachers">Teachers</SelectItem>
                <SelectItem value="parents">Parents</SelectItem>
                <SelectItem value="students">Students</SelectItem>
                <SelectItem value="class">A specific class</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {audience === 'class' && (
            <div>
              <Label className="text-xs text-muted-foreground">Class</Label>
              <Select value={sectionId} onValueChange={setSectionId}>
                <SelectTrigger><SelectValue placeholder="Select a class" /></SelectTrigger>
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
              <Label className="text-xs text-muted-foreground">Image URL</Label>
              <Input
                placeholder="https://example.com/image.jpg"
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
                <Label className="text-xs text-muted-foreground">Link URL</Label>
                <Input
                  placeholder="https://example.com"
                  value={linkUrl}
                  onChange={e => setLinkUrl(e.target.value)}
                />
              </div>
              <Button variant="ghost" size="icon" onClick={() => { setShowLink(false); setLinkUrl(''); setLinkTitle(''); }}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Link Label (optional)</Label>
              <Input
                placeholder="Click here to view"
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
              <ImagePlus className="h-4 w-4 mr-1" /> Image
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowLink(!showLink)}
              className="text-muted-foreground hover:text-primary"
            >
              <Link2 className="h-4 w-4 mr-1" /> Link
            </Button>
          </div>
          <Button
            onClick={handleSubmit}
            disabled={!title.trim() || !content.trim() || posting || (audience === 'class' && !sectionId)}
            size="sm"
            className="rounded-full px-6"
          >
            {posting ? 'Posting...' : 'Post'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
