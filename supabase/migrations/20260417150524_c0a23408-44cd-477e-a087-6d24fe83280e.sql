
CREATE TABLE IF NOT EXISTS public.luiza_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  email text NOT NULL,
  whatsapp text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.luiza_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone insert leads" ON public.luiza_leads FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone read leads" ON public.luiza_leads FOR SELECT USING (true);
CREATE POLICY "anyone delete leads" ON public.luiza_leads FOR DELETE USING (true);

CREATE TABLE IF NOT EXISTS public.luiza_kb (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_instructions text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.luiza_kb ENABLE ROW LEVEL SECURITY;

CREATE POLICY "anyone read kb" ON public.luiza_kb FOR SELECT USING (true);
CREATE POLICY "anyone insert kb" ON public.luiza_kb FOR INSERT WITH CHECK (true);
CREATE POLICY "anyone update kb" ON public.luiza_kb FOR UPDATE USING (true);

INSERT INTO public.luiza_kb (custom_instructions) VALUES ('') ON CONFLICT DO NOTHING;
