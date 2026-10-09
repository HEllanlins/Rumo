import { useRef, useState } from 'react'
import { useApp } from '../App'
import { sb } from '../supabase'
import { PRESETS, MODES, FIELDS } from '../theme.jsx'
import { toast } from '../lib.jsx'

const HEX = /^#[0-9a-fA-F]{6}$/
function Cor({ label, value, onChange }) {
  const [t, setT] = useState(value)
  return (
    <label>{label}<span className="row" style={{ flexWrap: 'nowrap' }}>
      <input type="color" style={{ width: 56 }} value={value} onChange={e => { setT(e.target.value); onChange(e.target.value) }} aria-label={label} />
      <input value={t} maxLength={7} aria-label={label + ' em hexadecimal'} onChange={e => { setT(e.target.value); if (HEX.test(e.target.value)) onChange(e.target.value) }} /></span></label>)
}

export default function Settings() {
  const { theme, setTheme, session } = useApp()
  const ui = theme.ui || {}, vars = theme.vars || {}
  const L = { on: true, int: 0.35, size: 60, anim: false, ...(ui.lights || {}) }
  const timer = useRef()
  const apply = t => {
    setTheme(t); clearTimeout(timer.current)
    timer.current = setTimeout(async () => {
      const { error } = await sb.from('user_settings').upsert({ user_id: session.user.id, theme: t })
      toast(error ? 'Erro ao salvar: ' + error.message : 'Preferências salvas')
    }, 700)
  }
  const setVars = v => apply({ ...theme, vars: v })
  const setUi = p => apply({ ...theme, ui: { ...ui, ...p } })
  const setL = p => setUi({ lights: { ...L, ...p } })
  const root = getComputedStyle(document.documentElement)
  const cor = k => HEX.test(vars[k]) ? vars[k] : HEX.test(root.getPropertyValue(k).trim()) ? root.getPropertyValue(k).trim() : root.getPropertyValue('--ac').trim()
  const keep = { '--glass': vars['--glass'], '--r': vars['--r'] }
  const preset = n => PRESETS[n] && setVars({ ...PRESETS[n], ...keep })
  const modo = n => { const M = MODES[n]; apply({ ...theme, ui: { ...ui, ...M.ui, mode: n }, vars: { ...vars, '--glass': M.glass, '--r': M.r } }) }

  return (
    <div className="c fade">
      <h2>Configurações</h2>
      <p className="mut">Valem só para a sua conta e para a área restrita. A landing page mantém a identidade visual institucional. As alterações aparecem na hora e são salvas sozinhas.</p>
      <div className="card"><b>Modo de apresentação</b><div className="row" style={{ marginTop: 10 }}>{Object.keys(MODES).map(n => <button key={n} className={'g' + (ui.mode === n ? ' on' : '')} onClick={() => modo(n)}>{n}</button>)}</div>
        <label><input type="checkbox" checked={ui.fx !== false} onChange={e => setUi({ fx: e.target.checked })} /> Efeitos decorativos (brilho ao passar o mouse e elementos flutuantes)</label></div>
      <div className="card"><b>Combinações de cores</b><div className="row" style={{ marginTop: 10 }}>{Object.keys(PRESETS).map(n => <button key={n} className="g" onClick={() => preset(n)}>{n}</button>)}</div>
        <div className="grid" style={{ marginTop: 10 }}>{FIELDS.map(([k, l]) => <Cor key={k + cor(k)} label={l} value={cor(k)} onChange={v => setVars({ ...vars, [k]: v })} />)}</div>
        <label>Transparência dos cartões ({Math.round((vars['--glass'] ?? 0.72) * 100)}%)<input type="range" min="0.3" max="1" step="0.02" value={vars['--glass'] ?? 0.72} onChange={e => setVars({ ...vars, '--glass': +e.target.value })} /></label></div>
      <div className="card"><b>Iluminação ambiental</b>
        <label><input type="checkbox" checked={L.on} onChange={e => setL({ on: e.target.checked })} /> Ativar luzes de fundo</label>
        {L.on && <><div className="grid"><Cor label="Luz no canto superior esquerdo" value={L.tl || cor('--ac')} onChange={v => setL({ tl: v })} /><Cor label="Luz no canto superior direito" value={L.tr || cor('--ac2')} onChange={v => setL({ tr: v })} /></div>
          <label>Intensidade ({Math.round(L.int * 100)}%)<input type="range" min="0.05" max="0.8" step="0.05" value={L.int} onChange={e => setL({ int: +e.target.value })} /></label>
          <label>Extensão e dispersão ({L.size}%)<input type="range" min="30" max="100" step="5" value={L.size} onChange={e => setL({ size: +e.target.value })} /></label>
          <label><input type="checkbox" checked={L.anim} onChange={e => setL({ anim: e.target.checked })} /> Iluminação animada (respiração suave)</label></>}</div>
      <div className="card"><b>Exibição</b>
        <label>Zoom da tela ({ui.zoom || 100}%)<input type="range" min="70" max="120" step="5" value={ui.zoom || 100} onChange={e => setUi({ zoom: +e.target.value })} /></label>
        <label>Tamanho da fonte ({ui.font || 16}px)<input type="range" min="12" max="20" value={ui.font || 16} onChange={e => setUi({ font: +e.target.value })} /></label>
        <label>Projetos por linha<select value={ui.cols || 3} onChange={e => setUi({ cols: +e.target.value })}>{[1, 2, 3, 4].map(n => <option key={n}>{n}</option>)}</select></label></div>
      <button className="g" onClick={() => apply({})}>Restaurar tudo para o padrão</button>
    </div>)
}
