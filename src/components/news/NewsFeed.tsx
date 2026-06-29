import { useState, useEffect } from 'react';
import { useSchoolNews, NewsPost } from '@/hooks/useSchoolNews';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Pin, ExternalLink, Image as ImageIcon, Clock, Newspaper, Languages } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { translationService } from '@/services/translationService';
import { supabase } from '@/integrations/supabase/client';

const formatDate = (dateStr: string) => {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

const NewsCard = ({ post, language, label }: { post: NewsPost; language: string; label?: string }) => {
  // Prefer the canonical "[Title] [Last] — [Subjects]" label (resolved via the
  // get_teacher_labels RPC, which parents/students can read); fall back to the
  // embedded name (admin/teacher view) and finally a generic 'Teacher'.
  const teacherName = label
    || (post.teacher
      ? `${post.teacher.first_name || ''} ${post.teacher.last_name || ''}`.trim() || post.teacher.email
      : 'Teacher');
  const initials = teacherName.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();

  // Render the announcement in the viewer's language (cached server-side by post id).
  const [translated, setTranslated] = useState<{ title: string; content: string } | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    let active = true;
    if (language === 'en') { setTranslated(null); return; }
    Promise.all([
      translationService.translateMessage(`${post.id}:title`, post.title, language),
      translationService.translateMessage(`${post.id}:content`, post.content, language),
    ]).then(([title, content]) => {
      if (!active) return;
      if (title !== post.title || content !== post.content) setTranslated({ title, content });
    });
    return () => { active = false; };
  }, [post.id, post.title, post.content, language]);

  const showTranslated = translated && !showOriginal;
  const displayTitle = showTranslated ? translated.title : post.title;
  const displayContent = showTranslated ? translated.content : post.content;

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow border-border">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar className="h-10 w-10 border-2 border-primary/20">
            <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="font-semibold text-foreground text-sm">{teacherName}</span>
              {post.school && (
                <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                  {post.school.school_name}
                </Badge>
              )}
              {post.is_pinned && (
                <Pin className="h-3.5 w-3.5 text-primary fill-primary" />
              )}
            </div>
            <div className="flex items-center gap-1 text-muted-foreground text-xs mt-0.5">
              <Clock className="h-3 w-3" />
              {formatDate(post.created_at)}
            </div>
          </div>
        </div>

        {/* Title */}
        <h3 className="font-bold text-foreground text-lg mb-2">{displayTitle}</h3>

        {/* Content */}
        <p className="text-foreground/80 text-sm whitespace-pre-wrap leading-relaxed mb-2">{displayContent}</p>

        {/* Translation toggle */}
        {translated && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowOriginal(v => !v)}
            className="h-6 px-2 mb-2 text-xs text-muted-foreground hover:text-primary"
          >
            <Languages className="h-3 w-3 mr-1" />
            {showOriginal ? 'Show translation' : 'Show original'}
          </Button>
        )}

        {/* Image */}
        {post.image_url && (
          <div className="rounded-xl overflow-hidden border border-border mb-3">
            <img
              src={post.image_url}
              alt={post.title}
              className="w-full max-h-80 object-cover"
              loading="lazy"
            />
          </div>
        )}

        {/* Link */}
        {post.link_url && (
          <a
            href={post.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-border hover:bg-muted transition-colors group"
          >
            <ExternalLink className="h-4 w-4 text-primary flex-shrink-0" />
            <span className="text-sm text-primary group-hover:underline truncate">
              {post.link_title || post.link_url}
            </span>
          </a>
        )}
      </CardContent>
    </Card>
  );
};

interface NewsFeedProps {
  schoolId?: string;
}

export const NewsFeed = ({ schoolId }: NewsFeedProps) => {
  const { posts, loading } = useSchoolNews(schoolId);
  const { language } = useLanguage();
  const isRTL = language === 'ar';

  // Resolve each author's canonical "[Title] [Last] — [Subjects]" label. Uses the
  // SECURITY DEFINER RPC so it works for parents/students who cannot read
  // school_teachers directly; the connector follows the viewer's language.
  const [teacherLabels, setTeacherLabels] = useState<Record<string, string>>({});
  useEffect(() => {
    const ids = [...new Set(posts.map(p => p.teacher_id).filter(Boolean))];
    if (ids.length === 0) { setTeacherLabels({}); return; }
    let active = true;
    supabase
      .rpc('get_teacher_labels', { p_ids: ids, p_and: language === 'ar' ? 'و' : 'and' })
      .then(({ data }) => {
        if (!active || !data) return;
        const map: Record<string, string> = {};
        for (const row of data as { teacher_id: string; label: string }[]) {
          if (row.label) map[row.teacher_id] = row.label;
        }
        setTeacherLabels(map);
      });
    return () => { active = false; };
  }, [posts, language]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-5">
              <div className="flex gap-3 mb-3">
                <div className="h-10 w-10 rounded-full bg-muted" />
                <div className="space-y-2 flex-1">
                  <div className="h-4 w-32 bg-muted rounded" />
                  <div className="h-3 w-20 bg-muted rounded" />
                </div>
              </div>
              <div className="h-5 w-3/4 bg-muted rounded mb-2" />
              <div className="h-4 w-full bg-muted rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <Newspaper className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {isRTL ? 'لا توجد أخبار بعد' : 'No News Yet'}
          </h3>
          <p className="text-muted-foreground text-sm">
            {isRTL ? 'ستظهر الأخبار والإعلانات من المعلمين هنا' : "News and announcements from your teachers will appear here."}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {posts.map(post => (
        <NewsCard key={post.id} post={post} language={language} label={teacherLabels[post.teacher_id]} />
      ))}
    </div>
  );
};
