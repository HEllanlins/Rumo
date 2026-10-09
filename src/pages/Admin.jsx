import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../App'
import { sb, FEATURES } from '../supabase'
import ImgPicker from '../Imagem.jsx'

export default function Admin() {
  const { plans, reload, site } = useApp()
  const setImg = async (k, v) => { if (v) await sb.from('site_config').upsert({ key: k, value: v }); else await sb.from('site_config').delete().eq('key', k); reload() }
  const [users, setUsers] = useState([])
  const load = async () => { const { data } = await sb.from('profiles').select('*').order('created_at', { ascending: false }); setUsers(data || []) }
  useEffect(() => { load() }, [])
  const setU = async (id, patch) => { await sb.from('profiles').update(patch).eq('id', id); load() }
  const setPlan = async (id, patch) => { await sb.from('plans').update(patch).eq('id', id); reload() }
  const toggle = (p, f) => setPlan(p.id, { features: p.features.includes(f) ? p.features.filter(x => x !== f) : [...p.features, f] })
  const aviso = u => `mailto:${u.email}?subject=${encodeURIComponent('Sua assinatura está para vencer')}&body=${encodeURIComponent('Olá! Sua assinatura vence em ' + (u.vencimento || 'breve') + '. Regularize para manter o acesso.')}`
  const atrasado = u => u.vencimento && new Date(u.vencimento) < new Date() && u.role !== 'admin'

  return (
    <div className="c">
      <Link to="/app">← Voltar</Link>
      <h1 style={{ fontSize: '2rem' }}>Área restrita</h1>
      <h3>Imagens da landing page</h3>
      <div className="grid">{[['img1', 'Gerenciamento de projetos'], ['img2', 'Gráficos e progresso'], ['img3', 'Atividade do GitHub']].map(([k, t]) => (
        <div className="card" key={k}><b>{t}</b>{site[k] && <img src={site[k]} alt="" className="shot" style={{ marginTop: 8 }} />}
          <ImgPicker pasta="site" onChange={url => setImg(k, url)}><button className="g" onClick={() => setImg(k, null)}>Voltar à imagem padrão</button></ImgPicker></div>))}</div>
      <h3>Planos</h3>
      <div className="grid">{plans.map(p => (
        <div className="card" key={p.id}><b>{p.nome}</b>
          <label>Valor mensal (R$)<input type="number" step="0.01" defaultValue={p.preco} onBlur={e => setPlan(p.id, { preco: +e.target.value })} /></label>
          {Object.entries(FEATURES).map(([f, l]) => <label key={f}><input type="checkbox" checked={p.features.includes(f)} onChange={() => toggle(p, f)} /> {l}</label>)}
        </div>))}</div>
      <h3>Usuários e assinaturas</h3>
      <div style={{ overflowX: 'auto' }}><table>
        <thead><tr><th>E-mail</th><th>Plano</th><th>Status</th><th>Vencimento</th><th></th></tr></thead>
        <tbody>{users.map(u => (
          <tr key={u.id}>
            <td>{u.email}{u.role === 'admin' && <span className="tag ok"> admin</span>}</td>
            <td><select value={u.plan_id || ''} onChange={e => setU(u.id, { plan_id: e.target.value || null })}><option value="">—</option>{plans.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}</select></td>
            <td><select value={u.status} onChange={e => setU(u.id, { status: e.target.value })}>{['pendente', 'ativa', 'atrasada', 'cancelada'].map(s => <option key={s}>{s}</option>)}</select></td>
            <td><input type="date" value={u.vencimento || ''} onChange={e => setU(u.id, { vencimento: e.target.value || null })} /></td>
            <td>{u.role !== 'admin' && <a href={aviso(u)} className={atrasado(u) ? 'tag bad' : 'tag'}>Avisar por e-mail</a>}</td>
          </tr>))}</tbody></table></div>
    </div>
  )
}
