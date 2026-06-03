CREATE POLICY "wallpapers public read"
  ON storage.objects FOR SELECT TO public
  USING (bucket_id = 'wallpapers');

CREATE POLICY "wallpapers auth upload own folder"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'wallpapers' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "wallpapers auth delete own"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'wallpapers' AND auth.uid()::text = (storage.foldername(name))[1]);