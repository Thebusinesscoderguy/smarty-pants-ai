import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Loader2, Presentation, Sparkles } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEducationalPresentationGenerator, PresentationSettings } from '@/hooks/useEducationalPresentationGenerator';
import { SlideViewer } from '@/components/study-plan/SlideViewer';

const GRADE_LEVELS = [
  'Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5', 'Grade 6',
  'Grade 7', 'Grade 8', 'Grade 9', 'Grade 10', 'Grade 11', 'Grade 12',
  'College', 'Professional'
];

const POPULAR_TOPICS = [
  { en: 'Photosynthesis', ar: 'التمثيل الضوئي' },
  { en: 'Solar System', ar: 'النظام الشمسي' },
  { en: 'Fractions', ar: 'الكسور' },
  { en: 'World War II', ar: 'الحرب العالمية الثانية' },
  { en: 'Human Body Systems', ar: 'أجهزة الجسم البشري' },
  { en: 'Climate Change', ar: 'تغير المناخ' },
];

const SLIDE_COUNTS = ['5', '8', '10', '12', '15', '20'];

const STYLES = [
  { value: 'educational', labelEn: 'Educational', labelAr: 'تعليمي' },
  { value: 'fun', labelEn: 'Fun & Engaging', labelAr: 'ممتع وتفاعلي' },
  { value: 'visual', labelEn: 'Visual Focus', labelAr: 'بصري' },
  { value: 'concise', labelEn: 'Concise', labelAr: 'موجز' },
];

export const EducationalPresentationGenerator = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  const { isGenerating, generatedPresentation, generatePresentation, setGeneratedPresentation } = useEducationalPresentationGenerator();

  const [settings, setSettings] = useState<PresentationSettings>({
    topic: '',
    gradeLevel: 'Grade 6',
    slideCount: 8,
    style: 'educational',
    includeQuiz: true,
    includeExamples: true,
  });

  const handleGenerate = async () => {
    if (!settings.topic.trim()) return;
    await generatePresentation(settings);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Presentation className="h-5 w-5" />
            {isArabic ? 'مولد العروض التقديمية' : 'Presentation Generator'}
          </CardTitle>
          <CardDescription>
            {isArabic 
              ? 'أنشئ عروض تقديمية تعليمية بالذكاء الاصطناعي'
              : 'Generate educational presentations with AI'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Topic */}
          <div className="space-y-2">
            <Label htmlFor="pres-topic">{isArabic ? 'الموضوع' : 'Topic'}</Label>
            <Input
              id="pres-topic"
              placeholder={isArabic ? 'أدخل موضوع العرض التقديمي...' : 'Enter presentation topic...'}
              value={settings.topic}
              onChange={(e) => setSettings({ ...settings, topic: e.target.value })}
              disabled={isGenerating}
            />
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_TOPICS.map((topic) => (
                <Badge
                  key={topic.en}
                  variant={settings.topic === (isArabic ? topic.ar : topic.en) ? 'default' : 'outline'}
                  className="cursor-pointer text-xs"
                  onClick={() => setSettings({ ...settings, topic: isArabic ? topic.ar : topic.en })}
                >
                  {isArabic ? topic.ar : topic.en}
                </Badge>
              ))}
            </div>
          </div>

          {/* Settings row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>{isArabic ? 'المستوى الدراسي' : 'Grade Level'}</Label>
              <Select
                value={settings.gradeLevel}
                onValueChange={(value) => setSettings({ ...settings, gradeLevel: value })}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {GRADE_LEVELS.map((grade) => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isArabic ? 'عدد الشرائح' : 'Slides'}</Label>
              <Select
                value={String(settings.slideCount)}
                onValueChange={(value) => setSettings({ ...settings, slideCount: Number(value) })}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {SLIDE_COUNTS.map((c) => (
                    <SelectItem key={c} value={c}>{c} {isArabic ? 'شريحة' : 'slides'}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isArabic ? 'النمط' : 'Style'}</Label>
              <Select
                value={settings.style}
                onValueChange={(value) => setSettings({ ...settings, style: value as any })}
                disabled={isGenerating}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-background z-50">
                  {STYLES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {isArabic ? s.labelAr : s.labelEn}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Generate */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !settings.topic.trim()}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isArabic ? 'جاري الإنشاء...' : 'Generating...'}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                {isArabic ? 'إنشاء العرض التقديمي' : 'Generate Presentation'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Slide Viewer */}
      {generatedPresentation && generatedPresentation.success && generatedPresentation.slides && (
        <SlideViewer
          slides={generatedPresentation.slides}
          title={generatedPresentation.title}
          onClose={() => setGeneratedPresentation(null)}
        />
      )}
    </div>
  );
};
