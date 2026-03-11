-- Tighten public invitation read policy to only active, unused invites
DROP POLICY IF EXISTS "Anyone can validate invitations by code" ON public.student_invitations;
CREATE POLICY "Anyone can validate invitations by code"
ON public.student_invitations
FOR SELECT
TO anon, authenticated
USING (used = false AND expires_at > now());

-- Allow invited student to enroll themselves after authentication
DROP POLICY IF EXISTS "Students can accept invited school relationship" ON public.school_student_relationships;
CREATE POLICY "Students can accept invited school relationship"
ON public.school_student_relationships
FOR INSERT
TO authenticated
WITH CHECK (
  student_id = auth.uid()
  AND EXISTS (
    SELECT 1
    FROM public.student_invitations si
    WHERE si.school_id = school_student_relationships.school_id
      AND lower(si.email) = lower((auth.jwt() ->> 'email'::text))
      AND si.used = false
      AND si.expires_at > now()
  )
);

-- Allow invited student to mark their invitation as used
DROP POLICY IF EXISTS "Invited students can mark invitation as used" ON public.student_invitations;
CREATE POLICY "Invited students can mark invitation as used"
ON public.student_invitations
FOR UPDATE
TO authenticated
USING (
  lower(email) = lower((auth.jwt() ->> 'email'::text))
  AND used = false
  AND expires_at > now()
)
WITH CHECK (
  lower(email) = lower((auth.jwt() ->> 'email'::text))
  AND used = true
);