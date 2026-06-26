import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  Shield, 
  FileQuestion, 
  Brain, 
  TrendingUp,
  CheckCircle,
  ArrowRight,
  ArrowLeft,
  Heart,
  Star,
  Target,
  Zap,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';

interface ChildInfo {
  id: string;
  name: string;
  age: string;
  gradeLevel: string;
  subjects: string[];
  learningGoals: string[];
}

interface ParentPreferences {
  reportFrequency: string;
  notificationTypes: string[];
  privacySettings: string[];
  studyTimeGoals: string;
}

const ParentOnboarding = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(1);
  const [children, setChildren] = useState<ChildInfo[]>([]);
  const [preferences, setPreferences] = useState<ParentPreferences>({
    reportFrequency: 'weekly',
    notificationTypes: [],
    privacySettings: [],
    studyTimeGoals: '30'
  });
  const [currentChild, setCurrentChild] = useState<Partial<ChildInfo>>({
    name: '',
    age: '',
    gradeLevel: '',
    subjects: [],
    learningGoals: []
  });

  const totalSteps = 5;
  const progressPercentage = (currentStep / totalSteps) * 100;

  const availableSubjects = [
    t('po.s.math'), t('po.s.science'), t('po.s.english'), t('po.s.history'), t('po.s.geography'),
    t('po.s.art'), t('po.s.music'), t('po.s.pe'), t('po.s.langs'), t('po.s.cs')
  ];

  const learningGoalOptions = [
    t('po.g.grades'), t('po.g.confidence'), t('po.g.catchup'),
    t('po.g.tests'), t('po.g.habits'), t('po.g.thinking'),
    t('po.g.interests'), t('po.g.ahead')
  ];

  const handleAddChild = () => {
    if (currentChild.name && currentChild.age && currentChild.gradeLevel) {
      const newChild: ChildInfo = {
        id: Date.now().toString(),
        name: currentChild.name,
        age: currentChild.age,
        gradeLevel: currentChild.gradeLevel,
        subjects: currentChild.subjects || [],
        learningGoals: currentChild.learningGoals || []
      };
      setChildren([...children, newChild]);
      setCurrentChild({ name: '', age: '', gradeLevel: '', subjects: [], learningGoals: [] });
    }
  };

  const handleSubjectToggle = (subject: string) => {
    const subjects = currentChild.subjects || [];
    setCurrentChild({
      ...currentChild,
      subjects: subjects.includes(subject)
        ? subjects.filter(s => s !== subject)
        : [...subjects, subject]
    });
  };

  const handleGoalToggle = (goal: string) => {
    const goals = currentChild.learningGoals || [];
    setCurrentChild({
      ...currentChild,
      learningGoals: goals.includes(goal)
        ? goals.filter(g => g !== goal)
        : [...goals, goal]
    });
  };

  const handlePreferenceToggle = (type: 'notificationTypes' | 'privacySettings', value: string) => {
    setPreferences({
      ...preferences,
      [type]: preferences[type].includes(value)
        ? preferences[type].filter(item => item !== value)
        : [...preferences[type], value]
    });
  };

  const renderStep1 = () => (
    <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-white text-2xl flex items-center justify-center gap-2">
          <Heart className="h-6 w-6 text-pink-400" />
          {t('po.welcomeTitle')}
        </CardTitle>
        <p className="text-white/80">{t('po.welcomeSub')}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
              <FileQuestion className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">{t('po.smartQuizTitle')}</h3>
              <p className="text-white/70 text-sm">{t('po.smartQuizBody')}</p>
            </div>
            
            <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
              <Brain className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">{t('po.aiLearnTitle')}</h3>
              <p className="text-white/70 text-sm">{t('po.aiLearnBody')}</p>
            </div>
            
            <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <TrendingUp className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">{t('po.progressTitle')}</h3>
              <p className="text-white/70 text-sm">{t('po.progressBody')}</p>
            </div>
          </div>
          
          <div className="p-6 bg-gradient-to-r from-yellow-500/20 to-violet-500/20 rounded-xl border border-yellow-500/30">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-yellow-400" />
              <span className="font-semibold text-yellow-400">{t('po.safeTitle')}</span>
            </div>
            <p className="text-white/80 text-sm">
              {t('po.safeBody')}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep2 = () => (
    <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white text-xl flex items-center gap-2">
          <Users className="h-5 w-5" />
          {t('po.addChildren')}
        </CardTitle>
        <p className="text-white/70">{t('po.addChildrenSub')}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Child Input Form */}
        <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="childName" className="text-white">{t('po.childName')}</Label>
              <Input
                id="childName"
                value={currentChild.name || ''}
                onChange={(e) => setCurrentChild({ ...currentChild, name: e.target.value })}
                placeholder={t('po.enterName')}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <Label htmlFor="childAge" className="text-white">{t('po.age')}</Label>
              <Input
                id="childAge"
                value={currentChild.age || ''}
                onChange={(e) => setCurrentChild({ ...currentChild, age: e.target.value })}
                placeholder={t('po.age')}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <Label htmlFor="gradeLevel" className="text-white">{t('po.gradeLevel')}</Label>
              <Input
                id="gradeLevel"
                value={currentChild.gradeLevel || ''}
                onChange={(e) => setCurrentChild({ ...currentChild, gradeLevel: e.target.value })}
                placeholder={t('po.gradePlaceholder')}
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-white mb-3 block">{t('po.subjectsInterest')}</Label>
            <div className="flex flex-wrap gap-2">
              {availableSubjects.map((subject) => (
                <Badge
                  key={subject}
                  variant={currentChild.subjects?.includes(subject) ? "default" : "outline"}
                  className={`cursor-pointer transition-colors ${
                    currentChild.subjects?.includes(subject)
                      ? 'bg-blue-500 text-white'
                      : 'border-white/30 text-white hover:bg-white/10'
                  }`}
                  onClick={() => handleSubjectToggle(subject)}
                >
                  {subject}
                </Badge>
              ))}
            </div>
          </div>
          
          <Button 
            onClick={handleAddChild}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            disabled={!currentChild.name || !currentChild.age || !currentChild.gradeLevel}
          >
            {t('po.addChild')}
          </Button>
        </div>

        {/* Added Children */}
        {children.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-white font-medium">{t('po.addedChildren')}</h3>
            {children.map((child) => (
              <div key={child.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white font-medium">{child.name}</h4>
                    <p className="text-white/70 text-sm">{t('po.ageWord')} {child.age}, {t('po.gradeWord')} {child.gradeLevel}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {child.subjects.slice(0, 3).map((subject) => (
                        <Badge key={subject} variant="outline" className="border-white/30 text-white text-xs">
                          {subject}
                        </Badge>
                      ))}
                      {child.subjects.length > 3 && (
                        <Badge variant="outline" className="border-white/30 text-white text-xs">
                          +{child.subjects.length - 3} {t('po.moreSuffix')}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <CheckCircle className="h-5 w-5 text-green-400" />
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );

  const renderStep3 = () => (
    <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white text-xl flex items-center gap-2">
          <Target className="h-5 w-5" />
          {t('po.goalsTitle')}
        </CardTitle>
        <p className="text-white/70">{t('po.goalsSub')}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-white mb-3 block">{t('po.primaryGoals')}</Label>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {learningGoalOptions.map((goal) => (
              <div
                key={goal}
                className={`p-4 rounded-lg border transition-all cursor-pointer ${
                  currentChild.learningGoals?.includes(goal)
                    ? 'bg-purple-500/20 border-purple-500/50'
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}
                onClick={() => handleGoalToggle(goal)}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1 rounded ${
                    currentChild.learningGoals?.includes(goal) 
                      ? 'bg-purple-500' 
                      : 'bg-white/20'
                  }`}>
                    {currentChild.learningGoals?.includes(goal) && (
                      <CheckCircle className="h-4 w-4 text-white" />
                    )}
                  </div>
                  <span className="text-white text-sm">{goal}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <Label className="text-white mb-3 block">{t('po.studyTimeGoal')}</Label>
          <Input
            value={preferences.studyTimeGoals}
            onChange={(e) => setPreferences({ ...preferences, studyTimeGoals: e.target.value })}
            placeholder={t('po.studyTimePlaceholder')}
            className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
            type="number"
            min="5"
            max="180"
          />
        </div>
      </CardContent>
    </Card>
  );

  const renderStep4 = () => (
    <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-white text-xl flex items-center gap-2">
          <Settings className="h-5 w-5" />
          {t('po.notifPrivacy')}
        </CardTitle>
        <p className="text-white/70">{t('po.notifPrivacySub')}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-white mb-3 block">{t('po.reportFreq')}</Label>
          <div className="flex gap-3">
            {[
              { value: 'daily', label: t('po.daily') },
              { value: 'weekly', label: t('po.weekly') },
              { value: 'monthly', label: t('po.monthly') }
            ].map((option) => (
              <Button
                key={option.value}
                variant={preferences.reportFrequency === option.value ? "default" : "outline"}
                onClick={() => setPreferences({ ...preferences, reportFrequency: option.value })}
                className={
                  preferences.reportFrequency === option.value
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'border-white/30 text-white hover:bg-white/10'
                }
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        
        <div>
          <Label className="text-white mb-3 block">{t('po.notifPrefs')}</Label>
          <div className="space-y-3">
            {[
              { v: 'Achievement alerts', l: t('po.n.achieve') },
              { v: 'Weekly progress summaries', l: t('po.n.weekly') },
              { v: 'Study reminders', l: t('po.n.reminders') },
              { v: 'Improvement suggestions', l: t('po.n.suggestions') },
              { v: 'New feature announcements', l: t('po.n.features') }
            ].map(({ v, l }) => (
              <div key={v} className="flex items-center gap-3">
                <Checkbox
                  checked={preferences.notificationTypes.includes(v)}
                  onCheckedChange={() => handlePreferenceToggle('notificationTypes', v)}
                  className="border-white/30"
                />
                <span className="text-white">{l}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <Label className="text-white mb-3 block">{t('po.privacy')}</Label>
          <div className="space-y-3">
            {[
              { v: 'Share anonymous usage data to improve the platform', l: t('po.p.anon') },
              { v: 'Allow educational content recommendations', l: t('po.p.recs') },
              { v: 'Enable social features (achievements sharing)', l: t('po.p.social') }
            ].map(({ v, l }) => (
              <div key={v} className="flex items-center gap-3">
                <Checkbox
                  checked={preferences.privacySettings.includes(v)}
                  onCheckedChange={() => handlePreferenceToggle('privacySettings', v)}
                  className="border-white/30"
                />
                <span className="text-white text-sm">{l}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStep5 = () => (
    <Card className="bg-white/10 border-white/20 backdrop-blur-sm">
      <CardHeader className="text-center">
        <CardTitle className="text-white text-2xl flex items-center justify-center gap-2">
          <Star className="h-6 w-6 text-yellow-400" />
          {t('po.allSet')}
        </CardTitle>
        <p className="text-white/80">{t('po.allSetSub')}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <div className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="font-semibold text-white mb-2">{t('po.welcomeFamily')}</h3>
            <p className="text-white/80">
              {t('po.setupDonePre')} {children.length} {children.length !== 1 ? t('po.childrenWord') : t('po.childWord')}.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/5 rounded-lg">
              <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <h4 className="text-white font-medium mb-1">{t('po.startLearning')}</h4>
              <p className="text-white/70 text-sm">{t('po.startLearningBody')}</p>
            </div>
            
            <div className="p-4 bg-white/5 rounded-lg">
              <FileQuestion className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <h4 className="text-white font-medium mb-1">{t('po.uploadQuizzes')}</h4>
              <p className="text-white/70 text-sm">{t('po.uploadQuizzesBody')}</p>
            </div>
            
            <div className="p-4 bg-white/5 rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <h4 className="text-white font-medium mb-1">{t('po.trackProgress')}</h4>
              <p className="text-white/70 text-sm">{t('po.trackProgressBody')}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const renderStepContent = () => {
    switch (currentStep) {
      case 1: return renderStep1();
      case 2: return renderStep2();
      case 3: return renderStep3();
      case 4: return renderStep4();
      case 5: return renderStep5();
      default: return renderStep1();
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 1: return true;
      case 2: return children.length > 0;
      case 3: return currentChild.learningGoals && currentChild.learningGoals.length > 0;
      case 4: return true;
      case 5: return true;
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-violet-900 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-white">{t('po.familySetup')}</h1>
            <Badge className="bg-white/20 text-white">
              {t('po.step')} {currentStep} {t('po.of')} {totalSteps}
            </Badge>
          </div>
          <Progress value={progressPercentage} className="h-2" />
        </div>

        {/* Step Content */}
        <div className="mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
            disabled={currentStep === 1}
            className="border-white/30 text-white hover:bg-white/10"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t('po.previous')}
          </Button>
          
          {currentStep < totalSteps ? (
            <Button
              onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {t('po.next')}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/family-hub')}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              {t('po.getStarted')}
              <Star className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentOnboarding;