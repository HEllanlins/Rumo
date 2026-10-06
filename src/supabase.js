import { createClient } from '@supabase/supabase-js'
export const sb = createClient(import.meta.env.VITE_SUPABASE_URL || 'https://x.supabase.co', import.meta.env.VITE_SUPABASE_ANON_KEY || 'x')
export const FEATURES = { projects: 'Projetos', prompts: 'Controle de prompts', progress: 'Evolução (%)', history: 'Histórico do projeto', git: 'Integração com GitHub' }
export const brl = v => Number(v).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
