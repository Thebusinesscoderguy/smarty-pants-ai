import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { GraduationCap, Loader2, AlertCircle, ArrowRight, FileQuestion, Calendar, Presentation } from 'lucide-react';

type ArtifactType = 'quiz' | 'study_plan' | 'presentation';

interface SharedArtifactRow {
  share_token: string;
  artifact_type: ArtifactType;
  title: string;
  content: Record<string, unknown> & { items?: unknown[] };
  view_count: number;
  created_at: string;
}

const SharedArtifact = () => {
  const { token } = useParams<{ token: string }>();
  const [artifact, setArtifact] = useState<SharedArtifactRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    const load = async () => {
      try {
        const { data, error } = await supabase
          .from('shared_artifacts')
          .select('share_token, artifact_type, title, content, view_count, created_at')
          .eq('share_token', token)
          .eq('is_active', true)
          .maybeSingle();

        if (error) throw error;
        if (!data) {
          setError('This share link is no longer active or does not exist.');
        } else {
          setArtifact(data as unknown as SharedArtifactRow);
          // Fire-and-forget view counter
          supabase.rpc('increment_share_view', { _token: token }).then(() => {});
          // SEO: title
          document.title = `${(data as { title: string }).title} · Shared on Teachly`;
        }
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load shared content');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          Loading shared content…
        </div>
      </div>
    );
  }

  if (error || !artifact) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-background text-foreground p-6">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">Link unavailable</h1>
        <p className="text-muted-foreground mb-6 text-center max-w-md">
          {error ?? 'This shared content could not be found.'}
        </p>
        <Button asChild>
          <Link to="/">Go to Teachly</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Minimal public header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 md:px-6 py-3 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-lg font-semibold hover:text-foreground/80">
            <GraduationCap className="w-5 h-5" />
            Teachly
          </Link>
          <Button asChild size="sm" className="rounded-full">
            <Link to="/auth">
              Try Teachly free <ArrowRight className="ml-1.5 w-3.5 h-3.5" />
            </Link>
          </Button>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-4 md:px-6 py-8 max-w-4xl">
        <div className="mb-6 flex items-center gap-3 flex-wrap">
          <ArtifactBadge type={artifact.artifact_type} />
          <span className="text-xs text-muted-foreground">{artifact.view_count + 1} views</span>
        </div>

        <h1 className="text-3xl md:text-4xl font-bold mb-6">{artifact.title}</h1>

        {artifact.artifact_type === 'quiz' && <QuizView content={artifact.content} />}
        {artifact.artifact_type === 'study_plan' && <StudyPlanView content={artifact.content} />}
        {artifact.artifact_type === 'presentation' && <PresentationView content={artifact.content} />}

        {/* Footer CTA */}
        <Card className="mt-12 bg-gradient-to-br from-primary/10 via-background to-background border-primary/20">
          <CardContent className="py-8 text-center space-y-3">
            <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
              <GraduationCap className="w-4 h-4" />
              Made with Teachly
            </div>
            <h2 className="text-2xl font-bold">Create your own AI-powered {artifactLabel(artifact.artifact_type)}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Generate quizzes, study plans, and presentations aligned to your curriculum — in English or Arabic.
            </p>
            <Button asChild size="lg" className="rounded-full mt-2">
              <Link to="/quiz-generator">
                Try Teachly free <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>
      </main>

      <footer className="border-t border-border py-6 text-center text-sm text-muted-foreground">
        <Link to="/" className="hover:text-foreground">teachlyai.com</Link>
        <span className="mx-2">·</span>
        <Link to="/pricing" className="hover:text-foreground">Pricing</Link>
      </footer>
    </div>
  );
};

const artifactLabel = (t: ArtifactType) =>
  t === 'quiz' ? 'quizzes' : t === 'study_plan' ? 'study plans' : 'presentations';

const ArtifactBadge = ({ type }: { type: ArtifactType }) => {
  const config = {
    quiz: { icon: FileQuestion, label: 'Quiz' },
    study_plan: { icon: Calendar, label: 'Study Plan' },
    presentation: { icon: Presentation, label: 'Presentation' },
  }[type];
  const Icon = config.icon;
  return (
    <Badge variant="secondary" className="gap-1.5">
      <Icon className="w-3.5 h-3.5" />
      {config.label}
    </Badge>
  );
};

/* ---------- Quiz view ---------- */
interface QuizQuestion {
  question: string;
  type?: string;
  options?: string[];
  correct_answer?: string;
  explanation?: string;
}

const QuizView = ({ content }: { content: Record<string, unknown> & { items?: unknown[] } }) => {
  const questions = (content.items ?? content.questions ?? []) as QuizQuestion[];
  if (!questions.length) return <p className="text-muted-foreground">No questions in this quiz.</p>;

  return (
    <div className="space-y-4">
      {questions.map((q, i) => (
        <Card key={i}>
          <CardHeader>
            <CardTitle className="text-base flex items-start gap-2">
              <span className="text-muted-foreground font-normal">Q{i + 1}.</span>
              <span>{q.question}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {q.options && q.options.length > 0 && (
              <ul className="space-y-1.5">
                {q.options.map((opt, oi) => {
                  const isCorrect = opt === q.correct_answer;
                  return (
                    <li
                      key={oi}
                      className={`text-sm px-3 py-2 rounded border ${
                        isCorrect
                          ? 'border-primary/40 bg-primary/5 font-medium'
                          : 'border-border'
                      }`}
                    >
                      {String.fromCharCode(65 + oi)}. {opt}
                      {isCorrect && <span className="ml-2 text-xs text-primary">✓ Correct</span>}
                    </li>
                  );
                })}
              </ul>
            )}
            {!q.options && q.correct_answer && (
              <div className="text-sm">
                <span className="font-semibold">Answer:</span> {q.correct_answer}
              </div>
            )}
            {q.explanation && (
              <div className="text-sm text-muted-foreground border-t border-border pt-2">
                <span className="font-semibold text-foreground">Explanation:</span> {q.explanation}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/* ---------- Study Plan view ---------- */
interface DailyLesson {
  day: number;
  topic: string;
  description?: string;
  activities?: string[];
  estimatedTime?: number;
}

const StudyPlanView = ({ content }: { content: Record<string, unknown> }) => {
  const lessons = (content.daily_lessons ?? content.items ?? []) as DailyLesson[];
  const description = content.description as string | undefined;
  if (!lessons.length) return <p className="text-muted-foreground">This study plan has no daily lessons.</p>;

  return (
    <div className="space-y-4">
      {description && <p className="text-muted-foreground">{description}</p>}
      {lessons.map((lesson) => (
        <Card key={lesson.day} className="border-l-4 border-l-primary/60">
          <CardHeader>
            <div className="flex items-center gap-3 flex-wrap">
              <Badge variant="outline">Day {lesson.day}</Badge>
              {lesson.estimatedTime && (
                <span className="text-xs text-muted-foreground">{lesson.estimatedTime} min</span>
              )}
            </div>
            <CardTitle className="text-lg mt-2">{lesson.topic}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {lesson.description && <p className="text-sm text-muted-foreground">{lesson.description}</p>}
            {lesson.activities && lesson.activities.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {lesson.activities.map((a, ai) => (
                  <Badge key={ai} variant="secondary" className="text-xs font-normal">{a}</Badge>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

/* ---------- Presentation view ---------- */
interface Slide {
  title: string;
  bullets?: string[];
  type?: string;
}

const PresentationView = ({ content }: { content: Record<string, unknown> & { items?: unknown[] } }) => {
  const slides = (content.items ?? content.slides ?? []) as Slide[];
  if (!slides.length) return <p className="text-muted-foreground">This presentation has no slides.</p>;

  return (
    <div className="space-y-4">
      {slides.map((slide, i) => (
        <Card key={i}>
          <CardHeader>
            <div className="flex items-center justify-between gap-2">
              <CardTitle className="text-lg">{slide.title}</CardTitle>
              <Badge variant="outline" className="text-xs">Slide {i + 1}</Badge>
            </div>
          </CardHeader>
          {slide.bullets && slide.bullets.length > 0 && (
            <CardContent>
              <ul className="space-y-2 list-disc list-inside text-sm">
                {slide.bullets.map((b, bi) => (
                  <li key={bi}>{b}</li>
                ))}
              </ul>
            </CardContent>
          )}
        </Card>
      ))}
    </div>
  );
};

export default SharedArtifact;
