import { useState } from 'react'
import { useApp } from '../App'
import { sb } from '../supabase'
import { PRESETS, FIELDS } from '../theme.jsx'

export default function Settings() {
  const { theme, setTheme, session, saveUi } = useApp()
  const ui = theme.ui || {}
  const liveUi = (k, v) => setTheme({ ...theme, ui: { ...ui, [k]: v } })
  const [vars, setVars] = useState(theme.vars || {})
  const [glass, setGlass] = useState(vars['--glass'] ?? 0.72)
  const [ok, setOk] = useState('')
  const live = { ...vars, '--glass': glass }
  const save = async v => {
    const t = { ...theme, vars: v }
    const { error } = await sb.from('user_settings').upsert({ user_id: session.user.id, theme: t })
    if (!error) { setTheme(t); setOk('Salvo. Vale só para a sua conta.') } else setOk('Erro ao salvar: ' + error.message)
  }
  const pick = n => { setVars(PRESETS[n]); setGlass(0.72); setTheme({ ...theme, vars: { ...PRESETS[n], '--glass': 0.72 } }) }
  return (
    <div className="c fade">
      <h2>Configurações</h2>
      <p className="mut">Essas cores aparecem somente na sua área restrita. A landing page e o login continuam com o tema padrão.</p>
      <div className="card"><b>Temas prontos</b><div className="row" style={{ marginTop: 10 }}>{Object.keys(PRESETS).map(n => <button key={n} className="g" onClick={() => pick(n)}>{n}</button>)}</div></div>
      <div className="card"><b>Cores</b>
        <div className="grid" style={{ marginTop: 10 }}>{FIELDS.map(([k, l]) => <label key={k}>{l}<input type="color" value={live[k] || '#888888'} onChange={e => { const v = { ...vars, [k]: e.target.value }; setVars(v); setTheme({ ...theme, vars: { ...v, '--glass': glass } }) }} /></label>)}</div>
        <label>Transparência dos cards ({Math.round(glass * 100)}%)<input type="range" min="0.3" max="1" step="0.02" value={glass} onChange={e => { setGlass(+e.target.value); setTheme({ ...theme, vars: { ...vars, '--glass': +e.target.value } }) }} /></label>
        <div className="row"><button onClick={() => save(live)}>Salvar personalização</button><button className="g" onClick={() => { setVars({}); setGlass(0.72); save({}) }}>Restaurar padrão</button></div>
        {ok && <p className="mut">{ok}</p>}
      </div>
      <div className="card"><b>Exibição</b>
        <label>Zoom da tela ({ui.zoom || 100}%)<input type="range" min="70" max="120" step="5" value={ui.zoom || 100} onChange={e => liveUi('zoom', +e.target.value)} onPointerUp={e => saveUi({ zoom: +e.target.value })} onKeyUp={e => saveUi({ zoom: +e.target.value })} /></label>
        <label>Tamanho da fonte ({ui.font || 16}px)<input type="range" min="12" max="20" value={ui.font || 16} onChange={e => liveUi('font', +e.target.value)} onPointerUp={e => saveUi({ font: +e.target.value })} onKeyUp={e => saveUi({ font: +e.target.value })} /></label>
        <label>Projetos por linha<select value={ui.cols || 3} onChange={e => saveUi({ cols: +e.target.value })}>{[1, 2, 3, 4].map(n => <option key={n}>{n}</option>)}</select></label>
        <button className="g" onClick={() => saveUi({ zoom: 100, font: 16, cols: 3 })}>Restaurar exibição</button></div>
    </div>
  )
}
