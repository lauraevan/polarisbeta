
create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  sender_username text not null,
  sender_avatar_emoji text,
  sender_avatar_url text,
  sender_accent_color text,
  content text,
  attachments jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists dm_pair_idx on public.direct_messages (
  least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at desc
);

grant select, insert, delete on public.direct_messages to authenticated;
grant all on public.direct_messages to service_role;

alter table public.direct_messages enable row level security;

create policy "dm read participants" on public.direct_messages
  for select to authenticated
  using (auth.uid() = sender_id or auth.uid() = recipient_id);

create policy "dm insert as sender" on public.direct_messages
  for insert to authenticated
  with check (auth.uid() = sender_id);

create policy "dm delete own" on public.direct_messages
  for delete to authenticated
  using (auth.uid() = sender_id);

alter publication supabase_realtime add table public.direct_messages;
