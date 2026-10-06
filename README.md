# Rumo — passo a passo

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
