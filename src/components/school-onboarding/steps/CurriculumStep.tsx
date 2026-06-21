import { Card } from '@/components/ui/card';
import { BookOpen } from 'lucide-react';
import { CurriculumImporter } from '@/components/curriculum/CurriculumImporter';

// Onboarding step: import a textbook into the structured curriculum (books →
// units → lessons + figures). Admin-only and subject-labeled via the importer.
// Skippable from the wizard (schools can add curriculum later from the admin area).
export const CurriculumStep = ({ onComplete }: { onComplete?: (bookId: string) => void }) => {
  return (
    <div className="space-y-4">
      <Card className="p-4 bg-muted/30">
        <div className="flex items-start gap-3">
          <BookOpen className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <p className="text-sm font-medium">Add a textbook to your curriculum (optional)</p>
            <p className="text-xs text-muted-foreground mt-1">
              Upload a textbook PDF — we extract its text and figures in your browser, detect the
              chapter structure, and let you review before publishing. Published lessons power
              grounded, curriculum-aligned quizzes. You can always do this later.
            </p>
          </div>
        </div>
      </Card>

      <CurriculumImporter onComplete={onComplete} />
    </div>
  );
};
