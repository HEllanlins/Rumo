-- Rode DEPOIS do schema.sql (SQL Editor -> New query -> Run)
alter table profiles add column if not exists nome text;
alter table projects add column if not exists status text not null default 'planejamento';
alter table projects add column if not exists prazo date;
alter table projects add column if not exists prioridade text not null default 'média';
alter table projects add column if not exists cliente text;
alter table projects add column if not exists tags text[] not null default '{}';
alter table projects add column if not exists updated_at timestamptz default now();

create table if not exists user_settings (user_id uuid primary key default auth.uid() references auth.users on delete cascade, theme jsonb not null default '{}');
alter table user_settings enable row level security;
create policy "meu tema" on user_settings for all using (user_id=auth.uid()) with check (user_id=auth.uid());

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id,email,nome,role,plan_id,status) values (new.id,new.email,
    coalesce(new.raw_user_meta_data->>'name',new.raw_user_meta_data->>'full_name'),
    case when lower(new.email)='hellan.lins@gmail.com' then 'admin' else 'user' end,
    nullif(new.raw_user_meta_data->>'plan',''), 'pendente');
  return new;
end $$;

create or replace function touch_project() returns trigger language plpgsql as $$ begin new.updated_at=now(); return new; end $$;
drop trigger if exists projects_touch on projects;
create trigger projects_touch before update on projects for each row execute function touch_project();

create table if not exists audit_log (id bigserial primary key, admin_id uuid default auth.uid(), acao text, alvo text, created_at timestamptz default now());
alter table audit_log enable row level security;
create policy "admin lê log" on audit_log for select using (is_admin());
create policy "admin grava log" on audit_log for insert with check (is_admin());
