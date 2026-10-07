import { createContext, useContext, useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { sb } from './supabase'
import Landing from './pages/Landing'
import Auth from './pages/Auth'
import Dashboard from './pages/Dashboard'
import Project from './pages/Project'
import Admin from './pages/Admin'
import Settings from './pages/Settings'
import Shell from './Shell'
import { Reset } from './pages/Auth'
import { ThemeToggle } from './theme.jsx'

export const Ctx = createContext()
export const useApp = () => useContext(Ctx)

export default function App() {
  const [session, setSession] = useState(undefined)
  const [me, setMe] = useState(null)
  const [plans, setPlans] = useState([])
  const [theme, setTheme] = useState({})

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => setSession(data.session))
    const { data } = sb.auth.onAuthStateChange((_e, s) => setSession(s))
    return () => data.subscription.unsubscribe()
  }, [])

  const load = async () => {
    const { data: p } = await sb.from('plans').select('*').order('ordem')
    setPlans(p || [])
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
  const priv = el => (session ? <Shell theme={theme}>{el}</Shell> : <Navigate to="/entrar" />)

  return (
    <Ctx.Provider value={{ theme, setTheme, session, me, plans, plan, can, admin, reload: load }}>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/entrar" element={session ? <Navigate to="/app" /> : <Auth />} />
          <Route path="/app" element={priv(<Dashboard />)} />
          <Route path="/app/:id" element={priv(<Project />)} />
          <Route path="/app/config" element={priv(<Settings />)} />
          <Route path="/redefinir" element={<Reset />} />
          <Route path="/restrita" element={priv(admin ? <Admin /> : <Navigate to="/" />)} />
        </Routes>
      </BrowserRouter>
    </Ctx.Provider>
  )
}
