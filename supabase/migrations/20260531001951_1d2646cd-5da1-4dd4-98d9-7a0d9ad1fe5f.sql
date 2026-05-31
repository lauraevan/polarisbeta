
INSERT INTO storage.buckets (id, name, public) VALUES ('chat', 'chat', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "chat public read"
ON storage.objects FOR SELECT
USING (bucket_id = 'chat');

CREATE POLICY "chat auth upload own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'chat' AND (storage.foldername(name))[1] = auth.uid()::text);

CREATE POLICY "chat auth delete own"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'chat' AND (storage.foldername(name))[1] = auth.uid()::text);
