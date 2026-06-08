
-- =========================================================
-- 1. ROLES INFRASTRUCTURE
-- =========================================================
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see their own roles" ON public.user_roles;
CREATE POLICY "Users see their own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- =========================================================
-- 2. PROFILES (basic, for future use / current session)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own profile" ON public.profiles;
CREATE POLICY "own profile" ON public.profiles FOR SELECT TO authenticated USING (id = auth.uid());

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, email) VALUES (NEW.id, NEW.email)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =========================================================
-- 3. RESET POLICIES ON ALL TABLES
-- =========================================================

-- ---- depoimentos ----
DROP POLICY IF EXISTS "Public read active depoimentos" ON public.depoimentos;
DROP POLICY IF EXISTS "Public read depoimentos" ON public.depoimentos;
DROP POLICY IF EXISTS "Anyone can read depoimentos" ON public.depoimentos;
DROP POLICY IF EXISTS "Anyone can insert depoimentos" ON public.depoimentos;
DROP POLICY IF EXISTS "Anyone can update depoimentos" ON public.depoimentos;
DROP POLICY IF EXISTS "Anyone can delete depoimentos" ON public.depoimentos;
DROP POLICY IF EXISTS "depoimentos_select" ON public.depoimentos;
DROP POLICY IF EXISTS "depoimentos_insert" ON public.depoimentos;
DROP POLICY IF EXISTS "depoimentos_update" ON public.depoimentos;
DROP POLICY IF EXISTS "depoimentos_delete" ON public.depoimentos;
DROP POLICY IF EXISTS "Public select" ON public.depoimentos;
DROP POLICY IF EXISTS "Admins write" ON public.depoimentos;

REVOKE ALL ON public.depoimentos FROM anon, authenticated;
GRANT SELECT ON public.depoimentos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.depoimentos TO authenticated;
GRANT ALL ON public.depoimentos TO service_role;

CREATE POLICY "Public select" ON public.depoimentos FOR SELECT USING (true);
CREATE POLICY "Admins insert" ON public.depoimentos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update" ON public.depoimentos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete" ON public.depoimentos FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ---- empreendimentos ----
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='empreendimentos' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.empreendimentos', p.policyname);
  END LOOP;
END $$;

REVOKE ALL ON public.empreendimentos FROM anon, authenticated;
GRANT SELECT ON public.empreendimentos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.empreendimentos TO authenticated;
GRANT ALL ON public.empreendimentos TO service_role;

CREATE POLICY "Public select" ON public.empreendimentos FOR SELECT USING (true);
CREATE POLICY "Admins insert" ON public.empreendimentos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update" ON public.empreendimentos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete" ON public.empreendimentos FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ---- empreendimento_fotos ----
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='empreendimento_fotos' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.empreendimento_fotos', p.policyname);
  END LOOP;
END $$;

REVOKE ALL ON public.empreendimento_fotos FROM anon, authenticated;
GRANT SELECT ON public.empreendimento_fotos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.empreendimento_fotos TO authenticated;
GRANT ALL ON public.empreendimento_fotos TO service_role;

CREATE POLICY "Public select" ON public.empreendimento_fotos FOR SELECT USING (true);
CREATE POLICY "Admins insert" ON public.empreendimento_fotos FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update" ON public.empreendimento_fotos FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete" ON public.empreendimento_fotos FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ---- site_config ----
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='site_config' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.site_config', p.policyname);
  END LOOP;
END $$;

REVOKE ALL ON public.site_config FROM anon, authenticated;
GRANT SELECT ON public.site_config TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_config TO authenticated;
GRANT ALL ON public.site_config TO service_role;

CREATE POLICY "Public select" ON public.site_config FOR SELECT USING (true);
CREATE POLICY "Admins insert" ON public.site_config FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update" ON public.site_config FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete" ON public.site_config FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ---- luiza_documents (private to admin; chat-luiza uses service role) ----
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='luiza_documents' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.luiza_documents', p.policyname);
  END LOOP;
END $$;

REVOKE ALL ON public.luiza_documents FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.luiza_documents TO authenticated;
GRANT ALL ON public.luiza_documents TO service_role;

CREATE POLICY "Admins all" ON public.luiza_documents FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ---- luiza_kb (admin manages instructions; chat-luiza reads via service role) ----
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='luiza_kb' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.luiza_kb', p.policyname);
  END LOOP;
END $$;

REVOKE ALL ON public.luiza_kb FROM anon, authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.luiza_kb TO authenticated;
GRANT ALL ON public.luiza_kb TO service_role;

CREATE POLICY "Admins all" ON public.luiza_kb FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- ---- luiza_leads ----
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='luiza_leads' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.luiza_leads', p.policyname);
  END LOOP;
END $$;

REVOKE ALL ON public.luiza_leads FROM anon, authenticated;
GRANT INSERT ON public.luiza_leads TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.luiza_leads TO authenticated;
GRANT ALL ON public.luiza_leads TO service_role;

CREATE POLICY "Anyone can insert lead" ON public.luiza_leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read leads" ON public.luiza_leads FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update leads" ON public.luiza_leads FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete leads" ON public.luiza_leads FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- ---- leads_empreendimento (enable RLS + lock) ----
ALTER TABLE public.leads_empreendimento ENABLE ROW LEVEL SECURITY;
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies WHERE schemaname='public' AND tablename='leads_empreendimento' LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON public.leads_empreendimento', p.policyname);
  END LOOP;
END $$;

REVOKE ALL ON public.leads_empreendimento FROM anon, authenticated;
GRANT INSERT ON public.leads_empreendimento TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.leads_empreendimento TO authenticated;
GRANT ALL ON public.leads_empreendimento TO service_role;

CREATE POLICY "Anyone can insert lead" ON public.leads_empreendimento FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read leads" ON public.leads_empreendimento FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins update leads" ON public.leads_empreendimento FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "Admins delete leads" ON public.leads_empreendimento FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- 4. Fix linter: search_path on existing functions + lock queue functions
-- =========================================================
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public;
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.delete_email(text, bigint) TO service_role;
GRANT EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) TO service_role;

-- =========================================================
-- 5. Storage policies — admin only for writes
-- =========================================================
DO $$
DECLARE p record;
BEGIN
  FOR p IN SELECT policyname FROM pg_policies
           WHERE schemaname='storage' AND tablename='objects'
             AND policyname IN (
               'empreendimentos_public_all','empreendimentos_anon_all',
               'luiza_docs_public_all','luiza_docs_anon_all',
               'Public access empreendimentos','Public access luiza-docs',
               'Anyone upload empreendimentos','Anyone upload luiza-docs',
               'Anyone delete empreendimentos','Anyone delete luiza-docs',
               'Anyone update empreendimentos','Anyone update luiza-docs',
               'empreendimentos public read','empreendimentos public write',
               'luiza-docs public read','luiza-docs public write',
               'Empreendimentos read','Empreendimentos write',
               'Luiza-docs read','Luiza-docs write',
               'emp_public_read','emp_admin_write','emp_admin_update','emp_admin_delete',
               'luiza_public_read','luiza_admin_write','luiza_admin_update','luiza_admin_delete'
             )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', p.policyname);
  END LOOP;
END $$;

-- empreendimentos bucket: public read, admin write
CREATE POLICY "emp_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'empreendimentos');
CREATE POLICY "emp_admin_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'empreendimentos' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "emp_admin_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'empreendimentos' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "emp_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'empreendimentos' AND public.has_role(auth.uid(),'admin'));

-- luiza-docs bucket: public read (PDFs referenced by URL), admin write
CREATE POLICY "luiza_public_read" ON storage.objects FOR SELECT
  USING (bucket_id = 'luiza-docs');
CREATE POLICY "luiza_admin_write" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'luiza-docs' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "luiza_admin_update" ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'luiza-docs' AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "luiza_admin_delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'luiza-docs' AND public.has_role(auth.uid(),'admin'));
