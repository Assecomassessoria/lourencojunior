
-- Tabela de depoimentos
CREATE TABLE public.depoimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  texto TEXT NOT NULL,
  autor TEXT DEFAULT '',
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.depoimentos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view depoimentos" ON public.depoimentos FOR SELECT USING (true);
CREATE POLICY "Allow insert depoimentos" ON public.depoimentos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update depoimentos" ON public.depoimentos FOR UPDATE USING (true);
CREATE POLICY "Allow delete depoimentos" ON public.depoimentos FOR DELETE USING (true);

-- Tabela de configurações do site (textos e links)
CREATE TABLE public.site_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chave TEXT NOT NULL UNIQUE,
  valor TEXT NOT NULL DEFAULT '',
  tipo TEXT NOT NULL DEFAULT 'texto',
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.site_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view site_config" ON public.site_config FOR SELECT USING (true);
CREATE POLICY "Allow insert site_config" ON public.site_config FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow update site_config" ON public.site_config FOR UPDATE USING (true);
CREATE POLICY "Allow delete site_config" ON public.site_config FOR DELETE USING (true);

-- Inserir configurações padrão
INSERT INTO public.site_config (chave, valor, tipo) VALUES
  ('whatsapp', '5511999999999', 'link'),
  ('instagram', 'https://instagram.com/', 'link'),
  ('facebook', 'https://facebook.com/', 'link'),
  ('email', 'contato@exemplo.com', 'link'),
  ('sobre_titulo', 'Sobre Nós', 'texto'),
  ('sobre_texto', 'Texto sobre a empresa...', 'texto');
