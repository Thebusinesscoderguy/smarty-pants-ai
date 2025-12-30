import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

export type ViewingMode =
  | { mode: 'parent' }
  | { mode: 'child'; childId: string };

type ViewingModeContextValue = {
  viewingMode: ViewingMode;
  setParentMode: () => void;
  setChildMode: (childId: string) => void;
};

const STORAGE_KEY = 'teachly_viewing_mode_v1';

const ViewingModeContext = createContext<ViewingModeContextValue | null>(null);

const safeParse = (raw: string | null): ViewingMode | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.mode === 'child' && typeof parsed.childId === 'string' && parsed.childId) {
      return { mode: 'child', childId: parsed.childId };
    }
    if (parsed?.mode === 'parent') return { mode: 'parent' };
    return null;
  } catch {
    return null;
  }
};

export const ViewingModeProvider = ({ children }: { children: React.ReactNode }) => {
  const [viewingMode, setViewingMode] = useState<ViewingMode>(() => {
    const fromStorage = safeParse(sessionStorage.getItem(STORAGE_KEY));
    return fromStorage ?? { mode: 'parent' };
  });

  useEffect(() => {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(viewingMode));
  }, [viewingMode]);

  const value = useMemo<ViewingModeContextValue>(
    () => ({
      viewingMode,
      setParentMode: () => setViewingMode({ mode: 'parent' }),
      setChildMode: (childId: string) => setViewingMode({ mode: 'child', childId }),
    }),
    [viewingMode]
  );

  return <ViewingModeContext.Provider value={value}>{children}</ViewingModeContext.Provider>;
};

export const useViewingMode = () => {
  const ctx = useContext(ViewingModeContext);
  if (!ctx) throw new Error('useViewingMode must be used within a ViewingModeProvider');
  return ctx;
};
