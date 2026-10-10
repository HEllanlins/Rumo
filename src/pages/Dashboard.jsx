import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useApp } from '../App'
import { sb } from '../supabase'
import { Cover, ago, parseRepo, logAct } from '../lib.jsx'

const PSTATUS = ['planejamento', 'em desenvolvimento', 'em revisão', 'pausado', 'concluído', 'entregue', 'cancelado']
const vazio = { nome: '', descricao: '', url: '', repo: '', status: 'planejamento', progresso: 0, capa: '' }

export default function Dashboard() {
  const { me, plan, can, admin, theme, saveUi } = useApp()
  const cols = theme.ui?.cols || 3
  const [list, setList] = useState(null)
  const [acts, setActs] = useState([])
  const [modal, setModal] = useState(false)
  const [f, setF] = useState(vazio)
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [filtro, setFiltro] = useState(null)
  const load = async () => {
    const [a, b] = await Promise.all([sb.from('projects').select('*').order('updated_at', { ascending: false }), sb.from('atividades').select('*').order('created_at', { ascending: false }).limit(6)])
    setList(a.data || []); setActs(b.data || [])
  }
  useEffect(() => { load() }, [])
  useEffect(() => { const k = e => e.key === 'Escape' && setModal(false); addEventListener('keydown', k); return () => removeEventListener('keydown', k) }, [])
  const set = k => e => setF({ ...f, [k]: e.target.value })
  const criar = async e => {
    e.preventDefault(); setBusy(true); setErr('')
    const { data, error } = await sb.from('projects').insert({ ...f, progresso: +f.progresso, repo: parseRepo(f.repo), url: f.url || null, capa: f.capa || null }).select().single()
    setBusy(false)
    if (error) return setErr(error.message)
    logAct(data.id, 'criado', `Projeto "${data.nome}" criado`); setModal(false); setF(vazio); load()
  }
  const L = list || []
  const ativos = L.filter(p => ['planejamento', 'em desenvolvimento', 'em revisão'].includes(p.status)).length
  const conc = L.filter(p => ['concluído', 'entregue'].includes(p.status)).length
  const paus = L.filter(p => p.status === 'pausado').length
  const media = L.length ? Math.round(L.reduce((s, p) => s + p.progresso, 0) / L.length) : 0
  const vencido = p => p.prazo && new Date(p.prazo + 'T23:59:59') < new Date() && !['concluído', 'entregue', 'cancelado'].includes(p.status)
  const bate = (p, k) => (k === 'atrasado' ? vencido(p) : p.status === k)
  const vis = filtro ? L.filter(p => bate(p, filtro)) : L
  const chips = [...PSTATUS.map(s => [s, s[0].toUpperCase() + s.slice(1)]), ['atrasado', 'Atrasados']]

  return (
    <div className="c">
      <div className="row sp"><div><h2 style={{ margin: 0 }}>Olá{me.nome ? `, ${me.nome.split(' ')[0]}` : ''}</h2>
        <small className="mut">Plano {plan?.nome || 'não escolhido'} · {admin ? 'administrador' : me.status}</small></div>
        {can('projects') && <button onClick={() => setModal(true)}>+ Novo projeto</button>}</div>
      {!can('projects') ? <div className="card">Sua assinatura ainda não está ativa. <Link to="/app/assinatura">Solicite um plano</Link>: o pagamento é combinado por Pix com o administrador e os recursos são liberados após a confirmação.</div> : <>
        <div className="grid" style={{ margin: '14px 0' }}>
          {[['Ativos', ativos, L.length ? ativos / L.length * 100 : 0], ['Concluídos', conc, L.length ? conc / L.length * 100 : 0], ['Pausados', paus, L.length ? paus / L.length * 100 : 0], ['Progresso médio', media + '%', media]].map(([t, v, pct]) => (
            <div className="card kpi" key={t}><span className="mut">{t}</span><div className="stat">{list ? v : '–'}</div><div className="bar" style={{ marginTop: 10 }}><i style={{ width: pct + '%' }} /></div></div>))}
        </div>
        <div className="row" style={{ marginBottom: 14 }}>
          {chips.map(([k, l]) => <button key={k} className={'g chip' + (filtro === k ? ' on' : '')} onClick={() => setFiltro(filtro === k ? null : k)}>{l} <span className="tag">{L.filter(p => bate(p, k)).length}</span></button>)}
          <span className="row" style={{ marginLeft: 'auto' }} title="Projetos por linha">{[1, 2, 3, 4].map(n => <button key={n} className={'g' + (cols === n ? ' on' : '')} aria-label={n + ' por linha'} onClick={() => saveUi({ cols: n })}>{n}</button>)}</span>
        </div>
        {list === null && <div className="grid"><div className="sk" /><div className="sk" /><div className="sk" /></div>}
        {list && !list.length && <div className="card" style={{ textAlign: 'center', padding: 36 }}><h3>Nenhum projeto ainda</h3><p className="mut">Crie o primeiro e comece a registrar prompts, evolução e commits.</p><button onClick={() => setModal(true)}>Criar projeto</button></div>}
        {list && L.length > 0 && !vis.length && <p className="mut">Nenhum projeto neste filtro.</p>}
        <div className={'pgrid' + (cols === 1 ? ' one' : '')} style={{ '--cols': cols }}>{vis.map(p => (
          <Link to={`/app/${p.id}`} key={p.id} className="card pc fade"><Cover p={p} h={cols === 1 ? 150 : 110} />
            <div className="row sp" style={{ marginTop: 10 }}><b>{p.nome}</b><span className="tag">{p.status}</span></div>
            <p className="mut clamp">{p.descricao || 'Sem descrição ainda.'}</p>
            {cols === 1 && <p className="row">{p.prazo && <span className={'tag' + (vencido(p) ? ' bad' : '')}>prazo {new Date(p.prazo + 'T00:00').toLocaleDateString('pt-BR')}</span>}<span className="tag">prioridade {p.prioridade}</span>{p.cliente && <span className="tag">{p.cliente}</span>}{(p.tags || []).map(t => <span className="tag" key={t}>#{t}</span>)}</p>}
            {can('progress') && <><div className="bar"><i style={{ width: p.progresso + '%' }} /></div><small className="mut">{p.progresso}%</small><br /></>}
            <small className="mut">Atualizado {ago(p.updated_at)}{p.gh ? ` · ⎇ ${p.gh.sha} ${p.gh.msg}` : ''}</small></Link>))}</div>
        <h3 style={{ marginTop: 28 }}>Atividade recente</h3>
        {acts.length ? <div className="tl">{acts.map(a => <div className="tli" key={a.id}>{a.texto} <small className="mut">· {ago(a.created_at)}</small></div>)}</div> : <p className="mut">Nada por aqui ainda. As atualizações dos seus projetos aparecem nesta linha do tempo.</p>}
      </>}
      {modal && <div className="ov" onClick={() => setModal(false)}><form className="card" role="dialog" aria-modal="true" aria-label="Novo projeto" onClick={e => e.stopPropagation()} onSubmit={criar}>
        <h3 style={{ marginTop: 0 }}>Novo projeto</h3>
        <label>Nome<input required autoFocus value={f.nome} onChange={set('nome')} /></label>
        <label>Descrição<textarea rows={2} value={f.descricao} onChange={set('descricao')} /></label>
        <label>URL do projeto (opcional)<input type="url" placeholder="https://" value={f.url} onChange={set('url')} /></label>
        <label>Repositório GitHub (opcional)<input placeholder="https://github.com/usuario/projeto" value={f.repo} onChange={set('repo')} /></label>
        <div className="grid"><label>Status inicial<select value={f.status} onChange={set('status')}>{PSTATUS.map(s => <option key={s}>{s}</option>)}</select></label>
          <label>Progresso inicial ({f.progresso}%)<input type="range" min="0" max="100" value={f.progresso} onChange={set('progresso')} /></label></div>
        <label>Imagem de capa (link, opcional; sem link o sistema gera uma capa)<input type="url" value={f.capa} onChange={set('capa')} /></label>
        {err && <p role="alert" className="tag bad">{err}</p>}
        <div className="row"><button disabled={busy}>{busy ? 'Criando…' : 'Criar projeto'}</button><button type="button" className="g" onClick={() => setModal(false)}>Cancelar</button></div>
      </form></div>}
    </div>)
}
