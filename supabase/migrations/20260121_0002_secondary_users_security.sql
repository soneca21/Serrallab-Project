-- Add strong linkage between secondary users and auth.users plus basic RLS.

alter table public.secondary_users
  add column if not exists user_id uuid;

update public.secondary_users as su
set user_id = au.id
from auth.users as au
where su.user_id is null
  and lower(au.email) = lower(su.email);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'secondary_users_user_id_fkey'
      and conrelid = 'public.secondary_users'::regclass
  ) then
    alter table public.secondary_users
      add constraint secondary_users_user_id_fkey
      foreign key (user_id)
      references auth.users(id)
      on delete cascade;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'secondary_users_permission_level_check'
      and conrelid = 'public.secondary_users'::regclass
  ) then
    alter table public.secondary_users
      add constraint secondary_users_permission_level_check
      check (permission_level in ('owner', 'admin', 'editor', 'viewer'));
  end if;
end $$;

create index if not exists secondary_users_primary_user_id_idx
  on public.secondary_users (primary_user_id);

create index if not exists secondary_users_user_id_idx
  on public.secondary_users (user_id);

create unique index if not exists secondary_users_user_id_unique
  on public.secondary_users (user_id);

alter table public.secondary_users enable row level security;

drop policy if exists secondary_users_primary_read on public.secondary_users;
create policy secondary_users_primary_read
  on public.secondary_users
  for select
  using (primary_user_id = auth.uid());

drop policy if exists secondary_users_secondary_read on public.secondary_users;
create policy secondary_users_secondary_read
  on public.secondary_users
  for select
  using (user_id = auth.uid());

drop policy if exists secondary_users_primary_write on public.secondary_users;
create policy secondary_users_primary_write
  on public.secondary_users
  for insert
  with check (primary_user_id = auth.uid());

drop policy if exists secondary_users_primary_update on public.secondary_users;
create policy secondary_users_primary_update
  on public.secondary_users
  for update
  using (primary_user_id = auth.uid())
  with check (primary_user_id = auth.uid());

drop policy if exists secondary_users_primary_delete on public.secondary_users;
create policy secondary_users_primary_delete
  on public.secondary_users
  for delete
  using (primary_user_id = auth.uid());
