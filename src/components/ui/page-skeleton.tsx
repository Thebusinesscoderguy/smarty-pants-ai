import { Skeleton } from '@/components/ui/skeleton';

export const DashboardSkeleton = () => (
  <div className="space-y-6 p-6">
    <Skeleton className="h-8 w-64" />
    <Skeleton className="h-4 w-96" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {[1, 2, 3].map(i => (
        <Skeleton key={i} className="h-32 rounded-xl" />
      ))}
    </div>
    <Skeleton className="h-64 rounded-xl" />
  </div>
);

export const ChatSkeleton = () => (
  <div className="flex flex-col h-[80vh] p-4 space-y-4">
    <Skeleton className="h-12 w-full rounded-lg" />
    <div className="flex-1 space-y-4">
      {[1, 2, 3].map(i => (
        <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
          <Skeleton className={`h-16 rounded-2xl ${i % 2 === 0 ? 'w-2/3' : 'w-3/4'}`} />
        </div>
      ))}
    </div>
    <Skeleton className="h-14 w-full rounded-lg" />
  </div>
);

export const QuizSkeleton = () => (
  <div className="space-y-6 p-6 max-w-4xl mx-auto">
    <Skeleton className="h-10 w-48" />
    <div className="flex gap-2">
      {[1, 2, 3, 4].map(i => (
        <Skeleton key={i} className="h-10 w-28 rounded-lg" />
      ))}
    </div>
    <Skeleton className="h-48 rounded-xl" />
    <Skeleton className="h-12 w-40" />
  </div>
);

export const TableSkeleton = () => (
  <div className="space-y-3">
    <Skeleton className="h-10 w-full" />
    {[1, 2, 3, 4, 5].map(i => (
      <Skeleton key={i} className="h-12 w-full" />
    ))}
  </div>
);
