create or replace function public.is_system_admin()
returns boolean
language plpgsql
stable
security definer
set search_path = public, auth, pg_catalog
set row_security = off
as $$
begin
  if auth.uid() is null then
    return false;
  end if;
  return exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'
  );
end;
$$;

create table if not exists public.ai_quote_agent_settings (
  id uuid primary key default gen_random_uuid(),
  enabled boolean not null default true,
  model text not null default 'gpt-4o-mini',
  temperature numeric not null default 0.6,
  max_tokens integer not null default 700,
  item_limit integer not null default 20,
  system_prompt text not null default 'Voce e um assistente para orcamentos. Gere um titulo curto, descricao clara e itens com material_id valido. Retorne apenas JSON valido.',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.ai_quote_agent_logs (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  user_id uuid,
  status text not null,
  model text,
  response_ms integer,
  prompt_tokens integer,
  completion_tokens integer,
  total_tokens integer,
  prompt_excerpt text,
  error_message text
);

alter table public.ai_quote_agent_settings enable row level security;
alter table public.ai_quote_agent_logs enable row level security;

drop policy if exists ai_quote_agent_settings_select on public.ai_quote_agent_settings;
create policy ai_quote_agent_settings_select on public.ai_quote_agent_settings
  for select using (public.is_system_admin());

drop policy if exists ai_quote_agent_settings_insert on public.ai_quote_agent_settings;
create policy ai_quote_agent_settings_insert on public.ai_quote_agent_settings
  for insert with check (public.is_system_admin());

drop policy if exists ai_quote_agent_settings_update on public.ai_quote_agent_settings;
create policy ai_quote_agent_settings_update on public.ai_quote_agent_settings
  for update using (public.is_system_admin()) with check (public.is_system_admin());

drop policy if exists ai_quote_agent_logs_select on public.ai_quote_agent_logs;
create policy ai_quote_agent_logs_select on public.ai_quote_agent_logs
  for select using (public.is_system_admin());

insert into public.ai_quote_agent_settings (
  id,
  enabled,
  model,
  temperature,
  max_tokens,
  item_limit,
  system_prompt
) values (
  '00000000-0000-0000-0000-000000000001',
  true,
  'gpt-4o-mini',
  0.6,
  700,
  20,
  'Voce e um assistente para orcamentos. Gere um titulo curto, descricao clara e itens com material_id valido. Retorne apenas JSON valido.'
) on conflict (id) do nothing;
