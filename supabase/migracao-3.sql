-- Rode DEPOIS da migracao-2.sql
alter table projects add column if not exists url text;
alter table projects add column if not exists capa text;
alter table projects add column if not exists gh jsonb;
alter table projects add column if not exists gh_sync timestamptz;

create table if not exists atividades (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade,
 project_id uuid references projects on delete cascade, tipo text, texto text not null, lida boolean not null default false, created_at timestamptz default now());
create index if not exists atividades_user_idx on atividades(user_id, created_at desc);
alter table atividades enable row level security;
create policy "minhas atividades" on atividades for all using (user_id=auth.uid()) with check (user_id=auth.uid());

-- sincronizar com o GitHub não deve mudar "atualizado em"
create or replace function touch_project() returns trigger language plpgsql as $$
begin
  if (to_jsonb(new)-'gh'-'gh_sync'-'updated_at') = (to_jsonb(old)-'gh'-'gh_sync'-'updated_at') then return new; end if;
  new.updated_at=now(); return new;
end $$;
