CREATE OR REPLACE FUNCTION public.rigor_active_account() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND NOT disabled) $$;
REVOKE ALL ON FUNCTION public.rigor_active_account() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.rigor_active_account() TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
REVOKE ALL ON FUNCTION public.handle_rigor_signup() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.rigor_log_change() FROM PUBLIC, anon, authenticated;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['activity_logs','agent_conversations','ai_agents','automation_executions','automations','contact_messages','dak','integrations','notifications','profiles','subscriptions','user_roles','website_settings','website_settings_audit'] LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', t);
    EXECUTE format('REVOKE ALL ON public.%I FROM PUBLIC, anon, authenticated', t);
    EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
  END LOOP;
END $$;
GRANT SELECT ON public.activity_logs, public.agent_conversations, public.automation_executions, public.contact_messages, public.integrations, public.subscriptions, public.user_roles, public.website_settings_audit TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_agents, public.automations TO authenticated;
GRANT SELECT ON public.profiles, public.notifications TO authenticated;
GRANT UPDATE (full_name, avatar_url, preferences) ON public.profiles TO authenticated;
GRANT UPDATE (is_read) ON public.notifications TO authenticated;
GRANT SELECT ON public.website_settings TO anon, authenticated;
GRANT UPDATE (founder, location, website, email, phone, tagline) ON public.website_settings TO authenticated;

DROP POLICY IF EXISTS activity_read ON public.activity_logs;
CREATE POLICY activity_read ON public.activity_logs FOR SELECT TO authenticated USING (public.rigor_active_account() AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')));
DROP POLICY IF EXISTS conversations_read ON public.agent_conversations;
CREATE POLICY conversations_read ON public.agent_conversations FOR SELECT TO authenticated USING (public.rigor_active_account() AND user_id = auth.uid());
DROP POLICY IF EXISTS agents_own ON public.ai_agents;
CREATE POLICY agents_own ON public.ai_agents FOR ALL TO authenticated USING (public.rigor_active_account() AND user_id = auth.uid()) WITH CHECK (public.rigor_active_account() AND user_id = auth.uid());
DROP POLICY IF EXISTS executions_read ON public.automation_executions;
CREATE POLICY executions_read ON public.automation_executions FOR SELECT TO authenticated USING (public.rigor_active_account() AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')));
DROP POLICY IF EXISTS automations_own ON public.automations;
CREATE POLICY automations_own ON public.automations FOR ALL TO authenticated USING (public.rigor_active_account() AND user_id = auth.uid()) WITH CHECK (public.rigor_active_account() AND user_id = auth.uid());
DROP POLICY IF EXISTS automations_admin_read ON public.automations;
CREATE POLICY automations_admin_read ON public.automations FOR SELECT TO authenticated USING (public.rigor_active_account() AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS contacts_admin ON public.contact_messages;
CREATE POLICY contacts_admin ON public.contact_messages FOR SELECT TO authenticated USING (public.rigor_active_account() AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS dak_private_default ON public.dak;
CREATE POLICY dak_private_default ON public.dak FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
DROP POLICY IF EXISTS integrations_read ON public.integrations;
CREATE POLICY integrations_read ON public.integrations FOR SELECT TO authenticated USING (public.rigor_active_account() AND user_id = auth.uid());
DROP POLICY IF EXISTS notifications_read ON public.notifications;
CREATE POLICY notifications_read ON public.notifications FOR SELECT TO authenticated USING (public.rigor_active_account() AND user_id = auth.uid());
DROP POLICY IF EXISTS notifications_update ON public.notifications;
CREATE POLICY notifications_update ON public.notifications FOR UPDATE TO authenticated USING (public.rigor_active_account() AND user_id = auth.uid()) WITH CHECK (public.rigor_active_account() AND user_id = auth.uid());
DROP POLICY IF EXISTS profiles_read ON public.profiles;
CREATE POLICY profiles_read ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid() OR (public.rigor_active_account() AND public.has_role(auth.uid(), 'admin')));
DROP POLICY IF EXISTS profiles_update ON public.profiles;
CREATE POLICY profiles_update ON public.profiles FOR UPDATE TO authenticated USING (id = auth.uid() AND NOT disabled) WITH CHECK (id = auth.uid() AND NOT disabled);
DROP POLICY IF EXISTS subscriptions_read ON public.subscriptions;
CREATE POLICY subscriptions_read ON public.subscriptions FOR SELECT TO authenticated USING (public.rigor_active_account() AND (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin')));
DROP POLICY IF EXISTS own_roles ON public.user_roles;
CREATE POLICY own_roles ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
DROP POLICY IF EXISTS website_settings_public_read ON public.website_settings;
CREATE POLICY website_settings_public_read ON public.website_settings FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS website_settings_admin_update ON public.website_settings;
CREATE POLICY website_settings_admin_update ON public.website_settings FOR UPDATE TO authenticated USING (public.rigor_active_account() AND public.has_role(auth.uid(), 'admin')) WITH CHECK (public.rigor_active_account() AND public.has_role(auth.uid(), 'admin'));
DROP POLICY IF EXISTS website_settings_audit_admin_read ON public.website_settings_audit;
CREATE POLICY website_settings_audit_admin_read ON public.website_settings_audit FOR SELECT TO authenticated USING (public.rigor_active_account() AND public.has_role(auth.uid(), 'admin'));