-- Allow anyone (including unauthenticated users) to read invitations by code for validation
CREATE POLICY "Anyone can validate invitations by code"
ON public.student_invitations
FOR SELECT
TO anon, authenticated
USING (true);