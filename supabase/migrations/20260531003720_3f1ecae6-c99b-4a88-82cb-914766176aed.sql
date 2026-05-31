DROP POLICY IF EXISTS "chat public read" ON storage.objects;

CREATE POLICY "chat media can be viewed by path"
ON storage.objects
FOR SELECT
TO public
USING (
  bucket_id = 'chat'
  AND name IS NOT NULL
  AND length(name) > 0
);