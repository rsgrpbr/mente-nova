-- Execute no SQL Editor do Supabase (Dashboard → SQL)

-- Vision Board: metadados das imagens (ficheiros no bucket `vision_board`)
CREATE TABLE IF NOT EXISTS public.imagens_manifestacao (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url_imagem TEXT NOT NULL,
  titulo TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Progresso diário de meditação
CREATE TABLE IF NOT EXISTS public.progresso_diario (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  semana SMALLINT NOT NULL CHECK (semana BETWEEN 1 AND 4),
  pratica_concluida BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Storage: crie o bucket público `vision_board` no painel Storage
-- Políticas de exemplo (Storage → Policies):
--   INSERT/SELECT para role `anon` no bucket `vision_board`

-- Políticas permissivas para protótipo (ajuste com auth em produção):

ALTER TABLE public.imagens_manifestacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progresso_diario ENABLE ROW LEVEL SECURITY;

CREATE POLICY "imagens_select_anon" ON public.imagens_manifestacao
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "imagens_insert_anon" ON public.imagens_manifestacao
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "progresso_select_anon" ON public.progresso_diario
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "progresso_insert_anon" ON public.progresso_diario
  FOR INSERT TO anon, authenticated WITH CHECK (true);

-- Diário escrito (10 etapas): um registo por dispositivo (protótipo sem auth)
CREATE TABLE IF NOT EXISTS public.diario_jornal (
  device_id TEXT PRIMARY KEY,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.diario_jornal ENABLE ROW LEVEL SECURITY;

CREATE POLICY "diario_select_anon" ON public.diario_jornal
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "diario_insert_anon" ON public.diario_jornal
  FOR INSERT TO anon, authenticated WITH CHECK (true);

CREATE POLICY "diario_update_anon" ON public.diario_jornal
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

CREATE POLICY "diario_delete_anon" ON public.diario_jornal
  FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "progresso_delete_anon" ON public.progresso_diario
  FOR DELETE TO anon, authenticated USING (true);

CREATE POLICY "imagens_delete_anon" ON public.imagens_manifestacao
  FOR DELETE TO anon, authenticated USING (true);
