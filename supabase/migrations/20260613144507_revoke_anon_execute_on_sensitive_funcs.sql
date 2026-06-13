-- SECURITY: lock down SECURITY DEFINER helpers that accept an arbitrary uuid/email
-- so an anonymous caller cannot probe roles or trigger writes for other users.
-- Revoke EXECUTE from BOTH anon AND public (anon would otherwise inherit it via
-- PUBLIC); authenticated + service_role keep explicit grants.
--
-- NOTE: already applied to the live project on 2026-06-13 via Supabase MCP
-- (migration version 20260613144507). This file exists for repo/local parity and
-- carries the same version, so `supabase db push` treats it as already applied and
-- does NOT re-run it. It is additionally written to be idempotent and guarded:
-- re-running (e.g. on `db reset` or a fresh project) is a harmless no-op that
-- leaves the grants in the identical end state, and is skipped entirely for any
-- function that does not exist.

DO $$
DECLARE
  fn text;
  fns text[] := ARRAY[
    'public.get_user_role(uuid)',
    'public.get_school_staff_role(uuid, text)',
    'public.update_user_streak(uuid)',
    'public.update_student_monitoring_snapshot(uuid)',
    'public.initialize_user_quests(uuid)'
  ];
BEGIN
  FOREACH fn IN ARRAY fns LOOP
    IF to_regprocedure(fn) IS NOT NULL THEN
      EXECUTE format('REVOKE EXECUTE ON FUNCTION %s FROM anon, public;', fn);
      EXECUTE format('GRANT EXECUTE ON FUNCTION %s TO authenticated, service_role;', fn);
    END IF;
  END LOOP;
END $$;
