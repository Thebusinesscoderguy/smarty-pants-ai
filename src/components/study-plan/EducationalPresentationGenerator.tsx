import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Loader2, Presentation, Download, Sparkles, BookOpen, Palette, Zap, Eye } from 'lucide-react';
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
  
  const { isGenerating, generatedPresentation, generatePresentation, downloadPresentation } = useEducationalPresentationGenerator();

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

  const handleDownload = () => {
    if (generatedPresentation) {
      downloadPresentation(generatedPresentation, settings);
    }
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
                {isArabic ? 'جاري الإنشاء...' : 'Generating...'}
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

      {/* Preview Card */}
      {generatedPresentation && (
        <Card className="border-primary/20">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <Presentation className="h-5 w-5 text-primary" />
                  {generatedPresentation.title}
                </CardTitle>
                <CardDescription>
                  {generatedPresentation.slides.length} {isArabic ? 'شريحة' : 'slides'}
                  {generatedPresentation.quizQuestions && generatedPresentation.quizQuestions.length > 0 && (
                    <> • {generatedPresentation.quizQuestions.length} {isArabic ? 'أسئلة اختبار' : 'quiz questions'}</>
                  )}
                </CardDescription>
              </div>
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                {isArabic ? 'تحميل PPTX' : 'Download PPTX'}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Slide Preview */}
            <div className="space-y-4">
              <h4 className="font-medium">{isArabic ? 'معاينة الشرائح' : 'Slide Preview'}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {generatedPresentation.slides.map((slide, index) => (
                  <div
                    key={index}
                    className="aspect-video bg-gradient-to-br from-primary/10 to-secondary/10 rounded-lg p-3 border"
                  >
                    <div className="flex items-center gap-1 mb-1">
                      <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center">
                        {index + 1}
                      </span>
                    </div>
                    <p className="text-xs font-medium line-clamp-2">{slide.title}</p>
                    <p className="text-[10px] text-muted-foreground mt-1 line-clamp-2">
                      {slide.content[0]}
                    </p>
                  </div>
                ))}
              </div>

              {/* Detailed Slides */}
              <div className="space-y-3 mt-6">
                <h4 className="font-medium">{isArabic ? 'تفاصيل الشرائح' : 'Slide Details'}</h4>
                {generatedPresentation.slides.map((slide, index) => (
                  <div key={index} className="p-4 rounded-lg border bg-muted/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge variant="outline">{isArabic ? 'شريحة' : 'Slide'} {slide.slideNumber}</Badge>
                      <span className="font-semibold">{slide.title}</span>
                    </div>
                    <ul className={`list-disc ${isArabic ? 'mr-5' : 'ml-5'} space-y-1 text-sm text-muted-foreground`}>
                      {slide.content.map((bullet, bIndex) => (
                        <li key={bIndex}>{bullet}</li>
                      ))}
                    </ul>
                    {slide.visualSuggestion && (
                      <p className="mt-2 text-xs text-primary italic">
                        💡 {slide.visualSuggestion}
                      </p>
                    )}
                  </div>
                ))}
              </div>

              {/* Quiz Preview */}
              {generatedPresentation.quizQuestions && generatedPresentation.quizQuestions.length > 0 && (
                <div className="space-y-3 mt-6">
                  <h4 className="font-medium">{isArabic ? 'أسئلة الاختبار' : 'Quiz Questions'}</h4>
                  {generatedPresentation.quizQuestions.map((quiz, index) => (
                    <div key={index} className="p-4 rounded-lg border bg-warning/5">
                      <p className="font-medium mb-2">Q{index + 1}: {quiz.question}</p>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {quiz.options.map((opt, optIndex) => (
                          <div
                            key={optIndex}
                            className={`p-2 rounded ${
                              opt.startsWith(quiz.correctAnswer) 
                                ? 'bg-success/20 border-success' 
                                : 'bg-muted'
                            } border`}
                          >
                            {opt}
                          </div>
                        ))}
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        💡 {quiz.explanation}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
