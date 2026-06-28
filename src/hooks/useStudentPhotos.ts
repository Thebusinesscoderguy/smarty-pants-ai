import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Resolves short-lived SIGNED URLs for private student photos. The bucket is
// private; only staff can mint signed URLs (enforced by storage RLS), so this
// returns nothing for parents/students. Batches one request per roster.
const BUCKET = 'student-photos';
const EXPIRES_SECONDS = 3600;

interface PhotoItem {
  student_id: string;
  student_photo_path: string | null;
}

export function useStudentPhotos(items: PhotoItem[]): Record<string, string> {
  const [urls, setUrls] = useState<Record<string, string>>({});

  // Stable dependency: only re-fetch when the set of (student, path) pairs changes.
  const key = items
    .filter((i) => i.student_photo_path)
    .map((i) => `${i.student_id}:${i.student_photo_path}`)
    .sort()
    .join('|');

  useEffect(() => {
    let active = true;
    const withPaths = items.filter(
      (i): i is { student_id: string; student_photo_path: string } => !!i.student_photo_path,
    );
    if (withPaths.length === 0) {
      setUrls({});
      return;
    }

    supabase.storage
      .from(BUCKET)
      .createSignedUrls(withPaths.map((i) => i.student_photo_path), EXPIRES_SECONDS)
      .then(({ data, error }) => {
        if (!active || error || !data) return;
        const map: Record<string, string> = {};
        data.forEach((res, idx) => {
          if (res.signedUrl) map[withPaths[idx].student_id] = res.signedUrl;
        });
        setUrls(map);
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  return urls;
}
