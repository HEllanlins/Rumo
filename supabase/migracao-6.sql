-- Rode DEPOIS da migracao-5.sql. Só acrescenta; não apaga dados.
alter table plans add column if not exists descricao text;
alter table plans add column if not exists periodicidade text not null default 'mensal';

-- ===== Assinaturas por Pix manual =====
create table if not exists solicitacoes (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references profiles(id) on delete cascade,
 plan_id text not null references plans(id), preco numeric not null, periodicidade text not null default 'mensal',
 estado text not null default 'pendente' check (estado in ('pendente','contato','aguardando_pagamento','pagamento_confirmado','ativa','recusada','cancelada')),
 created_at timestamptz default now(), updated_at timestamptz default now());
create unique index if not exists solicitacao_aberta_unica on solicitacoes(user_id) where estado in ('pendente','contato','aguardando_pagamento','pagamento_confirmado');
create table if not exists solicitacao_eventos (id bigserial primary key, solicitacao_id uuid not null references solicitacoes on delete cascade, de text, para text not null, autor uuid default auth.uid(), created_at timestamptz default now());
create table if not exists solicitacao_notas (id bigserial primary key, solicitacao_id uuid not null references solicitacoes on delete cascade, nota text not null, autor uuid default auth.uid(), created_at timestamptz default now());
create table if not exists notificacoes_admin (id bigserial primary key, solicitacao_id uuid references solicitacoes on delete cascade, texto text not null, lida boolean not null default false, created_at timestamptz default now());
alter table solicitacoes enable row level security; alter table solicitacao_eventos enable row level security; alter table solicitacao_notas enable row level security; alter table notificacoes_admin enable row level security;
create policy "ver solicitações" on solicitacoes for select using (user_id = auth.uid() or is_admin());
create policy "ver eventos" on solicitacao_eventos for select using (exists (select 1 from solicitacoes s where s.id = solicitacao_id and (s.user_id = auth.uid() or is_admin())));
create policy "admin notas" on solicitacao_notas for all using (is_admin()) with check (is_admin());
create policy "admin notificações ler" on notificacoes_admin for select using (is_admin());
create policy "admin notificações marcar" on notificacoes_admin for update using (is_admin()) with check (is_admin());
-- sem política de insert/update em solicitacoes: só as funções abaixo alteram o estado

create or replace function solicitar_assinatura(p_plan text) returns uuid language plpgsql security definer set search_path=public as $$
declare pl plans; pr profiles; sid uuid;
begin
  if auth.uid() is null then raise exception 'não autenticado'; end if;
  select * into pl from plans where id = p_plan; if not found then raise exception 'plano inválido'; end if;
  select * into pr from profiles where id = auth.uid();
  if exists (select 1 from solicitacoes where user_id = auth.uid() and estado in ('pendente','contato','aguardando_pagamento','pagamento_confirmado')) then raise exception 'solicitação aberta já existe'; end if;
  insert into solicitacoes(user_id, plan_id, preco, periodicidade) values (auth.uid(), pl.id, pl.preco, pl.periodicidade) returning id into sid;
  insert into solicitacao_eventos(solicitacao_id, de, para) values (sid, null, 'pendente');
  insert into notificacoes_admin(solicitacao_id, texto) values (sid, 'Nova solicitação de '||coalesce(pr.nome, pr.email)||' ('||pr.email||'): plano '||pl.nome||' a R$ '||to_char(pl.preco,'FM999990.00')||'/'||pl.periodicidade);
  insert into atividades(user_id, tipo, texto) values (auth.uid(), 'assinatura', 'Solicitação do plano '||pl.nome||' registrada. O administrador entrará em contato por e-mail.');
  return sid;
end $$;

create or replace function atualizar_solicitacao(p_id uuid, p_estado text, p_nota text default null) returns void language plpgsql security definer set search_path=public as $$
declare s solicitacoes; ok boolean; em text;
begin
  if not is_admin() then raise exception 'acesso negado'; end if;
  select * into s from solicitacoes where id = p_id for update; if not found then raise exception 'solicitação não encontrada'; end if;
  ok := case s.estado
    when 'pendente' then p_estado in ('contato','aguardando_pagamento','recusada','cancelada')
    when 'contato' then p_estado in ('aguardando_pagamento','recusada','cancelada')
    when 'aguardando_pagamento' then p_estado in ('pagamento_confirmado','recusada','cancelada')
    when 'pagamento_confirmado' then p_estado in ('ativa','cancelada')
    else false end;
  if not ok then raise exception 'transição não permitida: % → %', s.estado, p_estado; end if;
  update solicitacoes set estado = p_estado, updated_at = now() where id = p_id;
  insert into solicitacao_eventos(solicitacao_id, de, para) values (p_id, s.estado, p_estado);
  if p_nota is not null and length(trim(p_nota)) > 0 then insert into solicitacao_notas(solicitacao_id, nota) values (p_id, trim(p_nota)); end if;
  if p_estado = 'ativa' then update profiles set plan_id = s.plan_id, status = 'ativa', vencimento = (current_date + interval '1 month')::date where id = s.user_id; end if;
  select email into em from profiles where id = s.user_id;
  insert into audit_log(admin_id, acao, alvo) values (auth.uid(), 'solicitação '||s.estado||' → '||p_estado, em);
  insert into atividades(user_id, tipo, texto) values (s.user_id, 'assinatura', 'Sua solicitação de assinatura mudou para: '||p_estado);
end $$;

create or replace function cancelar_minha_solicitacao(p_id uuid) returns void language plpgsql security definer set search_path=public as $$
declare s solicitacoes;
begin
  select * into s from solicitacoes where id = p_id and user_id = auth.uid() for update; if not found then raise exception 'solicitação não encontrada'; end if;
  if s.estado not in ('pendente','contato','aguardando_pagamento') then raise exception 'não é possível cancelar neste estado'; end if;
  update solicitacoes set estado = 'cancelada', updated_at = now() where id = p_id;
  insert into solicitacao_eventos(solicitacao_id, de, para) values (p_id, s.estado, 'cancelada');
  insert into notificacoes_admin(solicitacao_id, texto) values (p_id, 'Solicitação cancelada pelo cliente: '||(select email from profiles where id = auth.uid()));
end $$;
revoke execute on function solicitar_assinatura(text), atualizar_solicitacao(uuid,text,text), cancelar_minha_solicitacao(uuid) from public, anon;
grant execute on function solicitar_assinatura(text), atualizar_solicitacao(uuid,text,text), cancelar_minha_solicitacao(uuid) to authenticated;

create or replace function admin_stats() returns json language plpgsql security definer set search_path=public stable as $$
begin
  if not is_admin() then raise exception 'acesso negado'; end if;
  return json_build_object('usuarios',(select count(*) from profiles),'ativos',(select count(*) from profiles where status='ativa'),
    'pendentes',(select count(*) from profiles where status='pendente'),'novos7d',(select count(*) from profiles where created_at > now() - interval '7 days'),
    'projetos',(select count(*) from projects),'prompts',(select count(*) from prompts),
    'solicitacoes_abertas',(select count(*) from solicitacoes where estado in ('pendente','contato','aguardando_pagamento','pagamento_confirmado')),
    'por_plano',(select coalesce(json_object_agg(p, n),'{}'::json) from (select coalesce(plan_id,'sem plano') p, count(*) n from profiles group by 1) t));
end $$;

-- ===== Biblioteca global de prompts =====
create table if not exists categorias (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade, nome text not null, unique (user_id, nome));
create table if not exists etiquetas (id uuid primary key default gen_random_uuid(), user_id uuid not null default auth.uid() references auth.users on delete cascade, nome text not null, unique (user_id, nome));
alter table prompts alter column project_id drop not null;
alter table prompts add column if not exists descricao text;
alter table prompts add column if not exists categoria_id uuid references categorias on delete set null;
alter table prompts add column if not exists updated_at timestamptz;
update prompts set updated_at = created_at where updated_at is null;
alter table prompts alter column updated_at set default now();
create table if not exists prompt_etiquetas (prompt_id uuid references prompts on delete cascade, etiqueta_id uuid references etiquetas on delete cascade, primary key (prompt_id, etiqueta_id));
alter table categorias enable row level security; alter table etiquetas enable row level security; alter table prompt_etiquetas enable row level security;
create policy "minhas categorias" on categorias for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "minhas etiquetas" on etiquetas for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "minhas etiquetas de prompts" on prompt_etiquetas for all
  using (exists (select 1 from prompts p where p.id = prompt_id and p.user_id = auth.uid()) and exists (select 1 from etiquetas e where e.id = etiqueta_id and e.user_id = auth.uid()))
  with check (exists (select 1 from prompts p where p.id = prompt_id and p.user_id = auth.uid()) and exists (select 1 from etiquetas e where e.id = etiqueta_id and e.user_id = auth.uid()));
create index if not exists prompts_user_upd on prompts(user_id, updated_at desc);
create or replace function touch_prompt() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end $$;
drop trigger if exists prompts_touch on prompts;
create trigger prompts_touch before update on prompts for each row execute function touch_prompt();
