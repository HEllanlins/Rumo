import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { sb } from './supabase'
import { useApp } from './App'
import { ThemeToggle } from './theme.jsx'
import { ago } from './lib.jsx'

export default function Shell({ theme, children }) {
  const { admin } = useApp()
  const loc = useLocation()
  const [off, setOff] = useState(!navigator.onLine)
  const [items, setItems] = useState([])
  const [open, setOpen] = useState(false)
  const [inst, setInst] = useState(null)
  useEffect(() => {
    const on = () => setOff(false), no = () => setOff(true), bip = e => { e.preventDefault(); setInst(e) }
    addEventListener('online', on); addEventListener('offline', no); addEventListener('beforeinstallprompt', bip)
    return () => { removeEventListener('online', on); removeEventListener('offline', no); removeEventListener('beforeinstallprompt', bip) }
  }, [])
  useEffect(() => { setOpen(false); sb.from('atividades').select('*').order('created_at', { ascending: false }).limit(8).then(({ data }) => setItems(data || [])) }, [loc.pathname])
  const novas = items.filter(i => !i.lida).length
  const abrir = async () => { setOpen(!open); if (!open && novas) { await sb.from('atividades').update({ lida: true }).eq('lida', false); setItems(items.map(i => ({ ...i, lida: true }))) } }
  return (
    <div className="bg" style={theme.vars}>
      {off && <div className="off" role="status">Você está offline. Alguns dados podem não carregar.</div>}
      <div className="nav"><div className="c row sp"><Link to="/app"><b>Rumo</b></Link>
        <div className="row">
          <span className="row topl"><Link to="/app">Projetos</Link><Link to="/app/config">Personalizar</Link>{admin && <Link to="/restrita">Admin</Link>}</span>
          {inst && <button className="g" onClick={() => { inst.prompt(); setInst(null) }}>Instalar app</button>}
          <span className="rel"><button className="g" onClick={abrir} aria-label="Notificações" aria-expanded={open}>🔔{novas > 0 && <span className="badge">{novas}</span>}</button>
            {open && <div className="card dd">{items.length ? items.map(i => <div key={i.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--ln)' }}>{i.texto}<br /><small className="mut">{ago(i.created_at)}</small></div>) : <span className="mut">Nenhuma notificação ainda.</span>}</div>}</span>
          <ThemeToggle /><button className="g" onClick={() => sb.auth.signOut()}>Sair</button></div></div></div>
      <main key={loc.pathname} className="page">{children}</main>
      <nav className="bottom" aria-label="Navegação"><Link to="/app">Projetos</Link><Link to="/app/config">Personalizar</Link>{admin && <Link to="/restrita">Admin</Link>}</nav>
    </div>)
}
