-- Execute no SQL Editor do Supabase (Dashboard → SQL)
-- Seguro para correr mais do que uma vez (políticas com DROP IF EXISTS).

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

-- Diário escrito (10 etapas): um registo por dispositivo (protótipo sem auth)
CREATE TABLE IF NOT EXISTS public.diario_jornal (
  device_id TEXT PRIMARY KEY,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE public.imagens_manifestacao ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.progresso_diario ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.diario_jornal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "imagens_select_anon" ON public.imagens_manifestacao;
CREATE POLICY "imagens_select_anon" ON public.imagens_manifestacao
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "imagens_insert_anon" ON public.imagens_manifestacao;
CREATE POLICY "imagens_insert_anon" ON public.imagens_manifestacao
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "imagens_delete_anon" ON public.imagens_manifestacao;
CREATE POLICY "imagens_delete_anon" ON public.imagens_manifestacao
  FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "progresso_select_anon" ON public.progresso_diario;
CREATE POLICY "progresso_select_anon" ON public.progresso_diario
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "progresso_insert_anon" ON public.progresso_diario;
CREATE POLICY "progresso_insert_anon" ON public.progresso_diario
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "progresso_delete_anon" ON public.progresso_diario;
CREATE POLICY "progresso_delete_anon" ON public.progresso_diario
  FOR DELETE TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "diario_select_anon" ON public.diario_jornal;
CREATE POLICY "diario_select_anon" ON public.diario_jornal
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "diario_insert_anon" ON public.diario_jornal;
CREATE POLICY "diario_insert_anon" ON public.diario_jornal
  FOR INSERT TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "diario_update_anon" ON public.diario_jornal;
CREATE POLICY "diario_update_anon" ON public.diario_jornal
  FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "diario_delete_anon" ON public.diario_jornal;
CREATE POLICY "diario_delete_anon" ON public.diario_jornal
  FOR DELETE TO anon, authenticated USING (true);

-- Bucket Vision Board (imagens)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vision_board', 'vision_board', true)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

DROP POLICY IF EXISTS "vision_board_select_anon" ON storage.objects;
CREATE POLICY "vision_board_select_anon" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'vision_board');

DROP POLICY IF EXISTS "vision_board_insert_anon" ON storage.objects;
CREATE POLICY "vision_board_insert_anon" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'vision_board');

DROP POLICY IF EXISTS "vision_board_update_anon" ON storage.objects;
CREATE POLICY "vision_board_update_anon" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'vision_board');

DROP POLICY IF EXISTS "vision_board_delete_anon" ON storage.objects;
CREATE POLICY "vision_board_delete_anon" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'vision_board');
