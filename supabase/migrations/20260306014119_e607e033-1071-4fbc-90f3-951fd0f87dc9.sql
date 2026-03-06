-- Create empreendimentos table
CREATE TABLE public.empreendimentos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  nome TEXT NOT NULL,
  descricao TEXT,
  detalhe TEXT,
  preco TEXT DEFAULT 'Sob Consulta',
  imagem_url TEXT,
  ativo BOOLEAN DEFAULT true,
  ordem INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.empreendimentos ENABLE ROW LEVEL SECURITY;

-- Public read
CREATE POLICY "Anyone can view empreendimentos"
ON public.empreendimentos FOR SELECT
USING (true);

-- Admin write policies (open for now since site uses password-based admin)
CREATE POLICY "Allow insert empreendimentos"
ON public.empreendimentos FOR INSERT
WITH CHECK (true);

CREATE POLICY "Allow update empreendimentos"
ON public.empreendimentos FOR UPDATE
USING (true);

CREATE POLICY "Allow delete empreendimentos"
ON public.empreendimentos FOR DELETE
USING (true);

-- Create storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('empreendimentos', 'empreendimentos', true);

-- Storage policies
CREATE POLICY "Anyone can view empreendimento images"
ON storage.objects FOR SELECT
USING (bucket_id = 'empreendimentos');

CREATE POLICY "Anyone can upload empreendimento images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'empreendimentos');

CREATE POLICY "Anyone can update empreendimento images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'empreendimentos');

CREATE POLICY "Anyone can delete empreendimento images"
ON storage.objects FOR DELETE
USING (bucket_id = 'empreendimentos');

-- Timestamp trigger
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_empreendimentos_updated_at
BEFORE UPDATE ON public.empreendimentos
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();