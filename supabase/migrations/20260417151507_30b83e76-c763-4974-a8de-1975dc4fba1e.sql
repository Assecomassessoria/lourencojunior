
-- Bucket for Luiza training documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('luiza-docs', 'luiza-docs', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies (public bucket; allow public CRUD as the admin panel is password-protected client-side)
CREATE POLICY "luiza-docs read"
ON storage.objects FOR SELECT
USING (bucket_id = 'luiza-docs');

CREATE POLICY "luiza-docs insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'luiza-docs');

CREATE POLICY "luiza-docs update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'luiza-docs');

CREATE POLICY "luiza-docs delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'luiza-docs');

-- Table for storing extracted PDF content
CREATE TABLE public.luiza_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  arquivo_url TEXT NOT NULL,
  arquivo_path TEXT NOT NULL,
  conteudo TEXT NOT NULL DEFAULT '',
  paginas INTEGER DEFAULT 0,
  ativo BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.luiza_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone read luiza_documents"
ON public.luiza_documents FOR SELECT USING (true);

CREATE POLICY "anyone insert luiza_documents"
ON public.luiza_documents FOR INSERT WITH CHECK (true);

CREATE POLICY "anyone update luiza_documents"
ON public.luiza_documents FOR UPDATE USING (true);

CREATE POLICY "anyone delete luiza_documents"
ON public.luiza_documents FOR DELETE USING (true);
