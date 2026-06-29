import React from 'react';

/**
 * Small inline empty-state hint used across the Family Hub cards.
 * Shared so the standalone Behavior page renders identical empty states.
 */
export const EmptyHint = ({ icon: Icon, text }: { icon: React.ElementType; text: string }) => (
  <div className="flex items-start gap-2 text-sm text-muted-foreground py-2">
    <Icon className="h-4 w-4 mt-0.5 shrink-0 opacity-60" />
    <span>{text}</span>
  </div>
);
