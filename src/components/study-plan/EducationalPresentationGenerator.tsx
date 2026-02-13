import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Loader2, Presentation, Download, Sparkles, BookOpen, Palette, Zap, Eye, ExternalLink, FileText } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEducationalPresentationGenerator, PresentationSettings } from '@/hooks/useEducationalPresentationGenerator';

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
  { en: 'Algebra Basics', ar: 'أساسيات الجبر' },
  { en: 'Ancient Egypt', ar: 'مصر القديمة' },
];

const STYLES = [
  { value: 'educational', labelEn: 'Educational', labelAr: 'تعليمي', icon: BookOpen, color: 'bg-blue-500' },
  { value: 'fun', labelEn: 'Fun & Engaging', labelAr: 'ممتع وتفاعلي', icon: Sparkles, color: 'bg-pink-500' },
  { value: 'visual', labelEn: 'Visual Focus', labelAr: 'بصري', icon: Eye, color: 'bg-green-500' },
  { value: 'concise', labelEn: 'Concise', labelAr: 'موجز', icon: Zap, color: 'bg-gray-500' },
];

export const EducationalPresentationGenerator = () => {
  const { language } = useLanguage();
  const isArabic = language === 'ar';
  
  const { isGenerating, generatedPresentation, generatePresentation } = useEducationalPresentationGenerator();

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
      {/* Settings Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Presentation className="h-5 w-5 text-primary" />
            {isArabic ? 'مولد العروض التقديمية التعليمية' : 'Educational Presentation Generator'}
          </CardTitle>
          <CardDescription>
            {isArabic 
              ? 'أنشئ عروض تقديمية تعليمية احترافية بالذكاء الاصطناعي'
              : 'Create professional educational presentations with AI'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Topic Input */}
          <div className="space-y-2">
            <Label htmlFor="topic">{isArabic ? 'الموضوع' : 'Topic'} *</Label>
            <Input
              id="topic"
              placeholder={isArabic ? 'أدخل موضوع العرض التقديمي...' : 'Enter presentation topic...'}
              value={settings.topic}
              onChange={(e) => setSettings({ ...settings, topic: e.target.value })}
              disabled={isGenerating}
              className="text-lg"
            />
            
            {/* Popular Topics */}
            <div className="flex flex-wrap gap-2 mt-2">
              {POPULAR_TOPICS.map((topic) => (
                <Badge
                  key={topic.en}
                  variant={settings.topic === (isArabic ? topic.ar : topic.en) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/10"
                  onClick={() => setSettings({ ...settings, topic: isArabic ? topic.ar : topic.en })}
                >
                  {isArabic ? topic.ar : topic.en}
                </Badge>
              ))}
            </div>
          </div>

          {/* Grade Level & Slide Count */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <SelectContent>
                  {GRADE_LEVELS.map((grade) => (
                    <SelectItem key={grade} value={grade}>{grade}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>{isArabic ? 'عدد الشرائح' : 'Number of Slides'}: {settings.slideCount}</Label>
              <Slider
                value={[settings.slideCount]}
                onValueChange={(value) => setSettings({ ...settings, slideCount: value[0] })}
                min={5}
                max={20}
                step={1}
                disabled={isGenerating}
                className="mt-2"
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>5</span>
                <span>20</span>
              </div>
            </div>
          </div>

          {/* Style Selection */}
          <div className="space-y-2">
            <Label>{isArabic ? 'نمط العرض' : 'Presentation Style'}</Label>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {STYLES.map((style) => {
                const Icon = style.icon;
                const isSelected = settings.style === style.value;
                return (
                  <button
                    key={style.value}
                    onClick={() => setSettings({ ...settings, style: style.value as any })}
                    disabled={isGenerating}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-full ${style.color} mx-auto mb-2 flex items-center justify-center`}>
                      <Icon className="h-5 w-5 text-white" />
                    </div>
                    <p className="text-sm font-medium text-center">
                      {isArabic ? style.labelAr : style.labelEn}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Options */}
          <div className="flex flex-wrap gap-6">
            <div className="flex items-center gap-2">
              <Switch
                id="includeQuiz"
                checked={settings.includeQuiz}
                onCheckedChange={(checked) => setSettings({ ...settings, includeQuiz: checked })}
                disabled={isGenerating}
              />
              <Label htmlFor="includeQuiz">
                {isArabic ? 'تضمين أسئلة اختبار' : 'Include Quiz Questions'}
              </Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                id="includeExamples"
                checked={settings.includeExamples}
                onCheckedChange={(checked) => setSettings({ ...settings, includeExamples: checked })}
                disabled={isGenerating}
              />
              <Label htmlFor="includeExamples">
                {isArabic ? 'تضمين أمثلة عملية' : 'Include Practical Examples'}
              </Label>
            </div>
          </div>

          {/* Generate Button */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating || !settings.topic.trim()}
            className="w-full"
            size="lg"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                {isArabic ? 'جاري الإنشاء... (قد يستغرق 1-3 دقائق)' : 'Generating... (may take 1-3 minutes)'}
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                {isArabic ? 'إنشاء العرض التقديمي' : 'Generate Presentation'}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Result Card with Download Links */}
      {generatedPresentation && generatedPresentation.success && (
        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Presentation className="h-5 w-5 text-primary" />
              {generatedPresentation.title}
            </CardTitle>
            <CardDescription>
              {generatedPresentation.slideCount} {isArabic ? 'شريحة' : 'slides'} • {isArabic ? 'جاهز للتحميل' : 'Ready to download'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {/* View Online */}
              {generatedPresentation.presentationUrl && (
                <a
                  href={generatedPresentation.presentationUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="hover:bg-primary/5 transition-colors cursor-pointer border-primary/20 h-full">
                    <CardContent className="flex flex-col items-center justify-center gap-3 p-6">
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                        <ExternalLink className="h-6 w-6 text-primary" />
                      </div>
                      <span className="font-medium text-sm">
                        {isArabic ? 'عرض أونلاين' : 'View Online'}
                      </span>
                    </CardContent>
                  </Card>
                </a>
              )}

              {/* Download PPTX */}
              {generatedPresentation.pptUrl && (
                <a
                  href={generatedPresentation.pptUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="hover:bg-primary/5 transition-colors cursor-pointer border-primary/20 h-full">
                    <CardContent className="flex flex-col items-center justify-center gap-3 p-6">
                      <div className="w-12 h-12 rounded-full bg-secondary/10 flex items-center justify-center">
                        <Download className="h-6 w-6 text-secondary" />
                      </div>
                      <span className="font-medium text-sm">
                        {isArabic ? 'تحميل PPTX' : 'Download PPTX'}
                      </span>
                    </CardContent>
                  </Card>
                </a>
              )}

              {/* Download PDF */}
              {generatedPresentation.pdfUrl && (
                <a
                  href={generatedPresentation.pdfUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Card className="hover:bg-primary/5 transition-colors cursor-pointer border-primary/20 h-full">
                    <CardContent className="flex flex-col items-center justify-center gap-3 p-6">
                      <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
                        <FileText className="h-6 w-6 text-destructive" />
                      </div>
                      <span className="font-medium text-sm">
                        {isArabic ? 'تحميل PDF' : 'Download PDF'}
                      </span>
                    </CardContent>
                  </Card>
                </a>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
