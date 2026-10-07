// Health check + keep-alive. Chamado pelo Cron da Vercel (vercel.json), sem depender de ninguém com o site aberto.
export default async function handler(req, res) {
  const url = process.env.VITE_SUPABASE_URL, key = process.env.VITE_SUPABASE_ANON_KEY
  const t = async f => { const s = Date.now(); try { const r = await f(); return { ok: r.ok, ms: Date.now() - s } } catch { return { ok: false, ms: Date.now() - s } } }
  const [db, github] = await Promise.all([
    t(() => fetch(`${url}/rest/v1/plans?select=id&limit=1`, { headers: { apikey: key } })),
    t(() => fetch('https://api.github.com/rate_limit'))])
  res.setHeader('Cache-Control', 'no-store')
  res.status(db.ok ? 200 : 503).json({ ok: db.ok, db, github, at: new Date().toISOString() })
}
