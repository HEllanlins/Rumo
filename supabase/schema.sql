create table plans (id text primary key, nome text not null, preco numeric not null default 0, features text[] not null default '{}', ordem int default 0);
insert into plans values
('inicial','Inicial',0,'{projects,prompts}',1),
('medio','Médio',0,'{projects,prompts,progress}',2),
('master','Master',0,'{projects,prompts,progress,history,git}',3);

create table profiles (id uuid primary key references auth.users on delete cascade, email text, role text not null default 'user',
 plan_id text references plans(id), status text not null default 'pendente', vencimento date, created_at timestamptz default now());

create function is_admin() returns boolean language sql security definer set search_path=public stable as
$$ select exists(select 1 from profiles where id=auth.uid() and role='admin') $$;

create function handle_new_user() returns trigger language plpgsql security definer set search_path=public as $$
begin
  insert into profiles(id,email,role,plan_id,status) values (new.id,new.email,
    case when lower(new.email)='hellan.lins@gmail.com' then 'admin' else 'user' end,
    nullif(new.raw_user_meta_data->>'plan',''), 'pendente');
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create table projects (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade,
 nome text not null, descricao text, progresso int not null default 0, repo text, created_at timestamptz default now());
create table prompts (id uuid primary key default gen_random_uuid(), project_id uuid not null references projects on delete cascade,
 user_id uuid not null default auth.uid(), titulo text not null, texto text, status text not null default 'não lançado', created_at timestamptz default now());
create table eventos (id uuid primary key default gen_random_uuid(), project_id uuid not null references projects on delete cascade,
 user_id uuid not null default auth.uid(), texto text not null, created_at timestamptz default now());

alter table plans enable row level security; alter table profiles enable row level security;
alter table projects enable row level security; alter table prompts enable row level security; alter table eventos enable row level security;

create policy "planos visíveis" on plans for select using (true);
create policy "admin edita planos" on plans for all using (is_admin()) with check (is_admin());
create policy "ver perfil" on profiles for select using (id=auth.uid() or is_admin());
create policy "admin edita perfis" on profiles for update using (is_admin()) with check (is_admin());
create policy "meus projetos" on projects for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "meus prompts" on prompts for all using (user_id=auth.uid()) with check (user_id=auth.uid());
create policy "meus eventos" on eventos for all using (user_id=auth.uid()) with check (user_id=auth.uid());

-- admin: isento de pagamento, plano master, sempre ativo
create function admin_ativo() returns trigger language plpgsql as $$
begin if new.role='admin' then new.plan_id:='master'; new.status:='ativa'; new.vencimento:=null; end if; return new; end $$;
create trigger perfil_admin before insert or update on profiles for each row execute function admin_ativo();
