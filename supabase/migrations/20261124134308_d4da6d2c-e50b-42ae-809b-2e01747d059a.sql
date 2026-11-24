CREATE TABLE public.website_settings (
  id text PRIMARY KEY DEFAULT 'primary' CHECK (id = 'primary'),
  founder text NOT NULL CHECK (char_length(founder) BETWEEN 1 AND 200),
  location text NOT NULL CHECK (char_length(location) BETWEEN 1 AND 200),
  website text NOT NULL CHECK (char_length(website) <= 300 AND website ~ '^https://'),
  email text NOT NULL CHECK (char_length(email) BETWEEN 3 AND 254),
  phone text NOT NULL CHECK (char_length(phone) BETWEEN 1 AND 60),
  tagline text NOT NULL CHECK (char_length(tagline) BETWEEN 1 AND 200),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.website_settings TO anon, authenticated;
GRANT UPDATE (founder, location, website, email, phone, tagline) ON public.website_settings TO authenticated;
GRANT ALL ON public.website_settings TO service_role;
ALTER TABLE public.website_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY website_settings_public_read ON public.website_settings FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY website_settings_admin_update ON public.website_settings FOR UPDATE TO authenticated
USING (public.has_role(auth.uid(), 'admin') AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND NOT p.disabled))
WITH CHECK (public.has_role(auth.uid(), 'admin') AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND NOT p.disabled));

CREATE TABLE public.website_settings_audit (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  actor_name text NOT NULL,
  actor_email text NOT NULL,
  changes jsonb NOT NULL CHECK (changes <> '{}'::jsonb),
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.website_settings_audit TO authenticated;
GRANT ALL ON public.website_settings_audit TO service_role;
ALTER TABLE public.website_settings_audit ENABLE ROW LEVEL SECURITY;
CREATE POLICY website_settings_audit_admin_read ON public.website_settings_audit FOR SELECT TO authenticated
USING (public.has_role(auth.uid(), 'admin') AND EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND NOT p.disabled));
CREATE INDEX website_settings_audit_created ON public.website_settings_audit (created_at DESC, id DESC);

CREATE FUNCTION public.rigor_stamp_website_settings() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND NOT p.disabled) THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  NEW.updated_at := now();
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.rigor_stamp_website_settings() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER website_settings_stamp BEFORE UPDATE ON public.website_settings FOR EACH ROW EXECUTE FUNCTION public.rigor_stamp_website_settings();

CREATE FUNCTION public.rigor_audit_website_settings() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  changed jsonb;
  admin_name text;
  admin_email text;
BEGIN
  IF auth.uid() IS NULL OR NOT public.has_role(auth.uid(), 'admin') OR NOT EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND NOT p.disabled) THEN
    RAISE EXCEPTION 'Administrator access required';
  END IF;
  SELECT coalesce(jsonb_object_agg(n.key, jsonb_build_object('before', o.value, 'after', n.value)), '{}'::jsonb)
  INTO changed
  FROM jsonb_each(to_jsonb(NEW) - ARRAY['id', 'created_at', 'updated_at']) n
  JOIN jsonb_each(to_jsonb(OLD) - ARRAY['id', 'created_at', 'updated_at']) o ON n.key = o.key
  WHERE n.value IS DISTINCT FROM o.value;
  IF changed <> '{}'::jsonb THEN
    SELECT p.full_name, p.email INTO admin_name, admin_email FROM public.profiles p WHERE p.id = auth.uid();
    INSERT INTO public.website_settings_audit (actor_id, actor_name, actor_email, changes)
    VALUES (auth.uid(), coalesce(nullif(admin_name, ''), 'Administrator'), coalesce(admin_email, ''), changed);
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.rigor_audit_website_settings() FROM PUBLIC, anon, authenticated;
CREATE TRIGGER website_settings_audit_write AFTER UPDATE ON public.website_settings FOR EACH ROW EXECUTE FUNCTION public.rigor_audit_website_settings();

INSERT INTO public.website_settings (id, founder, location, website, email, phone, tagline)
VALUES ('primary', 'Gatlena Banguot — Founder & AI Automation Specialist', 'Halifax, Nova Scotia, Canada', 'https://www.RigorEx.ca', 'hello@rigorex.ca', '+1 (902) 210-8363', 'Intelligent Automation. Real Results.');