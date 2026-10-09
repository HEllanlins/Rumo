-- Rode DEPOIS da migracao-4.sql
alter table prompts add column if not exists favorito boolean not null default false;

create table if not exists pageviews (id bigserial primary key, path text not null, ref text, device text, sid text, created_at timestamptz default now());
create index if not exists pageviews_dia on pageviews(created_at);
alter table pageviews enable row level security;
create policy "qualquer um registra visita" on pageviews for insert with check (length(path) < 200);
create policy "admin lê visitas" on pageviews for select using (is_admin());

-- só números agregados: o admin não lê o conteúdo privado dos clientes
create or replace function admin_stats() returns json language plpgsql security definer set search_path=public stable as $$
begin
  if not is_admin() then raise exception 'acesso negado'; end if;
  return json_build_object('usuarios',(select count(*) from profiles),'ativos',(select count(*) from profiles where status='ativa'),
    'pendentes',(select count(*) from profiles where status='pendente'),'novos7d',(select count(*) from profiles where created_at > now() - interval '7 days'),
    'projetos',(select count(*) from projects),'prompts',(select count(*) from prompts));
end $$;
revoke execute on function admin_stats() from public, anon;
grant execute on function admin_stats() to authenticated;

-- auditoria no servidor (não depende do frontend)
create or replace function audit_profiles() returns trigger language plpgsql security definer set search_path=public as $$
begin
  if (new.role,new.status,new.plan_id,new.vencimento) is distinct from (old.role,old.status,old.plan_id,old.vencimento) then
    insert into audit_log(admin_id,acao,alvo) values (auth.uid(),'perfil alterado: '||coalesce(old.status,'-')||' → '||coalesce(new.status,'-')||', plano '||coalesce(new.plan_id,'-'),new.email);
  end if; return new;
end $$;
drop trigger if exists profiles_audit on profiles;
create trigger profiles_audit after update on profiles for each row execute function audit_profiles();

create or replace function audit_generic() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into audit_log(admin_id,acao,alvo) values (auth.uid(), tg_table_name||' '||lower(tg_op), coalesce(to_jsonb(new)->>'key', to_jsonb(new)->>'id', to_jsonb(old)->>'key', to_jsonb(old)->>'id'));
  return coalesce(new,old);
end $$;
drop trigger if exists plans_audit on plans; drop trigger if exists config_audit on site_config;
create trigger plans_audit after insert or update or delete on plans for each row execute function audit_generic();
create trigger config_audit after insert or update or delete on site_config for each row execute function audit_generic();
