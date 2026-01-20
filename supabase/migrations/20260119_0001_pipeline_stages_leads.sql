-- Adds pipeline stages defaults and stage linkage for leads/orders

alter table public.leads
  add column if not exists pipeline_stage_id uuid;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'leads_pipeline_stage_id_fkey'
      and conrelid = 'public.leads'::regclass
  ) then
    alter table public.leads
      add constraint leads_pipeline_stage_id_fkey
      foreign key (pipeline_stage_id)
      references public.pipeline_stages(id)
      on delete set null;
  end if;
end $$;

create index if not exists leads_pipeline_stage_id_idx
  on public.leads (pipeline_stage_id);

-- Normalize legacy stages into the simplified flow
update public.pipeline_stages
set name = 'Em Producao'
where lower(name) in ('proposta aceita', 'producao');

update public.pipeline_stages
set name = 'Entregue'
where lower(name) = 'ganho';

-- Ensure the final pipeline flow only, with colors by stage order
with desired(name, color, "order") as (
  values
    ('Novo', 'blue', 1),
    ('Atendimento', 'yellow', 2),
    ('Enviado', 'purple', 3),
    ('Em Producao', 'orange', 4),
        ('Entregue', 'teal', 5),
        ('Perdido', 'red', 6)
)
update public.pipeline_stages as s
set name = d.name,
    color = d.color,
    "order" = d."order"
from desired as d
where lower(s.name) = lower(d.name);

with desired(name, color, "order") as (
  values
    ('Novo', 'blue', 1),
    ('Atendimento', 'yellow', 2),
    ('Enviado', 'purple', 3),
    ('Em Producao', 'orange', 4),
        ('Entregue', 'teal', 5),
        ('Perdido', 'red', 6)
)
insert into public.pipeline_stages (name, color, "order")
select d.name, d.color, d."order"
from desired as d
where not exists (
  select 1 from public.pipeline_stages as s
  where lower(s.name) = lower(d.name)
);

with desired(name, color, "order") as (
  values
    ('Novo', 'blue', 1),
    ('Atendimento', 'yellow', 2),
    ('Enviado', 'purple', 3),
    ('Em Producao', 'orange', 4),
        ('Entregue', 'teal', 5),
        ('Perdido', 'red', 6)
),
canonical as (
  select d.name, min(s.id::text)::uuid as id
  from public.pipeline_stages as s
  join desired as d on lower(s.name) = lower(d.name)
  group by d.name
)
update public.leads as l
set pipeline_stage_id = c.id
from public.pipeline_stages as s
join canonical as c on lower(s.name) = lower(c.name)
where l.pipeline_stage_id = s.id;

with desired(name, color, "order") as (
  values
    ('Novo', 'blue', 1),
    ('Atendimento', 'yellow', 2),
    ('Enviado', 'purple', 3),
    ('Em Producao', 'orange', 4),
        ('Entregue', 'teal', 5),
        ('Perdido', 'red', 6)
),
canonical as (
  select d.name, min(s.id::text)::uuid as id
  from public.pipeline_stages as s
  join desired as d on lower(s.name) = lower(d.name)
  group by d.name
)
update public.orders as o
set pipeline_stage_id = c.id
from public.pipeline_stages as s
join canonical as c on lower(s.name) = lower(c.name)
where o.pipeline_stage_id = s.id;

with desired(name, color, "order") as (
  values
    ('Novo', 'blue', 1),
    ('Atendimento', 'yellow', 2),
    ('Enviado', 'purple', 3),
    ('Em Producao', 'orange', 4),
        ('Entregue', 'teal', 5),
        ('Perdido', 'red', 6)
),
canonical as (
  select d.name, min(s.id::text)::uuid as id
  from public.pipeline_stages as s
  join desired as d on lower(s.name) = lower(d.name)
  group by d.name
),
desired_ids as (
  select id from canonical
)
update public.leads
set pipeline_stage_id = (select id from canonical where name = 'Novo' limit 1)
where pipeline_stage_id is null
  or pipeline_stage_id not in (select id from desired_ids);

with desired(name, color, "order") as (
  values
    ('Novo', 'blue', 1),
    ('Atendimento', 'yellow', 2),
    ('Enviado', 'purple', 3),
    ('Em Producao', 'orange', 4),
        ('Entregue', 'teal', 5),
        ('Perdido', 'red', 6)
),
canonical as (
  select d.name, min(s.id::text)::uuid as id
  from public.pipeline_stages as s
  join desired as d on lower(s.name) = lower(d.name)
  group by d.name
),
desired_ids as (
  select id from canonical
)
update public.orders
set pipeline_stage_id = (
  select id from canonical
  where name = (
    case
      when status = 'Enviado' then 'Enviado'
      when status = 'Aprovado' then 'Em Producao'
      when status = 'Rejeitado' then 'Perdido'
      when status ilike 'Conclu%' then 'Entregue'
      when status = 'Ganho' then 'Entregue'
      else 'Novo'
    end
  )
  limit 1
)
where pipeline_stage_id is null
  or pipeline_stage_id not in (select id from desired_ids);

with desired(name, color, "order") as (
  values
    ('Novo', 'blue', 1),
    ('Atendimento', 'yellow', 2),
    ('Enviado', 'purple', 3),
    ('Em Producao', 'orange', 4),
        ('Entregue', 'teal', 5),
        ('Perdido', 'red', 6)
),
canonical as (
  select d.name, min(s.id::text)::uuid as id
  from public.pipeline_stages as s
  join desired as d on lower(s.name) = lower(d.name)
  group by d.name
)
update public.pipeline_history as h
set from_stage_id = c.id
from public.pipeline_stages as s
join canonical as c on lower(s.name) = lower(c.name)
where h.from_stage_id = s.id;

with desired(name, color, "order") as (
  values
    ('Novo', 'blue', 1),
    ('Atendimento', 'yellow', 2),
    ('Enviado', 'purple', 3),
    ('Em Producao', 'orange', 4),
        ('Entregue', 'teal', 5),
        ('Perdido', 'red', 6)
),
canonical as (
  select d.name, min(s.id::text)::uuid as id
  from public.pipeline_stages as s
  join desired as d on lower(s.name) = lower(d.name)
  group by d.name
)
update public.pipeline_history as h
set to_stage_id = c.id
from public.pipeline_stages as s
join canonical as c on lower(s.name) = lower(c.name)
where h.to_stage_id = s.id;

with desired(name, color, "order") as (
  values
    ('Novo', 'blue', 1),
    ('Atendimento', 'yellow', 2),
    ('Enviado', 'purple', 3),
    ('Em Producao', 'orange', 4),
        ('Entregue', 'teal', 5),
        ('Perdido', 'red', 6)
),
canonical as (
  select d.name, min(s.id::text)::uuid as id
  from public.pipeline_stages as s
  join desired as d on lower(s.name) = lower(d.name)
  group by d.name
),
desired_ids as (
  select id from canonical
)
update public.pipeline_history
set from_stage_id = (select id from canonical where name = 'Novo' limit 1)
where from_stage_id is null
  or from_stage_id not in (select id from desired_ids);

with desired(name, color, "order") as (
  values
    ('Novo', 'blue', 1),
    ('Atendimento', 'yellow', 2),
    ('Enviado', 'purple', 3),
    ('Em Producao', 'orange', 4),
        ('Entregue', 'teal', 5),
        ('Perdido', 'red', 6)
),
canonical as (
  select d.name, min(s.id::text)::uuid as id
  from public.pipeline_stages as s
  join desired as d on lower(s.name) = lower(d.name)
  group by d.name
),
desired_ids as (
  select id from canonical
)
update public.pipeline_history
set to_stage_id = (select id from canonical where name = 'Novo' limit 1)
where to_stage_id is null
  or to_stage_id not in (select id from desired_ids);

with desired(name, color, "order") as (
  values
    ('Novo', 'blue', 1),
    ('Atendimento', 'yellow', 2),
    ('Enviado', 'purple', 3),
    ('Em Producao', 'orange', 4),
        ('Entregue', 'teal', 5),
        ('Perdido', 'red', 6)
),
canonical as (
  select d.name, min(s.id::text)::uuid as id
  from public.pipeline_stages as s
  join desired as d on lower(s.name) = lower(d.name)
  group by d.name
)
delete from public.pipeline_stages as s
using canonical as c
where lower(s.name) = lower(c.name)
  and s.id <> c.id;

with desired(name, color, "order") as (
  values
    ('Novo', 'blue', 1),
    ('Atendimento', 'yellow', 2),
    ('Enviado', 'purple', 3),
    ('Em Producao', 'orange', 4),
        ('Entregue', 'teal', 5),
        ('Perdido', 'red', 6)
)
delete from public.pipeline_stages as s
where lower(s.name) not in (select lower(name) from desired);





