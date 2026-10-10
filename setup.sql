create table items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users(id) on delete cascade,
  list text not null default 'K-dramas',
  name text not null,
  rating text not null default 'Good',
  genre text default 'Other',
  status text not null default 'planned' check (status in ('watched','continuing','planned')),
  ep_watched int not null default 0,
  ep_total int not null default 1,
  favorite boolean not null default false,
  description text default '',
  created_at timestamptz not null default now()
);
alter table items enable row level security;
create policy "own items" on items for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

grant select, insert, update, delete on public.items to authenticated;
