/*
# Fix profile role self-escalation policy

Migration 3 (20261015044934) dropped and recreated profiles_update_own_details
WITHOUT the clause that prevents users from changing their own role column.
The column-level GRANT UPDATE (full_name, phone) already blocks the column in
practice, but the policy itself must be correct as a defense-in-depth measure.

This migration restores the WITH CHECK constraint so that the role column
cannot change even if column grants are loosened in the future.
*/

DROP POLICY IF EXISTS "profiles_update_own_details" ON public.profiles;

CREATE POLICY "profiles_update_own_details" ON public.profiles
  FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (
    auth.uid() = user_id
    AND role = (SELECT p.role FROM public.profiles p WHERE p.user_id = auth.uid())
  );
