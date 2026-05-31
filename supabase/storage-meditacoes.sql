-- Bucket público para MP3 de meditação
-- Execute no SQL Editor do Supabase (Dashboard → SQL)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'meditacoes',
  'meditacoes',
  true,
  52428800,
  ARRAY['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/webm']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Leitura pública (reproduzir no player)
DROP POLICY IF EXISTS "meditacoes_select_anon" ON storage.objects;
CREATE POLICY "meditacoes_select_anon" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'meditacoes');

-- Upload via script ou dashboard (protótipo — ajuste com auth em produção)
DROP POLICY IF EXISTS "meditacoes_insert_anon" ON storage.objects;
CREATE POLICY "meditacoes_insert_anon" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'meditacoes');

DROP POLICY IF EXISTS "meditacoes_update_anon" ON storage.objects;
CREATE POLICY "meditacoes_update_anon" ON storage.objects
  FOR UPDATE TO anon, authenticated
  USING (bucket_id = 'meditacoes');

DROP POLICY IF EXISTS "meditacoes_delete_anon" ON storage.objects;
CREATE POLICY "meditacoes_delete_anon" ON storage.objects
  FOR DELETE TO anon, authenticated
  USING (bucket_id = 'meditacoes');
