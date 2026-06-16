
-- Replace permissive WITH CHECK (true) with input-length validation on public lead forms
DROP POLICY IF EXISTS "Anyone can insert lead" ON public.luiza_leads;
CREATE POLICY "Public can submit lead" ON public.luiza_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(nome) BETWEEN 1 AND 120
    AND length(email) BETWEEN 3 AND 254
    AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(whatsapp) BETWEEN 5 AND 30
  );

DROP POLICY IF EXISTS "Anyone can insert lead" ON public.leads_empreendimento;
CREATE POLICY "Public can submit lead" ON public.leads_empreendimento
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    length(nome) BETWEEN 1 AND 100
    AND length(email) BETWEEN 3 AND 100
    AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(whatsapp) BETWEEN 5 AND 20
    AND length(empreendimento) BETWEEN 1 AND 150
  );

DROP POLICY IF EXISTS "Permitir capturar leads do site" ON public.clientes_elite;
CREATE POLICY "Public can submit lead" ON public.clientes_elite
  FOR INSERT TO anon
  WITH CHECK (
    length(nome) BETWEEN 1 AND 120
    AND length(email) BETWEEN 3 AND 254
    AND email ~ '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND length(whatsapp) BETWEEN 5 AND 30
  );

-- handle_new_user is a trigger function; not for direct API calls
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
