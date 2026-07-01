import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useSchoolOnboarding, STEP_KEYS } from '@/hooks/useSchoolOnboarding';
import { WizardShell } from '@/components/school-onboarding/WizardShell';
import { WelcomeStep } from '@/components/school-onboarding/steps/WelcomeStep';

import { RosterStep } from '@/components/school-onboarding/steps/RosterStep';
import { TeachersStep } from '@/components/school-onboarding/steps/TeachersStep';
import { GradebookStep } from '@/components/school-onboarding/steps/GradebookStep';
import { SemesterDatesStep } from '@/components/school-onboarding/steps/SemesterDatesStep';
import { CurriculumStep } from '@/components/school-onboarding/steps/CurriculumStep';
import { LiveStep } from '@/components/school-onboarding/steps/LiveStep';
import { useLanguage } from '@/contexts/LanguageContext';

const STEP_TITLE_KEYS: Record<typeof STEP_KEYS[number], { titleKey: string; subKey: string }> = {
  welcome: { titleKey: 'so.welcomeTitle', subKey: 'so.welcomeSub' },
  roster: { titleKey: 'so.rosterTitle', subKey: 'so.rosterSub' },
  teachers: { titleKey: 'so.teachersTitle', subKey: 'so.teachersSub' },
  gradebook: { titleKey: 'so.gradebookTitle', subKey: 'so.gradebookSub' },
  semester: { titleKey: 'so.semesterTitle', subKey: 'so.semesterSub' },
  curriculum: { titleKey: 'so.curriculumTitle', subKey: 'so.curriculumSub' },
  live: { titleKey: '', subKey: '' },
};

const SchoolOnboarding = () => {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const {
    schoolId, schoolName, progress, loading,
    markStepComplete, goToStep, finish, updateProgress,
  } = useSchoolOnboarding();

  useEffect(() => {
    if (!loading && !schoolId && user) {
      // Not a school admin
      navigate('/');
    }
  }, [loading, schoolId, user, navigate]);

  if (authLoading || loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!schoolId || !progress) return null;

  const currentKey = STEP_KEYS[progress.current_step] || 'welcome';
  const metaKeys = STEP_TITLE_KEYS[currentKey];
  const meta = { title: metaKeys.titleKey ? t(metaKeys.titleKey) : '', subtitle: metaKeys.subKey ? t(metaKeys.subKey) : '' };

  const goNext = () => goToStep(Math.min(progress.current_step + 1, STEP_KEYS.length - 1));
  const goBack = () => goToStep(Math.max(progress.current_step - 1, 0));

  let content: React.ReactNode = null;
  let nextDisabled = false;
  let nextLabel = t('so.continue');
  let onNext = async () => { await markStepComplete(currentKey); goNext(); };
  let onSkip: (() => void) | undefined = undefined;
  let hideNext = false;

  switch (currentKey) {
    case 'welcome':
      content = <WelcomeStep schoolName={schoolName} />;
      nextLabel = t('so.letsGo');
      break;
    case 'roster':
      content = (
        <RosterStep
          schoolId={schoolId}
          onImported={(count) => updateProgress({ students_imported: progress.students_imported + count })}
        />
      );
      onSkip = async () => { await markStepComplete('roster'); goNext(); };
      break;
    case 'teachers':
      content = (
        <TeachersStep
          schoolId={schoolId}
          onInvited={(count) => updateProgress({ teachers_invited: count })}
        />
      );
      onSkip = async () => { await markStepComplete('teachers'); goNext(); };
      break;
    case 'gradebook':
      content = <GradebookStep onChoice={(s) => updateProgress({ gradebook_status: s })} />;
      nextDisabled = progress.gradebook_status === 'pending';
      onSkip = async () => { await updateProgress({ gradebook_status: 'fresh' }); await markStepComplete('gradebook'); goNext(); };
      break;
    case 'semester':
      content = <SemesterDatesStep schoolId={schoolId} />;
      // Term dates: S1 asked up front, S2 optional. Never hard-blocks — the gradebook
      // falls back to all-time for any semester without dates, so "set later" is safe.
      onSkip = async () => { await markStepComplete('semester'); goNext(); };
      break;
    case 'curriculum':
      content = <CurriculumStep onComplete={async () => { await markStepComplete('curriculum'); goNext(); }} />;
      // Optional step — admins can publish a book now or skip and add one later.
      onSkip = async () => { await markStepComplete('curriculum'); goNext(); };
      break;
    case 'live':
      content = (
        <LiveStep
          schoolName={schoolName}
          studentsImported={progress.students_imported}
          teachersInvited={progress.teachers_invited}
          frameworkChosen={progress.framework_chosen}
          onFinish={async () => { await markStepComplete('live'); await finish(); }}
        />
      );
      hideNext = true;
      break;
  }

  return (
    <WizardShell
      currentStep={progress.current_step}
      completedSteps={progress.completed_steps || []}
      onStepClick={goToStep}
      onBack={goBack}
      onNext={onNext}
      onSkip={onSkip}
      nextLabel={nextLabel}
      nextDisabled={nextDisabled}
      hideNext={hideNext}
      title={meta.title}
      subtitle={meta.subtitle}
    >
      {content}
    </WizardShell>
  );
};

export default SchoolOnboarding;
