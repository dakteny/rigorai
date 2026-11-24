CREATE SCHEMA IF NOT EXISTS rigor_private;
REVOKE ALL ON SCHEMA rigor_private FROM PUBLIC, anon;
GRANT USAGE ON SCHEMA rigor_private TO authenticated, service_role;
ALTER FUNCTION public.rigor_active_account() SET SCHEMA rigor_private;
REVOKE ALL ON FUNCTION rigor_private.rigor_active_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION rigor_private.rigor_active_account() TO authenticated, service_role;