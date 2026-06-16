
-- 1) Depoimentos: remove anonymous write/old duplicate read policies
DROP POLICY IF EXISTS "Allow delete depoimentos" ON public.depoimentos;
DROP POLICY IF EXISTS "Allow insert depoimentos" ON public.depoimentos;
DROP POLICY IF EXISTS "Allow update depoimentos" ON public.depoimentos;
DROP POLICY IF EXISTS "Escrita apenas para autenticados depoimentos" ON public.depoimentos;
DROP POLICY IF EXISTS "Anyone can view depoimentos" ON public.depoimentos;
DROP POLICY IF EXISTS "Public select" ON public.depoimentos;

-- 2) clientes_elite: restrict full access to admins only
DROP POLICY IF EXISTS "Controle total para corretores autenticados" ON public.clientes_elite;
CREATE POLICY "Admins full access clientes_elite" ON public.clientes_elite
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3) Storage: remove permissive anonymous write/listing policies. Direct CDN
--    URLs for public buckets still work without SELECT policy on storage.objects.
DROP POLICY IF EXISTS "Anyone can delete empreendimento images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can update empreendimento images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload empreendimento images" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view empreendimento images" ON storage.objects;
DROP POLICY IF EXISTS "emp_public_read" ON storage.objects;
DROP POLICY IF EXISTS "luiza-docs insert" ON storage.objects;
DROP POLICY IF EXISTS "luiza-docs update" ON storage.objects;
DROP POLICY IF EXISTS "luiza-docs delete" ON storage.objects;
DROP POLICY IF EXISTS "luiza-docs read" ON storage.objects;
DROP POLICY IF EXISTS "luiza_public_read" ON storage.objects;

CREATE POLICY "emp_admin_list" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'empreendimentos' AND public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "luiza_admin_list" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'luiza-docs' AND public.has_role(auth.uid(), 'admin'::public.app_role));

-- 4) Lock down pgmq wrapper functions (called only by edge functions via service role)
REVOKE EXECUTE ON FUNCTION public.enqueue_email(text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.delete_email(text, bigint) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.read_email_batch(text, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.move_to_dlq(text, text, bigint, jsonb) FROM PUBLIC, anon, authenticated;

-- 5) Remove empreendimento_fotos from Realtime publication (no realtime feature needed)
ALTER PUBLICATION supabase_realtime DROP TABLE public.empreendimento_fotos;

-- 6) Rate-limit table used by public edge functions (chat-luiza, send-transactional-email)
CREATE TABLE IF NOT EXISTS public.rate_limits (
  key text NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (key, window_start)
);
GRANT ALL ON public.rate_limits TO service_role;
ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;
-- No policies => no access for anon/authenticated; only service_role (bypasses RLS) can use it.
