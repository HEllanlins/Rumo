import { useState } from 'react'
import { useApp } from '../App'
import { sb } from '../supabase'
import { PRESETS, FIELDS } from '../theme.jsx'

export default function Settings() {
  const { theme, setTheme, session } = useApp()
  const [vars, setVars] = useState(theme.vars || {})
  const [glass, setGlass] = useState(vars['--glass'] ?? 0.72)
  const [ok, setOk] = useState('')
  const live = { ...vars, '--glass': glass }
  const save = async v => {
    const t = { vars: v }
    const { error } = await sb.from('user_settings').upsert({ user_id: session.user.id, theme: t })
    if (!error) { setTheme(t); setOk('Salvo. Vale só para a sua conta.') } else setOk('Erro ao salvar: ' + error.message)
  }
  const pick = n => { setVars(PRESETS[n]); setGlass(0.72); setTheme({ vars: { ...PRESETS[n], '--glass': 0.72 } }) }
  return (
    <div className="c fade">
      <h2>Personalização da plataforma</h2>
      <p className="mut">Essas cores aparecem somente na sua área restrita. A landing page e o login continuam com o tema padrão.</p>
      <div className="card"><b>Temas prontos</b><div className="row" style={{ marginTop: 10 }}>{Object.keys(PRESETS).map(n => <button key={n} className="g" onClick={() => pick(n)}>{n}</button>)}</div></div>
      <div className="card"><b>Cores</b>
        <div className="grid" style={{ marginTop: 10 }}>{FIELDS.map(([k, l]) => <label key={k}>{l}<input type="color" value={live[k] || '#888888'} onChange={e => { const v = { ...vars, [k]: e.target.value }; setVars(v); setTheme({ vars: { ...v, '--glass': glass } }) }} /></label>)}</div>
        <label>Transparência dos cards ({Math.round(glass * 100)}%)<input type="range" min="0.3" max="1" step="0.02" value={glass} onChange={e => { setGlass(+e.target.value); setTheme({ vars: { ...vars, '--glass': +e.target.value } }) }} /></label>
        <div className="row"><button onClick={() => save(live)}>Salvar personalização</button><button className="g" onClick={() => { setVars({}); setGlass(0.72); save({}) }}>Restaurar padrão</button></div>
        {ok && <p className="mut">{ok}</p>}
      </div>
    </div>
  )
}
