-- Allow authenticated users to create their own school account
CREATE POLICY "Users can create their own school account"
ON public.school_accounts
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = admin_user_id);

-- Allow school admins to update their own school
CREATE POLICY "School admins can update their school"
ON public.school_accounts
FOR UPDATE
TO authenticated
USING (auth.uid() = admin_user_id)
WITH CHECK (auth.uid() = admin_user_id);