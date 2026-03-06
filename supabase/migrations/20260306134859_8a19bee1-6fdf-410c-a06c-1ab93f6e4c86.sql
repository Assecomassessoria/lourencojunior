
CREATE TABLE public.empreendimento_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  empreendimento_id uuid REFERENCES public.empreendimentos(id) ON DELETE CASCADE NOT NULL,
  foto_url text NOT NULL,
  ordem integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.empreendimento_fotos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view fotos" ON public.empreendimento_fotos
  FOR SELECT USING (true);

CREATE POLICY "Allow insert fotos" ON public.empreendimento_fotos
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update fotos" ON public.empreendimento_fotos
  FOR UPDATE USING (true);

CREATE POLICY "Allow delete fotos" ON public.empreendimento_fotos
  FOR DELETE USING (true);

ALTER PUBLICATION supabase_realtime ADD TABLE public.empreendimento_fotos;
