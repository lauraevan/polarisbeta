drop policy if exists "Polaris Cloud read own" on storage.objects;
create policy "Polaris Cloud read own"
on storage.objects for select to authenticated
using (bucket_id = 'polaris-cloud' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Polaris Cloud insert own" on storage.objects;
create policy "Polaris Cloud insert own"
on storage.objects for insert to authenticated
with check (bucket_id = 'polaris-cloud' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Polaris Cloud update own" on storage.objects;
create policy "Polaris Cloud update own"
on storage.objects for update to authenticated
using (bucket_id = 'polaris-cloud' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "Polaris Cloud delete own" on storage.objects;
create policy "Polaris Cloud delete own"
on storage.objects for delete to authenticated
using (bucket_id = 'polaris-cloud' and (storage.foldername(name))[1] = auth.uid()::text);