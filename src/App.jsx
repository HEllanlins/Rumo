import { createContext, useContext, useEffect, useState, lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { sb } from './supabase'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
const Project = lazy(() => import('./pages/Project'))
const Admin = lazy(() => import('./pages/Admin'))
const Settings = lazy(() => import('./pages/Settings'))
import Shell from './Shell'
import { Reset } from './pages/Auth'
import { ThemeToggle } from './theme.jsx'

function Track() {
  const loc = useLocation()
  useEffect(() => {
    if (navigator.doNotTrack === '1' || loc.pathname.startsWith('/restrita')) return
    let sid = sessionStorage.getItem('sid'); if (!sid) { sid = crypto.randomUUID(); sessionStorage.setItem('sid', sid) }
    let ref = ''; try { ref = document.referrer ? new URL(document.referrer).hostname : '' } catch {}
    sb.from('pageviews').insert({ path: loc.pathname.replace(/^\/app\/(?!config).+/, '/app/projeto'), ref: ref && ref !== location.hostname ? ref : null,
      device: matchMedia('(max-width:700px)').matches ? 'celular' : matchMedia('(max-width:1100px)').matches ? 'tablet' : 'desktop', sid })
  }, [loc.pathname])
  return null
}
export const Ctx = createContext()
export const useApp = () => useContext(Ctx)

export default function App() {
  const [session, setSession] = useState(undefined)
  const [me, setMe] = useState(null)
  const [plans, setPlans] = useState([])
  const [theme, setTheme] = useState({})
  const [site, setSite] = useState({})

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const load = async () => {
    const { data: p } = await sb.from('plans').select('*').order('ordem')
    setPlans(p || [])
    const { data: sc } = await sb.from('site_config').select('*')
    setSite(Object.fromEntries((sc || []).map(r => [r.key, r.value])))
    if (session) {
      const { data } = await sb.from('profiles').select('*').eq('id', session.user.id).single()
      setMe(data)
      const { data: s } = await sb.from('user_settings').select('theme').maybeSingle()
      setTheme(s?.theme || {})
    } else { setMe(null); setTheme({}) }
  }
  useEffect(() => { if (session !== undefined) load() }, [session])

  if (session === undefined || (session && !me)) return <p className="c">Carregando…</p>
  const plan = plans.find(p => p.id === me?.plan_id)
  const admin = me?.role === 'admin'
  const can = f => admin || (me?.status === 'ativa' && !!plan?.features.includes(f))
  const saveUi = async patch => {
    const t = { ...theme, ui: { ...(theme.ui || {}), ...patch } }
    setTheme(t); await sb.from('user_settings').upsert({ user_id: session.user.id, theme: t })
  }
  const priv = el => (session ? <Shell theme={theme}>{el}</Shell> : <Navigate to="/entrar" />)

  return (
    <Ctx.Provider value={{ saveUi, site, theme, setTheme, session, me, plans, plan, can, admin, reload: load }}>
      <BrowserRouter>
        <Track />
        <Suspense fallback={<p className="c">Carregando…</p>}>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/entrar" element={session ? <Navigate to="/app" /> : <Auth />} />
          <Route path="/app" element={priv(<Dashboard />)} />
          <Route path="/app/:id" element={priv(<Project />)} />
          <Route path="/app/config" element={priv(<Settings />)} />
          <Route path="/redefinir" element={<Reset />} />
          <Route path="/restrita" element={priv(admin ? <Admin /> : <Navigate to="/" />)} />
        </Routes>
        </Suspense>
      </BrowserRouter>
    </Ctx.Provider>
  )
}
