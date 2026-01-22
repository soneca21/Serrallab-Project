-- Enforce tenant isolation for client/team users with helper functions and triggers.

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

create or replace function public.effective_user_id()
returns uuid
language plpgsql
stable
security definer
set search_path = public, auth, pg_catalog
set row_security = off
as $$
declare
  primary_id uuid;
begin
  if auth.uid() is null then
    return null;
  end if;
  select su.primary_user_id
    into primary_id
  from public.secondary_users su
  where su.user_id = auth.uid();

  if primary_id is not null then
    return primary_id;
  end if;
  return auth.uid();
end;
$$;

create or replace function public.set_effective_user_id()
returns trigger
language plpgsql
security definer
set search_path = public, auth, pg_catalog
set row_security = off
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if new.user_id is null or new.user_id = auth.uid() then
    new.user_id = public.effective_user_id();
  end if;
  return new;
end;
$$;

-- Attach trigger to tables with user_id to ensure secondary writes go to primary user.
do $$
declare
  tables text[] := array[
    'clients',
    'leads',
    'orders',
    'message_outbox',
    'message_automation_log',
    'message_retry_rules',
    'message_schedules',
    'message_schedule_runs',
    'notifications',
    'user_materials',
    'user_suppliers',
    'outbound_webhooks',
    'pipeline_config',
    'pipeline_history',
    'lead_auto_reply_log',
    'push_tokens',
    'usage_counters',
    'user_connections',
    'sender_channels',
    'sms_outbox',
    'whatsapp_outbox',
    'email_outbox',
    'orcamento_pdfs',
    'rate_limits'
  ];
  tbl text;
  trig_name text;
begin
  foreach tbl in array tables loop
    trig_name := format('%s_set_effective_user_id', tbl);
    if not exists (
      select 1
      from pg_trigger t
      join pg_class c on c.oid = t.tgrelid
      join pg_namespace n on n.oid = c.relnamespace
      where n.nspname = 'public'
        and c.relname = tbl
        and t.tgname = trig_name
    ) then
      execute format(
        'create trigger %I before insert or update on public.%I for each row execute function public.set_effective_user_id()',
        trig_name,
        tbl
      );
    end if;
  end loop;
end $$;

-- Helper macro-like section for RLS policies.
do $$
declare
  tables text[] := array[
    'clients',
    'leads',
    'orders',
    'message_outbox',
    'message_automation_log',
    'message_retry_rules',
    'message_schedules',
    'message_schedule_runs',
    'notifications',
    'user_materials',
    'user_suppliers',
    'outbound_webhooks',
    'pipeline_config',
    'pipeline_history',
    'lead_auto_reply_log',
    'push_tokens',
    'usage_counters',
    'user_connections',
    'sender_channels',
    'sms_outbox',
    'whatsapp_outbox',
    'email_outbox',
    'orcamento_pdfs',
    'rate_limits'
  ];
  tbl text;
  policy_prefix text;
begin
  foreach tbl in array tables loop
    execute format('alter table public.%I enable row level security', tbl);

    policy_prefix := tbl || '_access';

    execute format('drop policy if exists %I_select on public.%I', policy_prefix, tbl);
    execute format(
      'create policy %I_select on public.%I for select using (public.is_system_admin() or user_id = public.effective_user_id())',
      policy_prefix, tbl
    );

    execute format('drop policy if exists %I_insert on public.%I', policy_prefix, tbl);
    execute format(
      'create policy %I_insert on public.%I for insert with check (public.is_system_admin() or user_id = public.effective_user_id())',
      policy_prefix, tbl
    );

    execute format('drop policy if exists %I_update on public.%I', policy_prefix, tbl);
    execute format(
      'create policy %I_update on public.%I for update using (public.is_system_admin() or user_id = public.effective_user_id()) with check (public.is_system_admin() or user_id = public.effective_user_id())',
      policy_prefix, tbl
    );

    execute format('drop policy if exists %I_delete on public.%I', policy_prefix, tbl);
    execute format(
      'create policy %I_delete on public.%I for delete using (public.is_system_admin() or user_id = public.effective_user_id())',
      policy_prefix, tbl
    );
  end loop;
end $$;
