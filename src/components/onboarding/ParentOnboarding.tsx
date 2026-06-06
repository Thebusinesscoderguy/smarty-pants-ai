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
    'Mathematics', 'Science', 'English/Language Arts', 'History', 'Geography',
    'Art', 'Music', 'Physical Education', 'Foreign Languages', 'Computer Science'
  ];

  const learningGoalOptions = [
    'Improve grades', 'Build confidence', 'Catch up on missed topics',
    'Prepare for tests', 'Develop study habits', 'Enhance critical thinking',
    'Explore new interests', 'Get ahead in curriculum'
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
          Welcome to TeachlyAI Family
        </CardTitle>
        <p className="text-white/80">Let's set up your family's personalized learning experience</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border border-blue-500/30">
              <FileQuestion className="h-12 w-12 text-blue-400 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">Smart Quiz Analysis</h3>
              <p className="text-white/70 text-sm">Upload quizzes to get personalized study plans targeting weak areas</p>
            </div>
            
            <div className="p-6 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 border border-green-500/30">
              <Brain className="h-12 w-12 text-green-400 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">AI-Powered Learning</h3>
              <p className="text-white/70 text-sm">Adaptive AI that personalizes lessons to your child's learning style</p>
            </div>
            
            <div className="p-6 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30">
              <TrendingUp className="h-12 w-12 text-purple-400 mx-auto mb-4" />
              <h3 className="font-semibold text-white mb-2">Progress Tracking</h3>
              <p className="text-white/70 text-sm">Detailed insights and reports to celebrate achievements</p>
            </div>
          </div>
          
          <div className="p-6 bg-gradient-to-r from-yellow-500/20 to-violet-500/20 rounded-xl border border-yellow-500/30">
            <div className="flex items-center justify-center gap-2 mb-3">
              <Shield className="h-5 w-5 text-yellow-400" />
              <span className="font-semibold text-yellow-400">Safe & Secure</span>
            </div>
            <p className="text-white/80 text-sm">
              Your children's privacy and safety are our top priority. All interactions are monitored and secure.
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
          Add Your Children
        </CardTitle>
        <p className="text-white/70">Tell us about each child who will be using TeachlyAI</p>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Child Input Form */}
        <div className="space-y-4 p-4 bg-white/5 rounded-lg border border-white/10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="childName" className="text-white">Child's Name</Label>
              <Input
                id="childName"
                value={currentChild.name || ''}
                onChange={(e) => setCurrentChild({ ...currentChild, name: e.target.value })}
                placeholder="Enter name"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <Label htmlFor="childAge" className="text-white">Age</Label>
              <Input
                id="childAge"
                value={currentChild.age || ''}
                onChange={(e) => setCurrentChild({ ...currentChild, age: e.target.value })}
                placeholder="Age"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
            <div>
              <Label htmlFor="gradeLevel" className="text-white">Grade Level</Label>
              <Input
                id="gradeLevel"
                value={currentChild.gradeLevel || ''}
                onChange={(e) => setCurrentChild({ ...currentChild, gradeLevel: e.target.value })}
                placeholder="Grade"
                className="bg-white/10 border-white/20 text-white placeholder:text-white/50"
              />
            </div>
          </div>
          
          <div>
            <Label className="text-white mb-3 block">Subjects of Interest</Label>
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
            Add Child
          </Button>
        </div>

        {/* Added Children */}
        {children.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-white font-medium">Added Children:</h3>
            {children.map((child) => (
              <div key={child.id} className="p-4 bg-white/5 rounded-lg border border-white/10">
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-white font-medium">{child.name}</h4>
                    <p className="text-white/70 text-sm">Age {child.age}, Grade {child.gradeLevel}</p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {child.subjects.slice(0, 3).map((subject) => (
                        <Badge key={subject} variant="outline" className="border-white/30 text-white text-xs">
                          {subject}
                        </Badge>
                      ))}
                      {child.subjects.length > 3 && (
                        <Badge variant="outline" className="border-white/30 text-white text-xs">
                          +{child.subjects.length - 3} more
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
          Learning Goals & Preferences
        </CardTitle>
        <p className="text-white/70">Help us understand what you want to achieve</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-white mb-3 block">Primary Learning Goals</Label>
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
          <Label className="text-white mb-3 block">Daily Study Time Goal (minutes)</Label>
          <Input
            value={preferences.studyTimeGoals}
            onChange={(e) => setPreferences({ ...preferences, studyTimeGoals: e.target.value })}
            placeholder="Enter minutes (e.g., 30, 45, 60)"
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
          Notification & Privacy Settings
        </CardTitle>
        <p className="text-white/70">Customize how we communicate with you</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div>
          <Label className="text-white mb-3 block">Progress Report Frequency</Label>
          <div className="flex gap-3">
            {[
              { value: 'daily', label: 'Daily' },
              { value: 'weekly', label: 'Weekly' },
              { value: 'monthly', label: 'Monthly' }
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
          <Label className="text-white mb-3 block">Notification Preferences</Label>
          <div className="space-y-3">
            {[
              'Achievement alerts', 
              'Weekly progress summaries', 
              'Study reminders',
              'Improvement suggestions',
              'New feature announcements'
            ].map((type) => (
              <div key={type} className="flex items-center gap-3">
                <Checkbox
                  checked={preferences.notificationTypes.includes(type)}
                  onCheckedChange={() => handlePreferenceToggle('notificationTypes', type)}
                  className="border-white/30"
                />
                <span className="text-white">{type}</span>
              </div>
            ))}
          </div>
        </div>
        
        <div>
          <Label className="text-white mb-3 block">Privacy Settings</Label>
          <div className="space-y-3">
            {[
              'Share anonymous usage data to improve the platform',
              'Allow educational content recommendations',
              'Enable social features (achievements sharing)'
            ].map((setting) => (
              <div key={setting} className="flex items-center gap-3">
                <Checkbox
                  checked={preferences.privacySettings.includes(setting)}
                  onCheckedChange={() => handlePreferenceToggle('privacySettings', setting)}
                  className="border-white/30"
                />
                <span className="text-white text-sm">{setting}</span>
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
          You're All Set!
        </CardTitle>
        <p className="text-white/80">Your family learning environment is ready</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="text-center space-y-4">
          <div className="p-6 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-xl border border-green-500/30">
            <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
            <h3 className="font-semibold text-white mb-2">Welcome to the Family!</h3>
            <p className="text-white/80">
              We've set up personalized learning experiences for {children.length} child{children.length !== 1 ? 'ren' : ''}.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-white/5 rounded-lg">
              <Zap className="h-8 w-8 text-yellow-400 mx-auto mb-2" />
              <h4 className="text-white font-medium mb-1">Start Learning</h4>
              <p className="text-white/70 text-sm">Begin with our AI chat or voice sessions</p>
            </div>
            
            <div className="p-4 bg-white/5 rounded-lg">
              <FileQuestion className="h-8 w-8 text-blue-400 mx-auto mb-2" />
              <h4 className="text-white font-medium mb-1">Upload Quizzes</h4>
              <p className="text-white/70 text-sm">Get personalized study plans from quiz results</p>
            </div>
            
            <div className="p-4 bg-white/5 rounded-lg">
              <TrendingUp className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <h4 className="text-white font-medium mb-1">Track Progress</h4>
              <p className="text-white/70 text-sm">Monitor achievements and celebrate milestones</p>
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
            <h1 className="text-3xl font-bold text-white">Family Setup</h1>
            <Badge className="bg-white/20 text-white">
              Step {currentStep} of {totalSteps}
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
            Previous
          </Button>
          
          {currentStep < totalSteps ? (
            <Button
              onClick={() => setCurrentStep(Math.min(totalSteps, currentStep + 1))}
              disabled={!canProceed()}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              Next
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={() => navigate('/family-hub')}
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700"
            >
              Get Started
              <Star className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ParentOnboarding;