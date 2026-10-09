# Rumo — passo a passo

## Atualização 5 (fase 4)
1. Supabase → SQL Editor → New query → cole `supabase/migracao-5.sql` → Run (rode antes as migrações 2, 3 e 4, se ainda não rodou).
2. Substitua os arquivos do repositório pelos desta pasta e faça commit.
3. Configurações (engrenagem ⚙): modos de apresentação, combinações de cores com hexadecimal, iluminação ambiental, zoom e fonte.
4. Área restrita: abas Visão geral, Usuários, Planos, Textos, Imagens, Analytics e Auditoria.


## Atualização 4 (fase 3)
1. Supabase → SQL Editor → New query → cole `supabase/migracao-4.sql` → Run (cria o armazenamento de imagens e a tabela de configuração da landing).
2. Substitua os arquivos do repositório pelos desta pasta e faça commit.
3. Imagens da landing: entre como admin → Área restrita → "Imagens da landing page".
4. Capa do projeto: abra o projeto → bloco da capa (enviar do computador, link, capturar da URL ou capa gerada).
5. Zoom, fonte e projetos por linha: engrenagem ⚙ no topo.


## Atualização 3 (fase 2)
1. Supabase → SQL Editor → New query → cole `supabase/migracao-3.sql` → Run (rode antes a migracao-2.sql, se ainda não rodou).
2. Substitua os arquivos do repositório pelos desta pasta, faça commit. A Vercel publica sozinha e cria o agendamento (Cron) definido em `vercel.json`.
3. Confira: abra `https://SEU-SITE.vercel.app/api/health`. Deve aparecer `"ok":true`. Esse endereço roda sozinho a cada 2 dias e faz uma leitura leve no banco, o que evita a pausa por inatividade do plano grátis do Supabase.
4. Para instalar: Android/Chrome → botão "Instalar app" ou menu → Instalar. iPhone/Safari → Compartilhar → Adicionar à Tela de Início.


## Atualização 2 (se você já fez o deploy da versão 1)
1. Supabase → SQL Editor → New query → cole `supabase/migracao-2.sql` → Run.
2. Login com Google: Supabase → Authentication → Providers → Google → ative e cole o Client ID e o Secret criados no Google Cloud Console (OAuth, tipo Web). Em Authentication → URL Configuration, coloque o endereço do seu site da Vercel em Site URL e em Redirect URLs (com /app e /redefinir no final).
3. Substitua os arquivos do repositório pelos desta pasta, faça commit e a Vercel publica sozinha.

## Primeira instalação

1. Supabase (supabase.com) → New project. Depois: SQL Editor → New query → cole TODO o conteúdo de `supabase/schema.sql` → Run.
2. Supabase → Project Settings → API: copie "Project URL" e "anon public key".
3. (Opcional, para testar rápido) Authentication → Providers → Email → desligue "Confirm email".
4. GitHub: crie um repositório novo e suba todos os arquivos desta pasta (sem node_modules).
5. Vercel → Add New → Project → importe o repositório. Framework: Vite. Em Environment Variables crie:
   - VITE_SUPABASE_URL = (Project URL)
   - VITE_SUPABASE_ANON_KEY = (anon public key)
   Deploy.
6. Abra o site → Acesso → Criar conta com hellan.lins@gmail.com. Esse e-mail vira administrador (plano master, ativo, sem pagar).
7. Em "Área restrita" (rodapé da landing ou botão no painel) defina preços e recursos de cada plano.
8. No celular: abra o site no Chrome → menu → "Instalar app".
Rodar local: copie `.env.example` para `.env`, preencha, `npm install` e `npm run dev`.
