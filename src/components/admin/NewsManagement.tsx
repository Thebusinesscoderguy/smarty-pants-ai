import { useSchoolNews } from '@/hooks/useSchoolNews';
import { NewsComposer } from '@/components/news/NewsComposer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Pin, Trash2, Newspaper } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useState, useEffect } from 'react';

export const NewsManagement = () => {
  const { user } = useAuth();
  const [schoolId, setSchoolId] = useState<string | null>(null);
  const [teacherId, setTeacherId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!user) return;
    const init = async () => {
      // Try as school admin first
      const { data: school } = await supabase
        .from('school_accounts')
        .select('id')
        .eq('admin_user_id', user.id)
        .maybeSingle();

      let sid = school?.id || null;

      // If not admin, try as teacher
      if (!sid) {
        const { data: teacher } = await supabase
          .from('school_teachers')
          .select('id, school_id')
          .ilike('email', user.email || '')
          .eq('is_active', true)
          .maybeSingle();
        if (teacher) {
          sid = teacher.school_id;
          setTeacherId(teacher.id);
        }
      }

      if (sid) {
        setSchoolId(sid);
        // If admin, get a teacher ID to post as
        if (!teacherId && school) {
          const { data: firstTeacher } = await supabase
            .from('school_teachers')
            .select('id')
            .eq('school_id', sid)
            .eq('is_active', true)
            .limit(1)
            .maybeSingle();
          if (firstTeacher) setTeacherId(firstTeacher.id);
        }
      }
      setReady(true);
    };
    init();
  }, [user]);

  if (!ready) return <div className="animate-pulse text-muted-foreground">Loading...</div>;
  if (!schoolId) return (
    <Card><CardContent className="p-8 text-center text-muted-foreground">No school found for your account.</CardContent></Card>
  );

  return <NewsManagementInner schoolId={schoolId} teacherId={teacherId} />;
};

const NewsManagementInner = ({ schoolId, teacherId }: { schoolId: string; teacherId: string | null }) => {
  const { posts, loading, createPost, deletePost, togglePin } = useSchoolNews(schoolId);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Newspaper className="h-6 w-6 text-primary" />
        <div>
          <h2 className="text-xl font-bold text-foreground">News & Announcements</h2>
          <p className="text-sm text-muted-foreground">Post updates that students and parents will see in their news feed</p>
        </div>
      </div>

      {teacherId && (
        <NewsComposer
          schoolId={schoolId}
          teacherId={teacherId}
          onPost={createPost}
        />
      )}

      {loading ? (
        <div className="animate-pulse text-muted-foreground">Loading posts...</div>
      ) : posts.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center text-muted-foreground">
            No announcements yet. Create your first post above!
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {posts.map(post => (
            <Card key={post.id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-foreground">{post.title}</h3>
                      {post.is_pinned && (
                        <Badge variant="secondary" className="text-[10px]">
                          <Pin className="h-3 w-3 mr-1 fill-current" /> Pinned
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground line-clamp-2">{post.content}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                      <span>
                        By {post.teacher ? `${post.teacher.first_name || ''} ${post.teacher.last_name || ''}`.trim() || post.teacher.email : 'Unknown'}
                      </span>
                      <span>·</span>
                      <span>{new Date(post.created_at).toLocaleDateString()}</span>
                      {post.image_url && <Badge variant="outline" className="text-[10px]">📷 Image</Badge>}
                      {post.link_url && <Badge variant="outline" className="text-[10px]">🔗 Link</Badge>}
                    </div>
                  </div>
                  <div className="flex gap-1 flex-shrink-0">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => togglePin(post.id, post.is_pinned)}
                      className="h-8 w-8"
                      title={post.is_pinned ? 'Unpin' : 'Pin'}
                    >
                      <Pin className={`h-4 w-4 ${post.is_pinned ? 'fill-primary text-primary' : 'text-muted-foreground'}`} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deletePost(post.id)}
                      className="h-8 w-8 text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
