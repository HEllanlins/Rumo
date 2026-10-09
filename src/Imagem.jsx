import { useState } from 'react'
import { subir } from './lib.jsx'

export default function ImgPicker({ pasta, onChange, children }) {
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState('')
  const [u, setU] = useState('')
  const file = async e => {
    const f = e.target.files[0]; if (!f) return
    setBusy(true); setMsg('')
    try { onChange(await subir(f, pasta)); setMsg('Imagem enviada.') } catch (x) { setMsg(x.message || 'Erro ao enviar.') }
    setBusy(false); e.target.value = ''
  }
  return (
    <div>
      <label>Enviar do computador (PNG, JPG, WebP ou GIF, até 5 MB)<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={file} disabled={busy} /></label>
      <div className="row"><input style={{ flex: 1 }} placeholder="ou cole o link de uma imagem (https://...)" value={u} onChange={e => setU(e.target.value)} />
        <button className="g" disabled={!/^https?:\/\//.test(u)} onClick={() => { onChange(u); setU('') }}>Usar link</button></div>
      <div className="row" style={{ marginTop: 8 }}>{children}</div>
      {busy && <small className="mut">Enviando…</small>}{msg && <small className="mut"> {msg}</small>}
    </div>)
}
